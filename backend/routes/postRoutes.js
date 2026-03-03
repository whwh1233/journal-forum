const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const postController = require('../controllers/postController');

// 用户相关（必须在 /:id 之前）
router.get('/my/posts', protect, postController.getMyPosts);
router.get('/my/favorites', protect, postController.getMyFavorites);
router.get('/my/follows', protect, postController.getMyFollows);

// 公开路由
router.get('/', postController.getPosts);
router.get('/:id', postController.getPostById);

// 需要认证的路由
router.post('/', protect, postController.createPost);
router.put('/:id', protect, postController.updatePost);
router.delete('/:id', protect, postController.deletePost);

// 互动功能
router.post('/:id/like', protect, postController.toggleLike);
router.post('/:id/favorite', protect, postController.toggleFavorite);
router.post('/:id/follow', protect, postController.toggleFollow);
router.post('/:id/report', protect, postController.reportPost);
router.post('/:id/view', postController.incrementViewCount);

module.exports = router;
