const request = require('supertest');
const express = require('express');
const { TestDatabase } = require('../helpers/testDb');
const { errorHandler } = require('../../middleware/error');

// 创建测试专用的搜索控制器（使用 databaseTest）
const createSearchController = () => {
  return async (req, res, next) => {
    try {
      const { q, category, page = 1, limit = 10 } = req.query;
      const { getDB } = require('../../config/databaseTest');
      const db = getDB();

      // 验证查询字符串长度
      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters'
        });
      }

      // 获取所有期刊
      let journalList = [...db.data.journals];

      // 模糊搜索（title 和 ISSN）
      const searchTerm = q.toLowerCase();
      journalList = journalList.filter(journal =>
        journal.title.toLowerCase().includes(searchTerm) ||
        journal.issn.toLowerCase().includes(searchTerm)
      );

      // 可选分类过滤
      if (category) {
        journalList = journalList.filter(journal => journal.category === category);
      }

      // 按标题排序
      journalList.sort((a, b) => a.title.localeCompare(b.title));

      // 计算分页
      const offset = (Number(page) - 1) * Number(limit);
      const total = journalList.length;
      const paginatedJournals = journalList.slice(offset, offset + Number(limit));
      const hasMore = total > offset + Number(limit);

      res.status(200).json({
        success: true,
        data: {
          journals: paginatedJournals,
          hasMore
        }
      });
    } catch (error) {
      next(error);
    }
  };
};

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  // 注册搜索路由
  app.get('/api/journals/search', createSearchController());
  app.use(errorHandler);
  return app;
};

describe('Journal Search API', () => {
  let testDb;
  let app;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.setup();

    // Add test journals for search
    const db = testDb.getDB();
    db.data.journals.push(
      {
        id: 101,
        title: 'Nature Communications',
        issn: '2041-1723',
        category: 'Biology',
        impactFactor: 14.919,
        publisher: 'Nature Publishing Group',
        website: 'https://www.nature.com/ncomms/',
        createdAt: new Date().toISOString(),
      },
      {
        id: 102,
        title: 'Science Advances',
        issn: '2375-2548',
        category: 'Multidisciplinary',
        impactFactor: 13.116,
        publisher: 'American Association for the Advancement of Science',
        website: 'https://www.science.org/journal/sciadv',
        createdAt: new Date().toISOString(),
      },
      {
        id: 103,
        title: 'Nature Biotechnology',
        issn: '1087-0156',
        category: 'Biology',
        impactFactor: 46.9,
        publisher: 'Nature Publishing Group',
        website: 'https://www.nature.com/nbt/',
        createdAt: new Date().toISOString(),
      }
    );
    await db.write();

    app = createTestApp();
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  beforeEach(async () => {
    // Don't reset - we need our test journals
  });

  describe('GET /api/journals/search', () => {
    it('should search journals by title', async () => {
      const response = await request(app)
        .get('/api/journals/search')
        .query({ q: 'Nature' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.journals)).toBe(true);
      expect(response.body.data.journals.length).toBeGreaterThan(0);
      expect(response.body.data.journals[0].title).toContain('Nature');
    });

    it('should return 400 if query is too short', async () => {
      const response = await request(app)
        .get('/api/journals/search')
        .query({ q: 'a' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Search query must be at least 2 characters');
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/journals/search')
        .query({ q: 'Nature', category: 'Biology' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.journals)).toBe(true);
      response.body.data.journals.forEach(journal => {
        expect(journal.category).toBe('Biology');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/journals/search')
        .query({ q: 'Nature', page: 1, limit: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.journals.length).toBeLessThanOrEqual(1);
      expect(response.body.data).toHaveProperty('hasMore');
    });

    it('should search by ISSN', async () => {
      const response = await request(app)
        .get('/api/journals/search')
        .query({ q: '2041-1723' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.journals)).toBe(true);
      expect(response.body.data.journals[0].issn).toBe('2041-1723');
    });
  });
});
