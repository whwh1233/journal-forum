const request = require('supertest');
const app = require('../../server');
const { sequelize, Journal, JournalLevel, JournalRatingCache, Category, JournalCategoryMap } = require('../../models');

describe('Journals API Integration Tests', () => {
  const TEST_JOURNAL_PREFIX = 'TEST_J_';
  let journalId1, journalId2, journalId3;
  let parentCategory, childCategory1, childCategory2;

  beforeAll(async () => {
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    // Clean up test data in correct order (respect foreign key constraints)
    await JournalCategoryMap.destroy({
      where: { journalId: { [require('sequelize').Op.like]: `${TEST_JOURNAL_PREFIX}%` } },
      force: true
    });
    await JournalRatingCache.destroy({
      where: { journalId: { [require('sequelize').Op.like]: `${TEST_JOURNAL_PREFIX}%` } },
      force: true
    });
    await JournalLevel.destroy({
      where: { journalId: { [require('sequelize').Op.like]: `${TEST_JOURNAL_PREFIX}%` } },
      force: true
    });
    await Journal.destroy({
      where: { journalId: { [require('sequelize').Op.like]: `${TEST_JOURNAL_PREFIX}%` } },
      force: true
    });
    // Clean up test categories
    await Category.destroy({
      where: { name: { [require('sequelize').Op.like]: 'TestCat_%' } },
      force: true
    });

    // Create test categories
    parentCategory = await Category.create({ name: 'TestCat_Parent', level: 1 });
    childCategory1 = await Category.create({ name: 'TestCat_Child1', level: 2, parentId: parentCategory.id });
    childCategory2 = await Category.create({ name: 'TestCat_Child2', level: 2, parentId: parentCategory.id });

    // Create test journals
    journalId1 = `${TEST_JOURNAL_PREFIX}${Date.now()}_1`;
    journalId2 = `${TEST_JOURNAL_PREFIX}${Date.now()}_2`;
    journalId3 = `${TEST_JOURNAL_PREFIX}${Date.now()}_3`;

    await Journal.create({
      journalId: journalId1,
      name: 'Test Journal Alpha',
      issn: '1234-0001',
      cn: '11-0001/TP',
      impactFactor: 3.5
    });

    await Journal.create({
      journalId: journalId2,
      name: 'Test Journal Beta',
      issn: '1234-0002',
      cn: '11-0002/TP',
      impactFactor: 1.2
    });

    await Journal.create({
      journalId: journalId3,
      name: 'Test Journal Gamma',
      issn: '1234-0003',
      cn: '11-0003/TP',
      impactFactor: 5.0
    });

    // Create levels
    await JournalLevel.create({ journalId: journalId1, levelName: 'SCI' });
    await JournalLevel.create({ journalId: journalId1, levelName: '北大核心' });
    await JournalLevel.create({ journalId: journalId2, levelName: 'EI' });
    await JournalLevel.create({ journalId: journalId3, levelName: 'SCI' });

    // Create rating caches
    await JournalRatingCache.create({
      journalId: journalId1,
      rating: 4.5,
      ratingCount: 10,
      reviewSpeed: 3.8,
      editorAttitude: 4.2,
      acceptDifficulty: 3.5,
      reviewQuality: 4.0,
      overallExperience: 4.0
    });

    await JournalRatingCache.create({
      journalId: journalId2,
      rating: 2.0,
      ratingCount: 5,
      reviewSpeed: 2.5,
      editorAttitude: 2.0,
      acceptDifficulty: 1.5,
      reviewQuality: 2.0,
      overallExperience: 2.0
    });

    await JournalRatingCache.create({
      journalId: journalId3,
      rating: 3.0,
      ratingCount: 8,
      reviewSpeed: 3.0,
      editorAttitude: 3.5,
      acceptDifficulty: 2.5,
      reviewQuality: 3.0,
      overallExperience: 3.0
    });

    // Create category mappings
    await JournalCategoryMap.create({ journalId: journalId1, categoryId: childCategory1.id });
    await JournalCategoryMap.create({ journalId: journalId2, categoryId: childCategory2.id });
    await JournalCategoryMap.create({ journalId: journalId3, categoryId: childCategory1.id });
  });

  afterAll(async () => {
    // Final cleanup
    const { Op } = require('sequelize');
    await JournalCategoryMap.destroy({ where: { journalId: { [Op.like]: `${TEST_JOURNAL_PREFIX}%` } }, force: true });
    await JournalRatingCache.destroy({ where: { journalId: { [Op.like]: `${TEST_JOURNAL_PREFIX}%` } }, force: true });
    await JournalLevel.destroy({ where: { journalId: { [Op.like]: `${TEST_JOURNAL_PREFIX}%` } }, force: true });
    await Journal.destroy({ where: { journalId: { [Op.like]: `${TEST_JOURNAL_PREFIX}%` } }, force: true });
    await Category.destroy({ where: { name: { [Op.like]: 'TestCat_%' } }, force: true });
    await sequelize.close();
  });

  // ==================== GET /api/journals ====================

  describe('GET /api/journals', () => {
    it('should get all journals', async () => {
      const res = await request(app)
        .get('/api/journals')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.journals)).toBe(true);
      expect(res.body.data.journals.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/journals?page=1&limit=1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.journals.length).toBe(1);
      expect(res.body.data).toHaveProperty('pagination');
      expect(res.body.data.pagination.itemsPerPage).toBe(1);
      expect(res.body.data.pagination.currentPage).toBe(1);
      expect(res.body.data.pagination.totalItems).toBeGreaterThan(1);
    });

    it('should support search by name', async () => {
      const res = await request(app)
        .get(`/api/journals?search=Test Journal Alpha`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.journals.length).toBeGreaterThanOrEqual(1);
      const found = res.body.data.journals.find(j => j.journalId === journalId1);
      expect(found).toBeDefined();
      expect(found.name).toBe('Test Journal Alpha');
    });

    it('should support search by ISSN', async () => {
      const res = await request(app)
        .get('/api/journals?search=1234-0002')
        .expect(200);

      expect(res.body.success).toBe(true);
      const found = res.body.data.journals.find(j => j.journalId === journalId2);
      expect(found).toBeDefined();
      expect(found.issn).toBe('1234-0002');
    });

    it('should support level filter', async () => {
      const res = await request(app)
        .get('/api/journals?level=SCI')
        .expect(200);

      expect(res.body.success).toBe(true);
      // All returned journals should have SCI level
      const testJournals = res.body.data.journals.filter(j =>
        j.journalId === journalId1 || j.journalId === journalId3
      );
      expect(testJournals.length).toBe(2);
      testJournals.forEach(j => {
        expect(j.levels).toContain('SCI');
      });
    });

    it('should support category filter', async () => {
      const res = await request(app)
        .get(`/api/journals?categoryId=${childCategory1.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const testJournals = res.body.data.journals.filter(j =>
        j.journalId === journalId1 || j.journalId === journalId3
      );
      expect(testJournals.length).toBe(2);
    });

    it('should support parent category filter (includes all children)', async () => {
      const res = await request(app)
        .get(`/api/journals?categoryId=${parentCategory.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const testJournals = res.body.data.journals.filter(j =>
        j.journalId === journalId1 || j.journalId === journalId2 || j.journalId === journalId3
      );
      // All 3 test journals belong to children of the parent category
      expect(testJournals.length).toBe(3);
    });

    it('should support sorting by rating desc', async () => {
      const res = await request(app)
        .get('/api/journals?sortBy=rating:desc&limit=100')
        .expect(200);

      expect(res.body.success).toBe(true);
      const journals = res.body.data.journals;

      // Verify descending order by rating
      for (let i = 0; i < journals.length - 1; i++) {
        const ratingA = (journals[i].ratingCache && journals[i].ratingCache.rating) || 0;
        const ratingB = (journals[i + 1].ratingCache && journals[i + 1].ratingCache.rating) || 0;
        expect(ratingA).toBeGreaterThanOrEqual(ratingB);
      }
    });

    it('should support sorting by impactFactor', async () => {
      const res = await request(app)
        .get('/api/journals?sortBy=impactFactor:desc&limit=100')
        .expect(200);

      expect(res.body.success).toBe(true);
      const journals = res.body.data.journals;

      // Verify descending order (nulls at end)
      for (let i = 0; i < journals.length - 1; i++) {
        const ifA = journals[i].impactFactor;
        const ifB = journals[i + 1].impactFactor;
        if (ifA !== null && ifB !== null) {
          expect(ifA).toBeGreaterThanOrEqual(ifB);
        }
      }
    });
  });

  // ==================== GET /api/journals/:id ====================

  describe('GET /api/journals/:id', () => {
    it('should get journal by id', async () => {
      const res = await request(app)
        .get(`/api/journals/${journalId1}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.journal).toHaveProperty('journalId', journalId1);
      expect(res.body.data.journal).toHaveProperty('name', 'Test Journal Alpha');
      expect(res.body.data.journal).toHaveProperty('issn', '1234-0001');
      expect(res.body.data.journal).toHaveProperty('ratingCache');
      expect(res.body.data.journal.ratingCache.rating).toBe(4.5);
    });

    it('should include levels in journal detail', async () => {
      const res = await request(app)
        .get(`/api/journals/${journalId1}`)
        .expect(200);

      expect(res.body.data.journal.levels).toEqual(expect.arrayContaining(['SCI', '北大核心']));
    });

    it('should include category in journal detail', async () => {
      const res = await request(app)
        .get(`/api/journals/${journalId1}`)
        .expect(200);

      expect(res.body.data.journal).toHaveProperty('category');
      expect(res.body.data.journal.category).toContain('TestCat_Child1');
    });

    it('should return 404 for non-existent journal', async () => {
      const res = await request(app)
        .get('/api/journals/NON_EXISTENT_999')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('期刊');
    });
  });

  // ==================== GET /api/journals/search ====================

  describe('GET /api/journals/search', () => {
    it('should search journals by query', async () => {
      const res = await request(app)
        .get(`/api/journals/search?q=Test Journal`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.journals)).toBe(true);
      expect(res.body.data.journals.length).toBeGreaterThanOrEqual(3);
    });

    it('should search journals by ISSN', async () => {
      const res = await request(app)
        .get('/api/journals/search?q=1234-0003')
        .expect(200);

      expect(res.body.success).toBe(true);
      const found = res.body.data.journals.find(j => j.journalId === journalId3);
      expect(found).toBeDefined();
    });

    it('should return hasMore flag for pagination', async () => {
      const res = await request(app)
        .get('/api/journals/search?q=Test Journal&limit=1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.journals.length).toBe(1);
      expect(res.body.data.hasMore).toBe(true);
    });

    it('should return 400 for empty query', async () => {
      const res = await request(app)
        .get('/api/journals/search?q=')
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ==================== GET /api/journals/levels ====================

  describe('GET /api/journals/levels', () => {
    it('should return level list with counts', async () => {
      const res = await request(app)
        .get('/api/journals/levels')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.levels)).toBe(true);
      expect(res.body.data.levels.length).toBeGreaterThan(0);

      // Each level should have name and count
      res.body.data.levels.forEach(level => {
        expect(level).toHaveProperty('name');
        expect(level).toHaveProperty('count');
        expect(typeof level.count).toBe('number');
        expect(level.count).toBeGreaterThan(0);
      });

      // SCI should be present with count >= 2
      const sci = res.body.data.levels.find(l => l.name === 'SCI');
      expect(sci).toBeDefined();
      expect(sci.count).toBeGreaterThanOrEqual(2);
    });
  });

  // ==================== GET /api/journals/categories ====================

  describe('GET /api/journals/categories', () => {
    it('should return tree-structured categories', async () => {
      const res = await request(app)
        .get('/api/journals/categories')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.categories)).toBe(true);

      // Find our test parent category
      const testParent = res.body.data.categories.find(c => c.name === 'TestCat_Parent');
      expect(testParent).toBeDefined();
      expect(Array.isArray(testParent.children)).toBe(true);
      expect(testParent.children.length).toBe(2);

      // Children should have journalCount
      const child1 = testParent.children.find(c => c.name === 'TestCat_Child1');
      expect(child1).toBeDefined();
      expect(child1.journalCount).toBe(2); // journalId1 and journalId3

      const child2 = testParent.children.find(c => c.name === 'TestCat_Child2');
      expect(child2).toBeDefined();
      expect(child2.journalCount).toBe(1); // journalId2
    });
  });

  // ==================== Journal Data Structure ====================

  describe('Journal Data Structure', () => {
    it('should have consistent data structure', async () => {
      const res = await request(app)
        .get(`/api/journals/${journalId1}`)
        .expect(200);

      const journal = res.body.data.journal;
      expect(journal).toHaveProperty('journalId');
      expect(journal).toHaveProperty('name');
      expect(journal).toHaveProperty('issn');
      expect(journal).toHaveProperty('levels');
      expect(journal).toHaveProperty('ratingCache');
      expect(journal).toHaveProperty('category');
      expect(Array.isArray(journal.levels)).toBe(true);
      expect(typeof journal.ratingCache.rating).toBe('number');
      expect(journal.ratingCache.rating).toBeGreaterThanOrEqual(0);
      expect(journal.ratingCache.rating).toBeLessThanOrEqual(5);
    });

    it('should include all rating dimensions in ratingCache', async () => {
      const res = await request(app)
        .get(`/api/journals/${journalId1}`)
        .expect(200);

      const cache = res.body.data.journal.ratingCache;
      expect(cache).toHaveProperty('rating');
      expect(cache).toHaveProperty('ratingCount');
      expect(cache).toHaveProperty('reviewSpeed');
      expect(cache).toHaveProperty('editorAttitude');
      expect(cache).toHaveProperty('acceptDifficulty');
      expect(cache).toHaveProperty('reviewQuality');
      expect(cache).toHaveProperty('overallExperience');
    });
  });
});
