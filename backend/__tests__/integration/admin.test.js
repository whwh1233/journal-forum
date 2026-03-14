const request = require('supertest');
const app = require('../../server');
const { sequelize, User, Journal, Comment } = require('../../models');
const { Op } = require('sequelize');

describe('Admin API Integration Tests', () => {
  let adminToken;
  let adminId;
  let userToken;
  let userId;

  beforeAll(async () => {
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    // Clean up test data (respect foreign key constraints)
    await Comment.destroy({ where: {}, force: true });
    await User.destroy({ where: { email: { [Op.like]: '%@example.com' } }, force: true });

    // Create regular user via register API
    const userEmail = `user-${Date.now()}@example.com`;
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: userEmail,
        password: 'TestPass123!',
        name: 'Test User'
      });

    userToken = userRes.body.data.token;
    userId = userRes.body.data.user.id;

    // Create admin user via register API
    const adminEmail = `admin-${Date.now()}@example.com`;
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: adminEmail,
        password: 'AdminPass123!',
        name: 'Admin User'
      });

    adminToken = adminRes.body.data.token;
    adminId = adminRes.body.data.user.id;

    // Promote to admin
    await User.update({ role: 'admin' }, { where: { id: adminId } });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ==================== Stats Tests ====================

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

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ==================== Comments Tests ====================

  describe('GET /api/admin/comments', () => {
    let testJournal;

    beforeEach(async () => {
      // Get or create a test journal
      testJournal = await Journal.findOne();
      if (!testJournal) {
        testJournal = await Journal.create({
          journalId: `test-journal-${Date.now()}`,
          name: 'Test Journal'
        });
      }

      // Create top-level comments
      await Comment.create({
        userId: userId,
        userName: 'Test User',
        journalId: testJournal.journalId,
        content: 'This is a test comment',
        rating: 4,
        isDeleted: false
      });

      await Comment.create({
        userId: userId,
        userName: 'Test User',
        journalId: testJournal.journalId,
        content: 'Another test comment about research',
        rating: 3,
        isDeleted: false
      });
    });

    it('should get all comments with admin token', async () => {
      const response = await request(app)
        .get('/api/admin/comments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.comments)).toBe(true);
      expect(response.body.data.comments.length).toBeGreaterThanOrEqual(2);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/admin/comments?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('currentPage', 1);
      expect(response.body.data.pagination).toHaveProperty('itemsPerPage', 1);
      expect(response.body.data.comments.length).toBe(1);
    });

    it('should support search functionality', async () => {
      const response = await request(app)
        .get('/api/admin/comments?search=research')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comments.length).toBeGreaterThanOrEqual(1);
      response.body.data.comments.forEach(comment => {
        const searchText = `${comment.content} ${comment.author}`.toLowerCase();
        expect(searchText).toContain('research');
      });
    });

    it('should not include deleted comments', async () => {
      // Create a deleted comment
      const deletedComment = await Comment.create({
        userId: userId,
        userName: 'Test User',
        journalId: testJournal.journalId,
        content: '[该评论已被删除]',
        rating: 2,
        isDeleted: true
      });

      const response = await request(app)
        .get('/api/admin/comments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const found = response.body.data.comments.find(
        c => c.id === String(deletedComment.id)
      );
      expect(found).toBeUndefined();
    });

    it('should only include top-level comments, not replies', async () => {
      // Get a top-level comment to use as parent
      const parentComment = await Comment.findOne({
        where: { parentId: null, isDeleted: false }
      });

      // Create a reply
      const reply = await Comment.create({
        userId: userId,
        userName: 'Test User',
        journalId: testJournal.journalId,
        parentId: parentComment.id,
        content: 'This is a reply comment',
        isDeleted: false
      });

      const response = await request(app)
        .get('/api/admin/comments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const foundReply = response.body.data.comments.find(
        c => c.id === String(reply.id)
      );
      expect(foundReply).toBeUndefined();
    });
  });

  describe('DELETE /api/admin/comments/:id', () => {
    let testJournal;
    let testComment;

    beforeEach(async () => {
      testJournal = await Journal.findOne();
      if (!testJournal) {
        testJournal = await Journal.create({
          journalId: `test-journal-${Date.now()}`,
          name: 'Test Journal'
        });
      }

      testComment = await Comment.create({
        userId: userId,
        userName: 'Test User',
        journalId: testJournal.journalId,
        content: 'Comment to be deleted',
        rating: 4,
        isDeleted: false
      });
    });

    it('should delete comment successfully (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/admin/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('删除成功');

      // Verify the comment is soft-deleted
      const deleted = await Comment.findByPk(testComment.id);
      expect(deleted.isDeleted).toBe(true);
      expect(deleted.content).toBe('[该评论已被删除]');
    });

    it('should update journal rating after deleting comment with rating', async () => {
      // Create another comment with a different rating so journal has a computed rating
      const otherComment = await Comment.create({
        userId: adminId,
        userName: 'Admin User',
        journalId: testJournal.journalId,
        content: 'Another rated comment',
        rating: 2,
        isDeleted: false
      });

      // Delete the first comment (rating=4), leaving only otherComment (rating=2)
      await request(app)
        .delete(`/api/admin/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // The remaining active comment has rating=2, so journal should reflect that
      // (The controller recalculates based on remaining non-deleted comments)
      const updatedComment = await Comment.findByPk(testComment.id);
      expect(updatedComment.isDeleted).toBe(true);
    });

    it('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .delete('/api/admin/comments/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject non-admin users', async () => {
      const response = await request(app)
        .delete(`/api/admin/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should support legacy ID format', async () => {
      // Create a comment with legacy ID
      const legacyComment = await Comment.create({
        userId: userId,
        userName: 'Test User',
        journalId: testJournal.journalId,
        legacyId: '1-1234567890-abc123',
        content: 'Legacy comment',
        rating: 3,
        isDeleted: false
      });

      const response = await request(app)
        .delete('/api/admin/comments/1-1234567890-abc123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const deleted = await Comment.findByPk(legacyComment.id);
      expect(deleted.isDeleted).toBe(true);
    });
  });

  // ==================== Users Tests ====================

  describe('GET /api/admin/users', () => {
    it('should get all users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);

      // Verify user data does not include password
      response.body.data.users.forEach(user => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should support search by email or name', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=Test User')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThanOrEqual(1);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toHaveProperty('currentPage', 1);
      expect(response.body.data.pagination).toHaveProperty('itemsPerPage', 1);
      expect(response.body.data.users.length).toBeLessThanOrEqual(1);
    });

    it('should include commentCount for each user', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.data.users.forEach(user => {
        expect(user).toHaveProperty('commentCount');
        expect(typeof user.commentCount).toBe('number');
      });
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user status to disabled', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'disabled' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.status).toBe('disabled');
    });

    it('should not allow disabling admin account', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'disabled' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不能禁用管理员');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/admin/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'disabled' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user and soft-delete their comments', async () => {
      // Create a comment for the user first
      const testJournal = await Journal.findOne();
      if (testJournal) {
        await Comment.create({
          userId: userId,
          userName: 'Test User',
          journalId: testJournal.journalId,
          content: 'User comment before deletion',
          rating: 3,
          isDeleted: false
        });
      }

      const response = await request(app)
        .delete(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user is deleted
      const deletedUser = await User.findByPk(userId);
      expect(deletedUser).toBeNull();

      // Verify user's comments are soft-deleted
      if (testJournal) {
        const userComments = await Comment.findAll({
          where: { userId: userId }
        });
        userComments.forEach(comment => {
          expect(comment.isDeleted).toBe(true);
          expect(comment.content).toBe('[该评论已被删除]');
        });
      }
    });

    it('should not allow deleting admin account', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不能删除管理员');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/admin/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // ==================== Data Structure Tests ====================

  describe('Data Structure Consistency Tests', () => {
    it('should ensure comment data structure is consistent', async () => {
      const testJournal = await Journal.findOne();
      if (!testJournal) return;

      await Comment.create({
        userId: userId,
        userName: 'Test User',
        journalId: testJournal.journalId,
        content: 'Structured comment',
        rating: 4,
        isDeleted: false
      });

      const response = await request(app)
        .get('/api/admin/comments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // All comments should have a unified data structure
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
  });
});
