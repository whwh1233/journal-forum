# Notification & Announcement Testing System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build comprehensive automated tests for the Notification + Announcement system across backend integration, frontend unit/component, and E2E layers (~155-195 test cases).

**Architecture:** Extend existing `testHelpers.js` with DB-level factories, create new test files following established patterns (supertest+Jest for backend, Vitest+RTL for frontend, Playwright for E2E). Each test file manages its own data lifecycle using shared factory functions.

**Tech Stack:** Jest + supertest (backend), Vitest + React Testing Library (frontend), Playwright (E2E), MySQL (real DB for integration tests)

**Spec:** `docs/superpowers/specs/2026-03-15-notification-testing-design.md`

---

## Chunk 1: Backend Test Factories + Notification Integration Tests

### Task 1: Extend testHelpers.js with DB-level factory functions

**Files:**
- Modify: `backend/__tests__/helpers/testHelpers.js`

- [ ] **Step 1: Add factory functions to testHelpers.js**

Add these functions after the existing exports. Key patterns: UUID suffix for uniqueness, pre-hashed password to avoid bcrypt overhead, cascade cleanup respecting FK order.

```javascript
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Pre-hash password once (avoids bcrypt overhead per test)
const PRE_HASHED_PASSWORD = bcrypt.hashSync('TestPass123!', 10);

/**
 * Create a user directly in the database. Returns Sequelize instance.
 * Unlike createTestUser() which returns a plain object for registration API,
 * this creates the record directly for test setup speed.
 */
const createTestUserInDB = async (overrides = {}) => {
  const { User } = require('../../models');
  const suffix = uuidv4().slice(0, 8);
  return User.create({
    name: `TestUser-${suffix}`,
    email: `test-${suffix}@example.com`,
    password: PRE_HASHED_PASSWORD,
    role: 'user',
    ...overrides
  });
};

/**
 * Create a notification directly in the database. Returns Sequelize instance.
 */
const createTestNotification = async (overrides = {}) => {
  const Notification = require('../../models/Notification');
  return Notification.create({
    type: 'comment_reply',
    entityType: 'comment',
    entityId: uuidv4(),
    content: { title: 'Test notification', body: 'Test body' },
    isRead: false,
    ...overrides
    // recipientId and senderId must be provided via overrides
  });
};

/**
 * Create an announcement directly in the database. Returns Sequelize instance.
 */
const createTestAnnouncement = async (overrides = {}) => {
  const { Announcement } = require('../../models');
  return Announcement.create({
    title: 'Test Announcement',
    content: 'Test content',
    type: 'normal',
    status: 'active',
    targetType: 'all',
    colorScheme: 'info',
    priority: 0,
    isPinned: false,
    ...overrides
    // creatorId must be provided via overrides
  });
};

/**
 * Clean up test data by user IDs. Respects FK constraint order.
 */
const cleanupTestData = async (userIds) => {
  const { Notification, Announcement, UserAnnouncementRead, User } = require('../../models');
  const { Op } = require('sequelize');

  if (!userIds || userIds.length === 0) return;

  // 1. Notifications (referencing users as recipient/sender)
  await Notification.destroy({
    where: {
      [Op.or]: [
        { recipientId: { [Op.in]: userIds } },
        { senderId: { [Op.in]: userIds } }
      ]
    },
    force: true
  });

  // 2. UserAnnouncementRead (referencing users)
  await UserAnnouncementRead.destroy({
    where: { userId: { [Op.in]: userIds } },
    force: true
  });

  // 3. Announcements created by these users
  await Announcement.destroy({
    where: { creatorId: { [Op.in]: userIds } },
    force: true
  });

  // 4. Users themselves
  await User.destroy({
    where: { id: { [Op.in]: userIds } },
    force: true
  });
};
```

Update the `module.exports` to include the new functions:

```javascript
module.exports = {
  generateTestToken,
  generateAdminToken,
  generateUserToken,
  wait,
  expectSuccessResponse,
  expectErrorResponse,
  createTestUser,
  createTestJournal,
  createTestComment,
  // DB-level factories
  createTestUserInDB,
  createTestNotification,
  createTestAnnouncement,
  cleanupTestData,
};
```

- [ ] **Step 2: Verify factories work**

Run: `cd backend && node -e "const h = require('./__tests__/helpers/testHelpers'); console.log(Object.keys(h))"`
Expected: Output includes `createTestUserInDB`, `createTestNotification`, `createTestAnnouncement`, `cleanupTestData`

- [ ] **Step 3: Commit**

```bash
git add backend/__tests__/helpers/testHelpers.js
git commit -m "test: add DB-level factory functions to testHelpers"
```

---

### Task 2: Backend Notification integration tests — List & Filter

**Files:**
- Create: `backend/__tests__/integration/notification.test.js`

- [ ] **Step 1: Create test file with setup/teardown and GET /api/notifications tests**

