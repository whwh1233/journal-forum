# 公告系统设计规范

## 概述

为投哪儿平台新增公告系统，支持管理员向全站用户、指定角色或指定用户发布公告通知。包含三种展示形式：置顶横幅、铃铛下拉面板、紧急弹窗。支持完整生命周期管理（草稿→定时发布→活跃→过期→归档）。

## 数据模型

### announcements 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| title | STRING(200) | 公告标题，必填 |
| content | TEXT | Markdown 内容，必填 |
| type | ENUM('normal','urgent','banner') | 公告类型 |
| status | ENUM('draft','scheduled','active','expired','archived') | 生命周期状态 |
| priority | INTEGER, default 0 | 排序权重，越大越优先 |
| targetType | ENUM('all','role','user') | 受众模式 |
| targetRoles | JSON | 目标角色数组，targetType='role' 时使用 |
| targetUserIds | JSON | 目标用户 ID 数组，targetType='user' 时使用 |
| colorScheme | STRING(50) | 预设颜色：'info'/'success'/'warning'/'danger' |
| customColor | STRING(7) | 自定义 HEX 色值，覆盖 colorScheme |
| isPinned | BOOLEAN, default false | 是否在下拉面板中置顶 |
| startTime | DATE, nullable | 定时发布时间，null=立即 |
| endTime | DATE, nullable | 过期时间，null=永不过期 |
| creatorId | UUID | 创建者，外键→users |
| createdAt / updatedAt | DATE | 自动时间戳 |

### user_announcement_reads 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 自增主键 |
| userId | UUID | 用户 ID，联合唯一 |
| announcementId | UUID | 公告 ID，联合唯一 |
| dismissed | BOOLEAN, default false | 是否已关闭横幅/弹窗（区别于已读） |
| readAt | DATE | 标记已读时间 |

### 关系

- User 1:N → Announcement（creatorId，创建者关系）
- User N:M ↔ Announcement（through UserAnnouncementRead，已读追踪）

### 状态流转

```
draft → active         （立即发布）
draft → scheduled      （设置了 startTime 的定时发布）
scheduled → active     （到达 startTime，自动转换）
active → expired       （到达 endTime，自动转换）
active → archived      （管理员手动下线）
```

## API 设计

### 用户端 `/api/announcements/*`

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /api/announcements/banners | 无 | 获取活跃横幅公告（游客可见） |
| GET | /api/announcements | 需要 | 获取用户可见的公告列表（含未读状态、分页） |
| GET | /api/announcements/unread-count | 需要 | 获取未读公告数量（铃铛徽章数字） |
| GET | /api/announcements/:id | 需要 | 获取公告详情（自动标记已读） |
| POST | /api/announcements/:id/read | 需要 | 手动标记已读 |
| POST | /api/announcements/read-all | 需要 | 一键全部标记已读 |

### 管理端 `/api/admin/announcements/*`

所有端点需要 admin 或 superadmin 权限。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/announcements | 获取所有公告（含草稿/已过期，分页、筛选、排序） |
| GET | /api/admin/announcements/:id | 获取公告详情（含已读统计） |
| POST | /api/admin/announcements | 创建公告（草稿或立即发布） |
| PUT | /api/admin/announcements/:id | 编辑公告 |
| PUT | /api/admin/announcements/:id/publish | 发布/定时发布（draft → active/scheduled） |
| PUT | /api/admin/announcements/:id/archive | 手动下线/归档（active → archived） |
| DELETE | /api/admin/announcements/:id | 删除公告（仅草稿/已归档可删） |

## 前端架构

### AnnouncementContext

基于 React Context + 轮询模式（与现有 BadgeContext / AuthContext 一致）。

**初始加载**：应用启动时并行请求 banners、unread-count、announcements（已登录时）。

**定时轮询**：每 5 分钟轮询 banners 和 unread-count，仅页面可见时执行（visibilitychange API）。

**触发刷新**：用户标记已读、关闭横幅/弹窗、一键全部已读后立即重新请求。

### 组件结构

```
src/features/announcements/
├── components/
│   ├── AnnouncementBanner.tsx      # 置顶横幅（轮播）
│   ├── AnnouncementBanner.css
│   ├── AnnouncementBell.tsx        # 铃铛图标 + 下拉面板
│   ├── AnnouncementBell.css
│   ├── AnnouncementModal.tsx       # 紧急公告弹窗 / 详情弹窗
│   ├── AnnouncementModal.css
│   ├── AnnouncementItem.tsx        # 下拉面板中的单条公告
│   └── AnnouncementItem.css
├── services/
│   └── announcementService.ts      # API 调用封装
└── types/
    └── announcement.ts             # TypeScript 类型定义

src/contexts/
└── AnnouncementContext.tsx          # 全局状态管理

src/features/admin/components/
└── AnnouncementManagement.tsx      # 管理后台公告管理
```

### 后端文件结构

```
backend/
├── routes/
│   └── announcementRoutes.js       # 用户端 + 管理端路由
├── controllers/
│   └── announcementController.js   # 控制器
├── models/
│   ├── Announcement.js             # 已有，需扩展字段
│   └── UserAnnouncementRead.js     # 已有，需新增 dismissed 字段
└── models/index.js                 # 更新关联
```

## UI 设计

