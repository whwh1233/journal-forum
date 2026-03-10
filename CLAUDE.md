# 投哪儿 (pubWhere) - Claude 项目指南

## 项目概述

学术期刊评价与交流平台。用户可浏览期刊、发表评论/评分、收藏期刊、关注用户。管理员可管理用户、期刊和评论。

## 技术栈

- **前端**: React 18 + TypeScript + Vite (port 3000)
- **后端**: Node.js + Express (port 3001)
- **数据库**: MySQL 8.0 (Sequelize ORM) + *LowDB（兼容遗留测试)*
- **认证**: JWT + bcryptjs
- **主题系统**: React Context + CSS Variables (6 个预设主题)
- **前端测试**: Vitest
- **后端测试**: Jest
- **E2E 测试**: Playwright (Chrome)

## 功能模块导航

快速定位各功能模块的实现位置和状态。

### 🔐 认证系统
**状态**: ✅ 已完成
**功能**: 用户注册、登录、JWT 认证、全局认证弹窗
**关键文件**:
- 前端: `src/features/auth/`, `src/contexts/AuthContext.tsx`, `src/contexts/AuthModalContext.tsx`
- 后端: `backend/routes/authRoutes.js`, `backend/controllers/authController.js`
- 中间件: `backend/middleware/auth.js`

### 📚 期刊管理
**状态**: ✅ 已完成
**功能**: 期刊浏览、搜索筛选、详情查看、评分
**关键文件**:
- 前端: `src/features/journals/`, `src/hooks/useJournals.ts`
- 后端: `backend/routes/journalRoutes.js`, `backend/controllers/journalController.js`

### 💬 评论系统
**状态**: ✅ 已完成
**功能**: 嵌套评论（3 层）、多维结构化评分（5 维度）、有用性点赞（Toggle）、多维排序、删除标记
**评分维度**: 审稿速度 / 编辑态度 / 录用难度 / 审稿质量 / 综合体验
**关键文件**:
- 前端: `src/features/comments/`（含 `DimensionRatingInput.*`, `DimensionRatingDisplay.*`）
- 后端: `backend/routes/commentRoutes.js`, `backend/controllers/commentController.js`
- 模型: `backend/models/Comment.js`, `backend/models/CommentLike.js`
- 排序: `src/features/journals/components/SearchAndFilter.tsx`, `src/contexts/JournalContext.tsx`

### ⭐ 收藏系统
**状态**: ✅ 已完成
**功能**: 收藏期刊、取消收藏、收藏列表
**关键文件**:
- 前端: `src/features/favorite/`
- 后端: `backend/routes/favoriteRoutes.js`, `backend/controllers/favoriteController.js`

### 👥 关注系统
**状态**: ✅ 已完成
**功能**: 关注用户、取消关注、关注列表、粉丝列表
**关键文件**:
- 前端: `src/features/follow/`
- 后端: `backend/routes/followRoutes.js`, `backend/controllers/followController.js`

### 🎨 主题系统
**状态**: ✅ 已完成
**功能**: 6 个预设主题、深浅模式切换、localStorage 持久化
**关键文件**:
- 前端: `src/contexts/ThemeContext.tsx`, `src/components/common/ThemePicker.*`, `src/styles/global.css`
- 文档: `THEMES.md`

### 👤 个人中心
**状态**: ✅ 已完成
**功能**: 个人资料编辑、头像上传、仪表盘统计
**关键文件**:
- 前端: `src/features/profile/`, `src/features/dashboard/`
- 后端: `backend/routes/userRoutes.js`, `backend/controllers/userController.js`

### 🛡️ 管理后台
**状态**: ✅ 已完成
**功能**: 用户管理、期刊管理、评论审核、荣誉徽章颁发
**关键文件**:
- 前端: `src/features/admin/`
- 后端: `backend/routes/adminRoutes.js`, `backend/controllers/adminController.js`
- 中间件: `backend/middleware/adminAuth.js`

