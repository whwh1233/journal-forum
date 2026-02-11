const request = require('supertest');
const express = require('express');
const { TestDatabase } = require('../helpers/testDb');
const journalRoutes = require('../../routes/journalRoutes');
const { errorHandler } = require('../../middleware/error');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/journals', journalRoutes);
  app.use(errorHandler);
  return app;
};

describe('Journals API Integration Tests', () => {
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

  describe('GET /api/journals', () => {
    it('should get all journals', async () => {
      const response = await request(app)
        .get('/api/journals')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.journals)).toBe(true);
      expect(response.body.data.journals.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/journals?page=1&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.journals.length).toBe(1);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination.itemsPerPage).toBe(1);
    });

    it('should support category filter', async () => {
      const response = await request(app)
        .get('/api/journals?category=computer-science')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.journals.forEach(journal => {
        expect(journal.category).toBe('computer-science');
      });
    });

    it('should support search by title', async () => {
      const response = await request(app)
        .get('/api/journals?search=Test')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.journals.forEach(journal => {
        expect(journal.title.toLowerCase()).toContain('test');
      });
    });

    it('should support sorting by rating', async () => {
      const response = await request(app)
        .get('/api/journals?sortBy=rating&order=desc')
        .expect(200);

      expect(response.body.success).toBe(true);
      const journals = response.body.data.journals;

      // 验证按评分降序排列
      for (let i = 0; i < journals.length - 1; i++) {
        expect(journals[i].rating).toBeGreaterThanOrEqual(journals[i + 1].rating);
      }
    });
  });

  describe('GET /api/journals/:id', () => {
    it('should get journal by id', async () => {
      const response = await request(app)
        .get('/api/journals/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.journal).toHaveProperty('id', 1);
      expect(response.body.data.journal).toHaveProperty('title');
      expect(response.body.data.journal).toHaveProperty('rating');
    });

    it('should return 404 for non-existent journal', async () => {
      const response = await request(app)
        .get('/api/journals/9999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('期刊不存在');
    });
  });

  describe('Journal Rating Calculation', () => {
    it('should calculate rating correctly with both comment systems', async () => {
      const db = testDb.getDB();
      const journal = db.data.journals[0];

      // 旧评论系统的评分
      const oldRatings = journal.reviews.map(r => r.rating);

      // 新评论系统的评分
      const newRatings = db.data.comments
        .filter(c => c.journalId === journal.id && !c.isDeleted && c.rating)
        .map(c => c.rating);

      // 计算期望的平均分
      const allRatings = [...oldRatings, ...newRatings];
      const expectedRating = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
      const roundedExpectedRating = Math.round(expectedRating * 10) / 10;

      expect(Math.abs(journal.rating - roundedExpectedRating)).toBeLessThan(0.1);
    });

    it('should update rating when comment is added', async () => {
      const db = testDb.getDB();
      const journal = db.data.journals[0];
      const initialRating = journal.rating;

      // 添加一个新评论
      db.data.comments.push({
        id: '1-9999999999-newtest',
        userId: 1,
        userName: 'Test User',
        journalId: 1,
        parentId: null,
        content: 'New test comment',
        rating: 1, // 低分
        createdAt: new Date().toISOString(),
        isDeleted: false,
      });

      // 重新计算评分
      const allRatings = [
        ...journal.reviews.map(r => r.rating),
        ...db.data.comments
          .filter(c => c.journalId === 1 && !c.isDeleted && c.rating)
          .map(c => c.rating),
      ];
      const newRating = Math.round((allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length) * 10) / 10;
      journal.rating = newRating;
      await db.write();

      // 验证评分降低了
      expect(journal.rating).toBeLessThan(initialRating);
    });
  });

  describe('Journal Data Structure', () => {
    it('should have consistent data structure', async () => {
      const response = await request(app)
        .get('/api/journals')
        .expect(200);

      response.body.data.journals.forEach(journal => {
        expect(journal).toHaveProperty('id');
        expect(journal).toHaveProperty('title');
        expect(journal).toHaveProperty('issn');
        expect(journal).toHaveProperty('category');
        expect(journal).toHaveProperty('rating');
        expect(journal).toHaveProperty('description');
        expect(journal).toHaveProperty('createdAt');
        expect(typeof journal.rating).toBe('number');
        expect(journal.rating).toBeGreaterThanOrEqual(0);
        expect(journal.rating).toBeLessThanOrEqual(5);
      });
    });
  });
});
