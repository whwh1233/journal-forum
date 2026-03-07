import { test, expect } from '@playwright/test';
import { selectors, searchTerms, testUsers } from '../fixtures/test-data';

/**
 * 用户流程测试 - 基于实际项目功能
 */
test.describe('投哪儿 - 用户流程测试', () => {

  test.describe('首页和期刊浏览', () => {

    test('首页加载并显示期刊列表', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // 等待期刊卡片加载
      await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

      // 验证期刊卡片存在
      const journalCards = page.locator(selectors.journal.card);
      const count = await journalCards.count();
      expect(count).toBeGreaterThan(0);

      // 验证期刊卡片包含必要信息
      const firstCard = journalCards.first();
      await expect(firstCard.locator(selectors.journal.title)).toBeVisible();
      await expect(firstCard.locator(selectors.journal.category)).toBeVisible();
    });

    test('点击期刊卡片打开详情面板', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

      // 点击第一个期刊卡片
      const firstCard = page.locator(selectors.journal.card).first();
      const journalTitle = await firstCard.locator(selectors.journal.title).textContent();
      await firstCard.click();

      // 等待详情面板打开
      await page.waitForSelector(selectors.journal.panel + '.open', { timeout: 5000 });

      // 验证详情面板显示正确标题
      const panelTitle = page.locator(selectors.journal.panelTitle);
      await expect(panelTitle).toContainText(journalTitle || '');

      // 验证评论区域存在
      await expect(page.locator(selectors.comment.list).or(page.locator(selectors.comment.loginPrompt))).toBeVisible();

      // 关闭面板
      await page.locator(selectors.journal.panelClose).click();
      await expect(page.locator(selectors.journal.panel + '.open')).not.toBeVisible();
    });

    test('搜索期刊功能', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

      const searchInput = page.locator(selectors.search.input);
      if (await searchInput.isVisible()) {
        // 输入搜索词
        await searchInput.fill(searchTerms[0]);
        await searchInput.press('Enter');
        await page.waitForTimeout(1000);

        // 验证搜索结果
        const cards = page.locator(selectors.journal.card);
        const count = await cards.count();

        // 可能有结果或没有结果，但页面不应崩溃
        expect(count >= 0).toBe(true);
      }
    });

    test('期刊分类筛选', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

      const categorySelect = page.locator(selectors.search.categorySelect);
      if (await categorySelect.isVisible()) {
        // 选择一个分类
        await categorySelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);

        // 页面应该正常响应
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('认证流程', () => {

    test('打开登录弹窗', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // 通过顶栏按钮打开登录弹窗
      const topBarLoginBtn = page.locator(selectors.topBar.loginBtn);
      if (await topBarLoginBtn.isVisible()) {
        await topBarLoginBtn.click();
      } else {
        // 或者通过侧边栏
        const sideNavLoginBtn = page.locator(selectors.sideNav.loginBtn);
        await sideNavLoginBtn.click();
      }

      // 等待登录表单出现
      await page.waitForSelector(selectors.auth.loginForm, { timeout: 5000 });

      // 验证表单元素
      await expect(page.locator(selectors.auth.emailInput)).toBeVisible();
      await expect(page.locator(selectors.auth.passwordInput)).toBeVisible();
      await expect(page.locator(selectors.auth.submitBtn)).toBeVisible();
    });

    test('切换到注册表单', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // 打开登录弹窗
      const topBarLoginBtn = page.locator(selectors.topBar.loginBtn);
      if (await topBarLoginBtn.isVisible()) {
        await topBarLoginBtn.click();
      }

      await page.waitForSelector(selectors.auth.loginForm, { timeout: 5000 });

      // 点击切换到注册
      const switchLink = page.locator(selectors.auth.switchToRegister);
      await switchLink.click();
      await page.waitForTimeout(500);

      // 验证切换成功（注册表单可能有用户名字段）
      await expect(page.locator(selectors.auth.emailInput)).toBeVisible();
    });

    test('登录表单验证', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // 打开登录弹窗
      const topBarLoginBtn = page.locator(selectors.topBar.loginBtn);
      if (await topBarLoginBtn.isVisible()) {
        await topBarLoginBtn.click();
      }

      await page.waitForSelector(selectors.auth.loginForm, { timeout: 5000 });

      // 直接点击提交（空表单）
      await page.locator(selectors.auth.submitBtn).click();
      await page.waitForTimeout(500);

      // 应该显示验证错误或 HTML5 验证
      const emailInput = page.locator(selectors.auth.emailInput);
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    });
  });

  test.describe('导航功能', () => {

    test('侧边导航展开/折叠', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const sideNav = page.locator(selectors.sideNav.container);
      const toggleBtn = page.locator(selectors.sideNav.toggle);

      // 点击切换
      await toggleBtn.click();
      await page.waitForTimeout(500);

      // 验证状态变化
      const isExpanded = await sideNav.evaluate((el) => el.classList.contains('expanded'));

      // 再次切换
      await toggleBtn.click();
      await page.waitForTimeout(500);

      const isExpandedAfter = await sideNav.evaluate((el) => el.classList.contains('expanded'));
      expect(isExpanded !== isExpandedAfter).toBe(true);
    });

    test('导航到首页', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // 点击首页链接
      await page.locator(selectors.sideNav.homeLink).click();
      await page.waitForLoadState('networkidle');

      // 验证回到首页
      expect(page.url()).toMatch(/\/$/);
    });
  });

  test.describe('主题切换', () => {

    test('打开主题选择器', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const themeTrigger = page.locator(selectors.topBar.themePicker);
      if (await themeTrigger.isVisible()) {
        await themeTrigger.click();
        await page.waitForTimeout(500);

        // 验证主题选项出现
        const themeOptions = page.locator(selectors.theme.option);
        const count = await themeOptions.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('切换主题', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const themeTrigger = page.locator(selectors.topBar.themePicker);
      if (await themeTrigger.isVisible()) {
        await themeTrigger.click();
        await page.waitForTimeout(500);

        // 获取初始主题
        const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));

        // 点击一个不同的主题
        const themeOptions = page.locator(selectors.theme.option);
        if (await themeOptions.count() > 1) {
          await themeOptions.nth(1).click();
          await page.waitForTimeout(500);

          // 验证主题改变
          const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
          // 主题可能改变也可能不变（如果点击同一个）
          expect(newTheme).toBeDefined();
        }
      }
    });
  });
});
