# Hot Ranking System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement "trending" (time-decay) and "all-time" hot ranking for posts and journals.

**Architecture:** Event-driven score updates on user interactions (like/comment/favorite) + hourly cron for time decay. Scores stored in DB fields with indexes for fast sorting. Utility module `backend/utils/hotScore.js` centralizes all formulas.

**Tech Stack:** Node.js, Sequelize ORM, MySQL, node-cron, React/TypeScript

**Spec:** `docs/superpowers/specs/2026-03-14-hot-ranking-design.md`

---

## Chunk 1: Backend Core

### Task 1: Hot Score Utility Module

**Files:**
- Create: `backend/utils/hotScore.js`
- Test: `backend/__tests__/unit/hotScore.test.js`

- [ ] **Step 1: Write unit tests for all 4 scoring functions**

```javascript
// backend/__tests__/unit/hotScore.test.js
const {
  calculatePostHotScore,
  calculatePostAllTimeScore,
  calculateJournalHotScore,
  calculateJournalAllTimeScore
} = require('../../utils/hotScore');

describe('hotScore utils', () => {
  describe('calculatePostAllTimeScore', () => {
    it('should weight: comments(5) > likes(3) > favorites(2) > views(0.1)', () => {
      const post = { commentCount: 1, likeCount: 1, favoriteCount: 1, viewCount: 1 };
      expect(calculatePostAllTimeScore(post)).toBe(10.1);
    });

    it('should return 0 for zero engagement', () => {
      const post = { commentCount: 0, likeCount: 0, favoriteCount: 0, viewCount: 0 };
      expect(calculatePostAllTimeScore(post)).toBe(0);
    });
  });

  describe('calculatePostHotScore', () => {
    it('should give new post (0h) a boost of 20', () => {
      const post = {
        commentCount: 0, likeCount: 0, favoriteCount: 0, viewCount: 0,
        createdAt: new Date()
      };
      const score = calculatePostHotScore(post);
      expect(score).toBeCloseTo(20, 0);
    });

    it('should decay engagement by half after 48 hours', () => {
      const now = Date.now();
      const post = {
        commentCount: 10, likeCount: 0, favoriteCount: 0, viewCount: 0,
        createdAt: new Date(now - 48 * 3600000)
      };
      // rawScore=50, decay=0.5, newBoost=0 => 25
      expect(calculatePostHotScore(post)).toBeCloseTo(25, 0);
    });

    it('should have no newBoost after 24 hours', () => {
      const now = Date.now();
      const post = {
        commentCount: 0, likeCount: 0, favoriteCount: 0, viewCount: 0,
        createdAt: new Date(now - 25 * 3600000)
      };
      expect(calculatePostHotScore(post)).toBe(0);
    });
  });

  describe('calculateJournalHotScore', () => {
    it('should weight: recentComments(5) > recentFavorites(3) > rating(2)', () => {
      expect(calculateJournalHotScore(2, 1, 4.5)).toBe(22);
    });

    it('should handle null rating', () => {
      expect(calculateJournalHotScore(1, 0, null)).toBe(5);
    });
  });

  describe('calculateJournalAllTimeScore', () => {
    it('should include impactFactor', () => {
      // ratingCount(5)*5 + favoriteCount(2)*3 + rating(4)*2 + impactFactor(3)*1
      expect(calculateJournalAllTimeScore(5, 2, 4, 3)).toBe(42);
    });

    it('should handle null impactFactor and rating', () => {
      expect(calculateJournalAllTimeScore(1, 0, null, null)).toBe(5);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npx jest __tests__/unit/hotScore.test.js --verbose`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the utility module**

```javascript
// backend/utils/hotScore.js

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

module.exports = {
  calculatePostHotScore,
  calculatePostAllTimeScore,
  calculateJournalHotScore,
  calculateJournalAllTimeScore
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npx jest __tests__/unit/hotScore.test.js --verbose`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/utils/hotScore.js backend/__tests__/unit/hotScore.test.js
git commit -m "feat(hot-ranking): add hot score utility functions with tests"
```

---

### Task 2: Database Schema Changes — Post Model

**Files:**
- Modify: `backend/models/Post.js:75-116`

- [ ] **Step 1: Add `allTimeScore` field to Post model**

In `backend/models/Post.js`, add after the `hotScore` field (after line 83):

```javascript
  allTimeScore: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'all_time_score',
    get() {
      const val = this.getDataValue('allTimeScore');
      return val === null ? 0 : parseFloat(val);
    }
  },
