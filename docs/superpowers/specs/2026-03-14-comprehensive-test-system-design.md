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

---

## 确认的实现决策

| 决策项 | 选择 | 说明 |
|--------|------|------|
| Schema 迁移范围 | **全量迁移** | 将 `src/types/index.ts` 中约 30 个类型全部转为 Zod Schema |
| 后端验证策略 | **E2E 测试层验证** | 后端零侵入，仅在 Playwright 测试中拦截 API 响应并验证 |
| 错误容忍度 | **零容忍** | 任何错误（JS Error / API 5xx / Schema 不匹配）都导致测试失败 |
| Git Hook 严格程度 | **按需求规模** | 大需求（features/pages/contexts 下新增文件）必须演示测试，小需求可用 `[skip-demo]` 跳过 |
| 演示测试运行时机 | **精确匹配** | 只运行改动文件对应的演示模块 |
| 组件覆盖率阈值 | **100%** | 所有组件必须有演示 |
| 交互覆盖率阈值 | **100%** | 所有可点击元素必须被触发 |
| Zod 安装位置 | **根目录安装** | 在项目根目录 `package.json` 安装 zod，前后端共用 |
| 现有演示测试 | **重构升级** | 重写现有测试，使用新的增强版 demo-helpers |

---

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

---

## Part 1: 共享 Schema 架构

### 目录结构

```
journal-forum/
├── package.json                     # zod 安装在此
├── shared/                          # 前后端共享代码
│   ├── schemas/                     # Zod Schema 定义
│   │   ├── user.schema.ts
│   │   ├── journal.schema.ts
│   │   ├── comment.schema.ts
│   │   ├── post.schema.ts
│   │   ├── badge.schema.ts
│   │   ├── submission.schema.ts
│   │   ├── announcement.schema.ts
│   │   ├── api-response.schema.ts   # 统一 API 响应格式
│   │   └── index.ts
│   └── types/                       # 从 Schema 推导的类型（自动生成）
│       └── index.ts
├── src/                             # 前端 import from '@/shared/schemas'
└── backend/                         # 后端 require('../shared/schemas')
```

### 需要迁移的类型清单

从 `src/types/index.ts` 全量迁移以下类型：

| Schema 文件 | 包含类型 |
|-------------|----------|
| `user.schema.ts` | User, UserProfile, AdminUser, LoginCredentials, RegisterData |
| `journal.schema.ts` | Journal, JournalLevel, JournalRatingCache, Category, RatingSummary |
| `comment.schema.ts` | Comment, DimensionRatings, MyComment, AdminComment |
| `post.schema.ts` | Post, PostComment, PostCategory, PostStatus, CreatePostData, UpdatePostData, PostFilters |
| `badge.schema.ts` | Badge, UserBadgesResponse, MyBadgesResponse, BadgeStats |
| `submission.schema.ts` | Manuscript, SubmissionRecord, SubmissionStatusHistory |
| `announcement.schema.ts` | Announcement（如有） |
| `api-response.schema.ts` | ApiResponse<T>, PaginationInfo, ActivityStats |

### Schema 示例

```typescript
// shared/schemas/user.schema.ts
import { z } from 'zod';

// 基础 User Schema
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar: z.string().optional(),
  role: z.enum(['user', 'admin', 'superadmin']),
});

export type User = z.infer<typeof UserSchema>;

// 用户资料 Schema
export const UserProfileSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  institution: z.string().optional(),
  website: z.string().optional(),
  role: z.enum(['user', 'admin', 'superadmin']),
  createdAt: z.string(),
  pinnedBadges: z.array(z.number()).optional(),
  stats: z.object({
    commentCount: z.number(),
    favoriteCount: z.number(),
    followingCount: z.number(),
    followerCount: z.number(),
    points: z.number(),
    level: z.number(),
  }).optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// 登录凭证 Schema
export const LoginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

// 注册数据 Schema
export const RegisterDataSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  name: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

export type RegisterData = z.infer<typeof RegisterDataSchema>;
```

```typescript
// shared/schemas/api-response.schema.ts
import { z } from 'zod';

// 通用 API 响应 Schema
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: dataSchema.optional(),
  });

// 分页信息 Schema
export const PaginationInfoSchema = z.object({
  currentPage: z.number(),
  totalPages: z.number(),
  totalItems: z.number(),
  itemsPerPage: z.number(),
});

export type PaginationInfo = z.infer<typeof PaginationInfoSchema>;

// 带分页的 API 响应
export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.object({
      items: z.array(itemSchema),
      pagination: PaginationInfoSchema,
    }),
  });
```

### 使用方式

```typescript
// 前端 (src/types/index.ts) - 重新导出
export * from '../../shared/types';

// 或直接使用
import { User, UserSchema } from '@/shared/schemas';

// 后端 (backend/controllers/*.js) - CommonJS
const { UserSchema, LoginCredentialsSchema } = require('../../shared/schemas');
```

### TypeScript 配置更新

```json
// tsconfig.json - 添加 shared 目录路径别名
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["shared/*"]
    }
  },
  "include": ["src", "shared"]
}
```

---

## Part 2: 错误收集器

### 数据结构

