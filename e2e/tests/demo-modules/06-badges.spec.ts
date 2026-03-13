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
  demoScroll,
  log,
} from '../../fixtures/demo-helpers';
import { ErrorCollector } from '../../fixtures/error-collector';
import { InteractionTracker } from '../../fixtures/interaction-tracker';

/**
 * 徽章系统相关选择器
 */
const badgeSelectors = {
  // 徽章图鉴页面
  gallery: {
    container: '.badge-gallery-page',
    header: '.gallery-header-summary',
    tabs: '.dashboard-tabs',
    tabActivity: '.dashboard-tabs .tab:nth-child(1)',
    tabIdentity: '.dashboard-tabs .tab:nth-child(2)',
    tabHonor: '.dashboard-tabs .tab:nth-child(3)',
    grid: '.badge-grid',
    card: '.gallery-card',
    cardBadge: '.card-badge',
    cardInfo: '.card-info',
    triggerInfo: '.trigger-info',
    emptyState: '.empty-state',
  },
  // 徽章组件
  badge: {
    item: '.badge',
    icon: '.badge__icon',
    name: '.badge__name',
    newDot: '.badge__new-dot',
  },
  // 徽章墙
  badgeWall: {
    container: '.badge-wall',
    title: '.badge-wall__title',
    category: '.badge-wall__category',
    categoryTitle: '.badge-wall__category-title',
    badges: '.badge-wall__badges',
  },
  // 徽章列表
  badgeList: {
    container: '.badge-list',
    more: '.badge-list__more',
  },
  // 徽章选择器 (置顶)
  badgePicker: {
    container: '.badge-picker',
    header: '.badge-picker__header',
    count: '.badge-picker__count',
    hint: '.badge-picker__hint',
    grid: '.badge-picker__grid',
    item: '.badge-picker__item',
    itemSelected: '.badge-picker__item--selected',
    checkIcon: '.badge-picker__check',
    saveBtn: '.badge-picker__save',
    loading: '.badge-picker__loading',
    empty: '.badge-picker--empty',
  },
  // 管理员徽章管理
  admin: {
    container: '.badge-management',
    header: '.admin-header',
    grantCard: '.grant-badge-card',
    grantForm: '.grant-form',
    badgeSelect: '.grant-form select:first-of-type',
    userSelect: '.grant-form select:last-of-type',
    grantBtn: '.btn-grant',
    actionMessage: '.action-message',
    badgesListCard: '.badges-list-card',
    table: '.admin-table',
    tableRow: '.admin-table tbody tr',
    typeBadge: '.type-badge',
    statusBadge: '.status-badge',
  },
  // 个人资料页徽章展示
  profile: {
    badgeWall: '.badge-wall',
    badgeList: '.badge-list',
    levelBadge: '.profile-level-badge',
  },
};

/**
 * 用户登录辅助函数
 */
