# CLAUDE.md 更新实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 更新 CLAUDE.md 以支持跨会话上下文连接，让新对话快速了解项目全貌、定位修改点、理解改动历史

**Architecture:** 采用极简结构，在现有文档基础上新增"功能模块导航"章节（9 个模块 + 文件路径）、微调"当前状态与待办事项"、在末尾新增"最近重要改动"区域。保持维护成本低，每次会话只需更新 2 个区域。

**Tech Stack:** Markdown 文档

---

## Task 1: 新增功能模块导航章节

**Files:**
- Modify: `CLAUDE.md` (在第 28 行"启动项目"之前插入新章节)

**Step 1: 读取 CLAUDE.md 确认插入位置**

```bash
head -30 CLAUDE.md
```

预期输出：应看到第 28 行附近有 "## 启动项目" 标题

**Step 2: 在"技术栈"章节后插入功能模块导航**

在 `## 启动项目` 之前插入以下内容：

```markdown
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

```

使用 Edit 工具在 `## 启动项目` 之前插入上述内容。

**Step 3: 验证插入结果**

```bash
grep -A 3 "## 功能模块导航" CLAUDE.md
```

预期输出：应显示新插入的章节标题和前几行内容

**Step 4: 提交第一部分改动**

```bash
git add CLAUDE.md
git commit -m "docs(claude.md): 新增功能模块导航章节

添加 9 个功能模块的详细导航：
- 认证、期刊、评论、收藏、关注系统
- 主题、个人中心、管理后台
- 测试系统（进行中）

每个模块包含状态、功能、关键文件路径"
```

---

## Task 2: 微调"当前状态与待办事项"区域

**Files:**
- Modify: `CLAUDE.md` (约第 197-223 行的"当前状态与待办事项"章节)

**Step 1: 定位当前状态章节**

```bash
grep -n "## 当前状态与待办事项" CLAUDE.md
```

预期输出：显示行号（约 197 行）

**Step 2: 替换"✅ 当前状态"部分**

使用 Edit 工具，将原有的详细条目列表替换为分类总结：

旧内容（从 `### ✅ 当前状态` 到 `### 🔴 优先待办` 之间的内容）替换为：

```markdown
### ✅ 当前状态

- **代码质量**: 图标系统已统一使用 Lucide React，UI 组件已优化（SearchAndFilter）
- **测试覆盖**: E2E 完整、后端集成测试完整、前端组件测试部分完成（5/15+）
- **UI 架构**: AppLayout + TopBar + SideNav + PageHeader 统一布局
- **主题系统**: 6 个预设主题可用
- **认证体验**: AuthModalContext 全局管理
```

**Step 3: 更新"🔴 优先待办"部分**

将原有的待办事项替换为：

```markdown
### 🔴 优先待办

1. **前端组件测试** - 剩余 10+ 组件待补充测试（TopBar, SideNav, PageHeader, AppLayout, SearchAndFilter, JournalDetailPanel, CommentList, CommentForm, RegisterForm 等）
2. **单元测试缺失** - `backend/__tests__/unit/` 和 `src/__tests__/integration/` 目录为空
3. **生产环境准备** - LowDB 需迁移至 PostgreSQL/MongoDB（生产部署前必做）
```

**Step 4: 更新"功能积压"部分**

将原有的 TODO 列表替换为：

```markdown
### 📋 功能积压

* 积分+徽章系统、活跃度记录和统计
* 教育邮箱登录验证
* 申请制
```

**Step 5: 验证修改结果**

```bash
sed -n '/## 当前状态与待办事项/,/^## /p' CLAUDE.md | head -30
```

预期输出：应显示新的分类总结格式

**Step 6: 提交第二部分改动**

```bash
git add CLAUDE.md
git commit -m "docs(claude.md): 微调当前状态与待办事项区域

优化内容：
- 当前状态改为分类总结（避免与功能模块导航重复）
- 优先待办添加编号，明确剩余组件测试列表
- 功能积压区分开，新增积分+徽章系统需求"
```

---

## Task 3: 新增"最近重要改动"区域

**Files:**
- Modify: `CLAUDE.md` (在文档末尾，"功能积压"之后添加)

**Step 1: 定位插入位置**

```bash
tail -10 CLAUDE.md
```

预期输出：应看到文档末尾的 TODO 列表

**Step 2: 在文档末尾追加新区域**

在文档最后添加以下内容：

