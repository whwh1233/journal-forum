# 帖子标签与分类系统 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将帖子分类从硬编码枚举改为数据库驱动，将自由文本标签升级为可管理、可审核、可合并的标签系统。

**Architecture:** 新增 4 个 Sequelize 模型（PostCategory, Tag, PostTagMap, SystemConfig），通过 PostTagMap 多对多关联帖子与标签。后端新增 tag 和 postCategory 的公开/管理员路由，修改现有 postController 适配新结构。前端新增 TagInput 组件和管理后台面板，改造 PostForm/PostCard/CommunityPage 使用动态数据。

**Tech Stack:** Node.js/Express, Sequelize ORM, MySQL 8.0, React 18/TypeScript, CSS Variables

**Spec:** `docs/superpowers/specs/2026-03-14-post-tag-category-design.md`

---

## Chunk 1: 后端模型与数据库层

### Task 1: PostCategory 模型

**Files:**
- Create: `backend/models/PostCategory.js`
- Modify: `backend/models/index.js`

- [ ] **Step 1: 创建 PostCategory 模型**

```js
// backend/models/PostCategory.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostCategory = sequelize.define('PostCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order'
  },
  postCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'post_count'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'online_post_categories'
});

module.exports = PostCategory;
```

- [ ] **Step 2: 在 index.js 中注册 PostCategory 并添加与 Post 的关联**

在 `backend/models/index.js` 中：
- 顶部添加 `const PostCategory = require('./PostCategory');`
- 在 Post 关联区块后添加：

```js
// PostCategory 关联
Post.belongsTo(PostCategory, { foreignKey: 'categoryId', as: 'postCategory' });
PostCategory.hasMany(Post, { foreignKey: 'categoryId', as: 'posts' });
```

- 在 module.exports 中添加 `PostCategory`

- [ ] **Step 3: 启动后端验证表创建成功**

Run: `cd backend && node -e "const {sequelize} = require('./config/database'); sequelize.sync({alter:true}).then(() => {console.log('OK'); process.exit()}).catch(e => {console.error(e); process.exit(1)})"`

Expected: OK，online_post_categories 表已创建

- [ ] **Step 4: Commit**

```bash
git add backend/models/PostCategory.js backend/models/index.js
git commit -m "feat(models): add PostCategory model with Post association"
```

---

### Task 2: Tag 模型

**Files:**
- Create: `backend/models/Tag.js`
- Modify: `backend/models/index.js`

- [ ] **Step 1: 创建 Tag 模型**

```js
// backend/models/Tag.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tag = sequelize.define('Tag', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      len: { args: [1, 10], msg: '标签长度不能超过10个字符' }
    }
  },
  normalizedName: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    field: 'normalized_name'
  },
  status: {
    type: DataTypes.ENUM('approved', 'pending'),
    defaultValue: 'pending'
  },
  isOfficial: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_official'
  },
  createdBy: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    field: 'created_by'
  },
  postCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'post_count'
  }
}, {
  tableName: 'online_tags',
  indexes: [
    { fields: ['normalized_name'], unique: true },
    { fields: ['status'] },
    { fields: ['created_by'] }
  ]
});

module.exports = Tag;
```

- [ ] **Step 2: 在 index.js 中注册 Tag 并添加关联**

在 `backend/models/index.js` 中：
- 顶部添加 `const Tag = require('./Tag');`
- 添加关联：

```js
// Tag 关联
Tag.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Tag, { foreignKey: 'createdBy', as: 'createdTags' });
```

- 在 module.exports 中添加 `Tag`

- [ ] **Step 3: 验证**

Run: `cd backend && node -e "const {sequelize} = require('./config/database'); sequelize.sync({alter:true}).then(() => {console.log('OK'); process.exit()}).catch(e => {console.error(e); process.exit(1)})"`

- [ ] **Step 4: Commit**

```bash
git add backend/models/Tag.js backend/models/index.js
git commit -m "feat(models): add Tag model with User association"
```

---

### Task 3: PostTagMap 模型

**Files:**
- Create: `backend/models/PostTagMap.js`
- Modify: `backend/models/index.js`

- [ ] **Step 1: 创建 PostTagMap 模型**

```js
// backend/models/PostTagMap.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostTagMap = sequelize.define('PostTagMap', {
  postId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'post_id'
  },
  tagId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'tag_id'
  }
}, {
  tableName: 'online_post_tag_map',
  updatedAt: false
});

module.exports = PostTagMap;
```

- [ ] **Step 2: 在 index.js 中注册 PostTagMap 并添加多对多关联**

在 `backend/models/index.js` 中：
- 顶部添加 `const PostTagMap = require('./PostTagMap');`
- 添加关联：

```js
// Post N:M Tag (through PostTagMap)
Post.belongsToMany(Tag, {
  through: PostTagMap,
  foreignKey: 'postId',
  otherKey: 'tagId',
  as: 'tags_assoc'
});
Tag.belongsToMany(Post, {
  through: PostTagMap,
  foreignKey: 'tagId',
  otherKey: 'postId',
  as: 'posts'
});
PostTagMap.belongsTo(Post, { foreignKey: 'postId' });
PostTagMap.belongsTo(Tag, { foreignKey: 'tagId' });
```

> 注意：alias 用 `tags_assoc` 而非 `tags`，因为 Post 模型仍有 `tags` JSON 字段（迁移前需共存）。

- 在 module.exports 中添加 `PostTagMap`

- [ ] **Step 3: 验证**

Run: `cd backend && node -e "const {sequelize} = require('./config/database'); sequelize.sync({alter:true}).then(() => {console.log('OK'); process.exit()}).catch(e => {console.error(e); process.exit(1)})"`

- [ ] **Step 4: Commit**

```bash
git add backend/models/PostTagMap.js backend/models/index.js
git commit -m "feat(models): add PostTagMap junction model for Post-Tag many-to-many"
```

---

### Task 4: SystemConfig 模型

**Files:**
- Create: `backend/models/SystemConfig.js`
- Modify: `backend/models/index.js`

- [ ] **Step 1: 创建 SystemConfig 模型**

```js
// backend/models/SystemConfig.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemConfig = sequelize.define('SystemConfig', {
  configKey: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    field: 'config_key'
  },
  configValue: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'config_value'
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: true
  }
}, {
  tableName: 'online_system_config'
});

// 便捷方法：获取配置值
SystemConfig.getValue = async function(key, defaultValue = null) {
  const config = await this.findByPk(key);
  return config ? config.configValue : defaultValue;
};

// 便捷方法：设置配置值
SystemConfig.setValue = async function(key, value, description = null) {
  const [config] = await this.upsert({
    configKey: key,
    configValue: String(value),
    ...(description && { description })
  });
  return config;
};

module.exports = SystemConfig;
```

- [ ] **Step 2: 在 index.js 中注册**

在 `backend/models/index.js` 中：
- 顶部添加 `const SystemConfig = require('./SystemConfig');`
- 在 module.exports 中添加 `SystemConfig`
- 无需关联

- [ ] **Step 3: 验证并插入初始配置**

