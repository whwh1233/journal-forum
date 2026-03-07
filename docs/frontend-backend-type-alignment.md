# 前后端类型对接方案

> **目标**: 解决前后端 API 数据结构不一致导致的运行时错误，建立类型安全的数据流转机制

---

## 1. 问题分析

### 1.1 典型问题场景

| 场景 | 后端返回 | 前端期望 | 错误类型 |
|------|----------|----------|----------|
| reviews 字段 | `[{author, content}]` 数组 | `number` 数字 | React 渲染对象报错 |
| dimensionAverages | `null` 或不存在 | `{}` 对象 | Cannot read property of null |
| rating | `"4.5"` 字符串 | `number` 数字 | toFixed is not a function |
| createdAt | `"2026-03-07T10:00:00Z"` | `Date` 对象 | 日期格式化失败 |

### 1.2 根本原因

1. **无共享类型定义** - 前后端各自定义类型，缺乏单一数据源
2. **Service 层缺少转换** - API 响应直接透传到组件，无中间处理
3. **TypeScript 编译时无法验证运行时数据** - 类型断言 `as` 绕过了类型检查
4. **后端返回结构不稳定** - 同一字段在不同接口返回不同格式

---

## 2. 解决方案

### 方案 A: Service 层强制转换（推荐 - 最小改动）

**原则**: 所有 API 响应必须在 Service 层转换为前端期望的格式

```
API Response → Service Layer (转换) → 组件使用
     ↓              ↓                    ↓
  原始格式      normalizeXxx()        安全类型
```

**优点**: 改动小，向后兼容，不需要修改后端
**缺点**: 每个 Service 都需要手动转换

### 方案 B: 共享类型包（长期方案）

**原则**: 前后端使用同一套类型定义

```
shared-types/           # 独立 npm 包
├── src/
│   ├── journal.ts      # Journal 类型
│   ├── user.ts         # User 类型
│   └── api-response.ts # API 响应包装
├── package.json
└── tsconfig.json
```

**优点**: 类型单一来源，编译时即可发现不一致
**缺点**: 需要搭建 monorepo 或私有 npm 包

### 方案 C: 运行时校验（Zod/Yup）

**原则**: 使用 Schema 校验库在运行时验证 API 响应

```typescript
import { z } from 'zod';

const JournalSchema = z.object({
  id: z.number(),
  title: z.string(),
  reviews: z.union([z.number(), z.array(z.any())]).transform(v =>
    Array.isArray(v) ? v.length : v
  )
});

const journal = JournalSchema.parse(apiResponse);
```

**优点**: 运行时保证类型正确，自动转换
**缺点**: 增加包体积，需要学习新库

### 方案 D: OpenAPI/Swagger 代码生成

**原则**: 从 API 文档自动生成前端类型和请求函数

```
后端 OpenAPI 定义 → openapi-generator → 前端 TypeScript 类型 + API 客户端
```

**优点**: 类型自动同步，减少手工维护
**缺点**: 需要后端维护 OpenAPI 文档

---

## 3. 推荐实施路径

### 第一阶段: Service 层转换（立即执行）

1. **创建类型守卫工具**

```typescript
// src/utils/apiTransformers.ts

/** 安全转换为数字 */
export const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') return value;
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'string') return parseFloat(value) || fallback;
  return fallback;
};

/** 安全转换为对象 */
export const toObject = <T extends object>(value: unknown, fallback: T): T => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as T;
  }
  return fallback;
};

/** 安全转换为数组 */
export const toArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value;
  return [];
};
```

2. **在 Service 层使用转换函数**

```typescript
// src/services/journalSearchService.ts
import { toNumber, toObject } from '@/utils/apiTransformers';

export const searchJournals = async (params): Promise<JournalSearchResponse> => {
  const response = await axios.get('/api/journals/search', { params });
  const { journals, hasMore } = response.data.data;

  return {
    results: journals.map(j => ({
      id: j.id,
      title: j.title,
      issn: j.issn,
      category: j.category,
      rating: toNumber(j.rating),
      reviews: toNumber(j.reviews),  // 数组自动转为 length
      description: j.description || '',
      dimensionAverages: toObject(j.dimensionAverages, {})
    })),
    total: journals.length,
    page: params.page || 1,
    limit: params.limit || 10,
    hasMore
  };
};
```

3. **组件层不再做类型兼容**

```typescript
// 组件中直接使用，无需判断类型
<span>{journal.reviews} 条评论</span>  // 保证是数字
```

### 第二阶段: 统一响应格式（后端配合）

1. **定义标准 API 响应格式**

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    details?: unknown;
  };
}
```

2. **后端统一 reviews 字段语义**

```javascript
// 方案 1: 返回 reviewCount 字段
{ reviewCount: 42 }

// 方案 2: 只在详情接口返回完整 reviews 数组
GET /journals      → { reviews: 42 }        // 列表返回数量
GET /journals/:id  → { reviews: [...] }     // 详情返回数组
```

### 第三阶段: 引入 Zod 运行时校验（可选）

```typescript
// src/schemas/journal.schema.ts
import { z } from 'zod';

export const JournalSchema = z.object({
  id: z.number(),
  title: z.string(),
  issn: z.string(),
  category: z.string(),
  rating: z.coerce.number().default(0),
  reviews: z.union([z.number(), z.array(z.any())])
    .transform(v => Array.isArray(v) ? v.length : v),
  dimensionAverages: z.record(z.number()).default({})
});

export type Journal = z.infer<typeof JournalSchema>;
```

---

## 4. 检查清单

### 新增 Service 函数时

- [ ] 定义明确的返回类型 `Promise<XxxResponse>`
- [ ] 对所有可能为 null/undefined 的字段设置默认值
- [ ] 对数组/数字/字符串类型做显式转换
- [ ] 添加错误处理和日志

### Code Review 时

- [ ] 检查是否直接透传 `response.data` 到组件
- [ ] 检查组件中是否有 `Array.isArray()` 或 `typeof` 判断（应该在 Service 层处理）
- [ ] 检查是否使用 `as any` 或 `as unknown` 绕过类型检查

### 后端接口变更时

- [ ] 通知前端更新对应 Service 层转换逻辑
- [ ] 更新 `src/types/` 中的类型定义
- [ ] 运行相关组件的单元测试

---

## 5. 现有代码修复清单

| 文件 | 问题 | 修复方案 |
|------|------|----------|
| `journalSearchService.ts` | reviews 未转换 | 添加 `toNumber(j.reviews)` |
| `JournalPicker.tsx` | 直接渲染 reviews | Service 层转换后移除兼容代码 |
| `JournalInfoCard.tsx` | 直接渲染 reviews | Service 层转换后移除兼容代码 |
| `submissionService.ts` | token key 错误 | 已修复 → `authToken` |
| `postService.ts` | token key 错误 | 已修复 → `authToken` |

---

## 6. 相关文件

- 类型定义: `src/types/index.ts`
- 转换工具: `src/utils/apiTransformers.ts`（待创建）
- Service 层: `src/services/*.ts`
- 后端模型: `backend/models/*.js`

---

**维护记录**:
- 2026-03-07: 初始版本，记录 reviews 字段类型不一致问题
