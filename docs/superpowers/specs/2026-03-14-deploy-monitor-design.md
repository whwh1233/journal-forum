# 部署监控系统设计

## 概述

为 webhook 自动化部署脚本添加可视化监控能力。部署脚本写入状态文件，后端提供 API 读取，前端在管理后台展示部署状态面板。仅 superadmin 可访问。

## 目标

- 可视化查看当前部署版本、Git commit、部署时间
- 实时展示前后端健康状态（后端进程、数据库连接、PM2 状态）
- 记录部署历史，方便出问题时快速定位回滚版本
- 轻量化实现，不引入额外基础设施

## 架构

```
部署脚本 (shell)
    │
    ├── 写入 deploy-status.json（当前状态，覆盖）
    └── 追加 deploy-history.json（历史记录，保留最近 50 条）
              │
              ▼
后端 API (/api/deploy/*)  ← superAdminProtect 中间件（router 内部挂载）
    │
    ├── GET /status   → 读 deploy-status.json
    ├── GET /history  → 读 deploy-history.json
    └── GET /health   → 运行时采集（DB ping、PM2 jlist、进程信息）
              │
              ▼
前端管理后台 → DeployMonitor 页面（superadmin 专属）
```

## 模块 1：部署脚本

### 修改现有 webhook 部署脚本

在每个关键步骤写入状态，生成两个 JSON 文件。

### deploy-status.json（当前部署状态）

位置：`backend/deploy-status.json`

```json
{
  "version": "0.1.0",
  "gitHash": "8ce119b",
  "gitBranch": "main",
  "commitMessage": "feat: add deploy monitoring",
  "commitAuthor": "wwj",
  "deployTime": "2026-03-14T15:30:00+08:00",
  "frontendBuild": "success",
  "backendDeps": "success",
  "pm2Restart": "success",
  "overallStatus": "success"
}
```

字段说明：
- `version`：从 package.json 读取
- `gitHash`：`git rev-parse --short HEAD`
- `gitBranch`：当前分支名
- `commitMessage` / `commitAuthor`：最近一次提交信息
- `deployTime`：部署执行时间（ISO 8601）
- `frontendBuild` / `backendDeps` / `pm2Restart`：各步骤状态（`pending` / `success` / `failed`）
- `overallStatus`：整体状态（`pending` / `success` / `failed`，任一步骤失败即为 `failed`，部署中断时保持 `pending`）

前端应处理 `pending` 状态（黄色圆点 + "部署中"），表示部署脚本可能正在执行或中途崩溃。

### deploy-history.json（部署历史）

位置：`backend/deploy-history.json`

```json
[
  {
    "version": "0.1.0",
    "gitHash": "8ce119b",
    "commitMessage": "feat: add deploy monitoring",
    "commitAuthor": "wwj",
    "deployTime": "2026-03-14T15:30:00+08:00",
    "overallStatus": "success"
  }
]
```

- 每次部署追加一条，按时间倒序
- 保留最近 50 条，超出自动截断

### 脚本写入逻辑

- 部署开始时初始化 `deploy-status.json`，所有步骤状态设为 `pending`
- 每个步骤完成后更新对应字段为 `success` 或 `failed`
- 部署结束后将摘要追加到 `deploy-history.json`
- 使用 `jq` 或 `node -e` 操作 JSON（服务器需安装 jq，或用内联 Node 脚本）

## 模块 2：后端 API

### 文件结构

```
backend/
├── controllers/deployController.js
├── routes/deployRoutes.js
```

### 路由注册

在 `server.js` 中挂载（与 databaseRoutes 同模式）：
```js
app.use('/api/deploy', deployRoutes);
```

在 `deployRoutes.js` 内部应用中间件（与 databaseRoutes.js 一致）：
```js
const { superAdminProtect } = require('../middleware/superAdminAuth');
router.use(superAdminProtect);
```

### 端点设计

#### GET /api/deploy/status

读取 `deploy-status.json` 返回当前部署状态。

