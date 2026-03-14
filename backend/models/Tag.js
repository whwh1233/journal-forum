const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tag = sequelize.define('Tag', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      len: { args: [1, 10], msg: '标签长度不能超过10个字符' }
    }
  },
  normalizedName: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    field: 'normalized_name'
  },
  status: {
    type: DataTypes.ENUM('approved', 'pending'),
    defaultValue: 'pending'
  },
  isOfficial: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_official'
  },
  createdBy: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    field: 'created_by'
  },
  postCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'post_count'
  }
}, {
  tableName: 'online_tags',
  indexes: [
    { fields: ['status'] },
    { fields: ['created_by'] }
  ]
});

module.exports = Tag;
