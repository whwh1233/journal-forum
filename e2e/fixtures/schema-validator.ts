import { Page, Response } from '@playwright/test';
// Use zod v3 compatibility mode for TypeScript 4.9 compatibility
import { z, ZodSchema } from 'zod';

/**
 * Schema 验证错误
 */
export interface SchemaValidationError {
  endpoint: string;
  method: string;
  status: number;
  expectedSchema: string;
  errors: z.ZodError['errors'];
  responseBody: unknown;
  timestamp: number;
}

/**
 * 端点匹配规则
 */
interface EndpointMatcher {
  pattern: RegExp;
  method: string;
  schema: ZodSchema;
  name: string;
}

// ============================================
// 通用 Schema 定义
// ============================================

// 基础用户信息
const UserBasicSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  role: z.enum(['user', 'admin', 'superadmin']).optional(),
});

// 登录响应
const LoginResponseSchema = z.object({
  token: z.string(),
  user: UserBasicSchema,
});

// 注册响应
const RegisterResponseSchema = z.object({
  message: z.string(),
  user: UserBasicSchema.optional(),
  token: z.string().optional(),
});

// 期刊基础信息
const JournalBasicSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  issn: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
});

// 期刊列表响应
const JournalListResponseSchema = z.object({
  journals: z.array(JournalBasicSchema),
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

// 期刊详情响应
const JournalDetailResponseSchema = JournalBasicSchema.extend({
  averageRating: z.number().optional(),
  commentCount: z.number().optional(),
  impactFactor: z.number().optional().nullable(),
});

// 评论信息
const CommentSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  userId: z.string().uuid(),
  journalId: z.string().uuid().optional(),
  postId: z.string().uuid().optional(),
  parentId: z.string().uuid().nullable().optional(),
  createdAt: z.string().or(z.date()),
});

// 评论列表响应
const CommentListResponseSchema = z.object({
  comments: z.array(CommentSchema),
  total: z.number().optional(),
});

// 帖子信息
const PostSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  userId: z.string().uuid(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  viewCount: z.number().optional(),
  likeCount: z.number().optional(),
  createdAt: z.string().or(z.date()),
});

// 帖子列表响应
const PostListResponseSchema = z.object({
  posts: z.array(PostSchema),
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

// 通用成功响应
const SuccessResponseSchema = z.object({
  message: z.string(),
  success: z.boolean().optional(),
});

// 通用错误响应
const ErrorResponseSchema = z.object({
  message: z.string().optional(),
  error: z.string().optional(),
  errors: z.array(z.unknown()).optional(),
});

// 分页元数据
const PaginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number().optional(),
});

// ============================================
// 端点到 Schema 的映射
// ============================================

/**
 * API 端点 Schema 映射
 * 用于验证各 API 响应是否符合预期格式
 */
export const ENDPOINT_SCHEMAS: EndpointMatcher[] = [
  // 认证相关
  {
    pattern: /\/api\/auth\/login$/,
    method: 'POST',
    schema: LoginResponseSchema,
    name: 'Login',
  },
  {
    pattern: /\/api\/auth\/register$/,
    method: 'POST',
    schema: RegisterResponseSchema,
    name: 'Register',
  },
  {
    pattern: /\/api\/auth\/me$/,
    method: 'GET',
    schema: UserBasicSchema,
    name: 'GetCurrentUser',
  },

  // 期刊相关
  {
    pattern: /\/api\/journals$/,
    method: 'GET',
    schema: JournalListResponseSchema,
    name: 'GetJournals',
  },
  {
    pattern: /\/api\/journals\/[^/]+$/,
    method: 'GET',
    schema: JournalDetailResponseSchema,
    name: 'GetJournalDetail',
  },
  {
    pattern: /\/api\/journals\/search/,
    method: 'GET',
    schema: JournalListResponseSchema,
    name: 'SearchJournals',
  },

  // 评论相关
  {
    pattern: /\/api\/comments$/,
    method: 'GET',
    schema: CommentListResponseSchema,
    name: 'GetComments',
  },
  {
    pattern: /\/api\/comments$/,
    method: 'POST',
    schema: CommentSchema,
    name: 'CreateComment',
  },

  // 帖子相关
  {
    pattern: /\/api\/posts$/,
    method: 'GET',
    schema: PostListResponseSchema,
    name: 'GetPosts',
  },
  {
    pattern: /\/api\/posts$/,
    method: 'POST',
    schema: PostSchema,
    name: 'CreatePost',
  },
  {
    pattern: /\/api\/posts\/[^/]+$/,
    method: 'GET',
    schema: PostSchema,
    name: 'GetPostDetail',
  },

  // 收藏相关
  {
    pattern: /\/api\/favorites/,
    method: 'POST',
    schema: SuccessResponseSchema,
    name: 'ToggleFavorite',
  },
  {
    pattern: /\/api\/favorites/,
    method: 'GET',
    schema: z.object({
      favorites: z.array(z.unknown()),
    }),
    name: 'GetFavorites',
  },

  // 关注相关
  {
    pattern: /\/api\/follows/,
    method: 'POST',
    schema: SuccessResponseSchema,
    name: 'ToggleFollow',
  },
];

