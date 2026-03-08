# TopBar 标题整合实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 PageHeader 标题迁移到 TopBar，移除 PageHeader 组件，修复认证竞态问题。

**Architecture:** 新增 PageContext 管理页面标题状态，各页面通过 usePageTitle hook 设置标题，TopBar 从 context 读取并显示。

**Tech Stack:** React Context, TypeScript, CSS

---

### Task 1: 创建 PageContext

**Files:**
- Create: `src/contexts/PageContext.tsx`

**Step 1: 创建 PageContext 文件**

```tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

interface PageContextType {
  title: string;
  setTitle: (title: string) => void;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export function PageProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitleState] = useState('');

  const setTitle = useCallback((newTitle: string) => {
    setTitleState(newTitle);
  }, []);

  return (
    <PageContext.Provider value={{ title, setTitle }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePageContext() {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('usePageContext must be used within a PageProvider');
  }
  return context;
}

export function usePageTitle(title: string) {
  const { setTitle } = usePageContext();

  React.useEffect(() => {
    setTitle(title);
    return () => setTitle('');
  }, [title, setTitle]);
}
```

**Step 2: 验证文件创建成功**

Run: `ls src/contexts/PageContext.tsx`
Expected: 文件存在

**Step 3: Commit**

```bash
git add src/contexts/PageContext.tsx
git commit -m "feat: add PageContext for page title management"
```

---

### Task 2: 集成 PageProvider 到 App

**Files:**
- Modify: `src/App.tsx`

**Step 1: 导入 PageProvider**

在 App.tsx 顶部添加导入：
```tsx
import { PageProvider } from '@/contexts/PageContext';
```

**Step 2: 包裹 AppContent**

将 PageProvider 添加到 provider 链中，包裹在 AuthModalProvider 内层：

```tsx
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BadgeProvider>
          <JournalProvider>
            <ToastProvider>
              <PostProvider>
                <AuthModalProvider>
                  <PageProvider>
                    <div className="app">
                      <AppContent />
                    </div>
                  </PageProvider>
                </AuthModalProvider>
              </PostProvider>
            </ToastProvider>
          </JournalProvider>
        </BadgeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

**Step 3: 验证应用启动正常**

Run: `npm run dev`
Expected: 应用正常启动，无报错

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate PageProvider into App"
```

---

### Task 3: 修改 TopBar 显示标题

**Files:**
- Modify: `src/components/layout/TopBar.tsx`
- Modify: `src/components/layout/TopBar.css`

**Step 1: 修改 TopBar.tsx**

```tsx
import React from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { usePageContext } from '@/contexts/PageContext';
import ThemePicker from '@/components/common/ThemePicker';
import UserDropdown from '@/components/common/UserDropdown';
import './TopBar.css';

const TopBar: React.FC = () => {
  const { state: authState } = useAuthContext();
  const { openAuthModal } = useAuthModal();
  const { title } = usePageContext();

  const user = authState.user;
  const isAuthenticated = authState.isAuthenticated;
  const userInitial = user ? (user.name || user.email)[0].toUpperCase() : '';
  const userName = user?.name || user?.email || '';

  return (
    <div className="top-bar">
      <h1 className="top-bar-title">{title}</h1>
      <div className="top-bar-right">
        <ThemePicker />

        {isAuthenticated ? (
          <UserDropdown userName={userName} userInitial={userInitial} />
        ) : (
          <button className="top-bar-login-btn" onClick={openAuthModal}>
            登录 / 注册
          </button>
        )}
      </div>
    </div>
  );
};

export default TopBar;
```

**Step 2: 修改 TopBar.css**

在 `.top-bar` 规则中将 `justify-content: flex-end` 改为 `justify-content: space-between`：

```css
.top-bar {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  height: 52px;
  background: var(--topbar-bg);
  border-bottom: 1px solid var(--topbar-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}
```

在文件末尾（`@media` 之前）添加标题样式：

```css
.top-bar-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-900, #111827);
  margin: 0;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 50%;
}
```

**Step 3: 验证 TopBar 显示正常（标题暂时为空）**

Run: `npm run dev`
Expected: 应用正常，TopBar 左侧空白（尚无页面设置标题）

**Step 4: Commit**

```bash
git add src/components/layout/TopBar.tsx src/components/layout/TopBar.css
git commit -m "feat: display page title in TopBar"
```

---

### Task 4: 迁移 Admin 页面（6 个文件）

