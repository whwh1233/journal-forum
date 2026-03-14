const request = require('supertest');
const app = require('../../server');
const { sequelize, Comment, CommentLike, Journal, JournalRatingCache, User } = require('../../models');
const { Op } = require('sequelize');

describe('Comments API Integration Tests', () => {
  let userToken;
  let userId;
  let user2Token;
  let user2Id;
  let testJournal;

  beforeAll(async () => {
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    // Clean up in correct order (respect foreign key constraints)
    await CommentLike.destroy({ where: {}, force: true });
    await Comment.destroy({ where: {}, force: true });
    await JournalRatingCache.destroy({ where: {}, force: true });
    // Disable FK checks to clean journals safely
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Journal.destroy({ where: { journalId: { [Op.like]: 'test-comment-%' } }, force: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    await User.destroy({ where: { email: { [Op.like]: '%@example.com' } }, force: true });

    // Create test journal (Journal uses journalId as string PK and name instead of title)
    testJournal = await Journal.create({
      journalId: `test-comment-${Date.now()}`,
      name: 'Test Journal For Comments',
      issn: '0000-0000'
    });

    // Create test user 1
    const user1Email = `comment-user1-${Date.now()}@example.com`;
    const user1Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: user1Email,
        password: 'TestPass123!',
        name: 'Comment User 1'
      });

    userToken = user1Res.body.data.token;
    userId = user1Res.body.data.user.id;

    // Create test user 2
    const user2Email = `comment-user2-${Date.now()}@example.com`;
    const user2Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: user2Email,
        password: 'TestPass123!',
        name: 'Comment User 2'
      });

    user2Token = user2Res.body.data.token;
    user2Id = user2Res.body.data.user.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ==================== Create Comment Tests ====================

  describe('POST /api/comments', () => {
    it('should create a top-level comment with rating successfully', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          journalId: testJournal.journalId,
          content: 'Great journal with fast review process',
          rating: 4
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.content).toBe('Great journal with fast review process');
      expect(res.body.rating).toBe(4);
      expect(res.body.userId).toBe(userId);
      expect(res.body.journalId).toBe(testJournal.journalId);
      expect(res.body.isDeleted).toBe(false);
    });

    it('should create a reply comment without rating', async () => {
      // First create a top-level comment to reply to
      const parentRes = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          journalId: testJournal.journalId,
          content: 'Parent comment',
          rating: 3
        });

      const parentId = parentRes.body.id;

      // Create reply
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          journalId: testJournal.journalId,
          parentId,
          content: 'I agree with your review'
        });

      expect(res.status).toBe(201);
      expect(res.body.parentId).toBe(parentId);
      expect(res.body.content).toBe('I agree with your review');
      expect(res.body.userId).toBe(user2Id);
    });

    it('should reject comment without authentication', async () => {
      const res = await request(app)
        .post('/api/comments')
        .send({
          journalId: testJournal.journalId,
          content: 'This should fail',
          rating: 5
        });

      expect(res.status).toBe(401);
    });

    it('should reject top-level comment without rating', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          journalId: testJournal.journalId,
          content: 'Missing rating'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('顶级评论必须包含评分');
    });

    it('should reject comment for non-existent journal', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          journalId: 999999,
          content: 'Journal does not exist',
          rating: 5
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('期刊不存在');
    });

    it('should reject rating out of range', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          journalId: testJournal.journalId,
          content: 'Invalid rating',
          rating: 6
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('评分必须在1-5之间');
    });

    it('should create comment with dimension ratings', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          journalId: testJournal.journalId,
          content: 'Detailed review with dimensions',
          dimensionRatings: {
            reviewSpeed: 4,
            editorAttitude: 5,
            acceptDifficulty: 3,
            reviewQuality: 4,
            overallExperience: 4
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.dimensionRatings).toBeDefined();
      expect(res.body.dimensionRatings.overallExperience).toBe(4);
      expect(res.body.rating).toBe(4);
    });
  });

  // ==================== Get Comments Tests ====================

  describe('GET /api/comments/journal/:journalId', () => {
    it('should get comments for a journal', async () => {
      // Create a comment first
      await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          journalId: testJournal.journalId,
          content: 'A test comment',
          rating: 4
        });

      const res = await request(app)
        .get(`/api/comments/journal/${testJournal.journalId}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].content).toBe('A test comment');
      expect(res.body[0].rating).toBe(4);
    });

    it('should return empty array for journal without comments', async () => {
      const res = await request(app)
        .get(`/api/comments/journal/${testJournal.journalId}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('should return comment tree with replies', async () => {
      // Create parent comment
      const parentRes = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          journalId: testJournal.journalId,
          content: 'Parent comment',
          rating: 5
        });

      const parentId = parentRes.body.id;

      // Create reply
      await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          journalId: testJournal.journalId,
          parentId,
          content: 'Reply to parent'
        });

      const res = await request(app)
        .get(`/api/comments/journal/${testJournal.journalId}`);

      expect(res.status).toBe(200);
      // Top-level comments should have replies nested
      const parentComment = res.body.find(c => c.content === 'Parent comment');
      expect(parentComment).toBeDefined();
      expect(parentComment.replies).toBeDefined();
      expect(parentComment.replies.length).toBe(1);
      expect(parentComment.replies[0].content).toBe('Reply to parent');
    });
  });

  // ==================== Delete Comment Tests ====================

  describe('DELETE /api/comments/:commentId', () => {
    it('should delete own comment', async () => {
      // Create a comment
      const createRes = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          journalId: testJournal.journalId,
          content: 'Comment to delete',
          rating: 3
        });

      const commentId = createRes.body.id;

      const res = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('评论已删除');

      // Verify it is soft-deleted in DB
      const deleted = await Comment.findByPk(commentId);
      expect(deleted.isDeleted).toBe(true);
      expect(deleted.content).toBe('[该评论已被删除]');
    });

    it('should reject deleting other user\'s comment', async () => {
      // User 1 creates a comment
      const createRes = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          journalId: testJournal.journalId,
          content: 'User 1 comment',
          rating: 4
        });

      const commentId = createRes.body.id;

      // User 2 tries to delete it
      const res = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('没有删除权限');
    });

    it('should return 404 for non-existent comment', async () => {
      const res = await request(app)
        .delete('/api/comments/999999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('评论不存在');
    });
  });

  // ==================== Rating Summary Tests ====================

  describe('GET /api/comments/journal/:journalId/ratings', () => {
    it('should return rating summary for a journal', async () => {
      // Create comments with ratings
      await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          journalId: testJournal.journalId,
          content: 'Review 1',
          dimensionRatings: {
            reviewSpeed: 4,
            editorAttitude: 5,
            overallExperience: 4
          }
        });

      await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          journalId: testJournal.journalId,
          content: 'Review 2',
          dimensionRatings: {
            reviewSpeed: 2,
            editorAttitude: 3,
            overallExperience: 2
          }
        });

      const res = await request(app)
        .get(`/api/comments/journal/${testJournal.journalId}/ratings`);

      expect(res.status).toBe(200);
      expect(res.body.journalId).toBe(testJournal.journalId);
      expect(res.body.ratingCount).toBe(2);
      expect(res.body.dimensionAverages).toBeDefined();
      expect(res.body.dimensionLabels).toBeDefined();
    });

    it('should return 404 for non-existent journal', async () => {
      const res = await request(app)
        .get('/api/comments/journal/999999/ratings');

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('期刊不存在');
    });
  });

  // ==================== Like Comment Tests ====================

  describe('POST /api/comments/:commentId/like', () => {
    it('should toggle like on a comment', async () => {
      // Create a comment
      const createRes = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          journalId: testJournal.journalId,
          content: 'Likeable comment',
          rating: 5
        });

      const commentId = createRes.body.id;

      // Like it
      let res = await request(app)
        .post(`/api/comments/${commentId}/like`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.liked).toBe(true);
      expect(res.body.likeCount).toBe(1);

      // Unlike it
      res = await request(app)
        .post(`/api/comments/${commentId}/like`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.liked).toBe(false);
      expect(res.body.likeCount).toBe(0);
    });
  });
});
