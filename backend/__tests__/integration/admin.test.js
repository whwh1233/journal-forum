const request = require('supertest');
const express = require('express');
const { TestDatabase } = require('../helpers/testDb');
const { generateAdminToken, generateUserToken } = require('../helpers/testHelpers');
const adminRoutes = require('../../routes/adminRoutes');
const { adminAuth } = require('../../middleware/adminAuth');
const { errorHandler } = require('../../middleware/error');

// Mock admin auth middleware
jest.mock('../../middleware/adminAuth', () => ({
  adminAuth: jest.fn((req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token && token.includes('admin')) {
      req.userId = 2;
      req.userRole = 'admin';
      next();
    } else {
      res.status(403).json({
        success: false,
        message: '需要管理员权限',
      });
    }
  }),
}));

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRoutes);
  app.use(errorHandler);
  return app;
};

describe('Admin API Integration Tests', () => {
  let testDb;
  let app;
  let adminToken;
  let userToken;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.setup();
    app = createTestApp();
    adminToken = generateAdminToken(2);
    userToken = generateUserToken(1);
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  beforeEach(async () => {
    await testDb.reset();
  });

  describe('GET /api/admin/stats', () => {
    it('should get stats with admin token', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('userCount');
      expect(response.body.data).toHaveProperty('journalCount');
      expect(response.body.data).toHaveProperty('commentCount');
      expect(typeof response.body.data.userCount).toBe('number');
    });

    it('should reject non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/comments', () => {
    it('should get all comments including both old and new systems', async () => {
      const response = await request(app)
        .get('/api/admin/comments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.comments)).toBe(true);

      // 应该包含旧评论系统的评论
      const oldSystemComment = response.body.data.comments.find(
        c => c.author === 'test@example.com'
      );
      expect(oldSystemComment).toBeDefined();

      // 应该包含新评论系统的评论
      const newSystemComment = response.body.data.comments.find(
        c => c.id === '1-1234567890-abc123'
      );
      expect(newSystemComment).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/admin/comments?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('currentPage', 1);
      expect(response.body.data.pagination).toHaveProperty('itemsPerPage', 5);
      expect(response.body.data.comments.length).toBeLessThanOrEqual(5);
    });

    it('should support search functionality', async () => {
      const response = await request(app)
        .get('/api/admin/comments?search=test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // 所有返回的评论都应该包含搜索词
      response.body.data.comments.forEach(comment => {
        const searchText = `${comment.content} ${comment.author} ${comment.journalTitle}`.toLowerCase();
        expect(searchText).toContain('test');
      });
    });

    it('should not include deleted comments', async () => {
      // 标记一个评论为删除
      const db = testDb.getDB();
      db.data.comments[0].isDeleted = true;
      await db.write();

      const response = await request(app)
        .get('/api/admin/comments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const deletedComment = response.body.data.comments.find(
        c => c.id === db.data.comments[0].id
      );
      expect(deletedComment).toBeUndefined();
    });

    it('should only include top-level comments, not replies', async () => {
      // 添加一个回复评论
      const db = testDb.getDB();
      db.data.comments.push({
        id: '1-9999999999-xyz789',
        userId: 1,
        userName: 'Test User',
        journalId: 1,
        parentId: '1-1234567890-abc123', // 这是一个回复
        content: 'This is a reply',
        createdAt: new Date().toISOString(),
        isDeleted: false,
      });
      await db.write();

      const response = await request(app)
        .get('/api/admin/comments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 回复不应该出现在列表中
      const replyComment = response.body.data.comments.find(
        c => c.id === '1-9999999999-xyz789'
      );
      expect(replyComment).toBeUndefined();
    });
  });

  describe('DELETE /api/admin/comments/:id', () => {
    it('should delete old system comment successfully', async () => {
      // 旧评论的ID格式: "journalId-index"
      const response = await request(app)
        .delete('/api/admin/comments/1-0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('删除成功');

      // 验证评论被删除
      const db = testDb.getDB();
      const journal = db.data.journals.find(j => j.id === 1);
      expect(journal.reviews.length).toBe(0);
    });

    it('should delete new system comment successfully', async () => {
      const response = await request(app)
        .delete('/api/admin/comments/1-1234567890-abc123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // 验证评论被标记为删除
      const db = testDb.getDB();
      const comment = db.data.comments.find(c => c.id === '1-1234567890-abc123');
      expect(comment.isDeleted).toBe(true);
    });

    it('should update journal rating after deleting comment with rating', async () => {
      const db = testDb.getDB();
      const initialRating = db.data.journals[0].rating;

      const response = await request(app)
        .delete('/api/admin/comments/1-1234567890-abc123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // 重新读取数据库验证评分更新
      await db.read();
      const updatedRating = db.data.journals[0].rating;

      // 评分应该发生变化（因为删除了一个评分）
      expect(updatedRating).not.toBe(initialRating);
    });

    it('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .delete('/api/admin/comments/999-999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject non-admin users', async () => {
      const response = await request(app)
        .delete('/api/admin/comments/1-0')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should get all users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);

      // 验证用户数据不包含密码
      response.body.data.users.forEach(user => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should support search by email', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.users.forEach(user => {
        expect(user.email.toLowerCase()).toContain('test');
      });
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user status', async () => {
      const response = await request(app)
        .put('/api/admin/users/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'disabled' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.status).toBe('disabled');
    });

    it('should not allow disabling admin account', async () => {
      const response = await request(app)
        .put('/api/admin/users/2')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'disabled' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不能禁用管理员');
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user and their comments', async () => {
      const response = await request(app)
        .delete('/api/admin/users/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // 验证用户被删除
      const db = testDb.getDB();
      const user = db.data.users.find(u => u.id === 1);
      expect(user).toBeUndefined();
    });

    it('should not allow deleting admin account', async () => {
      const response = await request(app)
        .delete('/api/admin/users/2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不能删除管理员');
    });
  });

  describe('Data Structure Consistency Tests', () => {
    it('should ensure comment data structure is consistent across systems', async () => {
      const response = await request(app)
        .get('/api/admin/comments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 所有评论都应该有统一的数据结构
      response.body.data.comments.forEach(comment => {
        expect(comment).toHaveProperty('id');
        expect(comment).toHaveProperty('journalId');
        expect(comment).toHaveProperty('journalTitle');
        expect(comment).toHaveProperty('author');
        expect(comment).toHaveProperty('content');
        expect(comment).toHaveProperty('createdAt');
        expect(comment).toHaveProperty('rating');
      });
    });

    it('should handle both comment ID formats correctly', async () => {
      const db = testDb.getDB();

      // 测试旧格式ID
      const oldFormatId = '1-0';
      const oldIdParts = oldFormatId.split('-');
      expect(oldIdParts.length).toBe(2);
      expect(isNaN(oldIdParts[1])).toBe(false);

      // 测试新格式ID
      const newFormatId = '1-1234567890-abc123';
      const newIdParts = newFormatId.split('-');
      expect(newIdParts.length).toBeGreaterThanOrEqual(3);
    });
  });
});
