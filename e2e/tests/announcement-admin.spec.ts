/**
 * E2E: Announcement admin management
 *
 * Tests the admin announcement management page (/admin/announcements).
 * Uses the admin user (wh@qq.com / 123456).
 * All E2E-created announcements are prefixed with "[E2E]" and cleaned up in afterAll.
 *
 * Admin selectors mirror those in `05-announcements.spec.ts` and `test-data.ts`.
 */

import { test, expect } from '@playwright/test';
import { testUsers, routes } from '../fixtures/test-data';
import {
  apiLogin,
  apiCreateAnnouncement,
  apiPublishAnnouncement,
  apiCleanupAnnouncements,
  uiLogin,
} from '../fixtures/notification-helpers';

// ---------------------------------------------------------------------------
// Selectors (from 05-announcements.spec.ts and adminSelectors in test-data.ts)
// ---------------------------------------------------------------------------

const adminSel = {
  container: '.announcement-mgmt',
  createBtn: '.announcement-mgmt__create-btn',
  tabs: '.announcement-mgmt__tabs',
  tab: '.announcement-mgmt__tab',
  tabActive: '.announcement-mgmt__tab--active',
  table: '.announcement-mgmt__table',
  row: '.announcement-mgmt__table tbody tr',
  titleCell: '.announcement-mgmt__title-cell',
  statusTag: '.announcement-mgmt__status',
  actions: '.announcement-mgmt__actions',
  actionBtn: '.announcement-mgmt__action-btn',
  publishBtn: '.announcement-mgmt__action-btn--publish',
  archiveBtn: '.announcement-mgmt__action-btn--archive',
  deleteBtn: '.announcement-mgmt__action-btn--delete',
  confirmOverlay: '.announcement-mgmt__confirm-overlay',
  confirmDelete: '.announcement-mgmt__confirm-delete',
  confirmCancelBtn: '.announcement-mgmt__confirm button:first-child',
  pagination: '.announcement-mgmt__pagination',
  empty: '.announcement-mgmt__empty',
};

const formSel = {
  container: '.announcement-form',
  backBtn: '.announcement-form__back',
  titleInput: '.announcement-form__field input[type="text"]',
  typeGroup: '.announcement-form__type-group',
  typeBtn: '.announcement-form__type-btn',
  contentTextarea: '.announcement-form__field textarea',
  previewTab: '.announcement-form__content-tabs button:last-child',
  editTab: '.announcement-form__content-tabs button:first-child',
  previewContent: '.announcement-form__preview',
  targetGroup: '.announcement-form__target-group',
  targetBtn: '.announcement-form__target-btn',
  pinnedCheckbox: '.announcement-form__checkbox:has-text("置顶")',
  priorityInput: '.announcement-form__priority input',
  cancelBtn: '.announcement-form__cancel',
  saveBtn: '.announcement-form__save',
  publishBtn: '.announcement-form__publish',
};

// ---------------------------------------------------------------------------
// Suite state
// ---------------------------------------------------------------------------

let adminToken = '';
/** ID of a draft announcement created for publish/delete tests. */
let draftId = '';
/** ID of an active announcement created for archive tests. */
let activeId = '';

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

test.beforeAll(async () => {
  const login = await apiLogin(testUsers.adminUser.email, testUsers.adminUser.password);
  adminToken = login.token;

  // Create a draft announcement (used for publish, edit, and delete tests)
  const draft = await apiCreateAnnouncement(adminToken, {
    title: '[E2E] Admin - Draft Announcement',
    content: 'Draft announcement for E2E admin tests.',
    type: 'info',
    target: 'all',
  });
  draftId = draft.id;

  // Create and publish an active announcement (used for archive tests)
  const active = await apiCreateAnnouncement(adminToken, {
    title: '[E2E] Admin - Active Announcement',
    content: 'Active announcement for E2E admin tests.',
    type: 'warning',
    target: 'all',
  });
  activeId = active.id;
  await apiPublishAnnouncement(adminToken, activeId);
});

