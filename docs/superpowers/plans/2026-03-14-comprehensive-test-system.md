# Comprehensive Test System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive test system that guarantees type safety, API contract validation, and zero-error user interactions with visual demo coverage.

**Architecture:** Zod schemas shared between frontend/backend for type safety. Error collector in Playwright captures all JS/API/console errors with reproduction steps. Git hooks enforce demo test coverage before commits.

**Tech Stack:** Zod (validation), Playwright (E2E), Husky (git hooks), TypeScript

**Spec Document:** `docs/superpowers/specs/2026-03-14-comprehensive-test-system-design.md`

---

## File Structure

### New Files to Create

```
shared/
├── schemas/
│   ├── user.schema.ts           # User, UserProfile, AdminUser, LoginCredentials, RegisterData
│   ├── journal.schema.ts        # Journal, JournalLevel, JournalRatingCache, Category, RatingSummary
│   ├── comment.schema.ts        # Comment, DimensionRatings, MyComment, AdminComment
│   ├── post.schema.ts           # Post, PostComment, CreatePostData, UpdatePostData, PostFilters
│   ├── badge.schema.ts          # Badge, UserBadgesResponse, MyBadgesResponse, BadgeStats
│   ├── submission.schema.ts     # Manuscript, SubmissionRecord, SubmissionStatusHistory
│   ├── common.schema.ts         # PaginationInfo, ActivityStats, Favorite, Follow
│   ├── api-response.schema.ts   # ApiResponse<T>, PaginatedResponse<T>
│   └── index.ts                 # Re-export all schemas
├── types/
│   └── index.ts                 # Re-export all inferred types

e2e/
├── fixtures/
│   ├── error-collector.ts       # Error capture with reproduction steps
│   ├── interaction-tracker.ts   # Track clickable element coverage
│   ├── schema-validator.ts      # API response validation
│   └── demo-helpers.ts          # Enhanced (refactor existing)
├── coverage/
│   └── .gitkeep
├── repro-scripts/
│   └── .gitkeep
└── screenshots/
    └── .gitkeep

scripts/
├── check-schema-sync.js         # Verify schemas match types
├── check-demo-coverage.js       # Verify new components have demos
├── run-affected-demos.js        # Run only affected demo tests
├── generate-demo-coverage.js    # Generate coverage report
├── check-coverage-threshold.js  # Enforce 100% coverage
└── component-demo-map.js        # Map components to demo files

.husky/
└── pre-commit                   # Git hook script
```

### Files to Modify

```
package.json                     # Add zod, husky, new scripts
tsconfig.json                    # Add @shared/* path alias
vite.config.ts                   # Add shared alias for bundler
src/types/index.ts               # Re-export from shared/types
e2e/tests/demo-modules/*.spec.ts # Refactor all demo tests
```

---

## Chunk 1: Foundation Setup

### Task 1: Install Dependencies and Configure Paths

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `vite.config.ts`

- [ ] **Step 1: Install zod and husky**

```bash
npm install zod
npm install -D husky
```

- [ ] **Step 2: Verify installation**

```bash
npm ls zod husky
```

Expected: Both packages listed without errors

- [ ] **Step 3: Update tsconfig.json with shared path alias**

Open `tsconfig.json` and update:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["shared/*"]
    }
  },
  "include": ["src", "shared", "e2e"]
}
```

- [ ] **Step 4: Update vite.config.ts with shared alias**

Open `vite.config.ts` and add alias:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
```

- [ ] **Step 5: Verify TypeScript configuration**

```bash
npx tsc --noEmit
```

Expected: No errors (may have existing errors unrelated to config)

- [ ] **Step 6: Commit foundation setup**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts
git commit -m "chore: add zod, husky and configure shared path alias"
```

---

### Task 2: Create Shared Directory Structure

**Files:**
- Create: `shared/schemas/.gitkeep`
- Create: `shared/types/.gitkeep`
- Create: `e2e/coverage/.gitkeep`
- Create: `e2e/repro-scripts/.gitkeep`
- Create: `e2e/screenshots/.gitkeep`
- Create: `scripts/.gitkeep`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p shared/schemas shared/types e2e/coverage e2e/repro-scripts e2e/screenshots scripts
```

- [ ] **Step 2: Add .gitkeep files**

```bash
touch shared/schemas/.gitkeep shared/types/.gitkeep e2e/coverage/.gitkeep e2e/repro-scripts/.gitkeep scripts/.gitkeep
```

- [ ] **Step 3: Add e2e directories to .gitignore exceptions**

Add to `.gitignore`:

```
# E2E test artifacts
e2e/screenshots/*
!e2e/screenshots/.gitkeep
e2e/repro-scripts/*
!e2e/repro-scripts/.gitkeep
e2e/coverage/*
!e2e/coverage/.gitkeep
```

- [ ] **Step 4: Commit directory structure**

```bash
git add shared/ e2e/coverage e2e/repro-scripts e2e/screenshots scripts/ .gitignore
git commit -m "chore: create shared and e2e directory structure"
```

---

## Chunk 2: Zod Schemas - Core Types

### Task 3: Create Common Schema

**Files:**
- Create: `shared/schemas/common.schema.ts`
- Test: Manual TypeScript check

- [ ] **Step 1: Create common.schema.ts**

```typescript
// shared/schemas/common.schema.ts
import { z } from 'zod';

// ==================== 分页信息 ====================
export const PaginationInfoSchema = z.object({
  currentPage: z.number(),
  totalPages: z.number(),
  totalItems: z.number(),
  itemsPerPage: z.number(),
});

export type PaginationInfo = z.infer<typeof PaginationInfoSchema>;

// ==================== 收藏 ====================
export const FavoriteSchema = z.object({
  id: z.number(),
  userId: z.number(),
  journalId: z.string(),
  createdAt: z.string(),
});

export type Favorite = z.infer<typeof FavoriteSchema>;

// ==================== 关注 ====================
export const FollowSchema = z.object({
  id: z.number(),
  followerId: z.number(),
  followingId: z.number(),
  createdAt: z.string(),
});

export type Follow = z.infer<typeof FollowSchema>;

// ==================== 活动统计 ====================
export const UserStatsSchema = z.object({
  commentCount: z.number(),
  favoriteCount: z.number(),
  followingCount: z.number(),
  followerCount: z.number(),
  points: z.number(),
  level: z.number(),
});

export type UserStats = z.infer<typeof UserStatsSchema>;

export const ActivityStatsSchema = z.object({
  stats: UserStatsSchema,
  recentActivity: z.array(z.any()),
});

export type ActivityStats = z.infer<typeof ActivityStatsSchema>;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc shared/schemas/common.schema.ts --noEmit --esModuleInterop --moduleResolution node
```

Expected: No errors

- [ ] **Step 3: Commit common schema**

```bash
git add shared/schemas/common.schema.ts
git commit -m "feat(schema): add common schemas - pagination, favorite, follow, stats"
```

---

### Task 4: Create User Schema

**Files:**
- Create: `shared/schemas/user.schema.ts`

- [ ] **Step 1: Create user.schema.ts**

