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

  // 2. Collect all journal IDs that have any user interaction (rating cache OR favorites)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000);

  const caches = await JournalRatingCache.findAll();
  const cachedIds = new Set(caches.map(c => c.journalId));

  // Find journals with favorites that actually exist in online_journals
  const [favoritedRows] = await sequelize.query(
    `SELECT DISTINCT f.journal_id FROM online_favorites f
     INNER JOIN online_journals j ON f.journal_id = j.journal_id`
  );
  const favoritedIds = favoritedRows.map(r => r.journal_id);

  // Merge: all journals that have any interaction
  const allJournalIds = new Set([...cachedIds, ...favoritedIds]);
  let journalCount = 0;

  for (const journalId of allJournalIds) {
    const [recentCommentCount, recentFavoriteCount, totalFavoriteCount, journal, cache] = await Promise.all([
      Comment.count({ where: { journalId, parentId: null, isDeleted: false, createdAt: { [Op.gte]: sevenDaysAgo } } }),
      Favorite.count({ where: { journalId, createdAt: { [Op.gte]: sevenDaysAgo } } }),
      Favorite.count({ where: { journalId } }),
      Journal.findByPk(journalId, { attributes: ['impactFactor'] }),
      JournalRatingCache.findByPk(journalId)
    ]);

    const rating = cache ? cache.rating : 0;
    const ratingCount = cache ? cache.ratingCount : 0;
    const impactFactor = journal ? journal.impactFactor : null;

    const hotScore = calculateJournalHotScore(recentCommentCount, recentFavoriteCount, rating);
    const allTimeScore = calculateJournalAllTimeScore(ratingCount, totalFavoriteCount, rating, impactFactor);

    await JournalRatingCache.upsert({
      journalId,
      hotScore,
      allTimeScore,
      favoriteCount: totalFavoriteCount
    });
    journalCount++;
  }
  console.log(`Updated ${journalCount} journal caches (from ${cachedIds.size} rated + ${favoritedIds.length} favorited)`);

  console.log('\n=== Migration Complete ===');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
