# Journal Forum - Claude 项目指南

## 项目概述

学术期刊评价与交流平台。用户可浏览期刊、发表评论/评分、收藏期刊、关注用户。管理员可管理用户、期刊和评论。

## 技术栈

- **前端**: React 18 + TypeScript + Vite (port 3000)
- **后端**: Node.js + Express (port 3001)
- **数据库**: LowDB（JSON 文件数据库，`backend/database.json`）
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
- 后端: `backend/routes/auth.js`, `backend/controllers/authControllerLowdb.js`
- 中间件: `backend/middleware/authMiddleware.js`

### 📚 期刊管理
**状态**: ✅ 已完成
**功能**: 期刊浏览、搜索筛选、详情查看、评分
**关键文件**:
- 前端: `src/features/journals/`, `src/hooks/useJournals.ts`
- 后端: `backend/routes/journals.js`, `backend/controllers/journalControllerLowdb.js`

### 💬 评论系统
**状态**: ✅ 已完成
**功能**: 嵌套评论（3 层）、点赞、删除标记
**关键文件**:
- 前端: `src/features/comments/`
- 后端: `backend/routes/comments.js`, `backend/controllers/commentControllerLowdb.js`

### ⭐ 收藏系统
**状态**: ✅ 已完成
**功能**: 收藏期刊、取消收藏、收藏列表
**关键文件**:
- 前端: `src/features/favorite/`
- 后端: `backend/routes/favorites.js`, `backend/controllers/favoriteControllerLowdb.js`

### 👥 关注系统
**状态**: ✅ 已完成
**功能**: 关注用户、取消关注、关注列表、粉丝列表
**关键文件**:
- 前端: `src/features/follow/`
- 后端: `backend/routes/follows.js`, `backend/controllers/followControllerLowdb.js`

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
- 后端: `backend/routes/users.js`, `backend/controllers/userControllerLowdb.js`

### 🛡️ 管理后台
**状态**: ✅ 已完成
**功能**: 用户管理、期刊管理、评论审核
**关键文件**:
- 前端: `src/features/admin/`
- 后端: `backend/routes/admin.js`, `backend/controllers/adminControllerLowdb.js`
- 中间件: `backend/middleware/adminMiddleware.js`

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
# 后端
cd backend && npm start

# 前端（另开终端）
npm run dev
```

访问 http://localhost:3000，后端 API：http://localhost:3001

## 项目结构

```
journal-forum/
├── e2e/                           # E2E 测试目录
│   ├── tests/                     # 测试用例
│   │   ├── demo.spec.ts           # 可视化演示测试
│   │   ├── user-flows.spec.ts     # 用户流程测试
│   │   └── monkey.spec.ts         # 随机交互测试
│   └── fixtures/
│       └── test-data.ts           # 测试数据和选择器
├── backend/
│   ├── config/
│   │   ├── databaseLowdb.js      # 生产数据库配置
│   │   ├── databaseTest.js       # 测试数据库配置
│   │   └── admin.js              # 管理员配置
│   ├── controllers/              # 路由处理器（*Lowdb.js 命名）
│   ├── middleware/               # JWT 认证、管理员认证中间件
│   ├── routes/                   # API 路由
│   ├── __tests__/                # Jest 集成测试
│   │   ├── integration/          # API 集成测试（完整）
│   │   └── unit/                 # 单元测试（待补充）
│   ├── database.json             # JSON 数据库文件
│   ├── .env                      # 后端环境变量（生产）
│   ├── .env.test                 # 后端测试环境变量
│   └── server.js
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
│   │   └── ThemeContext.tsx      # 主题管理上下文
│   ├── features/                 # 功能模块
│   │   ├── auth/                 # 认证
│   │   ├── comments/             # 评论
│   │   ├── journals/             # 期刊
│   │   ├── profile/              # 个人资料
│   │   ├── favorite/             # 收藏
│   │   ├── follow/               # 关注
│   │   ├── dashboard/            # 仪表盘
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
| 管理 | `/api/admin/*` |

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
npm run test:e2e:demo         # 可视化演示（慢速，便于观察）
npm run test:e2e:monkey       # 随机交互测试
npm run test:e2e:ui           # Playwright UI 模式
npm run test:e2e:report       # 查看测试报告
```

## 设置管理员账号

1. 通过 UI 注册账号
2. 编辑 `backend/database.json`
3. 找到该用户，将 `role` 从 `"user"` 改为 `"admin"`

## 环境变量配置

项目使用多个 `.env` 文件：

- **`backend/.env`**: 后端生产环境变量（JWT_SECRET, PORT 等）
- **`backend/.env.test`**: 后端测试环境变量（已加入 `.gitignore`，不要提交）
- **`.env.local`**: 前端环境变量（位于项目根目录）
- **`.env.example`**: 环境变量示例模板

## 重要注意事项

- **数据库**: LowDB 仅适合开发，生产应迁移至 PostgreSQL/MongoDB
- **端口冲突**: `netstat -ano | findstr :3001` 查看占用进程
- **控制器命名**: 所有活跃的后端控制器文件以 `Lowdb.js` 结尾（如 `userControllerLowdb.js`）
- **评论系统**: 支持嵌套（最多 3 层），删除后显示为"[该评论已被删除]"
- **用户数据结构**: 包含 name, avatar, bio, location, institution, website 等字段
- **测试覆盖**: 后端集成测试完整，前端组件测试完整，单元测试待补充

## 已实现功能

- 用户注册/登录（JWT）
- 期刊浏览、搜索、筛选
- 嵌套评论系统（含评分）
- 收藏期刊
- 关注用户
- 个人主页与仪表盘
- 管理后台（用户/期刊/评论管理）
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
> **最后更新**: 2026-02-26
> **规则**: 仅记录当前最新状态和最优先问题，每次改动后更新此区域

### ✅ 当前状态

- **代码质量**: 图标系统已统一使用 Lucide React，UI 组件已优化（SearchAndFilter）
- **测试覆盖**: E2E 完整、后端集成测试完整、前端组件测试部分完成（5/15+）
- **UI 架构**: AppLayout + TopBar + SideNav + PageHeader 统一布局
- **主题系统**: 6 个预设主题可用
- **认证体验**: AuthModalContext 全局管理

### 🔴 优先待办

1. **前端组件测试** - 剩余 10+ 组件待补充测试（TopBar, SideNav, PageHeader, AppLayout, SearchAndFilter, JournalDetailPanel, CommentList, CommentForm, RegisterForm 等）
2. **单元测试缺失** - `backend/__tests__/unit/` 和 `src/__tests__/integration/` 目录为空
3. **生产环境准备** - LowDB 需迁移至 PostgreSQL/MongoDB（生产部署前必做）

### 📋 功能积压

* 积分+徽章系统、活跃度记录和统计
* 教育邮箱登录验证
* 申请制