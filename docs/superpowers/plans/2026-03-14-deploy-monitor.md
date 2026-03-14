# Deploy Monitor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deployment monitoring panel to the admin dashboard so superadmins can see current deploy version, service health, and deploy history.

**Architecture:** Deploy script writes JSON status files. Backend reads them via 3 API endpoints under `/api/deploy/*` (superadmin-only). Frontend renders a monitoring page at `/admin/deploy` with version info, health checks, and deploy history table. Health data auto-refreshes every 30 seconds.

**Tech Stack:** Express.js (backend API), React + TypeScript (frontend), Lucide React (icons), CSS variables (styling), child_process (PM2 status), Sequelize (DB health check)

**Spec:** `docs/superpowers/specs/2026-03-14-deploy-monitor-design.md`

---

## Chunk 1: Backend API

### Task 1: Create deploy controller

**Files:**
- Create: `backend/controllers/deployController.js`

- [ ] **Step 1: Create deployController.js with getDeployStatus**

Read `deploy-status.json` from disk, return its contents. Handle file-not-found gracefully.

```javascript
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');
const { exec } = require('child_process');

const STATUS_FILE = path.join(__dirname, '..', 'deploy-status.json');
const HISTORY_FILE = path.join(__dirname, '..', 'deploy-history.json');

/**
 * GET /api/deploy/status
 * 返回当前部署状态
 */
const getDeployStatus = async (req, res) => {
  try {
    if (!fs.existsSync(STATUS_FILE)) {
      return res.json({ success: true, data: null, message: '暂无部署记录' });
    }
    const data = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get deploy status error:', error);
    res.status(500).json({ success: false, message: '获取部署状态失败', error: error.message });
  }
};
```

- [ ] **Step 2: Add getDeployHistory**

Read `deploy-history.json`, support `?limit=` query param (default 20, max 50).

```javascript
/**
 * GET /api/deploy/history
 * 返回部署历史记录
 */
const getDeployHistory = async (req, res) => {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return res.json({ success: true, data: [], total: 0 });
    }
    const allHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
    const data = allHistory.slice(0, limit);
    res.json({ success: true, data, total: allHistory.length });
  } catch (error) {
    console.error('Get deploy history error:', error);
    res.status(500).json({ success: false, message: '获取部署历史失败', error: error.message });
  }
};
```

- [ ] **Step 3: Add getHealthStatus**

Collect backend process info, database ping with response time, and PM2 process list via `pm2 jlist` (5s timeout). PM2 response always uses unified `{ status, error, processes }` shape.

```javascript
/**
 * GET /api/deploy/health
 * 返回实时健康状态
 */
const getHealthStatus = async (req, res) => {
  try {
    // 1. 后端进程信息
    const backend = {
      status: 'running',
      uptime: Math.floor(process.uptime()),
      nodeVersion: process.version
    };

    // 2. 数据库健康检查
    let database;
    try {
      const start = Date.now();
      await sequelize.query('SELECT 1');
      database = { status: 'connected', responseTime: Date.now() - start };
    } catch (dbError) {
      database = { status: 'disconnected', responseTime: null, error: dbError.message };
    }

    // 3. PM2 进程状态
    const pm2 = await new Promise((resolve) => {
      exec('pm2 jlist', { timeout: 5000 }, (error, stdout) => {
        if (error) {
          return resolve({ status: 'error', error: error.message, processes: [] });
        }
        try {
          const list = JSON.parse(stdout);
          const processes = list.map(p => ({
            name: p.name,
            status: p.pm2_env?.status || 'unknown',
            cpu: p.monit?.cpu || 0,
            memory: parseFloat(((p.monit?.memory || 0) / 1024 / 1024).toFixed(1)),
            uptime: p.pm2_env?.pm_uptime ? Math.floor((Date.now() - p.pm2_env.pm_uptime) / 1000) : 0,
            restarts: p.pm2_env?.restart_time || 0
          }));
          resolve({ status: 'ok', error: null, processes });
        } catch (parseError) {
          resolve({ status: 'error', error: 'Failed to parse PM2 output', processes: [] });
        }
      });
    });

    res.json({ success: true, data: { backend, database, pm2 } });
  } catch (error) {
    console.error('Get health status error:', error);
    res.status(500).json({ success: false, message: '获取健康状态失败', error: error.message });
  }
};

module.exports = { getDeployStatus, getDeployHistory, getHealthStatus };
```