```typescript
// e2e/fixtures/error-collector.ts

interface ActionStep {
  action: 'click' | 'type' | 'scroll' | 'navigate' | 'select' | 'hover' | 'wait';
  target: string;           // 元素选择器
  description: string;      // 操作描述（中文）
  value?: string;           // 输入值（如有）
  timestamp: string;        // ISO 时间戳
  screenshot?: string;      // 操作时的截图路径（可选）
}

interface CollectedError {
  type: 'js-error' | 'api-error' | 'console-error' | 'schema-error';
  message: string;
  timestamp: string;
  url: string;
  stack?: string;
  // API 错误专用
  endpoint?: string;
  method?: string;
  statusCode?: number;
  requestBody?: unknown;
  responseBody?: unknown;
  // Schema 错误专用
  schemaName?: string;
  expectedType?: string;
  receivedValue?: unknown;
  zodErrors?: z.ZodError['errors'];
  // 复现信息
  stepsBeforeError: ActionStep[];
  screenshotOnError: string;       // 必须有错误截图
}

interface ErrorReport {
  testFile: string;
  testName: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalErrors: number;
  byType: {
    'js-error': number;
    'api-error': number;
    'console-error': number;
    'schema-error': number;
  };
  errors: CollectedError[];
  allSteps: ActionStep[];          // 完整操作记录
  passed: boolean;
}
```

### 捕获机制

| 错误类型 | 捕获方式 | 触发条件 |
|----------|----------|----------|
| JS 运行时错误 | `page.on('pageerror')` | 任何未捕获的 JS 异常 |
| 未处理 Promise | `page.on('pageerror')` | Unhandled Promise Rejection |
| Console.error | `page.on('console')` 过滤 type='error' | 任何 console.error 调用 |
| API 4xx | `page.on('response')` 拦截 | HTTP 状态码 400-499 |
| API 5xx | `page.on('response')` 拦截 | HTTP 状态码 500-599 |
| Schema 验证失败 | API 响应经过 Zod 验证 | 响应数据不符合 Schema |

### 错误收集器实现

