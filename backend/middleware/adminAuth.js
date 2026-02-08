const { verifyToken } = require('../utils/jwt');
const { getDB } = require('../config/databaseLowdb');
const { ADMIN_EMAIL } = require('../config/admin');

// 管理员权限验证中间件
const adminProtect = async (req, res, next) => {
  try {
    // 从请求头获取token
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

    // 验证token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌',
      });
    }

    // 获取用户信息
    const db = getDB();
    const user = db.data.users.find(u => u.id === decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在',
      });
    }

    // 检查用户是否被禁用
    if (user.status === 'disabled') {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用',
      });
    }

    // 检查是否是管理员
    if (user.role !== 'admin' && user.email !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限',
      });
    }

    req.user = { id: decoded.id, email: user.email, role: user.role || 'user' };
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '认证过程中发生错误',
    });
  }
};

module.exports = { adminProtect };
