const request = require('supertest');
const app = require('../../server');
const { sequelize, Journal, JournalLevel, JournalRatingCache, Category, JournalCategoryMap } = require('../../models');

// Unique prefix to avoid collisions with production data
const TEST_PREFIX = `__test_${Date.now()}`;

// Test journal IDs
const journalIds = {
  natureCommunications: `${TEST_PREFIX}_nc`,
  scienceAdvances: `${TEST_PREFIX}_sa`,
  natureBiotechnology: `${TEST_PREFIX}_nb`,
  cellReports: `${TEST_PREFIX}_cr`,
};

describe('Journal Search API', () => {
  let parentCategory;
  let biologyCategory;
  let multidisciplinaryCategory;

  beforeAll(async () => {
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    // Clean up any previous test data (reverse dependency order)
    await JournalCategoryMap.destroy({
      where: { journalId: Object.values(journalIds) },
      force: true
    });
    await JournalLevel.destroy({
      where: { journalId: Object.values(journalIds) },
      force: true
    });
    await JournalRatingCache.destroy({
      where: { journalId: Object.values(journalIds) },
      force: true
    });
    await Journal.destroy({
      where: { journalId: Object.values(journalIds) },
      force: true
    });

    // Clean up test categories
    await Category.destroy({
      where: { name: [`${TEST_PREFIX}_Sciences`, `${TEST_PREFIX}_Biology`, `${TEST_PREFIX}_Multidisciplinary`] },
      force: true
    });

    // Create test categories (parent + children)
    parentCategory = await Category.create({
      name: `${TEST_PREFIX}_Sciences`,
      level: 1,
      parentId: null
    });

    biologyCategory = await Category.create({
      name: `${TEST_PREFIX}_Biology`,
      level: 2,
      parentId: parentCategory.id
    });

    multidisciplinaryCategory = await Category.create({
      name: `${TEST_PREFIX}_Multidisciplinary`,
      level: 2,
      parentId: parentCategory.id
    });

    // Create test journals
    await Journal.bulkCreate([
      {
        journalId: journalIds.natureCommunications,
        name: `${TEST_PREFIX} Nature Communications`,
        issn: '2041-1723',
        impactFactor: 14.919
      },
      {
        journalId: journalIds.scienceAdvances,
        name: `${TEST_PREFIX} Science Advances`,
        issn: '2375-2548',
        impactFactor: 13.116
      },
      {
        journalId: journalIds.natureBiotechnology,
        name: `${TEST_PREFIX} Nature Biotechnology`,
        issn: '1087-0156',
        impactFactor: 46.9
      },
      {
        journalId: journalIds.cellReports,
        name: `${TEST_PREFIX} Cell Reports`,
        issn: '2211-1247',
        impactFactor: 9.995
      }
    ]);

    // Map journals to categories
    await JournalCategoryMap.bulkCreate([
      { journalId: journalIds.natureCommunications, categoryId: biologyCategory.id },
      { journalId: journalIds.natureBiotechnology, categoryId: biologyCategory.id },
      { journalId: journalIds.scienceAdvances, categoryId: multidisciplinaryCategory.id },
      { journalId: journalIds.cellReports, categoryId: biologyCategory.id }
    ]);
  });

  afterAll(async () => {
    // Final cleanup
    await JournalCategoryMap.destroy({
      where: { journalId: Object.values(journalIds) },
      force: true
    });
    await JournalLevel.destroy({
      where: { journalId: Object.values(journalIds) },
      force: true
    });
    await JournalRatingCache.destroy({
      where: { journalId: Object.values(journalIds) },
      force: true
    });
    await Journal.destroy({
      where: { journalId: Object.values(journalIds) },
      force: true
    });
    await Category.destroy({
      where: { name: [`${TEST_PREFIX}_Sciences`, `${TEST_PREFIX}_Biology`, `${TEST_PREFIX}_Multidisciplinary`] },
      force: true
    });

    await sequelize.close();
  });

  // ==================== Search Tests ====================

  describe('GET /api/journals/search', () => {
    it('should search journals by name', async () => {
      const response = await request(app)
        .get('/api/journals/search')
        .query({ q: TEST_PREFIX + ' Nature' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.journals)).toBe(true);
      // Should find Nature Communications and Nature Biotechnology
      expect(response.body.data.journals.length).toBe(2);
      response.body.data.journals.forEach(journal => {
        expect(journal.name).toContain('Nature');
      });
    });

    it('should search journals by ISSN', async () => {
      const response = await request(app)
        .get('/api/journals/search')
        .query({ q: '2041-1723' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.journals)).toBe(true);
      expect(response.body.data.journals.length).toBeGreaterThanOrEqual(1);
      const found = response.body.data.journals.find(
        j => j.journalId === journalIds.natureCommunications
      );
      expect(found).toBeDefined();
      expect(found.issn).toBe('2041-1723');
    });

    it('should return 400 for empty query', async () => {
      const response = await request(app)
        .get('/api/journals/search')
        .query({ q: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Search query must be at least 1 character');
    });

    it('should return 400 when query parameter is missing', async () => {
      const response = await request(app)
        .get('/api/journals/search');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should filter by categoryId', async () => {
      const response = await request(app)
        .get('/api/journals/search')
        .query({ q: TEST_PREFIX, categoryId: biologyCategory.id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Biology category has: Nature Communications, Nature Biotechnology, Cell Reports
      expect(response.body.data.journals.length).toBe(3);
      const names = response.body.data.journals.map(j => j.name);
      expect(names).toContain(`${TEST_PREFIX} Nature Communications`);
      expect(names).toContain(`${TEST_PREFIX} Nature Biotechnology`);
      expect(names).toContain(`${TEST_PREFIX} Cell Reports`);
    });

    it('should filter by parent categoryId (includes all children)', async () => {
      const response = await request(app)
        .get('/api/journals/search')
        .query({ q: TEST_PREFIX, categoryId: parentCategory.id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Parent category should include all journals from both child categories
      expect(response.body.data.journals.length).toBe(4);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/journals/search')
        .query({ q: TEST_PREFIX, page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.journals.length).toBeLessThanOrEqual(2);
      expect(response.body.data).toHaveProperty('hasMore');
      // We have 4 test journals, limit 2, so hasMore should be true
      expect(response.body.data.hasMore).toBe(true);
    });

    it('should return second page of results', async () => {
      const response = await request(app)
        .get('/api/journals/search')
        .query({ q: TEST_PREFIX, page: 2, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.journals.length).toBeGreaterThan(0);
      expect(response.body.data.journals.length).toBeLessThanOrEqual(2);
    });

    it('should return empty results for non-matching query', async () => {
      const response = await request(app)
        .get('/api/journals/search')
        .query({ q: 'zzz_nonexistent_journal_xyz_999' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.journals.length).toBe(0);
    });

    it('should return journals sorted by name ascending', async () => {
      const response = await request(app)
        .get('/api/journals/search')
        .query({ q: TEST_PREFIX, limit: 10 });

      expect(response.status).toBe(200);
      const names = response.body.data.journals.map(j => j.name);
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });
  });

  // ==================== Categories Tests ====================

  describe('GET /api/journals/categories', () => {
    it('should return categories as a tree structure', async () => {
      const response = await request(app)
        .get('/api/journals/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('categories');
      expect(Array.isArray(response.body.data.categories)).toBe(true);
      expect(response.body.data.categories.length).toBeGreaterThan(0);
    });

    it('should include parent categories with children arrays', async () => {
      const response = await request(app)
        .get('/api/journals/categories')
        .expect(200);

      const testParent = response.body.data.categories.find(
        c => c.name === `${TEST_PREFIX}_Sciences`
      );
      expect(testParent).toBeDefined();
      expect(Array.isArray(testParent.children)).toBe(true);
      expect(testParent.children.length).toBe(2);
    });

    it('should include journalCount in child categories', async () => {
      const response = await request(app)
        .get('/api/journals/categories')
        .expect(200);

      const testParent = response.body.data.categories.find(
        c => c.name === `${TEST_PREFIX}_Sciences`
      );
      expect(testParent).toBeDefined();

      const bioChild = testParent.children.find(
        c => c.name === `${TEST_PREFIX}_Biology`
      );
      expect(bioChild).toBeDefined();
      expect(bioChild.journalCount).toBe(3); // Nature Comm, Nature Biotech, Cell Reports

      const multiChild = testParent.children.find(
        c => c.name === `${TEST_PREFIX}_Multidisciplinary`
      );
      expect(multiChild).toBeDefined();
      expect(multiChild.journalCount).toBe(1); // Science Advances
    });

    it('should have child categories with id and name fields', async () => {
      const response = await request(app)
        .get('/api/journals/categories')
        .expect(200);

      const testParent = response.body.data.categories.find(
        c => c.name === `${TEST_PREFIX}_Sciences`
      );
      expect(testParent).toBeDefined();

      testParent.children.forEach(child => {
        expect(child).toHaveProperty('id');
        expect(child).toHaveProperty('name');
        expect(child).toHaveProperty('journalCount');
        expect(typeof child.journalCount).toBe('number');
      });
    });

    it('should return categories sorted by id ascending', async () => {
      const response = await request(app)
        .get('/api/journals/categories')
        .expect(200);

      const categories = response.body.data.categories;
      // Parent categories sorted by id ASC
      for (let i = 0; i < categories.length - 1; i++) {
        expect(categories[i].id).toBeLessThan(categories[i + 1].id);
      }
    });
  });
});
