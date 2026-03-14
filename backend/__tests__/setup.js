// Jest全局设置文件
// env-setup.js (setupFiles) already loads .env and .env.test

// 使用不同端口避免冲突
process.env.PORT = 3002;

// 增加测试超时时间
jest.setTimeout(10000);

// Mock uuid to avoid ESM issues with Jest
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).substring(7),
}));

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
