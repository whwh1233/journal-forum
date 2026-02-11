# 测试快速参考

快速查找常用测试命令和模式。

## 📋 常用命令

### 后端测试

```bash
cd backend

npm test                    # 运行所有测试
npm test auth              # 运行包含"auth"的测试
npm run test:watch         # 监听模式
npm run test:coverage      # 覆盖率报告
npm run test:verbose       # 详细输出
```

### 前端测试

```bash
npm test                   # 运行所有测试
npm run test:ui            # UI模式（推荐）
npm run test:coverage      # 覆盖率报告
```

---

## 🎯 测试模式速查

### 后端API测试

```javascript
// 基本请求测试
await request(app)
  .post('/api/endpoint')
  .set('Authorization', `Bearer ${token}`)
  .send(data)
  .expect(200);

// 验证响应
expect(response.body).toHaveProperty('success', true);
expect(response.body.data).toMatchObject({ id: 1 });

// 验证数据库变化
const db = testDb.getDB();
const record = db.data.items.find(i => i.id === 1);
expect(record).toBeDefined();
```

### 前端组件测试

```typescript
// 渲染组件
render(<Component prop={value} />);

// 查找元素
screen.getByText('文本');
screen.getByRole('button', { name: '按钮名' });
screen.getByLabelText('标签');
screen.queryByText('可能不存在的文本'); // 不抛出错误

// 用户交互
const user = userEvent.setup();
await user.click(element);
await user.type(input, 'text');

// 异步等待
await waitFor(() => {
  expect(screen.getByText('异步内容')).toBeInTheDocument();
});

// Mock函数
const mockFn = vi.fn();
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
```

---

## 🔍 常用断言

### Jest/Vitest断言

```javascript
// 基本断言
expect(value).toBe(expected);              // 严格相等
expect(value).toEqual(expected);           // 深度相等
expect(value).toBeTruthy();                // 真值
expect(value).toBeFalsy();                 // 假值
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// 数字
expect(num).toBeGreaterThan(3);
expect(num).toBeLessThan(10);
expect(num).toBeCloseTo(0.3);              // 浮点数比较

// 字符串
expect(str).toMatch(/pattern/);
expect(str).toContain('substring');

// 数组/对象
expect(arr).toContain(item);
expect(arr).toHaveLength(3);
expect(obj).toHaveProperty('key');
expect(obj).toHaveProperty('key', value);
expect(obj).toMatchObject({ key: value });

// 函数
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledTimes(2);
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(() => fn()).toThrow();

// 异步
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```

### DOM断言（Testing Library）

```typescript
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toBeDisabled();
expect(element).toBeEnabled();
expect(element).toHaveClass('className');
expect(element).toHaveStyle({ color: 'red' });
expect(input).toHaveValue('text');
expect(checkbox).toBeChecked();
```

---

## 🛠️ Mock速查

### Mock函数

```javascript
// 创建
const mockFn = vi.fn();
const mockFn = vi.fn(() => 'return value');
const mockFn = vi.fn().mockReturnValue('value');

// 异步
const mockFn = vi.fn().mockResolvedValue('value');
const mockFn = vi.fn().mockRejectedValue(new Error('error'));

// 验证调用
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith('arg');
expect(mockFn).toHaveBeenLastCalledWith('arg');

// 清除
mockFn.mockClear();        // 清除调用记录
mockFn.mockReset();        // 清除所有mock状态
mockFn.mockRestore();      // 恢复原始实现
vi.clearAllMocks();        // 清除所有mock
```

### Mock模块

```javascript
// 后端 (Jest)
jest.mock('../../middleware/auth', () => ({
  auth: jest.fn((req, res, next) => next()),
}));

// 前端 (Vitest)
vi.mock('../services/api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: [] })),
}));
```

### Mock fetch

```javascript
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: {} }),
  })
);
```

---

## 📝 测试结构模板

### 后端测试文件

```javascript
const { TestDatabase } = require('../helpers/testDb');

describe('Feature Tests', () => {
  let testDb;
  let app;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.setup();
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  beforeEach(async () => {
    await testDb.reset();
  });

  describe('Endpoint Group', () => {
    it('should handle success case', async () => {
      // 测试代码
    });

    it('should handle error case', async () => {
      // 测试代码
    });
  });
});
```

### 前端测试文件

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../helpers/testUtils';
import userEvent from '@testing-library/user-event';

describe('Component', () => {
  const mockProp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<Component prop={mockProp} />);
    expect(screen.getByText('text')).toBeInTheDocument();
  });

  it('should handle interaction', async () => {
    const user = userEvent.setup();
    render(<Component prop={mockProp} />);

    await user.click(screen.getByRole('button'));
    expect(mockProp).toHaveBeenCalled();
  });
});
```

---

## 🐛 调试技巧

### 查看渲染的DOM

```typescript
import { screen } from '@testing-library/react';

// 打印整个DOM树
screen.debug();

// 打印特定元素
screen.debug(screen.getByRole('button'));
```

### 只运行单个测试

```javascript
// 临时运行单个测试
it.only('should test this', () => {});

// 跳过测试
it.skip('should skip this', () => {});

// 条件跳过
it.skipIf(condition)('conditional skip', () => {});
```

### 增加超时时间

```javascript
// 单个测试
it('slow test', async () => {
  // 测试代码
}, 10000); // 10秒超时

// 全局配置
jest.setTimeout(10000);
```

---

## ⚡ 性能优化

### 并行运行测试

```javascript
// Vitest自动并行

// Jest配置
{
  "maxWorkers": "50%"
}
```

### 减少重复setup

```javascript
// 使用beforeAll而不是beforeEach
beforeAll(async () => {
  // 只运行一次的setup
});
```

---

## 📊 覆盖率目标

| 类型 | 目标 |
|------|------|
| 全局 | ≥60% |
| Controllers | ≥80% |
| Routes | ≥70% |
| Components | ≥70% |

---

## ⚠️ 常见陷阱

1. **忘记await异步操作**
   ```javascript
   // ❌ 错误
   user.click(button);
   expect(result).toBe(true);

   // ✅ 正确
   await user.click(button);
   await waitFor(() => expect(result).toBe(true));
   ```

2. **测试间状态泄漏**
   ```javascript
   // ✅ 每次测试前清理
   beforeEach(() => {
     vi.clearAllMocks();
     localStorage.clear();
   });
   ```

3. **使用错误的查询方法**
   ```javascript
   // ❌ 可能抛出错误
   const element = screen.getByText('optional text');

   // ✅ 用于可选元素
   const element = screen.queryByText('optional text');
   ```

4. **忘记测试边界情况**
   - 空值、null、undefined
   - 权限边界
   - 数据格式错误

---

## 🔗 快速链接

- [完整测试指南](./TESTING.md)
- [Jest文档](https://jestjs.io/)
- [Vitest文档](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)

---

## 💡 记住

- **测试先行**：先写测试，再写代码
- **命名清晰**：测试名称要说明测试内容和预期
- **保持简单**：一个测试只验证一件事
- **测试边界**：不只测试成功路径
- **维护测试**：测试代码也需要重构和维护

**Happy Testing! 🎉**