- [ ] **Step 4: Commit**

```bash
git add backend/controllers/deployController.js
git commit -m "feat(deploy): add deploy controller with status, history, and health endpoints"
```

---

### Task 2: Create deploy routes and register in server

**Files:**
- Create: `backend/routes/deployRoutes.js`
- Modify: `backend/server.js:127` (add route registration after announcementRoutes)

- [ ] **Step 1: Create deployRoutes.js**

Follow the exact pattern from `backend/routes/databaseRoutes.js` — import `superAdminProtect`, apply via `router.use()`, map routes to controller.

```javascript
const express = require('express');
const router = express.Router();
const { superAdminProtect } = require('../middleware/superAdminAuth');
const {
  getDeployStatus,
  getDeployHistory,
  getHealthStatus
} = require('../controllers/deployController');

// 所有路由需要超级管理员权限
router.use(superAdminProtect);

// 获取当前部署状态
router.get('/status', getDeployStatus);

// 获取部署历史
router.get('/history', getDeployHistory);

// 获取实时健康状态
router.get('/health', getHealthStatus);

module.exports = router;
```

- [ ] **Step 2: Register route in server.js**

In `backend/server.js`, add import and route registration. Add after the last route registration (line 127, `announcementRoutes`):

```javascript
// At imports section (near other route imports):
const deployRoutes = require('./routes/deployRoutes');

// At route registration (after line 127, after announcementRoutes):
app.use('/api/deploy', deployRoutes);
```

- [ ] **Step 3: Verify server starts**

Run: `cd backend && NODE_ENV=test node -e "require('./server'); console.log('OK'); process.exit(0);"` — use `NODE_ENV=test` to skip database connection and port binding.

- [ ] **Step 4: Commit**

```bash
git add backend/routes/deployRoutes.js backend/server.js
git commit -m "feat(deploy): add deploy routes with superadmin protection"
```

---

### Task 3: Add deploy JSON files to .gitignore

**Files:**
- Modify: `.gitignore`

Do this before backend tests to prevent test-generated fixtures from being accidentally staged.

- [ ] **Step 1: Add to .gitignore**

In the root `.gitignore`, add:

```
# Deploy status files (generated on server)
backend/deploy-status.json
backend/deploy-history.json
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add deploy status files to .gitignore"
```

---

### Task 4: Backend tests for deploy API

**Files:**
- Create: `backend/__tests__/integration/deploy.test.js`

Follow the test pattern from `backend/__tests__/integration/auth.test.js` and `DatabaseManager.test.tsx`.

- [ ] **Step 1: Write tests for all 3 endpoints**

Test cases:
1. `GET /status` — returns null data with message when file doesn't exist
2. `GET /status` — returns deploy status when file exists
3. `GET /status` — handles malformed JSON gracefully (returns 500)
4. `GET /history` — returns empty array when file doesn't exist
5. `GET /history` — returns history list with default limit
6. `GET /history?limit=3` — respects limit parameter
7. `GET /health` — returns backend info (status, uptime, nodeVersion)
8. `GET /health` — returns database status (may be disconnected in test env)
9. `GET /health` — returns PM2 status with unified shape

Test the controller directly without auth middleware (unit test). The health endpoint's database and PM2 sections may show error/disconnected states in test — assert the response shape, not the specific status.

