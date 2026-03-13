# 综合测试系统设计

> **日期**: 2026-03-14
> **状态**: 已确认，待实现
> **方案**: 增量增强（方案 1）

## 目标

构建一套保证类型、接口、前端点击行为不报错的测试系统，具备：

1. **类型安全** - 前后端共享 Zod Schema，编译期 + 运行时双重保障
2. **API 契约** - 所有 API 响应经过 Schema 验证
3. **零错误交互** - 捕获所有 JS 错误、后端错误、console.error
4. **可视化演示** - 分模块按需展示全部功能
5. **强制交付流程** - Git Hook 确保新功能必须有演示测试

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                      Git Pre-Commit Hook                     │
│  TypeScript 编译 │ Schema 同步 │ 演示覆盖 │ 受影响测试运行    │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Zod Schema   │      │  错误收集器   │      │  覆盖率追踪   │
│ (shared/)    │      │              │      │              │
├──────────────┤      ├──────────────┤      ├──────────────┤
│ • 类型推导    │      │ • JS Error   │      │ • 组件覆盖    │
│ • 运行时验证  │      │ • API Error  │      │ • 交互覆盖    │
│ • 前后端共用  │      │ • 复现路径    │      │ • 阈值门禁    │
└──────────────┘      └──────────────┘      └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │  Playwright 演示  │
                    │  (可视化 + 断言)  │
                    └──────────────────┘
```

## Part 1: 共享 Schema 架构

### 目录结构

```
journal-forum/
├── shared/                          # 前后端共享代码
│   ├── schemas/                     # Zod Schema 定义
│   │   ├── user.schema.ts
│   │   ├── journal.schema.ts
│   │   ├── comment.schema.ts
│   │   ├── post.schema.ts
│   │   ├── api-response.schema.ts
│   │   └── index.ts
│   └── types/                       # 从 Schema 推导的类型
│       └── index.ts
```

### Schema 示例

```typescript
// shared/schemas/user.schema.ts
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar: z.string().optional(),
  role: z.enum(['user', 'admin', 'superadmin']),
});

export type User = z.infer<typeof UserSchema>;

export const UserResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    user: UserSchema,
    token: z.string().optional(),
  }),
});
```

### 使用方式

```typescript
// 前端
export { User, Journal, Post } from '../../shared/types';

// 后端
const { UserSchema } = require('../../shared/schemas');
const validated = UserSchema.parse(userData);
```

## Part 2: 错误收集器

### 数据结构

```typescript
interface ActionStep {
  action: 'click' | 'type' | 'scroll' | 'navigate' | 'select' | 'hover';
  target: string;
  description?: string;
  value?: string;
  timestamp: string;
  screenshot?: string;
}

interface CollectedError {
  type: 'js-error' | 'api-error' | 'console-error' | 'schema-error';
  message: string;
  timestamp: string;
  url: string;
  stack?: string;
  endpoint?: string;
  statusCode?: number;
  responseBody?: unknown;
  schemaName?: string;
  invalidData?: unknown;
  stepsBeforeError: ActionStep[];    // 复现路径
  screenshotOnError?: string;
}

interface ErrorReport {
  totalErrors: number;
  byType: Record<string, number>;
  errors: CollectedError[];
  testName: string;
  duration: number;
}
```

### 捕获机制

| 错误类型 | 捕获方式 |
|----------|----------|
| JS 运行时错误 | `page.on('pageerror')` |
| 未处理 Promise | `page.on('pageerror')` |
| Console.error | `page.on('console')` 过滤 error |
| API 4xx/5xx | `page.on('response')` 拦截 |
| Schema 验证失败 | Zod 验证抛出 |

### 报告输出示例

```
╔════════════════════════════════════════════════════════════════╗
║                      演示测试错误报告                            ║
╠════════════════════════════════════════════════════════════════╣
║ 测试: 用户场景演示 > 发表评论                                    ║
║ 耗时: 18.5s                                                    ║
║ 错误总数: 1                                                     ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║ [1] JS Error @ 10:23:47                                        ║
║ ────────────────────────────────────────────────────────────── ║
║ 错误信息:                                                       ║
║   Cannot read property 'dimensionRatings' of undefined         ║
║                                                                ║
║ 位置:                                                          ║
║   URL: http://localhost:3000/                                  ║
║   Stack: at CommentForm.tsx:128                                ║
║                                                                ║
║ 📸 错误截图:                                                    ║
║   e2e/screenshots/error-2024-01-15-102347.png                  ║
║                                                                ║
║ 🔄 复现步骤:                                                    ║
║ ┌──────────────────────────────────────────────────────────┐   ║
║ │ 1. [10:23:30] 🖱️ 点击 ".journal-card"                     │   ║
║ │    → 📖 点击查看期刊详情                                   │   ║
║ │                                                          │   ║
║ │ 2. [10:23:35] ⌨️ 输入 "textarea.comment-input"            │   ║
║ │    → 📝 输入评论内容                                       │   ║
║ │    → 值: "这是一个测试评论"                                │   ║
║ │                                                          │   ║
║ │ 3. [10:23:40] 🖱️ 点击 ".rating-star:nth-child(4)"        │   ║
║ │    → ⭐ 选择评分                                          │   ║
║ │                                                          │   ║
║ │ 4. [10:23:45] 🖱️ 点击 "button.submit-comment"            │   ║
║ │    → 📤 提交评论                                          │   ║
║ │                                                          │   ║
║ │ ❌ [10:23:47] 错误发生                                     │   ║
║ └──────────────────────────────────────────────────────────┘   ║
║                                                                ║
║ 💡 快速复现命令:                                                ║
║   npx playwright test demo-modules/03-user.spec.ts \           ║
║     --headed --grep "发表评论"                                  ║
╚════════════════════════════════════════════════════════════════╝
```

### 自动生成复现脚本

错误发生时自动生成可执行的复现测试文件：

```typescript
// e2e/repro-scripts/error-2024-01-15-102347.spec.ts
import { test } from '@playwright/test';

