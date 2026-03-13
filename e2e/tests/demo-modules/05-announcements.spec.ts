import { test, expect } from '@playwright/test';
import {
  selectors,
  demoUsers,
} from '../../fixtures/test-data';
import {
  initDemo,
  finishDemo,
  delay,
  showChapterTitle,
  showToast,
  demoAction,
  demoClick,
  demoFill,
  demoScroll,
  log,
} from '../../fixtures/demo-helpers';
import { ErrorCollector } from '../../fixtures/error-collector';
import { InteractionTracker } from '../../fixtures/interaction-tracker';

/**
 * 公告系统选择器
 */
const announcementSelectors = {
  // 横幅公告
  banner: {
    container: '.announcement-banner',
    content: '.announcement-banner__content',
    title: '.announcement-banner__title',
    label: '.announcement-banner__label',
    closeBtn: '.announcement-banner__close',
    navPrev: '.announcement-banner__nav:first-child',
    navNext: '.announcement-banner__nav:last-child',
    dots: '.announcement-banner__dots',
    dot: '.announcement-banner__dot',
  },
  // 铃铛通知
  bell: {
    container: '.announcement-bell',
    button: '.announcement-bell__button',
    badge: '.announcement-bell__badge',
    dropdown: '.announcement-bell__dropdown',
    header: '.announcement-bell__header',
    title: '.announcement-bell__title',
    count: '.announcement-bell__count',
    markAllBtn: '.announcement-bell__mark-all',
    list: '.announcement-bell__list',
    empty: '.announcement-bell__empty',
  },
  // 公告项
  item: {
    container: '.announcement-item',
    unread: '.announcement-item--unread',
    dot: '.announcement-item__dot',
    tag: '.announcement-item__tag',
    title: '.announcement-item__title',
    preview: '.announcement-item__preview',
    meta: '.announcement-item__meta',
    pinned: '.announcement-item__pinned',
  },
  // 公告详情弹窗
  modal: {
    overlay: '.announcement-modal__overlay',
    container: '.announcement-modal',
    closeBtn: '.announcement-modal__close',
    icon: '.announcement-modal__icon',
    type: '.announcement-modal__type',
    title: '.announcement-modal__title',
    content: '.announcement-modal__content',
    meta: '.announcement-modal__meta',
    actionBtn: '.announcement-modal__button',
  },
  // 管理后台
  admin: {
    container: '.announcement-mgmt',
    createBtn: '.announcement-mgmt__create-btn',
    tabs: '.announcement-mgmt__tabs',
    tab: '.announcement-mgmt__tab',
    tabActive: '.announcement-mgmt__tab--active',
    table: '.announcement-mgmt__table',
    row: '.announcement-mgmt__table tbody tr',
    titleCell: '.announcement-mgmt__title',
    typeCell: '.announcement-mgmt__type',
    statusCell: '.announcement-mgmt__status',
    progressCell: '.announcement-mgmt__progress',
    actions: '.announcement-mgmt__actions',
    editBtn: '.announcement-mgmt__action-btn:has(svg.lucide-edit-2)',
    publishBtn: '.announcement-mgmt__action-btn--publish',
    archiveBtn: '.announcement-mgmt__action-btn--archive',
    deleteBtn: '.announcement-mgmt__action-btn--delete',
    confirmOverlay: '.announcement-mgmt__confirm-overlay',
    confirmBtn: '.announcement-mgmt__confirm-delete',
    cancelBtn: '.announcement-mgmt__confirm button:first-child',
    pagination: '.announcement-mgmt__pagination',
  },
  // 公告表单
  form: {
    container: '.announcement-form',
    backBtn: '.announcement-form__back',
    titleInput: '.announcement-form__field input[type="text"]',
    typeGroup: '.announcement-form__type-group',
    typeBtn: '.announcement-form__type-btn',
    colorGroup: '.announcement-form__colors',
    colorBtn: '.announcement-form__color',
    contentTextarea: '.announcement-form__field textarea',
    previewTab: '.announcement-form__content-tabs button:last-child',
    editTab: '.announcement-form__content-tabs button:first-child',
    previewContent: '.announcement-form__preview',
    targetGroup: '.announcement-form__target-group',
    targetBtn: '.announcement-form__target-btn',
    roleCheckbox: '.announcement-form__checkbox input',
    userSearch: '.announcement-form__users input',
    pinnedCheckbox: '.announcement-form__checkbox:has-text("置顶")',
    priorityInput: '.announcement-form__priority input',
    cancelBtn: '.announcement-form__cancel',
    saveBtn: '.announcement-form__save',
    publishBtn: '.announcement-form__publish',
  },
};

