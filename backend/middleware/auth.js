const { verifyToken } = require('../utils/jwt');
const { getDB } = require('../config/databaseLowdb');

const protect = async (req, res, next) => {
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

    // 从数据库查询完整的用户信息
    const db = getDB();
    const user = db.data.users.find(u => u.id === decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在',
      });
    }

    // 将完整的用户信息附加到请求对象
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

module.exports = { protect };