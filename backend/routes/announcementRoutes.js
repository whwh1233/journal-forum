const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getBanners,
  getAnnouncements,
  getUnreadCount,
  getAnnouncementById,
  markAsRead,
  markAllAsRead
} = require('../controllers/announcementController');

// Public
router.get('/banners', getBanners);

// Authenticated user — static routes BEFORE parameterized
router.get('/', protect, getAnnouncements);
router.get('/unread-count', protect, getUnreadCount);
router.post('/read-all', protect, markAllAsRead);
router.get('/:id', protect, getAnnouncementById);
router.post('/:id/read', protect, markAsRead);

module.exports = router;
