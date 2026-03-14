/**
 * Calculate post trending score (with time decay + new post boost).
 * Formula: (rawScore * decay) + newBoost
 * - decay = 0.5 ^ (hoursAge / 48)  — 48h half-life
 * - newBoost = 20 * (1 - hoursAge/24) for posts < 24h old
 */
function calculatePostHotScore(post) {
  const hoursAge = (Date.now() - new Date(post.createdAt).getTime()) / 3600000;
  const decay = Math.pow(0.5, hoursAge / 48);
  const rawScore = post.commentCount * 5 + post.likeCount * 3 + post.favoriteCount * 2 + post.viewCount * 0.1;
  const newBoost = hoursAge < 24 ? 20 * (1 - hoursAge / 24) : 0;
  return Math.round((rawScore * decay + newBoost) * 100) / 100;
}

/**
 * Calculate post all-time score (pure cumulative, no decay).
 */
function calculatePostAllTimeScore(post) {
  const rawScore = post.commentCount * 5 + post.likeCount * 3 + post.favoriteCount * 2 + post.viewCount * 0.1;
  return Math.round(rawScore * 100) / 100;
}

/**
 * Calculate journal trending score from recent activity (7-day window).
 */
function calculateJournalHotScore(recentCommentCount, recentFavoriteCount, rating) {
  return Math.round((recentCommentCount * 5 + recentFavoriteCount * 3 + (rating || 0) * 2) * 100) / 100;
}

/**
 * Calculate journal all-time score.
 * Requires JOIN to online_journals for impactFactor.
 */
function calculateJournalAllTimeScore(ratingCount, favoriteCount, rating, impactFactor) {
  return Math.round((ratingCount * 5 + favoriteCount * 3 + (rating || 0) * 2 + (impactFactor || 0) * 1) * 100) / 100;
}

/**
 * Recalculate and persist a post's hotScore and allTimeScore.
 * Call this after any engagement event (like, comment, favorite).
 * @param {object} post - Sequelize Post instance (must have count fields + createdAt)
 */
async function updatePostScores(post) {
  const hotScore = calculatePostHotScore(post);
  const allTimeScore = calculatePostAllTimeScore(post);
  await post.update({ hotScore, allTimeScore });
}

module.exports = {
  calculatePostHotScore,
  calculatePostAllTimeScore,
  calculateJournalHotScore,
  calculateJournalAllTimeScore,
  updatePostScores
};