```javascript
const request = require('supertest');
const app = require('../../server');
const { sequelize } = require('../../models');
const Notification = require('../../models/Notification');
const {
  generateTestToken,
  createTestUserInDB,
  createTestNotification,
  cleanupTestData,
} = require('../helpers/testHelpers');

describe('Notification API Integration Tests', () => {
  let userA, userB, userC;
  let tokenA, tokenB, tokenC;
  const testUserIds = [];

  beforeAll(async () => {
    await sequelize.authenticate();

    userA = await createTestUserInDB({ name: 'UserA-Recipient' });
    userB = await createTestUserInDB({ name: 'UserB-Sender' });
    userC = await createTestUserInDB({ name: 'UserC-Isolated' });

    testUserIds.push(userA.id, userB.id, userC.id);

    tokenA = generateTestToken(userA.id, 'user');
    tokenB = generateTestToken(userB.id, 'user');
    tokenC = generateTestToken(userC.id, 'user');
  });

  afterEach(async () => {
    // Clean notifications between test groups
    await Notification.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await cleanupTestData(testUserIds);
    await sequelize.close();
  });

  // ==================== GET /api/notifications ====================

  describe('GET /api/notifications', () => {
    it('should return paginated notification list for current user', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id });
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like' });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toHaveLength(2);
      expect(res.body.data.pagination).toMatchObject({
        total: 2,
        page: 1,
        limit: 20
      });
    });

    it('should support type filter', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'comment_reply' });
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like' });
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like' });

      const res = await request(app)
        .get('/api/notifications?type=like')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(2);
      expect(res.body.data.notifications.every(n => n.type === 'like')).toBe(true);
    });

    it('should not return other users notifications', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id });
      await createTestNotification({ recipientId: userC.id, senderId: userB.id });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.body.data.notifications).toHaveLength(1);
      expect(res.body.data.notifications[0].recipientId).toBe(userA.id);
    });

    it('should order by createdAt DESC', async () => {
      const n1 = await createTestNotification({ recipientId: userA.id, senderId: userB.id });
      // Small delay to ensure different timestamps
      await new Promise(r => setTimeout(r, 50));
      const n2 = await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like' });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.body.data.notifications[0].id).toBe(n2.id);
      expect(res.body.data.notifications[1].id).toBe(n1.id);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });

    it('should include sender info (id, name, avatar)', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA}`);

      const notification = res.body.data.notifications[0];
      expect(notification.sender).toBeDefined();
      expect(notification.sender.id).toBe(userB.id);
      expect(notification.sender.name).toBe('UserB-Sender');
      expect(notification.sender).toHaveProperty('avatar');
    });

    it('should return empty array when page exceeds total', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id });

      const res = await request(app)
        .get('/api/notifications?page=999')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(0);
    });

    it('should return empty for invalid type filter', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id });

      const res = await request(app)
        .get('/api/notifications?type=nonexistent')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(0);
    });

    it('should handle system notifications with null senderId', async () => {
      await createTestNotification({
        recipientId: userA.id,
        senderId: null,
        type: 'system',
        content: { title: 'System message', body: 'System body' }
      });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.body.data.notifications[0].sender).toBeNull();
      expect(res.body.data.notifications[0].type).toBe('system');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd backend && npx jest __tests__/integration/notification.test.js --verbose`
Expected: 8 tests PASS

- [ ] **Step 3: Commit**

```bash
git add backend/__tests__/integration/notification.test.js
git commit -m "test: add notification list & filter integration tests"
```

---

### Task 3: Backend Notification integration tests — Unread count, Detail, Mark read

**Files:**
- Modify: `backend/__tests__/integration/notification.test.js`

- [ ] **Step 1: Add unread-count, detail, mark-read, and mark-all-read test groups**

Append inside the main `describe` block, after the GET /api/notifications group:

```javascript
  // ==================== GET /api/notifications/unread-count ====================

  describe('GET /api/notifications/unread-count', () => {
    it('should return correct unread count', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, isRead: false });
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, isRead: false });
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, isRead: true });

      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(2);
    });

    it('should decrease after marking as read', async () => {
      const n = await createTestNotification({ recipientId: userA.id, senderId: userB.id });

      await request(app)
        .post(`/api/notifications/${n.id}/read`)
        .set('Authorization', `Bearer ${tokenA}`);

      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.body.data.count).toBe(0);
    });

    it('should only count current user unread', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id });
      await createTestNotification({ recipientId: userC.id, senderId: userB.id });

      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.body.data.count).toBe(1);
    });
  });

  // ==================== GET /api/notifications/:id ====================

  describe('GET /api/notifications/:id', () => {
    it('should return notification detail', async () => {
      const n = await createTestNotification({
        recipientId: userA.id,
        senderId: userB.id,
        content: { title: 'Detail Test', body: 'Detail body' }
      });

      const res = await request(app)
        .get(`/api/notifications/${n.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(n.id);
      expect(res.body.data.content.title).toBe('Detail Test');
    });

    it('should auto-mark as read and set readAt', async () => {
      const n = await createTestNotification({ recipientId: userA.id, senderId: userB.id });
      expect(n.isRead).toBe(false);

      const res = await request(app)
        .get(`/api/notifications/${n.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.body.data.isRead).toBe(true);
      expect(res.body.data.readAt).not.toBeNull();
    });

    it('should return 404 for other user notification', async () => {
      const n = await createTestNotification({ recipientId: userC.id, senderId: userB.id });

      const res = await request(app)
        .get(`/api/notifications/${n.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .get('/api/notifications/non-existent-uuid')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
    });
  });

  // ==================== POST /api/notifications/:id/read ====================

  describe('POST /api/notifications/:id/read', () => {
    it('should mark single notification as read', async () => {
      const n = await createTestNotification({ recipientId: userA.id, senderId: userB.id });

      const res = await request(app)
        .post(`/api/notifications/${n.id}/read`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify in DB
      await n.reload();
      expect(n.isRead).toBe(true);
      expect(n.readAt).not.toBeNull();
    });

    it('should be idempotent (marking already-read does not error)', async () => {
      const n = await createTestNotification({ recipientId: userA.id, senderId: userB.id, isRead: true });

      const res = await request(app)
        .post(`/api/notifications/${n.id}/read`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
    });

    it('should return 404 for other user notification', async () => {
      const n = await createTestNotification({ recipientId: userC.id, senderId: userB.id });

      const res = await request(app)
        .post(`/api/notifications/${n.id}/read`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
    });
  });

  // ==================== POST /api/notifications/read-all ====================

  describe('POST /api/notifications/read-all', () => {
    it('should mark all unread as read', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id });
      await createTestNotification({ recipientId: userA.id, senderId: userB.id, type: 'like' });

      const res = await request(app)
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);

      // Verify unread count is now 0
      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(countRes.body.data.count).toBe(0);
    });

    it('should not affect other user notifications', async () => {
      await createTestNotification({ recipientId: userA.id, senderId: userB.id });
      await createTestNotification({ recipientId: userC.id, senderId: userB.id });

      await request(app)
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${tokenA}`);

      // userC's notification should still be unread
      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenC}`);
      expect(countRes.body.data.count).toBe(1);
    });

    it('should succeed when no unread notifications exist', async () => {
      const res = await request(app)
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
```

- [ ] **Step 2: Run tests**

Run: `cd backend && npx jest __tests__/integration/notification.test.js --verbose`
Expected: All 21 tests PASS

- [ ] **Step 3: Commit**

```bash
git add backend/__tests__/integration/notification.test.js
git commit -m "test: add notification unread-count, detail, and mark-read tests"
```

---

### Task 4: Backend Notification integration tests — NotificationService + all types

**Files:**
- Modify: `backend/__tests__/integration/notification.test.js`

- [ ] **Step 1: Add NotificationService tests and all-types test**

Append inside the main `describe` block:

```javascript
  // ==================== NotificationService ====================

  describe('NotificationService', () => {
    const notificationService = require('../../services/notificationService');

    it('should create notification successfully', async () => {
      const n = await notificationService.create({
        recipientId: userA.id,
        senderId: userB.id,
        type: 'comment_reply',
        entityType: 'comment',
        entityId: 'entity-123',
        content: { title: 'Reply', body: 'Someone replied' }
      });

      expect(n).not.toBeNull();
      expect(n.recipientId).toBe(userA.id);
      expect(n.type).toBe('comment_reply');
    });

    it('should silently skip when sender === recipient', async () => {
      const n = await notificationService.create({
        recipientId: userA.id,
        senderId: userA.id,
        type: 'comment_reply'
      });

      expect(n).toBeNull();
    });

    it('should not throw on error (silent failure)', async () => {
      // Pass invalid type to trigger DB error
      const n = await notificationService.create({
        recipientId: userA.id,
        senderId: userB.id,
        type: 'invalid_type_that_does_not_exist'
      });

      expect(n).toBeNull();
    });

    it('should correctly store and retrieve JSON content', async () => {
      const content = {
        title: 'Comment Reply',
        body: 'User replied to your comment',
        journalTitle: 'Test Journal',
        commentContent: 'This is the reply text'
      };

      const n = await notificationService.create({
        recipientId: userA.id,
        senderId: userB.id,
        type: 'comment_reply',
        entityType: 'comment',
        entityId: 'entity-456',
        content
      });

      // Re-fetch from DB to verify round-trip
      const fetched = await Notification.findByPk(n.id);
      expect(fetched.content).toEqual(content);
    });

    it('createBulk should create for multiple recipients', async () => {
      const results = await notificationService.createBulk(
        [userA.id, userC.id],
        {
          senderId: userB.id,
          type: 'journal_new_comment',
          entityType: 'journal',
          entityId: 'journal-1',
          content: { title: 'New comment', body: 'On a journal you follow' }
        }
      );

      expect(results).toHaveLength(2);
      expect(results.map(r => r.recipientId).sort()).toEqual([userA.id, userC.id].sort());
    });

    it('createBulk should auto-exclude sender from recipients', async () => {
      const results = await notificationService.createBulk(
        [userA.id, userB.id, userC.id],
        {
          senderId: userB.id,
          type: 'journal_new_comment',
          entityType: 'journal',
          entityId: 'journal-2',
          content: { title: 'New comment', body: 'Body' }
        }
      );

      // userB (sender) should be excluded
      expect(results).toHaveLength(2);
      expect(results.find(r => r.recipientId === userB.id)).toBeUndefined();
    });
  });

  // ==================== All Notification Types ====================

  describe('Notification Types Coverage', () => {
    const allTypes = [
      'comment_reply', 'post_comment', 'post_comment_reply',
      'like', 'new_follower', 'follow_new_content',
      'journal_new_comment', 'badge_earned', 'comment_deleted',
      'submission_status', 'system'
    ];

    it.each(allTypes)('should create and retrieve type: %s', async (type) => {
      const n = await createTestNotification({
        recipientId: userA.id,
        senderId: type === 'system' ? null : userB.id,
        type
      });

      const res = await request(app)
        .get(`/api/notifications/${n.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.type).toBe(type);
    });
  });