```typescript
// shared/schemas/user.schema.ts
import { z } from 'zod';
import { UserStatsSchema } from './common.schema';

// ==================== 角色枚举 ====================
export const UserRoleSchema = z.enum(['user', 'admin', 'superadmin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// ==================== 基础用户 ====================
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  role: UserRoleSchema.optional(),
});

export type User = z.infer<typeof UserSchema>;

// ==================== 用户资料 ====================
export const UserProfileSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  institution: z.string().optional(),
  website: z.string().optional(),
  role: UserRoleSchema,
  createdAt: z.string(),
  pinnedBadges: z.array(z.number()).optional(),
  stats: UserStatsSchema.optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// ==================== 管理员用户视图 ====================
export const AdminUserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().optional(),
  role: UserRoleSchema,
  status: z.enum(['active', 'disabled']),
  createdAt: z.string(),
  commentCount: z.number(),
});

export type AdminUser = z.infer<typeof AdminUserSchema>;

// ==================== 登录凭证 ====================
export const LoginCredentialsSchema = z.object({
  email: z.string().email({ message: '邮箱格式不正确' }),
  password: z.string().min(1, { message: '请输入密码' }),
});

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

// ==================== 注册数据 ====================
export const RegisterDataSchema = z.object({
  email: z.string().email({ message: '邮箱格式不正确' }),
  password: z.string().min(6, { message: '密码至少6位' }),
  confirmPassword: z.string().min(6, { message: '请确认密码' }),
  name: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

export type RegisterData = z.infer<typeof RegisterDataSchema>;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc shared/schemas/user.schema.ts --noEmit --esModuleInterop --moduleResolution node
```

Expected: No errors

- [ ] **Step 3: Commit user schema**

```bash
git add shared/schemas/user.schema.ts
git commit -m "feat(schema): add user schemas - User, UserProfile, AdminUser, credentials"
```

---

### Task 5: Create Journal Schema

**Files:**
- Create: `shared/schemas/journal.schema.ts`

- [ ] **Step 1: Create journal.schema.ts**

```typescript
// shared/schemas/journal.schema.ts
import { z } from 'zod';

// ==================== 多维评分 ====================
export const DimensionRatingsSchema = z.object({
  reviewSpeed: z.number().optional(),
  editorAttitude: z.number().optional(),
  acceptDifficulty: z.number().optional(),
  reviewQuality: z.number().optional(),
  overallExperience: z.number().optional(),
});

export type DimensionRatings = z.infer<typeof DimensionRatingsSchema>;

export const DIMENSION_LABELS: Record<string, string> = {
  reviewSpeed: '审稿速度',
  editorAttitude: '编辑态度',
  acceptDifficulty: '录用难度',
  reviewQuality: '审稿质量',
  overallExperience: '综合体验',
};

export const DIMENSION_KEYS = [
  'reviewSpeed',
  'editorAttitude',
  'acceptDifficulty',
  'reviewQuality',
  'overallExperience',
] as const;

// ==================== 期刊评分缓存 ====================
export const JournalRatingCacheSchema = z.object({
  journalId: z.string(),
  rating: z.number(),
  ratingCount: z.number(),
  reviewSpeed: z.number().optional(),
  editorAttitude: z.number().optional(),
  acceptDifficulty: z.number().optional(),
  reviewQuality: z.number().optional(),
  overallExperience: z.number().optional(),
});

export type JournalRatingCache = z.infer<typeof JournalRatingCacheSchema>;

// ==================== 期刊 ====================
export const JournalSchema = z.object({
  journalId: z.string(),
  name: z.string(),
  supervisor: z.string().optional(),
  sponsor: z.string().optional(),
  issn: z.string().optional(),
  cn: z.string().optional(),
  publicationCycle: z.string().optional(),
  articleCount: z.number().optional(),
  avgCitations: z.number().optional(),
  impactFactor: z.number().optional(),
  totalCitations: z.number().optional(),
  downloadCount: z.number().optional(),
  fundPaperCount: z.number().optional(),
  otherCitationRate: z.number().optional(),
  fundPaperRate: z.string().optional(),
  coverImageUrl: z.string().optional(),
  formerName: z.string().optional(),
  editorInChief: z.string().optional(),
  language: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  introduction: z.string().optional(),
  mainColumns: z.array(z.string()).optional(),
  awards: z.array(z.string()).optional(),
  indexingHistory: z.array(z.string()).optional(),
  levels: z.array(z.string()).optional(),
  ratingCache: JournalRatingCacheSchema.optional(),
  category: z.string().optional(),
});

export type Journal = z.infer<typeof JournalSchema>;

// ==================== 期刊级别 ====================
export const JournalLevelSchema = z.object({
  id: z.number(),
  journalId: z.string(),
  levelName: z.string(),
});

export type JournalLevel = z.infer<typeof JournalLevelSchema>;

// ==================== 期刊分类 ====================
export const CategorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    id: z.number(),
    name: z.string(),
    level: z.number().optional(),
    parentId: z.number().optional(),
    journalCount: z.number().optional(),
    children: z.array(CategorySchema).optional(),
  })
);

export interface Category {
  id: number;
  name: string;
  level?: number;
  parentId?: number;
  journalCount?: number;
  children?: Category[];
}

// ==================== 评分摘要 ====================
export const RatingSummarySchema = z.object({
  journalId: z.string(),
  rating: z.number(),
  ratingCount: z.number(),
  dimensionAverages: DimensionRatingsSchema,
  dimensionLabels: z.record(z.string()),
});

export type RatingSummary = z.infer<typeof RatingSummarySchema>;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc shared/schemas/journal.schema.ts --noEmit --esModuleInterop --moduleResolution node
```

Expected: No errors

- [ ] **Step 3: Commit journal schema**

```bash
git add shared/schemas/journal.schema.ts
git commit -m "feat(schema): add journal schemas - Journal, Category, RatingSummary"
```

---

### Task 6: Create Comment Schema

**Files:**
- Create: `shared/schemas/comment.schema.ts`

- [ ] **Step 1: Create comment.schema.ts**

```typescript
// shared/schemas/comment.schema.ts
import { z } from 'zod';
import { DimensionRatingsSchema } from './journal.schema';
import { BadgeSchema } from './badge.schema';

// ==================== 评论（递归结构） ====================
export const CommentSchema: z.ZodType<Comment> = z.lazy(() =>
  z.object({
    id: z.string(),
    userId: z.number(),
    userName: z.string(),
    journalId: z.string(),
    parentId: z.string().nullable(),
    content: z.string(),
    rating: z.number().optional(),
    dimensionRatings: DimensionRatingsSchema.optional(),
    likes: z.array(z.string()).optional(),
    likeCount: z.number().optional(),
    isLikedByMe: z.boolean().optional(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
    isDeleted: z.boolean(),
    replies: z.array(CommentSchema).optional(),
    userBadges: z.array(BadgeSchema).optional(),
  })
);

export interface Comment {
  id: string;
  userId: number;
  userName: string;
  journalId: string;
  parentId: string | null;
  content: string;
  rating?: number;
  dimensionRatings?: z.infer<typeof DimensionRatingsSchema>;
  likes?: string[];
  likeCount?: number;
  isLikedByMe?: boolean;
  createdAt: string;
  updatedAt?: string;
  isDeleted: boolean;
  replies?: Comment[];
  userBadges?: z.infer<typeof BadgeSchema>[];
}

// ==================== 我的评论 ====================
export const MyCommentSchema = z.object({
  id: z.string(),
  journalId: z.string(),
  journalName: z.string(),
  content: z.string(),
  rating: z.number().optional(),
  createdAt: z.string(),
});

export type MyComment = z.infer<typeof MyCommentSchema>;

// ==================== 管理员评论视图 ====================
export const AdminCommentSchema = z.object({
  id: z.string(),
  journalId: z.string(),
  journalName: z.string(),
  author: z.string(),
  rating: z.number(),
  content: z.string(),
  createdAt: z.string(),
});

export type AdminComment = z.infer<typeof AdminCommentSchema>;

// ==================== 管理统计 ====================
export const AdminStatsSchema = z.object({
  userCount: z.number(),
  journalCount: z.number(),
  commentCount: z.number(),
});

export type AdminStats = z.infer<typeof AdminStatsSchema>;
```

