const request = require('supertest');
const express = require('express');
const { TestDatabase } = require('../helpers/testDb');
const { generateUserToken } = require('../helpers/testHelpers');
const { errorHandler } = require('../../middleware/error');

// Mock数据库
jest.mock('../../config/databaseLowdb', () => ({
  getDB: () => require('../helpers/testDb').testDatabase.getDB(),
}));

// 动态引入路由（在mock之后）
let followRoutes;

// Mock protect middleware
jest.mock('../../middleware/auth', () => ({
  protect: jest.fn((req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token && token.includes('user')) {
      // 从token中解析用户ID
      const userId = token.includes('user1') ? 1 : 2;
      req.user = {
        id: userId,
        email: userId === 1 ? 'test@example.com' : 'admin@example.com',
        role: 'user',
      };
      next();
    } else {
      res.status(401).json({
        success: false,
        message: '未提供认证令牌',
      });
    }
  }),
}));

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/follows', followRoutes);
  app.use(errorHandler);
  return app;
};

describe('Follow API Integration Tests', () => {
  let testDb;
  let app;
  let user1Token;
  let user2Token;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.setup();

    // 在testDb setup后加载路由
    followRoutes = require('../../routes/followRoutes');

    app = createTestApp();
    user1Token = 'Bearer user1_token';
    user2Token = 'Bearer user2_token';
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  beforeEach(async () => {
    await testDb.reset();
  });

  describe('POST /api/follows', () => {
    it('should follow a user successfully', async () => {
      const response = await request(app)
        .post('/api/follows')
        .set('Authorization', user1Token)
        .send({ followingId: 2 })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.follow).toHaveProperty('id');
      expect(response.body.data.follow).toHaveProperty('followerId', 1);
      expect(response.body.data.follow).toHaveProperty('followingId', 2);
      expect(response.body.data.follow).toHaveProperty('createdAt');

      // 验证数据库中的记录
      const db = testDb.getDB();
      const follow = db.data.follows.find(
        f => f.followerId === 1 && f.followingId === 2
      );
      expect(follow).toBeDefined();
    });

    it('should not allow following self', async () => {
      const response = await request(app)
        .post('/api/follows')
        .set('Authorization', user1Token)
        .send({ followingId: 1 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不能关注自己');
    });

    it('should not allow following non-existent user', async () => {
      const response = await request(app)
        .post('/api/follows')
        .set('Authorization', user1Token)
        .send({ followingId: 9999 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户不存在');
    });

    it('should not allow following already followed user', async () => {
      // 先关注
      await request(app)
        .post('/api/follows')
        .set('Authorization', user1Token)
        .send({ followingId: 2 });

      // 再次关注
      const response = await request(app)
        .post('/api/follows')
        .set('Authorization', user1Token)
        .send({ followingId: 2 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('已经关注过该用户');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post('/api/follows')
        .send({ followingId: 2 })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing followingId', async () => {
      const response = await request(app)
        .post('/api/follows')
        .set('Authorization', user1Token)
        .send({})
        .expect(404); // NaN会导致用户不存在

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/follows/:followingId', () => {
    beforeEach(async () => {
      // 创建一个关注关系
      const db = testDb.getDB();
      db.data.follows.push({
        id: 1,
        followerId: 1,
        followingId: 2,
        createdAt: new Date().toISOString(),
      });
    });

    it('should unfollow a user successfully', async () => {
      const response = await request(app)
        .delete('/api/follows/2')
        .set('Authorization', user1Token)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('取消关注成功');

      // 验证数据库中的记录被删除
      const db = testDb.getDB();
      const follow = db.data.follows.find(
        f => f.followerId === 1 && f.followingId === 2
      );
      expect(follow).toBeUndefined();
    });

    it('should return 404 when unfollowing not-followed user', async () => {
      const response = await request(app)
        .delete('/api/follows/9999')
        .set('Authorization', user1Token)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('未关注该用户');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .delete('/api/follows/2')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/follows/check/:followingId', () => {
    beforeEach(async () => {
      // 创建一个关注关系
      const db = testDb.getDB();
      db.data.follows.push({
        id: 1,
        followerId: 1,
        followingId: 2,
        createdAt: new Date().toISOString(),
      });
    });

    it('should return true when following', async () => {
      const response = await request(app)
        .get('/api/follows/check/2')
        .set('Authorization', user1Token)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isFollowing).toBe(true);
    });

    it('should return false when not following', async () => {
      const response = await request(app)
        .get('/api/follows/check/9999')
        .set('Authorization', user1Token)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isFollowing).toBe(false);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/follows/check/2')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/follows/followers/:userId', () => {
    beforeEach(async () => {
      // 创建多个关注关系（多人关注用户2）
      const db = testDb.getDB();
      db.data.follows = [
        {
          id: 1,
          followerId: 1,
          followingId: 2,
          createdAt: new Date('2024-01-01').toISOString(),
        },
      ];
    });

    it('should get followers list successfully', async () => {
      const response = await request(app)
        .get('/api/follows/followers/2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.followers)).toBe(true);
      expect(response.body.data.followers.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeDefined();

      // 验证粉丝信息包含用户数据
      const follower = response.body.data.followers[0];
      expect(follower).toHaveProperty('user');
      expect(follower.user).toHaveProperty('id');
      expect(follower.user).toHaveProperty('email');
      expect(follower.user).not.toHaveProperty('password');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/follows/followers/2?page=1&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.itemsPerPage).toBe(1);
      expect(response.body.data.followers.length).toBeLessThanOrEqual(1);
    });

    it('should return empty array for user with no followers', async () => {
      const response = await request(app)
        .get('/api/follows/followers/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.followers).toHaveLength(0);
    });

    it('should sort followers by createdAt descending', async () => {
      // 添加更多关注以测试排序
      const db = testDb.getDB();
      db.data.follows.push({
        id: 2,
        followerId: 2,
        followingId: 1,
        createdAt: new Date('2024-02-01').toISOString(),
      });

      const response = await request(app)
        .get('/api/follows/followers/1')
        .expect(200);

      const followers = response.body.data.followers;
      for (let i = 0; i < followers.length - 1; i++) {
        const date1 = new Date(followers[i].createdAt);
        const date2 = new Date(followers[i + 1].createdAt);
        expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
      }
    });
  });

  describe('GET /api/follows/following/:userId', () => {
    beforeEach(async () => {
      // 创建多个关注关系（用户1关注多人）
      const db = testDb.getDB();
      db.data.follows = [
        {
          id: 1,
          followerId: 1,
          followingId: 2,
          createdAt: new Date('2024-01-01').toISOString(),
        },
      ];
    });

    it('should get following list successfully', async () => {
      const response = await request(app)
        .get('/api/follows/following/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.following)).toBe(true);
      expect(response.body.data.following.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeDefined();

      // 验证关注信息包含用户数据
      const following = response.body.data.following[0];
      expect(following).toHaveProperty('user');
      expect(following.user).toHaveProperty('id');
      expect(following.user).toHaveProperty('email');
      expect(following.user).not.toHaveProperty('password');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/follows/following/1?page=1&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.itemsPerPage).toBe(1);
      expect(response.body.data.following.length).toBeLessThanOrEqual(1);
    });

    it('should return empty array for user following no one', async () => {
      const response = await request(app)
        .get('/api/follows/following/2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.following).toHaveLength(0);
    });
  });

  describe('Follow Data Consistency', () => {
    it('should maintain consistent follow data structure', async () => {
      // 创建关注
      await request(app)
        .post('/api/follows')
        .set('Authorization', user1Token)
        .send({ followingId: 2 });

      const db = testDb.getDB();
      const follow = db.data.follows[db.data.follows.length - 1];

      // 验证数据结构
      expect(follow).toHaveProperty('id');
      expect(follow).toHaveProperty('followerId');
      expect(follow).toHaveProperty('followingId');
      expect(follow).toHaveProperty('createdAt');
      expect(typeof follow.id).toBe('number');
      expect(typeof follow.followerId).toBe('number');
      expect(typeof follow.followingId).toBe('number');
    });

    it('should prevent duplicate follow relationships', async () => {
      const db = testDb.getDB();

      // 创建第一个关注
      db.data.follows.push({
        id: 1,
        followerId: 1,
        followingId: 2,
        createdAt: new Date().toISOString(),
      });

      const initialCount = db.data.follows.length;

      // 尝试重复关注
      await request(app)
        .post('/api/follows')
        .set('Authorization', user1Token)
        .send({ followingId: 2 })
        .expect(400);

      // 验证没有新增关注记录
      expect(db.data.follows.length).toBe(initialCount);
    });

    it('should handle bidirectional follows correctly', async () => {
      // 用户1关注用户2
      await request(app)
        .post('/api/follows')
        .set('Authorization', user1Token)
        .send({ followingId: 2 });

      // 用户2关注用户1
      await request(app)
        .post('/api/follows')
        .set('Authorization', user2Token)
        .send({ followingId: 1 });

      // 验证两个方向的关注都存在
      const response1 = await request(app)
        .get('/api/follows/check/2')
        .set('Authorization', user1Token);
      expect(response1.body.data.isFollowing).toBe(true);

      const response2 = await request(app)
        .get('/api/follows/check/1')
        .set('Authorization', user2Token);
      expect(response2.body.data.isFollowing).toBe(true);
    });
  });
});
