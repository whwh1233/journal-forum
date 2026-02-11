const request = require('supertest');
const express = require('express');
const { TestDatabase } = require('../helpers/testDb');
const authRoutes = require('../../routes/authRoutes');
const { errorHandler } = require('../../middleware/error');

// 创建测试应用
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
  return app;
};

describe('Auth API Integration Tests', () => {
  let testDb;
  let app;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.setup();
    app = createTestApp();
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  beforeEach(async () => {
    await testDb.reset();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', newUser.email);
      expect(response.body.data.user).toHaveProperty('name', newUser.name);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject registration with existing email', async () => {
      const existingUser = {
        email: 'test@example.com', // 已存在的用户
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(existingUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱已被注册');
    });

    it('should reject registration with missing fields', async () => {
      const invalidUser = {
        email: 'test@example.com',
        // 缺少password和name
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with invalid email format', async () => {
      const invalidUser = {
        email: 'not-an-email',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'test123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', credentials.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject login with wrong password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('密码错误');
    });

    it('should reject login with non-existent email', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户不存在');
    });

    it('should reject login with disabled account', async () => {
      // 首先禁用测试用户
      const db = testDb.getDB();
      const user = db.data.users.find(u => u.email === 'test@example.com');
      user.status = 'disabled';
      await db.write();

      const credentials = {
        email: 'test@example.com',
        password: 'test123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('账号已被禁用');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user info with valid token', async () => {
      // 先登录获取token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'test123',
        });

      const token = loginResponse.body.data.token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('未提供认证令牌');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