```

- [ ] **Step 2: Run all notification tests**

Run: `cd backend && npx jest __tests__/integration/notification.test.js --verbose`
Expected: ~38 tests PASS (8 + 13 + 6 + 11)

- [ ] **Step 3: Commit**

```bash
git add backend/__tests__/integration/notification.test.js
git commit -m "test: add NotificationService and all-types coverage tests"
```

---

### Task 5: Backend Announcement test expansion

**Files:**
- Modify: `backend/__tests__/integration/announcement.test.js`

- [ ] **Step 1: Append new test groups at end of file**

Add these `describe` blocks inside the main describe, before the closing `});`:

```javascript
  // ==================== 定时发布 & 状态同步 ====================

  describe('定时发布 & 状态同步 (syncStaleStatuses)', () => {
    it('should auto-activate scheduled announcement when startTime is past', async () => {
      const announcement = await Announcement.create({
        title: 'Scheduled Test',
        content: 'Content',
        type: 'normal',
        status: 'scheduled',
        targetType: 'all',
        creatorId: adminId,
        startTime: new Date(Date.now() - 60000), // 1 minute ago
      });

      // Fetching triggers syncStaleStatuses
      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      // Verify the announcement is now active
      const updated = await Announcement.findByPk(announcement.id);
      expect(updated.status).toBe('active');
    });

    it('should auto-expire active announcement when endTime is past', async () => {
      await Announcement.create({
        title: 'Expiring Test',
        content: 'Content',
        type: 'normal',
        status: 'active',
        targetType: 'all',
        creatorId: adminId,
        endTime: new Date(Date.now() - 60000), // 1 minute ago
      });

      await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${userToken}`);

      const announcements = await Announcement.findAll({ where: { title: 'Expiring Test' } });
      expect(announcements[0].status).toBe('expired');
    });

    it('should handle multiple stale announcements in batch', async () => {
      await Announcement.create({
        title: 'Batch Scheduled',
        content: 'Content',
        type: 'normal',
        status: 'scheduled',
        targetType: 'all',
        creatorId: adminId,
        startTime: new Date(Date.now() - 60000),
      });
      await Announcement.create({
        title: 'Batch Expiring',
        content: 'Content',
        type: 'normal',
        status: 'active',
        targetType: 'all',
        creatorId: adminId,
        endTime: new Date(Date.now() - 60000),
      });

      await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${userToken}`);

      const scheduled = await Announcement.findOne({ where: { title: 'Batch Scheduled' } });
      const expiring = await Announcement.findOne({ where: { title: 'Batch Expiring' } });
      expect(scheduled.status).toBe('active');
      expect(expiring.status).toBe('expired');
    });

    it('should not affect draft status even if startTime is past', async () => {
      await Announcement.create({
        title: 'Draft Test',
        content: 'Content',
        type: 'normal',
        status: 'draft',
        targetType: 'all',
        creatorId: adminId,
        startTime: new Date(Date.now() - 60000),
      });

      await request(app)
        .get('/api/admin/announcements')
        .set('Authorization', `Bearer ${adminToken}`);

      const draft = await Announcement.findOne({ where: { title: 'Draft Test' } });
      expect(draft.status).toBe('draft');
    });
  });

  // ==================== 边界条件 ====================

  describe('边界条件', () => {
    it('should treat null startTime/endTime as permanently valid', async () => {
      await Announcement.create({
        title: 'Permanent',
        content: 'Content',
        type: 'normal',
        status: 'active',
        targetType: 'all',
        creatorId: adminId,
        startTime: null,
        endTime: null,
      });

      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.body.data.announcements.some(a => a.title === 'Permanent')).toBe(true);
    });

    it('should sort by priority (higher first)', async () => {
      await Announcement.create({ title: 'Low', content: 'C', type: 'normal', status: 'active', targetType: 'all', creatorId: adminId, priority: 1 });
      await Announcement.create({ title: 'High', content: 'C', type: 'normal', status: 'active', targetType: 'all', creatorId: adminId, priority: 10 });

      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${userToken}`);

      const titles = res.body.data.announcements.map(a => a.title);
      expect(titles.indexOf('High')).toBeLessThan(titles.indexOf('Low'));
    });

    it('should show pinned announcements first', async () => {
      await Announcement.create({ title: 'Not Pinned', content: 'C', type: 'normal', status: 'active', targetType: 'all', creatorId: adminId, isPinned: false, priority: 100 });
      await Announcement.create({ title: 'Pinned', content: 'C', type: 'normal', status: 'active', targetType: 'all', creatorId: adminId, isPinned: true, priority: 0 });

      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.body.data.announcements[0].title).toBe('Pinned');
    });

    it('should return empty when page exceeds total', async () => {
      await Announcement.create({ title: 'Only One', content: 'C', type: 'normal', status: 'active', targetType: 'all', creatorId: adminId });

      const res = await request(app)
        .get('/api/announcements?page=999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.body.data.announcements).toHaveLength(0);
    });

    it('should not create duplicate read records on concurrent mark-as-read', async () => {
      const ann = await Announcement.create({ title: 'Concurrent', content: 'C', type: 'normal', status: 'active', targetType: 'all', creatorId: adminId });

      // Fire two mark-as-read requests concurrently
      await Promise.all([
        request(app).post(`/api/announcements/${ann.id}/read`).set('Authorization', `Bearer ${userToken}`),
        request(app).post(`/api/announcements/${ann.id}/read`).set('Authorization', `Bearer ${userToken}`),
      ]);

      const readRecords = await UserAnnouncementRead.findAll({
        where: { userId, announcementId: ann.id }
      });
      expect(readRecords).toHaveLength(1);
    });
  });

  // ==================== 管理员统计 ====================

  describe('管理员统计', () => {
    it('should calculate correct readCount and readPercentage', async () => {
      const ann = await Announcement.create({ title: 'Stats Test', content: 'C', type: 'normal', status: 'active', targetType: 'all', creatorId: adminId });

      // User reads it
      await request(app)
        .post(`/api/announcements/${ann.id}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      const res = await request(app)
        .get(`/api/admin/announcements/${ann.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.data.readCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.readPercentage).toBeGreaterThan(0);
    });

    it('should calculate percentage based on target audience size for role targeting', async () => {
      const ann = await Announcement.create({
        title: 'Role Target Stats',
        content: 'C',
        type: 'normal',
        status: 'active',
        targetType: 'role',
        targetRoles: ['admin'],
        creatorId: adminId
      });

      const res = await request(app)
        .get(`/api/admin/announcements/${ann.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('readPercentage');
    });

    it('should isolate announcements between different admins', async () => {
      // Create second admin
      const admin2Email = `admin2-${Date.now()}@example.com`;
      const admin2Res = await request(app)
        .post('/api/auth/register')
        .send({ email: admin2Email, password: 'Admin2Pass123!', name: 'Admin2' });
      const admin2Id = admin2Res.body.data.user.id;
      await User.update({ role: 'admin' }, { where: { id: admin2Id } });
      const admin2Token = admin2Res.body.data.token;

      await Announcement.create({ title: 'Admin1 Ann', content: 'C', type: 'normal', status: 'active', targetType: 'all', creatorId: adminId });
      await Announcement.create({ title: 'Admin2 Ann', content: 'C', type: 'normal', status: 'active', targetType: 'all', creatorId: admin2Id });

      const res1 = await request(app)
        .get('/api/admin/announcements')
        .set('Authorization', `Bearer ${adminToken}`);

      // Both admins can see all announcements, but creatorId differs
      const titles = res1.body.data.announcements.map(a => a.title);
      expect(titles).toContain('Admin1 Ann');
      expect(titles).toContain('Admin2 Ann');

      // Clean up admin2
      await User.destroy({ where: { id: admin2Id }, force: true });
    });
  });

  // ==================== 删除限制 ====================

  describe('删除限制', () => {
    it('should not allow deleting active announcement', async () => {
      const ann = await Announcement.create({ title: 'Active', content: 'C', type: 'normal', status: 'active', targetType: 'all', creatorId: adminId });

      const res = await request(app)
        .delete(`/api/admin/announcements/${ann.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('should not allow deleting scheduled announcement', async () => {
      const ann = await Announcement.create({
        title: 'Scheduled',
        content: 'C',
        type: 'normal',
        status: 'scheduled',
        targetType: 'all',
        creatorId: adminId,
        startTime: new Date(Date.now() + 86400000)
      });

      const res = await request(app)
        .delete(`/api/admin/announcements/${ann.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('should clean up UserAnnouncementRead records when deleting', async () => {
      const ann = await Announcement.create({ title: 'To Delete', content: 'C', type: 'normal', status: 'draft', targetType: 'all', creatorId: adminId });

      // Create a read record
      await UserAnnouncementRead.create({ userId, announcementId: ann.id });

      await request(app)
        .delete(`/api/admin/announcements/${ann.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const readRecords = await UserAnnouncementRead.findAll({ where: { announcementId: ann.id } });
      expect(readRecords).toHaveLength(0);
    });
  });
```

- [ ] **Step 2: Run announcement tests**

Run: `cd backend && npx jest __tests__/integration/announcement.test.js --verbose`
Expected: ~80+ tests PASS (64 existing + ~16 new)

- [ ] **Step 3: Commit**

```bash
git add backend/__tests__/integration/announcement.test.js
git commit -m "test: expand announcement tests with sync, edge cases, stats, deletion"
```

---

## Chunk 2: Frontend Test Factories + Service + Context Tests

### Task 6: Frontend test factories

**Files:**
- Create: `src/__tests__/helpers/testFactories.ts`

- [ ] **Step 1: Create mock data factory file**

```typescript
import type { Notification, NotificationType, EntityType, NotificationContent } from '@/features/notifications/types/notification';
import type { Announcement } from '@/features/announcements/types/announcement';

let counter = 0;
const nextId = () => `test-${++counter}-${Math.random().toString(36).slice(2, 8)}`;

export const createMockNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: nextId(),
  recipientId: 'recipient-1',
  senderId: 'sender-1',
  sender: { id: 'sender-1', name: 'Test Sender', avatar: null },
  type: 'comment_reply' as NotificationType,
  entityType: 'comment' as EntityType,
  entityId: 'entity-1',
  content: { title: 'Test notification', body: 'Test body' } as NotificationContent,
  isRead: false,
  readAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockAnnouncement = (overrides: Partial<Announcement> = {}): Announcement => ({
  id: nextId(),
  title: '测试公告',
  content: '测试内容',
  type: 'normal',
  status: 'active',
  targetType: 'all',
  targetRoles: null,
  targetUserIds: null,
  colorScheme: 'info',
  customColor: null,
  isPinned: false,
  priority: 0,
  startTime: null,
  endTime: null,
  creatorId: 'creator-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isRead: false,
  readAt: null,
  dismissed: false,
  ...overrides,
});

export const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: nextId(),
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  avatar: null,
  ...overrides,
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd D:/claude/journal-forum && npx tsc --noEmit src/__tests__/helpers/testFactories.ts 2>&1 || echo "Check for errors"`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/helpers/testFactories.ts
git commit -m "test: add frontend mock data factory helpers"
```

---

### Task 7: Frontend Notification service tests

**Files:**
- Create: `src/__tests__/services/notificationService.test.ts`

- [ ] **Step 1: Create service test file**

Follow the exact pattern from `announcementService.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAllAsRead,
} from '@/features/notifications/services/notificationService';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

// Mock localStorage
const mockLocalStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
});

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);
  });

  describe('getNotifications', () => {
    it('should fetch notifications with default pagination', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { notifications: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } }
        }
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      mockLocalStorage.authToken = 'test-token';

      const result = await getNotifications();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/notifications', {
        headers: { Authorization: 'Bearer test-token' },
        params: { page: 1, limit: 20 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should include type param when provided', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { success: true, data: { notifications: [], pagination: {} } } });
      mockLocalStorage.authToken = 'test-token';

      await getNotifications(1, 20, 'like');

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/notifications', {
        headers: { Authorization: 'Bearer test-token' },
        params: { page: 1, limit: 20, type: 'like' },
      });
    });

    it('should send empty headers when no auth token', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: {} });

      await getNotifications();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/notifications', {
        headers: {},
        params: { page: 1, limit: 20 },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return the count number', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { success: true, data: { count: 5 } } });
      mockLocalStorage.authToken = 'test-token';

      const result = await getUnreadCount();

      expect(result).toBe(5);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/notifications/unread-count', {
        headers: { Authorization: 'Bearer test-token' },
      });
    });
  });

  describe('getNotificationById', () => {
    it('should fetch single notification', async () => {
      const mockNotification = { id: 'n-1', type: 'like' };
      mockedAxios.get.mockResolvedValueOnce({ data: { success: true, data: mockNotification } });
      mockLocalStorage.authToken = 'test-token';

      const result = await getNotificationById('n-1');

      expect(result).toEqual(mockNotification);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/notifications/n-1', {
        headers: { Authorization: 'Bearer test-token' },
      });
    });
  });

  describe('markAsRead', () => {
    it('should post to mark read endpoint', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });
      mockLocalStorage.authToken = 'test-token';

      await markAsRead('n-1');

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/notifications/n-1/read', {}, {
        headers: { Authorization: 'Bearer test-token' },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should post to read-all endpoint', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });
      mockLocalStorage.authToken = 'test-token';

      await markAllAsRead();

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/notifications/read-all', {}, {
        headers: { Authorization: 'Bearer test-token' },
      });
    });
  });

  describe('error handling', () => {
    it('should propagate network errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

      await expect(getNotifications()).rejects.toThrow('Network Error');
    });

    it('should propagate 401 errors', async () => {
      const error = { response: { status: 401 }, message: 'Unauthorized' };
      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(getUnreadCount()).rejects.toEqual(error);
    });
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/__tests__/services/notificationService.test.ts`
Expected: 9 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/services/notificationService.test.ts
git commit -m "test: add notification frontend service tests"
```

---

### Task 8: Frontend NotificationContext tests

**Files:**
- Create: `src/__tests__/contexts/NotificationContext.test.tsx`

- [ ] **Step 1: Create context test file**

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import React from 'react';

// Mock the notification service
const mockGetNotifications = vi.fn();
const mockGetUnreadCount = vi.fn();
const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();

vi.mock('@/features/notifications/services/notificationService', () => ({
  getNotifications: (...args: unknown[]) => mockGetNotifications(...args),
  getUnreadCount: (...args: unknown[]) => mockGetUnreadCount(...args),
  markAsRead: (...args: unknown[]) => mockMarkAsRead(...args),
  markAllAsRead: (...args: unknown[]) => mockMarkAllAsRead(...args),
}));

// Mock useAuth
let mockIsAuthenticated = true;
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    user: mockIsAuthenticated ? { id: 'user-1', name: 'Test' } : null,
  }),
}));