```typescript
// e2e/fixtures/error-collector.ts
import { Page } from '@playwright/test';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

export class ErrorCollector {
  private page: Page;
  private errors: CollectedError[] = [];
  private steps: ActionStep[] = [];
  private testName: string;
  private startTime: string;
  private schemaRegistry: Map<string, z.ZodType>;

  constructor(page: Page, testName: string) {
    this.page = page;
    this.testName = testName;
    this.startTime = new Date().toISOString();
    this.schemaRegistry = new Map();
  }

  async start(): Promise<void> {
    // 捕获 JS 错误
    this.page.on('pageerror', async (error) => {
      await this.captureError({
        type: 'js-error',
        message: error.message,
        stack: error.stack,
      });
    });

    // 捕获 console.error
    this.page.on('console', async (msg) => {
      if (msg.type() === 'error') {
        await this.captureError({
          type: 'console-error',
          message: msg.text(),
        });
      }
    });

    // 捕获 API 错误
    this.page.on('response', async (response) => {
      const status = response.status();
      if (status >= 400) {
        let responseBody: unknown;
        try {
          responseBody = await response.json();
        } catch {
          responseBody = await response.text();
        }

        await this.captureError({
          type: 'api-error',
          message: `${response.request().method()} ${response.url()} → ${status}`,
          endpoint: response.url(),
          method: response.request().method(),
          statusCode: status,
          responseBody,
        });
      }

      // Schema 验证
      if (status >= 200 && status < 300) {
        await this.validateResponseSchema(response);
      }
    });
  }

  recordStep(step: Omit<ActionStep, 'timestamp'>): void {
    this.steps.push({
      ...step,
      timestamp: new Date().toISOString(),
    });
  }

  registerSchema(endpoint: string, schema: z.ZodType): void {
    this.schemaRegistry.set(endpoint, schema);
  }

  private async validateResponseSchema(response: Response): Promise<void> {
    const url = new URL(response.url());
    const endpoint = url.pathname;
    const schema = this.schemaRegistry.get(endpoint);

    if (!schema) return;

    try {
      const data = await response.json();
      schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        await this.captureError({
          type: 'schema-error',
          message: `Schema 验证失败: ${endpoint}`,
          schemaName: endpoint,
          zodErrors: error.errors,
          receivedValue: await response.json().catch(() => null),
        });
      }
    }
  }

  private async captureError(errorInfo: Partial<CollectedError>): Promise<void> {
    const timestamp = new Date().toISOString();
    const screenshotPath = `e2e/screenshots/error-${Date.now()}.png`;

    await this.page.screenshot({ path: screenshotPath, fullPage: true });

    this.errors.push({
      type: errorInfo.type!,
      message: errorInfo.message!,
      timestamp,
      url: this.page.url(),
      stack: errorInfo.stack,
      endpoint: errorInfo.endpoint,
      method: errorInfo.method,
      statusCode: errorInfo.statusCode,
      responseBody: errorInfo.responseBody,
      schemaName: errorInfo.schemaName,
      zodErrors: errorInfo.zodErrors,
      receivedValue: errorInfo.receivedValue,
      stepsBeforeError: [...this.steps],
      screenshotOnError: screenshotPath,
    });
  }

  getReport(): ErrorReport {
    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(this.startTime).getTime();

    return {
      testFile: '',  // 由调用方填充
      testName: this.testName,
      startTime: this.startTime,
      endTime,
      duration,
      totalErrors: this.errors.length,
      byType: {
        'js-error': this.errors.filter(e => e.type === 'js-error').length,
        'api-error': this.errors.filter(e => e.type === 'api-error').length,
        'console-error': this.errors.filter(e => e.type === 'console-error').length,
        'schema-error': this.errors.filter(e => e.type === 'schema-error').length,
      },
      errors: this.errors,
      allSteps: this.steps,
      passed: this.errors.length === 0,
    };
  }

  generateReproScript(): string {
    if (this.errors.length === 0) return '';

    const error = this.errors[0];
    const steps = error.stepsBeforeError.map((step, i) => {
      switch (step.action) {
        case 'click':
          return `  await page.click('${step.target}');  // ${step.description}`;
        case 'type':
          return `  await page.fill('${step.target}', '${step.value}');  // ${step.description}`;
        case 'navigate':
          return `  await page.goto('${step.value}');  // ${step.description}`;
        case 'scroll':
          return `  await page.mouse.wheel(0, ${step.value});  // ${step.description}`;
        case 'select':
          return `  await page.selectOption('${step.target}', '${step.value}');  // ${step.description}`;
        case 'hover':
          return `  await page.hover('${step.target}');  // ${step.description}`;
        case 'wait':
          return `  await page.waitForSelector('${step.target}');  // ${step.description}`;
        default:
          return `  // ${step.action}: ${step.target}`;
      }
    });

    return `
// 自动生成的错误复现脚本
// 错误类型: ${error.type}
// 错误信息: ${error.message}
// 发生时间: ${error.timestamp}
// 截图: ${error.screenshotOnError}

import { test, expect } from '@playwright/test';

test('复现: ${error.message.slice(0, 60).replace(/'/g, "\\'")}', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

${steps.join('\n')}

  // ❌ 错误应该在此处发生
  // 类型: ${error.type}
  // 信息: ${error.message}
});
`.trim();
  }

  printReport(): void {
    const report = this.getReport();

    console.log('\n' + '═'.repeat(70));
    console.log('                      演示测试错误报告');
    console.log('═'.repeat(70));
    console.log(`测试: ${report.testName}`);
    console.log(`耗时: ${(report.duration / 1000).toFixed(1)}s`);
    console.log(`状态: ${report.passed ? '✅ 通过' : '❌ 失败'}`);
    console.log(`错误总数: ${report.totalErrors}`);

    if (report.totalErrors > 0) {
      console.log('─'.repeat(70));
      console.log('按类型统计:');
      Object.entries(report.byType).forEach(([type, count]) => {
        if (count > 0) console.log(`  • ${type}: ${count}`);
      });

      console.log('─'.repeat(70));
      report.errors.forEach((error, i) => {
        console.log(`\n[${i + 1}] ${error.type.toUpperCase()} @ ${error.timestamp}`);
        console.log('─'.repeat(50));
        console.log(`错误信息: ${error.message}`);
        console.log(`URL: ${error.url}`);
        if (error.stack) console.log(`Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
        if (error.endpoint) console.log(`Endpoint: ${error.method} ${error.endpoint} → ${error.statusCode}`);
        if (error.schemaName) console.log(`Schema: ${error.schemaName}`);
        console.log(`截图: ${error.screenshotOnError}`);

        console.log('\n🔄 复现步骤:');
        error.stepsBeforeError.forEach((step, j) => {
          const icon = { click: '🖱️', type: '⌨️', scroll: '📜', navigate: '🔗', select: '📋', hover: '👆', wait: '⏳' }[step.action] || '•';
          console.log(`  ${j + 1}. [${step.timestamp.split('T')[1].slice(0, 8)}] ${icon} ${step.description}`);
          if (step.value) console.log(`     → 值: "${step.value}"`);
        });
        console.log(`  ❌ 错误发生`);
      });

      console.log('\n─'.repeat(70));
      console.log('💡 快速复现命令:');
      console.log(`   npx playwright test ${report.testFile} --headed --grep "${report.testName}"`);
    }

    console.log('═'.repeat(70) + '\n');
  }
}

export function createErrorCollector(page: Page, testName: string): ErrorCollector {
  return new ErrorCollector(page, testName);
}
```

### 报告输出示例

```
══════════════════════════════════════════════════════════════════════
                      演示测试错误报告
══════════════════════════════════════════════════════════════════════
测试: 用户场景演示 > 发表评论
耗时: 18.5s
状态: ❌ 失败
错误总数: 2
──────────────────────────────────────────────────────────────────────
按类型统计:
  • js-error: 1
  • schema-error: 1
──────────────────────────────────────────────────────────────────────

[1] JS-ERROR @ 2024-01-15T10:23:47.123Z
──────────────────────────────────────────────────
错误信息: Cannot read property 'dimensionRatings' of undefined
URL: http://localhost:3000/
Stack: at CommentForm.tsx:128
       at handleSubmit (CommentForm.tsx:95)
       at HTMLFormElement.submit
截图: e2e/screenshots/error-1705316627123.png

🔄 复现步骤:
  1. [10:23:30] 🖱️ 点击查看期刊详情
  2. [10:23:35] ⌨️ 输入评论内容
     → 值: "这是一个测试评论"
  3. [10:23:40] 🖱️ 选择评分
  4. [10:23:45] 🖱️ 提交评论
  ❌ 错误发生

[2] SCHEMA-ERROR @ 2024-01-15T10:23:48.456Z
──────────────────────────────────────────────────
错误信息: Schema 验证失败: /api/comments
Schema: CommentResponseSchema
截图: e2e/screenshots/error-1705316628456.png

🔄 复现步骤:
  1. [10:23:30] 🖱️ 点击查看期刊详情
  2. [10:23:35] ⌨️ 输入评论内容
     → 值: "这是一个测试评论"
  3. [10:23:40] 🖱️ 选择评分
  4. [10:23:45] 🖱️ 提交评论
  ❌ 错误发生

──────────────────────────────────────────────────────────────────────
💡 快速复现命令:
   npx playwright test demo-modules/03-user.spec.ts --headed --grep "发表评论"
══════════════════════════════════════════════════════════════════════
```

---

## Part 3: Git Hook 强制检查

### 大需求判定规则

```typescript
// scripts/check-demo-coverage.ts

const MAJOR_FEATURE_DIRS = [
  'src/features/',
  'src/pages/',
  'src/contexts/',
];

const MINOR_CHANGE_DIRS = [
  'src/components/common/',
  'src/styles/',
  'src/assets/',
];

function isMajorFeature(files: string[]): boolean {
  const newFiles = files.filter(f => isNewFile(f));

  return newFiles.some(file =>
    MAJOR_FEATURE_DIRS.some(dir => file.startsWith(dir)) &&
    (file.endsWith('.tsx') || file.endsWith('.ts'))
  );
}

function canSkipDemo(files: string[], commitMessage: string): boolean {
  // 明确标记跳过
  if (commitMessage.includes('[skip-demo]')) {
    // 但大需求不能跳过
    if (isMajorFeature(files)) {
      console.error('❌ 大需求不能跳过演示测试');
      return false;
    }
    return true;
  }

  // 仅修改小需求目录
  const onlyMinorChanges = files.every(file =>
    MINOR_CHANGE_DIRS.some(dir => file.startsWith(dir)) ||
    file.endsWith('.css') ||
    file.endsWith('.md')
  );

  return onlyMinorChanges;
}
```

### 组件到演示的映射

```typescript
// scripts/component-demo-map.ts

export const COMPONENT_TO_DEMO_MAP: Record<string, string> = {
  // features 目录映射
  'src/features/auth/': 'e2e/tests/demo-modules/02-auth.spec.ts',
  'src/features/journals/': 'e2e/tests/demo-modules/01-guest.spec.ts',
  'src/features/comments/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/posts/': 'e2e/tests/demo-modules/community-posts.spec.ts',
  'src/features/admin/': 'e2e/tests/demo-modules/04-admin.spec.ts',
  'src/features/profile/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/dashboard/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/favorite/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/follow/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/badges/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/submissions/': 'e2e/tests/demo-modules/journal-submission.spec.ts',
  'src/features/announcements/': 'e2e/tests/demo-modules/01-guest.spec.ts',

  // contexts 目录映射
  'src/contexts/AuthContext': 'e2e/tests/demo-modules/02-auth.spec.ts',
  'src/contexts/ThemeContext': 'e2e/tests/demo-modules/01-guest.spec.ts',
  'src/contexts/PostContext': 'e2e/tests/demo-modules/community-posts.spec.ts',
  'src/contexts/JournalContext': 'e2e/tests/demo-modules/01-guest.spec.ts',
  'src/contexts/BadgeContext': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/contexts/ToastContext': 'e2e/tests/demo-modules/01-guest.spec.ts',

  // 通用组件映射
  'src/components/common/': 'e2e/tests/demo-modules/01-guest.spec.ts',
  'src/components/layout/': 'e2e/tests/demo-modules/01-guest.spec.ts',
};

export function getDemoFileForComponent(componentPath: string): string | null {
  for (const [pattern, demoFile] of Object.entries(COMPONENT_TO_DEMO_MAP)) {
    if (componentPath.startsWith(pattern)) {
      return demoFile;
    }
  }
  return null;
}

export function getAffectedDemos(changedFiles: string[]): string[] {
  const demos = new Set<string>();

  for (const file of changedFiles) {
    const demo = getDemoFileForComponent(file);
    if (demo) {
      demos.add(demo);
    }
  }

  return Array.from(demos);
}
```

### Hook 实现

```bash
#!/bin/sh
# .husky/pre-commit

. "$(dirname "$0")/_/husky.sh"

echo ""
echo "🔍 Running pre-commit checks..."
echo "─────────────────────────────────────────"

# 获取提交信息（用于检查 [skip-demo]）
COMMIT_MSG=$(cat .git/COMMIT_EDITMSG 2>/dev/null || echo "")

# 1. TypeScript 编译检查
echo ""
echo "📘 [1/4] TypeScript 编译检查..."
npx tsc --noEmit || {
  echo ""
  echo "❌ TypeScript 编译失败"
  echo "   请修复上述类型错误后重新提交"
  exit 1
}
echo "   ✅ 通过"

# 2. Schema 一致性检查
echo ""
echo "📋 [2/4] Schema 同步检查..."
node scripts/check-schema-sync.js || {
  echo ""
  echo "❌ Schema 与类型定义不同步"
  echo "   请运行 'npm run schema:sync' 修复"
  exit 1
}
echo "   ✅ 通过"

# 3. 演示覆盖率检查
echo ""
echo "🎬 [3/4] 演示覆盖率检查..."
node scripts/check-demo-coverage.js || {
  echo ""
  echo "⚠️  检测到新组件缺少演示测试"
  echo ""
  echo "   选项:"
  echo "   1. 添加演示测试（推荐）"
  echo "   2. 小需求可用 git commit -m '[skip-demo] your message' 跳过"
  echo "   3. 大需求（features/pages/contexts 下新增）必须添加演示"
  exit 1
}
echo "   ✅ 通过"

# 4. 运行受影响的演示测试
echo ""
echo "🧪 [4/4] 运行受影响的演示测试..."
node scripts/run-affected-demos.js --quick || {
  echo ""
  echo "❌ 演示测试失败"
  echo "   请查看上方错误报告"
  echo "   详细报告: e2e/reports/error-report.json"
  exit 1
}
echo "   ✅ 通过"

echo ""
echo "─────────────────────────────────────────"
echo "✅ 所有检查通过！"
echo ""
```

### 检查输出示例

**成功场景：**
```
🔍 Running pre-commit checks...
─────────────────────────────────────────

📘 [1/4] TypeScript 编译检查...
   ✅ 通过

📋 [2/4] Schema 同步检查...
   ✅ 通过

🎬 [3/4] 演示覆盖率检查...
   ✅ 通过

🧪 [4/4] 运行受影响的演示测试...
   运行: 02-auth.spec.ts (改动涉及 auth 模块)
   ✅ 通过 (12.3s)

─────────────────────────────────────────
✅ 所有检查通过！
```

**失败场景 - 新组件无演示：**
```
🔍 Running pre-commit checks...
─────────────────────────────────────────

📘 [1/4] TypeScript 编译检查...
   ✅ 通过

📋 [2/4] Schema 同步检查...
   ✅ 通过

🎬 [3/4] 演示覆盖率检查...

   检测到新增组件:
   ┌─────────────────────────────────────────────────────────┐
   │ + src/features/badges/components/BadgeDetail.tsx       │
   │   → 大需求 (features/ 下新增)                           │
   │   → 需要演示: e2e/tests/demo-modules/03-user.spec.ts   │
   └─────────────────────────────────────────────────────────┘

⚠️  检测到新组件缺少演示测试

   选项:
   1. 添加演示测试（推荐）
   2. 小需求可用 git commit -m '[skip-demo] your message' 跳过
   3. 大需求（features/pages/contexts 下新增）必须添加演示

❌ 提交已阻止
```

---

## Part 4: 演示覆盖率追踪

### 覆盖率维度

| 维度 | 定义 | 目标阈值 | 检查时机 |
|------|------|----------|----------|
| 组件覆盖 | 每个组件/页面是否有演示测试 | **100%** | pre-commit, CI |
| 交互覆盖 | 可点击元素是否在演示中被触发 | **100%** | CI（完整运行后） |

### 覆盖率数据结构

```typescript
// e2e/coverage/types.ts

interface ComponentCoverage {
  path: string;                    // 组件路径
  covered: boolean;                // 是否有演示
  demoFile?: string;               // 对应演示文件
  demoTests?: string[];            // 对应测试名称
  interactions: InteractionCoverage[];
}

interface InteractionCoverage {
  selector: string;                // 元素选择器
  elementType: 'button' | 'link' | 'input' | 'select' | 'other';
  description?: string;            // 元素描述（从 aria-label 等提取）
  covered: boolean;                // 是否被触发
  triggerCount: number;            // 触发次数
  triggeredInTests?: string[];     // 在哪些测试中被触发
}

interface CoverageReport {
  generatedAt: string;
  summary: {
    componentCoverage: {
      total: number;
      covered: number;
      percentage: number;
    };
    interactionCoverage: {
      total: number;
      covered: number;
      percentage: number;
    };
  };
  components: ComponentCoverage[];
  uncoveredComponents: Array<{
    path: string;
    reason: string;
    suggestedDemoFile: string;
    suggestedTestName: string;
  }>;
  uncoveredInteractions: Array<{
    componentPath: string;
    selector: string;
    elementType: string;
    description: string;
  }>;
}
```

### 交互追踪实现

```typescript
// e2e/fixtures/interaction-tracker.ts

import { Page } from '@playwright/test';

export class InteractionTracker {
  private page: Page;
  private interactions: Map<string, number> = new Map();

  constructor(page: Page) {
    this.page = page;
  }

  async start(): Promise<void> {
    // 注入追踪脚本
    await this.page.addInitScript(() => {
      (window as any).__interactionTracker = {
        clicks: {} as Record<string, number>,
        inputs: {} as Record<string, number>,
      };

      // 生成稳定的选择器
      function getSelector(el: Element): string {
        if (el.id) return `#${el.id}`;
        if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
        if (el.getAttribute('aria-label')) return `[aria-label="${el.getAttribute('aria-label')}"]`;

        const tag = el.tagName.toLowerCase();
        const classes = Array.from(el.classList).join('.');
        const text = el.textContent?.trim().slice(0, 20);

        if (classes) return `${tag}.${classes}`;
        if (text) return `${tag}:has-text("${text}")`;
        return tag;
      }

      // 监听点击
      document.addEventListener('click', (e) => {
        const target = e.target as Element;
        if (target.matches('button, a, [role="button"], input[type="submit"], input[type="checkbox"], input[type="radio"]')) {
          const selector = getSelector(target);
          (window as any).__interactionTracker.clicks[selector] =
            ((window as any).__interactionTracker.clicks[selector] || 0) + 1;
        }
      }, true);

      // 监听输入
      document.addEventListener('input', (e) => {
        const target = e.target as Element;
        if (target.matches('input, textarea, select')) {
          const selector = getSelector(target);
          (window as any).__interactionTracker.inputs[selector] =
            ((window as any).__interactionTracker.inputs[selector] || 0) + 1;
        }
      }, true);
    });
  }

  async getInteractions(): Promise<{ clicks: Record<string, number>; inputs: Record<string, number> }> {
    return await this.page.evaluate(() => (window as any).__interactionTracker || { clicks: {}, inputs: {} });
  }

  async getAllClickableElements(): Promise<string[]> {
    return await this.page.$$eval(
      'button, a, [role="button"], input[type="submit"], input[type="checkbox"], input[type="radio"]',
      els => els.map(el => {
        if (el.id) return `#${el.id}`;
        if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
        if (el.getAttribute('aria-label')) return `[aria-label="${el.getAttribute('aria-label')}"]`;
        const tag = el.tagName.toLowerCase();
        const classes = Array.from(el.classList).join('.');
        return classes ? `${tag}.${classes}` : tag;
      })
    );
  }

  async generateReport(): Promise<{
    total: number;
    covered: number;
    percentage: number;
    uncovered: string[];
  }> {
    const interactions = await this.getInteractions();
    const allClickables = await this.getAllClickableElements();
    const clickedSet = new Set(Object.keys(interactions.clicks));

    const uncovered = allClickables.filter(sel => !clickedSet.has(sel));

    return {
      total: allClickables.length,
      covered: clickedSet.size,
      percentage: allClickables.length > 0
        ? Math.round((clickedSet.size / allClickables.length) * 100)
        : 100,
      uncovered,
    };
  }
}

