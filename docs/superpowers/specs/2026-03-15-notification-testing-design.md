# Notification & Announcement Testing System Design

> Date: 2026-03-15
> Status: Approved

## Overview

为通知系统（Notification + Announcement）构建完整的自动化测试体系，覆盖后端集成测试、前端单元/组件测试、E2E 测试三个层级，预估新增 150-185 个测试用例。

## Scope

- **Notification（用户通知）**：11 种类型，用户触发的事件通知
- **Announcement（公告）**：3 种类型（normal/urgent/banner），管理员广播消息，含定向推送和定时发布

## Architecture Decisions

| 决策 | 选择 | 理由 |
|------|------|------|
| 后端测试风格 | 集成测试（API + 真实数据库） | 与现有 announcement.test.js 一致，覆盖完整链路 |
| 测试组织 | 按子系统分文件 + 共享工厂函数 | 方案 A：文件清晰，工厂复用，生命周期独立 |
| 测试数据策略 | 工厂函数 + 每文件自建自清 | 便利性与隔离性兼顾 |
| E2E 覆盖度 | 全面覆盖，分功能模块 | 用户通知、用户公告、横幅弹窗、管理员管理四个 spec |

## File Structure

```
backend/__tests__/
├── helpers/
│   └── testFactories.js              # 新增：后端测试工厂函数
├── integration/
│   ├── announcement.test.js           # 扩充：+15-20 用例
│   └── notification.test.js           # 新增：45-55 用例

src/__tests__/
├── helpers/
│   └── testFactories.ts              # 新增：前端 mock 数据工厂
├── services/
│   ├── announcementService.test.ts    # 已有，扩充
│   └── notificationService.test.ts    # 新增：10-12 用例
├── contexts/
│   ├── AnnouncementContext.test.tsx    # 新增：15-20 用例
│   └── NotificationContext.test.tsx    # 新增：15-20 用例
├── components/
│   ├── announcements/                 # 已有，扩充：+8-10 用例
│   └── notifications/                 # 新增：10-15 用例
│       ├── NotificationItem.test.tsx
│       └── NotificationModal.test.tsx

e2e/
├── fixtures/
│   └── notification.fixture.ts        # 新增：Playwright fixture + API helper
├── notification-user.spec.ts          # 新增：10-12 用例
├── announcement-user.spec.ts          # 新增：8-10 用例
├── announcement-banner.spec.ts        # 新增：6-8 用例
└── announcement-admin.spec.ts         # 新增：10-12 用例
```

## Part 1: Backend Test Factories

扩展现有 `backend/__tests__/helpers/testHelpers.js`，新增数据库级工厂函数。现有文件已提供 `createTestUser`（生成注册数据对象）、`generateTestToken`、`generateAdminToken` 等工具函数，新增的工厂函数直接写入数据库并返回 Sequelize 实例，与现有函数互补。

### New Factory Functions (added to testHelpers.js)

- `createTestUserInDB({ role, name, email })` — 直接创建数据库用户记录，name/email 用 uuid 后缀避免冲突，密码用预哈希固定值避免 bcrypt 开销，返回 Sequelize 实例
- `createTestNotification({ recipientId, senderId, type, entityType, ... })` — 创建通知记录，所有字段有合理默认值（type 默认 `comment_reply`）
- `createTestAnnouncement({ creatorId, type, status, targetType, ... })` — 创建公告记录，status 默认 `active`
- `cleanupTestData(userIds)` — 按用户 ID 级联清理通知、公告已读记录等

### Design Constraints

- 新增函数返回 Sequelize 模型实例，与现有 `createTestUser`（返回普通对象）区分命名
- 不搞全局 seed，每个测试文件用工厂自建自清
- 不抽象 HTTP 请求，各测试文件直接用 `supertest(app)`

## Part 2: Backend Notification Integration Tests

`backend/__tests__/integration/notification.test.js` — 预估 45-55 个用例

### Data Setup

- beforeAll：创建 3 个测试用户（userA 接收者、userB 发送者、userC 无关用户验证隔离性）
- afterAll：cleanupTestData 清理

### Test Groups

