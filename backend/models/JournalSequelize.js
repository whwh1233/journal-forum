const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Journal = sequelize.define('Journal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '期刊标题是必填项'
      }
    }
  },
  issn: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'ISSN是必填项'
      },
      is: {
        args: /^\d{4}-\d{4}$/,
        msg: '请输入有效的ISSN格式（如：1234-5678）'
      }
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: {
        args: [['computer-science', 'biology', 'physics', 'chemistry', 'mathematics', 'medicine']],
        msg: '学科分类必须是预定义的值之一'
      }
    }
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: '评分不能小于0'
      },
      max: {
        args: [5],
        msg: '评分不能大于5'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '期刊描述是必填项'
      }
    }
  },
  reviews: {
    type: DataTypes.JSON, // 使用JSON字段存储评论数组
    defaultValue: [],
    get() {
      const rawValue = this.getDataValue('reviews');
      return rawValue || [];
    }
  }
}, {
  tableName: 'journals',
  timestamps: true,
  // 虚拟字段：计算平均评分
  hooks: {
    beforeValidate: (journal) => {
      if (journal.reviews && journal.reviews.length > 0) {
        const total = journal.reviews.reduce((sum, review) => sum + review.rating, 0);
        journal.rating = Math.round((total / journal.reviews.length) * 10) / 10;
      }
    }
  }
});

// 实例方法：添加评论
Journal.prototype.addReview = function(author, rating, content) {
  const newReview = {
    author,
    rating,
    content,
    createdAt: new Date().toISOString()
  };

  this.reviews = [...this.reviews, newReview];

  // 重新计算平均评分
  const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating = Math.round((total / this.reviews.length) * 10) / 10;

  return this.save();
};

module.exports = Journal;