export function createInteractionTracker(page: Page): InteractionTracker {
  return new InteractionTracker(page);
}
```

### 覆盖率报告命令

```bash
# package.json scripts
{
  "scripts": {
    "demo:coverage": "node scripts/generate-demo-coverage.js",
    "demo:coverage:html": "node scripts/generate-demo-coverage.js --html",
    "demo:coverage:check": "node scripts/check-coverage-threshold.js"
  }
}
```

### 覆盖率报告输出

```
══════════════════════════════════════════════════════════════════════
                      演示测试覆盖率报告
══════════════════════════════════════════════════════════════════════
生成时间: 2024-01-15 10:30:00

📦 组件覆盖率: 100% (48/48)
████████████████████████████████████████████████████  100%
✅ 达标 (阈值: 100%)

🖱️ 交互覆盖率: 100% (156/156)
████████████████████████████████████████████████████  100%
✅ 达标 (阈值: 100%)

══════════════════════════════════════════════════════════════════════

📊 组件覆盖详情:

  src/features/auth/
  ├── LoginForm.tsx ✅ → 02-auth.spec.ts
  ├── RegisterForm.tsx ✅ → 02-auth.spec.ts
  └── AuthModal.tsx ✅ → 02-auth.spec.ts

  src/features/journals/
  ├── JournalCard.tsx ✅ → 01-guest.spec.ts
  ├── JournalDetailPanel.tsx ✅ → 01-guest.spec.ts
  ├── JournalsGrid.tsx ✅ → 01-guest.spec.ts
  └── SearchAndFilter.tsx ✅ → 01-guest.spec.ts

  src/features/comments/
  ├── CommentForm.tsx ✅ → 03-user.spec.ts
  ├── CommentList.tsx ✅ → 03-user.spec.ts
  └── CommentItem.tsx ✅ → 03-user.spec.ts

  ... (查看完整报告: e2e/coverage/report.html)

