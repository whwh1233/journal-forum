const request = require('supertest');
const express = require('express');
const { TestDatabase } = require('../helpers/testDb');
const { generateUserToken, generateAdminToken } = require('../helpers/testHelpers');
const commentRoutes = require('../../routes/commentRoutes');
const { auth } = require('../../middleware/auth');
const { errorHandler } = require('../../middleware/error');

// Mock auth middleware for testing
jest.mock('../../middleware/auth', () => ({
  auth: jest.fn((req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      // 简化的token验证
      req.userId = 1;
      req.userRole = 'user';
    }
    next();
  }),
}));

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/comments', commentRoutes);
  app.use(errorHandler);
  return app;
};

describe('Comments API Integration Tests', () => {
  let testDb;
  let app;
  let userToken;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.setup();
    app = createTestApp();
    userToken = generateUserToken(1);
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  beforeEach(async () => {
    await testDb.reset();
  });

  describe('POST /api/comments', () => {
    it('should create a new comment successfully', async () => {
      const newComment = {
        journalId: 1,
        content: 'This is a new test comment',
        rating: 5,
      };

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newComment)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comment).toHaveProperty('id');
      expect(response.body.data.comment).toHaveProperty('content', newComment.content);
      expect(response.body.data.comment).toHaveProperty('rating', newComment.rating);
      expect(response.body.data.comment).toHaveProperty('userId', 1);
      expect(response.body.data.comment).toHaveProperty('isDeleted', false);
    });

    it('should create a reply comment successfully', async () => {
      const replyComment = {
        journalId: 1,
        parentId: '1-1234567890-abc123',
        content: 'This is a reply',
      };

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send(replyComment)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comment).toHaveProperty('parentId', replyComment.parentId);
      expect(response.body.data.comment).not.toHaveProperty('rating'); // 回复没有评分
    });

    it('should reject comment without authentication', async () => {
      const newComment = {
        journalId: 1,
        content: 'This should fail',
        rating: 5,
      };

      // 移除认证mock
      auth.mockImplementationOnce((req, res, next) => {
        return res.status(401).json({
          success: false,
          message: '未提供认证令牌',
        });
      });

      const response = await request(app)
        .post('/api/comments')
        .send(newComment)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject comment with missing required fields', async () => {
      const invalidComment = {
        journalId: 1,
        // 缺少content
      };

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidComment)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject comment with invalid journalId', async () => {
      const invalidComment = {
        journalId: 9999, // 不存在的期刊
        content: 'Test comment',
        rating: 5,
      };

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidComment)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('期刊不存在');
    });

    it('should reject rating out of range', async () => {
      const invalidComment = {
        journalId: 1,
        content: 'Test comment',
        rating: 6, // 超出1-5范围
      };

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidComment)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/comments/:journalId', () => {
    it('should get all comments for a journal', async () => {
      const response = await request(app)
        .get('/api/comments/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.comments)).toBe(true);
      expect(response.body.data.comments.length).toBeGreaterThan(0);
    });

    it('should return empty array for journal without comments', async () => {
      const response = await request(app)
        .get('/api/comments/2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.comments)).toBe(true);
    });

    it('should return 404 for non-existent journal', async () => {
      const response = await request(app)
        .get('/api/comments/9999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should not include deleted comments', async () => {
      // 先标记一个评论为删除
      const db = testDb.getDB();
      db.data.comments[0].isDeleted = true;
      await db.write();

      const response = await request(app)
        .get('/api/comments/1')
        .expect(200);

      const deletedComment = response.body.data.comments.find(
        c => c.id === db.data.comments[0].id
      );
      expect(deletedComment).toBeUndefined();
    });
  });

  describe('DELETE /api/comments/:id', () => {
    it('should delete own comment successfully', async () => {
      const response = await request(app)
        .delete('/api/comments/1-1234567890-abc123')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('删除成功');

      // 验证评论被标记为删除
      const db = testDb.getDB();
      const comment = db.data.comments.find(c => c.id === '1-1234567890-abc123');
      expect(comment.isDeleted).toBe(true);
    });

    it('should not allow deleting other user\'s comment', async () => {
      // Mock为另一个用户
      auth.mockImplementationOnce((req, res, next) => {
        req.userId = 999; // 不同的用户ID
        req.userRole = 'user';
        next();
      });

      const response = await request(app)
        .delete('/api/comments/1-1234567890-abc123')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权删除');
    });

    it('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .delete('/api/comments/nonexistent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Comment Data Structure Consistency', () => {
    it('should maintain consistent data structure across old and new comments', async () => {
      const db = testDb.getDB();

      // 检查旧评论系统的数据结构
      const oldComment = db.data.journals[0].reviews[0];
      expect(oldComment).toHaveProperty('author');
      expect(oldComment).toHaveProperty('rating');
      expect(oldComment).toHaveProperty('content');
      expect(oldComment).toHaveProperty('createdAt');

      // 检查新评论系统的数据结构
      const newComment = db.data.comments[0];
      expect(newComment).toHaveProperty('userId');
      expect(newComment).toHaveProperty('userName');
      expect(newComment).toHaveProperty('journalId');
      expect(newComment).toHaveProperty('content');
      expect(newComment).toHaveProperty('createdAt');
      expect(newComment).toHaveProperty('isDeleted');

      // 这个测试确保数据结构的一致性，防止像之前那样改了数据结构但忘记更新某些地方
    });
  });
});
