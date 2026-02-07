const { Sequelize } = require('sequelize');
const path = require('path');
const sqlite3 = require('better-sqlite3');

// 创建SQLite数据库实例
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'), // 数据库文件路径
  dialectOptions: {
    // better-sqlite3配置
  },
  dialectModule: require('better-sqlite3'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false, // 开发环境显示SQL日志
  define: {
    timestamps: true, // 自动添加createdAt和updatedAt字段
    underscored: false, // 使用驼峰命名
  }
});

// 测试数据库连接
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite database connected successfully');

    // 同步数据库模型（开发环境）
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false }); // alter: true 会自动更新表结构
      console.log('Database models synchronized');
    }
  } catch (error) {
    console.error('Unable to connect to database:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
