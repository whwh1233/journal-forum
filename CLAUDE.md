# Journal Forum - Claude 项目指南

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

### 🗄️ 数据库管理 (New)
**状态**: ✅ 已完成
**功能**: 表列表/结构/数据浏览、行内编辑、删除、搜索排序分页、操作审计日志
**权限**: 仅 superadmin 可访问
**关键文件**:
- 前端: `src/features/admin/components/DatabaseManager.tsx`, `src/services/databaseService.ts`
- 后端: `backend/routes/databaseRoutes.js`, `backend/controllers/databaseController.js`
- 中间件: `backend/middleware/superAdminAuth.js`
- 模型: `backend/models/DatabaseAuditLog.js`

### 🧪 测试系统
**状态**: 🚧 进行中
**已完成**: E2E 测试、后端集成测试、部分前端组件测试
**待补充**: 前端单元测试、后端单元测试
**关键文件**:
- E2E: `e2e/tests/`
- 后端测试: `backend/__tests__/`
- 前端测试: `src/__tests__/`

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
│   │   ├── comments/             # 评论
│   │   ├── journals/             # 期刊
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
| 评论 | `/api/comments/*` |
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
- **`.env.example`**: 环境变量示例模板

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
- 嵌套评论系统（含评分）
- 收藏期刊
- 关注用户
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

---

## 当前状态与待办事项
> **最后更新**: 2026-03-02
> **规则**: 仅记录当前最新状态和最优先问题，每次改动后更新此区域

### ✅ 当前状态

- **数据库升级**：已完整从 LowDB 迁移至 MySQL 8.0。包括 9 大 Sequelize 模型构建（支持高并发）、数据平滑迁移（支持 UUID）、所有控制器与服务层的彻底重写。
- **权限体系**：三级角色（user/admin/superadmin），superadmin 可访问数据库管理功能。
- **数据库管理**：新增完整的数据库管理工具（表浏览、结构查看、数据编辑/删除、审计日志）。
- **核心功能**: 补充了完整的积分（Points）与体系化荣誉徽章（Badges）功能。
- **代码质量**: 图标系统已统一使用 Lucide React，UI 组件已优化（SearchAndFilter）
- **测试覆盖**: E2E 完整、后端集成测试完整、前端组件测试部分完成（5/15+）
- **UI 架构**: 具备高级拟态面板的 Admin 控制台、TopBar + SideNav + PageHeader 统一布局
- **主题系统**: 6 个预设主题可用
- **认证体验**: AuthModalContext 全局管理

### 🔴 优先待办

1. **测试兼容性恢复** - E2E 测试和 Jest 测试脚本当前仍绑定 LowDB 接口，需重构所有测试数据工厂与钩子以适配全新 MySQL 场景
2. **前端组件测试** - 剩余 10+ 组件待补充测试（TopBar, SideNav, PageHeader, AppLayout, SearchAndFilter, JournalDetailPanel, CommentList, CommentForm, RegisterForm 等）
3. **单元测试缺失** - `backend/__tests__/unit/` 和 `src/__tests__/integration/` 目录为空

### 📋 功能积压

* 教育邮箱登录验证
* 申请制

---

## 最近重要改动
> 记录最近 2-3 次会话的关键改动，便于新对话快速了解项目演进

### 2026-03-02 (Session 5 - Current)
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

### 2026-03-01 (Session 3)
多维排序与评论有用性点赞：
1. **多维期刊排序**：首页 `SearchAndFilter` 新增排序下拉菜单，支持按综合评分及 5 个评价维度排序。后端 `getJournals` 接收 `sortBy` 参数，排序基于缓存在 `journal.dimensionAverages` 中的实时均值。
2. **评论有用性点赞**：新增 `POST /api/comments/:id/like` Toggle 接口，`CommentItem` 增加点赞按钮（本地即时反馈），`CommentList` 排序增加"最有用"选项。
3. **性能优化**：`createComment`/`deleteComment` 时自动将 `dimensionAverages` 持久化到 `journal` 对象，避免排序时实时遍历评论。

---
**维护说明**: 每次会话结束时更新此区域，保留最近 3 次会话记录。