```markdown

---

## 最近重要改动
> 记录最近 2-3 次会话的关键改动，便于新对话快速了解项目演进

### 2026-02-26 (commit: 670ae26)
图标系统重构 + UI 优化 + 组件测试覆盖（SVG→Lucide, SearchAndFilter 改进, ThemePicker/UserDropdown/Modal/BackButton/Breadcrumb 测试）

### 2026-02-26 (commit: 679e6b1)
CLAUDE.md 结构优化（新增功能模块导航、最近重要改动区域，微调当前状态描述）

---
**维护说明**: 每次会话结束时更新此区域，保留最近 3 次会话记录。
```

使用 Edit 工具在文档末尾追加上述内容。

**Step 3: 验证追加结果**

```bash
tail -20 CLAUDE.md
```

预期输出：应显示新追加的"最近重要改动"区域

**Step 4: 提交第三部分改动**

```bash
git add CLAUDE.md
git commit -m "docs(claude.md): 新增最近重要改动区域

在文档末尾添加改动历史追踪：
- 记录最近 2-3 次会话的关键改动
- 包含日期 + commit hash 以便深入查看
- 一行式总结保持简洁
- 添加维护说明提醒更新规则"
```

---

## Task 4: 验证完整文档结构

**Files:**
- Read: `CLAUDE.md`

**Step 1: 验证文档章节顺序**

```bash
grep "^## " CLAUDE.md
```

预期输出：应按以下顺序显示所有一级标题：
```
## 项目概述
## 技术栈
## 功能模块导航
## 启动项目
## 项目结构
## API 路由
## 运行测试
## 设置管理员账号
## 环境变量配置
## 重要注意事项
## 已实现功能
## 主题系统
## 当前状态与待办事项
## 最近重要改动
```

**Step 2: 验证功能模块导航内容**

```bash
sed -n '/## 功能模块导航/,/## 启动项目/p' CLAUDE.md | wc -l
```

预期输出：应有约 70-80 行（包含 9 个模块的详细信息）

**Step 3: 验证当前状态格式**

```bash
sed -n '/### ✅ 当前状态/,/### 🔴 优先待办/p' CLAUDE.md
```

预期输出：应显示 5 条分类总结（代码质量、测试覆盖、UI 架构、主题系统、认证体验）

**Step 4: 验证最近改动区域**

```bash
sed -n '/## 最近重要改动/,$p' CLAUDE.md
```

预期输出：应显示 2 条改动记录（2026-02-26 的两次提交）和维护说明

**Step 5: 生成文档统计信息**

```bash
echo "CLAUDE.md 统计信息：" && wc -l CLAUDE.md && grep "^###" CLAUDE.md | wc -l && echo "个三级标题"
```

预期输出：约 250+ 行，15+ 个三级标题

---

## Task 5: 推送所有改动到远程仓库

**Files:**
- None (git operations only)

**Step 1: 查看提交历史**

```bash
git log --oneline -5
```

预期输出：应显示最近 5 次提交，包括本次实施计划的 3 次提交

**Step 2: 确认工作区干净**

```bash
git status
```

预期输出：
```
On branch main
Your branch is ahead of 'origin/main' by 3 commits.
  (use "git push" to publish your local commits)

nothing to commit, working tree clean
```

**Step 3: 推送到远程仓库**

```bash
git push
```

预期输出：成功推送 3 个新提交到远程仓库

**Step 4: 验证远程同步状态**

```bash
git status
```

预期输出：
```
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

---

## 实施完成检查清单

验证以下所有项都已完成：

- [ ] 功能模块导航章节已添加（9 个模块 + 文件路径）
- [ ] 当前状态已浓缩为 5 条分类总结
- [ ] 优先待办已编号并明确剩余测试组件
- [ ] 功能积压已更新（包含积分+徽章系统）
- [ ] 最近重要改动区域已添加（包含 2 条记录 + 维护说明）
- [ ] 文档章节顺序正确
- [ ] 所有改动已提交（3 个 commit）
- [ ] 所有改动已推送到远程仓库

## 成功标准

新会话读取更新后的 CLAUDE.md 能够：
1. ✅ 在 30 秒内了解项目有 9 个功能模块
2. ✅ 快速找到任意模块的关键文件路径
3. ✅ 理解当前状态（测试覆盖 5/15+）和优先待办（组件测试）
4. ✅ 了解最近 2 次会话的改动（图标重构 + CLAUDE.md 优化）
5. ✅ 通过 commit hash（670ae26, 679e6b1）深入查看详细改动