### 🏅 积分与荣誉系统
**状态**: ✅ 已完成
**功能**: 动态积分与等级计算、自动/手动触发徽章、全局荣誉图鉴、管理端直签
**关键文件**:
- 前端: `src/features/badges/`, `src/features/admin/components/BadgeManagement.tsx`
- 后端: `backend/routes/badgeRoutes.js`, `backend/controllers/badgeController.js`, `backend/services/badgeService.js`
- 模型: `backend/models/Badge.js`, `backend/models/UserBadge.js`

### 📝 社区帖子系统 (New)
**状态**: ✅ 已完成
**功能**: 学术交流社区，支持发帖、评论、互动（点赞/收藏/关注）、内容举报
**特性**:
- **Markdown 编辑器**: 支持粗体、斜体、标题、链接、引用、代码块、列表、图片等
- **视图模式**: 编辑/预览/分屏三种模式
- **草稿自动保存**: 每 30 秒自动保存到 localStorage，支持恢复
- **分类标签**: 6 大预设分类（投稿经验/学术讨论/求助问答/资讯分享/文献评述/其他）+ 自由标签
- **嵌套评论**: 3 层嵌套回复
- **多维排序**: 热门/最新/浏览量/点赞数/评论数
- **无限滚动**: Intersection Observer 实现懒加载
- **期刊关联**: 可选关联期刊，关联帖子显示徽章
- **内容举报**: 用户可举报不当内容，管理员后台审核
- **XSS 防护**: DOMPurify 清理用户输入的 Markdown
- **外链保护**: 外部链接自动添加 target="_blank" 和 rel="noopener"

**数据库设计**:
- 独立表设计（方案 B）：不修改现有期刊评论系统
- 7 个数据表：Post, PostLike, PostFavorite, PostFollow, PostComment, PostCommentLike, PostReport
- 软删除模式：isDeleted 标记
- 自引用外键：3 层嵌套评论结构

**关键文件**:
- **前端**:
  - 页面: `src/features/posts/pages/` (CommunityPage, PostDetailPage, NewPostPage)
  - 组件: `src/features/posts/components/` (PostCard, PostList, PostDetail, PostForm, PostComment*)
  - 上下文: `src/contexts/PostContext.tsx`
  - 类型: `src/features/posts/types/post.ts`
  - 服务: `src/features/posts/services/postService.ts`
- **后端**:
  - 路由: `backend/routes/postRoutes.js` (17 个路由)
  - 控制器: `backend/controllers/postController.js`, `backend/controllers/postCommentController.js`
  - 模型: `backend/models/Post.js`, `backend/models/PostComment.js`, `backend/models/PostLike.js`, `backend/models/PostFavorite.js`, `backend/models/PostFollow.js`, `backend/models/PostReport.js`, `backend/models/PostCommentLike.js`
  - 管理: `backend/controllers/adminController.js` (举报管理)
- **测试**:
  - 后端集成: `backend/__tests__/integration/post.test.js`, `postComment.test.js`
  - 前端组件: `src/__tests__/components/PostCard.test.tsx`, `PostForm.test.tsx`, `PostDetail.test.tsx`
  - E2E: `e2e/tests/community-posts.spec.ts`

**API 路由**:
```
GET    /api/posts                    # 获取帖子列表（支持过滤/排序/分页）
GET    /api/posts/:id                # 获取单个帖子详情
POST   /api/posts                    # 创建新帖子（需登录）
PUT    /api/posts/:id                # 更新帖子（仅作者）
DELETE /api/posts/:id                # 删除帖子（作者/管理员）
POST   /api/posts/:id/like           # 点赞/取消点赞
POST   /api/posts/:id/favorite       # 收藏/取消收藏
POST   /api/posts/:id/follow         # 关注/取消关注
POST   /api/posts/:id/report         # 举报帖子
POST   /api/posts/:id/view           # 增加浏览量
GET    /api/posts/my/posts           # 我的帖子
GET    /api/posts/my/favorites       # 我收藏的帖子
GET    /api/posts/my/follows         # 我关注的帖子

GET    /api/posts/:postId/comments           # 获取评论（3 层嵌套）
POST   /api/posts/:postId/comments           # 发表评论
DELETE /api/posts/comments/:commentId        # 删除评论
POST   /api/posts/comments/:commentId/like   # 点赞/取消点赞评论

GET    /api/admin/post-reports       # 获取举报列表（管理员）
PUT    /api/admin/post-reports/:id   # 处理举报（管理员）
POST   /api/admin/post-reports/batch # 批量处理举报（管理员）
```