- [ ] **Step 2: Note - This depends on badge.schema.ts, create placeholder first**

Create temporary placeholder for Badge import to pass compilation.

- [ ] **Step 3: Commit comment schema (after badge schema is created)**

```bash
git add shared/schemas/comment.schema.ts
git commit -m "feat(schema): add comment schemas - Comment, MyComment, AdminComment"
```

---

### Task 7: Create Badge Schema

**Files:**
- Create: `shared/schemas/badge.schema.ts`

- [ ] **Step 1: Create badge.schema.ts**

```typescript
// shared/schemas/badge.schema.ts
import { z } from 'zod';

// ==================== 徽章分类 ====================
export const BadgeCategorySchema = z.enum(['activity', 'identity', 'honor']);
export type BadgeCategory = z.infer<typeof BadgeCategorySchema>;

// ==================== 徽章类型 ====================
export const BadgeTypeSchema = z.enum(['auto', 'manual']);
export type BadgeType = z.infer<typeof BadgeTypeSchema>;

// ==================== 触发条件 ====================
export const TriggerConditionSchema = z.object({
  metric: z.string(),
  threshold: z.number(),
});

export type TriggerCondition = z.infer<typeof TriggerConditionSchema>;

// ==================== 徽章 ====================
export const BadgeSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  color: z.string(),
  category: BadgeCategorySchema,
  type: BadgeTypeSchema,
  triggerCondition: TriggerConditionSchema.optional(),
  priority: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  grantedAt: z.string().optional(),
  isNew: z.boolean().optional(),
  grantedBy: z.number().optional(),
  holderCount: z.number().optional(),
});

export type Badge = z.infer<typeof BadgeSchema>;

// ==================== 用户徽章响应 ====================
export const UserBadgesResponseSchema = z.object({
  badges: z.array(BadgeSchema),
  pinnedBadges: z.array(BadgeSchema),
});

export type UserBadgesResponse = z.infer<typeof UserBadgesResponseSchema>;

// ==================== 我的徽章响应 ====================
export const MyBadgesResponseSchema = z.object({
  badges: z.array(BadgeSchema),
  pinnedBadges: z.array(BadgeSchema),
  hasNewBadges: z.boolean(),
});

export type MyBadgesResponse = z.infer<typeof MyBadgesResponseSchema>;

// ==================== 徽章统计 ====================
export const BadgeStatsSchema = z.object({
  totalBadges: z.number(),
  activeBadges: z.number(),
  inactiveBadges: z.number(),
  byType: z.object({
    auto: z.number(),
    manual: z.number(),
    identity: z.number(),
  }),
  totalGrants: z.number(),
  usersWithBadges: z.number(),
  topBadges: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      icon: z.string(),
      count: z.number(),
    })
  ),
  recentGrants: z.array(
    z.object({
      userBadgeId: z.number(),
      badge: z
        .object({
          id: z.number(),
          name: z.string(),
          icon: z.string(),
        })
        .nullable(),
      user: z
        .object({
          id: z.number(),
          name: z.string(),
          email: z.string(),
        })
        .nullable(),
      grantedAt: z.string(),
    })
  ),
});

export type BadgeStats = z.infer<typeof BadgeStatsSchema>;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc shared/schemas/badge.schema.ts --noEmit --esModuleInterop --moduleResolution node
```

Expected: No errors

- [ ] **Step 3: Commit badge schema**

```bash
git add shared/schemas/badge.schema.ts
git commit -m "feat(schema): add badge schemas - Badge, UserBadgesResponse, BadgeStats"
```

---

### Task 8: Create Post Schema

**Files:**
- Create: `shared/schemas/post.schema.ts`

- [ ] **Step 1: Create post.schema.ts**

```typescript
// shared/schemas/post.schema.ts
import { z } from 'zod';

// ==================== 帖子分类 ====================
export const PostCategorySchema = z.enum([
  'experience',
  'discussion',
  'question',
  'news',
  'review',
  'other',
]);
export type PostCategory = z.infer<typeof PostCategorySchema>;

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  experience: '投稿经验',
  discussion: '学术讨论',
  question: '求助问答',
  news: '资讯分享',
  review: '文献评述',
  other: '其他',
};

// ==================== 帖子状态 ====================
export const PostStatusSchema = z.enum(['published', 'draft', 'reported']);
export type PostStatus = z.infer<typeof PostStatusSchema>;

// ==================== 排序选项 ====================
export const PostSortBySchema = z.enum(['hot', 'latest', 'likes', 'comments', 'views']);
export type PostSortBy = z.infer<typeof PostSortBySchema>;

export const SORT_OPTIONS = [
  { value: 'hot', label: '综合热度' },
  { value: 'latest', label: '最新发布' },
  { value: 'likes', label: '最多点赞' },
  { value: 'comments', label: '最多回复' },
  { value: 'views', label: '最多浏览' },
];

// ==================== 帖子 ====================
export const PostSchema = z.object({
  id: z.number(),
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().optional(),
  title: z.string(),
  content: z.string(),
  category: PostCategorySchema,
  tags: z.array(z.string()),
  journalId: z.number().optional(),
  journalTitle: z.string().optional(),

  viewCount: z.number(),
  likeCount: z.number(),
  commentCount: z.number(),
  favoriteCount: z.number(),
  followCount: z.number(),
  hotScore: z.number(),

  isPinned: z.boolean(),
  isDeleted: z.boolean(),
  status: PostStatusSchema,

  userLiked: z.boolean().optional(),
  userFavorited: z.boolean().optional(),
  userFollowed: z.boolean().optional(),

  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Post = z.infer<typeof PostSchema>;

// ==================== 帖子评论（递归结构） ====================
export const PostCommentSchema: z.ZodType<PostComment> = z.lazy(() =>
  z.object({
    id: z.number(),
    postId: z.number(),
    userId: z.string(),
    userName: z.string(),
    userAvatar: z.string().optional(),
    parentId: z.number().optional(),
    content: z.string(),
    likeCount: z.number(),
    isDeleted: z.boolean(),
    userLiked: z.boolean().optional(),
    replies: z.array(PostCommentSchema).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
);

export interface PostComment {
  id: number;
  postId: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  parentId?: number;
  content: string;
  likeCount: number;
  isDeleted: boolean;
  userLiked?: boolean;
  replies?: PostComment[];
  createdAt: string;
  updatedAt: string;
}

// ==================== 创建帖子数据 ====================
export const CreatePostDataSchema = z.object({
  title: z.string().min(1, { message: '标题不能为空' }),
  content: z.string().min(1, { message: '内容不能为空' }),
  category: PostCategorySchema,
  tags: z.array(z.string()),
  journalId: z.number().optional(),
});

export type CreatePostData = z.infer<typeof CreatePostDataSchema>;

// ==================== 更新帖子数据 ====================
export const UpdatePostDataSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  category: PostCategorySchema.optional(),
  tags: z.array(z.string()).optional(),
  journalId: z.number().optional(),
});

export type UpdatePostData = z.infer<typeof UpdatePostDataSchema>;

// ==================== 创建评论数据 ====================
export const CreateCommentDataSchema = z.object({
  content: z.string().min(1, { message: '评论内容不能为空' }),
  parentId: z.number().optional(),
});

export type CreateCommentData = z.infer<typeof CreateCommentDataSchema>;

// ==================== 帖子筛选 ====================
export const PostFiltersSchema = z.object({
  category: z.string().optional(),
  tag: z.string().optional(),
  journalId: z.number().optional(),
  userId: z.string().optional(),
  sortBy: PostSortBySchema.optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
});

export type PostFilters = z.infer<typeof PostFiltersSchema>;

// ==================== 帖子分页 ====================
export const PostPaginationSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type PostPagination = z.infer<typeof PostPaginationSchema>;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc shared/schemas/post.schema.ts --noEmit --esModuleInterop --moduleResolution node
```

