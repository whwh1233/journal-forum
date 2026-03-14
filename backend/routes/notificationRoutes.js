const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');

// All routes require authentication
router.use(protect);

// Static routes before parameterized routes
router.get('/unread-count', getUnreadCount);
router.post('/read-all', markAllAsRead);

router.get('/', getNotifications);
router.get('/:id', getNotificationById);
router.post('/:id/read', markAsRead);

module.exports = router;