**使用示例**:
```typescript
// 使用 PostContext
import { usePost } from '@/contexts/PostContext';

const { posts, loading, fetchPosts, createPost, toggleLike } = usePost();

// 获取帖子列表
await fetchPosts({ category: 'discussion', sortBy: 'hot', page: 1 });

// 创建帖子
const post = await createPost({
  title: '学术讨论',
  content: '# 标题\n内容',
  category: 'discussion',
  tags: ['tag1', 'tag2']
});

// 点赞
await toggleLike(postId);
```

### 📋 投稿追踪系统
**状态**: ✅ 已完成（已整合期刊智能关联）
**功能**: 稿件管理、多次投稿、状态时间轴、期刊智能搜索、数据深度整合
**新增特性**:
- **期刊智能搜索**: 支持期刊名称/ISSN 模糊搜索，300ms 防抖，滚动加载更多
- **JournalPicker 组件**: 分类过滤、自定义维度显示（1-3个）、localStorage 持久化偏好
- **JournalInfoCard 组件**: 展示 5 维度评分、收藏快捷操作、点击跳转详情页
- **双向快捷入口**: 期刊详情页 ↔ 投稿记录页
- **URL 参数传递**: 从期刊页跳转自动预填期刊信息
- **乐观 UI 更新**: 收藏切换即时响应，失败自动回滚

**关键文件**:
- **前端组件**: `src/components/common/JournalPicker.*`, `src/components/common/JournalInfoCard.*`
- **Hook**: `src/hooks/useJournalSearch.ts`
- **Service**: `src/services/journalSearchService.ts`, `src/services/favoriteService.ts`
- **页面**: `src/features/submissions/SubmissionTracker.tsx`
- **后端**: `backend/routes/journalRoutes.js`, `backend/controllers/journalController.js`
- **模型**: `backend/models/Manuscript.js`, `backend/models/Submission.js`
- **测试**: `src/__tests__/components/common/JournalPicker.test.tsx`, `src/__tests__/components/common/JournalInfoCard.test.tsx`

**API 路由**:
```
GET    /api/journals/search?q=nature&category=SCI&page=1&limit=10  # 期刊搜索
GET    /api/journals/categories                                     # 获取分类列表
```

### 🗄️ 数据库管理
**状态**: ✅ 已完成
**功能**: 表列表/结构/数据浏览、行内编辑、删除、搜索排序分页、操作审计日志
**权限**: 仅 superadmin 可访问
**关键文件**:
- 前端: `src/features/admin/components/DatabaseManager.tsx`, `src/services/databaseService.ts`
- 后端: `backend/routes/databaseRoutes.js`, `backend/controllers/databaseController.js`
- 中间件: `backend/middleware/superAdminAuth.js`
- 模型: `backend/models/DatabaseAuditLog.js`

### 🧪 测试系统
**状态**: ✅ 已完成
**已完成**: E2E 测试（社区帖子、期刊投稿整合）、后端集成测试（帖子+评论+期刊搜索）、前端组件测试（JournalPicker/JournalInfoCard/PostCard/PostForm/PostDetail）
**关键文件**:
- E2E: `e2e/tests/` (含 `community-posts.spec.ts`, `journal-submission-integration.spec.ts`)
- 后端测试: `backend/__tests__/integration/post.test.js`, `postComment.test.js`
- 前端测试: `src/__tests__/components/common/JournalPicker.test.tsx`, `JournalInfoCard.test.tsx`, `PostCard.test.tsx`, `PostForm.test.tsx`, `PostDetail.test.tsx`