Run: `cd backend && node -e "const {SystemConfig, sequelize} = require('./models'); sequelize.sync({alter:true}).then(async () => { await SystemConfig.setValue('maxTagsPerPost', '5', '每帖最大标签数'); const v = await SystemConfig.getValue('maxTagsPerPost'); console.log('maxTagsPerPost =', v); process.exit(); }).catch(e => {console.error(e); process.exit(1)})"`

Expected: `maxTagsPerPost = 5`

- [ ] **Step 4: Commit**

```bash
git add backend/models/SystemConfig.js backend/models/index.js
git commit -m "feat(models): add SystemConfig model with getValue/setValue helpers"
```

---

## Chunk 2: 后端公开 API（标签 + 分类）

### Task 5: 分类公开接口

**Files:**
- Create: `backend/controllers/postCategoryController.js`
- Create: `backend/routes/postCategoryRoutes.js`
- Modify: `backend/app.js` (或 server.js — 注册路由的主文件)

- [ ] **Step 1: 创建分类控制器**

```js
// backend/controllers/postCategoryController.js
const { PostCategory } = require('../models');

// 公开：获取所有启用的分类
exports.getCategories = async (req, res) => {
  try {
    const categories = await PostCategory.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'slug', 'description', 'postCount'],
      order: [['sortOrder', 'ASC']]
    });
    res.json({ categories });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({ error: '获取分类列表失败' });
  }
};

// 管理员：获取所有分类（含停用）
exports.adminGetCategories = async (req, res) => {
  try {
    const categories = await PostCategory.findAll({
      order: [['sortOrder', 'ASC']]
    });
    res.json({ categories });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({ error: '获取分类列表失败' });
  }
};

// 管理员：创建分类
exports.adminCreateCategory = async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: '名称和 slug 为必填项' });
    }

    const existing = await PostCategory.findOne({ where: { slug } });
    if (existing) {
      return res.status(409).json({ error: '该 slug 已存在' });
    }

    // sortOrder 设为当前最大值 +1
    const maxOrder = await PostCategory.max('sortOrder') || 0;
    const category = await PostCategory.create({
      name, slug, description, sortOrder: maxOrder + 1
    });

    res.status(201).json({ category });
  } catch (error) {
    console.error('创建分类失败:', error);
    res.status(500).json({ error: '创建分类失败' });
  }
};

// 管理员：编辑分类
exports.adminUpdateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description } = req.body;

    const category = await PostCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: '分类不存在' });
    }

    if (slug && slug !== category.slug) {
      const existing = await PostCategory.findOne({ where: { slug } });
      if (existing) {
        return res.status(409).json({ error: '该 slug 已存在' });
      }
    }

    await category.update({
      ...(name && { name }),
      ...(slug && { slug }),
      ...(description !== undefined && { description })
    });

    res.json({ category });
  } catch (error) {
    console.error('编辑分类失败:', error);
    res.status(500).json({ error: '编辑分类失败' });
  }
};

// 管理员：启用/停用分类
exports.adminToggleCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await PostCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: '分类不存在' });
    }

    await category.update({ isActive: !category.isActive });
    res.json({ category });
  } catch (error) {
    console.error('切换分类状态失败:', error);
    res.status(500).json({ error: '切换分类状态失败' });
  }
};

// 管理员：批量排序
exports.adminReorderCategories = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds 必须是数组' });
    }

    await Promise.all(
      orderedIds.map((id, index) =>
        PostCategory.update({ sortOrder: index }, { where: { id } })
      )
    );

    res.json({ message: '排序已更新' });
  } catch (error) {
    console.error('排序更新失败:', error);
    res.status(500).json({ error: '排序更新失败' });
  }
};

// 管理员：迁移分类下的帖子（预留）
exports.adminMigrateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetCategoryId } = req.body;
    const { Post, sequelize } = require('../models');

    if (!targetCategoryId) {
      return res.status(400).json({ error: 'targetCategoryId 为必填项' });
    }

    const [source, target] = await Promise.all([
      PostCategory.findByPk(id),
      PostCategory.findByPk(targetCategoryId)
    ]);

    if (!source || !target) {
      return res.status(404).json({ error: '分类不存在' });
    }

    const result = await Post.update(
      { categoryId: targetCategoryId },
      { where: { categoryId: id, isDeleted: false, status: 'published' } }
    );

    // 重新计算 postCount
    const [sourceCount, targetCount] = await Promise.all([
      Post.count({ where: { categoryId: id, isDeleted: false, status: 'published' } }),
      Post.count({ where: { categoryId: targetCategoryId, isDeleted: false, status: 'published' } })
    ]);

    await Promise.all([
      source.update({ postCount: sourceCount }),
      target.update({ postCount: targetCount })
    ]);

    res.json({ message: `已迁移 ${result[0]} 篇帖子`, migratedCount: result[0] });
  } catch (error) {
    console.error('迁移分类失败:', error);
    res.status(500).json({ error: '迁移分类失败' });
  }
};
```

- [ ] **Step 2: 创建分类路由**

```js
// backend/routes/postCategoryRoutes.js
const express = require('express');
const router = express.Router();
const {
  getCategories
} = require('../controllers/postCategoryController');

// 公开路由
router.get('/', getCategories);

module.exports = router;
```

- [ ] **Step 3: 在主应用中注册路由**

查找 `backend/app.js` 或 `backend/server.js` 中注册路由的位置（如 `app.use('/api/posts', postRoutes)`），在其附近添加：

```js
const postCategoryRoutes = require('./routes/postCategoryRoutes');
app.use('/api/post-categories', postCategoryRoutes);
```

- [ ] **Step 4: 在 adminRoutes.js 中注册管理员分类路由**

在 `backend/routes/adminRoutes.js` 中添加：

```js
const {
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminToggleCategory,
  adminReorderCategories,
  adminMigrateCategory
} = require('../controllers/postCategoryController');

// 帖子分类管理
router.get('/post-categories', adminGetCategories);
router.post('/post-categories', adminCreateCategory);
router.put('/post-categories/reorder', adminReorderCategories);  // 必须在 :id 之前
router.put('/post-categories/:id', adminUpdateCategory);
router.put('/post-categories/:id/toggle', adminToggleCategory);
router.post('/post-categories/:id/migrate', adminMigrateCategory);
```

- [ ] **Step 5: 手动测试公开接口**

Run: `curl http://localhost:3001/api/post-categories`

Expected: `{ "categories": [] }`（此时还没有数据，但接口应正常工作）

- [ ] **Step 6: Commit**

```bash
git add backend/controllers/postCategoryController.js backend/routes/postCategoryRoutes.js backend/routes/adminRoutes.js
git commit -m "feat(api): add post category public and admin endpoints"
```

注意：还需要 `git add` 主应用文件（app.js 或 server.js）。

---

### Task 6: 标签公开接口

**Files:**
- Create: `backend/controllers/tagController.js`
- Create: `backend/routes/tagRoutes.js`
- Modify: 主应用文件 (注册路由)

- [ ] **Step 1: 创建标签控制器**

