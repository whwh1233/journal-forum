/**
 * 帖子标签/分类迁移脚本
 *
 * 将旧的 category 字符串枚举 + tags JSON 数组迁移到
 * 新的 PostCategory / Tag / PostTagMap 关联表结构。
 *
 * 用法:
 *   node scripts/migratePostTagCategory.js            # 执行迁移
 *   node scripts/migratePostTagCategory.js --dry-run   # 仅预览，不执行变更
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const {
  sequelize,
  Post,
  PostCategory,
  Tag,
  PostTagMap,
  SystemConfig,
  syncDatabase
} = require('../models');

// ---------------------------------------------------------------------------
// 配置
// ---------------------------------------------------------------------------

const DRY_RUN = process.argv.includes('--dry-run');

const CATEGORY_MAP = {
  experience: '投稿经验',
  discussion: '学术讨论',
  question: '求助问答',
  news: '资讯分享',
  review: '文献评述',
  other: '其他'
};

const CATEGORY_DESCRIPTIONS = {
  experience: '分享投稿、审稿等经验心得',
  discussion: '学术话题交流与探讨',
  question: '提问寻求帮助与解答',
  news: '学术资讯与新闻分享',
  review: '文献阅读笔记与评述',
  other: '其他话题'
};

// ---------------------------------------------------------------------------
// 辅助
// ---------------------------------------------------------------------------

const stats = {
  categoriesCreated: 0,
  postsProcessed: 0,
  categoryMappings: 0,
  tagsCreated: 0,
  tagMappingsCreated: 0,
  tagsSkipped: 0
};

function log(msg) {
  const prefix = DRY_RUN ? '[DRY-RUN] ' : '';
  console.log(`${prefix}${msg}`);
}

// ---------------------------------------------------------------------------
// 步骤 1 - 同步数据库
// ---------------------------------------------------------------------------

async function syncDB() {
  log('Step 1: Syncing new tables (alter: true) ...');
  if (!DRY_RUN) {
    // 仅同步本次新增的 4 张表，避免触发已有表的外键约束问题
    await PostCategory.sync({ alter: true });
    await Tag.sync({ alter: true });
    await PostTagMap.sync({ alter: true });
    await SystemConfig.sync({ alter: true });
    // 同步 Post 表的新 category_id 列
    await Post.sync({ alter: true });
  }
  log('  Done.');
}

// ---------------------------------------------------------------------------
// 步骤 2 - 插入 SystemConfig 默认值
// ---------------------------------------------------------------------------

async function insertSystemConfig() {
  log('Step 2: Inserting SystemConfig default (maxTagsPerPost = 5) ...');
  if (!DRY_RUN) {
    await SystemConfig.setValue('maxTagsPerPost', '5', '每篇帖子最多可添加的标签数');
  }
  log('  Done.');
}

// ---------------------------------------------------------------------------
// 步骤 3 - 创建 PostCategory 记录
// ---------------------------------------------------------------------------

async function createCategories() {
  log('Step 3: Creating PostCategory records ...');
  const slugs = Object.keys(CATEGORY_MAP);
  const categoryLookup = {};

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const name = CATEGORY_MAP[slug];
    const description = CATEGORY_DESCRIPTIONS[slug];

    if (DRY_RUN) {
      log(`  Would create category: ${slug} -> ${name}`);
      categoryLookup[slug] = { id: i + 1 }; // placeholder
      stats.categoriesCreated++;
    } else {
      const [cat, created] = await PostCategory.findOrCreate({
        where: { slug },
        defaults: {
          name,
          slug,
          description,
          sortOrder: i,
          isActive: true
        }
      });
      categoryLookup[slug] = cat;
      if (created) stats.categoriesCreated++;
      log(`  ${created ? 'Created' : 'Exists'}: ${slug} (id=${cat.id})`);
    }
  }

  return categoryLookup;
}

// ---------------------------------------------------------------------------
// 步骤 4 - 迁移帖子数据
// ---------------------------------------------------------------------------

async function migratePosts(categoryLookup) {
  log('Step 4: Migrating posts ...');
  const posts = await Post.findAll({
    attributes: ['id', 'userId', 'category', 'tags'],
    raw: true
  });

  log(`  Found ${posts.length} posts to process.`);

  for (const post of posts) {
    stats.postsProcessed++;

    // 4a - Map category string to categoryId
    if (post.category && CATEGORY_MAP[post.category]) {
      const cat = categoryLookup[post.category];
      const categoryId = DRY_RUN ? (cat.id || '?') : cat.id;

      if (DRY_RUN) {
        log(`  Post #${post.id}: category "${post.category}" -> categoryId ${categoryId}`);
      } else {
        await Post.update(
          { categoryId: cat.id },
          { where: { id: post.id } }
        );
      }
      stats.categoryMappings++;
    }

    // 4b - Parse and migrate tags
    let tags = [];
    try {
      tags = typeof post.tags === 'string' ? JSON.parse(post.tags) : (post.tags || []);
    } catch {
      tags = [];
    }

    if (!Array.isArray(tags)) tags = [];

    for (const rawTag of tags) {
      if (typeof rawTag !== 'string') continue;

      const normalized = rawTag.toLowerCase().trim();
      if (!normalized || normalized.length > 10) {
        stats.tagsSkipped++;
        if (DRY_RUN) {
          log(`  Post #${post.id}: skip tag "${rawTag}" (empty or >10 chars)`);
        }
        continue;
      }

      if (DRY_RUN) {
        log(`  Post #${post.id}: would create/find tag "${normalized}" and map it`);
        stats.tagsCreated++;
        stats.tagMappingsCreated++;
      } else {
        const [tag, tagCreated] = await Tag.findOrCreate({
          where: { normalizedName: normalized },
          defaults: {
            name: rawTag.trim().substring(0, 10),
            normalizedName: normalized,
            status: 'approved',
            isOfficial: false,
            createdBy: post.userId
          }
        });

        if (tagCreated) stats.tagsCreated++;

        const [, mapCreated] = await PostTagMap.findOrCreate({
          where: { postId: post.id, tagId: tag.id },
          defaults: { postId: post.id, tagId: tag.id }
        });

        if (mapCreated) stats.tagMappingsCreated++;
      }
    }
  }

  log('  Done.');
}

// ---------------------------------------------------------------------------
// 步骤 5 - 更新 PostCategory.postCount
// ---------------------------------------------------------------------------

async function updateCategoryPostCounts() {
  log('Step 5: Updating PostCategory postCount ...');

  if (DRY_RUN) {
    log('  Would update post counts for all categories.');
    return;
  }

  const categories = await PostCategory.findAll();
  for (const cat of categories) {
    const count = await Post.count({
      where: {
        categoryId: cat.id,
        status: 'published',
        isDeleted: false
      }
    });
    await cat.update({ postCount: count });
    log(`  Category "${cat.slug}": postCount = ${count}`);
  }
  log('  Done.');
}

// ---------------------------------------------------------------------------
// 步骤 6 - 更新 Tag.postCount
// ---------------------------------------------------------------------------

async function updateTagPostCounts() {
  log('Step 6: Updating Tag postCount ...');

  if (DRY_RUN) {
    log('  Would update post counts for all tags.');
    return;
  }

  await sequelize.query(`
    UPDATE online_tags t
    SET t.post_count = (
      SELECT COUNT(DISTINCT ptm.post_id)
      FROM online_post_tag_map ptm
      INNER JOIN online_posts p ON p.id = ptm.post_id
      WHERE ptm.tag_id = t.id
        AND p.status = 'published'
        AND p.is_deleted = 0
    )
  `);

  log('  Done.');
}

// ---------------------------------------------------------------------------
// 步骤 7 - 验证汇总
// ---------------------------------------------------------------------------

async function printSummary() {
  console.log('\n========== Migration Summary ==========');
  console.log(`Mode:                  ${DRY_RUN ? 'DRY RUN (no changes made)' : 'LIVE'}`);
  console.log(`Categories created:    ${stats.categoriesCreated}`);
  console.log(`Posts processed:       ${stats.postsProcessed}`);
  console.log(`Category mappings:     ${stats.categoryMappings}`);
  console.log(`Tags created:          ${stats.tagsCreated}`);
  console.log(`Tag mappings created:  ${stats.tagMappingsCreated}`);
  console.log(`Tags skipped:          ${stats.tagsSkipped}`);

  if (!DRY_RUN) {
    const catCount = await PostCategory.count();
    const tagCount = await Tag.count();
    const mapCount = await PostTagMap.count();
    const postsWithCategory = await Post.count({ where: { categoryId: { [require('sequelize').Op.ne]: null } } });

    console.log('\n--- Database verification ---');
    console.log(`PostCategory records:  ${catCount}`);
    console.log(`Tag records:           ${tagCount}`);
    console.log(`PostTagMap records:    ${mapCount}`);
    console.log(`Posts with categoryId: ${postsWithCategory}`);
  }

  console.log('========================================\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Post Tag/Category Migration ===\n');

  if (DRY_RUN) {
    console.log('*** DRY RUN MODE - No database changes will be made ***\n');
  }

  try {
    await sequelize.authenticate();
    log('Database connection established.');

    await syncDB();
    await insertSystemConfig();
    const categoryLookup = await createCategories();
    await migratePosts(categoryLookup);
    await updateCategoryPostCounts();
    await updateTagPostCounts();
    await printSummary();

    log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
