const request = require('supertest');
const app = require('../../server');
const { sequelize, Tag, PostTagMap, PostCategory, Post, User } = require('../../models');

describe('Admin Tag API Integration Tests', () => {
  let adminToken;
  let adminUser;
  let userToken;
  let regularUser;

  beforeAll(async () => {
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    // Clean up test data in dependency order
    await PostTagMap.destroy({ where: {}, force: true });
    await Tag.destroy({ where: {}, force: true });
    await Post.destroy({
      where: { title: { [require('sequelize').Op.like]: 'tag-test-%' } },
      force: true
    });
    await PostCategory.destroy({ where: {}, force: true });

    // Register regular user
    const userEmail = `tag-user-${Date.now()}@example.com`;
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: userEmail,
        password: 'TestPass123!',
        name: 'Tag Regular User'
      });

    userToken = userRes.body.data.token;
    regularUser = userRes.body.data.user;

    // Register admin user
    const adminEmail = `tag-admin-${Date.now()}@example.com`;
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: adminEmail,
        password: 'TestPass123!',
        name: 'Tag Admin User'
      });

    adminToken = adminRes.body.data.token;
    adminUser = adminRes.body.data.user;

    // Promote to admin
    await User.update({ role: 'admin' }, { where: { id: adminUser.id } });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ==================== Permission Checks ====================

  describe('Permission checks', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/admin/tags');

      expect(res.status).toBe(401);
    });

    it('should return 403 for regular user', async () => {
      const res = await request(app)
        .get('/api/admin/tags')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ==================== GET /api/admin/tags ====================

  describe('GET /api/admin/tags', () => {
    it('should return all tags including pending', async () => {
      await Tag.create({
        name: 'Approved',
        normalizedName: 'approved',
        status: 'approved',
        createdBy: adminUser.id
      });
      await Tag.create({
        name: 'Pending',
        normalizedName: 'pending',
        status: 'pending',
        createdBy: adminUser.id
      });

      const res = await request(app)
        .get('/api/admin/tags')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.tags.length).toBe(2);
      const statuses = res.body.tags.map(t => t.status);
      expect(statuses).toContain('approved');
      expect(statuses).toContain('pending');
    });

    it('should filter by status', async () => {
      await Tag.create({
        name: 'Approved',
        normalizedName: 'approved',
        status: 'approved',
        createdBy: adminUser.id
      });
      await Tag.create({
        name: 'Pending',
        normalizedName: 'pending',
        status: 'pending',
        createdBy: adminUser.id
      });

      const res = await request(app)
        .get('/api/admin/tags')
        .query({ status: 'pending' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.tags.length).toBe(1);
      expect(res.body.tags[0].status).toBe('pending');
    });

    it('should filter by isOfficial', async () => {
      await Tag.create({
        name: 'Official',
        normalizedName: 'official',
        status: 'approved',
        isOfficial: true,
        createdBy: adminUser.id
      });
      await Tag.create({
        name: 'Community',
        normalizedName: 'community',
        status: 'approved',
        isOfficial: false,
        createdBy: adminUser.id
      });

      const res = await request(app)
        .get('/api/admin/tags')
        .query({ isOfficial: 'true' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.tags.length).toBe(1);
      expect(res.body.tags[0].isOfficial).toBe(true);
    });

    it('should search by name', async () => {
      await Tag.create({
        name: 'Machine',
        normalizedName: 'machine',
        status: 'approved',
        createdBy: adminUser.id
      });
      await Tag.create({
        name: 'Biology',
        normalizedName: 'biology',
        status: 'approved',
        createdBy: adminUser.id
      });

      const res = await request(app)
        .get('/api/admin/tags')
        .query({ search: 'Mach' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.tags.length).toBe(1);
      expect(res.body.tags[0].name).toBe('Machine');
    });

    it('should include creator info', async () => {
      await Tag.create({
        name: 'WithUser',
        normalizedName: 'withuser',
        status: 'approved',
        createdBy: adminUser.id
      });

      const res = await request(app)
        .get('/api/admin/tags')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.tags.length).toBeGreaterThan(0);
      const tag = res.body.tags[0];
      expect(tag.creator).toBeDefined();
      expect(tag.creator.id).toBe(adminUser.id);
      expect(tag.creator).toHaveProperty('name');
      expect(tag.creator).toHaveProperty('avatar');
    });

    it('should paginate correctly', async () => {
      await Tag.bulkCreate([
        { name: 'TagA', normalizedName: 'taga', status: 'approved', createdBy: adminUser.id },
        { name: 'TagB', normalizedName: 'tagb', status: 'approved', createdBy: adminUser.id },
        { name: 'TagC', normalizedName: 'tagc', status: 'approved', createdBy: adminUser.id }
      ]);

      const res = await request(app)
        .get('/api/admin/tags')
        .query({ limit: 2, page: 1 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.tags.length).toBe(2);
      expect(res.body.pagination.total).toBe(3);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.totalPages).toBe(2);
    });
  });

  // ==================== POST /api/admin/tags ====================

  describe('POST /api/admin/tags', () => {
    it('should create official tag', async () => {
      const res = await request(app)
        .post('/api/admin/tags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Science' });

      expect(res.status).toBe(201);
      expect(res.body.tag.name).toBe('Science');
      expect(res.body.tag.isOfficial).toBe(true);
      expect(res.body.tag.status).toBe('approved');
    });

    it('should return 400 for duplicate name', async () => {
      await Tag.create({
        name: 'Existing',
        normalizedName: 'existing',
        status: 'approved',
        createdBy: adminUser.id
      });

      const res = await request(app)
        .post('/api/admin/tags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'existing' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for empty name', async () => {
      const res = await request(app)
        .post('/api/admin/tags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
    });
  });

  // ==================== PUT /api/admin/tags/:id ====================

  describe('PUT /api/admin/tags/:id', () => {
    it('should update tag name', async () => {
      const tag = await Tag.create({
        name: 'OldName',
        normalizedName: 'oldname',
        status: 'approved',
        createdBy: adminUser.id
      });

      const res = await request(app)
        .put(`/api/admin/tags/${tag.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'NewName' });

      expect(res.status).toBe(200);
      expect(res.body.tag.name).toBe('NewName');
      expect(res.body.tag.normalizedName).toBe('newname');
    });

    it('should sync normalizedName on update', async () => {
      const tag = await Tag.create({
        name: 'Original',
        normalizedName: 'original',
        status: 'approved',
        createdBy: adminUser.id
      });

      const res = await request(app)
        .put(`/api/admin/tags/${tag.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'UPPERCASE' });

      expect(res.status).toBe(200);
      expect(res.body.tag.normalizedName).toBe('uppercase');
    });

    it('should return 400 for duplicate name', async () => {
      await Tag.create({
        name: 'First',
        normalizedName: 'first',
        status: 'approved',
        createdBy: adminUser.id
      });
      const second = await Tag.create({
        name: 'Second',
        normalizedName: 'second',
        status: 'approved',
        createdBy: adminUser.id
      });

      const res = await request(app)
        .put(`/api/admin/tags/${second.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'First' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for empty name', async () => {
      const tag = await Tag.create({
        name: 'SomeName',
        normalizedName: 'somename',
        status: 'approved',
        createdBy: adminUser.id
      });

      const res = await request(app)
        .put(`/api/admin/tags/${tag.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
    });

    it('should return 404 for nonexistent id', async () => {
      const res = await request(app)
        .put('/api/admin/tags/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Whatever' });

      expect(res.status).toBe(404);
    });
  });

  // ==================== DELETE /api/admin/tags/:id ====================

  describe('DELETE /api/admin/tags/:id', () => {
    it('should delete tag', async () => {
      const tag = await Tag.create({
        name: 'ToDelete',
        normalizedName: 'todelete',
        status: 'approved',
        createdBy: adminUser.id
      });

      const res = await request(app)
        .delete(`/api/admin/tags/${tag.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      const deleted = await Tag.findByPk(tag.id);
      expect(deleted).toBeNull();
    });

    it('should cascade delete PostTagMap entries', async () => {
      const tag = await Tag.create({
        name: 'Cascade',
        normalizedName: 'cascade',
        status: 'approved',
        createdBy: adminUser.id
      });

      const post = await Post.create({
        userId: adminUser.id,
        title: 'tag-test-cascade',
        content: 'Content for cascade test',
        category: 'discussion'
      });

      await PostTagMap.create({ postId: post.id, tagId: tag.id });

      const res = await request(app)
        .delete(`/api/admin/tags/${tag.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      const mapping = await PostTagMap.findOne({ where: { tagId: tag.id } });
      expect(mapping).toBeNull();
    });

    it('should return 404 for nonexistent id', async () => {
      const res = await request(app)
        .delete('/api/admin/tags/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ==================== PUT /api/admin/tags/:id/approve ====================

  describe('PUT /api/admin/tags/:id/approve', () => {
    it('should approve pending tag', async () => {
      const tag = await Tag.create({
        name: 'PendAppr',
        normalizedName: 'pendappr',
        status: 'pending',
        createdBy: regularUser.id
      });

      const res = await request(app)
        .put(`/api/admin/tags/${tag.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.tag.status).toBe('approved');

      const updated = await Tag.findByPk(tag.id);
      expect(updated.status).toBe('approved');
    });

    it('should return 404 for nonexistent id', async () => {
      const res = await request(app)
        .put('/api/admin/tags/999999/approve')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ==================== PUT /api/admin/tags/:id/reject ====================

  describe('PUT /api/admin/tags/:id/reject', () => {
    it('should reject and delete tag', async () => {
      const tag = await Tag.create({
        name: 'PendRej',
        normalizedName: 'pendrej',
        status: 'pending',
        createdBy: regularUser.id
      });

      const res = await request(app)
        .put(`/api/admin/tags/${tag.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      const deleted = await Tag.findByPk(tag.id);
      expect(deleted).toBeNull();
    });

    it('should return 404 for nonexistent id', async () => {
      const res = await request(app)
        .put('/api/admin/tags/999999/reject')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ==================== POST /api/admin/tags/batch-approve ====================

  describe('POST /api/admin/tags/batch-approve', () => {
    it('should batch approve multiple tags', async () => {
      const tags = await Tag.bulkCreate([
        { name: 'BatchA', normalizedName: 'batcha', status: 'pending', createdBy: regularUser.id },
        { name: 'BatchB', normalizedName: 'batchb', status: 'pending', createdBy: regularUser.id },
        { name: 'BatchC', normalizedName: 'batchc', status: 'pending', createdBy: regularUser.id }
      ]);

      const tagIds = tags.map(t => t.id);

      const res = await request(app)
        .post('/api/admin/tags/batch-approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tagIds });

      expect(res.status).toBe(200);

      // Verify all approved
      for (const id of tagIds) {
        const tag = await Tag.findByPk(id);
        expect(tag.status).toBe('approved');
      }
    });

    it('should return 400 for empty array', async () => {
      const res = await request(app)
        .post('/api/admin/tags/batch-approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tagIds: [] });

      expect(res.status).toBe(400);
    });

    it('should return 400 for non-array', async () => {
      const res = await request(app)
        .post('/api/admin/tags/batch-approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tagIds: 'not-an-array' });

      expect(res.status).toBe(400);
    });
  });

  // ==================== POST /api/admin/tags/batch-reject ====================

  describe('POST /api/admin/tags/batch-reject', () => {
    it('should batch reject and delete tags and their PostTagMap entries', async () => {
      const tags = await Tag.bulkCreate([
        { name: 'RejectA', normalizedName: 'rejecta', status: 'pending', createdBy: regularUser.id },
        { name: 'RejectB', normalizedName: 'rejectb', status: 'pending', createdBy: regularUser.id }
      ]);

      const tagIds = tags.map(t => t.id);

      // Create posts and link them to tags
      const post = await Post.create({
        userId: adminUser.id,
        title: 'tag-test-batch-reject',
        content: 'Content',
        category: 'discussion'
      });

      await PostTagMap.create({ postId: post.id, tagId: tags[0].id });
      await PostTagMap.create({ postId: post.id, tagId: tags[1].id });

      const res = await request(app)
        .post('/api/admin/tags/batch-reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tagIds });

      expect(res.status).toBe(200);

      // Verify tags deleted
      for (const id of tagIds) {
        const tag = await Tag.findByPk(id);
        expect(tag).toBeNull();
      }

      // Verify PostTagMap entries deleted
      const mappings = await PostTagMap.findAll({
        where: { tagId: { [require('sequelize').Op.in]: tagIds } }
      });
      expect(mappings.length).toBe(0);
    });

    it('should return 400 for empty array', async () => {
      const res = await request(app)
        .post('/api/admin/tags/batch-reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tagIds: [] });

      expect(res.status).toBe(400);
    });
  });

  // ==================== POST /api/admin/tags/merge ====================

  describe('POST /api/admin/tags/merge', () => {
    it('should merge tags: migrate posts from source to target', async () => {
      const sourceTag = await Tag.create({
        name: 'Source',
        normalizedName: 'source',
        status: 'approved',
        createdBy: adminUser.id
      });
      const targetTag = await Tag.create({
        name: 'Target',
        normalizedName: 'target',
        status: 'approved',
        createdBy: adminUser.id
      });

      // Create posts linked to source tag
      const post1 = await Post.create({
        userId: adminUser.id,
        title: 'tag-test-merge-1',
        content: 'Content 1',
        category: 'discussion'
      });
      const post2 = await Post.create({
        userId: adminUser.id,
        title: 'tag-test-merge-2',
        content: 'Content 2',
        category: 'discussion'
      });

      await PostTagMap.create({ postId: post1.id, tagId: sourceTag.id });
      await PostTagMap.create({ postId: post2.id, tagId: sourceTag.id });

      const res = await request(app)
        .post('/api/admin/tags/merge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sourceTagId: sourceTag.id, targetTagId: targetTag.id });

      expect(res.status).toBe(200);

      // Source tag should be deleted
      const deletedSource = await Tag.findByPk(sourceTag.id);
      expect(deletedSource).toBeNull();

      // Target should have all posts
      const targetMappings = await PostTagMap.findAll({
        where: { tagId: targetTag.id }
      });
      expect(targetMappings.length).toBe(2);

      const targetPostIds = targetMappings.map(m => m.postId);
      expect(targetPostIds).toContain(post1.id);
      expect(targetPostIds).toContain(post2.id);
    });

    it('should not create duplicate associations for overlapping posts', async () => {
      const sourceTag = await Tag.create({
        name: 'SrcDup',
        normalizedName: 'srcdup',
        status: 'approved',
        createdBy: adminUser.id
      });
      const targetTag = await Tag.create({
        name: 'TgtDup',
        normalizedName: 'tgtdup',
        status: 'approved',
        createdBy: adminUser.id
      });

      const post = await Post.create({
        userId: adminUser.id,
        title: 'tag-test-overlap',
        content: 'Overlapping content',
        category: 'discussion'
      });

      // Post linked to both tags
      await PostTagMap.create({ postId: post.id, tagId: sourceTag.id });
      await PostTagMap.create({ postId: post.id, tagId: targetTag.id });

      const res = await request(app)
        .post('/api/admin/tags/merge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sourceTagId: sourceTag.id, targetTagId: targetTag.id });

      expect(res.status).toBe(200);

      // No duplicate PostTagMap entries
      const mappings = await PostTagMap.findAll({
        where: { tagId: targetTag.id }
      });
      expect(mappings.length).toBe(1);
      expect(mappings[0].postId).toBe(post.id);
    });

    it('should delete source tag after merge', async () => {
      const sourceTag = await Tag.create({
        name: 'SrcDel',
        normalizedName: 'srcdel',
        status: 'approved',
        createdBy: adminUser.id
      });
      const targetTag = await Tag.create({
        name: 'TgtDel',
        normalizedName: 'tgtdel',
        status: 'approved',
        createdBy: adminUser.id
      });

      const res = await request(app)
        .post('/api/admin/tags/merge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sourceTagId: sourceTag.id, targetTagId: targetTag.id });

      expect(res.status).toBe(200);

      const deleted = await Tag.findByPk(sourceTag.id);
      expect(deleted).toBeNull();
    });

    it('should recalculate target postCount', async () => {
      const sourceTag = await Tag.create({
        name: 'SrcCnt',
        normalizedName: 'srccnt',
        status: 'approved',
        createdBy: adminUser.id,
        postCount: 0
      });
      const targetTag = await Tag.create({
        name: 'TgtCnt',
        normalizedName: 'tgtcnt',
        status: 'approved',
        createdBy: adminUser.id,
        postCount: 0
      });

      const post1 = await Post.create({
        userId: adminUser.id,
        title: 'tag-test-cnt-1',
        content: 'Content',
        category: 'discussion'
      });
      const post2 = await Post.create({
        userId: adminUser.id,
        title: 'tag-test-cnt-2',
        content: 'Content',
        category: 'discussion'
      });
      const post3 = await Post.create({
        userId: adminUser.id,
        title: 'tag-test-cnt-3',
        content: 'Content',
        category: 'discussion'
      });

      // Target already has post1
      await PostTagMap.create({ postId: post1.id, tagId: targetTag.id });
      // Source has post2 and post3
      await PostTagMap.create({ postId: post2.id, tagId: sourceTag.id });
      await PostTagMap.create({ postId: post3.id, tagId: sourceTag.id });

      await request(app)
        .post('/api/admin/tags/merge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sourceTagId: sourceTag.id, targetTagId: targetTag.id });

      const updatedTarget = await Tag.findByPk(targetTag.id);
      const actualCount = await PostTagMap.count({ where: { tagId: targetTag.id } });
      expect(updatedTarget.postCount).toBe(actualCount);
      expect(updatedTarget.postCount).toBe(3);
    });

    it('should return 400 when source equals target', async () => {
      const tag = await Tag.create({
        name: 'SameTag',
        normalizedName: 'sametag',
        status: 'approved',
        createdBy: adminUser.id
      });

      const res = await request(app)
        .post('/api/admin/tags/merge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sourceTagId: tag.id, targetTagId: tag.id });

      expect(res.status).toBe(400);
    });

    it('should return 404 for nonexistent source tag', async () => {
      const targetTag = await Tag.create({
        name: 'TgtOnly',
        normalizedName: 'tgtonly',
        status: 'approved',
        createdBy: adminUser.id
      });

      const res = await request(app)
        .post('/api/admin/tags/merge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sourceTagId: 999999, targetTagId: targetTag.id });

      expect(res.status).toBe(404);
    });

    it('should return 404 for nonexistent target tag', async () => {
      const sourceTag = await Tag.create({
        name: 'SrcOnly',
        normalizedName: 'srconly',
        status: 'approved',
        createdBy: adminUser.id
      });

      const res = await request(app)
        .post('/api/admin/tags/merge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sourceTagId: sourceTag.id, targetTagId: 999999 });

      expect(res.status).toBe(404);
    });

    it('should return 400 when missing parameters', async () => {
      const res = await request(app)
        .post('/api/admin/tags/merge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ==================== Admin Category API - Permission ====================

  describe('Admin Category API - Permission', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/admin/post-categories');

      expect(res.status).toBe(401);
    });

    it('should return 403 for regular user', async () => {
      const res = await request(app)
        .get('/api/admin/post-categories')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ==================== Admin Category API ====================

  describe('Admin Category API', () => {
    it('should get all categories including inactive', async () => {
      await PostCategory.create({
        name: 'Active Cat',
        slug: 'active-cat',
        isActive: true,
        sortOrder: 0
      });
      await PostCategory.create({
        name: 'Inactive Cat',
        slug: 'inactive-cat',
        isActive: false,
        sortOrder: 1
      });

      const res = await request(app)
        .get('/api/admin/post-categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.categories.length).toBe(2);
      const activeStates = res.body.categories.map(c => c.isActive);
      expect(activeStates).toContain(true);
      expect(activeStates).toContain(false);
    });

    it('should create category with auto sortOrder', async () => {
      const res1 = await request(app)
        .post('/api/admin/post-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'First', slug: 'first' });

      expect(res1.status).toBe(201);
      const firstOrder = res1.body.category.sortOrder;

      const res2 = await request(app)
        .post('/api/admin/post-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Second', slug: 'second' });

      expect(res2.status).toBe(201);
      expect(res2.body.category.sortOrder).toBe(firstOrder + 1);
    });

    it('should return 400 for missing name or slug', async () => {
      const res1 = await request(app)
        .post('/api/admin/post-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'NoSlug' });

      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post('/api/admin/post-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slug: 'no-name' });

      expect(res2.status).toBe(400);
    });

    it('should return 400 for duplicate slug', async () => {
      await PostCategory.create({
        name: 'Existing',
        slug: 'existing-slug',
        sortOrder: 0
      });

      const res = await request(app)
        .post('/api/admin/post-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Another', slug: 'existing-slug' });

      expect(res.status).toBe(400);
    });

    it('should update category', async () => {
      const category = await PostCategory.create({
        name: 'OldCat',
        slug: 'old-cat',
        sortOrder: 0
      });

      const res = await request(app)
        .put(`/api/admin/post-categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'NewCat', slug: 'new-cat' });

      expect(res.status).toBe(200);
      expect(res.body.category.name).toBe('NewCat');
      expect(res.body.category.slug).toBe('new-cat');
    });

    it('should return 404 for update nonexistent id', async () => {
      const res = await request(app)
        .put('/api/admin/post-categories/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nope', slug: 'nope' });

      expect(res.status).toBe(404);
    });

    it('should return 400 for update duplicate slug', async () => {
      await PostCategory.create({
        name: 'CatA',
        slug: 'cat-a',
        sortOrder: 0
      });
      const catB = await PostCategory.create({
        name: 'CatB',
        slug: 'cat-b',
        sortOrder: 1
      });

      const res = await request(app)
        .put(`/api/admin/post-categories/${catB.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'CatB Updated', slug: 'cat-a' });

      expect(res.status).toBe(400);
    });

    it('should toggle category active state', async () => {
      const category = await PostCategory.create({
        name: 'ToggleCat',
        slug: 'toggle-cat',
        isActive: true,
        sortOrder: 0
      });

      const res = await request(app)
        .put(`/api/admin/post-categories/${category.id}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.category.isActive).toBe(false);

      // Toggle back
      const res2 = await request(app)
        .put(`/api/admin/post-categories/${category.id}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res2.status).toBe(200);
      expect(res2.body.category.isActive).toBe(true);
    });

    it('should return 404 for toggle nonexistent id', async () => {
      const res = await request(app)
        .put('/api/admin/post-categories/999999/toggle')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should reorder categories', async () => {
      const cat1 = await PostCategory.create({ name: 'R1', slug: 'r1', sortOrder: 0 });
      const cat2 = await PostCategory.create({ name: 'R2', slug: 'r2', sortOrder: 1 });
      const cat3 = await PostCategory.create({ name: 'R3', slug: 'r3', sortOrder: 2 });

      // Reverse the order: cat3, cat1, cat2
      const res = await request(app)
        .put('/api/admin/post-categories/reorder')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ orderedIds: [cat3.id, cat1.id, cat2.id] });

      expect(res.status).toBe(200);

      const updated1 = await PostCategory.findByPk(cat1.id);
      const updated2 = await PostCategory.findByPk(cat2.id);
      const updated3 = await PostCategory.findByPk(cat3.id);

      expect(updated3.sortOrder).toBe(0);
      expect(updated1.sortOrder).toBe(1);
      expect(updated2.sortOrder).toBe(2);
    });

    it('should return 400 for empty reorder array', async () => {
      const res = await request(app)
        .put('/api/admin/post-categories/reorder')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ orderedIds: [] });

      expect(res.status).toBe(400);
    });

    it('should migrate posts between categories', async () => {
      const sourceCat = await PostCategory.create({
        name: 'MigSrc',
        slug: 'mig-src',
        sortOrder: 0,
        postCount: 1
      });
      const targetCat = await PostCategory.create({
        name: 'MigTgt',
        slug: 'mig-tgt',
        sortOrder: 1,
        postCount: 0
      });

      // Create a post in source category
      await Post.create({
        userId: adminUser.id,
        title: 'tag-test-migrate',
        content: 'Post to migrate',
        category: 'discussion',
        categoryId: sourceCat.id
      });

      const res = await request(app)
        .post(`/api/admin/post-categories/${sourceCat.id}/migrate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ targetCategoryId: targetCat.id });

      expect(res.status).toBe(200);

      // Verify posts moved
      const postsInSource = await Post.count({ where: { categoryId: sourceCat.id } });
      const postsInTarget = await Post.count({ where: { categoryId: targetCat.id } });
      expect(postsInSource).toBe(0);
      expect(postsInTarget).toBe(1);

      // Verify postCount recalculated
      const updatedSource = await PostCategory.findByPk(sourceCat.id);
      const updatedTarget = await PostCategory.findByPk(targetCat.id);
      expect(updatedSource.postCount).toBe(0);
      expect(updatedTarget.postCount).toBe(1);
    });

    it('should return 404 for migrate nonexistent source/target', async () => {
      const validCat = await PostCategory.create({
        name: 'Valid',
        slug: 'valid-mig',
        sortOrder: 0
      });

      // Nonexistent source
      const res1 = await request(app)
        .post('/api/admin/post-categories/999999/migrate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ targetCategoryId: validCat.id });

      expect(res1.status).toBe(404);

      // Nonexistent target
      const res2 = await request(app)
        .post(`/api/admin/post-categories/${validCat.id}/migrate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ targetCategoryId: 999999 });

      expect(res2.status).toBe(404);
    });
  });
});