响应：
```json
{
  "success": true,
  "data": {
    "version": "0.1.0",
    "gitHash": "8ce119b",
    "gitBranch": "main",
    "commitMessage": "feat: add deploy monitoring",
    "commitAuthor": "wwj",
    "deployTime": "2026-03-14T15:30:00+08:00",
    "frontendBuild": "success",
    "backendDeps": "success",
    "pm2Restart": "success",
    "overallStatus": "success"
  }
}
```

文件不存在时返回 `{ success: true, data: null, message: "暂无部署记录" }`。

#### GET /api/deploy/history

读取 `deploy-history.json` 返回部署历史列表。

查询参数：`?limit=20`（默认 20，最大 50）

响应：
```json
{
  "success": true,
  "data": [
    { "version": "0.1.0", "gitHash": "8ce119b", "commitMessage": "feat: ...", "commitAuthor": "wwj", "deployTime": "...", "overallStatus": "success" }
  ],
  "total": 5
}
```

#### GET /api/deploy/health

运行时采集健康状态，不依赖文件。

采集内容：
1. **后端进程**：`process.uptime()`、`process.version`
2. **数据库**：Sequelize 执行 `SELECT 1`，测量响应时间（ms）
3. **PM2 进程**：`child_process.exec('pm2 jlist')` 解析 JSON 输出（超时 5 秒）

响应：
```json
{
  "success": true,
  "data": {
    "backend": {
      "status": "running",
      "uptime": 3600,
      "nodeVersion": "v18.17.0"
    },
    "database": {
      "status": "connected",
      "responseTime": 12
    },
    "pm2": [
      {
        "name": "backend",
        "status": "online",
        "cpu": 2.1,
        "memory": 85.6,  // MB，后端从 PM2 的 bytes 转换
        "uptime": 3600,
        "restarts": 0
      }
    ]
  }
}
```

PM2 响应始终为统一结构：
```json
{
  "status": "ok",       // "ok" | "error"
  "error": null,        // 错误信息，正常时为 null
  "processes": [...]    // 进程列表，出错时为空数组
}
```

## 模块 3：前端面板

### 文件结构

```
src/features/admin/
├── DeployMonitor.tsx       # 页面主组件
├── DeployMonitor.css       # 样式
```

### 页面布局

```
┌─────────────────────────────────────────────────┐
│  部署监控                                        │
├─────────────────────────────────────────────────┤
│  ┌─当前版本──────────┐  ┌─服务健康状态─────────┐ │
│  │ v0.1.0 (8ce119b)  │  │ 后端: ● 运行中       │ │
│  │ main 分支          │  │ 数据库: ● 已连接 12ms│ │
│  │ 部署时间: 03-14... │  │ PM2: ● online        │ │
│  │ 状态: ✅ 成功      │  │   CPU: 2.1% 内存: 85M│ │
│  │ 提交: feat: add...│  │   运行: 2h 重启: 0次  │ │
│  └───────────────────┘  └──────────────────────┘ │
├─────────────────────────────────────────────────┤
│  部署历史                                        │
│  ┌──────┬────────┬──────────────┬──────┐        │
│  │ 版本  │ Commit │ 部署时间      │ 状态 │        │
│  ├──────┼────────┼──────────────┼──────┤        │
│  │0.1.0 │8ce119b │03-14 15:30   │ ✅   │        │
│  │0.1.0 │4234309 │03-13 10:20   │ ❌   │        │
│  └──────┴────────┴──────────────┴──────┘        │
└─────────────────────────────────────────────────┘
```

### 交互设计

- 页面加载时并行请求 3 个 API（status、history、health）
- 健康状态每 30 秒自动刷新
- 状态指示圆点：绿色（正常）/ 红色（异常）/ 黄色（pending/部署中）
- 部署历史按时间倒序排列
- 加载状态和错误状态复用现有 admin 面板的模式

### 路由集成

- 在现有 admin 路由中添加 `/admin/deploy` 路由
- 在 admin 侧边栏添加「部署监控」入口
- 仅 superadmin 角色可见（复用现有角色判断逻辑）

### 样式规范