Expected: No errors

- [ ] **Step 3: Commit post schema**

```bash
git add shared/schemas/post.schema.ts
git commit -m "feat(schema): add post schemas - Post, PostComment, CreatePostData, filters"
```

---

### Task 9: Create Submission Schema

**Files:**
- Create: `shared/schemas/submission.schema.ts`

- [ ] **Step 1: Create submission.schema.ts**

```typescript
// shared/schemas/submission.schema.ts
import { z } from 'zod';
import { JournalSchema } from './journal.schema';

// ==================== 投稿状态选项 ====================
export const SUBMISSION_STATUS_OPTIONS = [
  { value: 'submitted', label: '已投递', color: '#3b82f6' },
  { value: 'with_editor', label: '编辑处理中', color: '#8b5cf6' },
  { value: 'under_review', label: '外审中', color: '#f59e0b' },
  { value: 'major_revision', label: '大修', color: '#ef4444' },
  { value: 'minor_revision', label: '小修', color: '#f97316' },
  { value: 'revision_submitted', label: '修回已提交', color: '#6366f1' },
  { value: 'accepted', label: '录用', color: '#10b981' },
  { value: 'rejected', label: '拒稿', color: '#dc2626' },
  { value: 'withdrawn', label: '撤稿', color: '#6b7280' },
] as const;

export const getStatusLabel = (status: string): string => {
  const found = SUBMISSION_STATUS_OPTIONS.find((s) => s.value === status);
  return found ? found.label : status;
};

export const getStatusColor = (status: string): string => {
  const found = SUBMISSION_STATUS_OPTIONS.find((s) => s.value === status);
  return found ? found.color : '#6b7280';
};

// ==================== 投稿状态历史 ====================
export const SubmissionStatusHistorySchema = z.object({
  id: z.number(),
  submissionId: z.number(),
  status: z.string(),
  date: z.string(),
  note: z.string().optional(),
  createdAt: z.string(),
});

export type SubmissionStatusHistory = z.infer<typeof SubmissionStatusHistorySchema>;

// ==================== 投稿记录 ====================
export const SubmissionRecordSchema = z.object({
  id: z.number(),
  userId: z.string(),
  manuscriptId: z.number(),
  journalId: z.string().optional(),
  journalName: z.string().optional(),
  submissionDate: z.string(),
  status: z.string(),
  journal: JournalSchema.optional(),
  statusHistory: z.array(SubmissionStatusHistorySchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SubmissionRecord = z.infer<typeof SubmissionRecordSchema>;

// ==================== 稿件 ====================
export const ManuscriptSchema = z.object({
  id: z.number(),
  userId: z.string(),
  title: z.string(),
  currentStatus: z.string(),
  submissions: z.array(SubmissionRecordSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Manuscript = z.infer<typeof ManuscriptSchema>;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc shared/schemas/submission.schema.ts --noEmit --esModuleInterop --moduleResolution node
```

Expected: No errors

- [ ] **Step 3: Commit submission schema**

```bash
git add shared/schemas/submission.schema.ts
git commit -m "feat(schema): add submission schemas - Manuscript, SubmissionRecord"
```

---

### Task 10: Create API Response Schema

**Files:**
- Create: `shared/schemas/api-response.schema.ts`

- [ ] **Step 1: Create api-response.schema.ts**

```typescript
// shared/schemas/api-response.schema.ts
import { z } from 'zod';
import { PaginationInfoSchema } from './common.schema';

// ==================== 通用 API 响应 ====================
export const createApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: dataSchema.optional(),
  });

// ==================== 成功响应（带数据） ====================
export const createSuccessResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

// ==================== 错误响应 ====================
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  error: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ==================== 带分页的响应 ====================
export const createPaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.object({
      items: z.array(itemSchema),
      pagination: PaginationInfoSchema,
    }),
  });

// ==================== 简单成功响应 ====================
export const SimpleSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
});

export type SimpleSuccessResponse = z.infer<typeof SimpleSuccessResponseSchema>;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc shared/schemas/api-response.schema.ts --noEmit --esModuleInterop --moduleResolution node
```

Expected: No errors

- [ ] **Step 3: Commit API response schema**

```bash
git add shared/schemas/api-response.schema.ts
git commit -m "feat(schema): add API response schemas - ApiResponse, PaginatedResponse"
```

---

### Task 11: Create Schema Index and Types Export

**Files:**
- Create: `shared/schemas/index.ts`
- Create: `shared/types/index.ts`

- [ ] **Step 1: Create shared/schemas/index.ts**

```typescript
// shared/schemas/index.ts

// Common
export * from './common.schema';

// User
export * from './user.schema';

// Journal
export * from './journal.schema';

// Badge (must be before comment due to dependency)
export * from './badge.schema';

// Comment
export * from './comment.schema';

// Post
export * from './post.schema';

// Submission
export * from './submission.schema';

// API Response
export * from './api-response.schema';
```

- [ ] **Step 2: Create shared/types/index.ts**

```typescript
// shared/types/index.ts
// Re-export all types from schemas

export type {
  // Common
  PaginationInfo,
  Favorite,
  Follow,
  UserStats,
  ActivityStats,
} from '../schemas/common.schema';

export type {
  // User
  UserRole,
  User,
  UserProfile,
  AdminUser,
  LoginCredentials,
  RegisterData,
} from '../schemas/user.schema';

export type {
  // Journal
  DimensionRatings,
  JournalRatingCache,
  Journal,
  JournalLevel,
  Category,
  RatingSummary,
} from '../schemas/journal.schema';

export {
  DIMENSION_LABELS,
  DIMENSION_KEYS,
} from '../schemas/journal.schema';

export type {
  // Badge
  BadgeCategory,
  BadgeType,
  TriggerCondition,
  Badge,
  UserBadgesResponse,
  MyBadgesResponse,
  BadgeStats,
} from '../schemas/badge.schema';

export type {
  // Comment
  Comment,
  MyComment,
  AdminComment,
  AdminStats,
} from '../schemas/comment.schema';

export type {
  // Post
  PostCategory,
  PostStatus,
  PostSortBy,
  Post,
  PostComment,
  CreatePostData,
  UpdatePostData,
  CreateCommentData,
  PostFilters,
  PostPagination,
} from '../schemas/post.schema';

export {
  CATEGORY_LABELS,
  SORT_OPTIONS,
} from '../schemas/post.schema';

export type {
  // Submission
  SubmissionStatusHistory,
  SubmissionRecord,
  Manuscript,
} from '../schemas/submission.schema';

export {
  SUBMISSION_STATUS_OPTIONS,
  getStatusLabel,
  getStatusColor,
} from '../schemas/submission.schema';

export type {
  // API Response
  ErrorResponse,
  SimpleSuccessResponse,
} from '../schemas/api-response.schema';
```