**Files:**
- Modify: `src/features/admin/components/BadgeManagement.tsx`
- Modify: `src/features/admin/components/Dashboard.tsx`
- Modify: `src/features/admin/components/CommentManagement.tsx`
- Modify: `src/features/admin/components/UserManagement.tsx`
- Modify: `src/features/admin/components/JournalManagement.tsx`
- Modify: `src/features/admin/components/DatabaseManager.tsx`

**Step 1: 迁移 BadgeManagement.tsx**

替换 `import PageHeader` 为：
```tsx
import { usePageTitle } from '@/contexts/PageContext';
```

在组件函数体顶部添加：
```tsx
usePageTitle('荣誉管理');
```

删除所有 `<PageHeader title="荣誉管理" />` 调用（3 处）。

**Step 2: 迁移 Dashboard.tsx (admin)**

替换 `import PageHeader` 为：
```tsx
import { usePageTitle } from '@/contexts/PageContext';
```

在组件函数体顶部添加：
```tsx
usePageTitle('仪表盘');
```

删除 `<PageHeader title="仪表盘" />`。

**Step 3: 迁移 CommentManagement.tsx**

替换 `import PageHeader` 为：
```tsx
import { usePageTitle } from '@/contexts/PageContext';
```

在组件函数体顶部添加：
```tsx
usePageTitle('评论管理');
```

删除 `<PageHeader title="评论管理" />`。

**Step 4: 迁移 UserManagement.tsx**

替换 `import PageHeader` 为：
```tsx
import { usePageTitle } from '@/contexts/PageContext';
```

在组件函数体顶部添加：
```tsx
usePageTitle('用户管理');
```

删除 `<PageHeader title="用户管理" />`。

**Step 5: 迁移 JournalManagement.tsx**

替换 `import PageHeader` 为：
```tsx
import { usePageTitle } from '@/contexts/PageContext';
```

在组件函数体顶部添加：
```tsx
usePageTitle('期刊管理');
```

删除整个 `<PageHeader ... />` 组件（包括 actions prop 中的添加按钮）。

**Step 6: 迁移 DatabaseManager.tsx**

替换 `import PageHeader` 为：
```tsx
import { usePageTitle } from '@/contexts/PageContext';
```

在组件函数体顶部添加：
```tsx
usePageTitle('数据库管理');
```

删除所有 `<PageHeader title="数据库管理" />` 调用（3 处）。

**Step 7: 验证 Admin 页面正常**

