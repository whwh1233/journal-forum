const express = require('express');
const router = express.Router();
const {
  addFavorite,
  removeFavorite,
  checkFavorite,
  batchCheckFavorites,
  getUserFavorites
} = require('../controllers/favoriteController');
const { protect } = require('../middleware/auth');

// 添加收藏（需要登录）
router.post('/', protect, addFavorite);

// 批量检查收藏状态（需要登录）
router.post('/check/batch', protect, batchCheckFavorites);

// 取消收藏（需要登录）
router.delete('/:journalId', protect, removeFavorite);

// 检查是否已收藏（需要登录）
router.get('/check/:journalId', protect, checkFavorite);

// 获取用户的收藏列表
router.get('/user/:userId', getUserFavorites);

module.exports = router;
