const { Op } = require('sequelize');
const { Notification, User } = require('../models');

// GET /api/notifications?page=1&limit=20&type=comment_reply
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { recipientId: req.user.id };
    if (type) {
      where.type = type;
    }

    const { count, rows } = await Notification.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'name', 'avatar']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        notifications: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ success: false, message: '获取通知列表失败' });
  }
};

// GET /api/notifications/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { recipientId: req.user.id, isRead: false }
    });
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    res.status(500).json({ success: false, message: '获取未读数失败' });
  }
};

// GET /api/notifications/:id
const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, recipientId: req.user.id },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'name', 'avatar']
      }]
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: '通知不存在' });
    }

    // Auto-mark as read
    if (!notification.isRead) {
      await notification.update({ isRead: true, readAt: new Date() });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('getNotificationById error:', error);
    res.status(500).json({ success: false, message: '获取通知详情失败' });
  }
};

// POST /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, recipientId: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: '通知不存在' });
    }

    if (!notification.isRead) {
      await notification.update({ isRead: true, readAt: new Date() });
    }

    res.json({ success: true, message: '已标记为已读' });
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({ success: false, message: '标记已读失败' });
  }
};

// POST /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { recipientId: req.user.id, isRead: false } }
    );

    res.json({ success: true, message: '已全部标记为已读' });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    res.status(500).json({ success: false, message: '全部标记已读失败' });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAllAsRead
};