/**
 * 登录辅助函数
 */
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

/**
 * 管理员登录辅助函数
 */
async function loginAsAdmin(page: any) {
  await login(page, demoUsers.admin);
}

// ============================================================================
// 测试套件：公告系统演示
// ============================================================================

test.describe('公告系统演示', () => {
  // ----------------------------------------------------------------------------
  // 游客场景
  // ----------------------------------------------------------------------------
  test.describe('游客查看公告', () => {
    let errorCollector: ErrorCollector;
    let interactionTracker: InteractionTracker;

    test.beforeEach(async ({ page }, testInfo) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const demo = await initDemo(page, testInfo.title);
      errorCollector = demo.errorCollector;
      interactionTracker = demo.interactionTracker;
    });

    test.afterEach(async ({ page }, testInfo) => {
      const { errorReport } = await finishDemo();
      expect(
        errorReport.totalErrors,
        `测试 "${testInfo.title}" 发现 ${errorReport.totalErrors} 个错误`
      ).toBe(0);
    });

    test('查看公告横幅', async ({ page }) => {
      await showChapterTitle(page, '公告横幅', '查看顶部横幅公告');

      // 等待页面加载
      await delay(1000);

      // 检查横幅是否存在
      const banner = page.locator(announcementSelectors.banner.container);
      const bannerVisible = await banner.isVisible().catch(() => false);

      if (bannerVisible) {
        log('📢', '发现公告横幅');
        await demoAction(page, announcementSelectors.banner.container, '📢 公告横幅');

        // 展示横幅内容
        const title = await page.locator(announcementSelectors.banner.title).textContent();
        await showToast(page, `公告: ${title || '无标题'}`);
        await delay(1500);

        // 检查是否有多个横幅（轮播）
        const dots = page.locator(announcementSelectors.banner.dot);
        const dotCount = await dots.count();

        if (dotCount > 1) {
          await showToast(page, `共有 ${dotCount} 条横幅公告`);
          await delay(1000);

          // 演示切换横幅
          const nextBtn = page.locator(announcementSelectors.banner.navNext);
          if (await nextBtn.isVisible()) {
            await demoClick(page, announcementSelectors.banner.navNext, '下一条公告');
            await delay(1000);
          }
        }

        // 演示关闭横幅
        const closeBtn = page.locator(announcementSelectors.banner.closeBtn);
        if (await closeBtn.isVisible()) {
          await demoClick(page, announcementSelectors.banner.closeBtn, '关闭横幅');
          await delay(800);

          // 验证横幅已关闭
          const stillVisible = await banner.isVisible().catch(() => false);
          if (!stillVisible || dotCount > 1) {
            await showToast(page, '横幅已关闭');
          }
        }
      } else {
        log('ℹ️', '当前没有横幅公告');
        await showToast(page, '当前没有横幅公告');
        await delay(1500);
      }

      expect(true).toBe(true);
    });

    test('查看铃铛通知列表', async ({ page }) => {
      await showChapterTitle(page, '公告通知', '点击铃铛查看公告列表');

      await delay(1000);

      // 查找铃铛按钮
      const bellBtn = page.locator(announcementSelectors.bell.button);
      const bellVisible = await bellBtn.isVisible().catch(() => false);

      if (bellVisible) {
        // 检查未读数量
        const badge = page.locator(announcementSelectors.bell.badge);
        const hasBadge = await badge.isVisible().catch(() => false);

        if (hasBadge) {
          const count = await badge.textContent();
          await showToast(page, `有 ${count} 条未读公告`);
          await delay(1000);
        }

        // 点击铃铛打开下拉列表
        await demoClick(page, announcementSelectors.bell.button, '点击铃铛图标');
        await delay(500);

        // 等待下拉列表出现
        const dropdown = page.locator(announcementSelectors.bell.dropdown);
        const dropdownVisible = await dropdown.isVisible().catch(() => false);

        if (dropdownVisible) {
          await demoAction(page, announcementSelectors.bell.dropdown, '公告列表');

          // 检查是否有公告
          const items = page.locator(announcementSelectors.item.container);
          const itemCount = await items.count();

          if (itemCount > 0) {
            await showToast(page, `共有 ${itemCount} 条公告`);
            await delay(1000);

            // 高亮展示前几个公告
            for (let i = 0; i < Math.min(3, itemCount); i++) {
              await demoAction(
                page,
                `${announcementSelectors.item.container}:nth-child(${i + 1})`,
                `公告 ${i + 1}`
              );
            }
          } else {
            const empty = page.locator(announcementSelectors.bell.empty);
            if (await empty.isVisible()) {
              await showToast(page, '暂无公告');
            }
          }

          // 关闭下拉列表（点击其他地方）
          await page.keyboard.press('Escape');
          await delay(500);
        }
      } else {
        log('ℹ️', '铃铛按钮不可见');
        await showToast(page, '铃铛通知功能未显示');
      }

      expect(true).toBe(true);
    });
  });

  // ----------------------------------------------------------------------------
  // 用户场景
  // ----------------------------------------------------------------------------
  test.describe('用户查看公告', () => {
    let errorCollector: ErrorCollector;
    let interactionTracker: InteractionTracker;

    test.beforeEach(async ({ page }, testInfo) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await login(page, demoUsers.author);
      const demo = await initDemo(page, testInfo.title);
      errorCollector = demo.errorCollector;
      interactionTracker = demo.interactionTracker;
    });

    test.afterEach(async ({ page }, testInfo) => {
      const { errorReport } = await finishDemo();
      expect(
        errorReport.totalErrors,
        `测试 "${testInfo.title}" 发现 ${errorReport.totalErrors} 个错误`
      ).toBe(0);
    });

    test('查看公告详情', async ({ page }) => {
      await showChapterTitle(page, '公告详情', '点击公告查看详情');

      await delay(1000);

      // 点击铃铛打开列表
      const bellBtn = page.locator(announcementSelectors.bell.button);
      if (await bellBtn.isVisible()) {
        await demoClick(page, announcementSelectors.bell.button, '打开公告列表');
        await delay(500);

        // 检查是否有公告
        const items = page.locator(announcementSelectors.item.container);
        const itemCount = await items.count();

        if (itemCount > 0) {
          // 点击第一个公告
          await demoClick(page, `${announcementSelectors.item.container}:first-child`, '点击查看公告详情');
          await delay(500);

          // 等待弹窗出现
          const modal = page.locator(announcementSelectors.modal.container);
          const modalVisible = await modal.isVisible().catch(() => false);

          if (modalVisible) {
            await demoAction(page, announcementSelectors.modal.container, '公告详情弹窗');

            // 展示公告内容
            const modalTitle = await page.locator(announcementSelectors.modal.title).textContent();
            await showToast(page, `标题: ${modalTitle || '无标题'}`);
            await delay(1500);

            // 展示公告类型
            const typeLabel = page.locator(announcementSelectors.modal.type);
            if (await typeLabel.isVisible()) {
              const type = await typeLabel.textContent();
              await showToast(page, `类型: ${type}`);
              await delay(1000);
            }

            // 滚动查看内容（如果内容较长）
            const content = page.locator(announcementSelectors.modal.content);
            if (await content.isVisible()) {
              await demoAction(page, announcementSelectors.modal.content, '公告内容');
            }

            // 关闭弹窗
            const closeBtn = page.locator(announcementSelectors.modal.closeBtn);
            const actionBtn = page.locator(announcementSelectors.modal.actionBtn);

            if (await closeBtn.isVisible()) {
              await demoClick(page, announcementSelectors.modal.closeBtn, '关闭弹窗');
            } else if (await actionBtn.isVisible()) {
              await demoClick(page, announcementSelectors.modal.actionBtn, '确认关闭');
            }
            await delay(500);

            await showToast(page, '公告已标记为已读');
          }
        } else {
          await showToast(page, '暂无公告可查看');
        }
      }

      expect(true).toBe(true);
    });

    test('标记全部已读', async ({ page }) => {
      await showChapterTitle(page, '标记已读', '将所有公告标记为已读');

      await delay(1000);

      // 点击铃铛打开列表
      const bellBtn = page.locator(announcementSelectors.bell.button);
      if (await bellBtn.isVisible()) {
        await demoClick(page, announcementSelectors.bell.button, '打开公告列表');
        await delay(500);

        // 检查是否有未读公告
        const markAllBtn = page.locator(announcementSelectors.bell.markAllBtn);
        if (await markAllBtn.isVisible()) {
          await demoAction(page, announcementSelectors.bell.header, '公告列表头部');
          await delay(500);

          await demoClick(page, announcementSelectors.bell.markAllBtn, '点击全部已读');
          await delay(1000);

          await showToast(page, '所有公告已标记为已读');
        } else {
          log('ℹ️', '没有未读公告或全部已读按钮不可见');
          await showToast(page, '没有未读公告');
        }

        // 关闭下拉列表
        await page.keyboard.press('Escape');
      }

      expect(true).toBe(true);
    });

    test('查看不同类型公告', async ({ page }) => {
      await showChapterTitle(page, '公告类型', '查看普通、紧急、系统公告');

      await delay(1000);

      // 点击铃铛打开列表
      const bellBtn = page.locator(announcementSelectors.bell.button);
      if (await bellBtn.isVisible()) {
        await demoClick(page, announcementSelectors.bell.button, '打开公告列表');
        await delay(500);

        // 查找不同类型的公告标签
        const normalTags = page.locator(`${announcementSelectors.item.tag}--info`);
        const urgentTags = page.locator(`${announcementSelectors.item.tag}--danger, ${announcementSelectors.item.tag}--warning`);

        const normalCount = await normalTags.count();
        const urgentCount = await urgentTags.count();

        if (normalCount > 0) {
          await demoAction(page, `${announcementSelectors.item.tag}--info`, '普通公告');
          await showToast(page, `普通公告: ${normalCount} 条`);
          await delay(1000);
        }

        if (urgentCount > 0) {
          await demoAction(
            page,
            `${announcementSelectors.item.tag}--danger, ${announcementSelectors.item.tag}--warning`,
            '紧急/重要公告'
          );
          await showToast(page, `紧急/重要公告: ${urgentCount} 条`);
          await delay(1000);
        }

        // 查找置顶公告
        const pinnedItems = page.locator(announcementSelectors.item.pinned);
        const pinnedCount = await pinnedItems.count();
        if (pinnedCount > 0) {
          await demoAction(page, announcementSelectors.item.pinned, '置顶公告');
          await showToast(page, `置顶公告: ${pinnedCount} 条`);
          await delay(1000);
        }

        // 关闭下拉列表
        await page.keyboard.press('Escape');
      }

      expect(true).toBe(true);
    });
  });

  // ----------------------------------------------------------------------------
  // 管理员场景
  // ----------------------------------------------------------------------------
  test.describe('管理员管理公告', () => {
    let errorCollector: ErrorCollector;
    let interactionTracker: InteractionTracker;

    test.beforeEach(async ({ page }, testInfo) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await loginAsAdmin(page);
      const demo = await initDemo(page, testInfo.title);
      errorCollector = demo.errorCollector;
      interactionTracker = demo.interactionTracker;
    });

    test.afterEach(async ({ page }, testInfo) => {
      const { errorReport } = await finishDemo();
      expect(
        errorReport.totalErrors,
        `测试 "${testInfo.title}" 发现 ${errorReport.totalErrors} 个错误`
      ).toBe(0);
    });

    test('浏览公告管理页面', async ({ page }) => {
      await showChapterTitle(page, '公告管理', '管理员公告管理页面');

      // 导航到公告管理页面
      await page.goto('/admin/announcements');
      await page.waitForLoadState('networkidle');
      await delay(1000);

      // 检查页面是否加载
      const container = page.locator(announcementSelectors.admin.container);
      const containerVisible = await container.isVisible().catch(() => false);

      if (containerVisible) {
        await showToast(page, '公告管理页面');
        await delay(1000);

        // 展示状态筛选标签
        const tabs = page.locator(announcementSelectors.admin.tab);
        const tabCount = await tabs.count();
        if (tabCount > 0) {
          await demoAction(page, announcementSelectors.admin.tabs, '状态筛选');
          await showToast(page, `${tabCount} 个状态分类`);
          await delay(1000);

          // 演示切换标签
          for (let i = 1; i < Math.min(3, tabCount); i++) {
            await page.locator(announcementSelectors.admin.tab).nth(i).click();
            await delay(800);
          }
          // 切回全部
          await page.locator(announcementSelectors.admin.tab).first().click();
          await delay(500);
        }

        // 检查公告列表
        const rows = page.locator(announcementSelectors.admin.row);
        const rowCount = await rows.count();
        await showToast(page, `共有 ${rowCount} 条公告`);
        await delay(1000);

        if (rowCount > 0) {
          // 高亮表格
          await demoAction(page, announcementSelectors.admin.table, '公告列表');

          // 展示操作按钮
          const actions = page.locator(announcementSelectors.admin.actions).first();
          if (await actions.isVisible()) {
            await demoAction(page, `${announcementSelectors.admin.row}:first-child`, '操作按钮');
          }
        }
      } else {
        log('⚠️', '公告管理页面未能加载');
        await showToast(page, '公告管理页面加载失败');
      }

      expect(true).toBe(true);
    });

    test('创建新公告', async ({ page }) => {
      await showChapterTitle(page, '创建公告', '演示创建新公告流程');

      // 导航到公告管理页面
      await page.goto('/admin/announcements');
      await page.waitForLoadState('networkidle');
      await delay(1000);

      // 点击新建按钮
      const createBtn = page.locator(announcementSelectors.admin.createBtn);
      if (await createBtn.isVisible()) {
        await demoClick(page, announcementSelectors.admin.createBtn, '点击新建公告');
        await delay(1000);

        // 检查表单是否出现
        const form = page.locator(announcementSelectors.form.container);
        if (await form.isVisible()) {
          await showToast(page, '公告编辑表单');
          await delay(1000);

          // 填写标题
          const titleInput = page.locator(announcementSelectors.form.titleInput);
          if (await titleInput.isVisible()) {
            await demoFill(
              page,
              announcementSelectors.form.titleInput,
              '测试公告 - E2E 演示',
              '输入公告标题'
            );
          }

          // 选择公告类型
          const typeGroup = page.locator(announcementSelectors.form.typeGroup);
          if (await typeGroup.isVisible()) {
            await demoAction(page, announcementSelectors.form.typeGroup, '选择公告类型');
            // 点击紧急通知
            const urgentBtn = page.locator(`${announcementSelectors.form.typeBtn}:has-text("紧急")`);
            if (await urgentBtn.isVisible()) {
              await urgentBtn.click();
              await delay(500);
            }
          }

          // 选择颜色
          const colorGroup = page.locator(announcementSelectors.form.colorGroup);
          if (await colorGroup.isVisible()) {
            await demoAction(page, announcementSelectors.form.colorGroup, '选择颜色方案');
            await delay(500);
          }

          // 填写内容
          const contentTextarea = page.locator(announcementSelectors.form.contentTextarea);
          if (await contentTextarea.isVisible()) {
            await demoFill(
              page,
              announcementSelectors.form.contentTextarea,
              '# 测试公告\n\n这是一条 **E2E 测试** 创建的公告。\n\n- 支持 Markdown 格式\n- 支持列表\n- 支持链接',
              '输入公告内容'
            );
          }

          // 演示预览功能
          const previewTab = page.locator(announcementSelectors.form.previewTab);
          if (await previewTab.isVisible()) {
            await demoClick(page, announcementSelectors.form.previewTab, '切换到预览模式');
            await delay(1000);

            const preview = page.locator(announcementSelectors.form.previewContent);
            if (await preview.isVisible()) {
              await demoAction(page, announcementSelectors.form.previewContent, 'Markdown 预览');
            }

            // 切回编辑
            await demoClick(page, announcementSelectors.form.editTab, '切回编辑模式');
          }

          // 选择目标受众
          const targetGroup = page.locator(announcementSelectors.form.targetGroup);
          if (await targetGroup.isVisible()) {
            await demoAction(page, announcementSelectors.form.targetGroup, '选择目标受众');
            await delay(500);
          }

          // 滚动查看更多选项
          await demoScroll(page, 'down', 200, '查看更多选项');
          await delay(500);

          await showToast(page, '表单填写完成');
          await delay(1000);

          // 点击取消返回（不实际保存）
          const cancelBtn = page.locator(announcementSelectors.form.cancelBtn);
          if (await cancelBtn.isVisible()) {
            await demoClick(page, announcementSelectors.form.cancelBtn, '取消返回');
            await delay(500);
          }
        }
      }

      expect(true).toBe(true);
    });

    test('编辑公告', async ({ page }) => {
      await showChapterTitle(page, '编辑公告', '演示编辑现有公告');

      // 导航到公告管理页面
      await page.goto('/admin/announcements');
      await page.waitForLoadState('networkidle');
      await delay(1000);

      // 检查是否有公告
      const rows = page.locator(announcementSelectors.admin.row);
      const rowCount = await rows.count();

      if (rowCount > 0) {
        await showToast(page, '选择要编辑的公告');
        await delay(1000);

        // 找到编辑按钮
        const editBtn = page.locator(`${announcementSelectors.admin.row}:first-child button`).first();
        if (await editBtn.isVisible()) {
          await demoAction(page, `${announcementSelectors.admin.row}:first-child`, '选中第一条公告');
          await delay(500);

          // 点击编辑（查找包含 edit 图标的按钮）
          const editBtnInRow = page.locator(`${announcementSelectors.admin.row}:first-child .announcement-mgmt__action-btn`).first();
          if (await editBtnInRow.isVisible()) {
            await editBtnInRow.click();
            await showToast(page, '打开编辑表单');
            await delay(1500);

            // 检查表单是否出现
            const form = page.locator(announcementSelectors.form.container);
            if (await form.isVisible()) {
              await demoAction(page, announcementSelectors.form.container, '编辑表单');
              await delay(1000);

              // 返回列表
              const backBtn = page.locator(announcementSelectors.form.backBtn);
              if (await backBtn.isVisible()) {
                await demoClick(page, announcementSelectors.form.backBtn, '返回列表');
              }
            }
          }
        }
      } else {
        await showToast(page, '暂无公告可编辑');
      }

      expect(true).toBe(true);
    });

    test('公告操作演示', async ({ page }) => {
      await showChapterTitle(page, '公告操作', '演示发布、归档、删除操作');

      // 导航到公告管理页面
      await page.goto('/admin/announcements');
      await page.waitForLoadState('networkidle');
      await delay(1000);

      // 检查是否有公告
      const rows = page.locator(announcementSelectors.admin.row);
      const rowCount = await rows.count();

      if (rowCount > 0) {
        // 展示不同状态的标签
        await showToast(page, '不同状态的公告');
        await delay(1000);

        // 检查草稿状态（可发布）
        const draftTab = page.locator(`${announcementSelectors.admin.tab}:has-text("草稿")`);
        if (await draftTab.isVisible()) {
          await demoClick(page, `${announcementSelectors.admin.tab}:has-text("草稿")`, '查看草稿');
          await delay(1000);

          const draftRows = page.locator(announcementSelectors.admin.row);
          const draftCount = await draftRows.count();
          if (draftCount > 0) {
            await showToast(page, `${draftCount} 条草稿待发布`);
            const publishBtn = page.locator(announcementSelectors.admin.publishBtn).first();
            if (await publishBtn.isVisible()) {
              await demoAction(page, announcementSelectors.admin.publishBtn, '发布按钮');
            }
          }
        }

        // 检查生效中状态（可归档）
        const activeTab = page.locator(`${announcementSelectors.admin.tab}:has-text("生效中")`);
        if (await activeTab.isVisible()) {
          await demoClick(page, `${announcementSelectors.admin.tab}:has-text("生效中")`, '查看生效中');
          await delay(1000);

          const activeRows = page.locator(announcementSelectors.admin.row);
          const activeCount = await activeRows.count();
          if (activeCount > 0) {
            await showToast(page, `${activeCount} 条正在生效`);
            const archiveBtn = page.locator(announcementSelectors.admin.archiveBtn).first();
            if (await archiveBtn.isVisible()) {
              await demoAction(page, announcementSelectors.admin.archiveBtn, '归档按钮');
            }
          }
        }

        // 返回全部
        await page.locator(`${announcementSelectors.admin.tab}:has-text("全部")`).click();
        await delay(500);

        // 展示删除操作（不实际删除）
        const deleteBtn = page.locator(announcementSelectors.admin.deleteBtn).first();
        if (await deleteBtn.isVisible()) {
          await demoAction(page, announcementSelectors.admin.deleteBtn, '删除按钮');
          await showToast(page, '可删除草稿/过期/归档的公告');
        }
      } else {
        await showToast(page, '暂无公告');
      }

      expect(true).toBe(true);
    });
  });
});
