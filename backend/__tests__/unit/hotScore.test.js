const {
  calculatePostHotScore,
  calculatePostAllTimeScore,
  calculateJournalHotScore,
  calculateJournalAllTimeScore,
  updatePostScores
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

    it('should handle very large viewCount without precision loss', () => {
      const post = { commentCount: 0, likeCount: 0, favoriteCount: 0, viewCount: 1000000 };
      expect(calculatePostAllTimeScore(post)).toBe(100000);
    });

    it('should return NaN when fields are undefined (no defensive guard)', () => {
      const post = { commentCount: undefined, likeCount: null, favoriteCount: 0, viewCount: 0 };
      const score = calculatePostAllTimeScore(post);
      expect(isNaN(score)).toBe(true);
    });

    it('should round floating point results to 2 decimal places', () => {
      const post = { commentCount: 0, likeCount: 0, favoriteCount: 0, viewCount: 3 };
      expect(calculatePostAllTimeScore(post)).toBe(0.3);
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

    it('should give 12h post a boost of ~10 (linear midpoint)', () => {
      const now = Date.now();
      const post = {
        commentCount: 0, likeCount: 0, favoriteCount: 0, viewCount: 0,
        createdAt: new Date(now - 12 * 3600000)
      };
      const score = calculatePostHotScore(post);
      expect(score).toBeCloseTo(10, 0);
    });

    it('should decay to ~25% after 96 hours (two half-lives)', () => {
      const now = Date.now();
      // rawScore = 10 * 5 = 50, decay = 0.5^(96/48) = 0.25 → 50 * 0.25 = 12.5
      const post = {
        commentCount: 10, likeCount: 0, favoriteCount: 0, viewCount: 0,
        createdAt: new Date(now - 96 * 3600000)
      };
      expect(calculatePostHotScore(post)).toBeCloseTo(12.5, 0);
    });

    it('should be near zero after 168 hours (7 days)', () => {
      const now = Date.now();
      // rawScore = 10*5 + 10*3 + 10*2 + 100*0.1 = 50+30+20+10 = 110, decay = 0.5^(168/48) ≈ 0.088
      const post = {
        commentCount: 10, likeCount: 10, favoriteCount: 10, viewCount: 100,
        createdAt: new Date(now - 168 * 3600000)
      };
      const score = calculatePostHotScore(post);
      expect(score).toBeLessThan(10);
      expect(score).toBeGreaterThan(0);
    });

    it('should return 0 for zero engagement post older than 24h', () => {
      const now = Date.now();
      const post = {
        commentCount: 0, likeCount: 0, favoriteCount: 0, viewCount: 0,
        createdAt: new Date(now - 48 * 3600000)
      };
      expect(calculatePostHotScore(post)).toBe(0);
    });

    it('should handle future createdAt (negative hoursAge)', () => {
      const post = {
        commentCount: 1, likeCount: 1, favoriteCount: 1, viewCount: 10,
        createdAt: new Date(Date.now() + 3600000) // 1h in the future
      };
      const score = calculatePostHotScore(post);
      expect(typeof score).toBe('number');
      expect(isNaN(score)).toBe(false);
    });

    it('should handle negative engagement values without crashing', () => {
      const post = {
        commentCount: -1, likeCount: -2, favoriteCount: 0, viewCount: 0,
        createdAt: new Date()
      };
      const score = calculatePostHotScore(post);
      expect(typeof score).toBe('number');
      expect(isNaN(score)).toBe(false);
    });
  });

  describe('calculateJournalHotScore', () => {
    it('should weight: recentComments(5) > recentFavorites(3) > rating(2)', () => {
      expect(calculateJournalHotScore(2, 1, 4.5)).toBe(22);
    });

    it('should handle null rating', () => {
      expect(calculateJournalHotScore(1, 0, null)).toBe(5);
    });

    it('should return 0 for all-zero inputs', () => {
      expect(calculateJournalHotScore(0, 0, 0)).toBe(0);
    });
  });

  describe('calculateJournalAllTimeScore', () => {
    it('should include impactFactor', () => {
      expect(calculateJournalAllTimeScore(5, 2, 4, 3)).toBe(42);
    });

    it('should handle null impactFactor and rating', () => {
      expect(calculateJournalAllTimeScore(1, 0, null, null)).toBe(5);
    });

    it('should return 0 for all-zero inputs', () => {
      expect(calculateJournalAllTimeScore(0, 0, 0, 0)).toBe(0);
    });
  });

  describe('updatePostScores', () => {
    it('should call post.update with calculated scores', async () => {
      const mockPost = {
        commentCount: 2,
        likeCount: 3,
        favoriteCount: 1,
        viewCount: 100,
        createdAt: new Date(),
        update: jest.fn().mockResolvedValue(undefined)
      };
      await updatePostScores(mockPost);
      expect(mockPost.update).toHaveBeenCalledTimes(1);
      const callArg = mockPost.update.mock.calls[0][0];
      expect(typeof callArg.hotScore).toBe('number');
      expect(typeof callArg.allTimeScore).toBe('number');
    });

    it('should propagate errors when post.update fails', async () => {
      const mockPost = {
        commentCount: 0,
        likeCount: 0,
        favoriteCount: 0,
        viewCount: 0,
        createdAt: new Date(),
        update: jest.fn().mockRejectedValue(new Error('DB write failed'))
      };
      await expect(updatePostScores(mockPost)).rejects.toThrow('DB write failed');
    });
  });
});
