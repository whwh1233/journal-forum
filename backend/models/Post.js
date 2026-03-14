const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    field: 'user_id'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: '帖子标题是必填项' },
      len: { args: [1, 200], msg: '标题长度必须在1-200字符之间' }
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: '帖子内容是必填项' }
    }
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'category_id'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  journalId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'journal_id'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'view_count'
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'like_count'
  },
  commentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'comment_count'
  },
  favoriteCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'favorite_count'
  },
  followCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'follow_count'
  },
  hotScore: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'hot_score',
    get() {
      const val = this.getDataValue('hotScore');
      return val === null ? 0 : parseFloat(val);
    }
  },
  allTimeScore: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'all_time_score',
    get() {
      const val = this.getDataValue('allTimeScore');
      return val === null ? 0 : parseFloat(val);
    }
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_pinned'
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_deleted'
  },
  status: {
    type: DataTypes.ENUM('published', 'draft', 'reported'),
    defaultValue: 'published'
  }
}, {
  tableName: 'online_posts',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['journal_id']
    },
    {
      fields: ['category']
    },
    {
      fields: ['hot_score']
    },
    {
      fields: ['all_time_score']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['category_id']
    }
  ]
});

module.exports = Post;