```js
// backend/controllers/tagController.js
const { Tag, User, PostTagMap, SystemConfig, sequelize } = require('../models');
const { Op } = require('sequelize');

// 公开：获取标签列表（仅 approved）
exports.getTags = async (req, res) => {
  try {
    const { search, sort = 'postCount', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = { status: 'approved' };

    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const order = sort === 'latest'
      ? [['createdAt', 'DESC']]
      : [['postCount', 'DESC']];

    const { count, rows: tags } = await Tag.findAndCountAll({
      where,
      attributes: ['id', 'name', 'isOfficial', 'postCount'],
      order,
      limit: parseInt(limit),
      offset
    });

    res.json({
      tags,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取标签列表失败:', error);
    res.status(500).json({ error: '获取标签列表失败' });
  }
};

// 公开：热门标签
exports.getHotTags = async (req, res) => {
  try {
    const tags = await Tag.findAll({
      where: { status: 'approved' },
      attributes: ['id', 'name', 'isOfficial', 'postCount'],
      order: [['postCount', 'DESC']],
      limit: 20
    });
    res.json({ tags });
  } catch (error) {
    console.error('获取热门标签失败:', error);
    res.status(500).json({ error: '获取热门标签失败' });
  }
};

// 登录用户：标签推荐（输入联想）
exports.suggestTags = async (req, res) => {
  try {
    const { q = '' } = req.query;
    const userId = req.user.id;

    let tags;
    if (q.trim()) {
      const normalized = q.toLowerCase().trim();
      // approved + official 优先，再加上当前用户的 pending
      tags = await Tag.findAll({
        where: {
          [Op.or]: [
            { status: 'approved', normalizedName: { [Op.like]: `${normalized}%` } },
            { status: 'pending', createdBy: userId, normalizedName: { [Op.like]: `${normalized}%` } }
          ]
        },
        attributes: ['id', 'name', 'isOfficial', 'status', 'postCount'],
        order: [
          [sequelize.literal("FIELD(is_official, 1, 0)"), 'ASC'], // official 优先
          ['postCount', 'DESC']
        ],
        limit: 10
      });
    } else {
      // 空查询：返回热门 + 用户 pending
      const [hot, pending] = await Promise.all([
        Tag.findAll({
          where: { status: 'approved' },
          attributes: ['id', 'name', 'isOfficial', 'status', 'postCount'],
          order: [['postCount', 'DESC']],
          limit: 10
        }),
        Tag.findAll({
          where: { status: 'pending', createdBy: userId },
          attributes: ['id', 'name', 'isOfficial', 'status', 'postCount']
        })
      ]);
      tags = [...pending, ...hot].slice(0, 10);
    }

    res.json({ tags });
  } catch (error) {
    console.error('获取标签推荐失败:', error);
    res.status(500).json({ error: '获取标签推荐失败' });
  }
};

// 登录用户：创建标签
exports.createTag = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: '标签名称不能为空' });
    }
    if (name.trim().length > 10) {
      return res.status(400).json({ error: '标签长度不能超过10个字符' });
    }

    const normalizedName = name.toLowerCase().trim();
    const trimmedName = name.trim();

    // 检查是否已存在
    const existing = await Tag.findOne({ where: { normalizedName } });
    if (existing) {
      // 如果是其他用户的 pending 标签
      if (existing.status === 'pending' && existing.createdBy !== req.user.id) {
        return res.json({
          tag: { id: existing.id, name: existing.name, status: existing.status, isNew: false },
          message: '该标签名已被占用，等待审核中'
        });
      }
      return res.json({
        tag: { id: existing.id, name: existing.name, status: existing.status, isNew: false },
        message: '已有同名标签'
      });
    }

    const tag = await Tag.create({
      name: trimmedName,
      normalizedName,
      status: 'pending',
      isOfficial: false,
      createdBy: req.user.id
    });

    res.status(201).json({
      tag: { id: tag.id, name: tag.name, status: tag.status, isNew: true },
      message: '标签已创建，审核通过后将对所有人可见'
    });
  } catch (error) {
    // UNIQUE 约束冲突（并发场景兜底）
    if (error.name === 'SequelizeUniqueConstraintError') {
      const existing = await Tag.findOne({
        where: { normalizedName: req.body.name.toLowerCase().trim() }
      });
      if (existing) {
        return res.json({
          tag: { id: existing.id, name: existing.name, status: existing.status, isNew: false },
          message: '已有同名标签'
        });
      }
    }
    console.error('创建标签失败:', error);
    res.status(500).json({ error: '创建标签失败' });
  }
};
```

- [ ] **Step 2: 创建标签路由**

```js
// backend/routes/tagRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/auth');
const {
  getTags,
  getHotTags,
  suggestTags,
  createTag
} = require('../controllers/tagController');

router.get('/', getTags);
router.get('/hot', getHotTags);
router.get('/suggest', protect, suggestTags);
router.post('/', protect, createTag);

module.exports = router;
```

- [ ] **Step 3: 在主应用中注册路由**

在注册路由的位置添加：

```js
const tagRoutes = require('./routes/tagRoutes');
app.use('/api/tags', tagRoutes);
```

- [ ] **Step 4: 手动测试**

Run: `curl http://localhost:3001/api/tags` 和 `curl http://localhost:3001/api/tags/hot`

Expected: 两个都返回 `{ "tags": [] }` 或类似空响应

- [ ] **Step 5: Commit**

```bash
git add backend/controllers/tagController.js backend/routes/tagRoutes.js
git commit -m "feat(api): add tag public endpoints (list, hot, suggest, create)"
```

---

### Task 7: 管理员标签接口

**Files:**
- Modify: `backend/controllers/tagController.js` (追加管理员方法)
- Modify: `backend/routes/adminRoutes.js`

- [ ] **Step 1: 在 tagController.js 中追加管理员方法**

在 `backend/controllers/tagController.js` 末尾追加：

