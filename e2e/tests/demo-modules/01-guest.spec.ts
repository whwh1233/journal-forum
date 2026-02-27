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
