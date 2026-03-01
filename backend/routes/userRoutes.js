const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  updatePassword,
  getUserComments,
  getUserFavorites,
  getUserActivity
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// 获取用户资料（公开）
router.get('/:userId', getUserProfile);

// 更新用户资料（需要登录，仅本人）
router.put('/profile', protect, updateUserProfile);

// 上传头像（需要登录）
router.post('/avatar', protect, ...uploadAvatar);

// 修改密码（需要登录）
router.put('/password', protect, updatePassword);

// 获取我的评论（需要登录）
router.get('/me/comments', protect, getUserComments);

// 获取我的收藏（需要登录）
router.get('/me/favorites', protect, getUserFavorites);

// 获取活动统计（需要登录）
router.get('/me/activity', protect, getUserActivity);

module.exports = router;
