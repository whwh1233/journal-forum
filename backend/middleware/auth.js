const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (token && token.startsWith('Bearer ')) {
      token = token.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌',
      });
    }

    // 从 MySQL 查询用户
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在',
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      success: false,
      message: '认证过程中发生错误',
    });
  }
};

// 可选认证：有 token 就解析用户，没有则跳过（不拦截）
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer ')) {
      token = token.split(' ')[1];
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await User.findByPk(decoded.id);
        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status
          };
        }
      }
    }
  } catch (error) {
    // 忽略认证错误，继续处理请求
  }
  next();
};

module.exports = { protect, optionalAuth };