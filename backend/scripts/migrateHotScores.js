// backend/scripts/migrateHotScores.js
// Usage: cd backend && node scripts/migrateHotScores.js
// Idempotent — safe to re-run.

require('dotenv').config();
const { connectDB } = require('../config/database');
const { syncDatabase } = require('../models');
const { Post, Comment, Favorite, Journal, JournalRatingCache } = require('../models');
const { Op } = require('sequelize');
const {
  calculatePostHotScore,
  calculatePostAllTimeScore,
  calculateJournalHotScore,
  calculateJournalAllTimeScore
} = require('../utils/hotScore');

async function migrate() {
  await connectDB();

  // Add new columns if they don't exist (avoid syncDatabase alter which can fail on FK constraints)
  const { sequelize } = require('../config/database');
  const addColumnIfNotExists = async (table, column, type) => {
    try {
      await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${type}`);
      console.log(`Added column ${table}.${column}`);
    } catch (e) {
      if (e.original && e.original.code === 'ER_DUP_FIELDNAME') {
        console.log(`Column ${table}.${column} already exists`);
      } else {
        throw e;
      }
    }
  };

  await addColumnIfNotExists('online_posts', 'all_time_score', 'DECIMAL(10,2) DEFAULT 0');
  await addColumnIfNotExists('journal_rating_cache', 'hot_score', 'DECIMAL(10,2) DEFAULT 0');
  await addColumnIfNotExists('journal_rating_cache', 'all_time_score', 'DECIMAL(10,2) DEFAULT 0');
  await addColumnIfNotExists('journal_rating_cache', 'favorite_count', 'INT DEFAULT 0');

  // Add index if not exists
  try {
    await sequelize.query('CREATE INDEX `online_posts_all_time_score` ON `online_posts` (`all_time_score`)');
    console.log('Added index on online_posts.all_time_score');
  } catch (e) {
    if (e.original && e.original.code === 'ER_DUP_KEYNAME') {
      console.log('Index online_posts_all_time_score already exists');
    } else {
      throw e;
    }
  }

  console.log('\n=== Hot Score Migration ===\n');

  // 1. Update all posts
  const posts = await Post.findAll({ where: { isDeleted: false, status: 'published' } });
  let postCount = 0;
  for (const post of posts) {
    const hotScore = calculatePostHotScore(post);
    const allTimeScore = calculatePostAllTimeScore(post);
    await post.update({ hotScore, allTimeScore });
    postCount++;
  }
  console.log(`Updated ${postCount} posts`);

  // 2. Update all journals with rating cache
  const caches = await JournalRatingCache.findAll();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000);
  let journalCount = 0;

  for (const cache of caches) {
    const journalId = cache.journalId;

    const [recentCommentCount, recentFavoriteCount, totalFavoriteCount, journal] = await Promise.all([
      Comment.count({ where: { journalId, parentId: null, isDeleted: false, createdAt: { [Op.gte]: sevenDaysAgo } } }),
      Favorite.count({ where: { journalId, createdAt: { [Op.gte]: sevenDaysAgo } } }),
      Favorite.count({ where: { journalId } }),
      Journal.findByPk(journalId, { attributes: ['impactFactor'] })
    ]);

    const hotScore = calculateJournalHotScore(recentCommentCount, recentFavoriteCount, cache.rating);
    const allTimeScore = calculateJournalAllTimeScore(
      cache.ratingCount, totalFavoriteCount, cache.rating,
      journal ? journal.impactFactor : null
    );

    await cache.update({ hotScore, allTimeScore, favoriteCount: totalFavoriteCount });
    journalCount++;
  }
  console.log(`Updated ${journalCount} journal caches`);

  console.log('\n=== Migration Complete ===');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
