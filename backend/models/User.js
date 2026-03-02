const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: '请输入有效的邮箱地址' },
      notEmpty: { msg: '邮箱是必填项' }
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim());
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: '密码是必填项' },
      len: { args: [6, 255], msg: '密码长度至少为6位' }
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: ''
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: ''
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: ''
  },
  institution: {
    type: DataTypes.STRING(200),
    allowNull: true,
    defaultValue: ''
  },
  website: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: ''
  },
  pinnedBadges: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    field: 'pinned_badges'
  },
  role: {
    type: DataTypes.ENUM('user', 'admin', 'superadmin'),
    defaultValue: 'user'
  },
  status: {
    type: DataTypes.ENUM('active', 'disabled'),
    defaultValue: 'active'
  }
}, {
  tableName: 'users',
  defaultScope: {
    attributes: { exclude: ['password'] }
  },
  scopes: {
    withPassword: {
      attributes: {} // 返回所有字段含 password
    }
  }
});

module.exports = User;