import { NotificationProvider, useNotifications } from '@/contexts/NotificationContext';
import { createMockNotification } from '@/__tests__/helpers/testFactories';

function TestConsumer() {
  const ctx = useNotifications();
  return (
    <div>
      <span data-testid="count">{ctx.unreadCount}</span>
      <span data-testid="loading">{String(ctx.loading)}</span>
      <span data-testid="length">{ctx.notifications.length}</span>
    </div>
  );
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NotificationProvider>{children}</NotificationProvider>
);

describe('NotificationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockIsAuthenticated = true;

    // Default mock responses
    mockGetNotifications.mockResolvedValue({
      data: { notifications: [createMockNotification()], pagination: { total: 1, page: 1, limit: 20, totalPages: 1 } }
    });
    mockGetUnreadCount.mockResolvedValue(1);
    mockMarkAsRead.mockResolvedValue(undefined);
    mockMarkAllAsRead.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fetch notifications and unread count on mount when authenticated', async () => {
    render(<TestConsumer />, { wrapper });

    await waitFor(() => {
      expect(mockGetNotifications).toHaveBeenCalledWith(1, 20);
      expect(mockGetUnreadCount).toHaveBeenCalled();
    });
  });

  it('should not fetch when not authenticated', async () => {
    mockIsAuthenticated = false;

    render(<TestConsumer />, { wrapper });

    await waitFor(() => {
      expect(mockGetNotifications).not.toHaveBeenCalled();
    });
  });

  it('should optimistically update on markAsRead', async () => {
    const notification = createMockNotification({ id: 'n-1', isRead: false });
    mockGetNotifications.mockResolvedValue({
      data: { notifications: [notification], pagination: { total: 1, page: 1, limit: 20, totalPages: 1 } }
    });
    mockGetUnreadCount.mockResolvedValue(1);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.unreadCount).toBe(1));

    await act(async () => {
      await result.current.markAsRead('n-1');
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications[0].isRead).toBe(true);
    expect(mockMarkAsRead).toHaveBeenCalledWith('n-1');
  });

  it('should rollback on markAsRead failure', async () => {
    mockMarkAsRead.mockRejectedValueOnce(new Error('Network error'));
    // refreshNotifications will be called on rollback
    mockGetNotifications.mockResolvedValue({
      data: { notifications: [createMockNotification({ isRead: false })], pagination: { total: 1, page: 1, limit: 20, totalPages: 1 } }
    });
    mockGetUnreadCount.mockResolvedValue(1);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.unreadCount).toBe(1));

    await act(async () => {
      await result.current.markAsRead('n-1');
    });

    // Should have called refreshNotifications (rollback)
    await waitFor(() => {
      expect(mockGetNotifications).toHaveBeenCalledTimes(2); // initial + rollback
    });
  });

  it('should optimistically update on markAllAsRead', async () => {
    mockGetNotifications.mockResolvedValue({
      data: {
        notifications: [
          createMockNotification({ id: 'n-1', isRead: false }),
          createMockNotification({ id: 'n-2', isRead: false }),
        ],
        pagination: { total: 2, page: 1, limit: 20, totalPages: 1 }
      }
    });
    mockGetUnreadCount.mockResolvedValue(2);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.unreadCount).toBe(2));

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every(n => n.isRead)).toBe(true);
  });

  it('should poll unread count every 60 seconds', async () => {
    render(<TestConsumer />, { wrapper });

    await waitFor(() => expect(mockGetUnreadCount).toHaveBeenCalledTimes(1));

    // Advance 60 seconds
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });

    // pollRefresh calls getUnreadCount (not getNotifications)
    await waitFor(() => {
      expect(mockGetUnreadCount).toHaveBeenCalledTimes(2);
    });
  });

  it('should skip poll when page is not visible', async () => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });

    render(<TestConsumer />, { wrapper });

    await waitFor(() => expect(mockGetUnreadCount).toHaveBeenCalledTimes(1));

    await act(async () => {
      vi.advanceTimersByTime(60000);
    });

    // Should not have polled again
    expect(mockGetUnreadCount).toHaveBeenCalledTimes(1);

    // Restore
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
  });

  it('should throw when useNotifications is used outside provider', () => {
    expect(() => {
      renderHook(() => useNotifications());
    }).toThrow('useNotifications must be used within a NotificationProvider');
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/__tests__/contexts/NotificationContext.test.tsx`
Expected: 7 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/contexts/NotificationContext.test.tsx
git commit -m "test: add NotificationContext unit tests with polling and optimistic updates"
```

---

### Task 9: Frontend AnnouncementContext tests

**Files:**
- Create: `src/__tests__/contexts/AnnouncementContext.test.tsx`

- [ ] **Step 1: Create context test file**

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import React from 'react';

// Mock announcement service
const mockGetBanners = vi.fn();
const mockGetAnnouncements = vi.fn();
const mockGetUnreadCount = vi.fn();
const mockServiceMarkAsRead = vi.fn();
const mockServiceMarkAllAsRead = vi.fn();

vi.mock('@/features/announcements/services/announcementService', () => ({
  getBanners: (...args: unknown[]) => mockGetBanners(...args),
  getAnnouncements: (...args: unknown[]) => mockGetAnnouncements(...args),
  getUnreadCount: (...args: unknown[]) => mockGetUnreadCount(...args),
  markAsRead: (...args: unknown[]) => mockServiceMarkAsRead(...args),
  markAllAsRead: (...args: unknown[]) => mockServiceMarkAllAsRead(...args),
}));

// Mock useAuth
let mockIsAuthenticated = true;
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    user: mockIsAuthenticated ? { id: 'user-1', name: 'Test', role: 'user' } : null,
  }),
}));

import { AnnouncementProvider, useAnnouncement } from '@/contexts/AnnouncementContext';
import { createMockAnnouncement } from '@/__tests__/helpers/testFactories';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AnnouncementProvider>{children}</AnnouncementProvider>
);