## 启动项目

```bash
# 后端 (生产/开发环境)
cd backend && npm start

# 后端 (独立测试数据环境)
cd backend && npm run start:test

# 播种测试数据
cd backend && npm run seed:test

# 前端（另开终端）
npm run dev
```

访问 http://localhost:3000，后端 API：http://localhost:3001

## 项目结构

```
journal-forum/
├── e2e/                           # E2E 测试目录
│   ├── tests/                     # 测试用例
│   │   ├── full-demo.spec.ts      # 完整功能可视化演示
│   │   ├── demo-modules/          # 模块化演示测试
│   │   │   ├── 01-guest.spec.ts   # 游客场景
│   │   │   ├── 02-auth.spec.ts    # 认证场景
│   │   │   ├── 03-user.spec.ts    # 用户场景
│   │   │   └── 04-admin.spec.ts   # 管理员场景
│   │   ├── accessibility.spec.ts  # 无障碍测试
│   │   ├── user-flows.spec.ts     # 用户流程测试
│   │   └── monkey.spec.ts         # 随机交互测试
│   ├── fixtures/
│   │   ├── test-data.ts           # 测试数据和选择器
│   │   └── demo-helpers.ts        # 演示辅助工具
│   └── utils/                     # E2E 工具函数
├── backend/
│   ├── config/
│   │   ├── database.js           # MySQL 生产数据库配置 (Sequelize)
│   │   ├── databaseLowdb.js      # 遗留 LowDB 配置（用于测试/参考）
│   │   ├── databaseTest.js       # 测试数据库配置
│   │   └── admin.js              # 管理员配置
│   ├── controllers/              # 路由处理器
│   │   ├── *Controller.js        # MySQL Sequelize 控制器
│   │   └── *ControllerLowdb.js   # 遗留 LowDB 控制器（参考归档）
│   ├── middleware/               # auth.js, adminAuth.js, superAdminAuth.js, error.js
│   ├── routes/                   # API 路由（*Routes.js 命名）
│   ├── services/                 # 业务逻辑层（badgeService.js）
│   ├── models/                   # 数据模型 (Sequelize)
│   │   ├── index.js              # 模型聚合与关联
│   │   ├── User.js, Journal.js, Comment.js, Badge.js 等
│   ├── utils/                    # 工具函数（jwt, password 等）
│   ├── utils/                    # 工具函数（jwt, password 等）
│   ├── data/                     # 初始数据（initialBadges.js）
│   ├── __tests__/                # Jest 集成测试
│   │   ├── integration/          # API 集成测试（完整）
│   │   └── unit/                 # 单元测试（待补充）
│   ├── database.json             # JSON 数据库文件（生产）
│   ├── database.test.json        # JSON 数据库文件（测试）
│   ├── .env                      # 后端环境变量（生产）
│   ├── .env.test                 # 后端测试环境变量
│   ├── server.js
│   └── scripts/
│       ├── migrateData.js        # JSON 到 MySQL 数据迁移脚本
│       ├── initLowdb.js          # 初始化旧版数据库脚本
│       └── seedData.js           # 独立测试数据生成脚本
├── src/
│   ├── components/
│   │   ├── layout/               # 布局组件
│   │   │   ├── AppLayout.*       # 主应用布局
│   │   │   ├── PageHeader.*      # 页面头部
│   │   │   ├── SideNav.*         # 侧边导航
│   │   │   └── TopBar.*          # 顶部导航栏
│   │   └── common/               # 通用组件
│   │       ├── ThemePicker.*     # 主题选择器
│   │       └── UserDropdown.*    # 用户下拉菜单
│   ├── contexts/                 # React Context
│   │   ├── AuthContext.tsx       # 认证上下文
│   │   ├── AuthModalContext.tsx  # 认证弹窗上下文
│   │   ├── ThemeContext.tsx      # 主题管理上下文
│   │   ├── BadgeContext.tsx      # 徽章上下文
│   │   ├── JournalContext.tsx    # 期刊数据上下文
│   │   └── ToastContext.tsx      # Toast 通知上下文
│   ├── features/                 # 功能模块
│   │   ├── auth/                 # 认证
│   │   ├── comments/             # 期刊评论
│   │   ├── journals/             # 期刊
│   │   ├── posts/                # 社区帖子
│   │   ├── profile/              # 个人资料
│   │   ├── favorite/             # 收藏
│   │   ├── follow/               # 关注
│   │   ├── dashboard/            # 仪表盘
│   │   ├── badges/               # 荣誉系统 (徽章图鉴等)
│   │   └── admin/                # 管理后台
│   ├── services/                 # API 客户端（axios）
│   ├── types/                    # TypeScript 类型定义
│   └── __tests__/                # 前端测试
│       ├── components/           # 组件测试（完整）
│       └── integration/          # 集成测试（待补充）
├── .env.local                    # 前端环境变量
├── .env.example                  # 环境变量示例
├── CLAUDE.md                     # 项目指南
└── THEMES.md                     # 主题系统使用文档
```

