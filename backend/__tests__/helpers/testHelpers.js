const jwt = require('jsonwebtoken');

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
};
