// Jest全局设置文件
require('dotenv').config({ path: '.env.test' });

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.PORT = 3002; // 使用不同端口避免冲突

// 增加测试超时时间
jest.setTimeout(10000);

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
