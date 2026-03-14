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
  await syncDatabase({ alter: true });

  console.log('=== Hot Score Migration ===\n');

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
