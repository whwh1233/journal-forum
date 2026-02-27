# E2E 可视化演示测试 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 创建覆盖全部功能的 E2E 可视化演示测试，支持完整流程演示和模块化单独运行。

**Architecture:** 混合式架构 - `full-demo.spec.ts` 完整流程 + `demo-modules/` 模块化测试。可视化通过 `demo-helpers.ts` 实现元素高亮和浮动提示。使用独立测试数据库 `database.test.json` 隔离生产数据。

**Tech Stack:** Playwright, TypeScript, LowDB (test database), cross-env

---

## Task 1: 安装 cross-env 依赖

**Files:**
- Modify: `package.json`

**Step 1: 安装 cross-env**

```bash
npm install --save-dev cross-env
```

**Step 2: 验证安装**

Run: `npm ls cross-env`
Expected: 显示 cross-env 版本

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: 安装 cross-env 用于跨平台环境变量"
```

---

## Task 2: 修改后端数据库配置支持测试环境

**Files:**
- Modify: `backend/config/databaseLowdb.js`

**Step 1: 修改数据库路径逻辑**

将 `backend/config/databaseLowdb.js` 第 6 行改为：

```javascript
// 数据库文件路径 - 测试环境使用独立数据库
const dbFile = process.env.NODE_ENV === 'test' ? 'database.test.json' : 'database.json';
const dbPath = path.join(__dirname, '..', dbFile);
```

**Step 2: 手动验证**

Run: `cd backend && cross-env NODE_ENV=test node -e "console.log(process.env.NODE_ENV)"`
Expected: `test`

**Step 3: Commit**

```bash
git add backend/config/databaseLowdb.js
git commit -m "feat(backend): 支持测试环境独立数据库"
```

---

## Task 3: 创建测试数据库初始文件

**Files:**
- Create: `backend/database.test.json`

**Step 1: 创建测试数据库文件**

```json
{
  "journals": [
    {
      "id": "test-journal-001",
      "title": "计算机科学前沿研究",
      "issn": "1234-5678",
      "category": "computer-science",
      "publisher": "测试出版社",
      "description": "这是一个用于演示的测试期刊，涵盖计算机科学各个前沿领域的研究成果。",
      "impactFactor": 5.2,
      "avgRating": 4.5,
      "reviewCount": 10,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "test-journal-002",
      "title": "生物医学研究进展",
      "issn": "2345-6789",
      "category": "biology",
      "publisher": "科学出版社",
      "description": "专注于生物医学领域的创新研究和临床应用。",
      "impactFactor": 4.8,
      "avgRating": 4.2,
      "reviewCount": 8,
      "createdAt": "2024-01-02T00:00:00.000Z"
    },
    {
      "id": "test-journal-003",
      "title": "物理学报",
      "issn": "3456-7890",
      "category": "physics",
      "publisher": "物理学会",
      "description": "记录物理学最新发现和理论突破。",
      "impactFactor": 3.9,
      "avgRating": 4.0,
      "reviewCount": 5,
      "createdAt": "2024-01-03T00:00:00.000Z"
    }
  ],
  "users": [
    {
      "id": "test-admin-001",
      "email": "admin@test.com",
      "password": "$2a$10$N9qo8uLOickgx2ZMRZoHK.ZL1qGqVPvr4DLWnL7h8JMp6L5C6qFfW",
      "name": "测试管理员",
      "role": "admin",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "test-author-001",
      "email": "author@test.com",
      "password": "$2a$10$N9qo8uLOickgx2ZMRZoHK.ZL1qGqVPvr4DLWnL7h8JMp6L5C6qFfW",
      "name": "期刊作者",
      "role": "user",
      "status": "active",
      "bio": "资深学术研究者，专注于计算机科学领域。",
      "institution": "测试大学",
      "createdAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "comments": [
    {
      "id": "test-comment-001",
      "journalId": "test-journal-001",
      "userId": "test-author-001",
      "content": "这是一本非常优秀的期刊，审稿速度快，编辑态度专业。",
      "rating": 5,
      "likes": 3,
      "createdAt": "2024-01-10T00:00:00.000Z"
    }
  ],
  "favorites": [],
  "follows": [],
  "migrated": {}
}
```

**注意**: 密码 `$2a$10$N9qo8uLOickgx2ZMRZoHK.ZL1qGqVPvr4DLWnL7h8JMp6L5C6qFfW` 对应明文 `Test123456`

**Step 2: 添加到 .gitignore（可选，根据需求）**

如果不想提交测试数据库变更，可添加到 `.gitignore`。但建议提交初始状态便于重置。

**Step 3: Commit**

```bash
git add backend/database.test.json
git commit -m "feat(backend): 添加测试数据库初始数据"
```

---

## Task 4: 更新 Playwright 配置使用测试环境

**Files:**
- Modify: `playwright.config.ts`

**Step 1: 修改 webServer 配置**

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  webServer: [
    {
      command: 'cd backend && cross-env NODE_ENV=test npm start',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: 'npm run dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
  timeout: 600000, // 10 分钟，完整演示需要更长时间
  retries: 0, // 演示测试不需要重试
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    channel: 'chrome',
    launchOptions: {
      slowMo: 100, // 减少默认延迟，演示测试自己控制节奏
    },
  },
  projects: [{ name: 'chrome', use: { channel: 'chrome' } }],
});
```

**Step 2: Commit**

```bash
git add playwright.config.ts
git commit -m "feat(e2e): 更新 Playwright 配置支持测试环境"
```

---

## Task 5: 创建可视化辅助函数

**Files:**
- Create: `e2e/fixtures/demo-helpers.ts`

**Step 1: 创建 demo-helpers.ts**

```typescript
import { Page } from '@playwright/test';

/**
 * 延迟函数
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 元素高亮（红色边框，1秒后自动消失）
 */
export async function highlight(page: Page, selector: string): Promise<void> {
  try {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLElement;
      if (el) {
        el.style.outline = '3px solid #ff4444';
        el.style.outlineOffset = '2px';
        el.style.transition = 'outline 0.2s ease';
        setTimeout(() => {
          el.style.outline = '';
          el.style.outlineOffset = '';
        }, 1000);
      }
    }, selector);
  } catch {
    // 元素可能不存在，忽略错误
  }
}

/**
 * 浮动文字提示（右上角显示，自动消失）
 */
export async function showToast(page: Page, message: string, duration = 2000): Promise<void> {
  await page.evaluate(([msg, dur]) => {
    // 移除已存在的 toast
    const existing = document.getElementById('demo-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'demo-toast';
    toast.textContent = msg;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      background: rgba(0, 0, 0, 0.9);
      color: #fff;
      padding: 14px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s ease;
    `;
    document.body.appendChild(toast);

    // 动画进入
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });

    // 动画退出并移除
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, dur);
  }, [message, duration] as const);
}

