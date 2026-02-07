const mongoose = require('mongoose');
const { hashPassword } = require('../utils/password');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, '邮箱是必填项'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码是必填项'],
    minlength: [6, '密码长度至少为6位'],
    select: false // 默认不返回密码字段
  },
  name: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 密码加密中间件
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await hashPassword(this.password);
  next();
});

module.exports = mongoose.model('User', UserSchema);