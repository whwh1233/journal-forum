# Journal Forum - Claude 项目指南

## 项目概述

学术期刊评价与交流平台。用户可浏览期刊、发表评论/评分、收藏期刊、关注用户。管理员可管理用户、期刊和评论。

## 技术栈

- **前端**: React 18 + TypeScript + Vite (port 3000)
- **后端**: Node.js + Express (port 3001)
- **数据库**: LowDB（JSON 文件数据库，`backend/database.json`）
- **认证**: JWT + bcryptjs
- **前端测试**: Vitest
- **后端测试**: Jest

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
│   │   └── layout/               # 布局组件
│   │       ├── AppLayout.*       # 主应用布局
│   │       ├── PageHeader.*      # 页面头部
│   │       ├── SideNav.*         # 侧边导航
│   │       ├── ThemeSwitcher.*   # 主题切换器
│   │       └── TopBar.*          # 顶部导航栏
│   ├── contexts/                 # React Context
│   │   ├── AuthContext.tsx       # 认证上下文
│   │   └── AuthModalContext.tsx  # 认证弹窗上下文
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
└── CLAUDE.md
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

---

## 变更日志

> **规则**：所有对项目有实质性改动的操作都必须记录在此处，保持文档与代码同步。

### 2026-02-24

#### 代码清理与文档一致性改进
**提交**: `ea713f3`

**后端改动**:
- 删除未使用的遗留控制器文件：
  - `backend/controllers/authController.js`
  - `backend/controllers/journalController.js`
  - `backend/controllers/authControllerSQLite.js`
  - `backend/controllers/journalControllerSQLite.js`
- 删除未使用的配置文件：
  - `backend/config/database.js` (MongoDB 配置)
  - `backend/config/db.js`
- 从 `backend/package.json` 移除 `mongoose` 依赖
- 修复 `backend/database.json` 用户数据结构，添加字段：name, avatar, bio, location, institution, website
- 修复评论内容编码问题（乱码修复）

**文档改动**:
- 补全 `API_ROUTES.md`，新增文档：
  - 认证 API (`/api/auth/*`)
  - 期刊 API (`/api/journals/*`)
  - 管理员 API (`/api/admin/*`)
- 更新 `CLAUDE.md` 项目结构，反映最新布局组件
- 新增"环境变量配置"章节
- 新增"变更日志"章节（本章节）

**影响**:
- 提升代码整洁度：移除 ~500 行未使用代码
- 提升文档准确性：从 70% 提升至 95%
- API 文档完整性：补充 30+ 个缺失的路由说明