```javascript
const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

const {
  getDeployStatus,
  getDeployHistory,
  getHealthStatus
} = require('../../controllers/deployController');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.get('/api/deploy/status', getDeployStatus);
  app.get('/api/deploy/history', getDeployHistory);
  app.get('/api/deploy/health', getHealthStatus);
  return app;
};

describe('Deploy API', () => {
  let app;
  const statusFile = path.join(__dirname, '..', '..', 'deploy-status.json');
  const historyFile = path.join(__dirname, '..', '..', 'deploy-history.json');

  beforeAll(() => {
    app = createTestApp();
  });

  afterEach(() => {
    try { fs.unlinkSync(statusFile); } catch(e) {}
    try { fs.unlinkSync(historyFile); } catch(e) {}
  });

  describe('GET /api/deploy/status', () => {
    it('should return null with message when no status file exists', async () => {
      const res = await request(app).get('/api/deploy/status').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
      expect(res.body.message).toBe('暂无部署记录');
    });

    it('should return status when file exists', async () => {
      const mockStatus = {
        version: '0.1.0',
        gitHash: 'abc1234',
        gitBranch: 'main',
        overallStatus: 'success'
      };
      fs.writeFileSync(statusFile, JSON.stringify(mockStatus));

      const res = await request(app).get('/api/deploy/status').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.version).toBe('0.1.0');
      expect(res.body.data.gitHash).toBe('abc1234');
    });

    it('should return 500 on malformed JSON', async () => {
      fs.writeFileSync(statusFile, '{invalid json}');
      const res = await request(app).get('/api/deploy/status').expect(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/deploy/history', () => {
    it('should return empty array when no history file', async () => {
      const res = await request(app).get('/api/deploy/history').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('should return history with default limit', async () => {
      const history = Array.from({ length: 25 }, (_, i) => ({
        version: '0.1.0',
        gitHash: `hash${i}`,
        overallStatus: 'success'
      }));
      fs.writeFileSync(historyFile, JSON.stringify(history));

      const res = await request(app).get('/api/deploy/history').expect(200);
      expect(res.body.data).toHaveLength(20); // default limit
      expect(res.body.total).toBe(25);
    });

    it('should respect limit parameter', async () => {
      const history = Array.from({ length: 10 }, (_, i) => ({
        version: '0.1.0',
        gitHash: `hash${i}`,
        overallStatus: 'success'
      }));
      fs.writeFileSync(historyFile, JSON.stringify(history));

      const res = await request(app).get('/api/deploy/history?limit=3').expect(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.total).toBe(10);
    });
  });

  describe('GET /api/deploy/health', () => {
    it('should return health data with correct shape', async () => {
      const res = await request(app).get('/api/deploy/health').expect(200);
      expect(res.body.success).toBe(true);

      // Backend section — always running in test
      expect(res.body.data.backend.status).toBe('running');
      expect(res.body.data.backend.nodeVersion).toMatch(/^v\d+/);
      expect(typeof res.body.data.backend.uptime).toBe('number');

      // Database section — check shape (may be disconnected in test)
      expect(res.body.data.database).toHaveProperty('status');
      expect(['connected', 'disconnected']).toContain(res.body.data.database.status);

      // PM2 section — check unified shape (likely error in test env)
      expect(res.body.data.pm2).toHaveProperty('status');
      expect(res.body.data.pm2).toHaveProperty('processes');
      expect(Array.isArray(res.body.data.pm2.processes)).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd backend && npx jest __tests__/integration/deploy.test.js --verbose`

- [ ] **Step 3: Commit**

```bash
git add backend/__tests__/integration/deploy.test.js
git commit -m "test(deploy): add unit tests for deploy API endpoints"
```

---

## Chunk 2: Deploy Script

### Task 5: Create the deployment script

**Files:**
- Create: `scripts/deploy.sh`

- [ ] **Step 1: Write the full deploy script**

This is the complete webhook deployment script with status tracking. It replaces the user's existing script. All git metadata is passed to Node via environment variables to prevent shell injection.

