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

    authToken = registerRes.body.token;
    userId = registerRes.body.user.id;

    const email2 = `test2-${Date.now()}@example.com`;
    const registerRes2 = await request(app)
      .post('/api/auth/register')
      .send({
        email: email2,
        password: 'TestPass123!',
        name: 'Second User'
      });

    secondUserToken = registerRes2.body.token;
    secondUserId = registerRes2.body.user.id;

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
      // Create nested comments
      const comment1 = await PostComment.create({
        postId: testPost.id,
        userId,
        content: 'Parent comment 1',
        depth: 0
      });

      const comment2 = await PostComment.create({
        postId: testPost.id,
        userId: secondUserId,
        content: 'Parent comment 2',
        depth: 0
      });

      await PostComment.create({
        postId: testPost.id,
        userId: secondUserId,
        parentId: comment1.id,
        content: 'Child comment 1-1',
        depth: 1
      });

      await PostComment.create({
        postId: testPost.id,
        userId,
        parentId: comment1.id,
        content: 'Child comment 1-2',
        depth: 1
      });
    });

    it('should get comments with nested structure', async () => {
      const res = await request(app)
        .get(`/api/posts/${testPost.id}/comments`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      // Should have 2 parent comments
      const parentComments = res.body.filter(c => c.depth === 0);
      expect(parentComments.length).toBe(2);

      // First parent should have 2 replies
      const firstParent = res.body.find(c => c.content === 'Parent comment 1');
      expect(firstParent.replies).toBeDefined();
      expect(firstParent.replies.length).toBe(2);
    });

    it('should include author information', async () => {
      const res = await request(app)
        .get(`/api/posts/${testPost.id}/comments`);

      expect(res.status).toBe(200);
      expect(res.body[0]).toHaveProperty('author');
      expect(res.body[0].author).toHaveProperty('id');
      expect(res.body[0].author).toHaveProperty('name');
    });

    it('should include user like status when authenticated', async () => {
      const comment = await PostComment.findOne({
        where: { postId: testPost.id, depth: 0 }
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
        { isDeleted: true },
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
      expect(res.body.depth).toBe(0);
      expect(res.body.parentId).toBeNull();
      expect(res.body).toHaveProperty('author');

      // Verify post comment count updated
      await testPost.reload();
      expect(testPost.commentCount).toBe(1);
    });

    it('should create a child comment successfully', async () => {
      const parent = await PostComment.create({
        postId: testPost.id,
        userId,
        content: 'Parent comment',
        depth: 0
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
      expect(res.body.depth).toBe(1);
    });

    it('should create a grandchild comment (depth 2)', async () => {
      const parent = await PostComment.create({
        postId: testPost.id,
        userId,
        content: 'Parent',
        depth: 0
      });

      const child = await PostComment.create({
        postId: testPost.id,
        userId: secondUserId,
        parentId: parent.id,
        content: 'Child',
        depth: 1
      });

      const commentData = {
        content: 'Grandchild',
        parentId: child.id
      };

      const res = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData);

      expect(res.status).toBe(201);
      expect(res.body.parentId).toBe(child.id);
      expect(res.body.depth).toBe(2);
    });

    it('should fail to create comment beyond max depth (3 levels)', async () => {
      const parent = await PostComment.create({
        postId: testPost.id,
        userId,
        content: 'Parent',
        depth: 0
      });

      const child = await PostComment.create({
        postId: testPost.id,
        userId,
        parentId: parent.id,
        content: 'Child',
        depth: 1
      });

      const grandchild = await PostComment.create({
        postId: testPost.id,
        userId,
        parentId: child.id,
        content: 'Grandchild',
        depth: 2
      });

      const commentData = {
        content: 'Great-grandchild (should fail)',
        parentId: grandchild.id
      };

      const res = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('评论嵌套层级不能超过3层');
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
        content: 'Comment to delete',
        depth: 0
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

      // Verify comment count decremented
      await testPost.reload();
      expect(testPost.commentCount).toBe(0);
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

    it('should not delete already deleted comment', async () => {
      await testComment.update({ isDeleted: true });

      const res = await request(app)
        .delete(`/api/posts/comments/${testComment.id}`)
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
        depth: 0,
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

    it('should not like deleted comment', async () => {
      await testComment.update({ isDeleted: true });

      const res = await request(app)
        .post(`/api/posts/comments/${testComment.id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Comment ordering and pagination', () => {
    beforeEach(async () => {
      // Create comments with different timestamps
      await PostComment.create({
        postId: testPost.id,
        userId,
        content: 'Oldest comment',
        depth: 0,
        likeCount: 5,
        createdAt: new Date('2024-01-01')
      });

      await PostComment.create({
        postId: testPost.id,
        userId,
        content: 'Most liked comment',
        depth: 0,
        likeCount: 20,
        createdAt: new Date('2024-01-02')
      });

      await PostComment.create({
        postId: testPost.id,
        userId,
        content: 'Newest comment',
        depth: 0,
        likeCount: 10,
        createdAt: new Date('2024-01-03')
      });
    });

    it('should order by latest by default', async () => {
      const res = await request(app)
        .get(`/api/posts/${testPost.id}/comments`);

      expect(res.status).toBe(200);
      expect(res.body[0].content).toBe('Newest comment');
      expect(res.body[2].content).toBe('Oldest comment');
    });

    it('should order by oldest when specified', async () => {
      const res = await request(app)
        .get(`/api/posts/${testPost.id}/comments`)
        .query({ sortBy: 'oldest' });

      expect(res.status).toBe(200);
      expect(res.body[0].content).toBe('Oldest comment');
      expect(res.body[2].content).toBe('Newest comment');
    });

    it('should order by most liked when specified', async () => {
      const res = await request(app)
        .get(`/api/posts/${testPost.id}/comments`)
        .query({ sortBy: 'likes' });

      expect(res.status).toBe(200);
      expect(res.body[0].content).toBe('Most liked comment');
      expect(res.body[0].likeCount).toBe(20);
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

    it('should decrement comment count on delete', async () => {
      const comment = await PostComment.create({
        postId: testPost.id,
        userId,
        content: 'Test',
        depth: 0
      });

      await testPost.update({ commentCount: 1 });

      await request(app)
        .delete(`/api/posts/comments/${comment.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      await testPost.reload();
      expect(testPost.commentCount).toBe(0);
    });
  });
});
