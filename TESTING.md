# 测试指南

本项目采用全面的测试策略，包括后端API测试和前端组件测试，以确保代码质量和防止回归错误。

## 目录

- [快速开始](#快速开始)
- [后端测试](#后端测试)
- [前端测试](#前端测试)
- [测试最佳实践](#测试最佳实践)
- [CI/CD集成](#cicd集成)

---

## 快速开始

### 运行所有测试

```bash
# 后端测试
cd backend
npm test

# 前端测试
cd ..
npm test
```

### 查看测试覆盖率

```bash
# 后端覆盖率
cd backend
npm run test:coverage

# 前端覆盖率
cd ..
npm run test:coverage
```

---

## 后端测试

### 技术栈

- **Jest**: 测试框架
- **Supertest**: HTTP API测试
- **LowDB**: 测试数据库（独立于生产数据）

### 测试结构

```
backend/
├── __tests__/
│   ├── setup.js                 # 全局测试配置
│   ├── helpers/
│   │   ├── testDb.js           # 测试数据库工具
│   │   └── testHelpers.js      # 测试辅助函数
│   ├── unit/                    # 单元测试
│   └── integration/             # 集成测试
│       ├── auth.test.js        # 认证API测试
│       ├── comments.test.js    # 评论API测试
│       ├── admin.test.js       # 管理员API测试
│       └── journals.test.js    # 期刊API测试
├── jest.config.js              # Jest配置
└── .env.test                   # 测试环境变量
```

### 运行测试

```bash
cd backend

# 运行所有测试
npm test

# 运行特定文件测试
npm test auth.test.js

# 监听模式（自动重新运行）
npm run test:watch

# 查看详细输出
npm run test:verbose

# 生成覆盖率报告
npm run test:coverage
```

### 测试示例

#### API集成测试

```javascript
describe('POST /api/auth/login', () => {
  it('should login with correct credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'test123',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('token');
  });
});
```

#### 数据一致性测试

```javascript
it('should maintain consistent data structure', () => {
  // 确保旧评论和新评论的数据结构一致
  const oldComment = db.data.journals[0].reviews[0];
  const newComment = db.data.comments[0];

  expect(oldComment).toHaveProperty('author');
  expect(newComment).toHaveProperty('userName');
});
```

---

## 前端测试

### 技术栈

- **Vitest**: Vite原生测试框架
- **React Testing Library**: React组件测试
- **Jest DOM**: DOM匹配器
- **User Event**: 模拟用户交互

### 测试结构

```
src/
├── __tests__/
│   ├── setup.ts                     # 全局测试配置
│   ├── helpers/
│   │   └── testUtils.tsx           # 测试工具和Mock数据
│   ├── components/                  # 组件测试
│   │   ├── CommentItem.test.tsx
│   │   ├── JournalCard.test.tsx
│   │   └── LoginForm.test.tsx
│   └── integration/                 # 集成测试
├── vitest.config.ts                 # Vitest配置
```

### 运行测试

```bash
# 运行所有测试
npm test

# UI模式（可视化测试界面）
npm run test:ui

# 生成覆盖率报告
npm run test:coverage
```

### 测试示例

#### 组件渲染测试

```typescript
it('should render comment content', () => {
  render(
    <CommentItem
      comment={mockComment}
      currentUserId={1}
      onReply={mockOnReply}
      onDelete={mockOnDelete}
    />
  );

  expect(screen.getByText(mockComment.content)).toBeInTheDocument();
});
```

#### 用户交互测试

```typescript
it('should call onReply when reply button is clicked', async () => {
  const user = userEvent.setup();

  render(<CommentItem {...props} />);

  const replyButton = screen.getByText(/回复/);
  await user.click(replyButton);

  expect(mockOnReply).toHaveBeenCalledWith(mockComment.id);
});
```

#### 数据结构测试

```typescript
it('should maintain data structure consistency', () => {
  // 确保所有必需字段存在
  const requiredFields = ['id', 'title', 'issn', 'category', 'rating'];
  requiredFields.forEach(field => {
    expect(mockJournal).toHaveProperty(field);
  });
});
```

---

## 测试最佳实践

### 1. AAA模式（Arrange-Act-Assert）

```javascript
it('should create a new comment', async () => {
  // Arrange: 准备测试数据
  const newComment = {
    journalId: 1,
    content: 'Test comment',
    rating: 5,
  };

  // Act: 执行操作
  const response = await request(app)
    .post('/api/comments')
    .send(newComment);

  // Assert: 验证结果
  expect(response.body.success).toBe(true);
  expect(response.body.data.comment).toHaveProperty('id');
});
```

### 2. 测试命名规范

- 使用描述性的测试名称
- 说明测试的内容和期望结果
- 使用 "should" 开头

```javascript
// ✅ 好的命名
it('should reject registration with existing email', async () => {});

// ❌ 不好的命名
it('test registration', async () => {});
```

### 3. 独立性和隔离性

- 每个测试应该独立运行
- 使用 `beforeEach` 重置状态
- 不依赖其他测试的结果

```javascript
beforeEach(async () => {
  await testDb.reset(); // 重置测试数据库
  vi.clearAllMocks();   // 清除所有mock
});
```

### 4. 测试边界情况

不仅测试正常流程，还要测试：

- 空值、null、undefined
- 极大值、极小值
- 错误输入
- 权限边界

```javascript
it('should reject rating out of range', async () => {
  const response = await request(app)
    .post('/api/comments')
    .send({ rating: 6 }); // 超出1-5范围

  expect(response.status).toBe(400);
});
```

### 5. 数据结构一致性测试

**重要**：这类测试可以防止像之前那样改了数据结构但忘记更新某些地方的bug。

```javascript
describe('Data Structure Consistency', () => {
  it('should ensure comment data structure is consistent', () => {
    // 验证所有评论都有统一的数据结构
    response.body.data.comments.forEach(comment => {
      expect(comment).toHaveProperty('id');
      expect(comment).toHaveProperty('content');
      expect(comment).toHaveProperty('author');
      expect(comment).toHaveProperty('createdAt');
    });
  });
});
```

### 6. Mock外部依赖

```javascript
// Mock API调用
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: {} }),
  })
);

// Mock认证中间件
jest.mock('../../middleware/auth', () => ({
  auth: jest.fn((req, res, next) => {
    req.userId = 1;
    next();
  }),
}));
```

---

## 测试覆盖率目标

### 当前目标

- **全局覆盖率**: ≥60%
- **Controllers**: ≥80%
- **Routes**: ≥70%
- **Components**: ≥70%

### 查看覆盖率报告

```bash
# 后端
cd backend && npm run test:coverage
# 报告在 backend/coverage/index.html

# 前端
npm run test:coverage
# 报告在 coverage/index.html
```

---

## CI/CD集成

### GitHub Actions示例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install Backend Dependencies
        run: cd backend && npm ci

      - name: Run Backend Tests
        run: cd backend && npm run test:coverage

      - name: Install Frontend Dependencies
        run: npm ci

      - name: Run Frontend Tests
        run: npm run test:coverage

      - name: Upload Coverage
        uses: codecov/codecov-action@v2
```

---

## 常见问题

### Q: 测试运行很慢怎么办？

A:
- 使用 `test.concurrent` 并行运行独立测试
- 减少测试中的等待时间
- 使用内存数据库而不是文件数据库

### Q: 如何调试失败的测试？

A:
- 使用 `npm run test:verbose` 查看详细输出
- 在测试中添加 `console.log` 查看中间状态
- 使用 `test.only` 只运行单个测试

### Q: Mock数据应该放在哪里？

A: 统一放在 `__tests__/helpers/testUtils` 中，方便复用。

---

## 编写新测试

### 后端API测试模板

```javascript
describe('API Name', () => {
  let testDb;
  let app;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.setup();
    app = createTestApp();
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  beforeEach(async () => {
    await testDb.reset();
  });

  describe('POST /api/endpoint', () => {
    it('should handle normal case', async () => {
      // 测试代码
    });

    it('should handle error case', async () => {
      // 测试代码
    });
  });
});
```

### 前端组件测试模板

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../helpers/testUtils';
import Component from './Component';

describe('Component', () => {
  const mockCallback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<Component prop={mockCallback} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<Component prop={mockCallback} />);

    await user.click(screen.getByRole('button'));
    expect(mockCallback).toHaveBeenCalled();
  });
});
```

---

## 测试清单

提交代码前，确保：

- [ ] 所有测试通过
- [ ] 新功能有对应的测试
- [ ] 测试覆盖率达标
- [ ] 没有跳过的测试（`test.skip`）
- [ ] 没有调试用的 `test.only`
- [ ] Mock数据结构与实际一致
- [ ] 测试了边界情况和错误情况

---

## 资源链接

- [Jest文档](https://jestjs.io/)
- [Vitest文档](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest文档](https://github.com/visionmedia/supertest)

---

## 贡献

如果你添加了新的测试工具或最佳实践，请更新此文档。

**记住**：测试不是负担，而是保护代码质量的盾牌。每次因为测试发现bug，都是在节省未来的调试时间！