/**
 * Schema 验证器 - 验证 API 响应是否符合预期格式
 */
export class SchemaValidator {
  private page: Page;
  private errors: SchemaValidationError[] = [];
  private isStarted = false;
  private validateOnlySuccessful = true;

  constructor(page: Page, options?: { validateOnlySuccessful?: boolean }) {
    this.page = page;
    if (options?.validateOnlySuccessful !== undefined) {
      this.validateOnlySuccessful = options.validateOnlySuccessful;
    }
  }

  /**
   * 启动验证器 - 监听所有 API 响应
   */
  async start(): Promise<void> {
    if (this.isStarted) return;
    this.isStarted = true;

    this.page.on('response', async (response: Response) => {
      await this.handleResponse(response);
    });
  }

  /**
   * 处理响应并验证
   */
  private async handleResponse(response: Response): Promise<void> {
    const url = response.url();
    const method = response.request().method();
    const status = response.status();

    // 只验证 API 请求
    if (!url.includes('/api/')) return;

    // 默认只验证成功的响应
    if (this.validateOnlySuccessful && status >= 400) return;

    // 查找匹配的 schema
    const matcher = this.findMatcher(url, method);
    if (!matcher) return;

    // 获取响应体
    let body: unknown;
    try {
      const contentType = response.headers()['content-type'] || '';
      if (!contentType.includes('application/json')) return;

      body = await response.json();
    } catch {
      // 无法解析 JSON，跳过
      return;
    }

    // 验证响应
    await this.validateResponse(url, method, status, matcher, body);
  }

  /**
   * 查找匹配的 schema
   */
  private findMatcher(
    url: string,
    method: string
  ): EndpointMatcher | undefined {
    const path = new URL(url).pathname;
    return ENDPOINT_SCHEMAS.find(
      (m) =>
        m.pattern.test(path) && m.method.toUpperCase() === method.toUpperCase()
    );
  }

  /**
   * 验证响应是否符合 schema
   */
  async validateResponse(
    url: string,
    method: string,
    status: number,
    matcher: EndpointMatcher,
    body: unknown
  ): Promise<boolean> {
    const result = matcher.schema.safeParse(body);

    if (!result.success) {
      this.errors.push({
        endpoint: url,
        method,
        status,
        expectedSchema: matcher.name,
        errors: result.error.errors,
        responseBody: body,
        timestamp: Date.now(),
      });
      return false;
    }

    return true;
  }

  /**
   * 手动验证单个响应
   */
  validateManual(
    schemaName: string,
    body: unknown
  ): { valid: boolean; errors?: z.ZodError['errors'] } {
    const matcher = ENDPOINT_SCHEMAS.find((m) => m.name === schemaName);
    if (!matcher) {
      return { valid: false, errors: [{ message: `Unknown schema: ${schemaName}`, code: 'custom', path: [] }] as z.ZodError['errors'] };
    }

    const result = matcher.schema.safeParse(body);
    if (!result.success) {
      return { valid: false, errors: result.error.errors };
    }

    return { valid: true };
  }

