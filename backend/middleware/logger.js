const { v4: uuidv4 } = require('uuid');

// 敏感字段列表（不区分大小写匹配）
const SENSITIVE_FIELDS = ['password', 'token', 'authorization', 'secret', 'credential'];

/**
 * 递归脱敏敏感字段
 */
const maskSensitiveData = (obj, depth = 0) => {
  if (depth > 5 || !obj || typeof obj !== 'object') return obj;

  const masked = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key of Object.keys(masked)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some(f => lowerKey.includes(f))) {
      masked[key] = '***MASKED***';
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key], depth + 1);
    }
  }

  return masked;
};

/**
 * 截断大对象，避免日志过长
 */
const truncate = (data, maxLength = 2000) => {
  if (data === undefined || data === null) return data;

  try {
    const str = JSON.stringify(data);
    if (str.length > maxLength) {
      return `${str.substring(0, maxLength)}... [truncated, total: ${str.length} chars]`;
    }
    return data;
  } catch {
    return '[Unable to stringify]';
  }
};

/**
 * 格式化日志输出
 */
const formatLog = (level, entry) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;

  // 生产环境输出单行 JSON，开发环境格式化
  if (process.env.NODE_ENV === 'production') {
    return `${prefix} ${JSON.stringify(entry)}`;
  }
  return `${prefix}\n${JSON.stringify(entry, null, 2)}`;
};

/**
 * 请求日志中间件
 * 记录：requestId、入参、出参、用户ID、状态码、耗时
 */
const requestLogger = (req, res, next) => {
  // 生成请求唯一标识
  const requestId = uuidv4().slice(0, 8);
  const startTime = Date.now();

  // 挂载到 req 上，供后续中间件和控制器使用
  req.requestId = requestId;

  // 捕获响应体
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    res.responseBody = body;
    return originalJson(body);
  };

  // 响应完成后记录日志
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userId = req.user?.id || 'anonymous';
    const statusCode = res.statusCode;

    // 构建日志条目
    const logEntry = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      userId,
      statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent']?.substring(0, 100),
    };

    // 入参（脱敏处理）
    if (Object.keys(req.params).length > 0) {
      logEntry.params = req.params;
    }
    if (Object.keys(req.query).length > 0) {
      logEntry.query = maskSensitiveData(req.query);
    }
    if (req.body && Object.keys(req.body).length > 0) {
      logEntry.body = truncate(maskSensitiveData(req.body));
    }

    // 出参（错误时或 debug 模式下记录）
    if (statusCode >= 400 && res.responseBody) {
      logEntry.response = truncate(res.responseBody);
    }

    // 根据状态码使用不同日志级别
    if (statusCode >= 500) {
      console.error(formatLog('ERROR', logEntry));
    } else if (statusCode >= 400) {
      console.warn(formatLog('WARN', logEntry));
    } else if (process.env.LOG_LEVEL === 'debug' || duration > 1000) {
      // debug 模式或慢请求（>1s）才记录成功请求
      console.log(formatLog('INFO', logEntry));
    } else {
      // 生产环境简化日志：仅记录关键信息
      console.log(`[${new Date().toISOString()}] [INFO] ${req.method} ${req.originalUrl} ${statusCode} ${duration}ms userId=${userId}`);
    }
  });

  next();
};

/**
 * 详细错误日志记录（供 errorHandler 调用）
 */
const logError = (err, req) => {
  const errorLog = {
    requestId: req.requestId || 'unknown',
    timestamp: new Date().toISOString(),
    userId: req.user?.id || 'anonymous',
    method: req.method,
    url: req.originalUrl,
    error: {
      message: err.message,
      name: err.name,
      code: err.code,
      stack: err.stack,
    }
  };

  // Sequelize 验证错误详情
  if (err.errors && Array.isArray(err.errors)) {
    errorLog.error.validationErrors = err.errors.map(e => ({
      field: e.path,
      type: e.type,
      message: e.message
    }));
  }

  // SQL 错误详情
  if (err.sql) {
    errorLog.error.sql = err.sql.substring(0, 500);
  }

  // 原始错误
  if (err.original) {
    errorLog.error.original = {
      message: err.original.message,
      code: err.original.code,
      errno: err.original.errno
    };
  }

  console.error(formatLog('ERROR_DETAIL', errorLog));
};

module.exports = {
  requestLogger,
  logError,
  maskSensitiveData,
  truncate
};
