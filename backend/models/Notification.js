const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.CHAR(36),
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  recipientId: {
    type: DataTypes.CHAR(36),
    allowNull: false
  },
  senderId: {
    type: DataTypes.CHAR(36),
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM(
      'comment_reply',
      'post_comment',
      'post_comment_reply',
      'like',
      'new_follower',
      'follow_new_content',
      'journal_new_comment',
      'badge_earned',
      'comment_deleted',
      'submission_status',
      'system'
    ),
    allowNull: false
  },
  entityType: {
    type: DataTypes.ENUM('journal', 'comment', 'post', 'post_comment', 'badge', 'submission'),
    allowNull: true
  },
  entityId: {
    type: DataTypes.CHAR(36),
    allowNull: true
  },
  content: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    {
      fields: ['recipient_id', 'is_read', 'created_at']
    },
    {
      fields: ['recipient_id', 'is_read']
    }
  ]
});

module.exports = Notification;