══════════════════════════════════════════════════════════════════════
✅ 覆盖率检查通过！
══════════════════════════════════════════════════════════════════════
```

---

## Part 5: 增强版 Demo Helpers

重构现有 `e2e/fixtures/demo-helpers.ts`，自动追踪操作步骤。

```typescript
// e2e/fixtures/demo-helpers.ts

import { Page } from '@playwright/test';
import { ErrorCollector } from './error-collector';
import { InteractionTracker } from './interaction-tracker';

let errorCollector: ErrorCollector | null = null;
let interactionTracker: InteractionTracker | null = null;

/**
 * 初始化演示测试
 */
export async function initDemo(page: Page, testName: string): Promise<{
  errorCollector: ErrorCollector;
  interactionTracker: InteractionTracker;
}> {
  errorCollector = new ErrorCollector(page, testName);
  interactionTracker = new InteractionTracker(page);

  await errorCollector.start();
  await interactionTracker.start();

  return { errorCollector, interactionTracker };
}

/**
 * 结束演示测试并生成报告
 */
export async function finishDemo(): Promise<{
  errorReport: ErrorReport;
  interactionReport: { total: number; covered: number; percentage: number; uncovered: string[] };
}> {
  if (!errorCollector || !interactionTracker) {
    throw new Error('Demo not initialized. Call initDemo() first.');
  }

  const errorReport = errorCollector.getReport();
  const interactionReport = await interactionTracker.generateReport();

  // 打印错误报告
  errorCollector.printReport();

  // 生成复现脚本（如果有错误）
  if (errorReport.totalErrors > 0) {
    const reproScript = errorCollector.generateReproScript();
    const reproPath = `e2e/repro-scripts/repro-${Date.now()}.spec.ts`;
    fs.writeFileSync(reproPath, reproScript);
    console.log(`📝 复现脚本已生成: ${reproPath}`);
  }

  return { errorReport, interactionReport };
}

