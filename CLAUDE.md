# 投哪儿 (pubWhere) - Claude 项目指南

学术期刊评价与交流平台。用户可浏览期刊、发表评论/评分、收藏期刊、关注用户。管理员可管理用户、期刊和评论。

## 技术栈

- **前端**: React 18 + TypeScript + Vite (port 3000)
- **后端**: Node.js + Express (port 3001)
- **数据库**: MySQL 8.0 (Sequelize ORM)
- **认证**: JWT + bcryptjs
- **测试**: Vitest (前端) / Jest (后端) / Playwright (E2E)

## 快速启动

```bash
# 后端
cd backend && npm start

# 前端（另开终端）
npm run dev

# 测试
npm test                    # 前端
cd backend && npm test      # 后端
npm run test:e2e            # E2E
```

## 项目结构概览

```
backend/
├── controllers/     # 路由处理器 (*Controller.js)
├── routes/          # API 路由 (*Routes.js)
├── models/          # Sequelize 模型
├── middleware/      # auth.js, adminAuth.js, superAdminAuth.js
└── __tests__/       # Jest 测试

src/
├── features/        # 功能模块 (auth, journals, posts, comments, admin...)
├── contexts/        # React Context (Auth, Theme, Journal, Post, Announcement...)
├── components/      # 布局和通用组件
├── services/        # API 客户端
└── __tests__/       # Vitest 测试
```

## API 路由前缀

| 模块 | 前缀 | 说明 |
|------|------|------|
| 认证 | `/api/auth/*` | 登录注册 |
| 期刊 | `/api/journals/*` | 期刊 CRUD |
| 评论 | `/api/comments/*` | 期刊评论 |
| 帖子 | `/api/posts/*` | 社区帖子 |
| 公告 | `/api/announcements/*` | 公告系统 |
| 管理 | `/api/admin/*` | 管理后台 |
| 数据库 | `/api/database/*` | superadmin 专属 |

## 用户角色

- `user` - 普通用户
- `admin` - 管理员
- `superadmin` - 超级管理员（可访问数据库管理）

## 核心功能模块

| 模块 | 前端入口 | 后端入口 |
|------|----------|----------|
| 认证 | `src/features/auth/` | `backend/routes/authRoutes.js` |
| 期刊 | `src/features/journals/` | `backend/routes/journalRoutes.js` |
| 评论 | `src/features/comments/` | `backend/routes/commentRoutes.js` |
| 帖子 | `src/features/posts/` | `backend/routes/postRoutes.js` |
| 公告 | `src/features/announcements/` | `backend/routes/announcementRoutes.js` |
| 管理 | `src/features/admin/` | `backend/routes/adminRoutes.js` |

## 开发规范

### 命名约定
- 控制器: `*Controller.js`
- 路由: `*Routes.js`
- 模型: `*.js` (PascalCase, 如 `User.js`)
- React 组件: PascalCase

### 代码风格
- 使用 CSS 变量，禁止硬编码颜色/间距/字号
- 图标统一使用 Lucide React
- 评论系统支持 3 层嵌套

### 设计系统
- 字体: Lexend (正文) / JetBrains Mono (代码)
- 字号: Perfect Fourth 比例 (12px ~ 50px)
- 组件尺寸: XS/SM/MD/LG/XL，默认 MD (40px)
- 详见: `docs/design-system.md`

## 环境变量

- `backend/.env` - 后端配置 (JWT_SECRET, DB_*)
- `.env.local` - 前端配置 (VITE_API_URL)

## 重要注意事项

1. 数据库已从 LowDB 迁移至 MySQL 8.0
2. 所有认证路由需要 `Authorization: Bearer <token>` 头
3. 删除的评论显示为 "[该评论已被删除]"
4. 端口冲突检查: `netstat -ano | findstr :3001`

## 详细文档

- 功能模块详情: `docs/features.md`
- 设计系统规范: `docs/design-system.md`
- API 完整文档: `docs/api.md`
- 主题系统: `THEMES.md`

---

## 当前状态

> 最后更新: 2026-03-14

**已完成**: 认证、期刊、评论、帖子、公告、收藏、关注、徽章、主题、管理后台、数据库管理

**待办**:
1. Design System 实施到所有组件
2. 补充单元测试

## 最近改动

### 2026-03-14
- 新增公告系统 (Announcement): 横幅、铃铛通知、紧急弹窗
- 前端测试 101 个用例通过

### 2026-03-10
- 新增 Design System 设计规范
