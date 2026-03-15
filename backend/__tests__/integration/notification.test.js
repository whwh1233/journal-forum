const request = require('supertest');
const app = require('../../server');
const { sequelize, Notification, User } = require('../../models');
const { Op } = require('sequelize');
const {
  generateTestToken,
  createTestNotification,
  cleanupTestData
} = require('../helpers/testHelpers');
const notificationService = require('../../services/notificationService');

jest.setTimeout(10000);

describe('Notification Integration Tests', () => {
  let userA, userB, userC;
  let tokenA, tokenB, tokenC;

  beforeAll(async () => {
    await sequelize.authenticate();

    // Create users via register API to avoid uuid mock issues
    const ts = Date.now();

    const resA = await request(app)
      .post('/api/auth/register')
      .send({ email: `notif-a-${ts}@example.com`, password: 'TestPass123!', name: 'NotifUserA' });
    userA = resA.body.data.user;
    tokenA = resA.body.data.token;

    const resB = await request(app)
      .post('/api/auth/register')
      .send({ email: `notif-b-${ts}@example.com`, password: 'TestPass123!', name: 'NotifUserB' });
    userB = resB.body.data.user;
    tokenB = resB.body.data.token;

    const resC = await request(app)
      .post('/api/auth/register')
      .send({ email: `notif-c-${ts}@example.com`, password: 'TestPass123!', name: 'NotifUserC' });
    userC = resC.body.data.user;
    tokenC = resC.body.data.token;
  });

  afterEach(async () => {
    if (userA && userB && userC) {
      await Notification.destroy({
        where: {
          recipientId: { [Op.in]: [userA.id, userB.id, userC.id] }
        }
      });
    }
  });

  afterAll(async () => {
    if (userA && userB && userC) {
      await cleanupTestData([userA.id, userB.id, userC.id]);
    }
    await sequelize.close();
  });

  // ==================== GET /api/notifications ====================

  describe('GET /api/notifications', () => {
    it('should return paginated notification list for the current user', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'comment_reply' });
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like' });

      const res = await request(app)
        .get('/api/notifications?page=1&limit=20')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('notifications');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
      expect(res.body.data.notifications.length).toBe(2);
      expect(res.body.data.pagination.total).toBe(2);
    });

    it('should filter notifications by type', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'comment_reply' });
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like' });
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like' });

      const res = await request(app)
        .get('/api/notifications?type=like')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications.length).toBe(2);
      expect(res.body.data.notifications.every(n => n.type === 'like')).toBe(true);
    });

    it('should not leak notifications from other users', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'comment_reply' });
      await createTestNotification({ recipientId: userC.id, senderId: userB.id, type: 'comment_reply' });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications.length).toBe(1);
      expect(res.body.data.notifications[0].recipientId).toBe(userA.id);
    });

    it('should return notifications in DESC order by createdAt', async () => {
      const n1 = await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like' });
      // small delay to ensure distinct timestamps
      await new Promise(r => setTimeout(r, 20));
      const n2 = await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'new_follower' });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.notifications.map(n => n.id);
      expect(ids[0]).toBe(n2.id);
      expect(ids[1]).toBe(n1.id);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });

    it('should include sender info (id, name, avatar)', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'comment_reply' });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const notif = res.body.data.notifications[0];
      expect(notif).toHaveProperty('sender');
      expect(notif.sender).toHaveProperty('id', userB.id);
      expect(notif.sender).toHaveProperty('name');
      expect(notif.sender).toHaveProperty('avatar');
    });

    it('should return empty list when page overflows', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like' });

      const res = await request(app)
        .get('/api/notifications?page=999&limit=20')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications.length).toBe(0);
    });

    it('should return empty list for an invalid/unknown type filter', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like' });

      const res = await request(app)
        .get('/api/notifications?type=nonexistent_type_xyz')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications.length).toBe(0);
    });

    it('should handle system notification with null senderId', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: null, type: 'system' });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications.length).toBe(1);
      const notif = res.body.data.notifications[0];
      expect(notif.type).toBe('system');
      expect(notif.sender).toBeNull();
    });
  });

  // ==================== GET /api/notifications/unread-count ====================

  describe('GET /api/notifications/unread-count', () => {
    it('should return the correct unread count', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like', isRead: false });
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like', isRead: false });
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'new_follower', isRead: true });

      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(2);
    });

    it('should decrease count after marking a notification as read', async () => {
      const n1 = await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like', isRead: false });
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like', isRead: false });

      let res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.body.data.count).toBe(2);

      await request(app)
        .post(`/api/notifications/${n1.id}/read`)
        .set('Authorization', `Bearer ${tokenA}`);

      res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(1);
    });

    it('should only count unread notifications belonging to the current user', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like', isRead: false });
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like', isRead: false });
      // userC has separate unread notifications
      await createTestNotification({ recipientId: userC.id, senderId: userB.id, type: 'like', isRead: false });
      await createTestNotification({ recipientId: userC.id, senderId: userB.id, type: 'like', isRead: false });
      await createTestNotification({ recipientId: userC.id, senderId: userB.id, type: 'like', isRead: false });

      const resA = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resA.body.data.count).toBe(2);

      const resC = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenC}`);

      expect(resC.body.data.count).toBe(3);
    });
  });

  // ==================== GET /api/notifications/:id ====================

  describe('GET /api/notifications/:id', () => {
    it('should return notification detail', async () => {
      const notif = await createTestNotification({
        recipientId: userA.id,
        senderId: userB.id,
        type: 'comment_reply',
        content: { text: 'hello' }
      });

      const res = await request(app)
        .get(`/api/notifications/${notif.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(notif.id);
      expect(res.body.data.type).toBe('comment_reply');
    });

    it('should auto-mark notification as read with readAt timestamp', async () => {
      const notif = await createTestNotification({
        recipientId: userA.id,
        senderId: userB.id,
        type: 'like',
        isRead: false
      });

      expect(notif.isRead).toBe(false);

      const res = await request(app)
        .get(`/api/notifications/${notif.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isRead).toBe(true);
      expect(res.body.data.readAt).not.toBeNull();

      // Verify in DB
      const updated = await Notification.findByPk(notif.id);
      expect(updated.isRead).toBe(true);
      expect(updated.readAt).not.toBeNull();
    });

    it('should return 404 when accessing another user\'s notification', async () => {
      const notif = await createTestNotification({
        recipientId: userB.id,
        senderId: userA.id,
        type: 'like'
      });

      const res = await request(app)
        .get(`/api/notifications/${notif.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for a non-existent notification ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const res = await request(app)
        .get(`/api/notifications/${fakeId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ==================== POST /api/notifications/:id/read ====================

  describe('POST /api/notifications/:id/read', () => {
    it('should mark a notification as read', async () => {
      const notif = await createTestNotification({
        recipientId: userA.id,
        senderId: userB.id,
        type: 'new_follower',
        isRead: false
      });

      const res = await request(app)
        .post(`/api/notifications/${notif.id}/read`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Notification.findByPk(notif.id);
      expect(updated.isRead).toBe(true);
      expect(updated.readAt).not.toBeNull();
    });

    it('should be idempotent — marking already-read notification succeeds without error', async () => {
      const notif = await createTestNotification({
        recipientId: userA.id,
        senderId: userB.id,
        type: 'like',
        isRead: true,
        readAt: new Date()
      });

      const res = await request(app)
        .post(`/api/notifications/${notif.id}/read`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 when trying to mark another user\'s notification', async () => {
      const notif = await createTestNotification({
        recipientId: userB.id,
        senderId: userA.id,
        type: 'comment_reply'
      });

      const res = await request(app)
        .post(`/api/notifications/${notif.id}/read`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ==================== POST /api/notifications/read-all ====================

  describe('POST /api/notifications/read-all', () => {
    it('should mark all of the current user\'s notifications as read', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like', isRead: false });
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'comment_reply', isRead: false });
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'new_follower', isRead: false });

      const res = await request(app)
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(countRes.body.data.count).toBe(0);
    });

    it('should not affect notifications belonging to other users', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like', isRead: false });
      await createTestNotification({ recipientId: userC.id, senderId: userB.id, type: 'like', isRead: false });
      await createTestNotification({ recipientId: userC.id, senderId: userB.id, type: 'comment_reply', isRead: false });

      await request(app)
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${tokenA}`);

      const resC = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenC}`);

      expect(resC.body.data.count).toBe(2);
    });

    it('should succeed even when there are no unread notifications', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like', isRead: true });

      const res = await request(app)
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ==================== NotificationService ====================

  describe('NotificationService', () => {
    it('create() should create and return a notification', async () => {
      const result = await notificationService.create({
        recipientId: userA.id,
        senderId: userB.id,
        type: 'like',
        entityType: 'comment',
        entityId: '00000000-0000-0000-0000-000000000001',
        content: { text: 'liked your comment' }
      });

      expect(result).not.toBeNull();
      expect(result.id).toBeDefined();
      expect(result.recipientId).toBe(userA.id);
      expect(result.senderId).toBe(userB.id);
      expect(result.type).toBe('like');

      const inDB = await Notification.findByPk(result.id);
      expect(inDB).not.toBeNull();
    });

    it('create() should silently skip and return null when sender === recipient', async () => {
      const result = await notificationService.create({
        recipientId: userA.id,
        senderId: userA.id,
        type: 'like'
      });

      expect(result).toBeNull();

      const count = await Notification.count({ where: { recipientId: userA.id } });
      expect(count).toBe(0);
    });

    it('create() should return null silently on invalid data instead of throwing', async () => {
      // Pass an invalid type to trigger a DB error
      const result = await notificationService.create({
        recipientId: userA.id,
        senderId: userB.id,
        type: 'INVALID_TYPE_THAT_DOES_NOT_EXIST'
      });

      expect(result).toBeNull();
    });

    it('create() should correctly round-trip a JSON content object', async () => {
      const contentData = {
        commentText: 'Great paper!',
        journalTitle: 'Science Journal',
        nested: { key: 'value', count: 42 }
      };

      const result = await notificationService.create({
        recipientId: userA.id,
        senderId: userB.id,
        type: 'comment_reply',
        content: contentData
      });

      expect(result).not.toBeNull();

      const inDB = await Notification.findByPk(result.id);
      expect(inDB.content).toEqual(contentData);
    });

    it('createBulk() should create notifications for multiple recipients', async () => {
      const results = await notificationService.createBulk(
        [userA.id, userC.id],
        {
          senderId: userB.id,
          type: 'journal_new_comment',
          content: { message: 'New comment on a journal you follow' }
        }
      );

      expect(results.length).toBe(2);
      const recipientIds = results.map(r => r.recipientId);
      expect(recipientIds).toContain(userA.id);
      expect(recipientIds).toContain(userC.id);
    });

    it('createBulk() should auto-exclude sender from recipients', async () => {
      // userB is both the sender and in the recipient list
      const results = await notificationService.createBulk(
        [userA.id, userB.id, userC.id],
        {
          senderId: userB.id,
          type: 'journal_new_comment',
          content: {}
        }
      );

      expect(results.length).toBe(2);
      const recipientIds = results.map(r => r.recipientId);
      expect(recipientIds).not.toContain(userB.id);
      expect(recipientIds).toContain(userA.id);
      expect(recipientIds).toContain(userC.id);
    });
  });

  // ==================== All Types Coverage ====================

  describe('All Notification Types Coverage', () => {
    const NOTIFICATION_TYPES = [
      'comment_reply',
      'post_comment',
      'post_comment_reply',
      'like',
      'new_follower',
      'follow_new_content',
      'journal_new_comment',
      'badge_earned',
      'comment_deleted',
      'submission_status',
      'system'
    ];

    it.each(NOTIFICATION_TYPES)(
      'type "%s" can be created via service and retrieved via API',
      async (notifType) => {
        const created = await notificationService.create({
          recipientId: userA.id,
          senderId: notifType === 'system' ? null : userB.id,
          type: notifType,
          content: { type: notifType }
        });

        expect(created).not.toBeNull();
        expect(created.type).toBe(notifType);

        const res = await request(app)
          .get(`/api/notifications/${created.id}`)
          .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body.data.type).toBe(notifType);
      }
    );
  });
});
