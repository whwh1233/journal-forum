const { Sequelize } = require('sequelize');

// MySQL 连接配置
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'journal_forum',
    dialect: 'mysql',

    // 连接池配置（百人级并发）
    pool: {
        min: parseInt(process.env.DB_POOL_MIN) || 2,
        max: parseInt(process.env.DB_POOL_MAX) || 10,
        acquire: 30000,   // 获取连接超时 30s
        idle: 10000       // 空闲连接回收 10s
    },

    // 日志配置
    logging: process.env.NODE_ENV === 'development' ? console.log : false,

    // MySQL 特定配置
    dialectOptions: {
        charset: 'utf8mb4',
        // 时区配置
        dateStrings: true,
        typeCast: true
    },

    // 全局模型选项
    define: {
        timestamps: true,
        underscored: true,      // 使用 snake_case 列名
        freezeTableName: true,  // 不自动复数化表名
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    },

    // 时区
    timezone: '+08:00'
};

const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
);

// 测试连接
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('MySQL database connected successfully');
        console.log(`Database: ${dbConfig.database} @ ${dbConfig.host}:${dbConfig.port}`);
    } catch (error) {
        console.error('Unable to connect to MySQL:', error.message);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
