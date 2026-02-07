// 内存数据库连接（用于开发）
const connectDB = async () => {
  console.log('Using in-memory storage for development');
  return Promise.resolve();
};

module.exports = connectDB;