/**
 * 延迟
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 显示章节标题
 */
export async function showChapterTitle(page: Page, title: string, subtitle?: string): Promise<void> {
  errorCollector?.recordStep({
    action: 'navigate',
    target: '',
    description: `章节: ${title}`,
    value: subtitle,
  });

  await page.evaluate(([t, s]) => {
    const overlay = document.createElement('div');
    overlay.id = 'demo-chapter';
    overlay.innerHTML = `
      <div style="font-size: 36px; font-weight: bold; margin-bottom: 10px;">${t}</div>
      ${s ? `<div style="font-size: 18px; opacity: 0.8;">${s}</div>` : ''}
    `;
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99999;
      background: rgba(0, 0, 0, 0.85); color: #fff;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; opacity: 0; transition: opacity 0.5s ease;
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.style.opacity = '1');
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 300);
    }, 1200);
  }, [title, subtitle] as const);

  await delay(1500);
}

/**
 * 显示浮动提示
 */
export async function showToast(page: Page, message: string, duration = 2000): Promise<void> {
  await page.evaluate(([msg, dur]) => {
    const existing = document.getElementById('demo-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'demo-toast';
    toast.textContent = msg;
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 99999;
      background: rgba(0, 0, 0, 0.9); color: #fff;
      padding: 14px 24px; border-radius: 8px; font-size: 16px; font-weight: 500;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      transform: translateX(100%); opacity: 0; transition: all 0.3s ease;
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, dur);
  }, [message, duration] as const);
}