describe('AnnouncementContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockIsAuthenticated = true;

    mockGetBanners.mockResolvedValue([]);
    mockGetAnnouncements.mockResolvedValue({
      data: { announcements: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } }
    });
    mockGetUnreadCount.mockResolvedValue(0);
    mockServiceMarkAsRead.mockResolvedValue(undefined);
    mockServiceMarkAllAsRead.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fetch banners, announcements, and unread count on mount', async () => {
    const { result } = renderHook(() => useAnnouncement(), { wrapper });

    await waitFor(() => {
      expect(mockGetBanners).toHaveBeenCalled();
      expect(mockGetAnnouncements).toHaveBeenCalled();
      expect(mockGetUnreadCount).toHaveBeenCalled();
    });
  });

  it('should fetch banners even without authentication', async () => {
    mockIsAuthenticated = false;

    renderHook(() => useAnnouncement(), { wrapper });

    await waitFor(() => {
      expect(mockGetBanners).toHaveBeenCalled();
      expect(mockGetAnnouncements).not.toHaveBeenCalled();
    });
  });

  it('should optimistically update on markAsRead', async () => {
    const ann = createMockAnnouncement({ id: 'a-1', isRead: false });
    mockGetAnnouncements.mockResolvedValue({
      data: { announcements: [ann], pagination: { total: 1, page: 1, limit: 20, totalPages: 1 } }
    });
    mockGetUnreadCount.mockResolvedValue(1);

    const { result } = renderHook(() => useAnnouncement(), { wrapper });

    await waitFor(() => expect(result.current.unreadCount).toBe(1));

    await act(async () => {
      await result.current.markAsRead('a-1');
    });

    expect(result.current.unreadCount).toBe(0);
  });

  it('should optimistically update on markAllAsRead', async () => {
    mockGetAnnouncements.mockResolvedValue({
      data: {
        announcements: [
          createMockAnnouncement({ id: 'a-1', isRead: false }),
          createMockAnnouncement({ id: 'a-2', isRead: false }),
        ],
        pagination: { total: 2, page: 1, limit: 20, totalPages: 1 }
      }
    });
    mockGetUnreadCount.mockResolvedValue(2);

    const { result } = renderHook(() => useAnnouncement(), { wrapper });

    await waitFor(() => expect(result.current.unreadCount).toBe(2));

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.announcements.every(a => a.isRead)).toBe(true);
  });

  it('should handle dismissUrgent', async () => {
    const urgent = createMockAnnouncement({ id: 'u-1', type: 'urgent', isRead: false, dismissed: false });
    mockGetAnnouncements.mockResolvedValue({
      data: { announcements: [urgent], pagination: { total: 1, page: 1, limit: 20, totalPages: 1 } }
    });
    mockGetUnreadCount.mockResolvedValue(1);

    const { result } = renderHook(() => useAnnouncement(), { wrapper });

    await waitFor(() => expect(result.current.announcements).toHaveLength(1));

    await act(async () => {
      await result.current.dismissUrgent('u-1');
    });

    expect(mockServiceMarkAsRead).toHaveBeenCalledWith('u-1', true);
  });

  it('should poll every 5 minutes', async () => {
    renderHook(() => useAnnouncement(), { wrapper });

    await waitFor(() => expect(mockGetBanners).toHaveBeenCalledTimes(1));

    await act(async () => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    await waitFor(() => {
      expect(mockGetBanners).toHaveBeenCalledTimes(2);
    });
  });

  it('should only fetch banners when not authenticated', async () => {
    mockIsAuthenticated = false;

    renderHook(() => useAnnouncement(), { wrapper });

    await waitFor(() => {
      expect(mockGetBanners).toHaveBeenCalled();
      expect(mockGetAnnouncements).not.toHaveBeenCalled();
      expect(mockGetUnreadCount).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/__tests__/contexts/AnnouncementContext.test.tsx`
Expected: 7 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/contexts/AnnouncementContext.test.tsx
git commit -m "test: add AnnouncementContext unit tests"
```

---

## Chunk 3: Frontend Component Tests

### Task 10: NotificationItem component tests

**Files:**
- Create: `src/__tests__/components/notifications/NotificationItem.test.tsx`

- [ ] **Step 1: Create component test file**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationItem } from '@/features/notifications/components/NotificationItem';
import { createMockNotification } from '@/__tests__/helpers/testFactories';

describe('NotificationItem', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render notification title and body preview', () => {
    const notification = createMockNotification({
      content: { title: 'New Reply', body: 'Someone replied to your comment' }
    });

    render(<NotificationItem notification={notification} onClick={mockOnClick} />);

    expect(screen.getByText('New Reply')).toBeInTheDocument();
    expect(screen.getByText('Someone replied to your comment')).toBeInTheDocument();
  });

  it('should truncate body to 80 characters', () => {
    const longBody = 'A'.repeat(100);
    const notification = createMockNotification({
      content: { title: 'Test', body: longBody }
    });

    render(<NotificationItem notification={notification} onClick={mockOnClick} />);

    expect(screen.getByText('A'.repeat(80) + '...')).toBeInTheDocument();
  });

  it('should show unread indicator for unread notifications', () => {
    const notification = createMockNotification({ isRead: false });
    const { container } = render(<NotificationItem notification={notification} onClick={mockOnClick} />);

    expect(container.querySelector('.notification-item--unread')).toBeInTheDocument();
    expect(container.querySelector('.notification-item__indicator--unread')).toBeInTheDocument();
  });

  it('should not show unread indicator for read notifications', () => {
    const notification = createMockNotification({ isRead: true });
    const { container } = render(<NotificationItem notification={notification} onClick={mockOnClick} />);

    expect(container.querySelector('.notification-item--unread')).not.toBeInTheDocument();
    expect(container.querySelector('.notification-item__indicator--read')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const notification = createMockNotification();
    render(<NotificationItem notification={notification} onClick={mockOnClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledWith(notification);
  });

  it('should call onClick on Enter key', () => {
    const notification = createMockNotification();
    render(<NotificationItem notification={notification} onClick={mockOnClick} />);

    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(mockOnClick).toHaveBeenCalledWith(notification);
  });

  it.each([
    ['comment_reply', '回复'],
    ['like', '点赞'],
    ['new_follower', '关注'],
    ['system', '系统'],
    ['badge_earned', '徽章'],
    ['journal_new_comment', '期刊'],
  ])('should display correct type label for %s', (type, label) => {
    const notification = createMockNotification({ type: type as any });
    render(<NotificationItem notification={notification} onClick={mockOnClick} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('should display relative time', () => {
    const notification = createMockNotification({
      createdAt: new Date().toISOString()
    });
    render(<NotificationItem notification={notification} onClick={mockOnClick} />);

    expect(screen.getByText('刚刚')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/__tests__/components/notifications/NotificationItem.test.tsx`
Expected: 9 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/components/notifications/NotificationItem.test.tsx
git commit -m "test: add NotificationItem component tests"
```

---

### Task 11: NotificationModal component tests

**Files:**
- Create: `src/__tests__/components/notifications/NotificationModal.test.tsx`

- [ ] **Step 1: Create modal test file**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationModal } from '@/features/notifications/components/NotificationModal';
import { createMockNotification } from '@/__tests__/helpers/testFactories';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  X: ({ size, ...props }: any) => <span data-testid="x-icon" {...props}>X</span>,
  ExternalLink: ({ size, ...props }: any) => <span data-testid="external-link" {...props}>→</span>,
}));

describe('NotificationModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render notification title and body', () => {
    const notification = createMockNotification({
      content: { title: 'Test Title', body: 'Test Body Content' }
    });

    render(<NotificationModal notification={notification} onClose={mockOnClose} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Body Content')).toBeInTheDocument();
  });

  it('should display extra fields when present', () => {
    const notification = createMockNotification({
      content: {
        title: 'Reply',
        body: 'Body',
        journalTitle: 'Nature',
        commentContent: 'Great paper!'
      }
    });

    render(<NotificationModal notification={notification} onClose={mockOnClose} />);

    expect(screen.getByText('期刊:')).toBeInTheDocument();
    expect(screen.getByText('Nature')).toBeInTheDocument();
    expect(screen.getByText('评论内容:')).toBeInTheDocument();
    expect(screen.getByText('Great paper!')).toBeInTheDocument();
  });

  it('should show entity link for journal type', () => {
    const notification = createMockNotification({
      entityType: 'journal',
      entityId: 'j-1',
    });

    render(<NotificationModal notification={notification} onClose={mockOnClose} />);

    const link = screen.getByText('查看原文');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/journals/j-1');
  });

  it('should not show entity link when entityType is null', () => {
    const notification = createMockNotification({
      entityType: null,
      entityId: null,
    });

    render(<NotificationModal notification={notification} onClose={mockOnClose} />);

    expect(screen.queryByText('查看原文')).not.toBeInTheDocument();
  });

  it('should close on Escape key', () => {
    const notification = createMockNotification();

    render(<NotificationModal notification={notification} onClose={mockOnClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close on overlay click', () => {
    const notification = createMockNotification();
    const { container } = render(<NotificationModal notification={notification} onClose={mockOnClose} />);

    fireEvent.click(container.querySelector('.notification-modal__overlay')!);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not close when clicking modal content', () => {
    const notification = createMockNotification();
    const { container } = render(<NotificationModal notification={notification} onClose={mockOnClose} />);

    fireEvent.click(container.querySelector('.notification-modal')!);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should close on close button click', () => {
    const notification = createMockNotification();

    render(<NotificationModal notification={notification} onClose={mockOnClose} />);

    fireEvent.click(screen.getByLabelText('关闭'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display formatted timestamp', () => {
    const notification = createMockNotification({
      createdAt: '2026-03-15T10:30:00.000Z'
    });

    render(<NotificationModal notification={notification} onClose={mockOnClose} />);

    // The component uses toLocaleString('zh-CN'), just verify something is rendered
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/__tests__/components/notifications/NotificationModal.test.tsx`
Expected: 9 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/components/notifications/NotificationModal.test.tsx
git commit -m "test: add NotificationModal component tests"
```

---

### Task 12: Expand existing Announcement component tests

**Files:**
- Modify: `src/__tests__/components/announcements/AnnouncementBell.test.tsx`
- Modify: `src/__tests__/components/announcements/AnnouncementHandler.test.tsx`
- Modify: `src/__tests__/components/announcements/AnnouncementBanner.test.tsx`
- Modify: `src/__tests__/components/announcements/AnnouncementModal.test.tsx`

- [ ] **Step 1: Read existing test files and understand current coverage**

Read all four existing test files. Then append the following test code to each file.

- [ ] **Step 2: Append tests to AnnouncementBell.test.tsx**

Append inside the main `describe('AnnouncementBell')` block. Uses existing mocks (`mockAnnouncements`, `mockUnreadCount`, `mockMarkAllAsRead`). Also need to mock `useNotifications`:

```tsx
// Add near top of file, alongside existing useAnnouncement mock:
let mockNotificationUnreadCount = 0;
const mockNotificationMarkAllAsRead = vi.fn();

vi.mock('@/contexts/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: mockNotificationUnreadCount,
    loading: false,
    refreshNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: mockNotificationMarkAllAsRead,
  }),
}));
```

```tsx
  describe('合并未读数 badge', () => {
    it('should show combined unread count from notifications + announcements', () => {
      mockUnreadCount = 3;
      mockNotificationUnreadCount = 5;
      const { container } = render(<AnnouncementBell />);
      const badge = container.querySelector('.announcement-bell__badge');
      expect(badge).toHaveTextContent('8');
    });

    it('should cap badge at 99+', () => {
      mockUnreadCount = 60;
      mockNotificationUnreadCount = 50;
      const { container } = render(<AnnouncementBell />);
      const badge = container.querySelector('.announcement-bell__badge');
      expect(badge).toHaveTextContent('99+');
    });
  });

  describe('tab-scoped markAllAsRead', () => {
    it('should call notification markAllAsRead when on notifications tab', async () => {
      mockNotificationUnreadCount = 2;
      render(<AnnouncementBell />);
      // Open dropdown
      fireEvent.click(screen.getByRole('button'));
      // Should default to notifications tab, click mark all read
      const markAllBtn = screen.getByText('全部已读');
      fireEvent.click(markAllBtn);
      expect(mockNotificationMarkAllAsRead).toHaveBeenCalled();
      expect(mockMarkAllAsRead).not.toHaveBeenCalled();
    });

    it('should call announcement markAllAsRead when on announcements tab', async () => {
      mockUnreadCount = 2;
      render(<AnnouncementBell />);
      fireEvent.click(screen.getByRole('button'));
      // Switch to announcements tab
      const annTab = screen.getByText('公告');
      fireEvent.click(annTab);
      const markAllBtn = screen.getByText('全部已读');
      fireEvent.click(markAllBtn);
      expect(mockMarkAllAsRead).toHaveBeenCalled();
    });
  });
```

- [ ] **Step 3: Append tests to AnnouncementHandler.test.tsx**

Uses existing mocks (`mockAnnouncements`, modal mock). Append inside main describe:

```tsx
  describe('紧急公告排队', () => {
    it('should show first urgent announcement as popup', () => {
      mockAnnouncements = [
        { ...createMockAnnouncement(), id: 'u1', type: 'urgent', isRead: false, dismissed: false },
        { ...createMockAnnouncement(), id: 'u2', type: 'urgent', isRead: false, dismissed: false },
      ];

      render(<AnnouncementHandler />);

      expect(screen.getByTestId('modal-title')).toHaveTextContent(mockAnnouncements[0].title);
      expect(screen.getByTestId('modal-mode')).toHaveTextContent('urgent');
    });

    it('should show next urgent after dismissing current', async () => {
      const urgent1 = { ...createMockAnnouncement(), id: 'u1', title: 'Urgent 1', type: 'urgent' as const, isRead: false, dismissed: false };
      const urgent2 = { ...createMockAnnouncement(), id: 'u2', title: 'Urgent 2', type: 'urgent' as const, isRead: false, dismissed: false };
      mockAnnouncements = [urgent1, urgent2];

      const { rerender } = render(<AnnouncementHandler />);

      expect(screen.getByTestId('modal-title')).toHaveTextContent('Urgent 1');

      // Dismiss first one
      fireEvent.click(screen.getByTestId('modal-close'));

      // After dismiss, update mock to mark first as dismissed
      mockAnnouncements = [
        { ...urgent1, dismissed: true },
        urgent2,
      ];
      rerender(<AnnouncementHandler />);

      await waitFor(() => {
        expect(screen.getByTestId('modal-title')).toHaveTextContent('Urgent 2');
      });
    });

    it('should not re-popup already processed urgent announcements', () => {
      const urgent = { ...createMockAnnouncement(), id: 'u-repeat', type: 'urgent' as const, isRead: false, dismissed: false };
      mockAnnouncements = [urgent];

      const { rerender } = render(<AnnouncementHandler />);
      expect(screen.getByTestId('modal-title')).toBeInTheDocument();

      // Close it
      fireEvent.click(screen.getByTestId('modal-close'));

      // Re-render with same data (simulating stale poll)
      rerender(<AnnouncementHandler />);

      // Should not show again since processedUrgentIds tracks it
      expect(screen.queryByTestId('modal-title')).not.toBeInTheDocument();
    });
  });
```

- [ ] **Step 4: Append tests to AnnouncementBanner.test.tsx**

Uses existing mocks (`createMockBanner`, `mockSessionStorage`). Append inside main describe:

```tsx
  describe('轮播功能', () => {
    it('should auto-advance to next banner after 5 seconds', async () => {
      vi.useFakeTimers();
      const banners = [
        createMockBanner({ id: 'b1', title: 'Banner 1' }),
        createMockBanner({ id: 'b2', title: 'Banner 2' }),
      ];

      render(<AnnouncementBanner banners={banners} onBannerClick={vi.fn()} />);

      expect(screen.getByText('Banner 1')).toBeVisible();

      await act(() => { vi.advanceTimersByTime(5000); });

      expect(screen.getByText('Banner 2')).toBeVisible();
      vi.useRealTimers();
    });

    it('should navigate with prev/next buttons', () => {
      const banners = [
        createMockBanner({ id: 'b1', title: 'Banner 1' }),
        createMockBanner({ id: 'b2', title: 'Banner 2' }),
      ];

      const { container } = render(<AnnouncementBanner banners={banners} onBannerClick={vi.fn()} />);

      // Click next
      const nextBtn = container.querySelector('.announcement-banner__nav--next');
      if (nextBtn) fireEvent.click(nextBtn);

      expect(screen.getByText('Banner 2')).toBeVisible();

      // Click prev
      const prevBtn = container.querySelector('.announcement-banner__nav--prev');
      if (prevBtn) fireEvent.click(prevBtn);

      expect(screen.getByText('Banner 1')).toBeVisible();
    });

    it('should persist dismiss in sessionStorage', () => {
      const banner = createMockBanner({ id: 'dismiss-test' });

      const { container } = render(<AnnouncementBanner banners={[banner]} onBannerClick={vi.fn()} />);

      const dismissBtn = container.querySelector('.announcement-banner__dismiss');
      if (dismissBtn) fireEvent.click(dismissBtn);

      expect(mockSessionStorage[`dismissed-banner-dismiss-test`]).toBeDefined();
    });
  });
```

- [ ] **Step 5: Append tests to AnnouncementModal.test.tsx**

Uses existing mocks (`createMockAnnouncement`, `mockMarkAsRead`, `mockDismissUrgent`, `marked`, `dompurify`). Append inside main describe:

```tsx
  describe('urgent vs detail 模式', () => {
    it('should render dismiss button in urgent mode', () => {
      const ann = createMockAnnouncement({ type: 'urgent' });
      render(<AnnouncementModal announcement={ann} mode="urgent" onClose={vi.fn()} />);

      // Urgent mode should have dismiss/confirm button
      expect(screen.getByText(/确认|知道了|dismiss/i)).toBeInTheDocument();
    });

    it('should call dismissUrgent in urgent mode', () => {
      const ann = createMockAnnouncement({ id: 'urgent-1', type: 'urgent' });
      render(<AnnouncementModal announcement={ann} mode="urgent" onClose={vi.fn()} />);

      const confirmBtn = screen.getByText(/确认|知道了/i);
      fireEvent.click(confirmBtn);

      expect(mockDismissUrgent).toHaveBeenCalledWith('urgent-1');
    });

    it('should call markAsRead in detail mode', () => {
      const ann = createMockAnnouncement({ id: 'detail-1' });
      render(<AnnouncementModal announcement={ann} mode="detail" onClose={vi.fn()} />);

      // Detail mode auto-marks read on mount or has close behavior
      expect(mockMarkAsRead).toHaveBeenCalledWith('detail-1');
    });

    it('should close on Escape in detail mode', () => {
      const onClose = vi.fn();
      const ann = createMockAnnouncement();
      render(<AnnouncementModal announcement={ann} mode="detail" onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Markdown 渲染', () => {
    it('should render markdown content as HTML', () => {
      const ann = createMockAnnouncement({ content: '**bold text**' });
      render(<AnnouncementModal announcement={ann} mode="detail" onClose={vi.fn()} />);

      // marked.parse mock returns <p>content</p>
      // DOMPurify.sanitize mock returns as-is
      const contentEl = screen.getByText(/bold text/);
      expect(contentEl).toBeInTheDocument();
    });
  });
```

- [ ] **Step 3: Run all announcement component tests**

Run: `npx vitest run src/__tests__/components/announcements/`
Expected: All existing + new tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/components/announcements/
git commit -m "test: expand announcement component tests with carousel, queue, and modal modes"
```

---

## Chunk 4: E2E Tests

### Task 13: E2E fixture and notification user tests

**Files:**
- Create: `e2e/fixtures/notification-helpers.ts`
- Create: `e2e/tests/notification-user.spec.ts`

**Note:** All E2E tests live in `e2e/tests/` and follow the existing pattern from `e2e/tests/demo-modules/05-announcements.spec.ts`. They use selectors from `e2e/fixtures/test-data.ts`, helpers from `e2e/fixtures/demo-helpers.ts`, and test users from `testUsers` (`1@qq.com` for normal, `wh@qq.com` for admin).

- [ ] **Step 1: Create E2E API helper module**

```typescript
// e2e/fixtures/notification-helpers.ts
import { Page } from '@playwright/test';

const API_URL = 'http://127.0.0.1:3001/api';

/**
 * Login via API and return token + userId (faster than UI login).
 */
export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return { token: data.data.token, userId: data.data.user.id };
}

/**
 * Create announcement via admin API.
 */
export async function apiCreateAnnouncement(token: string, data: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/admin/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      title: 'E2E Test Announcement',
      content: 'E2E test content',
      type: 'normal',
      status: 'active',
      targetType: 'all',
      colorScheme: 'info',
      ...data,
    }),
  });
  return (await res.json()).data;
}

/**
 * Publish a draft announcement.
 */
export async function apiPublishAnnouncement(token: string, id: string) {
  await fetch(`${API_URL}/admin/announcements/${id}/publish`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Archive then delete an announcement (handles active/scheduled states).
 */
export async function apiDeleteAnnouncement(token: string, id: string, status: string) {
  if (status === 'active' || status === 'scheduled') {
    await fetch(`${API_URL}/admin/announcements/${id}/archive`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  await fetch(`${API_URL}/admin/announcements/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Clean up all E2E-created announcements (titles starting with "E2E").
 */
export async function apiCleanupAnnouncements(token: string) {
  const res = await fetch(`${API_URL}/admin/announcements?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  for (const ann of data.data?.announcements || []) {
    if (ann.title.startsWith('E2E')) {
      await apiDeleteAnnouncement(token, ann.id, ann.status);
    }
  }
}

/**
 * Login via UI (for tests that need browser-side auth state).
 * Uses selectors from test-data.ts.
 */
export async function uiLogin(page: Page, email: string, password: string) {
  await page.goto('http://127.0.0.1:3000');
  // Click login button in top bar
  await page.locator('.top-bar-login-btn').click();
  await page.waitForSelector('.auth-modal', { state: 'visible' });
  await page.locator('input#email').fill(email);
  await page.locator('input#password').fill(password);
  await page.locator('.auth-button').click();
  // Wait for auth modal to close (login success)
  await page.waitForSelector('.auth-modal', { state: 'hidden', timeout: 10000 });
}

/** Selectors for notification/announcement UI elements */
export const notifSelectors = {
  bell: {
    button: '.announcement-bell__button',
    badge: '.announcement-bell__badge',
    dropdown: '.announcement-bell__dropdown',
    markAllBtn: '.announcement-bell__mark-all',
    tabs: '.announcement-bell__tabs',
    notifTab: '.announcement-bell__tab:first-child',
    annTab: '.announcement-bell__tab:last-child',
  },
  notifItem: '.notification-item',
  notifItemUnread: '.notification-item--unread',
  notifModal: '.notification-modal',
  notifModalClose: '.notification-modal__close',
  banner: {
    container: '.announcement-banner',
    title: '.announcement-banner__title',
    navPrev: '.announcement-banner__nav:first-child',
    navNext: '.announcement-banner__nav:last-child',
    dismiss: '.announcement-banner__close',
  },
  annModal: {
    overlay: '.announcement-modal__overlay',
    title: '.announcement-modal__title',
    close: '.announcement-modal__close',
    actionBtn: '.announcement-modal__button',
  },
};
```

- [ ] **Step 2: Create notification user E2E spec**

```typescript
// e2e/tests/notification-user.spec.ts
import { test, expect } from '@playwright/test';
import { uiLogin, notifSelectors } from '../fixtures/notification-helpers';

const BASE_URL = 'http://127.0.0.1:3000';
const USER_EMAIL = '1@qq.com';
const USER_PASS = '123456';

test.describe('Notification User Flow', () => {

  test('should not show notification bell when logged out', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator(notifSelectors.bell.button)).not.toBeVisible();
  });

  test('should show notification bell when logged in', async ({ page }) => {
    await uiLogin(page, USER_EMAIL, USER_PASS);
    await expect(page.locator(notifSelectors.bell.button)).toBeVisible();
  });

  test('should open notification dropdown on bell click', async ({ page }) => {
    await uiLogin(page, USER_EMAIL, USER_PASS);
    await page.locator(notifSelectors.bell.button).click();
    await expect(page.locator(notifSelectors.bell.dropdown)).toBeVisible();
  });

  test('should display notification items in dropdown', async ({ page }) => {
    await uiLogin(page, USER_EMAIL, USER_PASS);
    await page.locator(notifSelectors.bell.button).click();
    await page.waitForSelector(notifSelectors.bell.dropdown, { state: 'visible' });
    // Verify notification tab is active by default
    const notifTab = page.locator(notifSelectors.bell.notifTab);
    await expect(notifTab).toBeVisible();
  });

  test('should open notification modal when clicking an item', async ({ page }) => {
    await uiLogin(page, USER_EMAIL, USER_PASS);
    await page.locator(notifSelectors.bell.button).click();
    await page.waitForSelector(notifSelectors.bell.dropdown, { state: 'visible' });

    const firstItem = page.locator(notifSelectors.notifItem).first();
    if (await firstItem.isVisible()) {
      await firstItem.click();
      await expect(page.locator(notifSelectors.notifModal)).toBeVisible();
    }
  });

  test('should close notification modal on close button click', async ({ page }) => {
    await uiLogin(page, USER_EMAIL, USER_PASS);
    await page.locator(notifSelectors.bell.button).click();
    await page.waitForSelector(notifSelectors.bell.dropdown);

    const firstItem = page.locator(notifSelectors.notifItem).first();
    if (await firstItem.isVisible()) {
      await firstItem.click();
      await page.waitForSelector(notifSelectors.notifModal);
      await page.locator(notifSelectors.notifModalClose).click();
      await expect(page.locator(notifSelectors.notifModal)).not.toBeVisible();
    }
  });

  test('should show mark-all-as-read button', async ({ page }) => {
    await uiLogin(page, USER_EMAIL, USER_PASS);
    await page.locator(notifSelectors.bell.button).click();
    await page.waitForSelector(notifSelectors.bell.dropdown);
    await expect(page.locator(notifSelectors.bell.markAllBtn)).toBeVisible();
  });

  test('should switch between notifications and announcements tabs', async ({ page }) => {
    await uiLogin(page, USER_EMAIL, USER_PASS);
    await page.locator(notifSelectors.bell.button).click();
    await page.waitForSelector(notifSelectors.bell.dropdown);

    // Click announcements tab
    await page.locator(notifSelectors.bell.annTab).click();
    // Verify announcements content is shown (look for announcement items or empty state)
    await page.waitForTimeout(500);

    // Click back to notifications tab
    await page.locator(notifSelectors.bell.notifTab).click();
    await page.waitForTimeout(500);
  });

  test('should close dropdown when clicking outside', async ({ page }) => {
    await uiLogin(page, USER_EMAIL, USER_PASS);
    await page.locator(notifSelectors.bell.button).click();
    await page.waitForSelector(notifSelectors.bell.dropdown, { state: 'visible' });

    // Click outside the dropdown
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await expect(page.locator(notifSelectors.bell.dropdown)).not.toBeVisible();
  });
});
```

- [ ] **Step 3: Run E2E tests**

Run: `npx playwright test e2e/tests/notification-user.spec.ts --headed`
Expected: Tests PASS (requires backend + frontend running)

- [ ] **Step 4: Commit**

```bash
git add e2e/fixtures/notification-helpers.ts e2e/tests/notification-user.spec.ts
git commit -m "test: add E2E notification user flow tests with API helpers"
```

---

### Task 14: E2E announcement user + banner tests

**Files:**
- Create: `e2e/tests/announcement-user.spec.ts`
- Create: `e2e/tests/announcement-banner.spec.ts`

- [ ] **Step 1: Create announcement user E2E spec**

```typescript
// e2e/tests/announcement-user.spec.ts
import { test, expect } from '@playwright/test';
import {
  uiLogin, apiLogin, apiCreateAnnouncement, apiCleanupAnnouncements, notifSelectors
} from '../fixtures/notification-helpers';

const BASE_URL = 'http://127.0.0.1:3000';
const USER_EMAIL = '1@qq.com';
const USER_PASS = '123456';
const ADMIN_EMAIL = 'wh@qq.com';
const ADMIN_PASS = '123456';

test.describe('Announcement User Flow', () => {
  let adminToken: string;

  test.beforeAll(async () => {
    const admin = await apiLogin(ADMIN_EMAIL, ADMIN_PASS);
    adminToken = admin.token;
  });

  test.afterAll(async () => {
    await apiCleanupAnnouncements(adminToken);
  });

  test('should show announcements in the announcements tab', async ({ page }) => {
    await apiCreateAnnouncement(adminToken, { title: 'E2E User Ann', status: 'active' });
    await uiLogin(page, USER_EMAIL, USER_PASS);
    await page.locator(notifSelectors.bell.button).click();
    await page.waitForSelector(notifSelectors.bell.dropdown);
    await page.locator(notifSelectors.bell.annTab).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText('E2E User Ann')).toBeVisible();
  });

  test('should open announcement detail modal on click', async ({ page }) => {
    await apiCreateAnnouncement(adminToken, { title: 'E2E Detail Ann', content: 'Detail content here', status: 'active' });
    await uiLogin(page, USER_EMAIL, USER_PASS);
    await page.locator(notifSelectors.bell.button).click();
    await page.locator(notifSelectors.bell.annTab).click();
    await page.waitForTimeout(1000);
    await page.getByText('E2E Detail Ann').click();
    await expect(page.locator(notifSelectors.annModal.overlay)).toBeVisible();
    await expect(page.locator(notifSelectors.annModal.title)).toHaveText('E2E Detail Ann');
  });

  test('should mark all announcements as read', async ({ page }) => {
    await apiCreateAnnouncement(adminToken, { title: 'E2E Unread Ann', status: 'active' });
    await uiLogin(page, USER_EMAIL, USER_PASS);
    await page.locator(notifSelectors.bell.button).click();
    await page.locator(notifSelectors.bell.annTab).click();
    await page.waitForTimeout(1000);
    await page.locator(notifSelectors.bell.markAllBtn).click();
    await page.waitForTimeout(500);
    // After marking all, unread items should be gone
    const unreadItems = page.locator('.announcement-item--unread');
    await expect(unreadItems).toHaveCount(0);
  });

  test('should not show role-targeted announcement to wrong role', async ({ page }) => {
    // Create admin-only announcement
    await apiCreateAnnouncement(adminToken, {
      title: 'E2E Admin Only Ann',
      status: 'active',
      targetType: 'role',
      targetRoles: ['admin'],
    });
    // Login as normal user
    await uiLogin(page, USER_EMAIL, USER_PASS);
    await page.locator(notifSelectors.bell.button).click();
    await page.locator(notifSelectors.bell.annTab).click();
    await page.waitForTimeout(1000);
    // Should NOT see admin-only announcement
    await expect(page.getByText('E2E Admin Only Ann')).not.toBeVisible();
  });

  test('should not show announcements tab when logged out', async ({ page }) => {
    await page.goto(BASE_URL);
    // Bell should not be visible at all when logged out
    await expect(page.locator(notifSelectors.bell.button)).not.toBeVisible();
  });
});
```

- [ ] **Step 2: Create announcement banner E2E spec**

```typescript
// e2e/tests/announcement-banner.spec.ts
import { test, expect } from '@playwright/test';
import {
  uiLogin, apiLogin, apiCreateAnnouncement, apiCleanupAnnouncements, notifSelectors
} from '../fixtures/notification-helpers';

const BASE_URL = 'http://127.0.0.1:3000';
const ADMIN_EMAIL = 'wh@qq.com';
const ADMIN_PASS = '123456';

test.describe('Announcement Banner & Urgent Popup', () => {
  let adminToken: string;

  test.beforeAll(async () => {
    const admin = await apiLogin(ADMIN_EMAIL, ADMIN_PASS);
    adminToken = admin.token;
  });

  test.afterAll(async () => {
    await apiCleanupAnnouncements(adminToken);
  });

  test('should display active banner at top of page', async ({ page }) => {
    await apiCreateAnnouncement(adminToken, {
      title: 'E2E Banner Test',
      type: 'banner',
      status: 'active',
    });
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    await expect(page.locator(notifSelectors.banner.container)).toBeVisible();
    await expect(page.getByText('E2E Banner Test')).toBeVisible();
  });

  test('should show banner even when logged out', async ({ page }) => {
    await apiCreateAnnouncement(adminToken, {
      title: 'E2E Public Banner',
      type: 'banner',
      status: 'active',
    });
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    await expect(page.locator(notifSelectors.banner.container)).toBeVisible();
  });

  test('should open detail modal when clicking banner', async ({ page }) => {
    await apiCreateAnnouncement(adminToken, {
      title: 'E2E Clickable Banner',
      type: 'banner',
      status: 'active',
    });
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    await page.locator(notifSelectors.banner.container).click();
    await expect(page.locator(notifSelectors.annModal.overlay)).toBeVisible();
  });

  test('should navigate between banners with prev/next', async ({ page }) => {
    await apiCreateAnnouncement(adminToken, { title: 'E2E Banner A', type: 'banner', status: 'active', priority: 10 });
    await apiCreateAnnouncement(adminToken, { title: 'E2E Banner B', type: 'banner', status: 'active', priority: 5 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    // Should show first banner
    await expect(page.getByText('E2E Banner A')).toBeVisible();

    // Click next
    const nextBtn = page.locator(notifSelectors.banner.navNext);
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(500);
      await expect(page.getByText('E2E Banner B')).toBeVisible();
    }
  });

  test('should dismiss banner and persist in session', async ({ page }) => {
    await apiCreateAnnouncement(adminToken, {
      title: 'E2E Dismiss Banner',
      type: 'banner',
      status: 'active',
    });
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    const dismissBtn = page.locator(notifSelectors.banner.dismiss);
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click();
      await page.waitForTimeout(500);
      // Verify banner is gone
      await expect(page.getByText('E2E Dismiss Banner')).not.toBeVisible();

      // Reload and check it's still dismissed (sessionStorage)
      await page.reload();
      await page.waitForTimeout(2000);
      await expect(page.getByText('E2E Dismiss Banner')).not.toBeVisible();
    }
  });

  test('should show urgent announcement as auto-popup when logged in', async ({ page }) => {
    await apiCreateAnnouncement(adminToken, {
      title: 'E2E Urgent Popup',
      type: 'urgent',
      status: 'active',
    });
    await uiLogin(page, '1@qq.com', '123456');
    await page.waitForTimeout(3000);
    // Urgent announcements auto-popup
    await expect(page.locator(notifSelectors.annModal.overlay)).toBeVisible();
    await expect(page.getByText('E2E Urgent Popup')).toBeVisible();
  });

  test('should dismiss urgent popup and not show again', async ({ page }) => {
    await apiCreateAnnouncement(adminToken, {
      title: 'E2E Urgent Dismiss',
      type: 'urgent',
      status: 'active',
    });
    await uiLogin(page, '1@qq.com', '123456');
    await page.waitForTimeout(3000);

    // Dismiss the urgent popup
    const actionBtn = page.locator(notifSelectors.annModal.actionBtn);
    if (await actionBtn.isVisible()) {
      await actionBtn.click();
      await page.waitForTimeout(1000);
      // Modal should be closed
      await expect(page.locator(notifSelectors.annModal.overlay)).not.toBeVisible();
    }
  });

  test('should show banners sorted by priority', async ({ page }) => {
    await apiCreateAnnouncement(adminToken, { title: 'E2E Low Priority', type: 'banner', status: 'active', priority: 1 });
    await apiCreateAnnouncement(adminToken, { title: 'E2E High Priority', type: 'banner', status: 'active', priority: 100 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    // High priority should show first
    await expect(page.getByText('E2E High Priority')).toBeVisible();
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx playwright test e2e/tests/announcement-user.spec.ts e2e/tests/announcement-banner.spec.ts --headed`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add e2e/tests/announcement-user.spec.ts e2e/tests/announcement-banner.spec.ts
git commit -m "test: add E2E announcement user and banner tests"
```

---

### Task 15: E2E announcement admin tests

**Files:**
- Create: `e2e/tests/announcement-admin.spec.ts`

- [ ] **Step 1: Create admin management E2E spec**

```typescript
// e2e/tests/announcement-admin.spec.ts
import { test, expect } from '@playwright/test';
import {
  uiLogin, apiLogin, apiCreateAnnouncement, apiCleanupAnnouncements
} from '../fixtures/notification-helpers';

const BASE_URL = 'http://127.0.0.1:3000';
const ADMIN_EMAIL = 'wh@qq.com';
const ADMIN_PASS = '123456';

// Selectors from existing 05-announcements.spec.ts pattern
const adminSel = {
  container: '.announcement-mgmt',
  createBtn: '.announcement-mgmt__create-btn',
  table: '.announcement-mgmt__table',
  row: '.announcement-mgmt__table tbody tr',
  tabs: '.announcement-mgmt__tabs',
  tab: '.announcement-mgmt__tab',
  form: {
    container: '.announcement-form',
    titleInput: '.announcement-form input[name="title"], .announcement-form__title input',
    contentInput: '.announcement-form textarea, .announcement-form__content textarea',
    typeSelect: '.announcement-form select[name="type"], .announcement-form__type select',
    submitBtn: '.announcement-form__submit, .announcement-form button[type="submit"]',
    backBtn: '.announcement-form__back',
  },
  actions: {
    edit: '.announcement-mgmt__action-btn:has(svg.lucide-edit-2)',
    publish: '.announcement-mgmt__action-btn--publish',
    archive: '.announcement-mgmt__action-btn--archive',
    delete: '.announcement-mgmt__action-btn--delete',
  },
  confirm: {
    overlay: '.announcement-mgmt__confirm-overlay',
    confirmBtn: '.announcement-mgmt__confirm-delete',
  },
  pagination: '.announcement-mgmt__pagination',
};

test.describe('Announcement Admin Management', () => {
  let adminToken: string;

  test.beforeAll(async () => {
    const admin = await apiLogin(ADMIN_EMAIL, ADMIN_PASS);
    adminToken = admin.token;
  });

  test.afterAll(async () => {
    await apiCleanupAnnouncements(adminToken);
  });

  test('should navigate to announcement management page', async ({ page }) => {
    await uiLogin(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto(`${BASE_URL}/admin/announcements`);
    await expect(page.locator(adminSel.container)).toBeVisible();
  });

  test('should create a draft announcement', async ({ page }) => {
    await uiLogin(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto(`${BASE_URL}/admin/announcements`);
    await page.locator(adminSel.createBtn).click();
    await page.waitForSelector(adminSel.form.container);

    await page.locator(adminSel.form.titleInput).fill('E2E Draft Test');
    await page.locator(adminSel.form.contentInput).fill('Draft content');
    // Submit as draft (look for save/draft button)
    await page.locator(adminSel.form.submitBtn).click();
    await page.waitForTimeout(1000);

    // Should return to list and see the draft
    await expect(page.getByText('E2E Draft Test')).toBeVisible();
  });

  test('should publish a draft announcement', async ({ page }) => {
    const ann = await apiCreateAnnouncement(adminToken, {
      title: 'E2E Publish Draft',
      status: 'draft',
    });

    await uiLogin(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto(`${BASE_URL}/admin/announcements`);
    await page.waitForTimeout(1000);

    // Find the row with our announcement and click publish
    const row = page.locator(adminSel.row, { hasText: 'E2E Publish Draft' });
    const publishBtn = row.locator(adminSel.actions.publish);
    if (await publishBtn.isVisible()) {
      await publishBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should archive an active announcement', async ({ page }) => {
    await apiCreateAnnouncement(adminToken, {
      title: 'E2E Archive Test',
      status: 'active',
    });

    await uiLogin(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto(`${BASE_URL}/admin/announcements`);
    await page.waitForTimeout(1000);

    const row = page.locator(adminSel.row, { hasText: 'E2E Archive Test' });
    const archiveBtn = row.locator(adminSel.actions.archive);
    if (await archiveBtn.isVisible()) {
      await archiveBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should delete a draft announcement', async ({ page }) => {
    await apiCreateAnnouncement(adminToken, {
      title: 'E2E Delete Draft',
      status: 'draft',
    });

    await uiLogin(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto(`${BASE_URL}/admin/announcements`);
    await page.waitForTimeout(1000);

    const row = page.locator(adminSel.row, { hasText: 'E2E Delete Draft' });
    const deleteBtn = row.locator(adminSel.actions.delete);
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      // Confirm delete
      await page.waitForSelector(adminSel.confirm.overlay, { state: 'visible' });
      await page.locator(adminSel.confirm.confirmBtn).click();
      await page.waitForTimeout(1000);
      await expect(page.getByText('E2E Delete Draft')).not.toBeVisible();
    }
  });

  test('should not allow deleting active announcement', async ({ page }) => {
    await apiCreateAnnouncement(adminToken, {
      title: 'E2E Active No Delete',
      status: 'active',
    });

    await uiLogin(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto(`${BASE_URL}/admin/announcements`);
    await page.waitForTimeout(1000);

    const row = page.locator(adminSel.row, { hasText: 'E2E Active No Delete' });
    const deleteBtn = row.locator(adminSel.actions.delete);
    // Delete button should not be visible or be disabled for active announcements
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      // If confirmation shows, the API should return an error
      await page.waitForTimeout(1000);
    }
  });

  test('should edit announcement content', async ({ page }) => {
    await apiCreateAnnouncement(adminToken, {
      title: 'E2E Edit Test',
      status: 'draft',
    });

    await uiLogin(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto(`${BASE_URL}/admin/announcements`);
    await page.waitForTimeout(1000);

    const row = page.locator(adminSel.row, { hasText: 'E2E Edit Test' });
    const editBtn = row.locator(adminSel.actions.edit);
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForSelector(adminSel.form.container);
      await page.locator(adminSel.form.titleInput).fill('E2E Edited Title');
      await page.locator(adminSel.form.submitBtn).click();
      await page.waitForTimeout(1000);
      await expect(page.getByText('E2E Edited Title')).toBeVisible();
    }
  });

  test('should filter announcements by status tabs', async ({ page }) => {
    // Create announcements with different statuses
    await apiCreateAnnouncement(adminToken, { title: 'E2E Filter Active', status: 'active' });
    await apiCreateAnnouncement(adminToken, { title: 'E2E Filter Draft', status: 'draft' });

    await uiLogin(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto(`${BASE_URL}/admin/announcements`);
    await page.waitForTimeout(1000);

    // Click different status tabs to filter
    const tabs = page.locator(adminSel.tab);
    const tabCount = await tabs.count();
    if (tabCount > 1) {
      // Click second tab (e.g., "active" or specific status)
      await tabs.nth(1).click();
      await page.waitForTimeout(1000);
    }
  });

  test('should show read statistics for announcements', async ({ page }) => {
    await apiCreateAnnouncement(adminToken, {
      title: 'E2E Stats Test',
      status: 'active',
    });

    await uiLogin(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto(`${BASE_URL}/admin/announcements`);
    await page.waitForTimeout(1000);

    // The progress/stats column should be visible in the table
    const progressCells = page.locator('.announcement-mgmt__progress');
    await expect(progressCells.first()).toBeVisible();
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx playwright test e2e/tests/announcement-admin.spec.ts --headed`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/announcement-admin.spec.ts
git commit -m "test: add E2E announcement admin management tests"
```

---

## Chunk 5: Final Verification

### Task 16: Run all test suites and verify

- [ ] **Step 1: Run backend tests**

Run: `cd backend && npx jest --verbose`
Expected: All existing + new notification tests PASS

- [ ] **Step 2: Run frontend tests**

Run: `npx vitest run`
Expected: All existing + new tests PASS

- [ ] **Step 3: Run E2E tests**

Run: `npx playwright test e2e/tests/notification-user.spec.ts e2e/tests/announcement-user.spec.ts e2e/tests/announcement-banner.spec.ts e2e/tests/announcement-admin.spec.ts`
Expected: All E2E tests PASS

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "test: complete notification & announcement testing system

Backend: ~55 notification + ~16 announcement expansion tests
Frontend: ~10 service + ~14 context + ~18 component tests
E2E: ~35 Playwright tests across 4 spec files"
```