- [ ] **Step 3: Verify all schemas compile together**

```bash
npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 4: Commit index files**

```bash
git add shared/schemas/index.ts shared/types/index.ts
git commit -m "feat(schema): add schema and types index exports"
```

---

### Task 12: Update Frontend Types to Re-export from Shared

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/features/posts/types/post.ts`

- [ ] **Step 1: Update src/types/index.ts**

Replace the entire file with:

```typescript
// src/types/index.ts
// Re-export all types from shared schemas
export * from '../../shared/types';

// Re-export schemas for runtime validation (if needed)
export * from '../../shared/schemas';
```

- [ ] **Step 2: Update src/features/posts/types/post.ts**

Replace the entire file with:

```typescript
// src/features/posts/types/post.ts
// Re-export post types from shared
export type {
  PostCategory,
  PostStatus,
  PostSortBy,
  Post,
  PostComment,
  CreatePostData,
  UpdatePostData,
  CreateCommentData,
  PostFilters,
  PostPagination,
} from '@shared/types';

export { CATEGORY_LABELS, SORT_OPTIONS } from '@shared/types';
```

- [ ] **Step 3: Verify frontend compiles**

```bash
npx tsc --noEmit
```

Expected: No errors (may need to fix some import paths)

- [ ] **Step 4: Run frontend tests**

```bash
npm test -- --run
```

Expected: Tests pass

- [ ] **Step 5: Commit frontend type updates**

```bash
git add src/types/index.ts src/features/posts/types/post.ts
git commit -m "refactor(types): re-export types from shared schemas"
```

---

## Chunk 3: Error Collector and Interaction Tracker

### Task 13: Create Error Collector

**Files:**
- Create: `e2e/fixtures/error-collector.ts`

- [ ] **Step 1: Create error-collector.ts**

Create file `e2e/fixtures/error-collector.ts` with the full implementation from the spec document (lines 300-547).

The file should be approximately 250 lines implementing:
- `ErrorCollector` class
- `ActionStep` and `CollectedError` interfaces
- `start()` method to attach event listeners
- `recordStep()` method for tracking actions
- `captureError()` method for capturing errors with screenshots
- `getReport()` method for generating report
- `generateReproScript()` method for creating reproduction scripts
- `printReport()` method for console output
- `createErrorCollector()` factory function

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc e2e/fixtures/error-collector.ts --noEmit --esModuleInterop --moduleResolution node --target ES2020
```

Expected: No errors

- [ ] **Step 3: Commit error collector**

```bash
git add e2e/fixtures/error-collector.ts
git commit -m "feat(e2e): add error collector with reproduction steps"
```

---

### Task 14: Create Interaction Tracker

**Files:**
- Create: `e2e/fixtures/interaction-tracker.ts`

- [ ] **Step 1: Create interaction-tracker.ts**

Create file `e2e/fixtures/interaction-tracker.ts` with the full implementation from the spec document (lines 900-1001).

The file should implement:
- `InteractionTracker` class
- `start()` method to inject tracking script
- `getInteractions()` method to retrieve tracked data
- `getAllClickableElements()` method to find all clickable elements
- `generateReport()` method for coverage report
- `createInteractionTracker()` factory function

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc e2e/fixtures/interaction-tracker.ts --noEmit --esModuleInterop --moduleResolution node --target ES2020
```

Expected: No errors

- [ ] **Step 3: Commit interaction tracker**

```bash
git add e2e/fixtures/interaction-tracker.ts
git commit -m "feat(e2e): add interaction tracker for coverage"
```

---

### Task 15: Create Schema Validator for E2E

**Files:**
- Create: `e2e/fixtures/schema-validator.ts`

- [ ] **Step 1: Create schema-validator.ts**

```typescript
// e2e/fixtures/schema-validator.ts
import { Page, Response } from '@playwright/test';
import { z } from 'zod';
import * as schemas from '../../shared/schemas';

// API endpoint to schema mapping
const ENDPOINT_SCHEMAS: Record<string, z.ZodType> = {
  // Auth
  '/api/auth/login': schemas.createSuccessResponseSchema(
    z.object({
      user: schemas.UserSchema,
      token: z.string(),
    })
  ),
  '/api/auth/register': schemas.createSuccessResponseSchema(
    z.object({
      user: schemas.UserSchema,
      token: z.string(),
    })
  ),
  '/api/auth/me': schemas.createSuccessResponseSchema(
    z.object({
      user: schemas.UserProfileSchema,
    })
  ),

  // Journals
  '/api/journals': schemas.createPaginatedResponseSchema(schemas.JournalSchema),

  // Comments
  '/api/comments': schemas.createApiResponseSchema(
    z.object({
      comments: z.array(schemas.CommentSchema),
    })
  ),

  // Posts
  '/api/posts': schemas.createPaginatedResponseSchema(schemas.PostSchema),

  // Add more endpoints as needed
};

export interface SchemaValidationError {
  endpoint: string;
  method: string;
  statusCode: number;
  schemaName: string;
  zodErrors: z.ZodError['errors'];
  responseBody: unknown;
}

export class SchemaValidator {
  private page: Page;
  private errors: SchemaValidationError[] = [];
  private customSchemas: Map<string, z.ZodType> = new Map();

  constructor(page: Page) {
    this.page = page;
  }

  registerSchema(endpoint: string, schema: z.ZodType): void {
    this.customSchemas.set(endpoint, schema);
  }

  async start(): Promise<void> {
    this.page.on('response', async (response: Response) => {
      await this.validateResponse(response);
    });
  }

  private async validateResponse(response: Response): Promise<void> {
    const status = response.status();
    if (status < 200 || status >= 300) return;

    const url = new URL(response.url());
    if (!url.pathname.startsWith('/api/')) return;

    // Find matching schema
    const endpoint = this.findMatchingEndpoint(url.pathname);
    const schema = this.customSchemas.get(endpoint) || ENDPOINT_SCHEMAS[endpoint];

    if (!schema) return;

    try {
      const body = await response.json();
      schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        let responseBody: unknown;
        try {
          responseBody = await response.json();
        } catch {
          responseBody = null;
        }

        this.errors.push({
          endpoint: url.pathname,
          method: response.request().method(),
          statusCode: status,
          schemaName: endpoint,
          zodErrors: error.errors,
          responseBody,
        });
      }
    }
  }

  private findMatchingEndpoint(pathname: string): string {
    // Exact match first
    if (ENDPOINT_SCHEMAS[pathname] || this.customSchemas.has(pathname)) {
      return pathname;
    }

    // Pattern match (e.g., /api/journals/123 -> /api/journals/:id)
    const patterns = [
      ...Object.keys(ENDPOINT_SCHEMAS),
      ...this.customSchemas.keys(),
    ];

    for (const pattern of patterns) {
      const regex = new RegExp(
        '^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$'
      );
      if (regex.test(pathname)) {
        return pattern;
      }
    }

    return pathname;
  }

  getErrors(): SchemaValidationError[] {
    return this.errors;
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  clearErrors(): void {
    this.errors = [];
  }

  printErrors(): void {
    if (this.errors.length === 0) return;

    console.log('\n📋 Schema Validation Errors:');
    console.log('─'.repeat(50));

    this.errors.forEach((error, i) => {
      console.log(`\n[${i + 1}] ${error.method} ${error.endpoint}`);
      console.log(`    Status: ${error.statusCode}`);
      console.log(`    Schema: ${error.schemaName}`);
      console.log('    Errors:');
      error.zodErrors.forEach((e) => {
        console.log(`      - ${e.path.join('.')}: ${e.message}`);
      });
    });
  }
}

export function createSchemaValidator(page: Page): SchemaValidator {
  return new SchemaValidator(page);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc e2e/fixtures/schema-validator.ts --noEmit --esModuleInterop --moduleResolution node --target ES2020
```

