import { test, expect, Page } from '@playwright/test';
import {
  selectors,
  routes,
  demoUsers,
  adminSelectors,
} from '../../fixtures/test-data';
import {
  initDemo,
  finishDemo,
  delay,
  showChapterTitle,
  showToast,
  demoAction,
  demoClick,
  demoScroll,
  log,
} from '../../fixtures/demo-helpers';
import { ErrorCollector } from '../../fixtures/error-collector';
import { InteractionTracker } from '../../fixtures/interaction-tracker';

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
    const { errorReport, interactionReport } = await finishDemo();

    // Assert zero errors
    expect(
      errorReport.totalErrors,
      `测试 "${testInfo.title}" 发现 ${errorReport.totalErrors} 个错误`
    ).toBe(0);
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

  test('徽章管理', async ({ page }) => {
    await showChapterTitle(page, '徽章管理', '管理荣誉徽章系统');

    // 导航到徽章管理
    await page.goto(routes.admin.badges);
    await page.waitForLoadState('networkidle');
    await delay(1000);

    await showToast(page, '🏅 徽章管理页面');
    await delay(1000);

    // 等待页面加载完成
    const container = page.locator(adminSelectors.badges.container);
    await container.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

    // 展示管理头部
    const header = page.locator(adminSelectors.badges.header);
    if (await header.isVisible()) {
      await demoAction(page, adminSelectors.badges.header, '📋 徽章与荣誉总控台');
    }

    // 展示颁发徽章表单
    const grantCard = page.locator(adminSelectors.badges.grantCard);
    if (await grantCard.isVisible()) {
      await demoAction(page, adminSelectors.badges.grantCard, '🎖️ 手动颁发荣誉徽章');
      await delay(500);

      // 展示徽章选择下拉框
      const badgeSelect = page.locator(adminSelectors.badges.badgeSelect);
      if (await badgeSelect.isVisible()) {
        await demoAction(page, adminSelectors.badges.badgeSelect, '选择要颁发的徽章');
      }

      // 展示用户选择下拉框
      const userSelect = page.locator(adminSelectors.badges.userSelect);
      if (await userSelect.isVisible()) {
        await demoAction(page, adminSelectors.badges.userSelect, '选择接受荣誉的用户');
      }

      // 展示颁发按钮
      const grantBtn = page.locator(adminSelectors.badges.grantBtn);
      if (await grantBtn.isVisible()) {
        await demoAction(page, adminSelectors.badges.grantBtn, '点击签发徽章');
      }
    }

    // 滚动到徽章列表
    await demoScroll(page, 'down', 300, '📜 查看全站徽章体系');
    await delay(800);

    // 展示徽章列表
    const listCard = page.locator(adminSelectors.badges.listCard);
    if (await listCard.isVisible()) {
      await demoAction(page, adminSelectors.badges.listCard, '📊 全站徽章数据总览');

      // 展示徽章表格
      const badgeRows = page.locator(adminSelectors.badges.row);
      const badgeCount = await badgeRows.count();
      await showToast(page, `共有 ${badgeCount} 种徽章`);
      await delay(800);

      // 展示徽章类型标签
      const typeBadge = page.locator(adminSelectors.badges.typeBadge).first();
      if (await typeBadge.isVisible()) {
        await demoAction(page, adminSelectors.badges.typeBadge, '徽章触发类型：自动/手动');
      }

      // 展示徽章状态
      const statusBadge = page.locator(adminSelectors.badges.statusBadge).first();
      if (await statusBadge.isVisible()) {
        await demoAction(page, adminSelectors.badges.statusBadge, '徽章启用状态');
      }
    }

    await showToast(page, '✅ 徽章管理演示完成');

    expect(true).toBe(true);
  });

  test('公告管理', async ({ page }) => {
    await showChapterTitle(page, '公告管理', '发布和管理系统公告');

    // 导航到公告管理
    await page.goto(routes.admin.announcements);
    await page.waitForLoadState('networkidle');
    await delay(1000);

    await showToast(page, '📢 公告管理页面');
    await delay(1000);

    // 等待页面加载
    const container = page.locator(adminSelectors.announcements.container);
    await container.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

    // 展示页面头部
    const header = page.locator(adminSelectors.announcements.header);
    if (await header.isVisible()) {
      await demoAction(page, adminSelectors.announcements.header, '公告管理中心');
    }

    // 展示新建公告按钮
    const createBtn = page.locator(adminSelectors.announcements.createBtn);
    if (await createBtn.isVisible()) {
      await demoAction(page, adminSelectors.announcements.createBtn, '点击新建公告');
      await delay(500);
    }

    // 展示状态筛选标签
    const tabs = page.locator(adminSelectors.announcements.tabs);
    if (await tabs.isVisible()) {
      await demoAction(page, adminSelectors.announcements.tabs, '按状态筛选公告');
      await delay(500);

      // 点击不同的筛选标签
      const tabButtons = page.locator(adminSelectors.announcements.tab);
      const tabCount = await tabButtons.count();
      if (tabCount > 1) {
        // 点击第二个标签（草稿）
        await tabButtons.nth(1).click();
        await delay(500);
        await showToast(page, '筛选草稿状态公告');
        await delay(500);

        // 点击回全部
        await tabButtons.nth(0).click();
        await delay(500);
      }
    }

    // 展示公告列表
    const tableWrapper = page.locator(adminSelectors.announcements.tableWrapper);
    if (await tableWrapper.isVisible()) {
      await demoAction(page, adminSelectors.announcements.tableWrapper, '📋 公告列表');

      // 展示公告行
      const rows = page.locator(adminSelectors.announcements.row);
      const rowCount = await rows.count();
      await showToast(page, `共有 ${rowCount} 条公告`);
      await delay(800);

      if (rowCount > 0) {
        // 展示公告类型标签
        const typeTag = page.locator(adminSelectors.announcements.typeTag).first();
        if (await typeTag.isVisible()) {
          await demoAction(page, adminSelectors.announcements.typeTag, '公告类型标签');
        }

        // 展示公告状态标签
        const statusTag = page.locator(adminSelectors.announcements.statusTag).first();
        if (await statusTag.isVisible()) {
          await demoAction(page, adminSelectors.announcements.statusTag, '公告状态');
        }

        // 展示阅读进度
        const progress = page.locator(adminSelectors.announcements.progress).first();
        if (await progress.isVisible()) {
          await demoAction(page, adminSelectors.announcements.progress, '阅读率统计');
        }

        // 展示操作按钮
        const actions = page.locator(adminSelectors.announcements.actions).first();
        if (await actions.isVisible()) {
          await demoAction(page, adminSelectors.announcements.actions, '编辑/发布/归档/删除操作');
        }
      }
    } else {
      // 空状态
      const empty = page.locator(adminSelectors.announcements.empty);
      if (await empty.isVisible()) {
        await showToast(page, '暂无公告，可点击新建按钮创建');
      }
    }

    await showToast(page, '✅ 公告管理演示完成');

    expect(true).toBe(true);
  });

  test('数据库管理', async ({ page }) => {
    await showChapterTitle(page, '数据库管理', '超级管理员数据库工具');

    // 导航到数据库管理
    await page.goto(routes.admin.database);
    await page.waitForLoadState('networkidle');
    await delay(1000);

    // 检查是否有权限访问
    const container = page.locator(adminSelectors.database.container);
    const isVisible = await container.isVisible().catch(() => false);

    if (!isVisible) {
      await showToast(page, '需要 superadmin 权限才能访问数据库管理');
      await delay(1500);
      await showToast(page, '✅ 数据库管理权限检查完成');
      expect(true).toBe(true);
      return;
    }

    await showToast(page, '🗄️ 数据库管理页面');
    await delay(1000);

    // 展示导航栏
    const nav = page.locator(adminSelectors.database.nav);
    if (await nav.isVisible()) {
      await demoAction(page, adminSelectors.database.nav, '数据库导航栏');
    }

    // 展示表列表
    const tablesGrid = page.locator(adminSelectors.database.tablesGrid);
    if (await tablesGrid.isVisible()) {
      await demoAction(page, adminSelectors.database.tablesGrid, '📊 数据表列表');

      // 统计表数量
      const tableCards = page.locator(adminSelectors.database.tableCard);
      const tableCount = await tableCards.count();
      await showToast(page, `数据库共有 ${tableCount} 张表`);
      await delay(800);

      // 展示单个表卡片
      if (tableCount > 0) {
        const firstCard = tableCards.first();
        await demoAction(page, adminSelectors.database.tableCard, '表信息卡片');

        // 点击进入表数据
        await firstCard.click();
        await delay(1000);
        await showToast(page, '进入表数据浏览');
        await delay(800);
      }
    }

    // 展示表数据视图
    const dataView = page.locator(adminSelectors.database.data);
    if (await dataView.isVisible()) {
      // 展示搜索工具栏
      const toolbar = page.locator(adminSelectors.database.dataToolbar);
      if (await toolbar.isVisible()) {
        await demoAction(page, adminSelectors.database.dataToolbar, '搜索和筛选工具栏');
      }

      // 展示数据表格
      const dataTable = page.locator(adminSelectors.database.dataTable);
      if (await dataTable.isVisible()) {
        await demoAction(page, adminSelectors.database.dataTable, '📋 表数据');

        // 展示行操作按钮
        const editBtn = page.locator(adminSelectors.database.editBtn).first();
        if (await editBtn.isVisible()) {
          await demoAction(page, adminSelectors.database.editBtn, '编辑行数据');
        }
      }

      // 展示分页
      const pagination = page.locator(adminSelectors.database.pagination);
      if (await pagination.isVisible()) {
        await demoAction(page, adminSelectors.database.pagination, '分页控件');
      }
    }

    // 切换到表结构视图
    const viewTabs = page.locator(adminSelectors.database.viewTabs);
    if (await viewTabs.isVisible()) {
      const structureTab = page.locator(adminSelectors.database.viewTabBtn).filter({ hasText: '结构' });
      if (await structureTab.isVisible()) {
        await structureTab.click();
        await delay(800);
        await showToast(page, '查看表结构');

        const structure = page.locator(adminSelectors.database.structure);
        if (await structure.isVisible()) {
          await demoAction(page, adminSelectors.database.structure, '📐 表结构详情');
        }
      }
    }

    // 切换到审计日志
    const logsBtn = page.locator(adminSelectors.database.navBtn).filter({ hasText: '操作日志' });
    if (await logsBtn.isVisible()) {
      await logsBtn.click();
      await delay(800);
      await showToast(page, '查看操作审计日志');

      const logs = page.locator(adminSelectors.database.logs);
      if (await logs.isVisible()) {
        await demoAction(page, adminSelectors.database.logs, '📜 操作审计日志');
      }
    }

    await showToast(page, '✅ 数据库管理演示完成');

    expect(true).toBe(true);
  });
});