```js
// ============ 管理员接口 ============

// 管理员：获取所有标签（含 pending）
exports.adminGetTags = async (req, res) => {
  try {
    const { status, isOfficial, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (isOfficial !== undefined) where.isOfficial = isOfficial === 'true';
    if (search) where.name = { [Op.like]: `%${search}%` };

    const { count, rows: tags } = await Tag.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      tags,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('管理员获取标签失败:', error);
    res.status(500).json({ error: '获取标签列表失败' });
  }
};

// 管理员：创建官方标签
exports.adminCreateTag = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0 || name.trim().length > 10) {
      return res.status(400).json({ error: '标签名称为1-10个字符' });
    }

    const normalizedName = name.toLowerCase().trim();
    const existing = await Tag.findOne({ where: { normalizedName } });
    if (existing) {
      return res.status(409).json({ error: '同名标签已存在', tag: existing });
    }

    const tag = await Tag.create({
      name: name.trim(),
      normalizedName,
      status: 'approved',
      isOfficial: true,
      createdBy: req.user.id
    });

    res.status(201).json({ tag });
  } catch (error) {
    console.error('创建官方标签失败:', error);
    res.status(500).json({ error: '创建官方标签失败' });
  }
};

// 管理员：编辑标签
exports.adminUpdateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const tag = await Tag.findByPk(id);
    if (!tag) return res.status(404).json({ error: '标签不存在' });

    if (name) {
      const normalizedName = name.toLowerCase().trim();
      if (normalizedName !== tag.normalizedName) {
        const existing = await Tag.findOne({ where: { normalizedName } });
        if (existing) return res.status(409).json({ error: '同名标签已存在' });
      }
      await tag.update({ name: name.trim(), normalizedName: name.toLowerCase().trim() });
    }

    res.json({ tag });
  } catch (error) {
    console.error('编辑标签失败:', error);
    res.status(500).json({ error: '编辑标签失败' });
  }
};

// 管理员：删除标签
exports.adminDeleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await Tag.findByPk(id);
    if (!tag) return res.status(404).json({ error: '标签不存在' });

    // CASCADE 会自动清理 PostTagMap
    await tag.destroy();
    res.json({ message: '标签已删除' });
  } catch (error) {
    console.error('删除标签失败:', error);
    res.status(500).json({ error: '删除标签失败' });
  }
};

// 管理员：审核通过
exports.adminApproveTag = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await Tag.findByPk(id);
    if (!tag) return res.status(404).json({ error: '标签不存在' });
    if (tag.status === 'approved') return res.json({ tag, message: '标签已经是 approved 状态' });

    await tag.update({ status: 'approved' });
    res.json({ tag });
  } catch (error) {
    console.error('审核标签失败:', error);
    res.status(500).json({ error: '审核标签失败' });
  }
};

// 管理员：拒绝（删除）
exports.adminRejectTag = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await Tag.findByPk(id);
    if (!tag) return res.status(404).json({ error: '标签不存在' });

    await tag.destroy();
    res.json({ message: '标签已拒绝并删除' });
  } catch (error) {
    console.error('拒绝标签失败:', error);
    res.status(500).json({ error: '拒绝标签失败' });
  }
};

// 管理员：批量审核通过
exports.adminBatchApprove = async (req, res) => {
  try {
    const { tagIds } = req.body;
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({ error: 'tagIds 必须是非空数组' });
    }

    await Tag.update({ status: 'approved' }, { where: { id: tagIds, status: 'pending' } });
    res.json({ message: `已批量通过 ${tagIds.length} 个标签` });
  } catch (error) {
    console.error('批量审核失败:', error);
    res.status(500).json({ error: '批量审核失败' });
  }
};

// 管理员：批量拒绝
exports.adminBatchReject = async (req, res) => {
  try {
    const { tagIds } = req.body;
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({ error: 'tagIds 必须是非空数组' });
    }

    // 先清理关联再删除标签
    await PostTagMap.destroy({ where: { tagId: tagIds } });
    await Tag.destroy({ where: { id: tagIds } });
    res.json({ message: `已批量拒绝 ${tagIds.length} 个标签` });
  } catch (error) {
    console.error('批量拒绝失败:', error);
    res.status(500).json({ error: '批量拒绝失败' });
  }
};

// 管理员：合并标签
exports.adminMergeTags = async (req, res) => {
  try {
    const { sourceId, targetId } = req.body;
    if (!sourceId || !targetId || sourceId === targetId) {
      return res.status(400).json({ error: '请提供有效的 sourceId 和 targetId' });
    }

    const [source, target] = await Promise.all([
      Tag.findByPk(sourceId),
      Tag.findByPk(targetId)
    ]);
    if (!source || !target) return res.status(404).json({ error: '标签不存在' });

    const result = await sequelize.transaction(async (t) => {
      // 查出 source 和 target 各自关联的 postId
      const sourceMaps = await PostTagMap.findAll({ where: { tagId: sourceId }, transaction: t });
      const targetMaps = await PostTagMap.findAll({ where: { tagId: targetId }, transaction: t });

      const sourcePostIds = new Set(sourceMaps.map(m => m.postId));
      const targetPostIds = new Set(targetMaps.map(m => m.postId));

      // 差集：source 有但 target 没有的
      const toMigrate = [...sourcePostIds].filter(id => !targetPostIds.has(id));

      // 迁移差集
      if (toMigrate.length > 0) {
        await PostTagMap.update(
          { tagId: targetId },
          { where: { tagId: sourceId, postId: toMigrate }, transaction: t }
        );
      }

      // 删除 source 剩余关联（重复的）
      await PostTagMap.destroy({ where: { tagId: sourceId }, transaction: t });

      // 删除 source 标签
      await source.destroy({ transaction: t });

      // 重新计算 target postCount
      const newCount = await PostTagMap.count({ where: { tagId: targetId }, transaction: t });
      await target.update({ postCount: newCount }, { transaction: t });

      return { migratedCount: toMigrate.length };
    });

    res.json({
      message: `标签「${source.name}」已合并到「${target.name}」，共迁移 ${result.migratedCount} 篇帖子`,
      migratedCount: result.migratedCount
    });
  } catch (error) {
    console.error('合并标签失败:', error);
    res.status(500).json({ error: '合并标签失败' });
  }
};
```

- [ ] **Step 2: 在 adminRoutes.js 中注册标签管理路由**

在 `backend/routes/adminRoutes.js` 中添加：

```js
const {
  adminGetTags,
  adminCreateTag,
  adminUpdateTag,
  adminDeleteTag,
  adminApproveTag,
  adminRejectTag,
  adminBatchApprove,
  adminBatchReject,
  adminMergeTags
} = require('../controllers/tagController');

// 标签管理
router.get('/tags', adminGetTags);
router.post('/tags', adminCreateTag);
router.post('/tags/batch-approve', adminBatchApprove);
router.post('/tags/batch-reject', adminBatchReject);
router.post('/tags/merge', adminMergeTags);
router.put('/tags/:id', adminUpdateTag);
router.delete('/tags/:id', adminDeleteTag);
router.put('/tags/:id/approve', adminApproveTag);
router.put('/tags/:id/reject', adminRejectTag);
```

> 注意：batch-approve、batch-reject、merge 路由必须在 `:id` 路由之前。

- [ ] **Step 3: 重启后端，手动测试**

Run: `curl http://localhost:3001/api/tags/hot`

Expected: `{ "tags": [] }`

- [ ] **Step 4: Commit**

```bash
git add backend/controllers/tagController.js backend/routes/adminRoutes.js
git commit -m "feat(api): add admin tag management endpoints (CRUD, approve, reject, merge, batch)"
```

---

## Chunk 3: 改造 postController 适配新结构

### Task 8: 改造 Post 模型与 postController

**Files:**
- Modify: `backend/models/Post.js`
- Modify: `backend/controllers/postController.js`

- [ ] **Step 1: 在 Post 模型中新增 categoryId 字段**

在 `backend/models/Post.js` 中，在 `category` 字段后面添加 `categoryId` 字段（先共存，迁移完成后再删除 `category`）：

```js
categoryId: {
  type: DataTypes.INTEGER,
  allowNull: true,   // 迁移期间允许 null
  field: 'category_id'
},
```

在 indexes 中添加：
```js
{ fields: ['category_id'] }
```

- [ ] **Step 2: 改造 postController.getPosts**

修改 `backend/controllers/postController.js`：

1. 更新 require 添加新模型：
```js
const { Post, User, Journal, PostLike, PostFavorite, PostFollow, PostReport, Tag, PostTagMap, PostCategory, SystemConfig } = require('../models');
```

2. 修改 `getPosts` 中的筛选逻辑：
- `category` 参数改为按 `categoryId` 筛选（同时保留按 slug 查找的能力）：