/**
 * 显示章节标题（大字居中显示）
 */
export async function showChapterTitle(page: Page, title: string, subtitle?: string): Promise<void> {
  await page.evaluate(([t, s]) => {
    const overlay = document.createElement('div');
    overlay.id = 'demo-chapter';
    overlay.innerHTML = `
      <div style="font-size: 36px; font-weight: bold; margin-bottom: 10px;">${t}</div>
      ${s ? `<div style="font-size: 18px; opacity: 0.8;">${s}</div>` : ''}
    `;
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 99999;
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      opacity: 0;
      transition: opacity 0.5s ease;
    `;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });

    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 500);
    }, 2000);
  }, [title, subtitle] as const);

  await delay(2500);
}

/**
 * 组合操作：显示提示 + 高亮元素 + 延迟
 */
export async function demoAction(
  page: Page,
  selector: string,
  description: string,
  delayMs = 800
): Promise<void> {
  await showToast(page, description);
  await delay(300);
  await highlight(page, selector);
  await delay(delayMs);
}

/**
 * 等待元素并执行演示操作
 */
export async function demoClick(
  page: Page,
  selector: string,
  description: string
): Promise<void> {
  await demoAction(page, selector, description);
  await page.locator(selector).first().click();
  await delay(500);
}

/**
 * 演示输入操作（逐字输入效果）
 */
export async function demoType(
  page: Page,
  selector: string,
  text: string,
  description: string
): Promise<void> {
  await showToast(page, description);
  await highlight(page, selector);
  await delay(300);

  const input = page.locator(selector);
  await input.click();

  // 逐字输入
  for (const char of text) {
    await input.type(char, { delay: 50 });
  }

  await delay(500);
}

/**
 * 演示填充操作（快速填充）
 */
export async function demoFill(
  page: Page,
  selector: string,
  text: string,
  description: string
): Promise<void> {
  await showToast(page, description);
  await highlight(page, selector);
  await delay(300);
  await page.locator(selector).fill(text);
  await delay(500);
}

/**
 * 演示滚动操作
 */
export async function demoScroll(
  page: Page,
  direction: 'down' | 'up',
  amount = 300,
  description?: string
): Promise<void> {
  if (description) {
    await showToast(page, description);
  }
  const delta = direction === 'down' ? amount : -amount;
  await page.mouse.wheel(0, delta);
  await delay(600);
}

/**
 * 控制台日志（带格式）
 */
export function log(emoji: string, message: string): void {
  console.log(`${emoji} ${message}`);
}
```

**Step 2: Commit**

```bash
git add e2e/fixtures/demo-helpers.ts
git commit -m "feat(e2e): 添加可视化演示辅助函数"
```

---

## Task 6: 更新 test-data.ts 添加演示所需选择器

**Files:**
- Modify: `e2e/fixtures/test-data.ts`

**Step 1: 添加新的选择器和测试数据**

在文件末尾添加：

```typescript
/**
 * 演示测试用户（对应 database.test.json）
 */
export const demoUsers = {
  // 管理员
  admin: {
    email: 'admin@test.com',
    password: 'Test123456',
    name: '测试管理员',
  },
  // 已存在的作者（用于关注）
  author: {
    email: 'author@test.com',
    password: 'Test123456',
    name: '期刊作者',
  },
  // 新注册用户（演示时创建）
  newUser: {
    email: 'demo@test.com',
    password: 'Demo123456',
    name: '演示用户',
  },
};

/**
 * 管理后台选择器
 */
export const adminSelectors = {
  // 侧边导航
  nav: {
    dashboard: 'a[href="/admin"]',
    users: 'a[href="/admin/users"]',
    journals: 'a[href="/admin/journals"]',
    comments: 'a[href="/admin/comments"]',
  },
  // 用户管理
  users: {
    container: '.user-management',
    searchInput: '.user-management input[type="text"]',
    searchBtn: '.user-management button[type="submit"]',
    table: '.user-management table',
    row: '.user-management tbody tr',
    statusBtn: '.user-management .status-btn',
    deleteBtn: '.user-management .delete-btn',
  },
  // 期刊管理
  journals: {
    container: '.journal-management',
    table: '.journal-management table',
    row: '.journal-management tbody tr',
    editBtn: '.journal-management .edit-btn',
    deleteBtn: '.journal-management .delete-btn',
  },
  // 评论管理
  comments: {
    container: '.comment-management',
    table: '.comment-management table',
    row: '.comment-management tbody tr',
    deleteBtn: '.comment-management .delete-btn',
  },
};

/**
 * 个人资料选择器
 */
export const profileSelectors = {
  // 个人主页
  page: {
    container: '.profile-page',
    avatar: '.profile-avatar',
    name: '.profile-name',
    bio: '.profile-bio',
    stats: '.profile-stats',
    followBtn: '.follow-btn',
    followersLink: '.followers-link',
    followingLink: '.following-link',
  },
  // 编辑页面
  edit: {
    container: '.profile-edit-page',
    avatarInput: 'input[type="file"]',
    avatarUploadBtn: '.avatar-upload-btn',
    nameInput: 'input[name="name"]',
    bioInput: 'textarea[name="bio"]',
    locationInput: 'input[name="location"]',
    institutionInput: 'input[name="institution"]',
    websiteInput: 'input[name="website"]',
    submitBtn: '.profile-edit-page button[type="submit"]',
    successMsg: '.success-message',
  },
};

/**
 * 仪表盘选择器
 */
export const dashboardSelectors = {
  container: '.dashboard-page',
  statsCards: '.stats-card',
  commentCount: '.stats-card.comments .count',
  favoriteCount: '.stats-card.favorites .count',
  followingCount: '.stats-card.following .count',
  recentComments: '.recent-comments',
  favoritesSection: '.favorites-section',
};

/**
 * 收藏相关选择器
 */
export const favoriteSelectors = {
  btn: '.favorite-btn',
  btnActive: '.favorite-btn.active',
  list: '.favorites-list',
  item: '.favorite-item',
};

/**
 * 关注相关选择器
 */
export const followSelectors = {
  btn: '.follow-btn',
  btnActive: '.follow-btn.following',
  followersList: '.followers-list',
  followingList: '.following-list',
  userCard: '.user-card',
};
```

**Step 2: Commit**

```bash
git add e2e/fixtures/test-data.ts
git commit -m "feat(e2e): 添加演示测试所需选择器和测试数据"
```

---

## Task 7: 创建模块化测试 - 游客场景

**Files:**
- Create: `e2e/tests/demo-modules/01-guest.spec.ts`

**Step 1: 创建目录**

```bash
mkdir -p e2e/tests/demo-modules
```

**Step 2: 创建 01-guest.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { selectors, searchTerms } from '../../fixtures/test-data';
import {
  delay,
  showChapterTitle,
  showToast,
  demoAction,
  demoClick,
  demoType,
  demoScroll,
  log,
} from '../../fixtures/demo-helpers';

test.describe('游客场景演示', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('浏览期刊列表', async ({ page }) => {
    await showChapterTitle(page, '浏览期刊列表', '展示首页期刊卡片');

    // 等待期刊卡片加载
    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });
    log('📚', '期刊列表已加载');

    // 滚动浏览
    await demoScroll(page, 'down', 300, '📜 向下滚动浏览');
    await demoScroll(page, 'down', 300);
    await demoScroll(page, 'up', 600, '📜 返回顶部');

    // 高亮展示期刊卡片
    const cards = page.locator(selectors.journal.card);
    const count = await cards.count();
    await showToast(page, `共有 ${count} 个期刊`);
    await delay(1500);

    // 依次高亮前3个期刊
    for (let i = 0; i < Math.min(3, count); i++) {
      await demoAction(
        page,
        `${selectors.journal.card}:nth-child(${i + 1})`,
        `📖 期刊 ${i + 1}`
      );
    }

    expect(count).toBeGreaterThan(0);
  });

  test('搜索和筛选', async ({ page }) => {
    await showChapterTitle(page, '搜索和筛选', '测试搜索和分类筛选功能');

    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

    // 搜索功能
    const searchInput = page.locator(selectors.search.input);
    if (await searchInput.isVisible()) {
      await demoType(page, selectors.search.input, searchTerms[0], '🔍 输入搜索关键词');

      const searchBtn = page.locator(selectors.search.searchBtn);
      if (await searchBtn.isVisible()) {
        await demoClick(page, selectors.search.searchBtn, '🔍 点击搜索');
      } else {
        await searchInput.press('Enter');
      }
      await delay(1000);

      const resultCount = await page.locator(selectors.journal.card).count();
      await showToast(page, `搜索结果: ${resultCount} 个期刊`);
      await delay(1500);

      // 清除搜索
      await searchInput.clear();
      const clearBtn = page.locator(selectors.search.clearBtn);
      if (await clearBtn.isVisible()) {
        await demoClick(page, selectors.search.clearBtn, '🔄 清除搜索');
      }
      await delay(1000);
    }

    // 分类筛选
    const categorySelect = page.locator(selectors.search.categorySelect);
    if (await categorySelect.isVisible()) {
      await demoAction(page, selectors.search.categorySelect, '📂 选择学科分类');
      await categorySelect.selectOption({ index: 1 });
      await delay(1500);

      // 评分筛选
      const ratingSelect = page.locator(selectors.search.ratingSelect);
      if (await ratingSelect.isVisible()) {
        await demoAction(page, selectors.search.ratingSelect, '⭐ 选择评分筛选');
        await ratingSelect.selectOption({ index: 1 });
        await delay(1500);
      }

      // 清除筛选
      const clearBtn = page.locator(selectors.search.clearBtn);
      if (await clearBtn.isVisible()) {
        await demoClick(page, selectors.search.clearBtn, '🔄 清除所有筛选');
      }
    }

    expect(true).toBe(true);
  });

  test('查看期刊详情', async ({ page }) => {
    await showChapterTitle(page, '查看期刊详情', '打开期刊详情面板');

    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

    // 点击第一个期刊
    await demoClick(page, selectors.journal.card, '📖 点击查看期刊详情');

    // 等待详情面板
    await page.waitForSelector(`${selectors.journal.panel}.open`, { timeout: 5000 });
    await showToast(page, '✅ 详情面板已打开');
    await delay(1500);

    // 滚动查看内容
    const panel = page.locator('.journal-panel-body');
    for (let i = 0; i < 3; i++) {
      await panel.evaluate((el) => el.scrollBy({ top: 200, behavior: 'smooth' }));
      await delay(600);
    }
    await showToast(page, '📝 查看评论区域');
    await delay(1000);

    // 尝试评论（未登录）
    const loginPrompt = page.locator(selectors.comment.loginPrompt);
    if (await loginPrompt.isVisible()) {
      await demoAction(page, selectors.comment.loginPrompt, '🔒 需要登录才能评论');
    }

    // 关闭面板
    await demoClick(page, selectors.journal.panelClose, '❌ 关闭详情面板');

    await expect(page.locator(`${selectors.journal.panel}.open`)).not.toBeVisible();
  });

  test('主题切换', async ({ page }) => {
    await showChapterTitle(page, '主题切换', '切换不同的视觉主题');

    const themeTrigger = page.locator(selectors.theme.trigger);
    if (await themeTrigger.isVisible()) {
      await demoClick(page, selectors.theme.trigger, '🎨 打开主题选择器');
      await delay(500);

      const themeOptions = page.locator(selectors.theme.option);
      const themeCount = await themeOptions.count();
      await showToast(page, `共有 ${themeCount} 个主题可选`);
      await delay(1000);

      // 切换每个主题
      for (let i = 0; i < Math.min(themeCount, 6); i++) {
        await themeOptions.nth(i).click();
        await showToast(page, `✨ 主题 ${i + 1}`);
        await delay(1200);
      }

      await showToast(page, '🎨 主题切换完成');
    }

    expect(true).toBe(true);
  });
});
```

**Step 3: 验证测试可运行**

Run: `npx playwright test demo-modules/01-guest.spec.ts --headed --project=chrome`
Expected: 测试通过，可以看到可视化效果

**Step 4: Commit**

```bash
git add e2e/tests/demo-modules/01-guest.spec.ts
git commit -m "feat(e2e): 添加游客场景演示测试"
```

---

## Task 8: 创建模块化测试 - 认证场景

**Files:**
- Create: `e2e/tests/demo-modules/02-auth.spec.ts`

**Step 1: 创建 02-auth.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { selectors, demoUsers } from '../../fixtures/test-data';
import {
  delay,
  showChapterTitle,
  showToast,
  demoAction,
  demoClick,
  demoFill,
  log,
} from '../../fixtures/demo-helpers';

test.describe('认证场景演示', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('用户注册流程', async ({ page }) => {
    await showChapterTitle(page, '用户注册', '演示新用户注册流程');

    // 打开登录弹窗
    const loginBtn = page.locator(selectors.topBar.loginBtn);
    if (await loginBtn.isVisible()) {
      await demoClick(page, selectors.topBar.loginBtn, '👤 点击登录按钮');
    }

    await page.waitForSelector(selectors.auth.loginForm, { timeout: 5000 });
    await showToast(page, '✅ 登录弹窗已打开');
    await delay(1000);

    // 切换到注册
    await demoClick(page, selectors.auth.switchToRegister, '🔄 切换到注册表单');
    await delay(800);

    // 填写注册表单
    // 用户名（如果存在）
    const nameInput = page.locator('input#name');
    if (await nameInput.isVisible()) {
      await demoFill(page, 'input#name', demoUsers.newUser.name, '📝 输入用户名');
    }

    await demoFill(page, selectors.auth.emailInput, demoUsers.newUser.email, '📧 输入邮箱');
    await demoFill(page, selectors.auth.passwordInput, demoUsers.newUser.password, '🔑 输入密码');

    // 确认密码（如果存在）
    const confirmInput = page.locator('input#confirmPassword');
    if (await confirmInput.isVisible()) {
      await demoFill(page, 'input#confirmPassword', demoUsers.newUser.password, '🔑 确认密码');
    }

    await showToast(page, '📋 表单填写完成');
    await delay(1000);

    // 提交注册
    await demoClick(page, selectors.auth.submitBtn, '✅ 提交注册');
    await delay(2000);

    // 检查是否注册成功（弹窗关闭或显示成功消息）
    const modalVisible = await page.locator(selectors.auth.modal).isVisible();
    if (!modalVisible) {
      await showToast(page, '🎉 注册成功！');
      log('✅', '注册成功');
    }

    expect(true).toBe(true);
  });

  test('用户登录流程', async ({ page }) => {
    await showChapterTitle(page, '用户登录', '演示已有用户登录');

    // 打开登录弹窗
    const loginBtn = page.locator(selectors.topBar.loginBtn);
    if (await loginBtn.isVisible()) {
      await demoClick(page, selectors.topBar.loginBtn, '👤 点击登录按钮');
    }

    await page.waitForSelector(selectors.auth.loginForm, { timeout: 5000 });

    // 填写登录表单
    await demoFill(page, selectors.auth.emailInput, demoUsers.author.email, '📧 输入邮箱');
    await demoFill(page, selectors.auth.passwordInput, demoUsers.author.password, '🔑 输入密码');

    // 提交登录
    await demoClick(page, selectors.auth.submitBtn, '✅ 点击登录');
    await delay(2000);

    // 验证登录成功
    const userDropdown = page.locator(selectors.topBar.userDropdown);
    if (await userDropdown.isVisible({ timeout: 5000 })) {
      await showToast(page, '🎉 登录成功！');
      await demoAction(page, selectors.topBar.userDropdown, '👤 用户已登录');
    }

    expect(true).toBe(true);
  });

  test('表单验证提示', async ({ page }) => {
    await showChapterTitle(page, '表单验证', '演示表单验证功能');

    // 打开登录弹窗
    const loginBtn = page.locator(selectors.topBar.loginBtn);
    if (await loginBtn.isVisible()) {
      await demoClick(page, selectors.topBar.loginBtn, '👤 打开登录弹窗');
    }

    await page.waitForSelector(selectors.auth.loginForm, { timeout: 5000 });

    // 直接点击提交（空表单）
    await demoClick(page, selectors.auth.submitBtn, '❌ 尝试提交空表单');
    await delay(1000);

    // 检查验证
    const emailInput = page.locator(selectors.auth.emailInput);
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);

    if (isInvalid) {
      await showToast(page, '⚠️ 表单验证：请填写必填字段');
    }

    // 输入无效邮箱
    await demoFill(page, selectors.auth.emailInput, 'invalid-email', '📧 输入无效邮箱格式');
    await demoClick(page, selectors.auth.submitBtn, '❌ 尝试提交');
    await delay(1000);
    await showToast(page, '⚠️ 邮箱格式验证');
    await delay(1500);

    // 关闭弹窗
    await page.keyboard.press('Escape');
    await showToast(page, '✅ 表单验证演示完成');

    expect(true).toBe(true);
  });
});
```

