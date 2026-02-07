const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 导入路由
const authRoutes = require('./routes/authRoutes');
const journalRoutes = require('./routes/journalRoutes');

// 导入中间件
const { errorHandler, notFound } = require('./middleware/error');

// 导入数据库连接
const { connectDB } = require('./config/databaseLowdb');

// 连接数据库
connectDB();

// 初始化Express应用
const app = express();

// 设置端口
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet());

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  }
});
app.use(limiter);

// CORS配置 - 开发环境允许所有localhost端口
app.use(cors({
  origin: process.env.NODE_ENV === 'development'
    ? function(origin, callback) {
        // 允许所有localhost端口
        if (!origin || origin.startsWith('http://localhost:')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    : 'https://your-frontend-domain.com',
  credentials: true
}));

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// 404处理
app.use(notFound);

// 错误处理
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;