```js
if (category) {
  // 支持传 slug 或 id
  if (isNaN(category)) {
    const cat = await PostCategory.findOne({ where: { slug: category } });
    if (cat) where.categoryId = cat.id;
  } else {
    where.categoryId = parseInt(category);
  }
}
```

- `tag` 参数改为通过 PostTagMap JOIN 查询：将旧的 `if (tag) where.tags = ...` 替换为在 include 中添加 Tag 关联：

```js
// 在 include 数组中添加：
{
  model: Tag,
  as: 'tags_assoc',
  attributes: ['id', 'name', 'isOfficial', 'status'],
  through: { attributes: [] },
  required: false
},
{
  model: PostCategory,
  as: 'postCategory',
  attributes: ['id', 'name', 'slug'],
  required: false
}
```

如果有 tag 筛选，改用子查询方式：
```js
if (tag) {
  const tagRecord = await Tag.findOne({ where: { normalizedName: tag.toLowerCase() } });
  if (tagRecord) {
    const tagPostIds = await PostTagMap.findAll({
      where: { tagId: tagRecord.id },
      attributes: ['postId']
    });
    where.id = { [Op.in]: tagPostIds.map(t => t.postId) };
  } else {
    // 标签不存在，返回空结果
    return res.json({ posts: [], pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 } });
  }
}
```

3. 在 postsWithUserStatus 映射中，处理 pending 标签的可见性：

```js
postsWithUserStatus = posts.map(post => {
  const postJSON = post.toJSON ? post.toJSON() : post;
  // 过滤 pending 标签：仅创建者可见
  if (postJSON.tags_assoc) {
    postJSON.tags_assoc = postJSON.tags_assoc.filter(
      t => t.status === 'approved' || (req.user && t.createdBy === req.user.id)
    );
  }
  return {
    ...postJSON,
    userLiked: likedIds.has(postJSON.id),
    userFavorited: favoritedIds.has(postJSON.id),
    userFollowed: followedIds.has(postJSON.id)
  };
});
```

> 未登录用户也需要过滤 pending 标签（在没有 req.user 的分支中也要处理）。

- [ ] **Step 3: 改造 postController.getPostById**

在 include 中添加 Tag 和 PostCategory 关联（同 getPosts）。在返回前过滤 pending 标签。

- [ ] **Step 4: 改造 postController.createPost**

修改 `createPost` 方法，接受新参数 `categoryId`, `tagIds`, `newTags`：

```js
exports.createPost = async (req, res) => {
  try {
    const { title, content, categoryId, tagIds = [], newTags = [], journalId, status } = req.body;

    if (!title || !content || !categoryId) {
      return res.status(400).json({ error: '标题、内容和分类为必填项' });
    }

    // 验证分类
    const category = await PostCategory.findByPk(categoryId);
    if (!category || !category.isActive) {
      return res.status(400).json({ error: '无效的分类' });
    }

    // 处理 newTags：创建或查找已有标签
    const newTagIds = [];
    for (const tagName of newTags) {
      const normalizedName = tagName.toLowerCase().trim();
      let tag = await Tag.findOne({ where: { normalizedName } });
      if (!tag) {
        tag = await Tag.create({
          name: tagName.trim(),
          normalizedName,
          status: 'pending',
          isOfficial: false,
          createdBy: req.user.id
        });
      }
      newTagIds.push(tag.id);
    }

    // 合并并去重所有标签 ID
    const allTagIds = [...new Set([...tagIds, ...newTagIds])];

    // 校验标签数量
    const maxTags = parseInt(await SystemConfig.getValue('maxTagsPerPost', '5'));
    if (allTagIds.length > maxTags) {
      return res.status(400).json({ error: `最多添加 ${maxTags} 个标签` });
    }

    const post = await Post.create({
      userId: req.user.id,
      title,
      content,
      categoryId,
      tags: [],  // 旧字段保留空值
      journalId: journalId || null,
      status: status || 'published'
    });

    // 创建标签关联
    if (allTagIds.length > 0) {
      await PostTagMap.bulkCreate(
        allTagIds.map(tagId => ({ postId: post.id, tagId }))
      );
      // 更新标签 postCount
      await Tag.increment('postCount', { where: { id: allTagIds } });
    }

    // 更新分类 postCount
    if (post.status === 'published') {
      await category.increment('postCount');
    }

    // 返回完整帖子
    const fullPost = await Post.findByPk(post.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
        { model: Journal, as: 'journal', attributes: ['journalId', 'name'], required: false },
        { model: Tag, as: 'tags_assoc', attributes: ['id', 'name', 'isOfficial', 'status'], through: { attributes: [] } },
        { model: PostCategory, as: 'postCategory', attributes: ['id', 'name', 'slug'] }
      ]
    });

    res.status(201).json(fullPost);
  } catch (error) {
    console.error('创建帖子失败:', error);
    res.status(500).json({ error: '创建帖子失败' });
  }
};
```

- [ ] **Step 5: 改造 postController.updatePost**

同理改造 `updatePost`，处理 categoryId 变更和标签变更的 postCount 维护。

核心变更点：
- 接受 `categoryId`, `tagIds`, `newTags`
- 若 categoryId 变更，旧分类 -1 新分类 +1
- 比对旧 tagIds 和新 tagIds，diff 计算增减
- 清除旧 PostTagMap，插入新的
- 更新相关标签 postCount

- [ ] **Step 6: 改造 postController.deletePost**

在软删除时更新 postCount：

```js
// 在 await post.update({ isDeleted: true }) 之后添加：
// 更新分类 postCount
if (post.categoryId) {
  await PostCategory.decrement('postCount', { where: { id: post.categoryId } });
}
// 更新标签 postCount
const tagMaps = await PostTagMap.findAll({ where: { postId: id } });
const tagIds = tagMaps.map(m => m.tagId);
if (tagIds.length > 0) {
  await Tag.decrement('postCount', { where: { id: tagIds } });
}
```

- [ ] **Step 7: 验证后端启动无报错**

Run: `cd backend && node -e "require('./models'); console.log('Models loaded OK')"`

Expected: `Models loaded OK`

- [ ] **Step 8: Commit**

```bash
git add backend/models/Post.js backend/controllers/postController.js
git commit -m "feat(posts): adapt createPost/updatePost/deletePost/getPosts to use categoryId and Tag associations"
```

---

## Chunk 4: 数据迁移脚本

### Task 9: 迁移脚本

**Files:**
- Create: `backend/scripts/migratePostTagCategory.js`

- [ ] **Step 1: 编写迁移脚本**

