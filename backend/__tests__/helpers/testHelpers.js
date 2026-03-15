const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const PRE_HASHED_PASSWORD = bcrypt.hashSync('TestPass123!', 10);

// 生成测试用JWT token
const generateTestToken = (userId, role = 'user') => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'test_jwt_secret',
    { expiresIn: '1h' }
  );
};

// 生成管理员token
const generateAdminToken = (userId = 2) => {
  return generateTestToken(userId, 'admin');
};

// 生成普通用户token
const generateUserToken = (userId = 1) => {
  return generateTestToken(userId, 'user');
};

// 等待一段时间（用于异步测试）
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 验证响应格式
const expectSuccessResponse = (response, statusCode = 200) => {
  expect(response.status).toBe(statusCode);
  expect(response.body).toHaveProperty('success', true);
};

const expectErrorResponse = (response, statusCode, message) => {
  expect(response.status).toBe(statusCode);
  expect(response.body).toHaveProperty('success', false);
  if (message) {
    expect(response.body.message).toContain(message);
  }
};

// 创建测试用户数据
const createTestUser = (overrides = {}) => ({
  email: 'newuser@example.com',
  password: 'password123',
  name: 'New User',
  ...overrides,
});

// 创建测试期刊数据
const createTestJournal = (overrides = {}) => ({
  title: 'New Test Journal',
  issn: '9999-8888',
  category: 'computer-science',
  description: 'A new test journal',
  ...overrides,
});

// 创建测试评论数据
const createTestComment = (overrides = {}) => ({
  journalId: 1,
  content: 'This is a test comment',
  rating: 5,
  ...overrides,
});

// 在数据库中直接创建测试用户
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

// 在数据库中直接创建测试通知
const createTestNotification = async (overrides = {}) => {
  const { Notification } = require('../../models');
  return Notification.create({
    type: 'comment_reply',
    content: {},
    isRead: false,
    ...overrides
  });
};

// 在数据库中直接创建测试公告
const createTestAnnouncement = async (overrides = {}) => {
  const { Announcement } = require('../../models');
  const suffix = uuidv4().slice(0, 8);
  return Announcement.create({
    title: `Test Announcement ${suffix}`,
    content: 'Test announcement content.',
    type: 'normal',
    status: 'active',
    ...overrides
  });
};

// 级联清理测试数据，按 FK 顺序: Notifications → UserAnnouncementRead → Announcements → Users
const cleanupTestData = async (userIds = []) => {
  if (!userIds.length) return;
  const { Notification, UserAnnouncementRead, Announcement, User } = require('../../models');
  const { Op } = require('sequelize');

  await Notification.destroy({ where: { recipientId: { [Op.in]: userIds } } });
  await UserAnnouncementRead.destroy({ where: { userId: { [Op.in]: userIds } } });
  await Announcement.destroy({ where: { creatorId: { [Op.in]: userIds } } });
  await User.destroy({ where: { id: { [Op.in]: userIds } } });
};

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
  createTestUserInDB,
  createTestNotification,
  createTestAnnouncement,
  cleanupTestData,
};