```bash
#!/bin/bash

# ========================================================
# 自动化部署脚本 — 带状态追踪
# ========================================================
PROJECT_PATH="/www/wwwroot/journal-forum"
BRANCH="main"
STATUS_FILE="$PROJECT_PATH/backend/deploy-status.json"
HISTORY_FILE="$PROJECT_PATH/backend/deploy-history.json"

echo "########################################################"
echo "  [开始部署] 启动自动化流水线"
echo "  [当前时间] $(date '+%Y-%m-%d %H:%M:%S')"
echo "########################################################"

# --- 1. 进入项目目录 ---
echo ""
echo ">>> STEP 1: 进入项目目录"
cd $PROJECT_PATH || { echo "ERROR: 找不到目录 $PROJECT_PATH"; exit 1; }
echo "    [成功] 当前路径: $(pwd)"

# --- 2. 代码同步 ---
echo ""
echo ">>> STEP 2: 同步远程代码 (Branch: $BRANCH)"
git fetch --all
git reset --hard origin/$BRANCH
git pull origin $BRANCH

echo "--------------------------------------------------------"
echo "【本次部署内容详情】"
git log -1 --pretty=format:"提交哈希: %h%n提交作者: %an%n提交日期: %ad%n提交说明: %s"
echo ""
echo "--------------------------------------------------------"

# --- 采集 Git 信息 ---
VERSION=$(node -e "console.log(require('./package.json').version)")
GIT_HASH=$(git rev-parse --short HEAD)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT_MSG=$(git log -1 --pretty=format:"%s")
COMMIT_AUTHOR=$(git log -1 --pretty=format:"%an")
DEPLOY_TIME=$(date +"%Y-%m-%dT%H:%M:%S+08:00")

# --- 写初始状态（所有步骤 pending）---
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

# --- 状态更新辅助函数 ---
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

# --- 3. 前端构建 ---
echo ""
echo ">>> STEP 3: 前端构建 (NPM Build)"
echo "    正在安装依赖... (请稍候)"
npm install --no-audit --no-fund --quiet
echo "    正在执行打包... (Vite)"
npm run build

if [ $? -eq 0 ]; then
    echo "    [成功] 前端打包文件已更新 (dist)"
    update_status "frontendBuild" "success"
else
    echo "    [失败] 前端打包出错，部署中断！"
    update_status "frontendBuild" "failed"
    update_status "overallStatus" "failed"
    # 即使失败也记录历史
    STATUS_FILE_PATH="$STATUS_FILE" HISTORY_FILE_PATH="$HISTORY_FILE" \
    node -e "
    const fs = require('fs');
    const status = JSON.parse(fs.readFileSync(process.env.STATUS_FILE_PATH, 'utf8'));
    const historyPath = process.env.HISTORY_FILE_PATH;
    let history = [];
    try { history = JSON.parse(fs.readFileSync(historyPath, 'utf8')); } catch(e) {}
    history.unshift({ version: status.version, gitHash: status.gitHash, commitMessage: status.commitMessage, commitAuthor: status.commitAuthor, deployTime: status.deployTime, overallStatus: status.overallStatus });
    if (history.length > 50) history = history.slice(0, 50);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    "
    exit 1
fi

# --- 4. 后端依赖 ---
echo ""
echo ">>> STEP 4: 后端依赖检查"
cd backend || { echo "ERROR: 找不到 backend 目录"; exit 1; }
npm install --no-audit --no-fund --quiet

if [ $? -eq 0 ]; then
    echo "    [成功] 后端依赖同步完毕"
    update_status "backendDeps" "success"
else
    echo "    [失败] 后端依赖安装失败！"
    update_status "backendDeps" "failed"
    update_status "overallStatus" "failed"
fi

# --- 5. 重启 PM2 ---
echo ""
echo ">>> STEP 5: 重启 PM2 进程"
cd $PROJECT_PATH
pm2 restart all

if [ $? -eq 0 ]; then
    echo "    [成功] PM2 进程已重启"
    update_status "pm2Restart" "success"
else
    echo "    [失败] PM2 重启失败！"
    update_status "pm2Restart" "failed"
    update_status "overallStatus" "failed"
fi

echo "--------------------------------------------------------"
pm2 status
echo "--------------------------------------------------------"

# --- 6. 完成部署，写历史记录 ---
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

echo ""
echo "########################################################"
echo "  [部署完成] v$VERSION ($GIT_HASH)"
echo "  [完成时间] $(date '+%Y-%m-%d %H:%M:%S')"
echo "########################################################"
```

- [ ] **Step 2: Commit**

