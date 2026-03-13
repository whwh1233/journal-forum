import { test, expect } from '@playwright/test';
import { selectors, searchTerms, journalCategories } from '../../fixtures/test-data';
import {
  initDemo,
  finishDemo,
  delay,
  showChapterTitle,
  showToast,
  demoAction,
  demoClick,
  demoType,
  demoScroll,
  highlight,
  log,
} from '../../fixtures/demo-helpers';
import { ErrorCollector } from '../../fixtures/error-collector';
import { InteractionTracker } from '../../fixtures/interaction-tracker';

test.describe('游客场景演示', () => {
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
    const { errorReport, interactionReport } = await finishDemo();

    // Assert zero errors
    expect(
      errorReport.totalErrors,
      `测试 "${testInfo.title}" 发现 ${errorReport.totalErrors} 个错误`
    ).toBe(0);
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

  test('主题切换', async ({ page }, testInfo) => {
    testInfo.setTimeout(180000); // 3 分钟超时

    await showChapterTitle(page, '主题切换', '切换不同的视觉主题');

    const themeTrigger = page.locator(selectors.theme.trigger);
    if (await themeTrigger.isVisible()) {
      await demoClick(page, selectors.theme.trigger, '🎨 打开主题选择器');
      await delay(300);

      const themeOptions = page.locator(selectors.theme.option);
      const themeCount = await themeOptions.count();
      await showToast(page, `共有 ${themeCount} 个主题可选`);
      await delay(500);

      // 切换每个主题（点击后面板会关闭，需要重新打开）
      for (let i = 0; i < Math.min(themeCount, 4); i++) {
        // 确保选择器面板是打开的
        const panel = page.locator('.theme-picker-panel');
        if (!(await panel.isVisible())) {
          await themeTrigger.click();
          await delay(200);
        }

        await page.locator(selectors.theme.option).nth(i).click();
        await showToast(page, `✨ 主题 ${i + 1}`);
        await delay(600);
      }

      await showToast(page, '🎨 主题切换完成');
    }

    expect(true).toBe(true);
  });

  test('期刊分类导航', async ({ page }) => {
    await showChapterTitle(page, '期刊分类导航', '演示分类筛选功能');

    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });
    const initialCount = await page.locator(selectors.journal.card).count();
    await showToast(page, `当前共 ${initialCount} 个期刊`);
    await delay(1000);

    // 打开等级筛选下拉
    const levelTriggers = page.locator(selectors.search.filterGroup).first().locator(selectors.search.popoverTrigger);
    if (await levelTriggers.count() > 0) {
      await demoAction(page, `${selectors.search.filterGroup}:first-child ${selectors.search.popoverTrigger}`, '📂 打开等级筛选');
      await levelTriggers.first().click();
      await delay(500);

      // 选择一个等级选项
      const menuItems = page.locator(selectors.search.menuItem);
      const menuCount = await menuItems.count();
      if (menuCount > 1) {
        await demoAction(page, `${selectors.search.menuItem}:nth-child(2)`, '📌 选择一个等级');
        await menuItems.nth(1).click();
        await delay(1000);

        const filteredCount = await page.locator(selectors.journal.card).count();
        await showToast(page, `筛选后: ${filteredCount} 个期刊`);
        await delay(1000);
      }
    }

    // 打开分类筛选下拉（级联菜单）
    const categoryTriggers = page.locator(selectors.search.filterGroup).nth(1).locator(selectors.search.popoverTrigger);
    if (await categoryTriggers.count() > 0) {
      await demoAction(page, `${selectors.search.filterGroup}:nth-child(2) ${selectors.search.popoverTrigger}`, '🗂️ 打开分类筛选');
      await categoryTriggers.first().click();
      await delay(500);

      // 悬停在一个父分类上查看子分类
      const mainMenuItems = page.locator('.main-column .menu-item');
      const mainCount = await mainMenuItems.count();
      if (mainCount > 1) {
        await mainMenuItems.nth(1).hover();
        await showToast(page, '📁 查看子分类');
        await delay(800);

        // 点击子分类（如果存在）
        const subColumn = page.locator('.sub-column');
        if (await subColumn.isVisible()) {
          const subItems = subColumn.locator('.menu-item');
          if (await subItems.count() > 0) {
            await subItems.first().click();
            await showToast(page, '✅ 选择了子分类');
            await delay(1000);
          }
        } else {
          // 没有子分类，直接点击父分类
          await mainMenuItems.nth(1).click();
          await delay(500);
        }
      }
    }

    // 清除筛选
    const clearBtn = page.locator(selectors.search.clearFiltersBtn);
    if (await clearBtn.isVisible()) {
      await demoClick(page, selectors.search.clearFiltersBtn, '🔄 重置所有筛选');
      await delay(1000);
    }

    await showToast(page, '✅ 分类导航演示完成');
    expect(true).toBe(true);
  });

  test('期刊排序功能', async ({ page }) => {
    await showChapterTitle(page, '期刊排序功能', '演示多维度排序');

    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

    // 点击排序功能按钮
    const sortTrigger = page.locator(selectors.search.sortTrigger);
    if (await sortTrigger.isVisible()) {
      await demoClick(page, selectors.search.sortTrigger, '🔢 打开排序配置');
      await delay(500);

      // 等待排序面板展开
      const sortPanel = page.locator(selectors.search.sortPanel);
      await sortPanel.waitFor({ state: 'visible', timeout: 3000 });
      await showToast(page, '📊 排序面板已展开');
      await delay(800);

      // 获取所有排序卡片
      const sortCards = page.locator(selectors.search.sortItemCard);
      const cardCount = await sortCards.count();
      log('📋', `共有 ${cardCount} 个排序维度`);

      // 依次点击前 3 个排序卡片
      for (let i = 0; i < Math.min(3, cardCount); i++) {
        const card = sortCards.nth(i);
        const fieldName = await card.locator('.field-name').textContent();
        await demoAction(page, `${selectors.search.sortItemCard}:nth-child(${i + 1})`, `📈 ${fieldName} - 点击切换`);
        await card.click();
        await delay(600);

        // 显示当前状态
        const statusText = await card.locator('.status-text').textContent();
        await showToast(page, `${fieldName}: ${statusText}`);
        await delay(500);
      }

      // 再次点击第一个切换为升序
      if (cardCount > 0) {
        const firstCard = sortCards.first();
        await demoAction(page, `${selectors.search.sortItemCard}:first-child`, '🔄 切换排序方向');
        await firstCard.click();
        await delay(600);

        const statusText = await firstCard.locator('.status-text').textContent();
        await showToast(page, `状态变为: ${statusText}`);
        await delay(800);
      }

      // 关闭排序面板
      const closeBtn = page.locator('.close-panel-btn');
      if (await closeBtn.isVisible()) {
        await demoClick(page, '.close-panel-btn', '❌ 关闭排序面板');
      }
    }

    // 清除筛选
    const clearBtn = page.locator(selectors.search.clearFiltersBtn);
    if (await clearBtn.isVisible()) {
      await demoClick(page, selectors.search.clearFiltersBtn, '🔄 重置排序');
      await delay(500);
    }

    await showToast(page, '✅ 排序功能演示完成');
    expect(true).toBe(true);
  });

  test('分页与无限滚动', async ({ page }, testInfo) => {
    testInfo.setTimeout(120000); // 2 分钟超时

    await showChapterTitle(page, '分页与无限滚动', '演示加载更多期刊');

    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

    // 记录初始期刊数量
    const initialCount = await page.locator(selectors.journal.card).count();
    await showToast(page, `初始加载: ${initialCount} 个期刊`);
    await delay(1000);

    // 滚动到底部触发加载更多
    const loadMoreTrigger = page.locator(selectors.journalGrid.loadMoreTrigger);

    // 进行多次滚动
    for (let i = 0; i < 3; i++) {
      await demoScroll(page, 'down', 500, `📜 向下滚动 (第 ${i + 1} 次)`);
      await delay(400);
    }

    // 滚动到加载更多触发器位置
    if (await loadMoreTrigger.isVisible()) {
      await loadMoreTrigger.scrollIntoViewIfNeeded();
      await showToast(page, '📥 触发加载更多...');
      await delay(1500);
    }

    // 检查是否正在加载
    const loadingMore = page.locator(selectors.journalGrid.loadingMore);
    if (await loadingMore.isVisible()) {
      await demoAction(page, selectors.journalGrid.loadingMore, '⏳ 正在加载更多');
      await delay(1000);
    }

    // 等待加载完成
    await delay(2000);

    // 检查新加载的数量
    const newCount = await page.locator(selectors.journal.card).count();
    if (newCount > initialCount) {
      await showToast(page, `加载后: ${newCount} 个期刊 (+${newCount - initialCount})`);
    } else {
      // 可能已经加载完毕
      const noMore = page.locator(selectors.journalGrid.noMore);
      if (await noMore.isVisible()) {
        await demoAction(page, selectors.journalGrid.noMore, '📚 已加载全部期刊');
      }
    }
    await delay(1000);

    // 滚动回顶部
    await demoScroll(page, 'up', 1500, '📜 返回顶部');

    await showToast(page, '✅ 分页演示完成');
    expect(true).toBe(true);
  });

  test('期刊评分展示', async ({ page }) => {
    await showChapterTitle(page, '期刊评分展示', '查看期刊卡片上的评分和指标');

    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

    // 展示期刊卡片结构
    const cards = page.locator(selectors.journal.card);
    const count = await cards.count();
    await showToast(page, `共有 ${count} 个期刊卡片`);
    await delay(800);

    // 查看前 2 个期刊卡片的详细信息
    for (let i = 0; i < Math.min(2, count); i++) {
      const card = cards.nth(i);
      await card.scrollIntoViewIfNeeded();

      // 高亮整个卡片
      await demoAction(page, `${selectors.journal.card}:nth-child(${i + 1})`, `📖 期刊卡片 ${i + 1}`);

      // 获取期刊标题
      const title = await card.locator(selectors.journalCard.title).textContent();
      await showToast(page, `期刊: ${title}`);
      await delay(600);

      // 高亮等级标签
      const levelTags = card.locator(selectors.journalCard.levelTag);
      if (await levelTags.count() > 0) {
        await highlight(page, `${selectors.journal.card}:nth-child(${i + 1}) ${selectors.journalCard.levels}`);
        await showToast(page, '🏷️ 学科等级标签');
        await delay(600);
      }

      // 高亮统计行
      await highlight(page, `${selectors.journal.card}:nth-child(${i + 1}) ${selectors.journalCard.statsRow}`);

      // 获取影响因子
      const ifValue = card.locator(selectors.journalCard.ifValue);
      if (await ifValue.isVisible()) {
        const ifText = await ifValue.textContent();
        await showToast(page, `📊 影响因子: ${ifText?.trim()}`);
        await delay(500);
      }

      // 获取用户评分
      const ratingValue = card.locator(selectors.journalCard.ratingValue);
      if (await ratingValue.isVisible()) {
        const ratingText = await ratingValue.textContent();
        await showToast(page, `⭐ 用户评分: ${ratingText?.trim()}`);
        await delay(500);
      }

      // 获取讨论数
      const commentValue = card.locator(selectors.journalCard.commentValue);
      if (await commentValue.isVisible()) {
        const commentText = await commentValue.textContent();
        await showToast(page, `💬 讨论数: ${commentText?.trim()}`);
        await delay(500);
      }

      // 高亮底部分类和 ISSN
      const footer = card.locator(selectors.journalCard.footer);
      if (await footer.isVisible()) {
        await highlight(page, `${selectors.journal.card}:nth-child(${i + 1}) ${selectors.journalCard.footer}`);
        const category = await card.locator(selectors.journalCard.category).textContent();
        await showToast(page, `📁 分类: ${category?.trim()}`);
        await delay(500);
      }

      await delay(300);
    }

    await showToast(page, '✅ 评分展示演示完成');
    expect(true).toBe(true);
  });

  test('响应式布局', async ({ page }, testInfo) => {
    testInfo.setTimeout(120000); // 2 分钟超时

    await showChapterTitle(page, '响应式布局', '演示不同窗口大小下的布局变化');

    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

    // 定义不同的视口尺寸
    const viewports = [
      { width: 1920, height: 1080, name: '桌面端 (1920x1080)' },
      { width: 1280, height: 800, name: '笔记本 (1280x800)' },
      { width: 768, height: 1024, name: '平板竖屏 (768x1024)' },
      { width: 375, height: 812, name: '手机 (375x812)' },
    ];

    for (const vp of viewports) {
      await showToast(page, `📱 切换到 ${vp.name}`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await delay(1000);

      // 检查布局变化
      const cardCount = await page.locator(selectors.journal.card).count();
      log('📐', `${vp.name}: ${cardCount} 个卡片可见`);

      // 截图展示当前布局
      await demoScroll(page, 'down', 200);
      await delay(400);
      await demoScroll(page, 'up', 200);
      await delay(600);
    }

    // 恢复默认视口
    await page.setViewportSize({ width: 1280, height: 720 });
    await showToast(page, '🖥️ 恢复默认视口');
    await delay(500);

    await showToast(page, '✅ 响应式布局演示完成');
    expect(true).toBe(true);
  });

  test('侧边栏导航交互', async ({ page }) => {
    await showChapterTitle(page, '侧边栏导航', '演示侧边栏的展开/收起功能');

    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

    // 找到侧边栏切换按钮
    const sideNavToggle = page.locator(selectors.sideNav.toggle);
    if (await sideNavToggle.isVisible()) {
      // 检查初始状态
      const sideNav = page.locator(selectors.sideNav.container);
      const isExpanded = await sideNav.evaluate(el => el.classList.contains('expanded'));

      await showToast(page, isExpanded ? '📂 侧边栏已展开' : '📁 侧边栏已收起');
      await delay(800);

      // 切换侧边栏状态
      await demoClick(page, selectors.sideNav.toggle, '🔄 切换侧边栏');
      await delay(800);

      const newState = await sideNav.evaluate(el => el.classList.contains('expanded'));
      await showToast(page, newState ? '📂 侧边栏展开' : '📁 侧边栏收起');
      await delay(600);

      // 再次切换回来
      await demoClick(page, selectors.sideNav.toggle, '🔄 再次切换');
      await delay(600);
    }

    // 展示侧边栏导航项（需要展开状态）
    const sideNav = page.locator(selectors.sideNav.container);
    const isExpanded = await sideNav.evaluate(el => el.classList.contains('expanded'));

    if (!isExpanded) {
      await page.locator(selectors.sideNav.toggle).click();
      await delay(500);
    }

    // 高亮首页链接
    const homeLink = page.locator(selectors.sideNav.homeLink);
    if (await homeLink.isVisible()) {
      await demoAction(page, selectors.sideNav.homeLink, '🏠 首页导航');
    }

    // 高亮社区链接
    const communityLink = page.locator('a[href="/community"]');
    if (await communityLink.isVisible()) {
      await demoAction(page, 'a[href="/community"]', '💬 社区讨论');
    }

    // 高亮登录按钮（游客状态）
    const loginBtn = page.locator('.side-nav-bottom .side-nav-btn');
    if (await loginBtn.first().isVisible()) {
      await demoAction(page, '.side-nav-bottom .side-nav-btn', '🔐 登录入口');
    }

    await showToast(page, '✅ 侧边栏导航演示完成');
    expect(true).toBe(true);
  });
});