Expected: No errors

- [ ] **Step 3: Commit schema validator**

```bash
git add e2e/fixtures/schema-validator.ts
git commit -m "feat(e2e): add schema validator for API response validation"
```

---

### Task 16: Refactor Demo Helpers

**Files:**
- Modify: `e2e/fixtures/demo-helpers.ts`

- [ ] **Step 1: Replace demo-helpers.ts with enhanced version**

Replace the entire file with the enhanced implementation from the spec document (lines 1066-1357).

Key changes:
- Add `initDemo()` function
- Add `finishDemo()` function
- Integrate `ErrorCollector` into all demo functions
- Add step recording to all interaction functions

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc e2e/fixtures/demo-helpers.ts --noEmit --esModuleInterop --moduleResolution node --target ES2020
```

Expected: No errors

- [ ] **Step 3: Commit refactored demo helpers**

```bash
git add e2e/fixtures/demo-helpers.ts
git commit -m "refactor(e2e): enhance demo-helpers with error collector integration"
```

---

## Chunk 4: Refactor Demo Tests

### Task 17: Refactor 01-guest.spec.ts

**Files:**
- Modify: `e2e/tests/demo-modules/01-guest.spec.ts`

- [ ] **Step 1: Update imports**

Add at the top of the file:

```typescript
import { test, expect } from '@playwright/test';
import { selectors, searchTerms } from '../../fixtures/test-data';
import {
  initDemo,
  finishDemo,
  delay,
  showChapterTitle,
  showToast,
  demoAction,
  demoClick,
  demoType,
  demoScroll,
  log,
} from '../../fixtures/demo-helpers';
```

- [ ] **Step 2: Add beforeEach and afterEach hooks**

```typescript
test.describe('游客场景演示', () => {
  let errorCollector: any;
  let interactionTracker: any;

  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const demo = await initDemo(page, testInfo.title);
    errorCollector = demo.errorCollector;
    interactionTracker = demo.interactionTracker;
  });

  test.afterEach(async ({}, testInfo) => {
    const { errorReport, interactionReport } = await finishDemo();

    // Assert zero errors
    expect(errorReport.totalErrors, `测试 "${testInfo.title}" 发现 ${errorReport.totalErrors} 个错误`).toBe(0);
  });

  // ... existing tests
});
```

- [ ] **Step 3: Verify test runs**

```bash
npx playwright test demo-modules/01-guest.spec.ts --headed
```

Expected: Tests run with error collection

- [ ] **Step 4: Commit refactored test**

```bash
git add e2e/tests/demo-modules/01-guest.spec.ts
git commit -m "refactor(e2e): enhance 01-guest.spec.ts with error collector"
```

---

### Task 18: Refactor 02-auth.spec.ts

**Files:**
- Modify: `e2e/tests/demo-modules/02-auth.spec.ts`

- [ ] **Step 1: Apply same pattern as 01-guest.spec.ts**

Add imports, beforeEach, afterEach with error collection and zero-error assertion.

- [ ] **Step 2: Verify test runs**

```bash
npx playwright test demo-modules/02-auth.spec.ts --headed
```

Expected: Tests run with error collection

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/demo-modules/02-auth.spec.ts
git commit -m "refactor(e2e): enhance 02-auth.spec.ts with error collector"
```

---

### Task 19: Refactor 03-user.spec.ts

**Files:**
- Modify: `e2e/tests/demo-modules/03-user.spec.ts`

- [ ] **Step 1: Apply same pattern**

- [ ] **Step 2: Verify test runs**

```bash
npx playwright test demo-modules/03-user.spec.ts --headed
```

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/demo-modules/03-user.spec.ts
git commit -m "refactor(e2e): enhance 03-user.spec.ts with error collector"
```

---

### Task 20: Refactor 04-admin.spec.ts

**Files:**
- Modify: `e2e/tests/demo-modules/04-admin.spec.ts`

- [ ] **Step 1: Apply same pattern**

- [ ] **Step 2: Verify test runs**

```bash
npx playwright test demo-modules/04-admin.spec.ts --headed
```

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/demo-modules/04-admin.spec.ts
git commit -m "refactor(e2e): enhance 04-admin.spec.ts with error collector"
```

---

### Task 21: Run All Demo Tests

- [ ] **Step 1: Run all demo tests**

```bash
npm run test:e2e:demo:all
```

Expected: All tests pass with zero errors

- [ ] **Step 2: Fix any failing tests**

If tests fail, identify and fix the issues.

- [ ] **Step 3: Commit any fixes**

```bash
git add .
git commit -m "fix(e2e): resolve demo test issues"
```

---

## Chunk 5: Git Hooks and Scripts

### Task 22: Create Component Demo Map

**Files:**
- Create: `scripts/component-demo-map.js`

- [ ] **Step 1: Create component-demo-map.js**

```javascript
// scripts/component-demo-map.js

const COMPONENT_TO_DEMO_MAP = {
  // features 目录映射
  'src/features/auth/': 'e2e/tests/demo-modules/02-auth.spec.ts',
  'src/features/journals/': 'e2e/tests/demo-modules/01-guest.spec.ts',
  'src/features/comments/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/posts/': 'e2e/tests/community-posts.spec.ts',
  'src/features/admin/': 'e2e/tests/demo-modules/04-admin.spec.ts',
  'src/features/profile/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/dashboard/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/favorite/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/follow/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/badges/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/submissions/': 'e2e/tests/journal-submission-integration.spec.ts',
  'src/features/announcements/': 'e2e/tests/demo-modules/01-guest.spec.ts',

  // contexts 目录映射
  'src/contexts/AuthContext': 'e2e/tests/demo-modules/02-auth.spec.ts',
  'src/contexts/ThemeContext': 'e2e/tests/demo-modules/01-guest.spec.ts',
  'src/contexts/PostContext': 'e2e/tests/community-posts.spec.ts',
  'src/contexts/JournalContext': 'e2e/tests/demo-modules/01-guest.spec.ts',
  'src/contexts/BadgeContext': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/contexts/ToastContext': 'e2e/tests/demo-modules/01-guest.spec.ts',

  // 通用组件映射
  'src/components/common/': 'e2e/tests/demo-modules/01-guest.spec.ts',
  'src/components/layout/': 'e2e/tests/demo-modules/01-guest.spec.ts',
};

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

function getDemoFileForComponent(componentPath) {
  for (const [pattern, demoFile] of Object.entries(COMPONENT_TO_DEMO_MAP)) {
    if (componentPath.startsWith(pattern)) {
      return demoFile;
    }
  }
  return null;
}

function getAffectedDemos(changedFiles) {
  const demos = new Set();
  for (const file of changedFiles) {
    const demo = getDemoFileForComponent(file);
    if (demo) {
      demos.add(demo);
    }
  }
  return Array.from(demos);
}

function isMajorFeature(files) {
  return files.some(file =>
    MAJOR_FEATURE_DIRS.some(dir => file.startsWith(dir)) &&
    (file.endsWith('.tsx') || file.endsWith('.ts'))
  );
}

function isMinorChange(files) {
  return files.every(file =>
    MINOR_CHANGE_DIRS.some(dir => file.startsWith(dir)) ||
    file.endsWith('.css') ||
    file.endsWith('.md')
  );
}

module.exports = {
  COMPONENT_TO_DEMO_MAP,
  MAJOR_FEATURE_DIRS,
  MINOR_CHANGE_DIRS,
  getDemoFileForComponent,
  getAffectedDemos,
  isMajorFeature,
  isMinorChange,
};
```

