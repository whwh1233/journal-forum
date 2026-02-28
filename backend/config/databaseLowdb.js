const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

// 数据库文件路径 - 测试环境使用独立数据库
const dbFile = process.env.NODE_ENV === 'test' ? 'database.test.json' : 'database.json';
const dbPath = path.join(__dirname, '..', dbFile);

// 默认数据结构
const defaultData = {
  journals: [],
  users: [],
  comments: [],
  favorites: [],
  follows: [],
  badges: [],
  userBadges: [],
  migrated: {}
};

let db = null;

// 连接数据库
const connectDB = async () => {
  try {
    // 使用JSON文件适配器
    const adapter = new JSONFile(dbPath);
    db = new Low(adapter, defaultData);

    // 读取数据
    await db.read();

    // 如果文件为空，初始化默认数据
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }

    // 确保所有必需的数组存在
    if (!db.data.comments) db.data.comments = [];
    if (!db.data.favorites) db.data.favorites = [];
    if (!db.data.follows) db.data.follows = [];
    if (!db.data.badges) db.data.badges = [];
    if (!db.data.userBadges) db.data.userBadges = [];
    if (!db.data.migrated) db.data.migrated = {};

    // 初始化徽章数据（如果为空）
    if (db.data.badges.length === 0) {
      const { initialBadges } = require('../data/initialBadges');
      db.data.badges = initialBadges;
      await db.write();
      console.log('Initial badges data loaded');
    }

    // 运行数据迁移
    const { migrateReviewsToComments } = require('../migrations/migrateComments');
    await migrateReviewsToComments();

    console.log('JSON file database connected successfully');
    console.log(`Database location: ${dbPath}`);
  } catch (error) {
    console.error('Unable to connect to database:', error.message);
    process.exit(1);
  }
};

// 获取数据库实例
const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return db;
};

module.exports = { connectDB, getDB };