```js
// backend/scripts/migratePostTagCategory.js
const { sequelize, Post, PostCategory, Tag, PostTagMap, SystemConfig } = require('../models');

const CATEGORY_MAP = {
  experience: { name: '投稿经验', slug: 'experience' },
  discussion: { name: '学术讨论', slug: 'discussion' },
  question: { name: '求助问答', slug: 'question' },
  news: { name: '资讯分享', slug: 'news' },
  review: { name: '文献评述', slug: 'review' },
  other: { name: '其他', slug: 'other' }
};

const isDryRun = process.argv.includes('--dry-run');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    if (isDryRun) console.log('=== DRY RUN 模式 ===\n');

    // 1. Sync 新表
    await sequelize.sync({ alter: true });
    console.log('表结构同步完成');

    // 2. 插入初始配置
    if (!isDryRun) {
      await SystemConfig.setValue('maxTagsPerPost', '5', '每帖最大标签数');
    }

    // 3. 迁移分类
    console.log('\n--- 迁移分类 ---');
    const categoryIdMap = {}; // slug -> id
    let sortOrder = 0;
    for (const [slug, { name }] of Object.entries(CATEGORY_MAP)) {
      if (isDryRun) {
        console.log(`  [DRY] 创建分类: ${name} (${slug})`);
        categoryIdMap[slug] = sortOrder + 1;
      } else {
        const [cat] = await PostCategory.findOrCreate({
          where: { slug },
          defaults: { name, slug, sortOrder, isActive: true }
        });
        categoryIdMap[slug] = cat.id;
      }
      sortOrder++;
    }
    console.log(`分类映射: ${JSON.stringify(categoryIdMap)}`);

    // 4. 迁移帖子 category -> categoryId
    const posts = await Post.findAll({ attributes: ['id', 'category', 'tags', 'userId', 'status', 'isDeleted'] });
    console.log(`\n--- 迁移 ${posts.length} 个帖子 ---`);

    let migratedCategories = 0;
    let migratedTags = 0;
    const tagNameMap = {}; // normalizedName -> Tag record

    for (const post of posts) {
      // 分类映射
      const catId = categoryIdMap[post.category];
      if (catId && !isDryRun) {
        await post.update({ categoryId: catId });
      }
      migratedCategories++;

      // 标签迁移
      let tags = post.tags;
      if (typeof tags === 'string') {
        try { tags = JSON.parse(tags); } catch { tags = []; }
      }
      if (!Array.isArray(tags)) tags = [];

      for (const tagName of tags) {
        if (!tagName || typeof tagName !== 'string') continue;
        const trimmed = tagName.trim();
        if (trimmed.length === 0 || trimmed.length > 10) continue;

        const normalized = trimmed.toLowerCase();

        // 创建或获取 Tag
        if (!tagNameMap[normalized]) {
          if (isDryRun) {
            tagNameMap[normalized] = { id: Object.keys(tagNameMap).length + 1, name: trimmed };
          } else {
            const [tag] = await Tag.findOrCreate({
              where: { normalizedName: normalized },
              defaults: {
                name: trimmed,
                normalizedName: normalized,
                status: 'approved',
                isOfficial: false,
                createdBy: post.userId
              }
            });
            tagNameMap[normalized] = tag;
          }
        }

        // 创建 PostTagMap
        if (!isDryRun) {
          await PostTagMap.findOrCreate({
            where: { postId: post.id, tagId: tagNameMap[normalized].id }
          });
        }
        migratedTags++;
      }
    }

    console.log(`分类迁移: ${migratedCategories} 帖子`);
    console.log(`标签迁移: ${migratedTags} 个标签关联, ${Object.keys(tagNameMap).length} 个唯一标签`);

    // 5. 更新 postCount
    if (!isDryRun) {
      console.log('\n--- 更新 postCount ---');
      // 分类 postCount
      for (const [slug, id] of Object.entries(categoryIdMap)) {
        const count = await Post.count({
          where: { categoryId: id, isDeleted: false, status: 'published' }
        });
        await PostCategory.update({ postCount: count }, { where: { id } });
        console.log(`  ${slug}: ${count} 篇`);
      }

      // 标签 postCount
      const allTags = await Tag.findAll();
      for (const tag of allTags) {
        const count = await PostTagMap.count({
          where: { tagId: tag.id },
          include: [{
            model: Post,
            where: { isDeleted: false, status: 'published' },
            attributes: []
          }]
        });
        // PostTagMap.count with include 不一定可行，改用原始查询
        const [result] = await sequelize.query(
          `SELECT COUNT(*) as cnt FROM online_post_tag_map m
           JOIN online_posts p ON m.post_id = p.id
           WHERE m.tag_id = ? AND p.is_deleted = false AND p.status = 'published'`,
          { replacements: [tag.id] }
        );
        await tag.update({ postCount: result[0].cnt });
      }
      console.log(`标签 postCount 更新完成`);
    }

    // 6. 验证
    console.log('\n--- 验证 ---');
    const totalPosts = await Post.count();
    const postsWithCategory = await Post.count({ where: { categoryId: { [require('sequelize').Op.ne]: null } } });
    const totalTagMaps = await PostTagMap.count();
    const totalTags = await Tag.count();
    console.log(`总帖子: ${totalPosts}, 已迁移分类: ${postsWithCategory}, 标签关联: ${totalTagMaps}, 唯一标签: ${totalTags}`);

    console.log('\n迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  }
}

migrate();
```

- [ ] **Step 2: 在 package.json 中添加迁移命令**

在 `backend/package.json` 的 scripts 中添加：

```json
"migrate:tags": "node scripts/migratePostTagCategory.js",
"migrate:tags:dry": "node scripts/migratePostTagCategory.js --dry-run"
```

- [ ] **Step 3: 先 dry-run 验证**

Run: `cd backend && npm run migrate:tags:dry`

Expected: 输出迁移计划但不执行

- [ ] **Step 4: 执行迁移**

Run: `cd backend && npm run migrate:tags`

Expected: 分类和标签数据已迁移

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/migratePostTagCategory.js backend/package.json
git commit -m "feat(migration): add post tag/category migration script with dry-run support"
```

---

## Chunk 5: 前端类型与服务层

### Task 10: 更新前端类型定义

**Files:**
- Modify: `src/features/posts/types/post.ts`

- [ ] **Step 1: 更新类型定义**

修改 `src/features/posts/types/post.ts`：

```ts
// 新增 Tag 相关类型
export interface TagInfo {
  id: number;
  name: string;
  isOfficial: boolean;
  status: 'approved' | 'pending';
  postCount?: number;
}

export interface PostCategoryInfo {
  id: number;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
  isActive?: boolean;
  sortOrder?: number;
}

// 修改 Post interface
export interface Post {
  id: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  content: string;
  categoryId: number;          // 新增
  postCategory?: PostCategoryInfo;  // 新增：关联的分类对象
  category?: string;            // 保留向后兼容，迁移后移除
  tags: string[];               // 保留旧格式向后兼容
  tags_assoc?: TagInfo[];       // 新增：关联的标签对象
  journalId?: number;
  journalTitle?: string;

  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  followCount: number;
  hotScore: number;

  isPinned: boolean;
  isDeleted: boolean;
  status: PostStatus;

  userLiked?: boolean;
  userFavorited?: boolean;
  userFollowed?: boolean;

  createdAt: string;
  updatedAt: string;
}

// 修改 CreatePostData
export interface CreatePostData {
  title: string;
  content: string;
  categoryId: number;          // 改为 categoryId
  tagIds?: number[];            // 新增
  newTags?: string[];           // 新增
  journalId?: number;
  status?: PostStatus;
}

// 修改 UpdatePostData
export interface UpdatePostData {
  title?: string;
  content?: string;
  categoryId?: number;         // 改为 categoryId
  tagIds?: number[];            // 新增
  newTags?: string[];           // 新增
  journalId?: number;
}