```bash
git add scripts/deploy.sh
git commit -m "feat(deploy): add deployment script with status tracking"
```

---

## Chunk 3: Frontend — Deploy Monitor Page

### Task 6: Create deployService and DeployMonitor component

**Files:**
- Create: `src/services/deployService.ts`
- Create: `src/features/admin/components/DeployMonitor.tsx`
- Create: `src/features/admin/components/DeployMonitor.css`

**Note:** Spec says "不新建 Context，组件内直接 fetch", but the codebase pattern is to use a service module (see `databaseService.ts`, `adminService.ts`). We follow the codebase pattern with a lightweight service for consistency.

**Note:** Use @ui-ux-pro-max skill for implementing this component's UI design.

- [ ] **Step 1a: Create deployService.ts**

Follow the `src/services/databaseService.ts` pattern — `getAuthHeaders()` reads token from `localStorage`.

```typescript
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const deployService = {
  getStatus: async () => {
    const res = await fetch('/api/deploy/status', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('获取部署状态失败');
    return res.json();
  },
  getHistory: async (limit = 20) => {
    const res = await fetch(`/api/deploy/history?limit=${limit}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('获取部署历史失败');
    return res.json();
  },
  getHealth: async () => {
    const res = await fetch('/api/deploy/health', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('获取健康状态失败');
    return res.json();
  },
};
```

- [ ] **Step 1b: Create DeployMonitor.tsx**

The component uses `deployService` for API calls, renders version info card + health card + history table. Health auto-refreshes every 30 seconds.

Must include `usePageTitle('部署监控')` from `@/contexts/PageContext` — every admin page uses this.

TypeScript interfaces:

```typescript
interface DeployStatus {
  version: string;
  gitHash: string;
  gitBranch: string;
  commitMessage: string;
  commitAuthor: string;
  deployTime: string;
  frontendBuild: 'pending' | 'success' | 'failed';
  backendDeps: 'pending' | 'success' | 'failed';
  pm2Restart: 'pending' | 'success' | 'failed';
  overallStatus: 'pending' | 'success' | 'failed';
}

interface HealthData {
  backend: { status: string; uptime: number; nodeVersion: string };
  database: { status: string; responseTime: number | null; error?: string };
  pm2: {
    status: 'ok' | 'error';
    error: string | null;
    processes: Array<{
      name: string;
      status: string;
      cpu: number;
      memory: number;
      uptime: number;
      restarts: number;
    }>;
  };
}

interface DeployHistoryItem {
  version: string;
  gitHash: string;
  commitMessage: string;
  commitAuthor: string;
  deployTime: string;
  overallStatus: 'pending' | 'success' | 'failed';
}
```

Component structure:
- `usePageTitle('部署监控')` — from `@/contexts/PageContext`
- `useState` for `status`, `health`, `history`, `loading`, `error`
- `useEffect` on mount: call `deployService.getStatus()`, `.getHistory()`, `.getHealth()` in parallel via `Promise.all`
- `useEffect` with 30s interval: re-fetch `deployService.getHealth()` only
- Cleanup intervals on unmount
- Manual refresh button using `RefreshCw` icon to re-fetch all data

Layout:
- Top row: two cards side by side (version info + health status)
- Bottom: deploy history table
- Status dots: green circle for success/running/connected, red for failed/disconnected/error, yellow for pending
- Format uptime as human-readable (e.g., "2h 15m")
- Format memory as "XXX MB"
- Lucide icons: `Server`, `Database`, `GitBranch`, `Clock`, `RefreshCw`, `CheckCircle`, `XCircle`, `AlertCircle`

- [ ] **Step 2: Create DeployMonitor.css**

Use CSS variables from the design system. Key classes:
- `.deploy-monitor` — page container
- `.deploy-cards` — flex row for the two top cards, wraps on narrow screens
- `.deploy-card` — individual card with border, padding, border-radius
- `.status-dot` — colored circle indicator (`.success`, `.error`, `.pending` variants)
- `.deploy-history-table` — styled table matching existing admin tables
- `.step-badge` — small badge showing step status (success/failed/pending)

- [ ] **Step 3: Commit**

```bash
git add src/services/deployService.ts src/features/admin/components/DeployMonitor.tsx src/features/admin/components/DeployMonitor.css
git commit -m "feat(deploy): add deployService and DeployMonitor frontend component"
```

---

### Task 7: Integrate DeployMonitor into admin routes and navigation

**Files:**
- Modify: `src/features/admin/index.ts` (add export)
- Modify: `src/App.tsx:211-218` (add route)
- Modify: `src/components/layout/SideNav.tsx:78-83` (add nav item)

- [ ] **Step 1: Export from admin index**

In `src/features/admin/index.ts`, add:

```typescript
export { default as DeployMonitor } from './components/DeployMonitor';
```

- [ ] **Step 2: Add route in App.tsx**

In `src/App.tsx`, add import at the top (near other admin imports):

```typescript
import { DeployMonitor } from './features/admin';
```

Add route inside the admin routes section (after the `/admin/database` route around line 218):

```tsx
<Route
  path="/admin/deploy"
  element={
    <SuperAdminRoute>
      <DeployMonitor />
    </SuperAdminRoute>
  }