```

And add index in the `indexes` array (after the `hot_score` index, line 112):

```javascript
    {
      fields: ['all_time_score']
    },
```

- [ ] **Step 2: Verify model loads without errors**

Run: `cd backend && node -e "const Post = require('./models/Post'); console.log(Object.keys(Post.rawAttributes))"`
Expected: Output includes `allTimeScore`

- [ ] **Step 3: Commit**

```bash
git add backend/models/Post.js
git commit -m "feat(hot-ranking): add allTimeScore field to Post model"
```

---

### Task 3: Database Schema Changes — JournalRatingCache Model

**Files:**
- Modify: `backend/models/JournalRatingCache.js:55-68`

- [ ] **Step 1: Add `hotScore`, `allTimeScore`, `favoriteCount` fields**

In `backend/models/JournalRatingCache.js`, add after the `overallExperience` field (after line 62, before the closing `}`):

```javascript
  hotScore: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'hot_score',
    get() {
      const val = this.getDataValue('hotScore');
      return val === null ? 0 : parseFloat(val);
    }
  },
  allTimeScore: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'all_time_score',
    get() {
      const val = this.getDataValue('allTimeScore');
      return val === null ? 0 : parseFloat(val);
    }
  },
  favoriteCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'favorite_count'
  }
```

- [ ] **Step 2: Verify model loads**

Run: `cd backend && node -e "const JRC = require('./models/JournalRatingCache'); console.log(Object.keys(JRC.rawAttributes))"`
Expected: Output includes `hotScore`, `allTimeScore`, `favoriteCount`

- [ ] **Step 3: Commit**

```bash
git add backend/models/JournalRatingCache.js
git commit -m "feat(hot-ranking): add hotScore, allTimeScore, favoriteCount to JournalRatingCache"
```

---

### Task 4: Post Score Update Helper

Create a helper function that recalculates and saves a post's scores, to be called from engagement controllers.

**Files:**
- Modify: `backend/utils/hotScore.js` (add `updatePostScores` function)

- [ ] **Step 1: Add `updatePostScores` async helper**

Append to `backend/utils/hotScore.js`:

```javascript
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
```

- [ ] **Step 2: Commit**

```bash
git add backend/utils/hotScore.js
git commit -m "feat(hot-ranking): add updatePostScores helper"
```

---

### Task 5: Integrate Score Updates into Post Engagement Controllers

**Files:**
- Modify: `backend/controllers/postController.js:1,293-350` (toggleLike, toggleFavorite, incrementViewCount)
- Modify: `backend/controllers/postCommentController.js:86-144` (createComment)

- [ ] **Step 1: Add import to postController.js**

At top of `backend/controllers/postController.js` (after line 2), add:

```javascript
const { updatePostScores } = require('../utils/hotScore');
```

- [ ] **Step 2: Update `toggleLike` — add score recalculation after like/unlike**

In `backend/controllers/postController.js`, replace the `toggleLike` function body (lines 306-316). After `reload()`, the post's counts are fresh from DB, so use `post.likeCount` directly (NOT `post.likeCount - 1`):

**Unlike branch** — replace lines 308-310:
```javascript
            await existingLike.destroy();
            await post.decrement('likeCount');
            await post.reload();
            await updatePostScores(post);
            res.json({ liked: false, likeCount: post.likeCount });
```

**Like branch** — replace lines 313-315:
```javascript
            await PostLike.create({ postId: id, userId: req.user.id });
            await post.increment('likeCount');
            await post.reload();
            await updatePostScores(post);
            res.json({ liked: true, likeCount: post.likeCount });
```

- [ ] **Step 3: Update `toggleFavorite` — same pattern**

**Unfavorite branch** — replace lines 338-340:
```javascript
            await existingFavorite.destroy();
            await post.decrement('favoriteCount');
            await post.reload();
            await updatePostScores(post);
            res.json({ favorited: false, favoriteCount: post.favoriteCount });
```

**Favorite branch** — replace lines 342-344:
```javascript
            await PostFavorite.create({ postId: id, userId: req.user.id });
            await post.increment('favoriteCount');
            await post.reload();
            await updatePostScores(post);
            res.json({ favorited: true, favoriteCount: post.favoriteCount });
