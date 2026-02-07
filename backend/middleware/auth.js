const { verifyToken } = require('../utils/jwt');

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

    req.user = { id: decoded.id };
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '认证过程中发生错误',
    });
  }
};

module.exports = { protect };