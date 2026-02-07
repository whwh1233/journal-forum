const { users } = require('../utils/memoryStore');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const crypto = require('crypto');

// 注册用户
const registerUser = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码是必填项'
      });
    }

    // 检查用户是否已存在
    if (users.has(email)) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被注册'
      });
    }

    // 创建新用户
    const userId = crypto.randomUUID();
    const user = {
      id: userId,
      email,
      password, // 注意：在真实应用中应该加密
      name,
      createdAt: new Date().toISOString()
    };

    users.set(email, user);

    // 生成JWT token
    const token = generateToken(userId);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// 用户登录
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码是必填项'
      });
    }

    // 查找用户
    const user = users.get(email);
    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }

    // 生成JWT token
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取当前用户信息
const getCurrentUser = async (req, res, next) => {
  try {
    // 在内存存储中，我们无法通过ID查找用户，所以返回基本信息
    // 在真实应用中，这里会查询数据库
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: 'demo@example.com',
          name: 'Demo User'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser, getCurrentUser };