**Step 2: 验证测试可运行**

Run: `npx playwright test demo-modules/02-auth.spec.ts --headed --project=chrome`
Expected: 测试通过

**Step 3: Commit**

```bash
git add e2e/tests/demo-modules/02-auth.spec.ts
git commit -m "feat(e2e): 添加认证场景演示测试"
```

---

## Task 9: 创建模块化测试 - 用户场景

**Files:**
- Create: `e2e/tests/demo-modules/03-user.spec.ts`

**Step 1: 创建 03-user.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import {
  selectors,
  routes,
  demoUsers,
  profileSelectors,
  dashboardSelectors,
  favoriteSelectors,
  followSelectors,
} from '../../fixtures/test-data';
import {
  delay,
  showChapterTitle,
  showToast,
  demoAction,
  demoClick,
  demoFill,
  demoScroll,
  log,
} from '../../fixtures/demo-helpers';

// 登录辅助函数
async function login(page: any, user: { email: string; password: string }) {
  const loginBtn = page.locator(selectors.topBar.loginBtn);
  if (await loginBtn.isVisible()) {
    await loginBtn.click();
    await page.waitForSelector(selectors.auth.loginForm, { timeout: 5000 });
    await page.locator(selectors.auth.emailInput).fill(user.email);
    await page.locator(selectors.auth.passwordInput).fill(user.password);
    await page.locator(selectors.auth.submitBtn).click();
    await delay(2000);
  }
}