### 置顶横幅 (AnnouncementBanner)

- **位置**：TopBar 上方，全宽
- **样式**：浅色背景 + 底部 2px 强调色边框。使用项目 CSS 变量（`--color-info-light` / `--color-success-light` / `--color-warning-light` / `--color-error-light`）
- **轮播**：多个横幅自动轮播，5 秒切换，hover 暂停。底部圆点指示器可点击切换
- **关闭**：点击 ✕ 关闭当前条，记 sessionStorage，下次访问重新显示（直到过期）
- **点击**：点击横幅文字展开公告详情弹窗
- **游客可见**：未登录用户可看到全站横幅公告

### 预设颜色方案

| 方案 | 背景 | 强调色 | 适用场景 |
|------|------|--------|----------|
| info | `--color-info-light` (#dbeafe) | `--color-info` (#3b82f6) | 系统通知/更新 |
| success | `--color-success-light` (#d1fae5) | `--color-success` (#10b981) | 好消息/庆祝 |
| warning | `--color-warning-light` (#fef3c7) | `--color-warning` (#f59e0b) | 重要提醒 |
| danger | `--color-error-light` (#fee2e2) | `--color-error` (#ef4444) | 紧急/安全 |

管理员另可选择自定义 HEX 颜色，覆盖预设方案。

### 铃铛下拉面板 (AnnouncementBell)

- **位置**：TopBar 右侧，ThemePicker 左边
- **铃铛图标**：Lucide React `Bell` 图标，未读时显示红色数字徽章
- **面板**：360px 宽下拉面板，最大高度 350px 可滚动
- **面板头部**："公告通知" + 未读计数徽章 + "全部已读" 按钮
- **列表项**：未读项蓝色圆点 + 浅蓝背景高亮；已读项无圆点灰色文字
- **置顶项**：📌 标记，始终排在列表最前
- **类型标签**：紧急/系统/通知，颜色与颜色方案对应
- **点击单条**：展开详情弹窗，同时标记已读
- **点击外部**：自动关闭面板
- **仅登录可见**：未登录用户不显示铃铛

### 紧急公告弹窗 (AnnouncementModal)

- **触发**：类型为 `urgent` 的未读公告自动弹出
- **遮罩**：半透明背景覆盖全页
- **弹窗结构**：顶部 4px 颜色条纹 → 居中图标 → 类型标签 → 标题 → Markdown 内容 → 时间戳 → "我知道了" 按钮
- **关闭**：必须点击"我知道了"按钮，不可点击遮罩关闭
- **关闭后**：自动标记已读，同一公告不再弹出
- **多个紧急**：按队列逐个弹出
- **复用**：也作为从铃铛面板点击查看详情的弹窗（此时可点击遮罩关闭）

### 管理后台 (AnnouncementManagement)

**列表页**：
- 顶部：标题 + 公告统计 + "新建公告" 按钮
- 状态筛选标签栏：全部/草稿/定时/活跃/已过期/归档
- 表格列：标题（含创建者）、类型标签、状态标签、受众、已读率进度条、发布时间、操作按钮
- 操作根据状态不同：草稿→编辑/发布/删除，活跃→编辑/下线，已过期/归档→编辑/删除

**创建/编辑表单**：
- 标题输入框
- 类型选择按钮组（普通/紧急/横幅）
- 颜色方案：4 个预设色块 + 自定义色轮
- 受众选择按钮组（全站/按角色/指定用户），按角色时显示角色多选，指定用户时显示用户搜索
- Markdown 编辑器（复用现有帖子系统的编辑/预览/分屏模式）
- 发布时间/过期时间选择器
- 置顶/优先级选项复选框
- 操作按钮：保存草稿 / 发布公告

## 设计规范遵循

所有组件严格使用项目 CSS 变量，禁止硬编码：

- 字号：`--text-xs` ~ `--text-xl`
- 间距：`--space-1` ~ `--space-12`
- 颜色：`--color-text`、`--color-text-muted`、`--color-border`、`--color-info` 等
- 圆角：`--radius-sm` ~ `--radius-xl`
- 阴影：`--shadow-sm` ~ `--shadow-xl`
- 组件高度：`--size-xs` ~ `--size-xl`
- 图标：Lucide React，尺寸使用 `--icon-*` 变量
- 字体：`--font-sans`（正文）、`--font-mono`（代码/编辑器）
- 动画：`--duration-fast` / `--duration-normal` / `--duration-slow` + `--ease-out`

## 测试计划

### 后端集成测试

- 用户端 API：banners 获取、列表分页、未读计数、标记已读、全部已读
- 管理端 API：CRUD 操作、发布/归档、权限校验（非 admin 拒绝）
- 受众过滤：全站/角色/用户三种模式的正确性
- 生命周期：状态流转正确性（draft→active、scheduled→active、active→expired）

### 前端组件测试

- AnnouncementBanner：渲染、轮播切换、关闭、点击展开
- AnnouncementBell：徽章计数、面板展开/关闭、标记已读
- AnnouncementModal：紧急弹窗自动弹出、确认关闭
- AnnouncementManagement：列表筛选、创建表单提交、编辑

### E2E 测试

- 管理员创建→用户查看完整流程
- 横幅展示与关闭
- 紧急弹窗触发
- 已读状态追踪