```

- [ ] **Step 4: Update `incrementViewCount` — only update allTimeScore (per spec, skip hotScore for views)**

In `incrementViewCount`, after `await post.increment('viewCount');` (line 283), add. Use the already-imported module (do NOT add a second `require` inside the function):

```javascript
        await post.reload();
        await post.update({ allTimeScore: require('../utils/hotScore').calculatePostAllTimeScore(post) });
```

Note: The module-level import `updatePostScores` is already available from Step 1, but here we only need `calculatePostAllTimeScore` to avoid computing hotScore on every view.

- [ ] **Step 5: Update `postCommentController.js` — add score recalculation on comment creation AND deletion**

In `backend/controllers/postCommentController.js`, add import at top (after existing requires):
```javascript
const { updatePostScores } = require('../utils/hotScore');
```

After `await post.increment('commentCount');` (line 130), add:
```javascript
        await post.reload();
        await updatePostScores(post);
```

Also in the `deleteComment` function: after the soft delete of a comment, if the post's `commentCount` should be decremented, add score update. Find the `deleteComment` function and after the comment soft-delete logic, add:
```javascript
        // Decrement post comment count and update scores
        const post = await Post.findByPk(comment.postId);
        if (post) {
          await post.decrement('commentCount');
          await post.reload();
          await updatePostScores(post);
        }
```

- [ ] **Step 6: Commit**

```bash
git add backend/controllers/postController.js backend/controllers/postCommentController.js
git commit -m "feat(hot-ranking): integrate score updates into post engagement controllers"
```

---

### Task 6: Integrate Score Updates into Journal Engagement Controllers

**Files:**
- Modify: `backend/controllers/commentController.js:27-90,283-303` (updateJournalRatingCache, createComment)
- Modify: `backend/controllers/favoriteController.js:1-43,46-63` (addFavorite, removeFavorite)

- [ ] **Step 1: Update `commentController.js` — recalculate journal scores after rating cache update**

In `backend/controllers/commentController.js`:

1. Add `Favorite` to the existing destructure on line 1:
```javascript
const { Comment, CommentLike, Journal, JournalRatingCache, User, Badge, UserBadge, Favorite } = require('../models');
```

2. Add import after line 3:
```javascript
const { calculateJournalHotScore, calculateJournalAllTimeScore } = require('../utils/hotScore');
```

In the `updateJournalRatingCache` function, after the `JournalRatingCache.upsert(...)` call (after line 83), add journal score update logic:

```javascript
    // Update hot ranking scores
    const { Op } = require('sequelize');
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000);

    // Count recent comments (7 days)
    const recentCommentCount = await Comment.count({
      where: { journalId, parentId: null, isDeleted: false, createdAt: { [Op.gte]: sevenDaysAgo } }
    });

    // Count recent favorites (7 days)
    const recentFavoriteCount = await Favorite.count({
      where: { journalId, createdAt: { [Op.gte]: sevenDaysAgo } }
    });

    // Count total favorites
    const totalFavoriteCount = await Favorite.count({ where: { journalId } });

    // Get impactFactor from Journal table
    const journal = await Journal.findByPk(journalId, { attributes: ['impactFactor'] });
    const impactFactor = journal ? journal.impactFactor : null;

    const hotScore = calculateJournalHotScore(recentCommentCount, recentFavoriteCount, rating);
    const allTimeScore = calculateJournalAllTimeScore(
      topLevelComments.length, totalFavoriteCount, rating, impactFactor
    );

    await JournalRatingCache.update(
      { hotScore, allTimeScore, favoriteCount: totalFavoriteCount },
      { where: { journalId } }
    );
```

- [ ] **Step 2: Update `favoriteController.js` — update journal scores on favorite/unfavorite**

In `backend/controllers/favoriteController.js`:

1. Add `Comment` to the existing destructure on line 1:
```javascript
const { Favorite, Journal, JournalLevel, JournalRatingCache, Comment } = require('../models');
```

2. Add imports after line 2:
```javascript
const { calculateJournalHotScore, calculateJournalAllTimeScore } = require('../utils/hotScore');
const { Op } = require('sequelize');
```

In `addFavorite`, after `Favorite.create(...)` (after line 25), add:
```javascript
        // Update journal hot ranking scores
        await updateJournalScoresOnFavorite(journalId);
