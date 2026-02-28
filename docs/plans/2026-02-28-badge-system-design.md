# 徽章系统设计文档

> 创建日期: 2026-02-28
> 状态: 已批准

## 概述

为学术期刊评价平台设计用户徽章系统，用于激励用户活跃、标识用户身份、展示用户成就。

## 需求摘要

| 项目 | 决策 |
|------|------|
| 核心目的 | 激励活跃 + 身份标识 + 成就展示 |
| 获取方式 | 混合模式（自动 + 手动） |
| 展示位置 | 个人主页 + 评论区 + 用户列表 |
| 列表显示数量 | 最多 3 个（用户可设置置顶） |
| 视觉形式 | 图标 + 文字 |
| 等级机制 | 各等级都保留累积展示 |
| 获取通知 | 页面内 Toast 提示 + 红点 |
| 管理功能 | 完整管理（CRUD + 授予撤销 + 统计批量） |
| 触发阈值 | 中等门槛（5/15/30/50） |
| 文案灵活性 | 存储在数据库，管理员可随时修改 |
| UI 设计 | 使用 ui-ux-pro-max skill 设计精美样式 |

## 数据模型

### badges 表（徽章定义）

```typescript
interface Badge {
  id: number;
  code: string;           // 唯一标识，如 "comment_5", "early_bird"
  name: string;           // 显示名称，如 "童生"
  description: string;    // 描述，如 "初涉学海，发表 5 条评论"
  icon: string;           // Lucide 图标名，如 "Feather"
  color: string;          // 徽章颜色，如 "#4CAF50"
  category: 'activity' | 'identity' | 'honor';  // 活跃度/身份/荣誉
  type: 'auto' | 'manual';                      // 自动/手动授予
  triggerCondition?: {    // 自动徽章的触发条件（仅 type=auto）
    metric: 'commentCount' | 'favoriteCount' | 'followingCount' | 'followerCount' | 'accountAge';
    threshold: number;
  };
  priority: number;       // 排序优先级（数字越大越靠前）
  isActive: boolean;      // 是否启用
  createdAt: string;
}
```

### user_badges 表（用户徽章关联）

```typescript
interface UserBadge {
  id: number;
  userId: number;
  badgeId: number;
  grantedBy?: number;     // 授予者 ID（手动徽章）
  grantedAt: string;      // 获得时间
  isNew: boolean;         // 是否未读（用于通知红点）
}
```

### users 表新增字段

```typescript
pinnedBadges: number[];   // 置顶徽章 ID，最多 3 个
```

## 初始徽章列表

### 活跃度徽章 - 评论（科举体系）

| 代码 | 名称 | 描述 | 图标 | 阈值 |
|------|------|------|------|------|
| `comment_5` | 童生 | 初涉学海，发表 5 条评论 | Feather | 5 |
| `comment_15` | 秀才 | 小有见地，发表 15 条评论 | PenLine | 15 |
| `comment_30` | 举人 | 声名渐起，发表 30 条评论 | Scroll | 30 |
| `comment_50` | 进士 | 金榜题名，发表 50 条评论 | GraduationCap | 50 |

### 活跃度徽章 - 收藏（藏书家体系）

| 代码 | 名称 | 描述 | 图标 | 阈值 |
|------|------|------|------|------|
| `favorite_5` | 书童 | 初入书阁，收藏 5 刊 | BookOpen | 5 |
| `favorite_15` | 藏书郎 | 涉猎渐广，收藏 15 刊 | BookMarked | 15 |
| `favorite_30` | 典籍使 | 博览群书，收藏 30 刊 | Library | 30 |
| `favorite_50` | 文渊阁士 | 学富五车，收藏 50 刊 | Crown | 50 |

### 活跃度徽章 - 粉丝（学术职称体系）

| 代码 | 名称 | 描述 | 图标 | 阈值 |
|------|------|------|------|------|
| `follower_5` | 助教 | 初登讲台，5 人关注 | User | 5 |
| `follower_15` | 讲师 | 桃李初开，15 人关注 | Users | 15 |
| `follower_30` | 副教授 | 声望渐隆，30 人关注 | UserCheck | 30 |
| `follower_50` | 教授 | 桃李满园，50 人关注 | Award | 50 |