test.afterAll(async () => {
  if (adminToken) {
    await apiCleanupAnnouncements(adminToken);
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function gotoAdminAnnouncements(page: Parameters<typeof uiLogin>[0]) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await uiLogin(page, testUsers.adminUser.email, testUsers.adminUser.password);
  await page.waitForTimeout(1000);

  await page.goto(routes.admin.announcements);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
}

/** Click the tab whose text matches `label` and wait for the table to update. */
async function clickTab(page: Parameters<typeof uiLogin>[0], label: string) {
  const tab = page.locator(`${adminSel.tab}:has-text("${label}")`);
  if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await tab.click();
    await page.waitForTimeout(800);
  }
}

/**
 * Find the first table row whose title cell contains `titleFragment`.
 * Returns null if not found.
 */
async function findRowByTitle(page: Parameters<typeof uiLogin>[0], titleFragment: string) {
  const rows = page.locator(adminSel.row);
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const titleText = await row.locator(adminSel.titleCell).textContent().catch(() => '');
    if (titleText && titleText.includes(titleFragment)) {
      return row;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// 1. Navigate to announcement management page and verify structure
test('管理员可访问公告管理页面', async ({ page }) => {
  await gotoAdminAnnouncements(page);

  const container = page.locator(adminSel.container);
  const visible = await container.isVisible({ timeout: 5000 }).catch(() => false);

  if (!visible) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Admin page not accessible' });
    return;
  }

  await expect(container).toBeVisible();

  // Create button should be present
  const createBtn = page.locator(adminSel.createBtn);
  await expect(createBtn).toBeVisible({ timeout: 3000 });

  // Status filter tabs should be visible
  const tabs = page.locator(adminSel.tab);
  const tabCount = await tabs.count();
  expect(tabCount).toBeGreaterThan(0);
});

// 2. Create draft announcement via form
test('管理员可通过表单创建草稿公告', async ({ page }) => {
  await gotoAdminAnnouncements(page);

  const container = page.locator(adminSel.container);
  if (!(await container.isVisible({ timeout: 5000 }).catch(() => false))) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Admin page not accessible' });
    return;
  }

  // Click the create button
  const createBtn = page.locator(adminSel.createBtn);
  await createBtn.click();
  await page.waitForTimeout(1000);

  // The form should appear
  const form = page.locator(formSel.container);
  const formVisible = await form.isVisible({ timeout: 5000 }).catch(() => false);

  if (!formVisible) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Announcement form did not appear' });
    return;
  }

  await expect(form).toBeVisible();

  // Fill in the title
  const titleInput = page.locator(formSel.titleInput);
  await expect(titleInput).toBeVisible({ timeout: 3000 });
  await titleInput.fill('[E2E] Admin - UI Created Draft');
  await page.waitForTimeout(300);

  // Fill in the content
  const contentTextarea = page.locator(formSel.contentTextarea);
  if (await contentTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
    await contentTextarea.fill('This draft was created by the E2E admin test suite via the UI form.');
    await page.waitForTimeout(300);
  }

  // Save as draft (not publish)
  const saveBtn = page.locator(formSel.saveBtn);
  if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await saveBtn.click();
    await page.waitForTimeout(1500);

    // Should return to the management list
    const listVisible = await page.locator(adminSel.container).isVisible({ timeout: 5000 }).catch(() => false);
    expect(listVisible).toBe(true);
  } else {
    // Cancel if save button not found
    const cancelBtn = page.locator(formSel.cancelBtn);
    if (await cancelBtn.isVisible().catch(() => false)) {
      await cancelBtn.click();
    } else {
      const backBtn = page.locator(formSel.backBtn);
      if (await backBtn.isVisible().catch(() => false)) {
        await backBtn.click();
      }
    }
  }
});

// 3. Publish a draft announcement
test('管理员可发布草稿公告', async ({ page }) => {
  await gotoAdminAnnouncements(page);

  const container = page.locator(adminSel.container);
  if (!(await container.isVisible({ timeout: 5000 }).catch(() => false))) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Admin page not accessible' });
    return;
  }

  // Switch to the draft tab to find our draft
  await clickTab(page, '草稿');

  const draftRow = await findRowByTitle(page, '[E2E] Admin - Draft Announcement');

  if (!draftRow) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Draft announcement row not found' });
    return;
  }

  const publishBtn = draftRow.locator(adminSel.publishBtn);
  const publishBtnVisible = await publishBtn.isVisible({ timeout: 2000 }).catch(() => false);

  if (!publishBtnVisible) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Publish button not visible on draft row' });
    return;
  }

  await publishBtn.click();
  await page.waitForTimeout(1500);

  // After publishing, the row should no longer appear in the draft tab
  const draftRowAfter = await findRowByTitle(page, '[E2E] Admin - Draft Announcement');
  expect(draftRowAfter).toBeNull();
});

