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
