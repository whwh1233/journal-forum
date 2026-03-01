const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');
const { ADMIN_EMAIL } = require('../config/admin');

const adminProtect = async (req, res, next) => {
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

    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在',
      });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用',
      });
    }

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