- [ ] **Step 2: Commit**

```bash
git add scripts/component-demo-map.js
git commit -m "feat(scripts): add component to demo mapping"
```

---

### Task 23: Create Check Demo Coverage Script

**Files:**
- Create: `scripts/check-demo-coverage.js`

- [ ] **Step 1: Create check-demo-coverage.js**

```javascript
#!/usr/bin/env node
// scripts/check-demo-coverage.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const {
  getDemoFileForComponent,
  isMajorFeature,
  isMinorChange,
  MAJOR_FEATURE_DIRS,
} = require('./component-demo-map');

// Get staged files
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=A', {
      encoding: 'utf-8',
    });
    return output.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

// Check if commit message has skip flag
function hasSkipFlag() {
  try {
    const commitMsg = fs.readFileSync('.git/COMMIT_EDITMSG', 'utf-8');
    return commitMsg.includes('[skip-demo]');
  } catch {
    return false;
  }
}

// Main check
function main() {
  const newFiles = getStagedFiles();

  if (newFiles.length === 0) {
    console.log('   ✅ 无新增文件');
    process.exit(0);
  }

  // Filter to only .tsx/.ts files
  const componentFiles = newFiles.filter(
    f => (f.endsWith('.tsx') || f.endsWith('.ts')) && !f.includes('.test.') && !f.includes('.spec.')
  );

  if (componentFiles.length === 0) {
    console.log('   ✅ 无新增组件文件');
    process.exit(0);
  }

  const isMajor = isMajorFeature(componentFiles);
  const isMinor = isMinorChange(newFiles);

  // Check for skip flag
  if (hasSkipFlag()) {
    if (isMajor) {
      console.log('\n   ❌ 大需求不能跳过演示测试');
      console.log('   检测到以下新增组件:');
      componentFiles.forEach(f => {
        if (MAJOR_FEATURE_DIRS.some(dir => f.startsWith(dir))) {
          console.log(`     + ${f} (大需求)`);
        }
      });
      process.exit(1);
    }
    console.log('   ⏭️  [skip-demo] 标记，跳过演示检查');
    process.exit(0);
  }

  // Check each new component has a demo
  const missingDemos = [];
  componentFiles.forEach(file => {
    const demoFile = getDemoFileForComponent(file);
    if (!demoFile) {
      missingDemos.push({ file, reason: '未找到对应演示映射' });
    }
  });

  if (missingDemos.length > 0 && isMajor) {
    console.log('\n   检测到新增组件:');
    console.log('   ┌─────────────────────────────────────────────────────────┐');
    missingDemos.forEach(({ file, reason }) => {
      const demoSuggestion = getDemoFileForComponent(file) || '需要添加映射';
      console.log(`   │ + ${file}`);
      console.log(`   │   → 大需求 (features/ 下新增)`);
      console.log(`   │   → 建议演示: ${demoSuggestion}`);
    });
    console.log('   └─────────────────────────────────────────────────────────┘');
    process.exit(1);
  }

  console.log('   ✅ 演示覆盖检查通过');
  process.exit(0);
}

main();
```

- [ ] **Step 2: Make executable**

```bash
chmod +x scripts/check-demo-coverage.js
```

- [ ] **Step 3: Commit**

```bash
git add scripts/check-demo-coverage.js
git commit -m "feat(scripts): add demo coverage check script"
```

---

### Task 24: Create Run Affected Demos Script

**Files:**
- Create: `scripts/run-affected-demos.js`

- [ ] **Step 1: Create run-affected-demos.js**

```javascript
#!/usr/bin/env node
// scripts/run-affected-demos.js

const { execSync, spawnSync } = require('child_process');
const { getAffectedDemos } = require('./component-demo-map');

// Get all changed files (staged and unstaged)
function getChangedFiles() {
  try {
    const staged = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
    const unstaged = execSync('git diff --name-only', { encoding: 'utf-8' });
    const files = [...staged.split('\n'), ...unstaged.split('\n')].filter(Boolean);
    return [...new Set(files)];
  } catch {
    return [];
  }
}

// Main
function main() {
  const args = process.argv.slice(2);
  const isQuick = args.includes('--quick');

  const changedFiles = getChangedFiles();
  const affectedDemos = getAffectedDemos(changedFiles);

  if (affectedDemos.length === 0) {
    console.log('   ✅ 无受影响的演示测试');
    process.exit(0);
  }

  console.log(`   运行受影响的演示测试 (${affectedDemos.length} 个):`);
  affectedDemos.forEach(demo => console.log(`     - ${demo}`));

  const playwrightArgs = [
    'playwright',
    'test',
    ...affectedDemos,
    '--reporter=line',
  ];

  if (!isQuick) {
    playwrightArgs.push('--headed');
  }

  const result = spawnSync('npx', playwrightArgs, {
    stdio: 'inherit',
    shell: true,
  });

  process.exit(result.status || 0);
}

main();
```

- [ ] **Step 2: Make executable**

```bash
chmod +x scripts/run-affected-demos.js
```

- [ ] **Step 3: Commit**

```bash
git add scripts/run-affected-demos.js
git commit -m "feat(scripts): add run affected demos script"
```

---

### Task 25: Create Check Schema Sync Script

**Files:**
- Create: `scripts/check-schema-sync.js`

- [ ] **Step 1: Create check-schema-sync.js**

```javascript
#!/usr/bin/env node
// scripts/check-schema-sync.js

const { execSync } = require('child_process');
const path = require('path');

function main() {
  try {
    // Run TypeScript compiler to check for type errors
    execSync('npx tsc --noEmit', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'pipe',
    });
    console.log('   ✅ Schema 同步检查通过');
    process.exit(0);
  } catch (error) {
    console.log('   ❌ 发现类型错误:');
    console.log(error.stdout?.toString() || error.message);
    process.exit(1);
  }
}

main();
```

- [ ] **Step 2: Make executable**

```bash
chmod +x scripts/check-schema-sync.js
```

- [ ] **Step 3: Commit**

```bash
git add scripts/check-schema-sync.js
git commit -m "feat(scripts): add schema sync check script"
```

---

### Task 26: Setup Husky Pre-commit Hook

**Files:**
- Create: `.husky/pre-commit`
- Modify: `package.json`

- [ ] **Step 1: Initialize Husky**

```bash
npx husky init
```

- [ ] **Step 2: Create pre-commit hook**

