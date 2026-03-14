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
      expect(calculateJournalAllTimeScore(5, 2, 4, 3)).toBe(42);
    });

    it('should handle null impactFactor and rating', () => {
      expect(calculateJournalAllTimeScore(1, 0, null, null)).toBe(5);
    });
  });
});
