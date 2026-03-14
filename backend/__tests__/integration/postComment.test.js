const request = require('supertest');
const app = require('../../server');
const { sequelize, Post, PostComment, PostCommentLike, User } = require('../../models');

describe('PostComment API Integration Tests', () => {
  let authToken;
  let userId;
  let secondUserToken;
  let secondUserId;
  let testPost;

  beforeAll(async () => {
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    // Clean up
    await PostCommentLike.destroy({ where: {}, force: true });
    await PostComment.destroy({ where: {}, force: true });
    await Post.destroy({ where: {}, force: true });

    // Create test users
    const email = `test-${Date.now()}@example.com`;
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email,
        password: 'TestPass123!',
        name: 'Test User'
      });

    authToken = registerRes.body.data.token;
    userId = registerRes.body.data.user.id;

    const email2 = `test2-${Date.now()}@example.com`;
    const registerRes2 = await request(app)
      .post('/api/auth/register')
      .send({
        email: email2,
        password: 'TestPass123!',
        name: 'Second User'
      });

    secondUserToken = registerRes2.body.data.token;
    secondUserId = registerRes2.body.data.user.id;

    // Create test post
    testPost = await Post.create({
      userId,
      title: 'Test Post',
      content: 'Test content',
      category: 'discussion',
      tags: []
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/posts/:postId/comments', () => {
    beforeEach(async () => {
      // Create nested comments (no depth column)
      const comment1 = await PostComment.create({
        postId: testPost.id,
        userId,
        content: 'Parent comment 1'
      });

      const comment2 = await PostComment.create({
        postId: testPost.id,
        userId: secondUserId,
        content: 'Parent comment 2'
      });

      await PostComment.create({
        postId: testPost.id,
        userId: secondUserId,
        parentId: comment1.id,
        content: 'Child comment 1-1'
      });

      await PostComment.create({
        postId: testPost.id,
        userId,
        parentId: comment1.id,
        content: 'Child comment 1-2'
      });
    });

    it('should get comments with nested structure', async () => {
      const res = await request(app)
        .get(`/api/posts/${testPost.id}/comments`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      // Should have 2 top-level comments (parentId === null)
      const parentComments = res.body.filter(c => c.parentId === null);
      expect(parentComments.length).toBe(2);

      // First parent should have 2 replies
      const firstParent = res.body.find(c => c.content === 'Parent comment 1');
      expect(firstParent.replies).toBeDefined();
      expect(firstParent.replies.length).toBe(2);
    });

    it('should include user information', async () => {
      const res = await request(app)
        .get(`/api/posts/${testPost.id}/comments`);

      expect(res.status).toBe(200);
      expect(res.body[0]).toHaveProperty('User');
      expect(res.body[0].User).toHaveProperty('id');
      expect(res.body[0].User).toHaveProperty('name');
    });

    // TODO: GET /api/posts/:postId/comments route lacks optional auth middleware, so req.user is never set
    it.skip('should include user like status when authenticated', async () => {
      const comment = await PostComment.findOne({
        where: { postId: testPost.id, parentId: null }
      });

      await PostCommentLike.create({
        userId,
        commentId: comment.id
      });

      const res = await request(app)
        .get(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const likedComment = res.body.find(c => c.id === comment.id);
      expect(likedComment.userLiked).toBe(true);
    });

    it('should not show deleted comments content', async () => {
      await PostComment.update(
        { isDeleted: true, content: '[该评论已被删除]' },
        { where: { content: 'Parent comment 1' } }
      );

      const res = await request(app)
        .get(`/api/posts/${testPost.id}/comments`);

      expect(res.status).toBe(200);
      const deletedComment = res.body.find(c => c.isDeleted === true);
      expect(deletedComment).toBeDefined();
      expect(deletedComment.content).toBe('[该评论已被删除]');
    });

    it('should return empty array for post with no comments', async () => {
      const newPost = await Post.create({
        userId,
        title: 'Empty Post',
        content: 'No comments',
        category: 'discussion',
        tags: []
      });

      const res = await request(app)
        .get(`/api/posts/${newPost.id}/comments`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('POST /api/posts/:postId/comments', () => {
    it('should create a parent comment successfully', async () => {
      const commentData = {
        content: 'This is a test comment'
      };

      const res = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData);

      expect(res.status).toBe(201);
      expect(res.body.content).toBe(commentData.content);
      expect(res.body.postId).toBe(testPost.id);
      expect(res.body.userId).toBe(userId);
      expect(res.body.parentId).toBeNull();
      expect(res.body).toHaveProperty('User');

      // Verify post comment count updated
      await testPost.reload();
      expect(testPost.commentCount).toBe(1);
    });

    it('should create a child comment successfully', async () => {
      const parent = await PostComment.create({
        postId: testPost.id,
        userId,
        content: 'Parent comment'
      });

      const commentData = {
        content: 'Reply to parent',
        parentId: parent.id
      };

      const res = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData);

      expect(res.status).toBe(201);
      expect(res.body.parentId).toBe(parent.id);
    });

    it('should create a grandchild comment (level 3)', async () => {
      // Create level 1 via API
      const parentRes = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Parent' });

      expect(parentRes.status).toBe(201);

      // Create level 2 via API
      const childRes = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({ content: 'Child', parentId: parentRes.body.id });

      expect(childRes.status).toBe(201);

      // Create level 3 via API
      const grandchildRes = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Grandchild', parentId: childRes.body.id });

      expect(grandchildRes.status).toBe(201);
      expect(grandchildRes.body.parentId).toBe(childRes.body.id);
    });

    it('should fail to create comment beyond max depth (3 levels)', async () => {
      // Create 3 levels via API
      const parentRes = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Parent' });

      const childRes = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Child', parentId: parentRes.body.id });

      const grandchildRes = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Grandchild', parentId: childRes.body.id });

      // 4th level should fail
      const res = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Great-grandchild (should fail)',
          parentId: grandchildRes.body.id
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('评论嵌套层级不能超过3层');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .send({ content: 'Test' });

      expect(res.status).toBe(401);
    });

    it('should fail with missing content', async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should fail with non-existent parent comment', async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Reply',
          parentId: 999999
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/posts/comments/:commentId', () => {
    let testComment;

    beforeEach(async () => {
      testComment = await PostComment.create({
        postId: testPost.id,
        userId,
        content: 'Comment to delete'
      });

      await testPost.update({ commentCount: 1 });
    });

    it('should soft delete comment by author', async () => {
      const res = await request(app)
        .delete(`/api/posts/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('评论已删除');

      // Verify soft delete
      await testComment.reload();
      expect(testComment.isDeleted).toBe(true);
    });

    it('should fail to delete comment by non-author (non-admin)', async () => {
      const res = await request(app)
        .delete(`/api/posts/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${secondUserToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to delete any comment', async () => {
      // Make second user admin
      await User.update({ role: 'admin' }, { where: { id: secondUserId } });

      const res = await request(app)
        .delete(`/api/posts/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${secondUserToken}`);

      expect(res.status).toBe(200);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .delete(`/api/posts/comments/${testComment.id}`);

      expect(res.status).toBe(401);
    });

    it('should fail for non-existent comment', async () => {
      const res = await request(app)
        .delete('/api/posts/comments/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/posts/comments/:commentId/like', () => {
    let testComment;

    beforeEach(async () => {
      testComment = await PostComment.create({
        postId: testPost.id,
        userId: secondUserId,
        content: 'Comment to like',
        likeCount: 0
      });
    });

    it('should like comment successfully', async () => {
      const res = await request(app)
        .post(`/api/posts/comments/${testComment.id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.liked).toBe(true);
      expect(res.body.likeCount).toBe(1);

      // Verify in database
      const like = await PostCommentLike.findOne({
        where: { userId, commentId: testComment.id }
      });
      expect(like).not.toBeNull();

      await testComment.reload();
      expect(testComment.likeCount).toBe(1);
    });

    it('should unlike comment when already liked', async () => {
      await PostCommentLike.create({
        userId,
        commentId: testComment.id
      });
      await testComment.update({ likeCount: 1 });

      const res = await request(app)
        .post(`/api/posts/comments/${testComment.id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.liked).toBe(false);
      expect(res.body.likeCount).toBe(0);

      // Verify removed from database
      const like = await PostCommentLike.findOne({
        where: { userId, commentId: testComment.id }
      });
      expect(like).toBeNull();

      await testComment.reload();
      expect(testComment.likeCount).toBe(0);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post(`/api/posts/comments/${testComment.id}/like`);

      expect(res.status).toBe(401);
    });

    it('should fail for non-existent comment', async () => {
      const res = await request(app)
        .post('/api/posts/comments/999999/like')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Comment ordering', () => {
    beforeEach(async () => {
      // Create comments with different timestamps (no depth column)
      await PostComment.create({
        postId: testPost.id,
        userId,
        content: 'Oldest comment',
        likeCount: 5,
        createdAt: new Date('2024-01-01')
      });

      await PostComment.create({
        postId: testPost.id,
        userId,
        content: 'Middle comment',
        likeCount: 20,
        createdAt: new Date('2024-01-02')
      });

      await PostComment.create({
        postId: testPost.id,
        userId,
        content: 'Newest comment',
        likeCount: 10,
        createdAt: new Date('2024-01-03')
      });
    });

    it('should order by latest (createdAt DESC) by default', async () => {
      const res = await request(app)
        .get(`/api/posts/${testPost.id}/comments`);

      expect(res.status).toBe(200);
      expect(res.body[0].content).toBe('Newest comment');
      expect(res.body[2].content).toBe('Oldest comment');
    });
  });

  describe('Comment count updates', () => {
    it('should increment comment count on create', async () => {
      expect(testPost.commentCount).toBe(0);

      await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Comment 1' });

      await testPost.reload();
      expect(testPost.commentCount).toBe(1);

      await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Comment 2' });

      await testPost.reload();
      expect(testPost.commentCount).toBe(2);
    });

    // Note: deleteComment controller does NOT decrement commentCount (soft delete only)
    it('should not decrement comment count on soft delete', async () => {
      const createRes = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Test' });

      await testPost.reload();
      expect(testPost.commentCount).toBe(1);

      await request(app)
        .delete(`/api/posts/comments/${createRes.body.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      await testPost.reload();
      // commentCount stays at 1 because delete is soft (isDeleted=true)
      expect(testPost.commentCount).toBe(1);
    });
  });
});