## API 路由

所有需要认证的路由需要 `Authorization: Bearer <token>` 头。

| 模块 | 前缀 |
|------|------|
| 认证 | `/api/auth/*` |
| 用户 | `/api/users/*` |
| 期刊 | `/api/journals/*` |
| 期刊评论 | `/api/comments/*` |
| 社区帖子 | `/api/posts/*` |
| 收藏 | `/api/favorites/*` |
| 关注 | `/api/follows/*` |
| 荣誉 | `/api/badges/*` |
| 管理 | `/api/admin/*` |
| 数据库 | `/api/database/*` (superadmin) |

完整 API 文档见 `API_ROUTES.md`。

## 运行测试

```bash
# 后端测试（Jest）
cd backend && npm test
cd backend && npm run test:coverage

# 前端测试（Vitest）
npm test
npm run test:coverage

# E2E 测试（Playwright）- 自动启动前后端服务
npm run test:e2e              # 运行所有 E2E 测试
npm run test:e2e:headed       # 有界面运行
npm run test:e2e:monkey       # 随机交互测试
npm run test:e2e:ui           # Playwright UI 模式
npm run test:e2e:report       # 查看测试报告

# E2E 可视化演示测试（覆盖全部功能）
npm run test:e2e:full-demo      # 完整功能演示（约10分钟）
npm run test:e2e:demo:guest     # 游客场景
npm run test:e2e:demo:auth      # 认证场景
npm run test:e2e:demo:user      # 用户场景
npm run test:e2e:demo:admin     # 管理员场景
npm run test:e2e:demo:all       # 运行所有模块
```

## 设置管理员账号

1. MySQL 环境配置：
   - 生产环境：直接修改 `users` 表中的 `role` 列为 `'admin'`
   - 支持通过后端修改 Admin 数据表记录实现无缝介入

## 环境变量配置

项目使用多个 `.env` 文件：

- **`backend/.env`**: 后端生产环境变量（JWT_SECRET, PORT 等）
- **`backend/.env.test`**: 后端测试环境变量（已加入 `.gitignore`，不要提交）
- **`.env.local`**: 前端环境变量（位于项目根目录）
- **`.env.production`**: 前端生产环境变量（部署用）
- **`.env.example`**: 环境变量示例模板

## 开发工作流与端口规范

- **前端开发端口**: 默认 **3000**
  - **启动方式**: 在根目录执行 `npm run dev`
  - **环境加载**: Vite 会自动读取 `.env` / `.env.local`，默认 `VITE_API_URL` 指向 `http://localhost:3001`