/**
 * 高亮元素
 */
export async function highlight(page: Page, selector: string): Promise<void> {
  try {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLElement;
      if (el) {
        el.style.outline = '3px solid #ff4444';
        el.style.outlineOffset = '2px';
        el.style.transition = 'outline 0.2s ease';
        setTimeout(() => {
          el.style.outline = '';
          el.style.outlineOffset = '';
        }, 1000);
      }
    }, selector);
  } catch {
    // 元素可能不存在
  }
}

/**
 * 演示点击
 */
export async function demoClick(page: Page, selector: string, description: string): Promise<void> {
  errorCollector?.recordStep({
    action: 'click',
    target: selector,
    description,
  });

  await showToast(page, description);
  await delay(200);
  await highlight(page, selector);
  await delay(400);
  await page.locator(selector).first().click();
  await delay(500);
}

/**
 * 演示输入（逐字）
 */
export async function demoType(page: Page, selector: string, text: string, description: string): Promise<void> {
  errorCollector?.recordStep({
    action: 'type',
    target: selector,
    description,
    value: text,
  });

  await showToast(page, description);
  await highlight(page, selector);
  await delay(300);

  const input = page.locator(selector);
  await input.click();
  for (const char of text) {
    await input.type(char, { delay: 50 });
  }
  await delay(500);
}

/**
 * 演示填充（快速）
 */
export async function demoFill(page: Page, selector: string, text: string, description: string): Promise<void> {
  errorCollector?.recordStep({
    action: 'type',
    target: selector,
    description,
    value: text,
  });

  await showToast(page, description);
  await highlight(page, selector);
  await delay(300);
  await page.locator(selector).fill(text);
  await delay(500);
}

/**
 * 演示选择
 */
export async function demoSelect(page: Page, selector: string, value: string, description: string): Promise<void> {
  errorCollector?.recordStep({
    action: 'select',
    target: selector,
    description,
    value,
  });

  await showToast(page, description);
  await highlight(page, selector);
  await delay(300);
  await page.locator(selector).selectOption(value);
  await delay(500);
}

/**
 * 演示滚动
 */
export async function demoScroll(page: Page, direction: 'down' | 'up', amount = 300, description?: string): Promise<void> {
  errorCollector?.recordStep({
    action: 'scroll',
    target: 'window',
    description: description || `滚动${direction === 'down' ? '向下' : '向上'}`,
    value: String(amount),
  });

  if (description) {
    await showToast(page, description);
  }
  const delta = direction === 'down' ? amount : -amount;
  await page.mouse.wheel(0, delta);
  await delay(600);
}