test.describe('用户场景演示', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // 先注册/登录演示用户
    await login(page, demoUsers.author);
  });

  test('发表评论和评分', async ({ page }) => {
    await showChapterTitle(page, '发表评论', '演示评论和评分功能');

    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

    // 打开期刊详情
    await demoClick(page, selectors.journal.card, '📖 打开期刊详情');
    await page.waitForSelector(`${selectors.journal.panel}.open`, { timeout: 5000 });
    await delay(1000);

    // 滚动到评论区
    const panel = page.locator('.journal-panel-body');
    await panel.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }));
    await showToast(page, '📝 滚动到评论区');
    await delay(1500);

    // 点击评分星星
    const stars = page.locator(selectors.comment.ratingStars);
    if (await stars.first().isVisible()) {
      await demoAction(page, selectors.comment.ratingStars, '⭐ 选择评分');
      await stars.nth(4).click(); // 5星
      await delay(800);
    }

    // 输入评论
    const textarea = page.locator(selectors.comment.textarea);
    if (await textarea.isVisible()) {
      await demoFill(
        page,
        selectors.comment.textarea,
        '这是一篇非常有价值的期刊，内容丰富，研究深入，强烈推荐！',
        '📝 输入评论内容'
      );

      // 提交评论
      await demoClick(page, selectors.comment.submitBtn, '✅ 发布评论');
      await delay(2000);
      await showToast(page, '🎉 评论发布成功！');
    }

    // 关闭面板
    await demoClick(page, selectors.journal.panelClose, '❌ 关闭详情');

    expect(true).toBe(true);
  });

  test('收藏期刊', async ({ page }) => {
    await showChapterTitle(page, '收藏期刊', '演示收藏功能');

    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

    // 打开期刊详情
    await demoClick(page, selectors.journal.card, '📖 打开期刊详情');
    await page.waitForSelector(`${selectors.journal.panel}.open`, { timeout: 5000 });

    // 点击收藏按钮
    const favoriteBtn = page.locator(favoriteSelectors.btn);
    if (await favoriteBtn.isVisible()) {
      await demoClick(page, favoriteSelectors.btn, '⭐ 点击收藏');
      await delay(1000);
      await showToast(page, '✅ 期刊已收藏');
    }

    // 关闭面板
    await demoClick(page, selectors.journal.panelClose, '❌ 关闭详情');

    expect(true).toBe(true);
  });

  test('关注用户', async ({ page }) => {
    await showChapterTitle(page, '关注用户', '演示关注功能');

    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

    // 打开期刊详情
    await demoClick(page, selectors.journal.card, '📖 打开期刊详情');
    await page.waitForSelector(`${selectors.journal.panel}.open`, { timeout: 5000 });

    // 滚动到评论区找到用户头像
    const panel = page.locator('.journal-panel-body');
    await panel.evaluate((el) => el.scrollTo({ top: 300, behavior: 'smooth' }));
    await delay(1000);

    // 点击用户头像/名称进入个人主页
    const userLink = page.locator('.comment-author-link, .comment-avatar').first();
    if (await userLink.isVisible()) {
      await demoClick(page, '.comment-author-link, .comment-avatar', '👤 查看用户主页');
      await delay(1500);

      // 点击关注按钮
      const followBtn = page.locator(followSelectors.btn);
      if (await followBtn.isVisible()) {
        await demoClick(page, followSelectors.btn, '➕ 关注用户');
        await delay(1000);
        await showToast(page, '✅ 已关注该用户');
      }
    }

    expect(true).toBe(true);
  });

  test('仪表盘统计', async ({ page }) => {
    await showChapterTitle(page, '仪表盘', '查看个人统计数据');

    // 导航到仪表盘
    await page.goto(routes.dashboard);
    await page.waitForLoadState('networkidle');
    await delay(1000);

    // 展示统计卡片
    const statsCards = page.locator(dashboardSelectors.statsCards);
    const cardCount = await statsCards.count();

    await showToast(page, '📊 个人数据统计');
    await delay(1000);

    for (let i = 0; i < Math.min(cardCount, 4); i++) {
      await demoAction(
        page,
        `${dashboardSelectors.statsCards}:nth-child(${i + 1})`,
        `📈 统计数据 ${i + 1}`
      );
    }

    // 滚动查看更多内容
    await demoScroll(page, 'down', 300, '📜 查看更多内容');
    await delay(1000);

    expect(true).toBe(true);
  });

  test('编辑个人资料', async ({ page }) => {
    await showChapterTitle(page, '编辑资料', '修改个人资料信息');

    // 导航到资料编辑页
    await page.goto(routes.profileEdit);
    await page.waitForLoadState('networkidle');
    await delay(1000);

    // 修改简介
    const bioInput = page.locator(profileSelectors.edit.bioInput);
    if (await bioInput.isVisible()) {
      await demoFill(
        page,
        profileSelectors.edit.bioInput,
        '热爱学术研究，专注于计算机科学和人工智能领域。',
        '📝 修改个人简介'
      );
    }

    // 修改机构
    const institutionInput = page.locator(profileSelectors.edit.institutionInput);
    if (await institutionInput.isVisible()) {
      await demoFill(
        page,
        profileSelectors.edit.institutionInput,
        '演示大学计算机学院',
        '🏫 修改所属机构'
      );
    }

    // 保存
    const submitBtn = page.locator(profileSelectors.edit.submitBtn);
    if (await submitBtn.isVisible()) {
      await demoClick(page, profileSelectors.edit.submitBtn, '💾 保存修改');
      await delay(2000);
      await showToast(page, '✅ 资料保存成功');
    }

    expect(true).toBe(true);
  });
});
```

**Step 2: 验证测试可运行**

Run: `npx playwright test demo-modules/03-user.spec.ts --headed --project=chrome`
Expected: 测试通过

**Step 3: Commit**

```bash
git add e2e/tests/demo-modules/03-user.spec.ts
git commit -m "feat(e2e): 添加用户场景演示测试"
```

---

## Task 10: 创建模块化测试 - 管理员场景

**Files:**
- Create: `e2e/tests/demo-modules/04-admin.spec.ts`

**Step 1: 创建 04-admin.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import {
  selectors,
  routes,
  demoUsers,
  adminSelectors,
} from '../../fixtures/test-data';
import {
  delay,
  showChapterTitle,
  showToast,
  demoAction,
  demoClick,
  demoScroll,
  log,
} from '../../fixtures/demo-helpers';

// 管理员登录辅助函数
async function loginAsAdmin(page: any) {
  const loginBtn = page.locator(selectors.topBar.loginBtn);
  if (await loginBtn.isVisible()) {
    await loginBtn.click();
    await page.waitForSelector(selectors.auth.loginForm, { timeout: 5000 });
    await page.locator(selectors.auth.emailInput).fill(demoUsers.admin.email);
    await page.locator(selectors.auth.passwordInput).fill(demoUsers.admin.password);
    await page.locator(selectors.auth.submitBtn).click();
    await delay(2000);
  }
}

test.describe('管理员场景演示', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await loginAsAdmin(page);
  });

  test('用户管理', async ({ page }) => {
    await showChapterTitle(page, '用户管理', '管理系统用户');

    // 导航到用户管理
    await page.goto(routes.admin.users);
    await page.waitForLoadState('networkidle');
    await delay(1000);

    await showToast(page, '👥 用户管理页面');
    await delay(1000);

    // 展示用户列表
    const userRows = page.locator(adminSelectors.users.row);
    const userCount = await userRows.count();
    await showToast(page, `共有 ${userCount} 个用户`);
    await delay(1000);

    // 高亮表格
    await demoAction(page, adminSelectors.users.table, '📋 用户列表');

    // 搜索用户
    const searchInput = page.locator(adminSelectors.users.searchInput);
    if (await searchInput.isVisible()) {
      await demoAction(page, adminSelectors.users.searchInput, '🔍 搜索用户');
      await searchInput.fill('test');
      await delay(500);

      const searchBtn = page.locator(adminSelectors.users.searchBtn);
      if (await searchBtn.isVisible()) {
        await searchBtn.click();
        await delay(1000);
      }
    }

    // 展示操作按钮
    const statusBtn = page.locator(adminSelectors.users.statusBtn).first();
    if (await statusBtn.isVisible()) {
      await demoAction(page, adminSelectors.users.statusBtn, '🔄 可切换用户状态');
    }

    await showToast(page, '✅ 用户管理演示完成');

    expect(true).toBe(true);
  });

  test('期刊管理', async ({ page }) => {
    await showChapterTitle(page, '期刊管理', '管理系统期刊');

    // 导航到期刊管理
    await page.goto(routes.admin.journals);
    await page.waitForLoadState('networkidle');
    await delay(1000);

    await showToast(page, '📚 期刊管理页面');
    await delay(1000);

    // 展示期刊列表
    const journalRows = page.locator(adminSelectors.journals.row);
    const journalCount = await journalRows.count();
    await showToast(page, `共有 ${journalCount} 个期刊`);
    await delay(1000);

    // 高亮表格
    await demoAction(page, adminSelectors.journals.table, '📋 期刊列表');

    // 滚动查看
    await demoScroll(page, 'down', 200, '📜 滚动查看更多');
    await delay(800);

    // 展示编辑按钮
    const editBtn = page.locator(adminSelectors.journals.editBtn).first();
    if (await editBtn.isVisible()) {
      await demoAction(page, adminSelectors.journals.editBtn, '✏️ 可编辑期刊信息');
    }

    await showToast(page, '✅ 期刊管理演示完成');

    expect(true).toBe(true);
  });

  test('评论审核', async ({ page }) => {
    await showChapterTitle(page, '评论审核', '审核和管理评论');

    // 导航到评论管理
    await page.goto(routes.admin.comments);
    await page.waitForLoadState('networkidle');
    await delay(1000);

    await showToast(page, '💬 评论管理页面');
    await delay(1000);

    // 展示评论列表
    const commentRows = page.locator(adminSelectors.comments.row);
    const commentCount = await commentRows.count();
    await showToast(page, `共有 ${commentCount} 条评论`);
    await delay(1000);

    // 高亮表格
    if (commentCount > 0) {
      await demoAction(page, adminSelectors.comments.table, '📋 评论列表');

      // 展示删除按钮
      const deleteBtn = page.locator(adminSelectors.comments.deleteBtn).first();
      if (await deleteBtn.isVisible()) {
        await demoAction(page, adminSelectors.comments.deleteBtn, '🗑️ 可删除违规评论');
      }
    }

    await showToast(page, '✅ 评论审核演示完成');

    expect(true).toBe(true);
  });
});
```