// 修改 PostFilters
export interface PostFilters {
  category?: string;            // 保持：可以传 slug 或 id
  tag?: string;                 // 保持：传 tag name
  journalId?: number;
  userId?: string;
  sortBy?: 'hot' | 'latest' | 'likes' | 'comments' | 'views';
  page?: number;
  limit?: number;
  search?: string;
}
```

保留 `CATEGORY_LABELS` 作为后备，但标记为 deprecated：

```ts
/** @deprecated 使用动态加载的 PostCategoryInfo 替代 */
export const CATEGORY_LABELS: Record<string, string> = {
  experience: '投稿经验',
  discussion: '学术讨论',
  question: '求助问答',
  news: '资讯分享',
  review: '文献评述',
  other: '其他'
};
```

- [ ] **Step 2: Commit**

```bash
git add src/features/posts/types/post.ts
git commit -m "feat(types): add TagInfo/PostCategoryInfo types, update Post/CreatePostData interfaces"
```

---

### Task 11: 创建标签和分类 Service

**Files:**
- Create: `src/services/tagService.ts`
- Create: `src/services/postCategoryService.ts`

- [ ] **Step 1: 创建 tagService**

```ts
// src/services/tagService.ts
import { TagInfo } from '../features/posts/types/post';

const API_URL = '';

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }
  return response.json();
};

