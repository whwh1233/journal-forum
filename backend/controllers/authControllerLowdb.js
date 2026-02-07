const { getDB } = require('../config/databaseLowdb');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');

// 注册用户
const registerUser = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const db = getDB();

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码是必填项'
      });
    }

    // 检查用户是否已存在
    const existingUser = db.data.users.find(u => u.email === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被注册'
      });
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建新用户
    const newUser = {
      id: db.data.users.length + 1, // 简单的自增ID
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      createdAt: new Date().toISOString()
    };

    db.data.users.push(newUser);

    // 保存到文件
    await db.write();

    // 生成JWT token
    const token = generateToken(newUser.id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name
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
    const db = getDB();

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码是必填项'
      });
    }

    // 查找用户
    const user = db.data.users.find(u => u.email === email.toLowerCase());

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
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
    const db = getDB();
    const user = db.data.users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户未找到'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser, getCurrentUser };
