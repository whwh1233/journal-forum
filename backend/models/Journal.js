const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Journal = sequelize.define('Journal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: '期刊标题是必填项' }
    }
  },
  issn: {
    type: DataTypes.STRING(9),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'ISSN是必填项' },
      is: { args: /^\d{4}-\d{4}$/, msg: '请输入有效的ISSN格式（如：1234-5678）' }
    }
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: {
        args: [['computer-science', 'biology', 'physics', 'chemistry', 'mathematics', 'medicine']],
        msg: '学科分类必须是预定义的值之一'
      }
    }
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0,
    get() {
      const val = this.getDataValue('rating');
      return val === null ? 0 : parseFloat(val);
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  },
  // 多维评分均值缓存（JSON）
  dimensionAverages: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    field: 'dimension_averages'
  },
  // 旧版 reviews 数组（JSON，兼容迁移数据）
  reviews: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'reviews'
  }
}, {
  tableName: 'journals'
});

module.exports = Journal;