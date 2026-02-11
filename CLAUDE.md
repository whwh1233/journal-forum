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
│   │   └── databaseTest.js       # 测试数据库配置
│   ├── controllers/              # 路由处理器（*Lowdb.js 命名）
│   ├── middleware/               # JWT 认证中间件
│   ├── routes/                   # API 路由
│   ├── __tests__/                # Jest 集成测试
│   ├── database.json             # JSON 数据库文件
│   └── server.js
├── src/
│   ├── components/               # 通用 UI 组件
│   ├── contexts/                 # React Context（认证等）
│   ├── features/                 # 功能模块
│   │   ├── auth/
│   │   ├── comments/
│   │   ├── profile/
│   │   ├── favorite/
│   │   ├── follow/
│   │   └── dashboard/
│   ├── services/                 # API 客户端（axios）
│   └── types/                    # TypeScript 类型定义
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

## 重要注意事项

- **数据库**: LowDB 仅适合开发，生产应迁移至 PostgreSQL/MongoDB
- **端口冲突**: `netstat -ano | findstr :3001` 查看占用进程
- **`.env.test`** 含测试 JWT 密钥，已加入 `.gitignore`，不要提交
- 后端控制器文件以 `Lowdb.js` 结尾（如 `userControllerLowdb.js`）
- 评论支持嵌套（最多 3 层），删除后显示为"[该评论已被删除]"

## 已实现功能

- 用户注册/登录（JWT）
- 期刊浏览、搜索、筛选
- 嵌套评论系统（含评分）
- 收藏期刊
- 关注用户
- 个人主页与仪表盘
- 管理后台（用户/期刊/评论管理）
- 速率限制、CORS、Helmet 安全头