```
describe('Notification API')
├── describe('GET /api/notifications')
│   ├── 返回当前用户的通知列表（分页）
│   ├── 支持 type 参数过滤
│   ├── 不返回其他用户的通知
│   ├── 按创建时间倒序排列
│   ├── 未认证返回 401
│   ├── 包含 sender 信息（id、name、avatar）
│   ├── 分页边界：page 超出范围返回空数组
│   ├── 无效 type 过滤参数返回空数组
│   └── senderId 为 null 的系统通知正确返回（sender 字段为 null）
│
├── describe('GET /api/notifications/unread-count')
│   ├── 返回正确的未读数量
│   ├── 标记已读后数量减少
│   └── 只统计当前用户的未读
│
├── describe('GET /api/notifications/:id')
│   ├── 返回通知详情
│   ├── 自动标记为已读 + 设置 readAt
│   ├── 访问他人通知返回 404
│   └── 不存在的 ID 返回 404
│
├── describe('POST /api/notifications/:id/read')
│   ├── 标记单条为已读
│   ├── 重复标记幂等（不报错）
│   └── 标记他人通知返回 404
│
├── describe('POST /api/notifications/read-all')
│   ├── 批量标记所有未读为已读
│   ├── 不影响其他用户的通知
│   └── 无未读时返回成功
│
└── describe('NotificationService — 直接 import service 模块测试')
    ├── create() 正常创建通知
    ├── create() 自发自收时静默跳过
    ├── create() 异常时静默失败不抛错
    ├── create() content JSON 字段正确存储和读取
    ├── createBulk() 批量创建给多个接收者
    └── createBulk() 自动排除发送者
```

### Key Assertions

- 用户隔离（userA 看不到 userC 的通知）
- 11 种通知类型至少各测一条创建
- 认证中间件拦截未认证请求

## Part 3: Backend Announcement Test Expansion

在现有 `announcement.test.js`（64 个用例）基础上追加 15-20 个用例，不修改现有测试。

### New Test Groups

```
├── describe('定时发布 & 状态同步 — 基于 syncStaleStatuses() check-on-read 模式')
│   ├── scheduled 公告到达 startTime 后查询时自动变为 active
│   ├── active 公告到达 endTime 后查询时自动变为 expired
│   ├── 同时有多条需要同步时批量处理正确
│   └── draft 状态不受时间同步影响
│
├── describe('边界条件')
│   ├── startTime 和 endTime 都为 null 时永久有效
│   ├── priority 排序正确（高优先级在前）
│   ├── isPinned 的公告排在最前
│   ├── 分页边界：page 超出范围返回空数组
│   └── 并发标记已读不产生重复记录（findOrCreate）
│
├── describe('管理员统计')
│   ├── readCount / readPercentage 计算正确
│   ├── 定向推送的百分比基数正确（只算目标用户）
│   └── 多个管理员各自创建的公告互不干扰
│
└── describe('删除限制')
    ├── 不能删除 active 状态的公告
    ├── 不能删除 scheduled 状态的公告
    └── 删除后关联的 UserAnnouncementRead 记录也被清理
```

## Part 4: Frontend Tests

### 4a. Frontend Test Factories

`src/__tests__/helpers/testFactories.ts` — 生成 mock 数据对象（不碰数据库）：

- `createMockNotification(overrides?)` → Notification 对象
- `createMockAnnouncement(overrides?)` → Announcement 对象
- `createMockUser(overrides?)` → User 对象

### 4b. Notification Service Tests

`src/__tests__/services/notificationService.test.ts` — mock axios，10-12 个用例：

- 5 个 API 方法各测正常调用 + 参数传递
- 错误处理（网络异常、401）
- type 过滤参数正确拼接

### 4c. Context Tests

**`src/__tests__/contexts/NotificationContext.test.tsx`**（15-20 个用例）：

- 初始化时获取通知列表 + 未读数
- markAsRead 乐观更新 + API 失败时回滚
- markAllAsRead 批量更新
- 轮询：60 秒刷新未读数
- 页面不可见时暂停轮询
- 未登录时不发请求

