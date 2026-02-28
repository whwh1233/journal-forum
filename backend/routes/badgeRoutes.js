const express = require('express');
const router = express.Router();
const {
  getAllBadges,
  getUserBadges,
  getMyBadges,
  setPinnedBadges,
  markBadgesAsRead,
  adminGetAllBadges,
  createBadge,
  updateBadge,
  deleteBadge,
  grantBadgeToUser,
  revokeBadgeFromUser,
  getBadgeStats,
  batchGrantBadge
} = require('../controllers/badgeControllerLowdb');
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');

// 公开接口
router.get('/', getAllBadges);
router.get('/user/:userId', getUserBadges);

// 用户接口（需登录）
router.get('/my', protect, getMyBadges);
router.put('/my/pinned', protect, setPinnedBadges);
router.post('/my/read', protect, markBadgesAsRead);

// 管理员接口
router.get('/admin/all', adminProtect, adminGetAllBadges);
router.post('/admin', adminProtect, createBadge);
router.put('/admin/:id', adminProtect, updateBadge);
router.delete('/admin/:id', adminProtect, deleteBadge);
router.post('/admin/:id/grant', adminProtect, grantBadgeToUser);
router.post('/admin/:id/revoke', adminProtect, revokeBadgeFromUser);
router.get('/admin/stats', adminProtect, getBadgeStats);
router.post('/admin/batch-grant', adminProtect, batchGrantBadge);

module.exports = router;