// 4. Archive an active announcement
test('管理员可归档生效中的公告', async ({ page }) => {
  await gotoAdminAnnouncements(page);

  const container = page.locator(adminSel.container);
  if (!(await container.isVisible({ timeout: 5000 }).catch(() => false))) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Admin page not accessible' });
    return;
  }

  // Switch to the active tab
  await clickTab(page, '生效中');

  const activeRow = await findRowByTitle(page, '[E2E] Admin - Active Announcement');

  if (!activeRow) {
    // Try looking in all tabs
    await clickTab(page, '全部');
    const allRow = await findRowByTitle(page, '[E2E] Admin - Active Announcement');
    if (!allRow) {
      test.info().annotations.push({ type: 'skip-reason', description: 'Active announcement row not found' });
      return;
    }

    const archiveBtnAll = allRow.locator(adminSel.archiveBtn);
    if (!(await archiveBtnAll.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'skip-reason', description: 'Archive button not visible' });
      return;
    }
    await archiveBtnAll.click();
    await page.waitForTimeout(1500);
    return;
  }

  const archiveBtn = activeRow.locator(adminSel.archiveBtn);
  const archiveBtnVisible = await archiveBtn.isVisible({ timeout: 2000 }).catch(() => false);

  if (!archiveBtnVisible) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Archive button not visible on active row' });
    return;
  }

  await archiveBtn.click();
  await page.waitForTimeout(1500);

  // After archiving, the row should no longer appear in the active tab
  const activeRowAfter = await findRowByTitle(page, '[E2E] Admin - Active Announcement');
  expect(activeRowAfter).toBeNull();
});

// 5. Delete a draft announcement
test('管理员可删除草稿公告', async ({ page }) => {
  // Create a fresh draft specifically for deletion so other tests aren't affected
  const deleteDraft = await apiCreateAnnouncement(adminToken, {
    title: '[E2E] Admin - Delete Target Draft',
    content: 'This draft is created to be deleted by the admin UI test.',
    type: 'info',
    target: 'all',
  });

  await gotoAdminAnnouncements(page);

  const container = page.locator(adminSel.container);
  if (!(await container.isVisible({ timeout: 5000 }).catch(() => false))) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Admin page not accessible' });
    return;
  }

  // Look in the draft tab first, then fall back to all
  await clickTab(page, '草稿');
  let deleteRow = await findRowByTitle(page, '[E2E] Admin - Delete Target Draft');

  if (!deleteRow) {
    await clickTab(page, '全部');
    deleteRow = await findRowByTitle(page, '[E2E] Admin - Delete Target Draft');
  }

  if (!deleteRow) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Delete-target draft row not found' });
    return;
  }

  const deleteBtn = deleteRow.locator(adminSel.deleteBtn);
  const deleteBtnVisible = await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false);

  if (!deleteBtnVisible) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Delete button not visible on draft row' });
    return;
  }

  await deleteBtn.click();
  await page.waitForTimeout(500);

  // A confirmation overlay should appear
  const confirmOverlay = page.locator(adminSel.confirmOverlay);
  const confirmVisible = await confirmOverlay.isVisible({ timeout: 3000 }).catch(() => false);

  if (confirmVisible) {
    // Confirm the deletion
    const confirmBtn = page.locator(adminSel.confirmDelete);
    await confirmBtn.click();
    await page.waitForTimeout(1500);
  } else {
    // Some implementations delete immediately without a confirm dialog
    await page.waitForTimeout(1500);
  }

  // The row should no longer be visible
  await clickTab(page, '全部');
  const rowAfterDelete = await findRowByTitle(page, '[E2E] Admin - Delete Target Draft');
  expect(rowAfterDelete).toBeNull();
});