**`src/__tests__/contexts/AnnouncementContext.test.tsx`**（15-20 个用例）：

- 初始化时获取 banners + 公告列表 + 未读数
- banners 不需要认证也能获取
- markAsRead / dismissUrgent 乐观更新
- markAllAsRead 批量更新
- 轮询：5 分钟刷新
- 未登录时只获取 banners

### 4d. Component Tests

**新增 notifications/ 组件测试：**

- `NotificationItem.test.tsx` — 不同 type 的渲染、点击回调、已读/未读样式差异
- `NotificationModal.test.tsx` — 详情展示、实体链接、Escape 关闭

**扩充已有 announcements/ 测试：**

- `AnnouncementBell.test.tsx` — 补充合并未读数显示、tab 切换后 mark-all-read 作用于正确子系统
- `AnnouncementHandler.test.tsx` — 补充多条紧急公告排队处理、dismiss 后显示下一条

## Part 5: E2E Tests (Playwright)

### Infrastructure

`e2e/fixtures/notification.fixture.ts`：
- 扩展 Playwright `test` fixture，提供已登录的 `userPage`、`adminPage`
- 提供 API helper 直接调后端创建测试数据
- afterAll 通过 API 清理测试数据

### 5a. `e2e/notification-user.spec.ts` — 用户通知流程（10-12 个用例）

- 用户 B 评论用户 A 的期刊 → A 收到通知
- 通知铃铛显示未读数
- 打开通知面板查看列表
- 点击通知查看详情 modal
- 查看后自动标记已读，未读数减少
- 手动标记单条已读
- 批量标记全部已读
- 不同类型通知（评论回复、关注、点赞）正确展示
- 分页加载更多通知
- 未登录时看不到通知入口

### 5b. `e2e/announcement-user.spec.ts` — 用户公告流程（8-10 个用例）

- 公告 tab 显示公告列表
- 点击查看公告详情
- 标记单条已读 / 全部已读
- 未读公告数正确
- 定向推送：role=admin 的公告普通用户看不到
- 定向推送：指定用户 ID 的公告只有目标用户可见
- 未登录用户看不到公告 tab

### 5c. `e2e/announcement-banner.spec.ts` — 横幅 + 紧急弹窗（6-8 个用例）

- 页面顶部显示 active banner
- banner 未登录也可见
- 点击 banner 打开详情 modal
- 紧急公告自动弹窗
- dismiss 紧急公告后不再弹出
- 多条紧急公告排队逐个展示
- banner 按 priority 排序

### 5d. `e2e/announcement-admin.spec.ts` — 管理员公告管理（10-12 个用例）

- 创建草稿公告
- 创建并直接发布公告
- 编辑公告内容
- 发布草稿 → active
- 归档 active → archived
- 删除草稿/过期/归档公告
- 不能删除 active 公告
- 设置定时发布（startTime）
- 设置定向推送（role / userId）
- 查看已读统计（readCount / readPercentage）
- 公告列表筛选（按状态、类型）
- 分页正常工作

## Test Count Summary

| Layer | File | Est. Cases |
|-------|------|-----------|
| Backend factories | `testFactories.js` | — |
| Backend Notification | `notification.test.js` | 45-55 |
| Backend Announcement expansion | `announcement.test.js` | +15-20 |
| Frontend factories | `testFactories.ts` | — |
| Frontend Notification Service | `notificationService.test.ts` | 10-12 |
| Frontend NotificationContext | `NotificationContext.test.tsx` | 15-20 |
| Frontend AnnouncementContext | `AnnouncementContext.test.tsx` | 15-20 |
| Frontend Notification components | `notifications/*.test.tsx` | 10-15 |
| Frontend Announcement components expansion | `announcements/*.test.tsx` | +8-10 |
| E2E User notifications | `notification-user.spec.ts` | 10-12 |
| E2E User announcements | `announcement-user.spec.ts` | 8-10 |
| E2E Banner + urgent | `announcement-banner.spec.ts` | 6-8 |
| E2E Admin announcements | `announcement-admin.spec.ts` | 10-12 |
| **Total** | | **~150-185** |