### 身份徽章

| 代码 | 名称 | 描述 | 图标 | 条件 |
|------|------|------|------|------|
| `early_bird` | 拓荒学者 | 平台早期建设者 | Sunrise | 注册 < 2026-06-01 |
| `verified_admin` | 学监 | 平台管理员 | Shield | role = admin |

### 荣誉徽章（管理员手动授予）

| 代码 | 名称 | 描述 | 图标 |
|------|------|------|------|
| `outstanding_contributor` | 翰林待诏 | 对社区有突出贡献 | Medal |
| `quality_reviewer` | 太学博士 | 评论质量卓越 | Sparkles |
| `helpful_member` | 乐道先生 | 热心帮助他人 | Heart |

## API 设计

### 公开接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/badges` | 获取所有启用的徽章定义 |
| GET | `/api/users/:id/badges` | 获取指定用户的徽章列表 |

### 用户接口（需登录）

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/badges/my` | 获取当前用户的徽章（含未读标记） |
| PUT | `/api/badges/my/pinned` | 设置置顶徽章（body: `{ badgeIds: [1,2,3] }`） |
| POST | `/api/badges/my/read` | 标记徽章为已读（清除红点） |

### 管理员接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/admin/badges` | 获取所有徽章（含禁用的） |
| POST | `/api/admin/badges` | 创建新徽章 |
| PUT | `/api/admin/badges/:id` | 编辑徽章定义 |
| DELETE | `/api/admin/badges/:id` | 删除徽章 |
| POST | `/api/admin/badges/:id/grant` | 授予徽章给用户（body: `{ userId }`） |
| POST | `/api/admin/badges/:id/revoke` | 撤销用户徽章（body: `{ userId }`） |
| GET | `/api/admin/badges/stats` | 徽章统计（各徽章获得人数等） |
| POST | `/api/admin/badges/batch-grant` | 批量授予（body: `{ badgeId, userIds }`） |

### 自动徽章触发点

| 触发点 | 检查内容 |
|--------|----------|
| `POST /api/comments` | 检查评论数徽章 |
| `POST /api/favorites` | 检查收藏数徽章 |
| `POST /api/follows` | 检查粉丝数徽章（被关注者） |
| 用户登录时 | 检查身份徽章（早期用户、管理员） |

## 前端组件设计

### 新增组件

| 组件 | 位置 | 描述 |
|------|------|------|
| `Badge` | `src/features/badges/components/Badge.tsx` | 单个徽章展示 |
| `BadgeList` | `src/features/badges/components/BadgeList.tsx` | 徽章列表（支持限制数量） |
| `BadgeWall` | `src/features/badges/components/BadgeWall.tsx` | 个人主页徽章墙 |
| `BadgePicker` | `src/features/badges/components/BadgePicker.tsx` | 置顶徽章选择器 |
| `NewBadgeToast` | `src/features/badges/components/NewBadgeToast.tsx` | 新徽章提示 |

### 管理后台组件

| 组件 | 位置 | 描述 |
|------|------|------|
| `BadgeManagement` | `src/features/admin/pages/BadgeManagement.tsx` | 徽章类型管理页 |
| `BadgeForm` | `src/features/admin/components/BadgeForm.tsx` | 徽章新增/编辑表单 |
| `UserBadgePanel` | `src/features/admin/components/UserBadgePanel.tsx` | 用户徽章授予/撤销面板 |
| `BadgeStats` | `src/features/admin/components/BadgeStats.tsx` | 徽章统计图表 |

### 现有组件改动

| 组件 | 改动 |
|------|------|
| `ProfilePage` | 添加 `BadgeWall` 展示徽章墙 |
| `ProfileEditPage` | 添加 `BadgePicker` 设置置顶徽章 |
| `CommentItem` | 用户名旁显示 `BadgeList`（最多 3 个） |
| `UserDropdown` | 显示新徽章红点提示 |
| `FollowList` | 用户名旁显示 `BadgeList` |
| `AdminUserList` | 添加徽章管理入口 |
| `SideNav` | 管理员菜单新增"徽章管理" |

