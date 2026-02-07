const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '..', 'database.json');

// 默认数据结构
const defaultData = {
  journals: [],
  users: []
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