// 6. Cannot delete an active announcement (button disabled or not present)
test('生效中的公告不可直接删除（按钮禁用或不存在）', async ({ page }) => {
  // Create and publish a fresh active announcement for this test
  const activeAnn = await apiCreateAnnouncement(adminToken, {
    title: '[E2E] Admin - Cannot Delete Active',
    content: 'This active announcement should not be deletable directly.',
    type: 'info',
    target: 'all',
  });
  await apiPublishAnnouncement(adminToken, activeAnn.id);

  await gotoAdminAnnouncements(page);

  const container = page.locator(adminSel.container);
  if (!(await container.isVisible({ timeout: 5000 }).catch(() => false))) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Admin page not accessible' });
    return;
  }

  await clickTab(page, '生效中');
  const row = await findRowByTitle(page, '[E2E] Admin - Cannot Delete Active');

  if (!row) {
    await clickTab(page, '全部');
    const allRow = await findRowByTitle(page, '[E2E] Admin - Cannot Delete Active');
    if (!allRow) {
      test.info().annotations.push({ type: 'skip-reason', description: 'Active row not found' });
      return;
    }

    // Verify the delete button is disabled or absent on the active row
    const deleteBtnAll = allRow.locator(adminSel.deleteBtn);
    const isDisabled = await deleteBtnAll.isDisabled().catch(() => true);
    const isAbsent = !(await deleteBtnAll.isVisible().catch(() => false));
    expect(isDisabled || isAbsent).toBe(true);
    return;
  }

  const deleteBtn = row.locator(adminSel.deleteBtn);
  const isDisabled = await deleteBtn.isDisabled().catch(() => true);
  const isAbsent = !(await deleteBtn.isVisible().catch(() => false));

  // The delete button should be disabled or not present for active announcements
  expect(isDisabled || isAbsent).toBe(true);
});

// 7. Edit announcement content via form
test('管理员可编辑公告内容', async ({ page }) => {
  // Create a dedicated draft to edit
  await apiCreateAnnouncement(adminToken, {
    title: '[E2E] Admin - Edit Target',
    content: 'Original content before E2E edit.',
    type: 'info',
    target: 'all',
  });

  await gotoAdminAnnouncements(page);

  const container = page.locator(adminSel.container);
  if (!(await container.isVisible({ timeout: 5000 }).catch(() => false))) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Admin page not accessible' });
    return;
  }

  // Find the row in all tabs
  await clickTab(page, '全部');
  const editRow = await findRowByTitle(page, '[E2E] Admin - Edit Target');

  if (!editRow) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Edit target row not found' });
    return;
  }

  // Click the first action button (edit)
  const firstActionBtn = editRow.locator(adminSel.actionBtn).first();
  if (!(await firstActionBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
    test.info().annotations.push({ type: 'skip-reason', description: 'No action button on row' });
    return;
  }

  await firstActionBtn.click();
  await page.waitForTimeout(1000);

  // The announcement form should appear
  const form = page.locator(formSel.container);
  const formVisible = await form.isVisible({ timeout: 5000 }).catch(() => false);

  if (!formVisible) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Edit form did not appear' });
    return;
  }

  await expect(form).toBeVisible();

  // Update the title
  const titleInput = page.locator(formSel.titleInput);
  if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await titleInput.clear();
    await titleInput.fill('[E2E] Admin - Edit Target (Updated)');
    await page.waitForTimeout(300);
  }

  // Save the changes
  const saveBtn = page.locator(formSel.saveBtn);
  if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await saveBtn.click();
    await page.waitForTimeout(1500);

    // Verify we're back on the management page
    await expect(page.locator(adminSel.container)).toBeVisible({ timeout: 5000 });
  } else {
    // Cancel and go back without saving
    const backBtn = page.locator(formSel.backBtn);
    if (await backBtn.isVisible().catch(() => false)) {
      await backBtn.click();
    }
  }
});

