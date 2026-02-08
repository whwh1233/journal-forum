const { getDB } = require('../config/databaseLowdb');
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 6);

/**
 * 将旧的 journal.reviews 迁移到新的 comments 表
 * 旧评论标记为 userId: 0 (匿名)
 */
const migrateReviewsToComments = async () => {
  const db = getDB();

  // 确保 comments 数组存在
  if (!db.data.comments) {
    db.data.comments = [];
  }

  // 确保 migrated 标记存在
  if (!db.data.migrated) {
    db.data.migrated = {};
  }

  // 如果已经迁移过，跳过
  if (db.data.migrated.comments) {
    console.log('Comments already migrated, skipping...');
    return;
  }

  console.log('Starting migration of reviews to comments...');

  let migratedCount = 0;

  // 遍历所有期刊
  db.data.journals.forEach(journal => {
    if (journal.reviews && Array.isArray(journal.reviews)) {
      journal.reviews.forEach((review, index) => {
        // 生成旧评论的唯一 ID
        const commentId = `${journal.id}-legacy-${index}-${nanoid()}`;

        // 检查是否已经存在这个评论（避免重复迁移）
        const exists = db.data.comments.find(c =>
          c.journalId === journal.id &&
          c.content === review.content &&
          c.userName === review.author
        );

        if (!exists) {
          db.data.comments.push({
            id: commentId,
            userId: 0,  // 匿名旧数据
            userName: review.author || '匿名用户',
            journalId: journal.id,
            parentId: null,
            content: review.content,
            rating: review.rating,
            createdAt: review.createdAt || new Date().toISOString(),
            isDeleted: false
          });

          migratedCount++;
        }
      });
    }
  });

  // 标记已迁移
  db.data.migrated.comments = true;
  await db.write();

  console.log(`Migration completed: ${migratedCount} reviews migrated to comments`);
};

module.exports = { migrateReviewsToComments };