  /**
   * 获取所有验证错误
   */
  getErrors(): SchemaValidationError[] {
    return [...this.errors];
  }

  /**
   * 检查是否有验证错误
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * 获取特定端点的错误
   */
  getErrorsForEndpoint(pattern: string | RegExp): SchemaValidationError[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return this.errors.filter((e) => regex.test(e.endpoint));
  }

  /**
   * 控制台输出错误
   */
  printErrors(): void {
    console.log('\n========================================');
    console.log('      SCHEMA VALIDATION REPORT          ');
    console.log('========================================\n');

    if (this.errors.length === 0) {
      console.log('No schema validation errors.');
      return;
    }

    console.log(`Total Validation Errors: ${this.errors.length}`);
    console.log('');

    for (const error of this.errors) {
      console.log(`--- ${error.expectedSchema} ---`);
      console.log(`  Endpoint: ${error.method} ${error.endpoint}`);
      console.log(`  Status: ${error.status}`);
      console.log(`  Time: ${new Date(error.timestamp).toLocaleTimeString()}`);
      console.log('  Validation Errors:');

      for (const e of error.errors) {
        console.log(`    - Path: ${e.path.join('.')}`);
        console.log(`      Message: ${e.message}`);
      }

      console.log('  Response Body (preview):');
      const bodyStr = JSON.stringify(error.responseBody, null, 2);
      const preview = bodyStr.slice(0, 500);
      console.log(
        `    ${preview}${bodyStr.length > 500 ? '\n    ...(truncated)' : ''}`
      );
      console.log('');
    }

    console.log('========================================\n');
  }

  /**
   * 生成验证报告
   */
  generateReport(): {
    totalValidated: number;
    totalErrors: number;
    errorsByEndpoint: Record<string, number>;
    errorsBySchema: Record<string, number>;
  } {
    const errorsByEndpoint: Record<string, number> = {};
    const errorsBySchema: Record<string, number> = {};

    for (const error of this.errors) {
      const endpoint = error.endpoint.replace(/\/[a-f0-9-]{36}/g, '/:id');
      errorsByEndpoint[endpoint] = (errorsByEndpoint[endpoint] || 0) + 1;
      errorsBySchema[error.expectedSchema] =
        (errorsBySchema[error.expectedSchema] || 0) + 1;
    }

    return {
      totalValidated: 0, // 无法准确统计成功验证的数量
      totalErrors: this.errors.length,
      errorsByEndpoint,
      errorsBySchema,
    };
  }

  /**
   * 清空错误记录
   */
  clear(): void {
    this.errors = [];
  }

  /**
   * 停止验证器
   */
  stop(): void {
    this.isStarted = false;
  }
}

/**
 * 工厂函数 - 创建 Schema 验证器实例
 */
export function createSchemaValidator(
  page: Page,
  options?: { validateOnlySuccessful?: boolean }
): SchemaValidator {
  return new SchemaValidator(page, options);
}

/**
 * 便捷函数 - 创建并启动 Schema 验证器
 */
export async function startSchemaValidator(
  page: Page,
  options?: { validateOnlySuccessful?: boolean }
): Promise<SchemaValidator> {
  const validator = createSchemaValidator(page, options);
  await validator.start();
  return validator;
}

// ============================================
// 导出 Schema 供外部使用
// ============================================

export const Schemas = {
  UserBasic: UserBasicSchema,
  Login: LoginResponseSchema,
  Register: RegisterResponseSchema,
  JournalBasic: JournalBasicSchema,
  JournalList: JournalListResponseSchema,
  JournalDetail: JournalDetailResponseSchema,
  Comment: CommentSchema,
  CommentList: CommentListResponseSchema,
  Post: PostSchema,
  PostList: PostListResponseSchema,
  Success: SuccessResponseSchema,
  Error: ErrorResponseSchema,
  PaginationMeta: PaginationMetaSchema,
};
