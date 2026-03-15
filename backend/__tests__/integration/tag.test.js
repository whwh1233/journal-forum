const request = require('supertest');
const app = require('../../server');
const { sequelize, Tag, PostTagMap, PostCategory, User } = require('../../models');

describe('Tag Public API Integration Tests', () => {
  let authToken;
  let userId;
  let secondUserToken;
  let secondUserId;

  beforeAll(async () => {
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    // Clean up in dependency order
    await PostTagMap.destroy({ where: {}, force: true });
    await Tag.destroy({ where: {}, force: true });
    await PostCategory.destroy({ where: {}, force: true });

    // Register first test user
    const email = `tag-test-${Date.now()}@example.com`;
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email,
        password: 'TestPass123!',
        name: 'Tag Test User'
      });

    authToken = registerRes.body.data.token;
    userId = registerRes.body.data.user.id;

    // Register second test user
    const email2 = `tag-test2-${Date.now()}@example.com`;
    const registerRes2 = await request(app)
      .post('/api/auth/register')
      .send({
        email: email2,
        password: 'TestPass123!',
        name: 'Tag Test User 2'
      });

    secondUserToken = registerRes2.body.data.token;
    secondUserId = registerRes2.body.data.user.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/tags', () => {
    it('should return approved tags with pagination', async () => {
      await Tag.bulkCreate([
        { name: 'alpha', normalizedName: 'alpha', status: 'approved', createdBy: userId, postCount: 5 },
        { name: 'beta', normalizedName: 'beta', status: 'approved', createdBy: userId, postCount: 3 },
        { name: 'gamma', normalizedName: 'gamma', status: 'pending', createdBy: userId, postCount: 0 }
      ]);

      const res = await request(app).get('/api/tags');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tags');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.tags)).toBe(true);
      expect(res.body.tags.length).toBe(2);
      expect(res.body.tags.every(t => t.status === 'approved')).toBe(true);
      expect(res.body.pagination).toHaveProperty('total', 2);
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('limit');
      expect(res.body.pagination).toHaveProperty('totalPages');
    });

    it('should search tags by name', async () => {
      await Tag.bulkCreate([
        { name: 'science', normalizedName: 'science', status: 'approved', createdBy: userId },
        { name: 'math', normalizedName: 'math', status: 'approved', createdBy: userId },
        { name: 'physics', normalizedName: 'physics', status: 'approved', createdBy: userId }
      ]);

      const res = await request(app)
        .get('/api/tags')
        .query({ search: 'sci' });

      expect(res.status).toBe(200);
      expect(res.body.tags.length).toBe(1);
      expect(res.body.tags[0].name).toBe('science');
    });

    it('should sort by name', async () => {
      await Tag.bulkCreate([
        { name: 'zebra', normalizedName: 'zebra', status: 'approved', createdBy: userId },
        { name: 'apple', normalizedName: 'apple', status: 'approved', createdBy: userId },
        { name: 'mango', normalizedName: 'mango', status: 'approved', createdBy: userId }
      ]);

      const res = await request(app)
        .get('/api/tags')
        .query({ sort: 'name' });

      expect(res.status).toBe(200);
      expect(res.body.tags.length).toBe(3);
      expect(res.body.tags[0].name).toBe('apple');
      expect(res.body.tags[1].name).toBe('mango');
      expect(res.body.tags[2].name).toBe('zebra');
    });

    it('should sort by newest', async () => {
      const t1 = await Tag.create({
        name: 'old', normalizedName: 'old', status: 'approved', createdBy: userId
      });
      // Ensure different createdAt by waiting 1s (MySQL DATETIME precision)
      await new Promise(resolve => setTimeout(resolve, 1100));
      const t2 = await Tag.create({
        name: 'new', normalizedName: 'new', status: 'approved', createdBy: userId
      });

      const res = await request(app)
        .get('/api/tags')
        .query({ sort: 'newest' });

      expect(res.status).toBe(200);
      expect(res.body.tags.length).toBe(2);
      // Newest first (DESC createdAt)
      expect(res.body.tags[0].name).toBe('new');
      expect(res.body.tags[1].name).toBe('old');
    });

    it('should sort by postCount (default)', async () => {
      await Tag.bulkCreate([
        { name: 'low', normalizedName: 'low', status: 'approved', createdBy: userId, postCount: 1 },
        { name: 'high', normalizedName: 'high', status: 'approved', createdBy: userId, postCount: 100 },
        { name: 'mid', normalizedName: 'mid', status: 'approved', createdBy: userId, postCount: 50 }
      ]);

      const res = await request(app).get('/api/tags');

      expect(res.status).toBe(200);
      expect(res.body.tags.length).toBe(3);
      // DESC postCount order
      expect(res.body.tags[0].name).toBe('high');
      expect(res.body.tags[1].name).toBe('mid');
      expect(res.body.tags[2].name).toBe('low');
    });

    it('should not return pending tags', async () => {
      await Tag.create({
        name: 'pending', normalizedName: 'pending', status: 'pending', createdBy: userId
      });

      const res = await request(app).get('/api/tags');

      expect(res.status).toBe(200);
      expect(res.body.tags.length).toBe(0);
    });
  });

  describe('GET /api/tags/hot', () => {
    it('should return hot tags sorted by postCount', async () => {
      await Tag.bulkCreate([
        { name: 'hot', normalizedName: 'hot', status: 'approved', createdBy: userId, postCount: 200 },
        { name: 'warm', normalizedName: 'warm', status: 'approved', createdBy: userId, postCount: 50 },
        { name: 'cold', normalizedName: 'cold', status: 'approved', createdBy: userId, postCount: 5 }
      ]);

      const res = await request(app).get('/api/tags/hot');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tags');
      expect(Array.isArray(res.body.tags)).toBe(true);
      expect(res.body.tags.length).toBe(3);
      // Verify DESC postCount order
      expect(res.body.tags[0].postCount).toBeGreaterThanOrEqual(res.body.tags[1].postCount);
      expect(res.body.tags[1].postCount).toBeGreaterThanOrEqual(res.body.tags[2].postCount);
    });

    it('should return max 20 tags', async () => {
      const tags = [];
      for (let i = 0; i < 25; i++) {
        tags.push({
          name: `tag${String(i).padStart(2, '0')}`,
          normalizedName: `tag${String(i).padStart(2, '0')}`,
          status: 'approved',
          createdBy: userId,
          postCount: i
        });
      }
      await Tag.bulkCreate(tags);

      const res = await request(app).get('/api/tags/hot');

      expect(res.status).toBe(200);
      expect(res.body.tags.length).toBeLessThanOrEqual(20);
    });

    it('should not return pending tags', async () => {
      await Tag.create({
        name: 'hidden', normalizedName: 'hidden', status: 'pending', createdBy: userId, postCount: 999
      });

      const res = await request(app).get('/api/tags/hot');

      expect(res.status).toBe(200);
      const names = res.body.tags.map(t => t.name);
      expect(names).not.toContain('hidden');
    });
  });

  describe('GET /api/tags/suggest', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/tags/suggest');

      expect(res.status).toBe(401);
    });

    it('should return prefix-matched tags', async () => {
      await Tag.bulkCreate([
        { name: 'science', normalizedName: 'science', status: 'approved', createdBy: userId },
        { name: 'sports', normalizedName: 'sports', status: 'approved', createdBy: userId },
        { name: 'math', normalizedName: 'math', status: 'approved', createdBy: userId }
      ]);

      const res = await request(app)
        .get('/api/tags/suggest')
        .query({ q: 'sci' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tags');
      expect(res.body.tags.length).toBe(1);
      expect(res.body.tags[0].name).toBe('science');
    });

    it('should return approved tags and current user pending tags', async () => {
      await Tag.bulkCreate([
        { name: 'sciok', normalizedName: 'sciok', status: 'approved', createdBy: userId },
        { name: 'scipend', normalizedName: 'scipend', status: 'pending', createdBy: userId },
        { name: 'sciother', normalizedName: 'sciother', status: 'pending', createdBy: secondUserId }
      ]);

      const res = await request(app)
        .get('/api/tags/suggest')
        .query({ q: 'sci' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const names = res.body.tags.map(t => t.name);
      expect(names).toContain('sciok');
      expect(names).toContain('scipend');
      expect(names).not.toContain('sciother');
    });

    it('should not return other user pending tags', async () => {
      await Tag.create({
        name: 'scisecret', normalizedName: 'scisecret', status: 'pending', createdBy: secondUserId
      });

      const res = await request(app)
        .get('/api/tags/suggest')
        .query({ q: 'sci' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const names = res.body.tags.map(t => t.name);
      expect(names).not.toContain('scisecret');
    });

    it('should return hot tags when query is empty', async () => {
      await Tag.bulkCreate([
        { name: 'popular', normalizedName: 'popular', status: 'approved', createdBy: userId, postCount: 100 },
        { name: 'trending', normalizedName: 'trending', status: 'approved', createdBy: userId, postCount: 50 }
      ]);

      const res = await request(app)
        .get('/api/tags/suggest')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tags');
      expect(res.body.tags.length).toBeGreaterThan(0);
      const names = res.body.tags.map(t => t.name);
      expect(names).toContain('popular');
      expect(names).toContain('trending');
    });

    it('should show official tags first', async () => {
      await Tag.bulkCreate([
        { name: 'sciuser', normalizedName: 'sciuser', status: 'approved', createdBy: userId, isOfficial: false, postCount: 100 },
        { name: 'scioffic', normalizedName: 'scioffic', status: 'approved', createdBy: userId, isOfficial: true, postCount: 1 }
      ]);

      const res = await request(app)
        .get('/api/tags/suggest')
        .query({ q: 'sci' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.tags.length).toBe(2);
      // Official tag should come first despite lower postCount
      expect(res.body.tags[0].isOfficial).toBe(true);
      expect(res.body.tags[0].name).toBe('scioffic');
    });
  });

  describe('POST /api/tags', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/tags')
        .send({ name: 'test' });

      expect(res.status).toBe(401);
    });

    it('should create new pending tag', async () => {
      const res = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'newtag' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('tag');
      expect(res.body.isNew).toBe(true);
      expect(res.body.tag.name).toBe('newtag');
      expect(res.body.tag.status).toBe('pending');

      // Verify in database
      const tag = await Tag.findOne({ where: { normalizedName: 'newtag' } });
      expect(tag).not.toBeNull();
      expect(tag.status).toBe('pending');
      expect(tag.createdBy).toBe(userId);
    });

    it('should normalize tag name', async () => {
      const res = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'SCI' });

      expect(res.status).toBe(201);
      expect(res.body.tag.normalizedName).toBe('sci');
    });

    it('should return existing tag when duplicate', async () => {
      await Tag.create({
        name: 'existing', normalizedName: 'existing', status: 'approved', createdBy: userId
      });

      const res = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'existing' });

      expect(res.status).toBe(200);
      expect(res.body.isNew).toBe(false);
      expect(res.body.tag.name).toBe('existing');
    });

    it('should treat different cases as same tag', async () => {
      await Tag.create({
        name: 'SCI', normalizedName: 'sci', status: 'approved', createdBy: userId
      });

      const res = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'sci' });

      expect(res.status).toBe(200);
      expect(res.body.isNew).toBe(false);
    });

    it('should return 400 for empty name', async () => {
      const res1 = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' });

      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '   ' });

      expect(res2.status).toBe(400);
    });
  });

  describe('GET /api/post-categories', () => {
    it('should return active categories', async () => {
      await PostCategory.bulkCreate([
        { name: 'Discussion', slug: `discussion-${Date.now()}`, isActive: true, sortOrder: 1 },
        { name: 'Question', slug: `question-${Date.now()}`, isActive: true, sortOrder: 2 },
        { name: 'Archived', slug: `archived-${Date.now()}`, isActive: false, sortOrder: 3 }
      ]);

      const res = await request(app).get('/api/post-categories');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('categories');
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(res.body.categories.length).toBe(2);
      expect(res.body.categories.every(c => c.isActive === true)).toBe(true);
    });

    it('should sort by sortOrder', async () => {
      await PostCategory.bulkCreate([
        { name: 'Third', slug: `third-${Date.now()}`, isActive: true, sortOrder: 30 },
        { name: 'First', slug: `first-${Date.now()}`, isActive: true, sortOrder: 10 },
        { name: 'Second', slug: `second-${Date.now()}`, isActive: true, sortOrder: 20 }
      ]);

      const res = await request(app).get('/api/post-categories');

      expect(res.status).toBe(200);
      expect(res.body.categories.length).toBe(3);
      expect(res.body.categories[0].name).toBe('First');
      expect(res.body.categories[1].name).toBe('Second');
      expect(res.body.categories[2].name).toBe('Third');
    });

    it('should not return inactive categories', async () => {
      await PostCategory.create({
        name: 'Inactive', slug: `inactive-${Date.now()}`, isActive: false, sortOrder: 1
      });

      const res = await request(app).get('/api/post-categories');

      expect(res.status).toBe(200);
      const names = res.body.categories.map(c => c.name);
      expect(names).not.toContain('Inactive');
    });
  });
});