export const tagService = {
  getTags: async (params?: { search?: string; sort?: string; page?: number; limit?: number }): Promise<{ tags: TagInfo[]; pagination: any }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const response = await fetch(`${API_URL}/api/tags?${searchParams}`);
    return handleResponse(response);
  },

  getHotTags: async (): Promise<{ tags: TagInfo[] }> => {
    const response = await fetch(`${API_URL}/api/tags/hot`);
    return handleResponse(response);
  },

  suggestTags: async (q: string): Promise<{ tags: TagInfo[] }> => {
    const response = await fetch(`${API_URL}/api/tags/suggest?q=${encodeURIComponent(q)}`, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  createTag: async (name: string): Promise<{ tag: TagInfo & { isNew: boolean }; message: string }> => {
    const response = await fetch(`${API_URL}/api/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ name })
    });
    return handleResponse(response);
  },

  // 管理员接口
  adminGetTags: async (params?: { status?: string; isOfficial?: string; search?: string; page?: number; limit?: number }): Promise<{ tags: any[]; pagination: any }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const response = await fetch(`${API_URL}/api/admin/tags?${searchParams}`, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  adminCreateTag: async (name: string): Promise<{ tag: TagInfo }> => {
    const response = await fetch(`${API_URL}/api/admin/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ name })
    });
    return handleResponse(response);
  },

  adminUpdateTag: async (id: number, name: string): Promise<{ tag: TagInfo }> => {
    const response = await fetch(`${API_URL}/api/admin/tags/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ name })
    });
    return handleResponse(response);
  },

  adminDeleteTag: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/admin/tags/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    await handleResponse(response);
  },

  adminApproveTag: async (id: number): Promise<{ tag: TagInfo }> => {
    const response = await fetch(`${API_URL}/api/admin/tags/${id}/approve`, {
      method: 'PUT',
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  adminRejectTag: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/admin/tags/${id}/reject`, {
      method: 'PUT',
      headers: getAuthHeader()
    });
    await handleResponse(response);
  },

  adminBatchApprove: async (tagIds: number[]): Promise<void> => {
    const response = await fetch(`${API_URL}/api/admin/tags/batch-approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ tagIds })
    });
    await handleResponse(response);
  },

  adminBatchReject: async (tagIds: number[]): Promise<void> => {
    const response = await fetch(`${API_URL}/api/admin/tags/batch-reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ tagIds })
    });
    await handleResponse(response);
  },

  adminMergeTags: async (sourceId: number, targetId: number): Promise<{ message: string; migratedCount: number }> => {
    const response = await fetch(`${API_URL}/api/admin/tags/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ sourceId, targetId })
    });
    return handleResponse(response);
  }
};
```

- [ ] **Step 2: 创建 postCategoryService**

```ts
// src/services/postCategoryService.ts
import { PostCategoryInfo } from '../features/posts/types/post';

const API_URL = '';

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }
  return response.json();
};

export const postCategoryService = {
  getCategories: async (): Promise<{ categories: PostCategoryInfo[] }> => {
    const response = await fetch(`${API_URL}/api/post-categories`);
    return handleResponse(response);
  },

  // 管理员接口
  adminGetCategories: async (): Promise<{ categories: PostCategoryInfo[] }> => {
    const response = await fetch(`${API_URL}/api/admin/post-categories`, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  adminCreateCategory: async (data: { name: string; slug: string; description?: string }): Promise<{ category: PostCategoryInfo }> => {
    const response = await fetch(`${API_URL}/api/admin/post-categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  adminUpdateCategory: async (id: number, data: { name?: string; slug?: string; description?: string }): Promise<{ category: PostCategoryInfo }> => {
    const response = await fetch(`${API_URL}/api/admin/post-categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  adminToggleCategory: async (id: number): Promise<{ category: PostCategoryInfo }> => {
    const response = await fetch(`${API_URL}/api/admin/post-categories/${id}/toggle`, {
      method: 'PUT',
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  adminReorderCategories: async (orderedIds: number[]): Promise<void> => {
    const response = await fetch(`${API_URL}/api/admin/post-categories/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ orderedIds })
    });
    await handleResponse(response);
  },

  adminMigrateCategory: async (id: number, targetCategoryId: number): Promise<{ message: string; migratedCount: number }> => {
    const response = await fetch(`${API_URL}/api/admin/post-categories/${id}/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ targetCategoryId })
    });
    return handleResponse(response);
  }
};
```

- [ ] **Step 3: Commit**

```bash
git add src/services/tagService.ts src/services/postCategoryService.ts
git commit -m "feat(services): add tagService and postCategoryService API clients"
```

---

## Chunk 6: 前端组件（TagInput, PostForm, PostCard, CommunityPage）

### Task 12: TagInput 组件

**Files:**
- Create: `src/features/posts/components/TagInput.tsx`
- Create: `src/features/posts/components/TagInput.css`

- [ ] **Step 1: 创建 TagInput 组件**

实现要点：
- 输入框 + 自动补全下拉列表
- 已选标签以 chip 形式展示（官方标签显示 ★，pending 显示 ⏳）
- 调用 `tagService.suggestTags(q)` 带 300ms 防抖
- 推荐列表：官方标签置顶，显示使用量
- 无匹配时显示"+ 创建「xxx」"选项
- 输入超过 10 字符时阻止
- 达到上限时输入框禁用
- props: `selectedTags: TagInfo[]`, `onChange: (tags: TagInfo[], newTagNames: string[]) => void`, `maxTags: number`

使用 CSS 变量，遵循设计系统（参考 `docs/design-system.md`），使用 Lucide React 图标。

- [ ] **Step 2: Commit**

```bash
git add src/features/posts/components/TagInput.tsx src/features/posts/components/TagInput.css
git commit -m "feat(ui): add TagInput component with autocomplete, chips, and pending state"
```

---

### Task 13: 改造 PostForm

**Files:**
- Modify: `src/features/posts/components/PostForm.tsx`

- [ ] **Step 1: 改造 PostForm**

变更点：
1. 分类选择：从硬编码 `CATEGORY_LABELS` 改为 `useEffect` 调用 `postCategoryService.getCategories()` 动态加载
2. 标签输入：替换现有的标签输入（自由文本 input + chips）为 `TagInput` 组件
3. 提交数据：构建 `{ categoryId, tagIds, newTags }` 替代旧的 `{ category, tags }`
4. 从 SystemConfig 获取 maxTagsPerPost（可直接调用 `/api/tags` 或者硬编码为 5 作为前端默认，后端做最终校验）
5. 草稿保存/恢复逻辑需适配新字段

- [ ] **Step 2: 更新 postService 的 createPost/updatePost**

修改 `src/features/posts/services/postService.ts`：
- `createPost` 和 `updatePost` 接受新的 `CreatePostData` / `UpdatePostData` 类型
- 移除旧的 `normalizeTags` 逻辑（后端现在返回 `tags_assoc` 对象数组）

- [ ] **Step 3: 验证发帖流程**

手动启动前后端，尝试发帖，验证分类和标签都正常工作。

- [ ] **Step 4: Commit**

```bash
git add src/features/posts/components/PostForm.tsx src/features/posts/services/postService.ts
git commit -m "feat(ui): adapt PostForm to use dynamic categories and TagInput component"
```

---

### Task 14: 改造 PostCard 和 PostDetail

**Files:**
- Modify: `src/features/posts/components/PostCard.tsx`
- Modify: `src/features/posts/components/PostDetail.tsx`

- [ ] **Step 1: 改造 PostCard**

变更点：
1. 分类显示：从 `CATEGORY_LABELS[post.category]` 改为 `post.postCategory?.name`
2. 标签渲染：从 `post.tags` (string[]) 改为 `post.tags_assoc` (TagInfo[])
3. Pending 标签样式：虚线边框 + "审核中" tooltip（使用 `title` 属性或自定义 tooltip）
4. 向后兼容：如果 `tags_assoc` 不存在，fallback 到 `tags` string[]

- [ ] **Step 2: 改造 PostDetail**

同 PostCard 的变更逻辑。额外的：
- 标签显示可以更丰富（不限制数量，显示完整列表）
- Pending 标签 chip 使用虚线边框 + ⏳ 图标

- [ ] **Step 3: Commit**

```bash
git add src/features/posts/components/PostCard.tsx src/features/posts/components/PostDetail.tsx
git commit -m "feat(ui): adapt PostCard/PostDetail to render Tag objects with pending visibility"
```

---

### Task 15: 改造 CommunityPage

**Files:**
- Modify: `src/features/posts/pages/CommunityPage.tsx`

- [ ] **Step 1: 改造 CommunityPage**

变更点：
1. 分类栏：从硬编码 tabs 改为 `useEffect` + `postCategoryService.getCategories()` 动态加载
2. 标签云：从现有实现改为调用 `tagService.getHotTags()`
3. 点击分类/标签后的筛选逻辑保持不变（传 slug 或 tag name 到 PostFilters）
4. 分类栏加载状态处理（skeleton 或 spinner）

- [ ] **Step 2: Commit**

```bash
git add src/features/posts/pages/CommunityPage.tsx
git commit -m "feat(ui): adapt CommunityPage to use dynamic categories and hot tags API"
```

---

## Chunk 7: 管理后台面板

### Task 16: AdminTagsPanel

**Files:**
- Create: `src/features/admin/components/AdminTagsPanel.tsx`
- Create: `src/features/admin/components/AdminTagsPanel.css`
- Create: `src/features/admin/components/TagMergeModal.tsx`

- [ ] **Step 1: 创建 AdminTagsPanel**

按照设计文档的 wireframe 实现：
- 待审核区域：勾选 + 批量通过/拒绝
- 标签列表：名称、类型(官方/用户)、使用量、状态、操作(编辑/合并/删除)
- 筛选：状态、类型、搜索
- 分页
- 创建官方标签的弹窗

使用 `tagService.adminGetTags()` 等管理员接口。

- [ ] **Step 2: 创建 TagMergeModal**

合并弹窗：
- 选择目标标签（搜索下拉）
- 显示影响帖子数
- 确认合并

- [ ] **Step 3: 在 admin 路由中注册**

在 admin 路由配置（`src/features/admin/` 下的路由文件或 `App.tsx`）中添加标签管理入口。在管理后台侧边栏中添加"标签管理"链接。

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/components/AdminTagsPanel.tsx src/features/admin/components/AdminTagsPanel.css src/features/admin/components/TagMergeModal.tsx
git commit -m "feat(admin): add tag management panel with approve/reject/merge workflows"
```

---

### Task 17: AdminPostCategoriesPanel

**Files:**
- Create: `src/features/admin/components/AdminPostCategoriesPanel.tsx`
- Create: `src/features/admin/components/AdminPostCategoriesPanel.css`

- [ ] **Step 1: 创建 AdminPostCategoriesPanel**

按照设计文档的 wireframe 实现：
- 分类列表：排序号、名称、slug、帖子数、状态、操作(编辑/启用停用)
- 拖拽排序（可使用简单的上下按钮代替拖拽，降低复杂度）
- 新建分类弹窗
- 编辑分类弹窗

使用 `postCategoryService.adminGetCategories()` 等管理员接口。

- [ ] **Step 2: 在 admin 路由中注册**

在管理后台侧边栏中添加"分类管理"链接。

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/components/AdminPostCategoriesPanel.tsx src/features/admin/components/AdminPostCategoriesPanel.css
git commit -m "feat(admin): add post category management panel with reorder and toggle"
```

---

## Chunk 8: PostContext 适配与集成验证

### Task 18: 适配 PostContext

**Files:**
- Modify: `src/contexts/PostContext.tsx`

- [ ] **Step 1: 更新 PostContext**

确保 PostContext 中的 `createPost`, `updatePost` 方法使用新的 `CreatePostData` / `UpdatePostData` 接口。filters 中的 category 参数传递逻辑不变（仍然传 slug），后端已处理兼容。

- [ ] **Step 2: Commit**

```bash
git add src/contexts/PostContext.tsx
git commit -m "feat(context): adapt PostContext to new tag/category data structures"
```

---

### Task 19: 端到端验证

- [ ] **Step 1: 启动前后端**

```bash
cd backend && npm start
# 另一个终端
npm run dev
```

- [ ] **Step 2: 验证以下流程**

1. 社区页面加载：分类栏动态显示、标签云从 API 加载
2. 发帖：选择分类、添加标签（已有 + 新建）、提交成功
3. 帖子列表：标签和分类正确显示，pending 标签仅创建者可见
4. 帖子详情：标签和分类正确显示
5. 管理后台 - 标签管理：列表、审核、合并、删除
6. 管理后台 - 分类管理：列表、新建、编辑、排序、启用/停用

- [ ] **Step 3: 修复发现的问题**

- [ ] **Step 4: 最终 Commit**

```bash
git add -A
git commit -m "fix: integration fixes for post tag and category system"
```
