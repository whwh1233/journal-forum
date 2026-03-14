const cron = require('node-cron');
const { Op } = require('sequelize');
const { Post, Comment, Favorite, Journal, JournalRatingCache } = require('../models');
const {
  calculatePostHotScore,
  calculateJournalHotScore,
  calculateJournalAllTimeScore
} = require('../utils/hotScore');

let isRunning = false;

async function updatePostTimeDecay() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000);

    const recentPosts = await Post.findAll({
      where: {
        isDeleted: false,
        status: 'published',
        createdAt: { [Op.gte]: sevenDaysAgo }
      }
    });

    for (const post of recentPosts) {
      const hotScore = calculatePostHotScore(post);
      await post.update({ hotScore });
    }

    await Post.update(
      { hotScore: 0 },
      {
        where: {
          createdAt: { [Op.lt]: sevenDaysAgo },
          hotScore: { [Op.gt]: 0 }
        }
      }
    );

    console.log(`[HotRanking] Updated ${recentPosts.length} post scores, zeroed old posts`);
  } catch (error) {
    console.error('[HotRanking] Post decay update failed:', error);
  }
}

async function updateJournalHotScores() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000);
    const caches = await JournalRatingCache.findAll();

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
    }

    console.log(`[HotRanking] Updated ${caches.length} journal scores`);
  } catch (error) {
    console.error('[HotRanking] Journal score update failed:', error);
  }
}

function startHotRankingCron() {
  cron.schedule('0 * * * *', async () => {
    if (isRunning) {
      console.log('[HotRanking] Skipping — previous job still running');
      return;
    }
    isRunning = true;
    try {
      console.log('[HotRanking] Starting hourly update...');
      await updatePostTimeDecay();
      await updateJournalHotScores();
    } finally {
      isRunning = false;
    }
  });

  console.log('[HotRanking] Cron jobs scheduled (hourly)');
}

module.exports = { startHotRankingCron, updatePostTimeDecay, updateJournalHotScores };
