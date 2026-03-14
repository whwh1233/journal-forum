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

# --- 辅助函数：写入历史记录 ---
write_history() {
  STATUS_FILE_PATH="$STATUS_FILE" HISTORY_FILE_PATH="$HISTORY_FILE" \
  node -e "
  const fs = require('fs');
  const status = JSON.parse(fs.readFileSync(process.env.STATUS_FILE_PATH, 'utf8'));
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
    write_history
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
