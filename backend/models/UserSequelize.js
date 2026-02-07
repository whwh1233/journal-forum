const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { hashPassword } = require('../utils/password');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: '请输入有效的邮箱地址'
      },
      notEmpty: {
        msg: '邮箱是必填项'
      }
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim());
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '密码是必填项'
      },
      len: {
        args: [6, 255],
        msg: '密码长度至少为6位'
      }
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  defaultScope: {
    attributes: { exclude: ['password'] } // 默认不返回密码字段
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password'] } // 需要密码时使用此scope
    }
  },
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await hashPassword(user.password);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await hashPassword(user.password);
      }
    }
  }
});

module.exports = User;
