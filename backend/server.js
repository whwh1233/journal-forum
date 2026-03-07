const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 导入路由
const authRoutes = require('./routes/authRoutes');
const journalRoutes = require('./routes/journalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const commentRoutes = require('./routes/commentRoutes');
const userRoutes = require('./routes/userRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const followRoutes = require('./routes/followRoutes');
const badgeRoutes = require('./routes/badgeRoutes');
const databaseRoutes = require('./routes/databaseRoutes');
const postRoutes = require('./routes/postRoutes');
const submissionRoutes = require('./routes/submissionRoutes');

// 导入中间件
const { errorHandler, notFound } = require('./middleware/error');

// 导入数据库连接 (MySQL + Sequelize)
const { connectDB } = require('./config/database');
const { syncDatabase } = require('./models');

// 初始化Express应用
const app = express();

// 设置端口
const PORT = process.env.PORT || 3001;

// CORS配置 - 必须在helmet之前
const corsOptions = {
  origin: function (origin, callback) {
    // 开发/测试环境：允许所有localhost
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      // 允许没有origin的请求（如移动应用、桌面应用）和localhost
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // 生产环境：极度收缩白名单
      const allowedOrigins = [
        'http://8.130.26.87',
        'http://8.130.26.87:3000' // 为防止带端口访问，可一并添加
      ];
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('生产环境跨域请求被 CORS 策略阻止'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Number']
};

app.use(cors(corsOptions));

// 安全中间件（CORS之后）
app.use(helmet());

// 速率限制 - 开发环境和测试环境宽松，生产环境严格
if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test' && process.env.SKIP_RATE_LIMIT !== 'true') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // 生产环境限制
    message: {
      success: false,
      message: '请求过于频繁，请稍后再试'
    }
  });
  app.use(limiter);
} else {
  // 开发/测试环境放宽限制
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    message: {
      success: false,
      message: '请求过于频繁，请稍后再试'
    }
  });
  app.use(limiter);
}

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 提供静态文件访问（用于头像等上传文件）
app.use('/uploads', express.static('uploads'));

// 健康检查路由
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/submissions', submissionRoutes);

// 404处理
app.use(notFound);

// 错误处理
app.use(errorHandler);

// 启动服务器（异步：先连接 MySQL，再同步模型，最后监听端口）
const startServer = async () => {
  try {
    // 1. 连接 MySQL 数据库
    await connectDB();

    // 2. 同步模型到数据库（不使用 force，保护数据安全）
    await syncDatabase({ alter: false });

    // 3. 启动 HTTP 服务
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;