### 状态管理

- `src/features/badges/hooks/useBadges.ts` - 徽章相关 hooks
- `src/contexts/BadgeContext.tsx` - 全局新徽章通知状态

## 后端实现设计

### 新增文件

| 文件 | 描述 |
|------|------|
| `backend/routes/badges.js` | 徽章路由 |
| `backend/controllers/badgeControllerLowdb.js` | 徽章控制器 |
| `backend/services/badgeService.js` | 徽章业务逻辑 |

### 自动徽章检查服务

```javascript
// backend/services/badgeService.js
class BadgeService {
  // 检查并授予活跃度徽章
  async checkAndGrantBadges(userId, metric) {
    // 1. 获取用户当前统计数据
    // 2. 查询该 metric 类型的自动徽章
    // 3. 对比阈值，授予符合条件且未拥有的徽章
    // 4. 返回新获得的徽章列表
  }

  // 检查身份徽章（登录时调用）
  async checkIdentityBadges(userId) {
    // 检查早期用户、管理员等身份徽章
  }
}
```

### 现有控制器改动

| 控制器 | 改动 |
|------|------|
| `commentControllerLowdb.js` | 创建评论后调用 badgeService |
| `favoriteControllerLowdb.js` | 收藏后调用 badgeService |
| `followControllerLowdb.js` | 被关注后调用 badgeService |
| `authControllerLowdb.js` | 登录后调用 badgeService |
| `userControllerLowdb.js` | getUserProfile 返回用户徽章 |

### API 响应格式

新徽章通过现有接口返回：

```javascript
{
  "success": true,
  "data": { /* 原有数据 */ },
  "newBadges": [  // 可选字段
    { "id": 1, "name": "童生", "icon": "Feather", ... }
  ]
}
```

## 通知机制

### 流程

```
用户操作 → 后端检查授予 → API 返回 newBadges → 前端 Toast + 红点
```

### Toast 提示

- 右上角弹出，3 秒后自动消失
- 显示徽章图标、名称、描述
- 点击可跳转个人主页

### 红点提示

- UserDropdown 头像旁显示红点
- 进入个人主页后调用 `/api/badges/my/read` 清除

## 错误处理

| 场景 | 处理方式 |
|------|----------|
| 徽章授予失败 | 静默失败，记录日志，不影响主操作 |
| 置顶徽章超过 3 个 | 返回 400 |
| 授予不存在的徽章 | 返回 404 |
| 重复授予同一徽章 | 幂等处理，返回成功 |
| 撤销未拥有的徽章 | 返回 404 |
| 删除已授予的徽章 | 软删除（isActive=false） |

## 边界情况

| 场景 | 处理方式 |
|------|----------|
| 用户删除评论后低于阈值 | 不撤销已获得的徽章（成就不可逆） |
| 用户取消收藏后低于阈值 | 同上 |
| 被取关后粉丝数低于阈值 | 同上 |
| 管理员降级为普通用户 | 保留"学监"徽章 |

## 测试策略

### 后端集成测试

`backend/__tests__/integration/badges.test.js`

- 徽章 CRUD 接口
- 授予/撤销接口
- 自动徽章触发

### 前端组件测试

`src/__tests__/components/badges/`

- Badge、BadgeList、BadgeWall、BadgePicker、NewBadgeToast

### E2E 测试

`e2e/tests/badges.spec.ts`

- 游客查看徽章墙
- 用户获得徽章流程
- 管理员徽章管理

## 实现注意事项

1. **UI 设计**: 使用 `ui-ux-pro-max` skill 设计精美的徽章样式
2. **图标**: 统一使用 Lucide React 图标库
3. **性能**: 徽章定义可缓存，减少重复查询
4. **文案灵活性**: 所有文案存储在数据库，管理员可随时修改
