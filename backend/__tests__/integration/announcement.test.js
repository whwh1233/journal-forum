const request = require('supertest');
const app = require('../../server');
const { sequelize, Announcement, UserAnnouncementRead, User } = require('../../models');
const { Op } = require('sequelize');

describe('Announcement API Integration Tests', () => {
  let userToken;
  let userId;
  let adminToken;
  let adminId;
  let testAnnouncement;

  beforeAll(async () => {
    // Ensure database is connected
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    // Clean up test data in correct order (respect foreign key constraints)
    await UserAnnouncementRead.destroy({ where: {}, force: true });
    await Announcement.destroy({ where: {}, force: true });
    // Clean up users to avoid conflicts
    await User.destroy({ where: { email: { [Op.like]: '%@example.com' } }, force: true });

    // Create test user
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

    // Create admin user
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

    // Set user as admin
    await User.update({ role: 'admin' }, { where: { id: adminId } });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ==================== Public API Tests ====================

  describe('GET /api/announcements/banners', () => {
    it('should return active banner announcements without auth', async () => {
      // Create a banner announcement
      await Announcement.create({
        title: 'Test Banner',
        content: 'Banner content',
        type: 'banner',
        status: 'active',
        targetType: 'all',
        creatorId: adminId
      });

      const res = await request(app)
        .get('/api/announcements/banners');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].type).toBe('banner');
      expect(res.body.data[0].status).toBe('active');
    });

    it('should not return non-banner announcements', async () => {
      await Announcement.create({
        title: 'Normal Announcement',
        content: 'Normal content',
        type: 'normal',
        status: 'active',
        targetType: 'all',
        creatorId: adminId
      });

      const res = await request(app)
        .get('/api/announcements/banners');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });

  // ==================== User API Tests ====================

  describe('GET /api/announcements', () => {
    it('should return paginated announcements for authenticated user', async () => {
      // Create test announcements
      await Announcement.create({
        title: 'Announcement 1',
        content: 'Content 1',
        type: 'normal',
        status: 'active',
        targetType: 'all',
        creatorId: adminId
      });

      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('announcements');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.announcements)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/announcements');

      expect(res.status).toBe(401);
    });

    it('should filter announcements by targetType=role', async () => {
      // Create role-targeted announcement for admins only
      await Announcement.create({
        title: 'Admin Only',
        content: 'Admin content',
        type: 'normal',
        status: 'active',
        targetType: 'role',
        targetRoles: ['admin'],
        creatorId: adminId
      });

      // User should NOT see it
      const userRes = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${userToken}`);

      expect(userRes.status).toBe(200);
      expect(userRes.body.data.announcements.length).toBe(0);

      // Admin should see it
      const adminRes = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminRes.status).toBe(200);
      expect(adminRes.body.data.announcements.length).toBe(1);
      expect(adminRes.body.data.announcements[0].title).toBe('Admin Only');
    });

    it('should filter announcements by targetType=user', async () => {
      // Create user-targeted announcement
      await Announcement.create({
        title: 'User Specific',
        content: 'User content',
        type: 'normal',
        status: 'active',
        targetType: 'user',
        targetUserIds: [userId],
        creatorId: adminId
      });

      // Target user should see it
      const userRes = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${userToken}`);

      expect(userRes.status).toBe(200);
      expect(userRes.body.data.announcements.length).toBe(1);

      // Admin should NOT see it
      const adminRes = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminRes.status).toBe(200);
      expect(adminRes.body.data.announcements.length).toBe(0);
    });
  });

  describe('GET /api/announcements/unread-count', () => {
    it('should return correct unread count', async () => {
      // Create announcements
      const ann1 = await Announcement.create({
        title: 'Announcement 1',
        content: 'Content 1',
        type: 'normal',
        status: 'active',
        targetType: 'all',
        creatorId: adminId
      });

      await Announcement.create({
        title: 'Announcement 2',
        content: 'Content 2',
        type: 'normal',
        status: 'active',
        targetType: 'all',
        creatorId: adminId
      });

      // Initially all unread
      let res = await request(app)
        .get('/api/announcements/unread-count')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(2);

      // Mark one as read
      await UserAnnouncementRead.create({
        userId,
        announcementId: ann1.id,
        readAt: new Date()
      });

      res = await request(app)
        .get('/api/announcements/unread-count')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(1);
    });
  });

  describe('GET /api/announcements/:id', () => {
    it('should return announcement detail and auto-mark as read', async () => {
      const announcement = await Announcement.create({
        title: 'Test Announcement',
        content: 'Test content',
        type: 'normal',
        status: 'active',
        targetType: 'all',
        creatorId: adminId
      });

      const res = await request(app)
        .get(`/api/announcements/${announcement.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(announcement.id);

      // Check if marked as read
      const readRecord = await UserAnnouncementRead.findOne({
        where: { userId, announcementId: announcement.id }
      });

      expect(readRecord).not.toBeNull();
    });

    it('should return 404 for non-existent announcement', async () => {
      const res = await request(app)
        .get('/api/announcements/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 for non-visible announcement', async () => {
      // Create announcement for admin only
      const announcement = await Announcement.create({
        title: 'Admin Only',
        content: 'Admin content',
        type: 'normal',
        status: 'active',
        targetType: 'role',
        targetRoles: ['admin'],
        creatorId: adminId
      });

      const res = await request(app)
        .get(`/api/announcements/${announcement.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/announcements/:id/read', () => {
    it('should mark announcement as read', async () => {
      const announcement = await Announcement.create({
        title: 'Test',
        content: 'Content',
        type: 'normal',
        status: 'active',
        targetType: 'all',
        creatorId: adminId
      });

      const res = await request(app)
        .post(`/api/announcements/${announcement.id}/read`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const readRecord = await UserAnnouncementRead.findOne({
        where: { userId, announcementId: announcement.id }
      });

      expect(readRecord).not.toBeNull();
    });

    it('should mark announcement as dismissed when dismissed=true', async () => {
      const announcement = await Announcement.create({
        title: 'Urgent',
        content: 'Urgent content',
        type: 'urgent',
        status: 'active',
        targetType: 'all',
        creatorId: adminId
      });

      const res = await request(app)
        .post(`/api/announcements/${announcement.id}/read`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ dismissed: true });

      expect(res.status).toBe(200);

      const readRecord = await UserAnnouncementRead.findOne({
        where: { userId, announcementId: announcement.id }
      });

      expect(readRecord.dismissed).toBe(true);
    });
  });

  describe('POST /api/announcements/read-all', () => {
    it('should mark all visible announcements as read', async () => {
      // Create multiple announcements
      await Announcement.create({
        title: 'Ann 1',
        content: 'Content 1',
        type: 'normal',
        status: 'active',
        targetType: 'all',
        creatorId: adminId
      });

      await Announcement.create({
        title: 'Ann 2',
        content: 'Content 2',
        type: 'normal',
        status: 'active',
        targetType: 'all',
        creatorId: adminId
      });

      const res = await request(app)
        .post('/api/announcements/read-all')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Check unread count
      const countRes = await request(app)
        .get('/api/announcements/unread-count')
        .set('Authorization', `Bearer ${userToken}`);

      expect(countRes.body.data.count).toBe(0);
    });
  });

  // ==================== Admin API Tests ====================

  describe('POST /api/admin/announcements', () => {
    it('should create announcement as admin', async () => {
      const announcementData = {
        title: 'New Announcement',
        content: 'Announcement content',
        type: 'normal',
        targetType: 'all',
        colorScheme: 'info',
        priority: 5
      };

      const res = await request(app)
        .post('/api/admin/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(announcementData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(announcementData.title);
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.creatorId).toBe(adminId);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .post('/api/admin/announcements')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test',
          content: 'Content',
          type: 'normal'
        });

      expect(res.status).toBe(403);
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/admin/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test'
          // Missing content and type
        });

      expect(res.status).toBe(400);
    });

    it('should set status to scheduled if startTime is in future', async () => {
      const futureDate = new Date(Date.now() + 86400000); // +1 day

      const res = await request(app)
        .post('/api/admin/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Scheduled',
          content: 'Content',
          type: 'normal',
          startTime: futureDate.toISOString()
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('scheduled');
    });
  });

  describe('GET /api/admin/announcements', () => {
    it('should list all announcements with filters', async () => {
      await Announcement.create({
        title: 'Draft Ann',
        content: 'Content',
        type: 'normal',
        status: 'draft',
        targetType: 'all',
        creatorId: adminId
      });

      await Announcement.create({
        title: 'Active Ann',
        content: 'Content',
        type: 'banner',
        status: 'active',
        targetType: 'all',
        creatorId: adminId
      });

      // Get all
      let res = await request(app)
        .get('/api/admin/announcements')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.announcements.length).toBe(2);

      // Filter by status
      res = await request(app)
        .get('/api/admin/announcements?status=draft')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.announcements.length).toBe(1);
      expect(res.body.data.announcements[0].status).toBe('draft');

      // Filter by type
      res = await request(app)
        .get('/api/admin/announcements?type=banner')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.announcements.length).toBe(1);
      expect(res.body.data.announcements[0].type).toBe('banner');
    });

    it('should include read statistics', async () => {
      const announcement = await Announcement.create({
        title: 'Test',
        content: 'Content',
        type: 'normal',
        status: 'active',
        targetType: 'all',
        creatorId: adminId
      });

      // Mark as read by user
      await UserAnnouncementRead.create({
        userId,
        announcementId: announcement.id,
        readAt: new Date()
      });

      const res = await request(app)
        .get('/api/admin/announcements')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.announcements[0]).toHaveProperty('readCount');
      expect(res.body.data.announcements[0]).toHaveProperty('readPercentage');
      expect(res.body.data.announcements[0].readCount).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/admin/announcements/:id', () => {
    it('should update announcement', async () => {
      const announcement = await Announcement.create({
        title: 'Original',
        content: 'Original content',
        type: 'normal',
        status: 'draft',
        targetType: 'all',
        creatorId: adminId
      });

      const res = await request(app)
        .put(`/api/admin/announcements/${announcement.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Title',
          priority: 10
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.priority).toBe(10);
    });

    it('should not update archived announcement', async () => {
      const announcement = await Announcement.create({
        title: 'Archived',
        content: 'Content',
        type: 'normal',
        status: 'archived',
        targetType: 'all',
        creatorId: adminId
      });

      const res = await request(app)
        .put(`/api/admin/announcements/${announcement.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'New Title' });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/admin/announcements/:id/publish', () => {
    it('should publish draft announcement', async () => {
      const announcement = await Announcement.create({
        title: 'Draft',
        content: 'Content',
        type: 'normal',
        status: 'draft',
        targetType: 'all',
        creatorId: adminId
      });

      const res = await request(app)
        .put(`/api/admin/announcements/${announcement.id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');
    });

    it('should not publish non-draft announcement', async () => {
      const announcement = await Announcement.create({
        title: 'Active',
        content: 'Content',
        type: 'normal',
        status: 'active',
        targetType: 'all',
        creatorId: adminId
      });

      const res = await request(app)
        .put(`/api/admin/announcements/${announcement.id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/admin/announcements/:id/archive', () => {
    it('should archive active announcement', async () => {
      const announcement = await Announcement.create({
        title: 'Active',
        content: 'Content',
        type: 'normal',
        status: 'active',
        targetType: 'all',
        creatorId: adminId
      });

      const res = await request(app)
        .put(`/api/admin/announcements/${announcement.id}/archive`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('archived');
    });

    it('should not archive non-active announcement', async () => {
      const announcement = await Announcement.create({
        title: 'Draft',
        content: 'Content',
        type: 'normal',
        status: 'draft',
        targetType: 'all',
        creatorId: adminId
      });

      const res = await request(app)
        .put(`/api/admin/announcements/${announcement.id}/archive`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/admin/announcements/:id', () => {
    it('should delete draft announcement', async () => {
      const announcement = await Announcement.create({
        title: 'Draft',
        content: 'Content',
        type: 'normal',
        status: 'draft',
        targetType: 'all',
        creatorId: adminId
      });

      const res = await request(app)
        .delete(`/api/admin/announcements/${announcement.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      const deleted = await Announcement.findByPk(announcement.id);
      expect(deleted).toBeNull();
    });

    it('should not delete active announcement', async () => {
      const announcement = await Announcement.create({
        title: 'Active',
        content: 'Content',
        type: 'normal',
        status: 'active',
        targetType: 'all',
        creatorId: adminId
      });

      const res = await request(app)
        .delete(`/api/admin/announcements/${announcement.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  // ==================== Lifecycle Test ====================

  describe('Announcement Lifecycle', () => {
    it('should complete full lifecycle: create → publish → archive', async () => {
      // 1. Create draft
      let res = await request(app)
        .post('/api/admin/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Lifecycle Test',
          content: 'Test content',
          type: 'normal',
          targetType: 'all'
        });

      expect(res.status).toBe(201);
      const announcementId = res.body.data.id;
      expect(res.body.data.status).toBe('draft');

      // 2. User should NOT see draft
      res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.body.data.announcements.length).toBe(0);

      // 3. Publish
      res = await request(app)
        .put(`/api/admin/announcements/${announcementId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');

      // 4. User should see active announcement
      res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.body.data.announcements.length).toBe(1);
      expect(res.body.data.announcements[0].id).toBe(announcementId);

      // 5. Archive
      res = await request(app)
        .put(`/api/admin/announcements/${announcementId}/archive`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('archived');

      // 6. User should NOT see archived announcement
      res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.body.data.announcements.length).toBe(0);
    });
  });
});
