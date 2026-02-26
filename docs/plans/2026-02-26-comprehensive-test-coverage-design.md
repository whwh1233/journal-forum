# 全面测试覆盖设计文档

**日期**: 2026-02-26
**目标**: 实现 90%+ 测试覆盖率，确保所有功能经过自动化测试验证

## 1. 需求概述

### 目标
- 达到 90%+ 的全面测试覆盖（包括所有功能、边界条件、错误处理）
- 本地优先测试（提供便捷的 npm 脚本）
- 文档驱动的测试保障机制（TESTING.md 指南 + `npm run test:all` 一键测试）
- 优先补充前端组件测试，逐步覆盖所有层级

### 当前状态
- ✅ E2E 测试：已有基础覆盖（4 个测试文件）
- ✅ 后端集成测试：已覆盖所有 API 模块（5 个测试文件）
- ⚠️ 前端组件测试：仅 4 个组件测试
- ❌ 单元测试：完全缺失
- ❌ CI/CD：未配置

## 2. 总体架构

### 三层测试金字塔

```
        E2E Tests (已有基础)
       /              \
  Component Tests    Integration Tests (后端已完整)
  (前端组件 - 优先)
 /                    \
Unit Tests            Unit Tests
(前端 utils/hooks)    (后端已有部分)
```

### 实施策略：渐进式全面覆盖

分 3 个阶段快速推进，每个阶段都能看到可测量的进展。

## 3. 实施阶段

### 阶段 1：核心组件测试（预计产出：15+ 组件测试）

**目标组件：**

1. **通用组件** (5 个)
   - ThemePicker - 主题选择器
   - UserDropdown - 用户下拉菜单
   - Modal - 模态框
   - BackButton - 返回按钮
   - Breadcrumb - 面包屑导航

2. **布局组件** (4 个)
   - TopBar - 顶部导航栏
   - SideNav - 侧边导航
   - PageHeader - 页面头部
   - AppLayout - 主应用布局

3. **搜索筛选** (1 个)
   - SearchAndFilter - 搜索和筛选组件

4. **期刊组件** (2 个)
   - JournalCard - 期刊卡片
   - JournalDetailPanel - 期刊详情面板

5. **评论组件** (2 个)
   - CommentList - 评论列表
   - CommentForm - 评论表单

6. **表单组件** (1 个)
   - RegisterForm - 注册表单（LoginForm 已有）

### 阶段 2：页面组件 + 单元测试（预计产出：10+ 页面测试 + 8+ 单元测试）

**页面组件测试：**
- HomePage - 主页
- DashboardPage - 仪表盘
- ProfilePage - 个人主页
- ProfileEditPage - 个人资料编辑
- JournalListPage - 期刊列表
- AdminDashboard - 管理后台
- UserManagement - 用户管理
- JournalManagement - 期刊管理
- CommentManagement - 评论管理
- FollowListPage - 关注列表

**Hooks 单元测试：**
- useJournals - 期刊数据管理
- useAuth - 认证状态管理
- useComments - 评论管理
- useTheme - 主题管理

**Services 单元测试：**
- journalService - 期刊 API 服务
- authService - 认证 API 服务
- commentService - 评论 API 服务
- userService - 用户 API 服务

### 阶段 3：边界场景 + E2E 增强（预计产出：覆盖率达标 + 完整文档）

**边界条件测试：**
- 空数据、错误数据处理
- 极长文本、特殊字符处理
- 网络错误、API 失败场景

**E2E 测试增强：**
- 管理员操作流程
- 错误场景处理
- 多用户交互场景

**文档与配置：**
- TESTING.md 完整测试指南
- `npm run test:all` 脚本配置
- 覆盖率阈值配置

## 4. 测试策略与结构

### 每个组件测试的 5 个核心维度

#### 1. 渲染测试
- 组件正常渲染
- Props 传递正确
- 条件渲染逻辑（如：登录/未登录状态）

#### 2. 交互测试
- 按钮点击、输入变化
- 表单提交
- 下拉菜单展开/关闭
- 模态框打开/关闭

#### 3. 状态变化测试
- Context 变化响应
- 本地状态更新
- 异步数据加载

#### 4. 边界条件测试
- 空数据、错误数据
- 极长文本、特殊字符
- 网络错误、API 失败

#### 5. 可访问性测试
- ARIA 属性
- 键盘导航
- 屏幕阅读器兼容

### 测试文件组织结构