```bash
echo '#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo ""
echo "🔍 Running pre-commit checks..."
echo "─────────────────────────────────────────"

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
  exit 1
}

# 3. 演示覆盖率检查
echo ""
echo "🎬 [3/4] 演示覆盖率检查..."
node scripts/check-demo-coverage.js || {
  echo ""
  echo "⚠️  检测到新组件缺少演示测试"
  echo ""
  echo "   选项:"
  echo "   1. 添加演示测试（推荐）"
  echo "   2. 小需求可用 git commit -m \"[skip-demo] your message\" 跳过"
  echo "   3. 大需求（features/pages/contexts 下新增）必须添加演示"
  exit 1
}

# 4. 运行受影响的演示测试
echo ""
echo "🧪 [4/4] 运行受影响的演示测试..."
node scripts/run-affected-demos.js --quick || {
  echo ""
  echo "❌ 演示测试失败"
  echo "   请查看上方错误报告"
  exit 1
}

echo ""
echo "─────────────────────────────────────────"
echo "✅ 所有检查通过！"
echo ""
' > .husky/pre-commit
```

- [ ] **Step 3: Make hook executable**

```bash
chmod +x .husky/pre-commit
```

- [ ] **Step 4: Add prepare script to package.json**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

- [ ] **Step 5: Commit Husky setup**

```bash
git add .husky/ package.json
git commit -m "feat(ci): add pre-commit hook with TypeScript, schema, and demo checks"
```

---

### Task 27: Add npm Scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add new scripts to package.json**

```json
{
  "scripts": {
    "demo:coverage": "node scripts/generate-demo-coverage.js",
    "demo:coverage:html": "node scripts/generate-demo-coverage.js --html",
    "demo:coverage:check": "node scripts/check-coverage-threshold.js",
    "schema:check": "node scripts/check-schema-sync.js",
    "precommit": "node scripts/check-schema-sync.js && node scripts/check-demo-coverage.js"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add demo coverage and schema check npm scripts"
```

---

## Chunk 6: Coverage Tracking (Optional Enhancement)

### Task 28: Create Generate Demo Coverage Script

**Files:**
- Create: `scripts/generate-demo-coverage.js`

- [ ] **Step 1: Create generate-demo-coverage.js**

```javascript
#!/usr/bin/env node
// scripts/generate-demo-coverage.js

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const { COMPONENT_TO_DEMO_MAP } = require('./component-demo-map');

async function main() {
  const args = process.argv.slice(2);
  const generateHtml = args.includes('--html');

  // Find all components
  const componentFiles = await glob('src/**/*.tsx', {
    ignore: ['**/*.test.tsx', '**/*.spec.tsx', '**/node_modules/**'],
  });

  // Find all demo files
  const demoFiles = await glob('e2e/tests/**/*.spec.ts');

  const coverage = {
    generatedAt: new Date().toISOString(),
    summary: {
      componentCoverage: { total: 0, covered: 0, percentage: 0 },
      interactionCoverage: { total: 0, covered: 0, percentage: 0 },
    },
    components: [],
    uncoveredComponents: [],
  };

  // Check each component
  componentFiles.forEach(file => {
    const relativePath = file.replace(/\\/g, '/');
    let demoFile = null;

    for (const [pattern, demo] of Object.entries(COMPONENT_TO_DEMO_MAP)) {
      if (relativePath.startsWith(pattern)) {
        demoFile = demo;
        break;
      }
    }

    const covered = demoFile && fs.existsSync(demoFile);
    coverage.summary.componentCoverage.total++;
    if (covered) {
      coverage.summary.componentCoverage.covered++;
    }

    coverage.components.push({
      path: relativePath,
      covered,
      demoFile,
    });

    if (!covered) {
      coverage.uncoveredComponents.push({
        path: relativePath,
        suggestedDemoFile: demoFile || 'e2e/tests/demo-modules/01-guest.spec.ts',
      });
    }
  });

  // Calculate percentage
  coverage.summary.componentCoverage.percentage =
    coverage.summary.componentCoverage.total > 0
      ? Math.round(
          (coverage.summary.componentCoverage.covered /
            coverage.summary.componentCoverage.total) *
            100
        )
      : 100;

  // Write JSON report
  fs.writeFileSync(
    'e2e/coverage/demo-coverage.json',
    JSON.stringify(coverage, null, 2)
  );

  // Print report
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('                      演示测试覆盖率报告');
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log(`生成时间: ${coverage.generatedAt}\n`);

  const { componentCoverage } = coverage.summary;
  const bar = '█'.repeat(Math.floor(componentCoverage.percentage / 2));
  const empty = '░'.repeat(50 - bar.length);

  console.log(`📦 组件覆盖率: ${componentCoverage.percentage}% (${componentCoverage.covered}/${componentCoverage.total})`);
  console.log(`${bar}${empty}  ${componentCoverage.percentage}%`);

  if (componentCoverage.percentage >= 100) {
    console.log('✅ 达标 (阈值: 100%)');
  } else {
    console.log('❌ 未达标 (阈值: 100%)');
  }

  if (coverage.uncoveredComponents.length > 0) {
    console.log('\n⚠️  未覆盖组件:');
    coverage.uncoveredComponents.slice(0, 10).forEach(c => {
      console.log(`  - ${c.path}`);
      console.log(`    → 建议: ${c.suggestedDemoFile}`);
    });
    if (coverage.uncoveredComponents.length > 10) {
      console.log(`  ... 还有 ${coverage.uncoveredComponents.length - 10} 个未覆盖组件`);
    }
  }

  console.log('\n══════════════════════════════════════════════════════════════════════\n');

  if (generateHtml) {
    // Generate HTML report (simplified)
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Demo Coverage Report</title>
  <style>
    body { font-family: system-ui; padding: 2rem; }
    .covered { color: green; }
    .uncovered { color: red; }
  </style>
</head>
<body>
  <h1>Demo Coverage Report</h1>
  <p>Generated: ${coverage.generatedAt}</p>
  <h2>Coverage: ${componentCoverage.percentage}%</h2>
  <ul>
    ${coverage.components.map(c => `
      <li class="${c.covered ? 'covered' : 'uncovered'}">
        ${c.path} ${c.covered ? '✅' : '❌'}
      </li>
    `).join('')}
  </ul>
</body>
</html>
    `;
    fs.writeFileSync('e2e/coverage/report.html', html);
    console.log('📄 HTML report: e2e/coverage/report.html');
  }
}

main().catch(console.error);
```

- [ ] **Step 2: Commit**

```bash
git add scripts/generate-demo-coverage.js
git commit -m "feat(scripts): add demo coverage report generator"
```

---

## Final Verification

### Task 29: Run Full Test Suite

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 2: Run frontend tests**

```bash
npm test -- --run
```

Expected: All tests pass

- [ ] **Step 3: Run E2E demo tests**

```bash
npm run test:e2e:demo:all
```

Expected: All tests pass with zero errors

- [ ] **Step 4: Test pre-commit hook**

```bash
# Make a small change and try to commit
echo "// test" >> src/types/index.ts
git add src/types/index.ts
git commit -m "test: verify pre-commit hook"
```

Expected: Pre-commit checks run successfully

- [ ] **Step 5: Generate coverage report**

```bash
npm run demo:coverage
```

Expected: Coverage report generated

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: complete comprehensive test system implementation"
```

---

## Summary

This plan implements:

1. **Shared Zod Schemas** (8 schema files) - Type safety across frontend/backend
2. **Error Collector** - Captures JS/API/console errors with reproduction steps
3. **Interaction Tracker** - Tracks clickable element coverage
4. **Schema Validator** - Validates API responses in E2E tests
5. **Enhanced Demo Helpers** - Integrated error and interaction tracking
6. **Git Hooks** - Pre-commit checks for TypeScript, schema sync, and demo coverage
7. **Coverage Reports** - Component and interaction coverage tracking

Total estimated steps: ~100 atomic operations
