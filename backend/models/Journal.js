const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  author: {
    type: String,
    required: [true, '评论作者是必填项'],
    trim: true
  },
  rating: {
    type: Number,
    required: [true, '评分是必填项'],
    min: [1, '评分最低为1分'],
    max: [5, '评分最高为5分']
  },
  content: {
    type: String,
    required: [true, '评论内容是必填项'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const JournalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '期刊标题是必填项'],
    trim: true
  },
  issn: {
    type: String,
    required: [true, 'ISSN是必填项'],
    unique: true,
    trim: true,
    match: [/^\d{4}-\d{4}$/, '请输入有效的ISSN格式（如：1234-5678）']
  },
  category: {
    type: String,
    required: [true, '学科分类是必填项'],
    enum: {
      values: ['computer-science', 'biology', 'physics', 'chemistry', 'mathematics', 'medicine'],
      message: '学科分类必须是预定义的值之一'
    }
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, '评分不能小于0'],
    max: [5, '评分不能大于5']
  },
  description: {
    type: String,
    required: [true, '期刊描述是必填项']
  },
  reviews: [ReviewSchema]
}, {
  timestamps: true
});

// 虚拟字段：计算平均评分
JournalSchema.virtual('averageRating').get(function() {
  if (this.reviews.length === 0) return 0;
  const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / this.reviews.length) * 10) / 10;
});

// 确保虚拟字段在JSON输出中包含
JournalSchema.set('toJSON', { virtuals: true });
JournalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Journal', JournalSchema);