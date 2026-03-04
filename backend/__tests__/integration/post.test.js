const request = require('supertest');
const app = require('../../server');
const { sequelize, Post, PostComment, PostLike, PostFavorite, PostFollow, PostReport, User } = require('../../models');

describe('Post API Integration Tests', () => {
  let authToken;
  let userId;
  let testPost;
  let secondUser;
  let secondUserToken;

  beforeAll(async () => {
    // Ensure database is connected
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    // Clean up test data
    await PostReport.destroy({ where: {}, force: true });
    await PostCommentLike.destroy({ where: {}, force: true });
    await PostComment.destroy({ where: {}, force: true });
    await PostFollow.destroy({ where: {}, force: true });
    await PostFavorite.destroy({ where: {}, force: true });
    await PostLike.destroy({ where: {}, force: true });
    await Post.destroy({ where: {}, force: true });

    // Create test user and login
    const email = `test-${Date.now()}@example.com`;
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email,
        password: 'TestPass123!',
        name: 'Test User'
      });

    authToken = registerRes.body.token;
    userId = registerRes.body.user.id;

    // Create second test user
    const email2 = `test2-${Date.now()}@example.com`;
    const registerRes2 = await request(app)
      .post('/api/auth/register')
      .send({
        email: email2,
        password: 'TestPass123!',
        name: 'Second User'
      });

    secondUserToken = registerRes2.body.token;
    secondUser = registerRes2.body.user;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/posts', () => {
    it('should create a new post successfully', async () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is a test post content with **markdown**.',
        category: 'discussion',
        tags: ['test', 'discussion']
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe(postData.title);
      expect(res.body.content).toBe(postData.content);
      expect(res.body.category).toBe(postData.category);
      expect(res.body.tags).toEqual(postData.tags);
      expect(res.body.userId).toBe(userId);
      expect(res.body.viewCount).toBe(0);
      expect(res.body.likeCount).toBe(0);

      testPost = res.body;
    });

    it('should create post with optional journalId', async () => {
      const postData = {
        title: 'Test Post with Journal',
        content: 'Content',
        category: 'experience',
        tags: ['journal'],
        journalId: 1
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData);

      expect(res.status).toBe(201);
      expect(res.body.journalId).toBe(1);
    });

    it('should fail without authentication', async () => {
      const postData = {
        title: 'Test',
        content: 'Content',
        category: 'discussion',
        tags: []
      };

      const res = await request(app)
        .post('/api/posts')
        .send(postData);

      expect(res.status).toBe(401);
    });

    it('should fail with missing required fields', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Only Title' });

      expect(res.status).toBe(400);
    });

    it('should fail with invalid category', async () => {
      const postData = {
        title: 'Test',
        content: 'Content',
        category: 'invalid_category',
        tags: []
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/posts', () => {
    beforeEach(async () => {
      // Create test posts
      await Post.create({
        userId,
        title: 'Hot Post',
        content: 'Content 1',
        category: 'discussion',
        tags: ['hot', 'popular'],
        hotScore: 100,
        likeCount: 50,
        viewCount: 1000
      });

      await Post.create({
        userId,
        title: 'Recent Post',
        content: 'Content 2',
        category: 'question',
        tags: ['new'],
        hotScore: 10,
        likeCount: 5,
        viewCount: 50
      });
    });

    it('should get posts list with default sorting (hot)', async () => {
      const res = await request(app).get('/api/posts');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('posts');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.posts)).toBe(true);
      expect(res.body.posts.length).toBeGreaterThan(0);

      // Should be sorted by hot score (descending)
      if (res.body.posts.length >= 2) {
        expect(res.body.posts[0].hotScore).toBeGreaterThanOrEqual(res.body.posts[1].hotScore);
      }
    });

    it('should filter posts by category', async () => {
      const res = await request(app)
        .get('/api/posts')
        .query({ category: 'discussion' });

      expect(res.status).toBe(200);
      res.body.posts.forEach(post => {
        expect(post.category).toBe('discussion');
      });
    });

    it('should filter posts by tag', async () => {
      const res = await request(app)
        .get('/api/posts')
        .query({ tag: 'hot' });

      expect(res.status).toBe(200);
      res.body.posts.forEach(post => {
        expect(post.tags).toContain('hot');
      });
    });

    it('should search posts by keyword', async () => {
      const res = await request(app)
        .get('/api/posts')
        .query({ search: 'Recent' });

      expect(res.status).toBe(200);
      expect(res.body.posts.length).toBeGreaterThan(0);
      expect(res.body.posts[0].title).toContain('Recent');
    });

    it('should sort posts by different criteria', async () => {
      // Sort by latest
      const latestRes = await request(app)
        .get('/api/posts')
        .query({ sortBy: 'latest' });

      expect(latestRes.status).toBe(200);

      // Sort by views
      const viewsRes = await request(app)
        .get('/api/posts')
        .query({ sortBy: 'views' });

      expect(viewsRes.status).toBe(200);
      if (viewsRes.body.posts.length >= 2) {
        expect(viewsRes.body.posts[0].viewCount).toBeGreaterThanOrEqual(viewsRes.body.posts[1].viewCount);
      }
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/api/posts')
        .query({ page: 1, limit: 1 });

      expect(res.status).toBe(200);
      expect(res.body.posts.length).toBe(1);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/posts/:id', () => {
    beforeEach(async () => {
      testPost = await Post.create({
        userId,
        title: 'Detail Test Post',
        content: 'Detailed content',
        category: 'discussion',
        tags: ['test']
      });
    });

    it('should get post by id successfully', async () => {
      const res = await request(app).get(`/api/posts/${testPost.id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testPost.id);
      expect(res.body.title).toBe(testPost.title);
      expect(res.body).toHaveProperty('author');
      expect(res.body.author.id).toBe(userId);
    });

    it('should include user interaction status when authenticated', async () => {
      // Like the post first
      await PostLike.create({ userId, postId: testPost.id });

      const res = await request(app)
        .get(`/api/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.userLiked).toBe(true);
      expect(res.body.userFavorited).toBe(false);
      expect(res.body.userFollowed).toBe(false);
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app).get('/api/posts/999999');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/posts/:id', () => {
    beforeEach(async () => {
      testPost = await Post.create({
        userId,
        title: 'Original Title',
        content: 'Original content',
        category: 'discussion',
        tags: ['original']
      });
    });

    it('should update post successfully by author', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        category: 'question',
        tags: ['updated']
      };

      const res = await request(app)
        .put(`/api/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe(updateData.title);
      expect(res.body.content).toBe(updateData.content);
      expect(res.body.category).toBe(updateData.category);
      expect(res.body.tags).toEqual(updateData.tags);
    });

    it('should fail to update post by non-author', async () => {
      const updateData = {
        title: 'Hacked Title',
        content: 'Hacked content',
        category: 'discussion',
        tags: []
      };

      const res = await request(app)
        .put(`/api/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send(updateData);

      expect(res.status).toBe(403);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .put(`/api/posts/${testPost.id}`)
        .send({ title: 'New Title' });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    beforeEach(async () => {
      testPost = await Post.create({
        userId,
        title: 'To Delete',
        content: 'Will be deleted',
        category: 'discussion',
        tags: []
      });
    });

    it('should soft delete post by author', async () => {
      const res = await request(app)
        .delete(`/api/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      // Verify soft delete
      const deleted = await Post.findByPk(testPost.id);
      expect(deleted.isDeleted).toBe(true);
    });

    it('should fail to delete post by non-author (non-admin)', async () => {
      const res = await request(app)
        .delete(`/api/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${secondUserToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to delete any post', async () => {
      // Make second user an admin
      await User.update({ role: 'admin' }, { where: { id: secondUser.id } });

      const res = await request(app)
        .delete(`/api/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${secondUserToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/posts/:id/like', () => {
    beforeEach(async () => {
      testPost = await Post.create({
        userId,
        title: 'Like Test',
        content: 'Test like feature',
        category: 'discussion',
        tags: []
      });
    });

    it('should like post successfully', async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost.id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.liked).toBe(true);
      expect(res.body.likeCount).toBe(1);

      // Verify in database
      const like = await PostLike.findOne({
        where: { userId, postId: testPost.id }
      });
      expect(like).not.toBeNull();
    });

    it('should unlike post when already liked', async () => {
      // Like first
      await PostLike.create({ userId, postId: testPost.id });
      await testPost.update({ likeCount: 1 });

      const res = await request(app)
        .post(`/api/posts/${testPost.id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.liked).toBe(false);
      expect(res.body.likeCount).toBe(0);

      // Verify removed from database
      const like = await PostLike.findOne({
        where: { userId, postId: testPost.id }
      });
      expect(like).toBeNull();
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost.id}/like`);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/posts/:id/favorite', () => {
    beforeEach(async () => {
      testPost = await Post.create({
        userId,
        title: 'Favorite Test',
        content: 'Test favorite feature',
        category: 'discussion',
        tags: []
      });
    });

    it('should favorite post successfully', async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost.id}/favorite`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.favorited).toBe(true);
      expect(res.body.favoriteCount).toBe(1);
    });

    it('should unfavorite when already favorited', async () => {
      await PostFavorite.create({ userId, postId: testPost.id });
      await testPost.update({ favoriteCount: 1 });

      const res = await request(app)
        .post(`/api/posts/${testPost.id}/favorite`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.favorited).toBe(false);
      expect(res.body.favoriteCount).toBe(0);
    });
  });

  describe('POST /api/posts/:id/follow', () => {
    beforeEach(async () => {
      testPost = await Post.create({
        userId,
        title: 'Follow Test',
        content: 'Test follow feature',
        category: 'discussion',
        tags: []
      });
    });

    it('should follow post successfully', async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost.id}/follow`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.followed).toBe(true);
      expect(res.body.followCount).toBe(1);
    });

    it('should unfollow when already followed', async () => {
      await PostFollow.create({ userId, postId: testPost.id });
      await testPost.update({ followCount: 1 });

      const res = await request(app)
        .post(`/api/posts/${testPost.id}/follow`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.followed).toBe(false);
      expect(res.body.followCount).toBe(0);
    });
  });

  describe('POST /api/posts/:id/report', () => {
    beforeEach(async () => {
      testPost = await Post.create({
        userId,
        title: 'Report Test',
        content: 'Test report feature',
        category: 'discussion',
        tags: []
      });
    });

    it('should report post successfully', async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost.id}/report`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({ reason: 'Spam content' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('举报已提交');

      // Verify in database
      const report = await PostReport.findOne({
        where: { postId: testPost.id, reporterId: secondUser.id }
      });
      expect(report).not.toBeNull();
      expect(report.reason).toBe('Spam content');
    });

    it('should fail without reason', async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost.id}/report`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should not allow reporting own post', async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost.id}/report`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Test' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/posts/:id/view', () => {
    beforeEach(async () => {
      testPost = await Post.create({
        userId,
        title: 'View Test',
        content: 'Test view count',
        category: 'discussion',
        tags: [],
        viewCount: 0
      });
    });

    it('should increment view count successfully', async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost.id}/view`);

      expect(res.status).toBe(200);
      expect(res.body.viewCount).toBe(1);

      // Verify in database
      await testPost.reload();
      expect(testPost.viewCount).toBe(1);
    });

    it('should increment multiple times', async () => {
      await request(app).post(`/api/posts/${testPost.id}/view`);
      await request(app).post(`/api/posts/${testPost.id}/view`);
      const res = await request(app).post(`/api/posts/${testPost.id}/view`);

      expect(res.status).toBe(200);
      expect(res.body.viewCount).toBe(3);
    });
  });

  describe('GET /api/posts/my/posts', () => {
    beforeEach(async () => {
      await Post.create({
        userId,
        title: 'My Post 1',
        content: 'Content 1',
        category: 'discussion',
        tags: []
      });

      await Post.create({
        userId,
        title: 'My Post 2',
        content: 'Content 2',
        category: 'question',
        tags: []
      });

      // Create post by another user
      await Post.create({
        userId: secondUser.id,
        title: 'Other Post',
        content: 'Content',
        category: 'discussion',
        tags: []
      });
    });

    it('should get only current user posts', async () => {
      const res = await request(app)
        .get('/api/posts/my/posts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.posts.length).toBe(2);
      res.body.posts.forEach(post => {
        expect(post.userId).toBe(userId);
      });
    });

    it('should fail without authentication', async () => {
      const res = await request(app).get('/api/posts/my/posts');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/posts/my/favorites', () => {
    beforeEach(async () => {
      const post1 = await Post.create({
        userId: secondUser.id,
        title: 'Favorite 1',
        content: 'Content',
        category: 'discussion',
        tags: []
      });

      const post2 = await Post.create({
        userId: secondUser.id,
        title: 'Favorite 2',
        content: 'Content',
        category: 'discussion',
        tags: []
      });

      await PostFavorite.create({ userId, postId: post1.id });
      await PostFavorite.create({ userId, postId: post2.id });
    });

    it('should get user favorited posts', async () => {
      const res = await request(app)
        .get('/api/posts/my/favorites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.posts.length).toBe(2);
    });
  });

  describe('GET /api/posts/my/follows', () => {
    beforeEach(async () => {
      const post1 = await Post.create({
        userId: secondUser.id,
        title: 'Followed 1',
        content: 'Content',
        category: 'discussion',
        tags: []
      });

      await PostFollow.create({ userId, postId: post1.id });
    });

    it('should get user followed posts', async () => {
      const res = await request(app)
        .get('/api/posts/my/follows')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.posts.length).toBe(1);
    });
  });
});