Run: `npm run dev`
Expected: 访问 /admin/* 页面，TopBar 显示对应标题

**Step 8: Commit**

```bash
git add src/features/admin/components/
git commit -m "refactor: migrate admin pages to usePageTitle"
```

---

### Task 5: 迁移用户相关页面（6 个文件）

**Files:**
- Modify: `src/features/submissions/pages/SubmissionPage.tsx`
- Modify: `src/features/profile/pages/ProfilePage.tsx`
- Modify: `src/features/dashboard/pages/DashboardPage.tsx`
- Modify: `src/features/badges/pages/BadgeGalleryPage.tsx`
- Modify: `src/features/profile/pages/ProfileEditPage.tsx`
- Modify: `src/features/follow/pages/FollowListPage.tsx`

**Step 1: 迁移 SubmissionPage.tsx**

替换 `import PageHeader` 为：
```tsx
import { usePageTitle } from '@/contexts/PageContext';
```

在组件函数体顶部添加：
```tsx
usePageTitle('我的投稿记录');
```

删除 `<PageHeader title="我的投稿记录" />`。

**Step 2: 迁移 ProfilePage.tsx**

替换 `import PageHeader` 为：
```tsx
import { usePageTitle } from '@/contexts/PageContext';
```

在组件函数体顶部添加：
```tsx
usePageTitle('用户资料');
```

删除 `<PageHeader title="用户资料" showBack backTo="/" />`。

**Step 3: 迁移 DashboardPage.tsx**

替换 `import PageHeader` 为：
```tsx
import { usePageTitle } from '@/contexts/PageContext';
```

在组件函数体顶部添加：
```tsx
usePageTitle('个人中心');
```

删除 `<PageHeader title="个人中心" showBack backTo="/" />`。

**Step 4: 迁移 BadgeGalleryPage.tsx**

替换 `import PageHeader` 为：
```tsx
import { usePageTitle } from '@/contexts/PageContext';
```

在组件函数体顶部添加：
```tsx
usePageTitle('荣誉殿堂');
```

删除 `<PageHeader title="荣誉殿堂" showBack backTo="/" />`。

**Step 5: 迁移 ProfileEditPage.tsx**

替换 `import PageHeader` 为：
```tsx
import { usePageTitle } from '@/contexts/PageContext';
```

在组件函数体顶部添加：
```tsx
usePageTitle('账号设置');
```

删除 `<PageHeader title="账号设置" showBack />`。

**Step 6: 迁移 FollowListPage.tsx**

替换 `import PageHeader` 为：
```tsx
import { usePageTitle } from '@/contexts/PageContext';
```

在组件函数体顶部添加：
```tsx
usePageTitle('关注列表');
```

删除 `<PageHeader title="关注列表" showBack />`。

**Step 7: 验证用户页面正常**

Run: `npm run dev`
Expected: 访问各用户页面，TopBar 显示对应标题

**Step 8: Commit**

```bash
git add src/features/submissions/ src/features/profile/ src/features/dashboard/ src/features/badges/ src/features/follow/
git commit -m "refactor: migrate user pages to usePageTitle"
```

---

### Task 6: 删除 PageHeader 组件

**Files:**
- Delete: `src/components/layout/PageHeader.tsx`
- Delete: `src/components/layout/PageHeader.css`

**Step 1: 删除文件**

```bash
rm src/components/layout/PageHeader.tsx
rm src/components/layout/PageHeader.css
```

**Step 2: 验证无引用残留**

Run: `grep -r "PageHeader" src/`
Expected: 无匹配结果（或仅有注释）

**Step 3: 验证应用正常**

Run: `npm run dev`
Expected: 应用正常启动，无报错

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove PageHeader component"
```

---

### Task 7: 修复认证竞态问题

**Files:**
- Modify: `src/contexts/AuthContext.tsx`

**Step 1: 修改 initialState**

将第 27 行 `loading: false` 改为 `loading: true`：

```tsx
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
};
```

**Step 2: 验证刷新行为**

Run: `npm run dev`
Expected: 刷新需要认证的页面（如 /dashboard），不再短暂显示"请先登录"

**Step 3: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "fix: auth loading race condition on page refresh"
```

---

### Task 8: 为首页和社区页添加标题

**Files:**
- Modify: `src/App.tsx` (HomeContent 组件)
- Modify: `src/features/posts/pages/CommunityPage.tsx`
- Modify: `src/features/posts/pages/PostDetailPage.tsx`
- Modify: `src/features/posts/pages/NewPostPage.tsx`

**Step 1: 为 HomeContent 添加标题**

在 App.tsx 的 HomeContent 组件中添加：

```tsx
import { usePageTitle } from '@/contexts/PageContext';

const HomeContent: React.FC = () => {
  usePageTitle('期刊列表');

  return (
    // ... 现有代码
  );
};
```

**Step 2: 为 CommunityPage 添加标题**

在组件顶部添加：
```tsx
import { usePageTitle } from '@/contexts/PageContext';
```

在组件函数体顶部添加：
```tsx
usePageTitle('社区讨论');
```

**Step 3: 为 PostDetailPage 添加标题**

在组件顶部添加：
```tsx
import { usePageTitle } from '@/contexts/PageContext';
```

在组件函数体顶部添加：
```tsx
usePageTitle('帖子详情');
```

**Step 4: 为 NewPostPage 添加标题**

在组件顶部添加：
```tsx
import { usePageTitle } from '@/contexts/PageContext';
```

在组件函数体顶部添加：
```tsx
usePageTitle('发布帖子');
```

**Step 5: 验证所有页面标题**

Run: `npm run dev`
Expected: 访问各页面，TopBar 均显示对应标题

**Step 6: Commit**

```bash
git add src/App.tsx src/features/posts/pages/
git commit -m "feat: add page titles to home and community pages"
```

---

### Task 9: 运行测试验证

**Step 1: 运行前端测试**

Run: `npm test`
Expected: 测试通过（可能有 PageHeader 相关测试需要更新或删除）

**Step 2: 如有测试失败，修复或删除相关测试**

搜索 PageHeader 相关测试：
```bash
grep -r "PageHeader" src/__tests__/
```

删除或更新相关测试文件。

**Step 3: 验证 E2E 测试**

Run: `npm run test:e2e`
Expected: E2E 测试通过

**Step 4: Final Commit**

```bash
git add -A
git commit -m "test: update tests for TopBar title consolidation"
```

---

## 完成检查清单

- [ ] PageContext 创建并集成
- [ ] TopBar 显示页面标题
- [ ] 12 个页面迁移到 usePageTitle
- [ ] PageHeader 组件删除
- [ ] 认证竞态问题修复
- [ ] 首页和社区页添加标题
- [ ] 测试通过
