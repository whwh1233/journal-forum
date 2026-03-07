const { logError } = require('./logger');

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  // 记录详细错误日志
  logError(err, req);

  // 设置错误状态码（验证错误使用 400）
  let statusCode = err.statusCode || 500;
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
  }
  const requestId = req.requestId || 'unknown';

  // 根据错误类型生成用户友好消息
  let message = err.message || '服务器内部错误';

  // Sequelize 验证错误
  if (err.name === 'SequelizeValidationError') {
    message = err.errors?.map(e => e.message).join('; ') || '数据验证失败';
  }

  // Sequelize 唯一约束错误
  if (err.name === 'SequelizeUniqueConstraintError') {
    message = '数据已存在，请检查是否重复提交';
  }

  // Sequelize 外键约束错误
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    message = '关联数据不存在或无法删除';
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    message = '无效的认证令牌';
  }
  if (err.name === 'TokenExpiredError') {
    message = '认证令牌已过期，请重新登录';
  }

  res.status(statusCode).json({
    success: false,
    message,
    requestId, // 返回给前端，方便排查问题
    ...(process.env.NODE_ENV === 'development' && {
      error: {
        name: err.name,
        stack: err.stack
      }
    }),
  });
};

// 404 处理中间件
const notFound = (req, res, next) => {
  const error = new Error(`路由未找到 - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };