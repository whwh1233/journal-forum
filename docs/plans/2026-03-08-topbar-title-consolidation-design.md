# TopBar 标题整合设计

## 概述

将 PageHeader 组件的页面标题迁移到 TopBar，减少纵向空间占用，简化布局结构。

## 背景

当前布局存在以下问题：
1. TopBar (52px) 右侧只有主题选择器和用户头像，左侧空置
2. PageHeader (60px) 重复占用纵向空间，仅显示标题
3. 返回按钮在侧边栏导航模式下语义模糊
4. 页面刷新时认证竞态导致短暂显示"请先登录"

## 设计方案

### 1. 新增 PageContext

```tsx
// src/contexts/PageContext.tsx
interface PageContextType {
  title: string;
  setTitle: (title: string) => void;
}

// Hook: usePageTitle("个人中心")
```

**数据流：**
```
页面 mount → usePageTitle("xxx") → PageContext.setTitle() → TopBar 读取显示
```

### 2. TopBar 改造

**布局变更：**
```
原：┌────────────────────────────────────────────────────────┐
    │                                [主题] [用户/登录]      │
    └────────────────────────────────────────────────────────┘

新：┌────────────────────────────────────────────────────────┐
    │  页面标题                      [主题] [用户/登录]      │
    └────────────────────────────────────────────────────────┘
```

### 3. 移除内容

- 删除 `PageHeader.tsx` 和 `PageHeader.css`
- 移除所有页面的 `<PageHeader>` 调用（12 处）
- 移除所有返回按钮（showBack）
- 移除期刊管理的"添加期刊"按钮

### 4. 修复认证竞态

```tsx
// AuthContext.tsx initialState
loading: true  // 改为 true，直到首次 checkAuthStatus 完成
```

## 影响范围

| 类型 | 文件 |
|------|------|
| 新增 | `src/contexts/PageContext.tsx` |
| 修改 | `src/components/layout/TopBar.tsx` |
| 修改 | `src/components/layout/TopBar.css` |
| 修改 | `src/contexts/AuthContext.tsx` |
| 修改 | 12 个页面文件（见下方列表） |
| 删除 | `src/components/layout/PageHeader.tsx` |
| 删除 | `src/components/layout/PageHeader.css` |

**受影响页面：**
- `src/features/admin/components/BadgeManagement.tsx`
- `src/features/admin/components/Dashboard.tsx`
- `src/features/admin/components/CommentManagement.tsx`
- `src/features/admin/components/UserManagement.tsx`
- `src/features/admin/components/JournalManagement.tsx`
- `src/features/admin/components/DatabaseManager.tsx`
- `src/features/submissions/pages/SubmissionPage.tsx`
- `src/features/profile/pages/ProfilePage.tsx`
- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/features/badges/pages/BadgeGalleryPage.tsx`
- `src/features/profile/pages/ProfileEditPage.tsx`
- `src/features/follow/pages/FollowListPage.tsx`

## 收益

- 纵向空间节省 60px
- 布局更紧凑，TopBar 功能更完整
- 移除语义模糊的返回按钮
- 修复刷新认证竞态问题