```
src/
├── __tests__/
│   ├── components/          # 组件测试
│   │   ├── common/          # 通用组件
│   │   │   ├── ThemePicker.test.tsx
│   │   │   ├── UserDropdown.test.tsx
│   │   │   └── Modal.test.tsx
│   │   ├── layout/          # 布局组件
│   │   │   ├── TopBar.test.tsx
│   │   │   ├── SideNav.test.tsx
│   │   │   └── AppLayout.test.tsx
│   │   └── features/        # 功能组件
│   │       ├── journals/
│   │       ├── comments/
│   │       └── auth/
│   ├── hooks/               # Hooks 单元测试
│   │   ├── useJournals.test.ts
│   │   ├── useAuth.test.ts
│   │   └── useTheme.test.ts
│   ├── services/            # API 服务单元测试
│   │   ├── journalService.test.ts
│   │   └── authService.test.ts
│   └── utils/               # 工具函数单元测试
```

### 测试命名规范

- 组件测试：`ComponentName.test.tsx`
- 单元测试：`functionName.test.ts`
- 测试用例描述：`describe('ComponentName', () => { it('should...', () => {}) })`

### 测试模板示例

```typescript
// 组件测试模板
describe('ThemePicker', () => {
  it('should render correctly', () => { /* ... */ });
  it('should open dropdown on click', () => { /* ... */ });
  it('should change theme when option selected', () => { /* ... */ });
  it('should close dropdown when clicking outside', () => { /* ... */ });
  it('should handle keyboard navigation', () => { /* ... */ });
});
```

## 5. 文档与脚本配置

### TESTING.md 文档结构

```markdown
# 测试指南

## 快速开始
- 运行所有测试：`npm run test:all`
- 查看覆盖率报告：`npm run test:coverage`

## 测试分类
1. 前端组件测试 (Vitest)
2. 前端单元测试 (Vitest)
3. 后端集成测试 (Jest)
4. E2E 测试 (Playwright)

## 编写新测试
### 组件测试模板
### Hooks 测试模板
### Service 测试模板

## 测试最佳实践
- 测试应该独立、可重复
- 使用有意义的描述
- 覆盖边界条件和错误场景
- Mock 外部依赖

## 覆盖率目标
- 总体覆盖率：≥ 90%
- 语句覆盖率：≥ 90%
- 分支覆盖率：≥ 85%
- 函数覆盖率：≥ 90%
```

### npm 脚本配置

在 `package.json` 中添加：

```json
{
  "scripts": {
    // 前端测试
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",

    // 后端测试
    "test:backend": "cd backend && npm test",
    "test:backend:coverage": "cd backend && npm run test:coverage",

    // E2E 测试
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",

    // 🎯 一键运行所有测试
    "test:all": "npm run test:backend && npm test && npm run test:e2e",

    // 🎯 完整覆盖率报告
    "test:all:coverage": "npm run test:backend:coverage && npm run test:coverage && npm run test:e2e",

    // 快速验证（跳过 E2E，更快）
    "test:quick": "npm run test:backend && npm test"
  }
}
```

### Vitest 覆盖率配置

在 `vitest.config.ts` 中配置：

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/main.tsx',
        'src/vite-env.d.ts'
      ],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90
      }
    }
  }
});
```

## 6. 成功标准

### 覆盖率目标
- 总体覆盖率：≥ 90%
- 语句覆盖率：≥ 90%
- 分支覆盖率：≥ 85%
- 函数覆盖率：≥ 90%

### 可交付成果
1. ✅ 15+ 核心组件测试（阶段 1）
2. ✅ 10+ 页面组件测试（阶段 2）
3. ✅ 8+ 单元测试（阶段 2）
4. ✅ 边界场景和错误处理测试（阶段 3）
5. ✅ TESTING.md 完整文档
6. ✅ `npm run test:all` 一键测试脚本
7. ✅ 覆盖率报告达标

### 质量保障
- 所有测试通过
- 无测试警告
- 测试可独立运行
- 测试执行速度合理（< 5 分钟）

## 7. 后续维护

### 新功能测试流程
1. 查看 TESTING.md 了解测试规范
2. 参考测试模板编写测试
3. 运行 `npm run test:quick` 快速验证
4. 提交前运行 `npm run test:all` 完整验证

### 定期检查
- 每周检查覆盖率报告
- 定期更新 TESTING.md 文档
- 补充新的测试模板和最佳实践

---

**设计批准**: ✅
**下一步**: 创建实施计划 (Implementation Plan)