- **后端服务端口**: 默认 **3001**
  - **启动方式**: 在 `backend` 目录执行 `npm start`
- **跨域安全 (CORS)**
  - 根据 `NODE_ENV` 区分：`development` 或 `test` 允许 `localhost` 访问；`production` 仅允许生产环境指定前端 IP 获取数据。

## 重要注意事项

- **数据库配置**: 已从 LowDB 迁移至 MySQL 8.0。需配置 `.env` 文件中的 DB 环境变量以连接 MySQL。
- **端口冲突**: `netstat -ano | findstr :3001` 查看占用进程
- **控制器命名**: 现所有活跃的控制器文件为 `*Controller.js`，带有 `Lowdb.js` 后缀的为已弃用的遗留代码
- **路由命名**: 所有后端路由文件以 `Routes.js` 结尾（如 `authRoutes.js`）
- **中间件命名**: `auth.js`（JWT 认证）、`adminAuth.js`（管理员认证）、`superAdminAuth.js`（超级管理员认证）、`error.js`（错误处理）
- **用户角色**: `user`（普通用户）、`admin`（管理员）、`superadmin`（超级管理员，可访问数据库管理）
- **评论系统**: 支持嵌套（最多 3 层），删除后显示为"[该评论已被删除]"
- **用户数据结构**: 包含 name, avatar, bio, location, institution, website 等字段
- **测试覆盖**: 后端集成测试完整，前端组件测试完整，单元测试待补充

## 已实现功能

- 用户注册/登录（JWT）
- 期刊浏览、搜索、筛选
- 期刊评论系统（嵌套 3 层、多维评分）
- **社区帖子系统**（Markdown 编辑、草稿自动保存、嵌套评论、点赞/收藏/关注、内容举报）
- 收藏期刊与帖子
- 关注用户与帖子
- **积分与等级系统**（动态计算）
- **荣誉徽章系统**（图鉴与后台管理）
- 个人主页与仪表盘
- 管理后台（用户/期刊/评论/徽章管理）
- **数据库管理**（表浏览、数据编辑/删除、审计日志，仅 superadmin）
- 速率限制、CORS、Helmet 安全头
- **多主题系统**（6 个预设主题，可自由切换）
- **E2E 自动化测试**（Playwright，支持可视化演示和猴子测试）

## 主题系统

项目内置完整的多主题色彩系统，支持用户自定义视觉体验。

### 可用主题

1. **默认蓝** - 经典学术蓝色系，稳重专业
2. **温暖自然** - 柔和米黄色系，温馨舒适
3. **日落辉光** - 橙黄渐变色系，活力热情
4. **复古橄榄** - 优雅自然色系，复古怀旧
5. **柔和大地** - 粉褐柔和色系，温柔恬静
6. **暖秋大地** - 金黄暖秋色系，丰收氛围

### 技术实现

- **架构**: React Context + CSS Variables
- **持久化**: localStorage 保存用户偏好
- **切换方式**: TopBar 右侧调色板图标，可视化主题选择器
- **深浅模式**: 支持浅色/深色切换（当前仅默认蓝主题支持深色）
- **扩展性**: 详见 `THEMES.md` 文档，支持快速添加新主题

### 核心文件

```
src/
├── contexts/ThemeContext.tsx       # 主题管理上下文
├── components/common/
│   ├── ThemePicker.tsx             # 主题选择器组件
│   └── ThemePicker.css             # 主题选择器样式
└── styles/global.css               # 6 个主题 CSS 变量定义
```

## 📐 Design System 设计系统

统一的视觉设计规范，确保所有组件遵循一致的字体、间距、尺寸标准。

### 字体 (Font Family)

| 用途 | 字体 | CSS 变量 |
|------|------|----------|
| 全站主字体 | **Lexend** | `--font-sans` |
| 标题/展示 | Lexend (600-700) | `--font-display` |
| 代码/等宽 | JetBrains Mono | `--font-mono` |

