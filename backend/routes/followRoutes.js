const express = require('express');
const router = express.Router();
const {
  followUser,
  unfollowUser,
  checkFollow,
  getFollowers,
  getFollowing
} = require('../controllers/followControllerLowdb');
const { protect } = require('../middleware/auth');

// 关注用户（需要登录）
router.post('/', protect, followUser);

// 取消关注（需要登录）
router.delete('/:followingId', protect, unfollowUser);

// 检查是否已关注（需要登录）
router.get('/check/:followingId', protect, checkFollow);

// 获取粉丝列表
router.get('/followers/:userId', getFollowers);

// 获取关注列表
router.get('/following/:userId', getFollowing);

module.exports = router;