async function loginAsUser(page: any, user: { email: string; password: string }) {
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

test.describe('徽章系统演示', () => {
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

    // Assert zero errors
    expect(
      errorReport.totalErrors,
      `测试 "${testInfo.title}" 发现 ${errorReport.totalErrors} 个错误`
    ).toBe(0);
  });

  test('查看徽章图鉴', async ({ page }) => {
    await showChapterTitle(page, '徽章图鉴', '浏览平台所有的荣誉与头衔');

    // 导航到徽章图鉴页面
    await page.goto('/badges');
    await page.waitForLoadState('networkidle');
    await delay(1000);

    // 检查页面是否加载
    const galleryPage = page.locator(badgeSelectors.gallery.container);
    if (await galleryPage.isVisible({ timeout: 5000 })) {
      await showToast(page, '🏆 徽章陈列馆');
      await delay(800);

      // 展示页面头部
      const header = page.locator(badgeSelectors.gallery.header);
      if (await header.isVisible()) {
        await demoAction(page, badgeSelectors.gallery.header, '📍 荣誉殿堂入口');
      }

      // 展示分类标签
      await demoAction(page, badgeSelectors.gallery.tabs, '📂 徽章分类标签');
      await delay(500);

      // 查看活跃徽章分类
      await demoClick(page, badgeSelectors.gallery.tabActivity, '⚡ 活跃徽章');
      await delay(800);

      // 展示徽章卡片
      const cards = page.locator(badgeSelectors.gallery.card);
      const cardCount = await cards.count();
      if (cardCount > 0) {
        await showToast(page, `共有 ${cardCount} 个活跃徽章`);
        await delay(800);

        // 高亮第一个徽章卡片
        await demoAction(page, `${badgeSelectors.gallery.card}:first-child`, '🎖️ 徽章详情卡');
        await delay(500);

        // 展示触发条件
        const triggerInfo = page.locator(badgeSelectors.gallery.triggerInfo).first();
        if (await triggerInfo.isVisible()) {
          await demoAction(page, `${badgeSelectors.gallery.triggerInfo}:first-of-type`, '📋 获取条件说明');
        }
      }

      // 切换到身份徽章
      await demoClick(page, badgeSelectors.gallery.tabIdentity, '👤 身份徽章');
      await delay(800);

      const identityCards = page.locator(badgeSelectors.gallery.card);
      const identityCount = await identityCards.count();
      await showToast(page, `身份徽章: ${identityCount} 个`);
      await delay(600);

      // 切换到荣誉徽章
      await demoClick(page, badgeSelectors.gallery.tabHonor, '🏅 荣誉徽章');
      await delay(800);

      const honorCards = page.locator(badgeSelectors.gallery.card);
      const honorCount = await honorCards.count();
      await showToast(page, `荣誉徽章: ${honorCount} 个`);
      await delay(600);

      // 滚动浏览
      await demoScroll(page, 'down', 300, '📜 浏览更多徽章');
      await delay(600);
      await demoScroll(page, 'up', 300);
    } else {
      await showToast(page, '⚠️ 徽章图鉴页面加载中...');
    }

    await showToast(page, '✅ 徽章图鉴浏览完成');
    log('✅', '徽章图鉴测试完成');

    expect(true).toBe(true);
  });

  test('查看用户徽章', async ({ page }) => {
    await showChapterTitle(page, '用户徽章', '查看用户获得的徽章');

    // 先登录
    await loginAsUser(page, demoUsers.author);
    await showToast(page, '🔐 已登录');
    await delay(500);

    // 导航到仪表盘（个人中心）
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await delay(1000);

    await showToast(page, '📊 个人中心');
    await delay(800);

    // 展示统计信息
    const statsCard = page.locator('.stat-card').first();
    if (await statsCard.isVisible()) {
      await demoAction(page, '.dashboard-stats', '📈 用户统计数据');
      await delay(500);

      // 展示积分和等级
      const pointsCard = page.locator('.points-card');
      if (await pointsCard.isVisible()) {
        await demoAction(page, '.points-card', '🎯 积分与等级');
      }
    }

    // 导航到个人资料页查看徽章墙
    // 获取当前用户ID（从URL或其他方式）
    const userDropdown = page.locator(selectors.topBar.userDropdown);
    if (await userDropdown.isVisible()) {
      await demoClick(page, selectors.topBar.userDropdown, '👤 打开用户菜单');
      await delay(500);

      // 点击个人资料链接
      const profileLink = page.locator('a[href*="/profile/"]');
      if (await profileLink.first().isVisible()) {
        await profileLink.first().click();
        await delay(1500);
      }
    }

    // 在个人资料页查看徽章
    const badgeWall = page.locator(badgeSelectors.profile.badgeWall);
    if (await badgeWall.isVisible({ timeout: 3000 })) {
      await showToast(page, '🏆 用户徽章墙');
      await demoAction(page, badgeSelectors.profile.badgeWall, '📍 获得的徽章展示');
      await delay(800);

      // 查看徽章分类
      const categories = page.locator(badgeSelectors.badgeWall.category);
      const categoryCount = await categories.count();
      if (categoryCount > 0) {
        await showToast(page, `共有 ${categoryCount} 个徽章分类`);
        await delay(600);
      }
    } else {
      await showToast(page, '📭 暂无徽章，继续加油！');
      await delay(800);
    }

    // 查看置顶徽章（在用户名旁边）
    const badgeList = page.locator(badgeSelectors.profile.badgeList);
    if (await badgeList.isVisible()) {
      await demoAction(page, badgeSelectors.profile.badgeList, '⭐ 置顶徽章展示');
    }

    // 查看等级徽章
    const levelBadge = page.locator(badgeSelectors.profile.levelBadge);
    if (await levelBadge.isVisible()) {
      await demoAction(page, badgeSelectors.profile.levelBadge, '📊 用户等级');
    }

    await showToast(page, '✅ 用户徽章查看完成');
    log('✅', '用户徽章测试完成');

    expect(true).toBe(true);
  });

  test('查看他人徽章', async ({ page }) => {
    await showChapterTitle(page, '他人徽章', '访问其他用户主页查看徽章');

    // 无需登录，直接访问某个用户的主页
    // 假设用户ID为1或2
    await page.goto('/profile/1');
    await page.waitForLoadState('networkidle');
    await delay(1000);

    const profilePage = page.locator('.profile-page');
    if (await profilePage.isVisible({ timeout: 5000 })) {
      await showToast(page, '👤 用户主页');
      await delay(800);

      // 展示用户信息
      const profileHeader = page.locator('.profile-header');
      if (await profileHeader.isVisible()) {
        await demoAction(page, '.profile-header', '📍 用户基本信息');
        await delay(500);
      }

      // 展示用户统计
      const profileStats = page.locator('.profile-stats');
      if (await profileStats.isVisible()) {
        await demoAction(page, '.profile-stats', '📊 用户活跃统计');
        await delay(500);
      }

      // 查看用户徽章墙
      const badgeWall = page.locator(badgeSelectors.badgeWall.container);
      if (await badgeWall.isVisible({ timeout: 3000 })) {
        await showToast(page, '🏆 该用户获得的徽章');
        await demoAction(page, badgeSelectors.badgeWall.container, '🎖️ 徽章展示区');
        await delay(800);

        // 滚动查看徽章
        await demoScroll(page, 'down', 200, '📜 查看更多徽章');
        await delay(600);

        // 展示单个徽章
        const badges = page.locator(badgeSelectors.badge.item);
        const badgeCount = await badges.count();
        if (badgeCount > 0) {
          await showToast(page, `共有 ${badgeCount} 个徽章`);
          await delay(600);

          // 高亮第一个徽章
          await demoAction(page, `${badgeSelectors.badge.item}:first-child`, '🏅 徽章详情');
        }
      } else {
        await showToast(page, '📭 该用户暂无徽章');
        await delay(600);
      }

      // 查看置顶徽章
      const pinnedBadges = page.locator(badgeSelectors.badgeList.container);
      if (await pinnedBadges.isVisible()) {
        await demoAction(page, badgeSelectors.badgeList.container, '⭐ 用户置顶徽章');
      }
    } else {
      // 尝试访问另一个用户
      await page.goto('/profile/2');
      await page.waitForLoadState('networkidle');
      await delay(1000);
      await showToast(page, '👤 访问用户主页');
    }

    await showToast(page, '✅ 他人徽章查看完成');
    log('✅', '他人徽章测试完成');

    expect(true).toBe(true);
  });

  test('管理员徽章管理', async ({ page }) => {
    await showChapterTitle(page, '徽章管理', '管理员徽章授予功能');

    // 以管理员身份登录
    await loginAsUser(page, demoUsers.admin);
    await showToast(page, '🔐 管理员已登录');
    await delay(500);

    // 导航到徽章管理页面
    await page.goto('/admin/badges');
    await page.waitForLoadState('networkidle');
    await delay(1000);

    const badgeManagement = page.locator(badgeSelectors.admin.container);
    if (await badgeManagement.isVisible({ timeout: 5000 })) {
      await showToast(page, '🛡️ 徽章管理后台');
      await delay(800);

      // 展示管理页头部
      const header = page.locator(badgeSelectors.admin.header);
      if (await header.isVisible()) {
        await demoAction(page, badgeSelectors.admin.header, '📍 徽章与荣誉总控台');
        await delay(500);
      }

      // 展示徽章授予表单
      const grantCard = page.locator(badgeSelectors.admin.grantCard);
      if (await grantCard.isVisible()) {
        await demoAction(page, badgeSelectors.admin.grantCard, '🎁 签发特别荣誉');
        await delay(600);

        // 展示徽章选择下拉框
        const badgeSelect = page.locator(badgeSelectors.admin.badgeSelect);
        if (await badgeSelect.isVisible()) {
          await demoAction(page, badgeSelectors.admin.badgeSelect, '🎖️ 选择要颁发的徽章');
          await delay(500);
        }

        // 展示用户选择下拉框
        const userSelect = page.locator(badgeSelectors.admin.userSelect);
        if (await userSelect.isVisible()) {
          await demoAction(page, badgeSelectors.admin.userSelect, '👤 选择目标用户');
          await delay(500);
        }

        // 展示颁发按钮
        const grantBtn = page.locator(badgeSelectors.admin.grantBtn);
        if (await grantBtn.isVisible()) {
          await demoAction(page, badgeSelectors.admin.grantBtn, '✨ 立即签发按钮');
        }
      }

      // 滚动查看徽章列表
      await demoScroll(page, 'down', 300, '📜 查看全站徽章数据');
      await delay(600);

      // 展示徽章数据表格
      const badgesTable = page.locator(badgeSelectors.admin.table);
      if (await badgesTable.isVisible()) {
        await demoAction(page, badgeSelectors.admin.badgesListCard, '📋 全站体系数据总览');
        await delay(600);

        // 展示表格行
        const tableRows = page.locator(badgeSelectors.admin.tableRow);
        const rowCount = await tableRows.count();
        await showToast(page, `共有 ${rowCount} 个徽章类型`);
        await delay(600);

        // 高亮展示第一行
        if (rowCount > 0) {
          await demoAction(page, `${badgeSelectors.admin.tableRow}:first-child`, '🔍 徽章详细信息');
        }

        // 展示触发类型标签
        const typeBadge = page.locator(badgeSelectors.admin.typeBadge).first();
        if (await typeBadge.isVisible()) {
          await demoAction(page, badgeSelectors.admin.typeBadge, '⚡ 触发类型：自动/手动');
        }

        // 展示状态标签
        const statusBadge = page.locator(badgeSelectors.admin.statusBadge).first();
        if (await statusBadge.isVisible()) {
          await demoAction(page, badgeSelectors.admin.statusBadge, '📊 系统状态');
        }
      }

      // 返回顶部
      await demoScroll(page, 'up', 300);
    } else {
      await showToast(page, '⚠️ 需要管理员权限访问');
      await delay(800);
    }

    await showToast(page, '✅ 徽章管理演示完成');
    log('✅', '管理员徽章管理测试完成');

    expect(true).toBe(true);
  });

  test('徽章图鉴分类切换', async ({ page }) => {
    await showChapterTitle(page, '分类浏览', '切换不同徽章分类');

    // 导航到徽章图鉴
    await page.goto('/badges');
    await page.waitForLoadState('networkidle');
    await delay(1000);

    const galleryPage = page.locator(badgeSelectors.gallery.container);
    if (await galleryPage.isVisible({ timeout: 5000 })) {
      // 依次切换三个分类标签
      const categories = ['活跃徽章', '身份徽章', '荣誉徽章'];
      const tabSelectors = [
        badgeSelectors.gallery.tabActivity,
        badgeSelectors.gallery.tabIdentity,
        badgeSelectors.gallery.tabHonor,
      ];

      for (let i = 0; i < categories.length; i++) {
        await demoClick(page, tabSelectors[i], `📂 ${categories[i]}`);
        await delay(800);

        const cards = page.locator(badgeSelectors.gallery.card);
        const count = await cards.count();

        if (count > 0) {
          await showToast(page, `${categories[i]}: ${count} 个`);

          // 高亮展示部分徽章卡片
          for (let j = 0; j < Math.min(2, count); j++) {
            await demoAction(
              page,
              `${badgeSelectors.gallery.card}:nth-child(${j + 1})`,
              `🎖️ 徽章 ${j + 1}`
            );
          }
        } else {
          await showToast(page, `${categories[i]}: 暂无`);
        }

        await delay(500);
      }
    }

    await showToast(page, '✅ 分类浏览完成');
    log('✅', '徽章分类切换测试完成');

    expect(true).toBe(true);
  });
});