```

In `removeFavorite`, after `favorite.destroy()` (after line 58), add:
```javascript
        // Update journal hot ranking scores
        await updateJournalScoresOnFavorite(journalId);
```

Add the helper function at the bottom of the file (before `module.exports`):
```javascript
// Helper: recalculate journal scores after favorite change
async function updateJournalScoresOnFavorite(journalId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000);

  const [recentCommentCount, recentFavoriteCount, totalFavoriteCount, cache, journal] = await Promise.all([
    Comment.count({ where: { journalId, parentId: null, isDeleted: false, createdAt: { [Op.gte]: sevenDaysAgo } } }),
    Favorite.count({ where: { journalId, createdAt: { [Op.gte]: sevenDaysAgo } } }),
    Favorite.count({ where: { journalId } }),
    JournalRatingCache.findByPk(journalId),
    Journal.findByPk(journalId, { attributes: ['impactFactor'] })
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
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/controllers/commentController.js backend/controllers/favoriteController.js
git commit -m "feat(hot-ranking): integrate score updates into journal engagement controllers"
```

---

### Task 7: Cron Jobs for Time Decay

**Files:**
- Create: `backend/jobs/hotRankingCron.js`
- Modify: `backend/server.js:146-149`

- [ ] **Step 1: Install node-cron**

Run: `cd backend && npm install node-cron`

- [ ] **Step 2: Create cron job module**

```javascript
// backend/jobs/hotRankingCron.js
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
  if (isRunning) {
    console.log('[HotRanking] Skipping — previous job still running');
    return;
  }
  isRunning = true;

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000);

    // Update recent posts (within 7 days) with fresh hotScore
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

    // Zero out hotScore for posts older than 7 days (stale scores)
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
  } finally {
    isRunning = false;
  }
}

async function updateJournalHotScores() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000);

    // Get all journals that have a rating cache
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
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[HotRanking] Starting hourly update...');
    await updatePostTimeDecay();
    await updateJournalHotScores();
  });

  console.log('[HotRanking] Cron jobs scheduled (hourly)');
}

module.exports = { startHotRankingCron, updatePostTimeDecay, updateJournalHotScores };
```

- [ ] **Step 3: Register cron in server.js**

In `backend/server.js`, add import at top (after line 20):
```javascript
const { startHotRankingCron } = require('./jobs/hotRankingCron');
```

In the `startServer` function, after `app.listen(...)` callback (after line 148, inside the callback):
```javascript
      // Start hot ranking cron jobs
      startHotRankingCron();
```

- [ ] **Step 4: Commit**

```bash
git add backend/jobs/hotRankingCron.js backend/server.js backend/package.json backend/package-lock.json
git commit -m "feat(hot-ranking): add hourly cron for post decay and journal score updates"
```

---

### Task 8: Post API Sorting Updates

**Files:**
- Modify: `backend/controllers/postController.js:34-52`

- [ ] **Step 1: Add `allTime` sort option and `isPinned` ordering**

In `backend/controllers/postController.js`, replace the sorting switch block (lines 34-52):

```javascript
        // 排序逻辑
        let order;
        switch (sortBy) {
            case 'latest':
                order = [['isPinned', 'DESC'], ['createdAt', 'DESC']];
                break;
            case 'likes':
                order = [['isPinned', 'DESC'], ['likeCount', 'DESC']];
                break;
            case 'comments':
                order = [['isPinned', 'DESC'], ['commentCount', 'DESC']];
                break;
            case 'views':
                order = [['isPinned', 'DESC'], ['viewCount', 'DESC']];
                break;
            case 'allTime':
                order = [['isPinned', 'DESC'], ['allTimeScore', 'DESC'], ['createdAt', 'DESC']];
                break;
            case 'hot':
            default:
                order = [['isPinned', 'DESC'], ['hotScore', 'DESC'], ['createdAt', 'DESC']];
        }