/**
 * 演示悬停
 */
export async function demoHover(page: Page, selector: string, description: string): Promise<void> {
  errorCollector?.recordStep({
    action: 'hover',
    target: selector,
    description,
  });

  await showToast(page, description);
  await highlight(page, selector);
  await delay(300);
  await page.locator(selector).hover();
  await delay(500);
}

/**
 * 演示等待
 */
export async function demoWait(page: Page, selector: string, description: string): Promise<void> {
  errorCollector?.recordStep({
    action: 'wait',
    target: selector,
    description,
  });

  await showToast(page, description);
  await page.waitForSelector(selector, { timeout: 10000 });
  await highlight(page, selector);
  await delay(300);
}

/**
 * 演示操作（通用高亮 + 提示）
 */
export async function demoAction(page: Page, selector: string, description: string, delayMs = 400): Promise<void> {
  await showToast(page, description);
  await delay(200);
  await highlight(page, selector);
  await delay(delayMs);
}

/**
 * 控制台日志
 */
export function log(emoji: string, message: string): void {
  console.log(`${emoji} ${message}`);
}
```

---

## 新增文件清单

```
journal-forum/
├── shared/                                    # 🆕 前后端共享
│   ├── schemas/
│   │   ├── user.schema.ts
│   │   ├── journal.schema.ts
│   │   ├── comment.schema.ts
│   │   ├── post.schema.ts
│   │   ├── badge.schema.ts
│   │   ├── submission.schema.ts
│   │   ├── announcement.schema.ts
│   │   ├── api-response.schema.ts
│   │   └── index.ts
│   └── types/
│       └── index.ts
│
├── e2e/
│   ├── fixtures/
│   │   ├── demo-helpers.ts                    # 🔄 重构
│   │   ├── error-collector.ts                 # 🆕
│   │   ├── interaction-tracker.ts             # 🆕
│   │   └── schema-validator.ts                # 🆕
│   ├── tests/
│   │   └── demo-modules/
│   │       ├── 01-guest.spec.ts               # 🔄 重构
│   │       ├── 02-auth.spec.ts                # 🔄 重构
│   │       ├── 03-user.spec.ts                # 🔄 重构
│   │       ├── 04-admin.spec.ts               # 🔄 重构
│   │       ├── community-posts.spec.ts        # 🔄 重构
│   │       └── journal-submission.spec.ts     # 🔄 重构
│   ├── coverage/
│   │   ├── demo-coverage.json                 # 🆕 覆盖率数据
│   │   └── report.html                        # 🆕 HTML 报告
│   ├── repro-scripts/                         # 🆕 自动生成
│   └── screenshots/                           # 🆕 错误截图
│
├── scripts/
│   ├── check-schema-sync.js                   # 🆕
│   ├── check-demo-coverage.js                 # 🆕
│   ├── run-affected-demos.js                  # 🆕
│   ├── generate-demo-coverage.js              # 🆕
│   ├── check-coverage-threshold.js            # 🆕
│   └── component-demo-map.ts                  # 🆕
│
├── .husky/
│   └── pre-commit                             # 🆕
│
└── package.json                               # 🔄 添加 zod 和新 scripts
```

---

## 实现优先级

| 优先级 | 任务 | 依赖 |
|--------|------|------|
| P0-1 | 安装 zod，配置 TypeScript 路径 | 无 |
| P0-2 | 创建 shared/schemas，全量迁移类型 | P0-1 |
| P0-3 | 更新前端 src/types 重新导出 | P0-2 |
| P0-4 | 实现 error-collector.ts | 无 |
| P0-5 | 实现 interaction-tracker.ts | 无 |
| P0-6 | 重构 demo-helpers.ts | P0-4, P0-5 |
| P1-1 | 重构所有演示测试 | P0-6 |
| P1-2 | 实现 schema-validator.ts（E2E 层验证） | P0-2 |
| P1-3 | 实现 Git Hook 脚本 | P0-2, P1-1 |
| P1-4 | 实现覆盖率追踪脚本 | P0-5, P1-1 |
| P2-1 | 配置 Husky | P1-3 |
| P2-2 | 添加 package.json scripts | P1-3, P1-4 |

---

## 验收标准

- [ ] `shared/schemas/` 包含所有类型的 Zod Schema
- [ ] 前端 `src/types/index.ts` 重新导出 shared 类型
- [ ] 所有演示测试使用增强版 demo-helpers
- [ ] 演示测试中任何 JS 错误都被捕获并报告
- [ ] 错误报告包含完整复现路径和截图
- [ ] 自动生成可执行的复现脚本
- [ ] API 响应在 E2E 测试中经过 Schema 验证
- [ ] 新增大需求组件无演示时阻止提交
- [ ] 小需求可用 `[skip-demo]` 跳过
- [ ] 组件覆盖率 100%
- [ ] 交互覆盖率 100%
- [ ] 覆盖率报告可生成（JSON + HTML）
- [ ] `npm run demo:coverage` 命令可用
- [ ] pre-commit hook 正常工作
