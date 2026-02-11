const { initTestDB } = require('../../config/databaseTest');

// 初始测试数据
const initialTestData = {
  users: [
    {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      password: '$2a$10$8K1p/a0dL3LHxnOQm6YoUOXvTjkVXJWqXqQpJnQQYLjMqrjZQZr7e', // password: test123
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      email: 'admin@example.com',
      name: 'Admin User',
      password: '$2a$10$8K1p/a0dL3LHxnOQm6YoUOXvTjkVXJWqXqQpJnQQYLjMqrjZQZr7e', // password: test123
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ],
  journals: [
    {
      id: 1,
      title: 'Test Journal 1',
      issn: '1234-5678',
      category: 'computer-science',
      rating: 4.5,
      description: 'Test journal description',
      reviews: [
        {
          author: 'test@example.com',
          rating: 5,
          content: 'Great journal!',
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Test Journal 2',
      issn: '8765-4321',
      category: 'biology',
      rating: 4.0,
      description: 'Another test journal',
      reviews: [],
      createdAt: new Date().toISOString(),
    },
  ],
  comments: [
    {
      id: '1-1234567890-abc123',
      userId: 1,
      userName: 'Test User',
      journalId: 1,
      parentId: null,
      content: 'This is a test comment',
      rating: 5,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    },
  ],
  favorites: [
    {
      id: 1,
      userId: 1,
      journalId: 1,
      createdAt: new Date().toISOString(),
    },
  ],
  follows: [],
  migrated: {
    comments: true,
  },
};

// 简单的内存数据库模拟（避免ESM问题）
class TestDatabase {
  constructor() {
    this.data = null;
  }

  async setup() {
    // 初始化内存数据
    this.data = JSON.parse(JSON.stringify(initialTestData));

    // 初始化测试数据库
    initTestDB(this.data);

    // 设置全局实例
    globalTestDatabase = this;

    return this;
  }

  async cleanup() {
    // 清理（测试数据库只在内存中，无需清理文件）
  }

  async reset() {
    // 重置数据为初始状态
    Object.assign(this.data, JSON.parse(JSON.stringify(initialTestData)));
  }

  getDB() {
    const testDB = require('../../config/databaseTest');
    return testDB.getDB();
  }
}

// 全局测试数据库实例供mock使用
let globalTestDatabase = null;

module.exports = {
  TestDatabase,
  initialTestData,
  get testDatabase() {
    return globalTestDatabase;
  },
  set testDatabase(value) {
    globalTestDatabase = value;
  },
};
