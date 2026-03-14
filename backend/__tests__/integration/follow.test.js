const request = require('supertest');
const app = require('../../server');
const { sequelize, Follow, User } = require('../../models');
const { Op } = require('sequelize');

describe('Follow API Integration Tests', () => {
  let user1Token;
  let user1Id;
  let user2Token;
  let user2Id;

  beforeAll(async () => {
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    // Clean up follow records first (foreign key constraints)
    await Follow.destroy({ where: {}, force: true });
    // Clean up test users
    await User.destroy({ where: { email: { [Op.like]: '%follow-test%' } }, force: true });

    // Create test user 1
    const user1Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `follow-test-user1-${Date.now()}@example.com`,
        password: 'TestPass123!',
        name: 'Follow Test User 1'
      });

    user1Token = user1Res.body.data.token;
    user1Id = user1Res.body.data.user.id;

    // Create test user 2
    const user2Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `follow-test-user2-${Date.now()}@example.com`,
        password: 'TestPass123!',
        name: 'Follow Test User 2'
      });

    user2Token = user2Res.body.data.token;
    user2Id = user2Res.body.data.user.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ==================== POST /api/follows ====================

  describe('POST /api/follows', () => {
    it('should follow a user successfully', async () => {
      const response = await request(app)
        .post('/api/follows')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ followingId: user2Id })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.follow).toHaveProperty('id');
      expect(response.body.data.follow).toHaveProperty('followerId', user1Id);
      expect(response.body.data.follow).toHaveProperty('followingId', user2Id);
      expect(response.body.data.follow).toHaveProperty('createdAt');

      // Verify in database
      const follow = await Follow.findOne({
        where: { followerId: user1Id, followingId: user2Id }
      });
      expect(follow).not.toBeNull();
    });

    it('should not allow following self', async () => {
      const response = await request(app)
        .post('/api/follows')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ followingId: user1Id })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不能关注自己');
    });

    it('should not allow following non-existent user', async () => {
      const response = await request(app)
        .post('/api/follows')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ followingId: 999999 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户不存在');
    });

    it('should not allow following already followed user', async () => {
      // Follow first
      await request(app)
        .post('/api/follows')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ followingId: user2Id });

      // Try to follow again
      const response = await request(app)
        .post('/api/follows')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ followingId: user2Id })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('已经关注过该用户');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post('/api/follows')
        .send({ followingId: user2Id })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ==================== DELETE /api/follows/:followingId ====================

  describe('DELETE /api/follows/:followingId', () => {
    beforeEach(async () => {
      // Create a follow relationship via API
      await request(app)
        .post('/api/follows')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ followingId: user2Id });
    });

    it('should unfollow a user successfully', async () => {
      const response = await request(app)
        .delete(`/api/follows/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('取消关注成功');

      // Verify record is deleted from database
      const follow = await Follow.findOne({
        where: { followerId: user1Id, followingId: user2Id }
      });
      expect(follow).toBeNull();
    });

    it('should return 404 when unfollowing not-followed user', async () => {
      const response = await request(app)
        .delete(`/api/follows/999999`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('未关注该用户');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .delete(`/api/follows/${user2Id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ==================== GET /api/follows/check/:followingId ====================

  describe('GET /api/follows/check/:followingId', () => {
    beforeEach(async () => {
      // Create a follow relationship
      await request(app)
        .post('/api/follows')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ followingId: user2Id });
    });

    it('should return true when following', async () => {
      const response = await request(app)
        .get(`/api/follows/check/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isFollowing).toBe(true);
    });

    it('should return false when not following', async () => {
      const response = await request(app)
        .get(`/api/follows/check/999999`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isFollowing).toBe(false);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get(`/api/follows/check/${user2Id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ==================== GET /api/follows/followers/:userId ====================

  describe('GET /api/follows/followers/:userId', () => {
    beforeEach(async () => {
      // User1 follows User2
      await request(app)
        .post('/api/follows')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ followingId: user2Id });
    });

    it('should get followers list successfully', async () => {
      const response = await request(app)
        .get(`/api/follows/followers/${user2Id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.followers)).toBe(true);
      expect(response.body.data.followers.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeDefined();

      // Verify follower info includes user data
      const follower = response.body.data.followers[0];
      expect(follower).toHaveProperty('user');
      expect(follower.user).toHaveProperty('id');
      expect(follower.user).toHaveProperty('email');
      expect(follower.user).not.toHaveProperty('password');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/follows/followers/${user2Id}?page=1&limit=1`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.itemsPerPage).toBe(1);
      expect(response.body.data.followers.length).toBeLessThanOrEqual(1);
    });

    it('should return empty array for user with no followers', async () => {
      const response = await request(app)
        .get(`/api/follows/followers/${user1Id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.followers).toHaveLength(0);
    });
  });

  // ==================== GET /api/follows/following/:userId ====================

  describe('GET /api/follows/following/:userId', () => {
    beforeEach(async () => {
      // User1 follows User2
      await request(app)
        .post('/api/follows')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ followingId: user2Id });
    });

    it('should get following list successfully', async () => {
      const response = await request(app)
        .get(`/api/follows/following/${user1Id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.following)).toBe(true);
      expect(response.body.data.following.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeDefined();

      // Verify following info includes user data
      const following = response.body.data.following[0];
      expect(following).toHaveProperty('user');
      expect(following.user).toHaveProperty('id');
      expect(following.user).toHaveProperty('email');
      expect(following.user).not.toHaveProperty('password');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/follows/following/${user1Id}?page=1&limit=1`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.itemsPerPage).toBe(1);
      expect(response.body.data.following.length).toBeLessThanOrEqual(1);
    });

    it('should return empty array for user following no one', async () => {
      const response = await request(app)
        .get(`/api/follows/following/${user2Id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.following).toHaveLength(0);
    });
  });

  // ==================== Bidirectional Follows ====================

  describe('Follow Data Consistency', () => {
    it('should handle bidirectional follows correctly', async () => {
      // User1 follows User2
      await request(app)
        .post('/api/follows')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ followingId: user2Id });

      // User2 follows User1
      await request(app)
        .post('/api/follows')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ followingId: user1Id });

      // Verify both directions
      const response1 = await request(app)
        .get(`/api/follows/check/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(response1.body.data.isFollowing).toBe(true);

      const response2 = await request(app)
        .get(`/api/follows/check/${user1Id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response2.body.data.isFollowing).toBe(true);

      // User1 should appear in User2's followers
      const followersRes = await request(app)
        .get(`/api/follows/followers/${user2Id}`);
      expect(followersRes.body.data.followers.length).toBe(1);
      expect(followersRes.body.data.followers[0].user.id).toBe(user1Id);

      // User2 should appear in User1's following
      const followingRes = await request(app)
        .get(`/api/follows/following/${user1Id}`);
      expect(followingRes.body.data.following.length).toBe(1);
      expect(followingRes.body.data.following[0].user.id).toBe(user2Id);
    });
  });
});
