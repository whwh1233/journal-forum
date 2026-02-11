// 测试专用数据库配置（避免ESM问题）
let testDB = null;

const initTestDB = (data) => {
  testDB = {
    data: data,
    write: async () => Promise.resolve(),
    read: async () => Promise.resolve(),
  };
};

const getDB = () => {
  if (!testDB) {
    throw new Error('Test database not initialized. Call initTestDB first.');
  }
  return testDB;
};

module.exports = {
  getDB,
  initTestDB,
};