- 使用 CSS 变量，遵循设计系统
- 图标使用 Lucide React
- 响应式布局，上方两个卡片在窄屏时堆叠

## 部署脚本完整改造

附改造后部署脚本关键片段（通过环境变量传值，避免注入风险）：

```bash
#!/bin/bash
PROJECT_PATH="/www/wwwroot/journal-forum"
BRANCH="main"
STATUS_FILE="$PROJECT_PATH/backend/deploy-status.json"
HISTORY_FILE="$PROJECT_PATH/backend/deploy-history.json"

# 采集 Git 信息
VERSION=$(node -e "console.log(require('$PROJECT_PATH/package.json').version)")
GIT_HASH=$(git rev-parse --short HEAD)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT_MSG=$(git log -1 --pretty=format:"%s")
COMMIT_AUTHOR=$(git log -1 --pretty=format:"%an")
DEPLOY_TIME=$(date +"%Y-%m-%dT%H:%M:%S+08:00")  # 本地时间（服务器为 UTC+8）

# 写初始状态（所有步骤 pending）—— 通过环境变量传值避免 shell 注入
DEPLOY_VERSION="$VERSION" \
DEPLOY_HASH="$GIT_HASH" \
DEPLOY_BRANCH="$GIT_BRANCH" \
DEPLOY_MSG="$COMMIT_MSG" \
DEPLOY_AUTHOR="$COMMIT_AUTHOR" \
DEPLOY_TIME_VAL="$DEPLOY_TIME" \
STATUS_FILE_PATH="$STATUS_FILE" \
node -e "
const fs = require('fs');
fs.writeFileSync(process.env.STATUS_FILE_PATH, JSON.stringify({
  version: process.env.DEPLOY_VERSION,
  gitHash: process.env.DEPLOY_HASH,
  gitBranch: process.env.DEPLOY_BRANCH,
  commitMessage: process.env.DEPLOY_MSG,
  commitAuthor: process.env.DEPLOY_AUTHOR,
  deployTime: process.env.DEPLOY_TIME_VAL,
  frontendBuild: 'pending',
  backendDeps: 'pending',
  pm2Restart: 'pending',
  overallStatus: 'pending'
}, null, 2));
"

# --- 步骤更新示例（前端构建后）---
update_status() {
  local field=$1 value=$2
  FIELD="$field" VALUE="$value" STATUS_FILE_PATH="$STATUS_FILE" \
  node -e "
  const fs = require('fs');
  const status = JSON.parse(fs.readFileSync(process.env.STATUS_FILE_PATH, 'utf8'));
  status[process.env.FIELD] = process.env.VALUE;
  fs.writeFileSync(process.env.STATUS_FILE_PATH, JSON.stringify(status, null, 2));
  "
}

npm run build
if [ $? -eq 0 ]; then
  update_status "frontendBuild" "success"
else
  update_status "frontendBuild" "failed"
  update_status "overallStatus" "failed"
fi

# --- 部署结束后追加历史记录 ---
STATUS_FILE_PATH="$STATUS_FILE" HISTORY_FILE_PATH="$HISTORY_FILE" \
node -e "
const fs = require('fs');
const status = JSON.parse(fs.readFileSync(process.env.STATUS_FILE_PATH, 'utf8'));
if (status.overallStatus === 'pending') status.overallStatus = 'success';
fs.writeFileSync(process.env.STATUS_FILE_PATH, JSON.stringify(status, null, 2));

const historyPath = process.env.HISTORY_FILE_PATH;
let history = [];
try { history = JSON.parse(fs.readFileSync(historyPath, 'utf8')); } catch(e) {}
history.unshift({
  version: status.version,
  gitHash: status.gitHash,
  commitMessage: status.commitMessage,
  commitAuthor: status.commitAuthor,
  deployTime: status.deployTime,
  overallStatus: status.overallStatus
});
if (history.length > 50) history = history.slice(0, 50);
fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
"
```

## 不涉及的内容

- 不新建 Context，组件内直接 fetch
- 不新建数据库表
- 不引入新的 npm 依赖
- 不修改现有的 `/health` 端点