### 字号系统 (Typography Scale)

**比例**: Perfect Fourth (1.333) | **基准**: 16px

| 层级 | 字号 | 图标 | CSS 变量 | 用途 |
|------|------|------|----------|------|
| 2XL | 50px | — | `--text-2xl` | 品牌标题 |
| XL | 38px | 40px | `--text-xl` | 页面主标题 |
| LG | 28px | 32px | `--text-lg` | 区块标题 |
| MD | 21px | 24px | `--text-md` | 卡片标题 |
| **Base** | **16px** | **20px** | `--text-base` | 正文（默认） |
| SM | 14px | 16px | `--text-sm` | 辅助文本、按钮 |
| XS | 12px | 14px | `--text-xs` | 注释、时间戳 |

**图标配对规则**: `图标尺寸 = 字号 × 1.25`（向上取整到偶数）

### 间距系统 (Spacing)

使用现有变量，禁止硬编码。

| 变量 | 值 | 变量 | 值 |
|------|-----|------|-----|
| `--space-1` | 4px | `--space-6` | 32px |
| `--space-2` | 8px | `--space-8` | 48px |
| `--space-3` | 12px | `--space-10` | 64px |
| `--space-4` | 16px | `--space-12` | 80px |
| `--space-5` | 24px | | |

### 组件尺寸 (Component Sizing)

| 尺寸 | 高度 | 字号 | 图标 | 头像 | 圆角 |
|------|------|------|------|------|------|
| XS | 24px | 12px | 14px | 20px | 4px |
| SM | 32px | 14px | 16px | 28px | 6px |
| **MD** | **40px** | **16px** | **20px** | **36px** | **8px** |
| LG | 48px | 21px | 24px | 48px | 10px |
| XL | 56px | 28px | 32px | 64px | 12px |

### 实施规则

1. **禁止硬编码**: 所有字号、间距、尺寸必须使用 CSS 变量
2. **图标一致性**: Lucide React 图标必须使用配对尺寸
3. **组件默认**: 未指定尺寸时使用 MD (40px 高度)
4. **详细文档**: `docs/superpowers/specs/2026-03-10-design-system.md`

---

## 当前状态与待办事项
> **最后更新**: 2026-03-10
> **规则**: 仅记录当前最新状态和最优先问题，每次改动后更新此区域

### ✅ 当前状态

- **Design System**: 已完成统一设计系统规范（字体 Lexend、Perfect Fourth 字号比例、5 级组件尺寸、图标配对规则）
- **投稿追踪系统**：已完成期刊智能关联与数据整合。JournalPicker 组件（分类过滤、防抖搜索、维度显示）、JournalInfoCard 组件（5 维度评分、收藏切换）、双向快捷入口。
- **数据库升级**：已完整从 LowDB 迁移至 MySQL 8.0。包括 9 大 Sequelize 模型构建（支持高并发）、数据平滑迁移（支持 UUID）、所有控制器与服务层的彻底重写。
- **权限体系**：三级角色（user/admin/superadmin），superadmin 可访问数据库管理功能。
- **数据库管理**：新增完整的数据库管理工具（表浏览、结构查看、数据编辑/删除、审计日志）。
- **核心功能**: 补充了完整的积分（Points）与体系化荣誉徽章（Badges）功能。
- **代码质量**: 图标系统已统一使用 Lucide React，UI 组件已优化（SearchAndFilter）
- **测试覆盖**: E2E 完整、后端集成测试完整、前端组件测试已补充（JournalPicker 17/17, JournalInfoCard 19/19）
- **UI 架构**: 具备高级拟态面板的 Admin 控制台、TopBar + SideNav + PageHeader 统一布局
- **主题系统**: 6 个预设主题可用
- **认证体验**: AuthModalContext 全局管理

### 🔴 优先待办