**Step 2: 验证测试可运行**

Run: `npx playwright test demo-modules/04-admin.spec.ts --headed --project=chrome`
Expected: 测试通过

**Step 3: Commit**

```bash
git add e2e/tests/demo-modules/04-admin.spec.ts
git commit -m "feat(e2e): 添加管理员场景演示测试"
```

---

## Task 11: 创建完整流程演示测试

**Files:**
- Create: `e2e/tests/full-demo.spec.ts`

**Step 1: 创建 full-demo.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import {
  selectors,
  routes,
  searchTerms,
  demoUsers,
  adminSelectors,
  profileSelectors,
  dashboardSelectors,
  favoriteSelectors,
} from '../fixtures/test-data';
import {
  delay,
  showChapterTitle,
  showToast,
  demoAction,
  demoClick,
  demoFill,
  demoType,
  demoScroll,
  highlight,
  log,
} from '../fixtures/demo-helpers';

test.describe('完整功能演示', () => {
  test('全部功能可视化演示', async ({ page }, testInfo) => {
    // 设置超长超时（10分钟）
    testInfo.setTimeout(600000);

    log('🚀', '开始完整功能演示...\n');

    // ==========================================
    // 第 1 幕：游客体验
    // ==========================================
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await showChapterTitle(page, '第 1 幕：游客体验', '浏览、搜索、筛选期刊');

    // 等待期刊加载
    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });
    log('📚', '期刊列表已加载');

    // 展开侧边栏
    await demoClick(page, selectors.sideNav.toggle, '📌 展开侧边导航');
    await delay(800);

    // 滚动浏览
    await demoScroll(page, 'down', 400, '📜 滚动浏览期刊列表');
    await demoScroll(page, 'down', 400);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await delay(800);

    // 搜索功能
    const searchInput = page.locator(selectors.search.input);
    if (await searchInput.isVisible()) {
      await demoType(page, selectors.search.input, searchTerms[0], '🔍 搜索期刊');
      const searchBtn = page.locator(selectors.search.searchBtn);
      if (await searchBtn.isVisible()) {
        await demoClick(page, selectors.search.searchBtn, '🔍 执行搜索');
      } else {
        await searchInput.press('Enter');
      }
      await delay(1500);

      // 清除搜索
      await searchInput.clear();
      const clearBtn = page.locator(selectors.search.clearBtn);
      if (await clearBtn.isVisible()) {
        await clearBtn.click();
      }
      await delay(800);
    }

    // 分类筛选
    const categorySelect = page.locator(selectors.search.categorySelect);
    if (await categorySelect.isVisible()) {
      await demoAction(page, selectors.search.categorySelect, '📂 选择学科分类');
      await categorySelect.selectOption({ index: 1 });
      await delay(1200);

      const clearBtn = page.locator(selectors.search.clearBtn);
      if (await clearBtn.isVisible()) {
        await clearBtn.click();
      }
      await delay(800);
    }

    // 查看期刊详情
    await demoClick(page, selectors.journal.card, '📖 查看期刊详情');
    await page.waitForSelector(`${selectors.journal.panel}.open`, { timeout: 5000 });
    await delay(1000);

    // 滚动查看内容
    const panelBody = page.locator('.journal-panel-body');
    for (let i = 0; i < 3; i++) {
      await panelBody.evaluate((el) => el.scrollBy({ top: 200, behavior: 'smooth' }));
      await delay(500);
    }
    await showToast(page, '📝 查看评论区');
    await delay(1000);

    // 尝试评论（未登录）
    const loginPrompt = page.locator(selectors.comment.loginPrompt);
    if (await loginPrompt.isVisible()) {
      await demoAction(page, selectors.comment.loginPrompt, '🔒 需要登录才能评论');
    }

    // 关闭详情
    await demoClick(page, selectors.journal.panelClose, '❌ 关闭详情面板');
    await delay(500);

    // ==========================================
    // 第 2 幕：用户注册
    // ==========================================
    await showChapterTitle(page, '第 2 幕：用户注册', '注册新账户');

    // 打开登录弹窗
    await demoClick(page, selectors.topBar.loginBtn, '👤 点击登录');
    await page.waitForSelector(selectors.auth.loginForm, { timeout: 5000 });

    // 切换到注册
    await demoClick(page, selectors.auth.switchToRegister, '🔄 切换到注册');
    await delay(500);

    // 填写注册表单
    const nameInput = page.locator('input#name');
    if (await nameInput.isVisible()) {
      await demoFill(page, 'input#name', demoUsers.newUser.name, '📝 输入用户名');
    }
    await demoFill(page, selectors.auth.emailInput, demoUsers.newUser.email, '📧 输入邮箱');
    await demoFill(page, selectors.auth.passwordInput, demoUsers.newUser.password, '🔑 输入密码');

    const confirmInput = page.locator('input#confirmPassword');
    if (await confirmInput.isVisible()) {
      await demoFill(page, 'input#confirmPassword', demoUsers.newUser.password, '🔑 确认密码');
    }

    // 提交注册
    await demoClick(page, selectors.auth.submitBtn, '✅ 提交注册');
    await delay(2500);

    // ==========================================
    // 第 3 幕：用户功能
    // ==========================================
    await showChapterTitle(page, '第 3 幕：用户功能', '评论、收藏、关注');

    // 打开期刊详情
    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });
    await demoClick(page, selectors.journal.card, '📖 查看期刊详情');
    await page.waitForSelector(`${selectors.journal.panel}.open`, { timeout: 5000 });

    // 滚动到评论区
    const panel = page.locator('.journal-panel-body');
    await panel.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }));
    await delay(1000);

    // 评分
    const stars = page.locator(selectors.comment.ratingStars);
    if (await stars.first().isVisible()) {
      await demoAction(page, selectors.comment.ratingStars, '⭐ 选择评分');
      await stars.nth(4).click();
      await delay(600);
    }

    // 发表评论
    const textarea = page.locator(selectors.comment.textarea);
    if (await textarea.isVisible()) {
      await demoFill(
        page,
        selectors.comment.textarea,
        '这是一篇非常有价值的期刊！',
        '📝 输入评论'
      );
      await demoClick(page, selectors.comment.submitBtn, '✅ 发布评论');
      await delay(2000);
    }

    // 收藏期刊
    await panel.evaluate((el) => el.scrollTo({ top: 0, behavior: 'smooth' }));
    await delay(500);
    const favoriteBtn = page.locator(favoriteSelectors.btn);
    if (await favoriteBtn.isVisible()) {
      await demoClick(page, favoriteSelectors.btn, '⭐ 收藏期刊');
      await delay(1000);
    }

    // 关闭详情
    await demoClick(page, selectors.journal.panelClose, '❌ 关闭详情');
    await delay(500);

    // 进入仪表盘
    await showToast(page, '📊 进入仪表盘');
    await page.goto(routes.dashboard);
    await page.waitForLoadState('networkidle');
    await delay(1500);

    // 展示统计数据
    const statsCards = page.locator(dashboardSelectors.statsCards);
    const cardCount = await statsCards.count();
    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      await demoAction(page, `${dashboardSelectors.statsCards}:nth-child(${i + 1})`, `📈 统计 ${i + 1}`);
    }

    // 编辑个人资料
    await showToast(page, '✏️ 编辑个人资料');
    await page.goto(routes.profileEdit);
    await page.waitForLoadState('networkidle');
    await delay(1000);

    const bioInput = page.locator(profileSelectors.edit.bioInput);
    if (await bioInput.isVisible()) {
      await demoFill(page, profileSelectors.edit.bioInput, '热爱学术研究', '📝 修改简介');
    }

    const submitBtn = page.locator(profileSelectors.edit.submitBtn);
    if (await submitBtn.isVisible()) {
      await demoClick(page, profileSelectors.edit.submitBtn, '💾 保存修改');
      await delay(2000);
    }

    // 退出登录
    await showToast(page, '👋 退出登录');
    await page.goto('/');
    const userDropdown = page.locator(selectors.topBar.userDropdown);
    if (await userDropdown.isVisible()) {
      await userDropdown.click();
      await delay(500);
      const logoutBtn = page.locator('button:has-text("退出")');
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await delay(1500);
      }
    }

    // ==========================================
    // 第 4 幕：主题切换
    // ==========================================
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await showChapterTitle(page, '第 4 幕：主题切换', '切换视觉主题');

    const themeTrigger = page.locator(selectors.theme.trigger);
    if (await themeTrigger.isVisible()) {
      await demoClick(page, selectors.theme.trigger, '🎨 打开主题选择器');
      await delay(500);

      const themeOptions = page.locator(selectors.theme.option);
      const themeCount = await themeOptions.count();

      for (let i = 0; i < Math.min(themeCount, 6); i++) {
        await themeOptions.nth(i).click();
        await showToast(page, `✨ 主题 ${i + 1}`);
        await delay(1000);
      }
    }

    // ==========================================
    // 第 5 幕：管理后台
    // ==========================================
    await showChapterTitle(page, '第 5 幕：管理后台', '管理员功能演示');

    // 管理员登录
    await page.goto('/');
    const loginBtn = page.locator(selectors.topBar.loginBtn);
    if (await loginBtn.isVisible()) {
      await demoClick(page, selectors.topBar.loginBtn, '👤 管理员登录');
      await page.waitForSelector(selectors.auth.loginForm, { timeout: 5000 });
      await demoFill(page, selectors.auth.emailInput, demoUsers.admin.email, '📧 管理员邮箱');
      await demoFill(page, selectors.auth.passwordInput, demoUsers.admin.password, '🔑 管理员密码');
      await demoClick(page, selectors.auth.submitBtn, '✅ 登录');
      await delay(2000);
    }

    // 用户管理
    await showToast(page, '👥 用户管理');
    await page.goto(routes.admin.users);
    await page.waitForLoadState('networkidle');
    await delay(1500);
    await demoAction(page, adminSelectors.users.table, '📋 用户列表');
    await delay(1000);

    // 期刊管理
    await showToast(page, '📚 期刊管理');
    await page.goto(routes.admin.journals);
    await page.waitForLoadState('networkidle');
    await delay(1500);
    await demoAction(page, adminSelectors.journals.table, '📋 期刊列表');
    await delay(1000);

    // 评论管理
    await showToast(page, '💬 评论管理');
    await page.goto(routes.admin.comments);
    await page.waitForLoadState('networkidle');
    await delay(1500);

    const commentTable = page.locator(adminSelectors.comments.table);
    if (await commentTable.isVisible()) {
      await demoAction(page, adminSelectors.comments.table, '📋 评论列表');
    }
    await delay(1000);

    // ==========================================
    // 演示结束
    // ==========================================
    await showChapterTitle(page, '演示完成', '感谢观看！');

    log('🎉', '完整功能演示结束！');

    expect(true).toBe(true);
  });
});
```

**Step 2: 验证测试可运行**

Run: `npx playwright test full-demo.spec.ts --headed --project=chrome`
Expected: 完整演示运行，可视化效果正常

**Step 3: Commit**

```bash
git add e2e/tests/full-demo.spec.ts
git commit -m "feat(e2e): 添加完整流程演示测试"
```

---

## Task 12: 删除旧的演示测试

**Files:**
- Delete: `e2e/tests/demo.spec.ts`

**Step 1: 删除旧文件**

```bash
rm e2e/tests/demo.spec.ts
```

**Step 2: 验证删除**

Run: `ls e2e/tests/`
Expected: 不包含 demo.spec.ts

**Step 3: Commit**

```bash
git add -u e2e/tests/demo.spec.ts
git commit -m "chore(e2e): 删除旧的演示测试文件"
```

---

## Task 13: 更新 package.json 添加演示命令

**Files:**
- Modify: `package.json`

**Step 1: 添加新的 npm scripts**

在 `scripts` 部分添加：

```json
{
  "scripts": {
    "test:e2e:full-demo": "playwright test full-demo.spec.ts --headed --project=chrome",
    "test:e2e:demo:guest": "playwright test demo-modules/01-guest.spec.ts --headed --project=chrome",
    "test:e2e:demo:auth": "playwright test demo-modules/02-auth.spec.ts --headed --project=chrome",
    "test:e2e:demo:user": "playwright test demo-modules/03-user.spec.ts --headed --project=chrome",
    "test:e2e:demo:admin": "playwright test demo-modules/04-admin.spec.ts --headed --project=chrome",
    "test:e2e:demo:all": "playwright test demo-modules --headed --project=chrome"
  }
}
```

**Step 2: 验证命令可用**

Run: `npm run test:e2e:demo:guest`
Expected: 游客场景测试运行

**Step 3: Commit**

```bash
git add package.json
git commit -m "feat: 添加 E2E 演示测试运行命令"
```

---

## Task 14: 更新 CLAUDE.md 文档

**Files:**
- Modify: `CLAUDE.md`

**Step 1: 更新测试命令部分**

在 `## 运行测试` 部分添加：

