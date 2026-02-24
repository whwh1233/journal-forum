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

> **最后更新**: 2026-02-24
> **规则**: 仅记录当前最新状态和最优先问题，每次改动后更新此区域

### ✅ 当前状态

- **代码整洁度**: 已清理所有未使用的遗留文件（MongoDB/SQLite 控制器和配置）
- **文档完整性**: API_ROUTES.md 已补全所有路由文档（认证、期刊、管理员）
- **数据结构**: 用户数据结构完整（包含 name, avatar, bio 等字段）
- **项目结构**: CLAUDE.md 已同步最新的布局组件结构
- **编码问题**: database.json 评论内容乱码已修复
- **UI 架构**: 完成布局系统重构，统一使用 AppLayout + TopBar + SideNav + PageHeader 组件
- **认证体验**: 新增 AuthModalContext 实现全局认证弹窗管理，所有用户可通过 SideNav 和 TopBar 下拉菜单退出登录
- **期刊交互**: JournalDetailModal 改为 JournalDetailPanel，交互更流畅
- **主题系统**: 实现完整的多主题色彩系统，支持 6 个精美主题（默认蓝、温暖自然、日落辉光、复古橄榄、柔和大地、暖秋大地）

### 🔴 优先待办

1. **单元测试缺失** - `backend/__tests__/unit/` 和 `src/__tests__/integration/` 目录为空
2. **生产环境准备** - LowDB 需迁移至 PostgreSQL/MongoDB（生产部署前必做）