```

- [ ] **Step 2: Commit**

```bash
git add backend/controllers/postController.js
git commit -m "feat(hot-ranking): add allTime sort and isPinned ordering to posts API"
```

---

### Task 9: Journal API Sorting Updates

**Files:**
- Modify: `backend/controllers/journalController.js:56-135`

- [ ] **Step 1: Add hot/allTime sort support to `getJournals`**

In `backend/controllers/journalController.js`, in the `getJournals` function, after parsing sort params (after line 112, before `needsMemorySort` check), add early return for hot ranking sorts:

```javascript
        // Hot ranking sorts (bypass multi-field sort logic)
        if (sortBy === 'hot' || sortBy === 'allTime') {
          const scoreField = sortBy === 'hot' ? 'hot_score' : 'all_time_score';

          const queryOpts = {
            where,
            include: [
              { model: JournalLevel, as: 'levels', attributes: ['levelName'] },
              { model: JournalRatingCache, as: 'ratingCache' },
              { model: Category, as: 'categories', attributes: ['name'], through: { attributes: [] } }
            ],
            order: [[
              { model: JournalRatingCache, as: 'ratingCache' },
              scoreField,
              'DESC'
            ]],
            offset: Number(offset),
            limit: Number(limit),
            distinct: true,
            subQuery: false
          };

          const { count, rows } = await Journal.findAndCountAll(queryOpts);

          let journals = rows.map(j => {
            const data = j.toJSON();
            data.levels = data.levels ? data.levels.map(l => l.levelName) : [];
            data.category = data.categories ? data.categories.map(c => c.name).join(' / ') : '';
            return data;
          });

          // 登录用户：批量查收藏状态
          if (req.user) {
            const journalIds = journals.map(j => j.journalId);
            const favorites = await Favorite.findAll({
              where: { userId: req.user.id, journalId: journalIds },
              attributes: ['journalId']
            });
            const favSet = new Set(favorites.map(f => f.journalId));
            journals.forEach(j => { j.isFavorited = favSet.has(j.journalId); });
          }

          return res.status(200).json({
            success: true,
            data: {
              journals,
              pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: Number(limit)
              }
            }
          });
        }
```

- [ ] **Step 2: Commit**

```bash
git add backend/controllers/journalController.js
git commit -m "feat(hot-ranking): add hot/allTime sort to journals API"
```

---

### Task 10: Data Migration Script

**Files:**
- Create: `backend/scripts/migrateHotScores.js`

- [ ] **Step 1: Create idempotent migration script**

```javascript
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
```

- [ ] **Step 2: Run the migration**

Run: `cd backend && node scripts/migrateHotScores.js`
Expected: Outputs count of updated posts and journals, exits cleanly

- [ ] **Step 3: Commit**

```bash
git add backend/scripts/migrateHotScores.js
git commit -m "feat(hot-ranking): add idempotent data migration script"
```

---

## Chunk 2: Frontend Changes

### Task 11: Post Type and Sort Options Update

**Files:**
- Modify: `src/features/posts/types/post.ts:76-85,103-109`

- [ ] **Step 1: Add `allTime` to PostFilters sortBy type**

In `src/features/posts/types/post.ts`, update `PostFilters` interface (line 81):

```typescript
  sortBy?: 'hot' | 'latest' | 'likes' | 'comments' | 'views' | 'allTime';
```

- [ ] **Step 2: Add `allTime` to SORT_OPTIONS**

In the same file, update `SORT_OPTIONS` (lines 103-109):

```typescript
export const SORT_OPTIONS = [
  { value: 'hot', label: '综合热度' },
  { value: 'allTime', label: '历史最热' },
  { value: 'latest', label: '最新发布' },
  { value: 'likes', label: '最多点赞' },
  { value: 'comments', label: '最多回复' },
  { value: 'views', label: '最多浏览' }
];
```

- [ ] **Step 3: Add `allTimeScore` to Post interface**

In the same file, after `hotScore: number;` (line 24), add:

```typescript
  allTimeScore: number;
```

- [ ] **Step 4: Commit**

```bash
git add src/features/posts/types/post.ts
git commit -m "feat(hot-ranking): add allTime sort option to post types"
```

---

### Task 12: Journal Sorting UI — Add Hot Ranking Quick Buttons

**Files:**
- Modify: `src/contexts/JournalContext.tsx:47-55,69-85,86-104,113-195`
- Modify: `src/features/journals/components/SearchAndFilter.tsx:128-264`

- [ ] **Step 1: Add `hotSortMode` state to JournalContext**

In `src/contexts/JournalContext.tsx`:

Add to `FilterState` interface (after `sortExpanded: boolean;`, line 54):
```typescript
  hotSortMode: 'hot' | 'allTime' | null;
