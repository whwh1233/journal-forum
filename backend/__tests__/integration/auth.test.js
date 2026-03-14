const request = require('supertest');
const app = require('../../server');
const { sequelize, User } = require('../../models');
const { Op } = require('sequelize');
const { hashPassword } = require('../../utils/password');

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    // Clean up test users before each test
    await User.destroy({
      where: { email: { [Op.like]: '%@authtest.com' } },
      force: true
    });
  });

  afterAll(async () => {
    // Final cleanup
    await User.destroy({
      where: { email: { [Op.like]: '%@authtest.com' } },
      force: true
    });
    await sequelize.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: 'newuser@authtest.com',
        password: 'password123',
        name: 'New User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('email', newUser.email);
      expect(response.body.data.user).toHaveProperty('name', newUser.name);
      expect(response.body.data.user).toHaveProperty('role', 'user');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject registration with existing email', async () => {
      const userData = {
        email: 'duplicate@authtest.com',
        password: 'password123',
        name: 'First User',
      };

      // Register the first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with the same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@authtest.com',
          password: 'password456',
          name: 'Second User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('已被注册');
    });

    it('should reject registration with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'password123',
          name: 'No Email User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'nopass@authtest.com',
          name: 'No Password User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should normalize email to lowercase', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'UPPER@authtest.com',
          password: 'password123',
          name: 'Upper Case Email',
        })
        .expect(201);

      expect(response.body.data.user.email).toBe('upper@authtest.com');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'loginuser@authtest.com',
          password: 'test123456',
          name: 'Login Test User',
        });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'loginuser@authtest.com',
          password: 'test123456',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', 'loginuser@authtest.com');
      expect(response.body.data.user).toHaveProperty('name', 'Login Test User');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'loginuser@authtest.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱或密码错误');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@authtest.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱或密码错误');
    });

    it('should reject login with disabled account', async () => {
      // Disable the user directly in the database
      await User.update(
        { status: 'disabled' },
        { where: { email: 'loginuser@authtest.com' } }
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'loginuser@authtest.com',
          password: 'test123456',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('账号已被禁用');
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'loginuser@authtest.com',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let userToken;

    beforeEach(async () => {
      // Register and get token
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'meuser@authtest.com',
          password: 'test123456',
          name: 'Me Test User',
        });

      userToken = res.body.data.token;
    });

    it('should get current user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('email', 'meuser@authtest.com');
      expect(response.body.data.user).toHaveProperty('name', 'Me Test User');
      expect(response.body.data.user).toHaveProperty('role', 'user');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
