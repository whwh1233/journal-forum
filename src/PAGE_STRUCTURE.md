# 页面结构规范

## 概述

本项目使用统一的页面布局结构，确保所有页面具有一致的用户体验。

## 布局类型

### 1. MainLayout（主布局）

用于所有非管理后台页面，提供统一的 Header + Content + Footer 结构。

```
┌─────────────────────────────────┐
│           Header                │ ← 固定在顶部，包含导航和用户信息
├─────────────────────────────────┤
│                                 │
│        Main Content             │ ← 主内容区域，flex: 1
│      (页面具体内容)              │
│                                 │
├─────────────────────────────────┤
│           Footer                │ ← 固定在底部
└─────────────────────────────────┘
```

**适用页面：**
- 首页 (`/`)
- 用户资料页 (`/profile/:userId`)
- 个人中心 (`/dashboard`)
- 关注列表 (`/profile/:userId/follows`)
- 编辑资料 (`/profile/edit`)

### 2. AdminLayout（管理后台布局）

专用于管理后台，提供侧边栏导航。

```
┌─────────────────────────────────┐
│  Sidebar  │    Main Content     │
│           │                     │
│  - 仪表盘  │     (Outlet)        │
│  - 用户管理│                     │
│  - 期刊管理│                     │
│  - 评论管理│                     │
│           │                     │
│  ─────────│                     │
│  返回首页  │                     │
│  退出登录  │                     │
└─────────────────────────────────┘
```

**适用页面：**
- 管理仪表盘 (`/admin`)
- 用户管理 (`/admin/users`)
- 期刊管理 (`/admin/journals`)
- 评论管理 (`/admin/comments`)

## 页面组件规范

### 使用 container 类

所有页面内容应使用 `container` 类来保持居中和统一的左右边距：

```tsx
// 正确示例
const MyPage: React.FC = () => {
  return (
    <div className="my-page container">
      {/* 页面内容 */}
    </div>
  );
};
```

### 页面最大宽度

根据页面内容类型设置不同的最大宽度：

| 页面类型 | 最大宽度 | 说明 |
|---------|---------|-----|
| 列表页面 | 1280px (使用 container) | 首页期刊列表 |
| 详情/表单页面 | 700-900px | 个人资料、编辑页面 |
| 全宽内容 | 100% | 管理后台主内容区 |

```css
/* 示例：限制页面最大宽度 */
.profile-page {
  max-width: 900px;
}
```

## 弹窗规范

根据内容重要程度和显示内容选择弹窗尺寸：

| 尺寸 | 最大宽度 | 适用场景 |
|-----|---------|---------|
| `sm` | 400px | 登录/注册表单、确认对话框 |
| `md` | 560px | 简单表单、信息展示（默认） |
| `lg` | 800px | 复杂内容、中等表单 |
| `full` | 1200px | 期刊详情（含评论）、需要大量空间的内容 |

```tsx
// 小尺寸弹窗 - 登录表单
<Modal size="sm" title="用户登录">
  <LoginForm />
</Modal>

// 全尺寸弹窗 - 期刊详情（内容丰富，需要最大空间）
<Modal size="full" title={journal.title}>
  <JournalDetail />
  <CommentList />
</Modal>
```

## 路由保护

### ProtectedRoute

需要登录才能访问的页面：

```tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  }
/>
```

### AdminRoute

需要管理员权限的页面：

```tsx
<Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminLayout />
    </AdminRoute>
  }
/>
```

## 加载和错误状态

统一使用 container 包裹：

```tsx
if (loading) {
  return (
    <div className="container">
      <div className="loading-state">加载中...</div>
    </div>
  );
}

if (error) {
  return (
    <div className="container">
      <div className="error-state">{error}</div>
    </div>
  );
}
```

## 响应式设计

所有页面应支持以下断点：

- Desktop: > 1024px
- Tablet: 768px - 1024px
- Mobile: < 768px
- Small Mobile: < 480px

`container` 类会自动调整内边距以适应不同屏幕尺寸。