```

Add to `JournalAction` type (after the `CLEAR_FILTERS` action, line 85):
```typescript
  | { type: 'SET_HOT_SORT_MODE'; payload: 'hot' | 'allTime' | null };
```

Update `initialState` (add after `sortExpanded: false,`, line 101):
```typescript
  hotSortMode: null,
```

Add reducer case (after the `CLEAR_FILTERS` case, before `default`, around line 193):
```typescript
    case 'SET_HOT_SORT_MODE':
      return {
        ...state,
        hotSortMode: action.payload,
        // Clear multi-field sorts when using hot sort mode
        sortFields: action.payload ? {} : state.sortFields
      };
```

Update `CLEAR_FILTERS` case to reset `hotSortMode`:
```typescript
    case 'CLEAR_FILTERS':
      return {
        ...state,
        searchQuery: '',
        selectedCategory: '',
        selectedCategoryId: null,
        minRating: 0,
        sortFields: {},
        hotSortMode: null,
        filteredJournals: state.journals
      };
```

- [ ] **Step 2: Update sortByParam to use hotSortMode**

In the `JournalProvider`, update the `sortByParam` computation (line 253):

```typescript
  // Hot sort mode overrides multi-field sort
  const sortByParam = state.hotSortMode || sortFieldsToString(state.sortFields);
```

- [ ] **Step 3: Update SearchAndFilter with hot sort buttons**

In `src/features/journals/components/SearchAndFilter.tsx`, destructure `hotSortMode` from `useJournals()` and add quick sort buttons.

First, add `hotSortMode` and `setHotSortMode` to the destructured values from `useJournals()` (around line 129-146):

```tsx
  const {
    // ... existing destructured values ...
    hotSortMode,
    setHotSortMode,
  } = useJournals();
```

Then, after the sort trigger button (after line 220, before `{hasActiveFilters && (`), add:

```tsx
        <div className="hot-sort-group">
          <button
            className={`filter-trigger${hotSortMode === 'hot' ? ' has-value' : ''}`}
            onClick={() => setHotSortMode(hotSortMode === 'hot' ? null : 'hot')}
          >
            <span className="ft-label">近期热门</span>
          </button>
          <button
            className={`filter-trigger${hotSortMode === 'allTime' ? ' has-value' : ''}`}
            onClick={() => setHotSortMode(hotSortMode === 'allTime' ? null : 'allTime')}
          >
            <span className="ft-label">历史最热</span>
          </button>
        </div>
```

- [ ] **Step 4: Update `useJournals` hook**

In `src/hooks/useJournals.ts`, add `hotSortMode` to the returned values and add `setHotSortMode` dispatcher:

```typescript
hotSortMode: state.hotSortMode,
setHotSortMode: (mode: 'hot' | 'allTime' | null) => dispatch({ type: 'SET_HOT_SORT_MODE', payload: mode }),
```

- [ ] **Step 5: Commit**

```bash
git add src/contexts/JournalContext.tsx src/features/journals/components/SearchAndFilter.tsx src/hooks/useJournals.ts
git commit -m "feat(hot-ranking): add hot/allTime sort buttons to journal search UI"
```

---

### Task 13: Verify End-to-End

- [ ] **Step 1: Run backend tests**

Run: `cd backend && npm test`
Expected: All existing tests pass + new hotScore tests pass

- [ ] **Step 2: Run frontend tests**

Run: `npm test`
Expected: All existing tests pass

- [ ] **Step 3: Run the migration script**

Run: `cd backend && node scripts/migrateHotScores.js`
Expected: Migration completes successfully

- [ ] **Step 4: Manual smoke test**

1. Start backend: `cd backend && npm start`
2. Start frontend: `npm run dev`
3. Verify: `/api/posts?sortBy=hot` returns posts sorted by hotScore
4. Verify: `/api/posts?sortBy=allTime` returns posts sorted by allTimeScore
5. Verify: `/api/journals?sortBy=hot` returns journals sorted by hotScore
6. Verify: `/api/journals?sortBy=allTime` returns journals sorted by allTimeScore
7. Verify: Like a post, refresh, check score changed
8. Verify: New post appears in hot list with boost

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(hot-ranking): complete hot ranking system implementation"
```