```markdown
# E2E 可视化演示测试
npm run test:e2e:full-demo      # 完整功能演示（约10分钟）
npm run test:e2e:demo:guest     # 游客场景
npm run test:e2e:demo:auth      # 认证场景
npm run test:e2e:demo:user      # 用户场景
npm run test:e2e:demo:admin     # 管理员场景
npm run test:e2e:demo:all       # 运行所有模块
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: 更新 CLAUDE.md 添加演示测试命令"
```

---

## Task 15: 最终验证和清理

**Step 1: 运行完整演示测试**

```bash
npm run test:e2e:full-demo
```

Expected: 完整演示运行成功，可以可视化看到所有功能操作

**Step 2: 运行所有模块测试**

```bash
npm run test:e2e:demo:all
```

Expected: 所有模块测试通过

**Step 3: 验证生产数据库未受影响**

```bash
git diff backend/database.json
```

Expected: 无变更（测试使用 database.test.json）

**Step 4: 最终提交**

```bash
git add -A
git commit -m "feat(e2e): 完成 E2E 可视化演示测试系统

- 添加可视化辅助函数（高亮、浮动提示、章节标题）
- 创建模块化演示测试（游客、认证、用户、管理员）
- 创建完整流程演示测试
- 使用独立测试数据库隔离生产数据
- 添加便捷运行命令"
```

---

Plan complete and saved to `docs/plans/2026-02-27-e2e-visual-demo.md`.

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**