test('复现: Cannot read property dimensionRatings...', async ({ page }) => {
  await page.goto('/');
  await page.click('.journal-card');
  await page.fill('textarea.comment-input', '这是一个测试评论');
  await page.click('.rating-star:nth-child(4)');
  await page.click('button.submit-comment');
  // ❌ 错误应该在此处发生
});
```

## Part 3: Git Hook 强制检查

### 检查规则

| 检查项 | 规则 | 失败处理 |
|--------|------|----------|
| TypeScript 编译 | `tsc --noEmit` 无错误 | 阻止提交 |
| Schema 一致性 | 前端类型与 shared/schemas 同步 | 阻止提交 |
| 新组件有演示 | 新增组件必须有对应演示测试 | 阻止提交 |
| 演示测试通过 | 受影响模块演示测试通过 | 阻止提交 |

### 组件到演示的映射

```typescript
const COMPONENT_TO_DEMO_MAP = {
  'src/features/auth/': 'e2e/tests/demo-modules/02-auth.spec.ts',
  'src/features/journals/': 'e2e/tests/demo-modules/01-guest.spec.ts',
  'src/features/comments/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/posts/': 'e2e/tests/demo-modules/community-posts.spec.ts',
  'src/features/admin/': 'e2e/tests/demo-modules/04-admin.spec.ts',
  'src/features/profile/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/submissions/': 'e2e/tests/journal-submission-integration.spec.ts',
  'src/components/common/': 'e2e/tests/demo-modules/01-guest.spec.ts',
};
```

### Hook 实现

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

npx tsc --noEmit || exit 1
node scripts/check-schema-sync.js || exit 1
node scripts/check-demo-coverage.js || exit 1
node scripts/run-affected-demos.js --quick || exit 1

echo "✅ All checks passed!"
```

### 运行模式

- **快速模式** (pre-commit): 只运行受影响测试，无头浏览器，约 30 秒
- **完整模式** (CI/手动): 运行所有演示测试，有头浏览器，约 5-10 分钟

## Part 4: 演示覆盖率追踪

### 覆盖率维度

| 维度 | 定义 | 目标阈值 |
|------|------|----------|
| 组件覆盖 | 每个组件/页面是否有演示 | 100% |
| 交互覆盖 | 可点击元素是否被触发 | ≥80% |

### 覆盖率数据

```json
{
  "summary": {
    "componentCoverage": { "total": 48, "covered": 45, "percentage": 93.75 },
    "interactionCoverage": { "total": 156, "covered": 142, "percentage": 91.03 }
  },
  "uncoveredComponents": [
    {
      "path": "src/features/badges/components/BadgeDetail.tsx",
      "suggestedDemoFile": "e2e/tests/demo-modules/03-user.spec.ts"
    }
  ]
}
```

### 命令

```bash
npm run demo:coverage      # 生成覆盖率报告
npm run demo:coverage:html # 生成 HTML 报告
```

## 新增文件清单

```
shared/
├── schemas/
│   ├── user.schema.ts
│   ├── journal.schema.ts
│   ├── comment.schema.ts
│   ├── post.schema.ts
│   ├── api-response.schema.ts
│   └── index.ts
└── types/
    └── index.ts

e2e/
├── fixtures/
│   ├── error-collector.ts          # 错误收集器
│   ├── interaction-tracker.ts      # 交互追踪
│   └── schema-validator.ts         # API 响应验证
├── coverage/
│   └── demo-coverage.json
└── repro-scripts/                   # 自动生成的复现脚本

scripts/
├── check-schema-sync.js
├── check-demo-coverage.js
└── run-affected-demos.js

.husky/
└── pre-commit
```

## 实现优先级

1. **P0 - 共享 Schema** - 基础设施，其他功能依赖
2. **P0 - 错误收集器** - 核心能力
3. **P1 - Git Hook** - 强制保障
4. **P1 - 覆盖率追踪** - 可视化监控

## 验收标准

- [ ] 所有 API 响应经过 Zod 验证
- [ ] 演示测试中任何 JS 错误都被捕获并报告
- [ ] 错误报告包含完整复现路径
- [ ] 新增组件无演示时阻止提交
- [ ] 覆盖率报告可生成并查看