/>
```

- [ ] **Step 3: Add sidebar navigation item**

In `src/components/layout/SideNav.tsx`, add `Rocket` to the Lucide icon imports. Then find the existing superadmin conditional block (around line 78-83, the `{user?.role === 'superadmin' && ...}` that wraps the Database NavLink) and add the deploy NavLink inside the same block using a fragment:

```tsx
{user?.role === 'superadmin' && (
  <>
    <NavLink to="/admin/database" className={({ isActive }) => `side-nav-item${isActive ? ' active' : ''}`} title={expanded ? undefined : '数据库管理'}>
      <Database className="side-nav-icon" size={20} />
      <span className="side-nav-label">数据库管理</span>
    </NavLink>
    <NavLink to="/admin/deploy" className={({ isActive }) => `side-nav-item${isActive ? ' active' : ''}`} title={expanded ? undefined : '部署监控'}>
      <Rocket className="side-nav-icon" size={20} />
      <span className="side-nav-label">部署监控</span>
    </NavLink>
  </>
)}
```

- [ ] **Step 4: Verify the app compiles**

Run: `npm run build` (or `npx tsc --noEmit` for type checking only)

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/index.ts src/App.tsx src/components/layout/SideNav.tsx
git commit -m "feat(deploy): integrate DeployMonitor into admin routes and sidebar"
```

---

## Chunk 4: Frontend Tests

### Task 8: Add frontend tests for DeployMonitor

**Files:**
- Create: `src/__tests__/components/admin/DeployMonitor.test.tsx`

Follow the test pattern from `src/__tests__/components/admin/DatabaseManager.test.tsx` — mock the service module and `usePageTitle`.

- [ ] **Step 1: Write component tests**

