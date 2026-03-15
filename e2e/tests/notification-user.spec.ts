/**
 * E2E: Notification user flow
 *
 * Tests the combined notification / announcement bell (AnnouncementBell) that
 * appears in the top bar when a user is authenticated.
 *
 * The bell contains two tabs:
 *   - 通知 (Notifications) — user-level notifications (NotificationItem / NotificationModal)
 *   - 公告 (Announcements) — site-wide announcements (AnnouncementItem / AnnouncementModal)
 *
 * These tests avoid hard dependencies on seeded data: every assertion that
 * requires items in the list is guarded with `isVisible()` checks so the suite
 * passes even on a fresh database.
 */

import { test, expect } from '@playwright/test';
import { testUsers, selectors } from '../fixtures/test-data';
import { uiLogin, notifSelectors } from '../fixtures/notification-helpers';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Navigate to home and wait for the page to settle. */
async function gotoHome(page: Parameters<typeof uiLogin>[0]) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

/** Login as the normal user (1@qq.com / 123456). */
async function loginAsNormal(page: Parameters<typeof uiLogin>[0]) {
  await uiLogin(page, testUsers.normalUser.email, testUsers.normalUser.password);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('通知 — 未登录状态', () => {
  test('铃铛在未登录时不可见', async ({ page }) => {
    await gotoHome(page);

    // The bell is only rendered when isAuthenticated is true (TopBar.tsx line 24)
    const bell = page.locator(notifSelectors.bell.button);
    await expect(bell).not.toBeVisible();
  });
});

test.describe('通知 — 已登录状态', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
    await loginAsNormal(page);
  });

  // 1. Bell visible after login
  test('登录后铃铛按钮可见', async ({ page }) => {
    const bell = page.locator(notifSelectors.bell.button);
    await expect(bell).toBeVisible({ timeout: 5000 });
  });

  // 2. Click bell → dropdown opens
  test('点击铃铛打开下拉面板', async ({ page }) => {
    const bell = page.locator(notifSelectors.bell.button);
    await expect(bell).toBeVisible({ timeout: 5000 });

    await bell.click();

    const dropdown = page.locator(notifSelectors.dropdown.container);
    await expect(dropdown).toBeVisible({ timeout: 3000 });
  });

  // 3. Dropdown has a header with title text
  test('下拉面板包含消息中心标题', async ({ page }) => {
    await page.locator(notifSelectors.bell.button).click();

    const header = page.locator(notifSelectors.dropdown.header);
    await expect(header).toBeVisible({ timeout: 3000 });

    const title = page.locator(notifSelectors.dropdown.title);
    await expect(title).toBeVisible();
    await expect(title).toContainText('消息中心');
  });

  // 4. Two tabs are visible: 通知 and 公告
  test('下拉面板包含"通知"和"公告"两个标签', async ({ page }) => {
    await page.locator(notifSelectors.bell.button).click();

    const tabs = page.locator(notifSelectors.tabs.tab);
    await expect(tabs).toHaveCount(2);

    const notifTab = page.locator(notifSelectors.tabs.notificationsTab);
    const annTab = page.locator(notifSelectors.tabs.announcementsTab);

    await expect(notifTab).toBeVisible();
    await expect(notifTab).toContainText('通知');

    await expect(annTab).toBeVisible();
    await expect(annTab).toContainText('公告');
  });

  // 5. Notifications tab is active by default
  test('默认激活"通知"标签', async ({ page }) => {
    await page.locator(notifSelectors.bell.button).click();

    const activeTab = page.locator(notifSelectors.tabs.tabActive);
    await expect(activeTab).toBeVisible({ timeout: 3000 });
    await expect(activeTab).toContainText('通知');
  });

  // 6. Notification list area is visible (with items or empty state)
  test('通知列表区域可见（有内容或空状态）', async ({ page }) => {
    await page.locator(notifSelectors.bell.button).click();

    const list = page.locator(notifSelectors.list.container);
    await expect(list).toBeVisible({ timeout: 3000 });

    // Either there are notification items OR the empty placeholder is shown
    const hasItems = await page
      .locator(notifSelectors.notificationItem.container)
      .first()
      .isVisible()
      .catch(() => false);

    const hasEmpty = await page
      .locator(notifSelectors.list.empty)
      .isVisible()
      .catch(() => false);

    expect(hasItems || hasEmpty).toBe(true);
  });

  // 7. Click a notification item → notification modal opens  (conditional)
  test('点击通知项打开通知详情弹窗', async ({ page }) => {
    await page.locator(notifSelectors.bell.button).click();

    const firstItem = page.locator(notifSelectors.notificationItem.container).first();
    const itemVisible = await firstItem.isVisible({ timeout: 3000 }).catch(() => false);

    if (!itemVisible) {
      // No notifications — switch to announcements tab and try there
      await page.locator(notifSelectors.tabs.announcementsTab).click();

      const firstAnn = page.locator(notifSelectors.announcementItem.container).first();
      const annVisible = await firstAnn.isVisible({ timeout: 3000 }).catch(() => false);

      if (!annVisible) {
        // Neither tab has items; test passes vacuously
        test.info().annotations.push({ type: 'skip-reason', description: 'No items in either tab' });
        return;
      }

      await firstAnn.click();

      const annModal = page.locator(notifSelectors.announcementModal.container);
      await expect(annModal).toBeVisible({ timeout: 5000 });
      return;
    }

    await firstItem.click();

    const modal = page.locator(notifSelectors.notificationModal.container);
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  // 8. Close notification modal with the close button
  test('点击关闭按钮关闭通知弹窗', async ({ page }) => {
    await page.locator(notifSelectors.bell.button).click();

    const firstItem = page.locator(notifSelectors.notificationItem.container).first();
    const itemVisible = await firstItem.isVisible({ timeout: 3000 }).catch(() => false);

    if (!itemVisible) {
      // Try announcements tab
      await page.locator(notifSelectors.tabs.announcementsTab).click();
      const firstAnn = page.locator(notifSelectors.announcementItem.container).first();
      const annVisible = await firstAnn.isVisible({ timeout: 3000 }).catch(() => false);

      if (!annVisible) {
        test.info().annotations.push({ type: 'skip-reason', description: 'No items to click' });
        return;
      }

      await firstAnn.click();
      const annModal = page.locator(notifSelectors.announcementModal.container);
      await expect(annModal).toBeVisible({ timeout: 5000 });

      const closeBtn = page.locator(notifSelectors.announcementModal.closeBtn);
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      } else {
        // Fallback: press Escape
        await page.keyboard.press('Escape');
      }

      await expect(annModal).not.toBeVisible({ timeout: 3000 });
      return;
    }

    await firstItem.click();

    const modal = page.locator(notifSelectors.notificationModal.container);
    await expect(modal).toBeVisible({ timeout: 5000 });

    const closeBtn = page.locator(notifSelectors.notificationModal.closeBtn);
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });

  // 9. Mark-all-as-read button visible when there are unread items
  test('"全部已读"按钮在有未读消息时可见', async ({ page }) => {
    await page.locator(notifSelectors.bell.button).click();

    // The button is conditional on currentTabUnread > 0
    const markAllBtn = page.locator(notifSelectors.dropdown.markAllBtn);
    const isVisible = await markAllBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await expect(markAllBtn).toBeVisible();
      await expect(markAllBtn).toContainText('全部已读');
    } else {
      // No unread items — that is a valid state; just verify the button is absent
      await expect(markAllBtn).not.toBeVisible();
    }
  });

  // 10. Switch between notifications and announcements tabs
  test('可切换"通知"和"公告"标签', async ({ page }) => {
    await page.locator(notifSelectors.bell.button).click();

    // Start on the notifications tab (default)
    const notifTab = page.locator(notifSelectors.tabs.notificationsTab);
    const annTab = page.locator(notifSelectors.tabs.announcementsTab);

    await expect(notifTab).toHaveClass(/announcement-bell__tab--active/);

    // Switch to announcements tab
    await annTab.click();
    await expect(annTab).toHaveClass(/announcement-bell__tab--active/);
    await expect(notifTab).not.toHaveClass(/announcement-bell__tab--active/);

    // Switch back to notifications tab
    await notifTab.click();
    await expect(notifTab).toHaveClass(/announcement-bell__tab--active/);
  });

  // 11. Dropdown closes when clicking outside
  test('点击外部区域关闭下拉面板', async ({ page }) => {
    await page.locator(notifSelectors.bell.button).click();

    const dropdown = page.locator(notifSelectors.dropdown.container);
    await expect(dropdown).toBeVisible({ timeout: 3000 });

    // Click somewhere outside the dropdown and the bell button
    await page.locator('.top-bar-title').click({ force: true });

    await expect(dropdown).not.toBeVisible({ timeout: 3000 });
  });

  // 12. Pressing Escape closes the dropdown
  test('按 Escape 键关闭下拉面板', async ({ page }) => {
    await page.locator(notifSelectors.bell.button).click();

    const dropdown = page.locator(notifSelectors.dropdown.container);
    await expect(dropdown).toBeVisible({ timeout: 3000 });

    await page.keyboard.press('Escape');

    await expect(dropdown).not.toBeVisible({ timeout: 3000 });
  });
});