1. **Design System 实施** - 将设计规范应用到所有组件（替换硬编码字号/间距/尺寸为 CSS 变量）
2. **前端组件测试** - 剩余组件待补充测试（TopBar, SideNav, PageHeader, AppLayout, SearchAndFilter, JournalDetailPanel, CommentList, CommentForm, RegisterForm 等）
3. **单元测试缺失** - `backend/__tests__/unit/` 和 `src/__tests__/integration/` 目录为空

### 📋 功能积压 (详见 `EXPANSION_PLAN.md`)

* **学者身份认证** (Edu邮箱/ORCID绑定) - 增强发言背书 (v1.1 核心)
* **期刊问答专区** (Q&A Section) - 将提问与评价分离聚合
* **核心指标展示** (JCR分区/IF/APC) - 数据大盘集成
* **动态订阅提醒** (Dynamic Alerts) - 基于期刊动态的邮件/站内召回
* 教育邮箱登录验证 (集成至身份认证)
* 申请制发布权限 (集成至身份认证)

---

## 最近重要改动
> 记录最近 2-3 次会话的关键改动，便于新对话快速了解项目演进

### 2026-03-10 (Session 6 - Current)
新增统一 Design System 设计系统：
1. **字体系统**：全站统一使用 Lexend 字体（阅读优化、舒适现代），代码使用 JetBrains Mono
2. **字号系统**：Perfect Fourth (1.333) 比例，7 级字号（12px ~ 50px），基准 16px
3. **图标配对**：图标尺寸 = 字号 × 1.25，确保视觉平衡
4. **组件尺寸**：5 级体系（XS/SM/MD/LG/XL），MD (40px) 为默认
5. **间距系统**：统一使用 `--space-1` ~ `--space-12` 变量，禁止硬编码
6. **设计文档**：`docs/superpowers/specs/2026-03-10-design-system.md`

### 2026-03-02 (Session 5)
新增数据库管理功能（类 phpMyAdmin）：
1. **权限体系升级**：User 模型新增 `superadmin` 角色，三级权限（user/admin/superadmin）。新增 `superAdminAuth.js` 中间件。
2. **数据库管理页面**：管理后台新增「数据库管理」入口（仅 superadmin 可见），支持：
   - 表列表展示（表名、记录数、数据大小）
   - 表结构查看（字段、类型、约束、索引）
   - 数据浏览（分页、搜索、排序）
   - 行内编辑、删除（带确认弹窗）
3. **审计日志**：新增 `DatabaseAuditLog` 模型，记录所有数据编辑/删除操作（操作者、时间、变更内容）。
4. **前端实现**：`DatabaseManager.tsx` + `databaseService.ts`，玻璃拟态 UI 风格与现有管理后台一致。

### 2026-03-01 (Session 4)
全面迁移至 MySQL 数据库架构：
1. **数据层重构**：引入 Sequelize ORM 构建 8 个数据模型，实现复杂表间关联（一对多、多对多、自关联），支持细粒度的约束和外键连级管理。
2. **控制器完全替换**：将全部 Controller、Service 及 Middleware 从基于 LowDB 的 JSON 操作改写为异步 SQL 查询，优化内存占用与并发性能（如 COUNT/SUM 替代数组遍历）。
3. **数据无损迁移**：开发了 `scripts/migrateData.js` 脚本，将旧版 database.json 中包含的 5 个用户、8 个期刊、34 条级联评论等历史数据平滑迁移到 MySQL，期间完成 Integer ID 到 UUID 主键的安全转换和 Decimal 的格式修正。

### 2026-03-01 (Session 4)
全面迁移至 MySQL 数据库架构：
1. **数据层重构**：引入 Sequelize ORM 构建 8 个数据模型，实现复杂表间关联
2. **控制器完全替换**：将全部 Controller、Service 及 Middleware 从 LowDB 改写为异步 SQL 查询
3. **数据无损迁移**：开发 `scripts/migrateData.js` 脚本，完成历史数据平滑迁移

---
**维护说明**: 每次会话结束时更新此区域，保留最近 3 次会话记录。