```typescript
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DeployMonitor from '@/features/admin/components/DeployMonitor';

// Mock PageContext
vi.mock('@/contexts/PageContext', () => ({
  usePageTitle: vi.fn(),
}));

// Mock deploy service
vi.mock('@/services/deployService', () => ({
  deployService: {
    getStatus: vi.fn(),
    getHistory: vi.fn(),
    getHealth: vi.fn(),
  },
}));

import { deployService } from '@/services/deployService';

const mockStatus = {
  success: true,
  data: {
    version: '0.1.0',
    gitHash: 'abc1234',
    gitBranch: 'main',
    commitMessage: 'feat: test',
    commitAuthor: 'wwj',
    deployTime: '2026-03-14T15:30:00+08:00',
    frontendBuild: 'success',
    backendDeps: 'success',
    pm2Restart: 'success',
    overallStatus: 'success',
  },
};

const mockHistory = {
  success: true,
  data: [
    { version: '0.1.0', gitHash: 'abc1234', commitMessage: 'feat: test', commitAuthor: 'wwj', deployTime: '2026-03-14T15:30:00+08:00', overallStatus: 'success' },
    { version: '0.1.0', gitHash: 'def5678', commitMessage: 'fix: bug', commitAuthor: 'wwj', deployTime: '2026-03-13T10:00:00+08:00', overallStatus: 'failed' },
  ],
  total: 2,
};

const mockHealth = {
  success: true,
  data: {
    backend: { status: 'running', uptime: 3600, nodeVersion: 'v18.17.0' },
    database: { status: 'connected', responseTime: 12 },
    pm2: { status: 'ok', error: null, processes: [{ name: 'backend', status: 'online', cpu: 2.1, memory: 85.6, uptime: 3600, restarts: 0 }] },
  },
};

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <DeployMonitor />
    </BrowserRouter>
  );
};

describe('DeployMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (deployService.getStatus as Mock).mockResolvedValue(mockStatus);
    (deployService.getHistory as Mock).mockResolvedValue(mockHistory);
    (deployService.getHealth as Mock).mockResolvedValue(mockHealth);
  });

  it('renders loading state initially', () => {
    renderComponent();
    // Component should show loading indicator before data arrives
    expect(deployService.getStatus).toHaveBeenCalled();
  });

  it('renders deploy status with version info', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/0\.1\.0/)).toBeInTheDocument();
      expect(screen.getByText(/abc1234/)).toBeInTheDocument();
    });
  });

  it('renders health status for backend and database', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/v18\.17\.0/)).toBeInTheDocument();
    });
  });

  it('renders deploy history table', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/def5678/)).toBeInTheDocument();
    });
  });

  it('shows message when no deploy status exists', async () => {
    (deployService.getStatus as Mock).mockResolvedValue({ success: true, data: null, message: '暂无部署记录' });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('暂无部署记录')).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    (deployService.getStatus as Mock).mockRejectedValue(new Error('网络错误'));
    (deployService.getHistory as Mock).mockRejectedValue(new Error('网络错误'));
    (deployService.getHealth as Mock).mockRejectedValue(new Error('网络错误'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/错误|失败/)).toBeInTheDocument();
    });
  });

  it('auto-refreshes health data every 30 seconds', async () => {
    vi.useFakeTimers();
    renderComponent();

    await waitFor(() => {
      expect(deployService.getHealth).toHaveBeenCalledTimes(1);
    });

    // Advance 30 seconds
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(deployService.getHealth).toHaveBeenCalledTimes(2);
    });

    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/__tests__/components/admin/DeployMonitor.test.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/components/admin/DeployMonitor.test.tsx
git commit -m "test(deploy): add DeployMonitor component tests"
```

---

## Chunk 5: Final Integration & Verification

### Task 9: End-to-end verification

- [ ] **Step 1: Create sample deploy-status.json for local testing**

Create `backend/deploy-status.json` temporarily (don't commit — it's in .gitignore):

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

- [ ] **Step 2: Create sample deploy-history.json for local testing**

```json
[
  {
    "version": "0.1.0",
    "gitHash": "8ce119b",
    "commitMessage": "feat: add deploy monitoring",
    "commitAuthor": "wwj",
    "deployTime": "2026-03-14T15:30:00+08:00",
    "overallStatus": "success"
  },
  {
    "version": "0.1.0",
    "gitHash": "4234309",
    "commitMessage": "feat: sync user profile",
    "commitAuthor": "wwj",
    "deployTime": "2026-03-13T10:20:00+08:00",
    "overallStatus": "failed"
  }
]
```

- [ ] **Step 3: Start backend and frontend, verify manually**

1. Start backend: `cd backend && npm start`
2. Start frontend: `npm run dev`
3. Login as superadmin
4. Navigate to `/admin/deploy`
5. Verify: version card shows, health card shows (DB connected, PM2 may show error locally), history table shows 2 rows

- [ ] **Step 4: Run all tests**

```bash
npm test                    # Frontend tests
cd backend && npm test      # Backend tests
```

- [ ] **Step 5: Clean up temp files**

Delete `backend/deploy-status.json` and `backend/deploy-history.json` (local test data). These are in `.gitignore` so no commit needed.

If any test failures were found in Step 4, fix them and commit the fixes before marking this task complete.