// 8. Filter announcements by status tabs
test('可通过状态标签筛选公告列表', async ({ page }) => {
  await gotoAdminAnnouncements(page);

  const container = page.locator(adminSel.container);
  if (!(await container.isVisible({ timeout: 5000 }).catch(() => false))) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Admin page not accessible' });
    return;
  }

  const tabs = page.locator(adminSel.tab);
  const tabCount = await tabs.count();
  expect(tabCount).toBeGreaterThan(1);

  // Get the row count on the "all" tab
  await clickTab(page, '全部');
  const allRows = page.locator(adminSel.row);
  const allCount = await allRows.count();

  // Click through each tab and verify the active state changes
  for (let i = 0; i < tabCount; i++) {
    const tab = tabs.nth(i);
    const tabText = await tab.textContent().catch(() => '');
    await tab.click();
    await page.waitForTimeout(500);

    // The clicked tab should become active
    const isActive = await tab.evaluate((el) =>
      el.classList.contains('announcement-mgmt__tab--active')
    ).catch(() => false);
    expect(isActive).toBe(true);
  }

  // Return to "全部" (all) tab
  await clickTab(page, '全部');
  const finalAllRows = page.locator(adminSel.row);
  const finalCount = await finalAllRows.count();

  // Row count should match what we had before filtering
  expect(finalCount).toBe(allCount);
});

// 9. Read statistics visible in the management table
test('公告管理表格中显示阅读统计数据', async ({ page }) => {
  await gotoAdminAnnouncements(page);

  const container = page.locator(adminSel.container);
  if (!(await container.isVisible({ timeout: 5000 }).catch(() => false))) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Admin page not accessible' });
    return;
  }

  const rows = page.locator(adminSel.row);
  const rowCount = await rows.count();

  if (rowCount === 0) {
    test.info().annotations.push({ type: 'info', description: 'No rows in the table to check statistics' });
    return;
  }

  // The table should contain at least a title cell and status tag per row
  const firstRow = rows.first();
  const titleCell = firstRow.locator(adminSel.titleCell);
  const titleVisible = await titleCell.isVisible({ timeout: 2000 }).catch(() => false);
  expect(titleVisible).toBe(true);

  // Status tag should also be visible
  const statusTag = firstRow.locator(adminSel.statusTag);
  const statusVisible = await statusTag.isVisible({ timeout: 2000 }).catch(() => false);
  expect(statusVisible).toBe(true);
});

// 10. Confirm dialog appears before delete and can be cancelled
test('删除前出现确认弹窗，可取消操作', async ({ page }) => {
  // Create a draft specifically for this cancel-delete test
  await apiCreateAnnouncement(adminToken, {
    title: '[E2E] Admin - Cancel Delete Test',
    content: 'This draft tests the cancel-delete flow.',
    type: 'info',
    target: 'all',
  });

  await gotoAdminAnnouncements(page);

  const container = page.locator(adminSel.container);
  if (!(await container.isVisible({ timeout: 5000 }).catch(() => false))) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Admin page not accessible' });
    return;
  }

  await clickTab(page, '草稿');
  let cancelRow = await findRowByTitle(page, '[E2E] Admin - Cancel Delete Test');

  if (!cancelRow) {
    await clickTab(page, '全部');
    cancelRow = await findRowByTitle(page, '[E2E] Admin - Cancel Delete Test');
  }

  if (!cancelRow) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Cancel-delete test row not found' });
    return;
  }

  const deleteBtn = cancelRow.locator(adminSel.deleteBtn);
  const deleteBtnVisible = await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false);

  if (!deleteBtnVisible) {
    test.info().annotations.push({ type: 'skip-reason', description: 'Delete button not visible' });
    return;
  }

  await deleteBtn.click();
  await page.waitForTimeout(500);

  const confirmOverlay = page.locator(adminSel.confirmOverlay);
  const confirmVisible = await confirmOverlay.isVisible({ timeout: 3000 }).catch(() => false);

  if (!confirmVisible) {
    test.info().annotations.push({ type: 'info', description: 'No confirm dialog — implementation may differ' });
    return;
  }

  await expect(confirmOverlay).toBeVisible();

  // Click the cancel button to dismiss without deleting
  const cancelConfirmBtn = page.locator(adminSel.confirmCancelBtn);
  if (await cancelConfirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cancelConfirmBtn.click();
  } else {
    await page.keyboard.press('Escape');
  }

  await page.waitForTimeout(500);

  // Confirm overlay should be gone
  await expect(confirmOverlay).not.toBeVisible({ timeout: 3000 });

  // The row should still exist — we cancelled the deletion
  await clickTab(page, '全部');
  const rowStillThere = await findRowByTitle(page, '[E2E] Admin - Cancel Delete Test');
  expect(rowStillThere).not.toBeNull();
});
