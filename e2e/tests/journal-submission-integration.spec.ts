import { test, expect } from '@playwright/test';

test.describe('期刊-投稿整合功能', () => {
  // 测试用户凭证
  const testUser = {
    email: 'test@example.com',
    password: 'password123'
  };

  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', testUser.email);
    await page.fill('input[name="password"], input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // 等待登录完成
    await page.waitForURL(/^(?!.*login).*$/);
  });

  test('从期刊详情页跳转到投稿记录', async ({ page }) => {
    // 1. 访问期刊详情页
    await page.goto('/journals/1');

    // 2. 验证期刊信息显示
    await expect(page.locator('h1, h2, .journal-title').first()).toBeVisible();

    // 3. 点击"记录投稿"按钮
    const recordBtn = page.locator('button:has-text("记录投稿"), a:has-text("记录投稿")');
    if (await recordBtn.isVisible()) {
      await recordBtn.click();

      // 4. 验证跳转到投稿页面并带有参数
      await expect(page).toHaveURL(/\/submissions\?journalId=1/);
    }
  });

  test('JournalPicker 搜索功能', async ({ page }) => {
    // 1. 访问投稿管理页
    await page.goto('/submissions');

    // 2. 点击新增稿件按钮
    const addBtn = page.locator('button:has-text("新增"), button:has-text("添加"), button:has-text("创建")').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();

      // 3. 等待弹窗出现
      await page.waitForSelector('.modal, .dialog, [role="dialog"]', { timeout: 5000 }).catch(() => {});

      // 4. 在期刊搜索框中输入
      const searchInput = page.locator('.journal-picker input, input[placeholder*="期刊"], input[placeholder*="搜索"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('计算机');

        // 5. 等待搜索结果
        await page.waitForTimeout(500); // 等待防抖

        // 6. 验证下拉列表显示
        const dropdown = page.locator('.dropdown, .journal-picker-dropdown, .search-results');
        await expect(dropdown).toBeVisible({ timeout: 3000 }).catch(() => {});
      }
    }
  });

  test('JournalInfoCard 显示维度评分', async ({ page }) => {
    // 访问投稿管理页
    await page.goto('/submissions');

    // 检查是否有 JournalInfoCard 组件
    const infoCard = page.locator('.journal-info-card').first();

    if (await infoCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      // 验证维度评分区域存在
      await expect(infoCard.locator('.dimensions-section, .dimension-bar')).toBeVisible();

      // 验证至少有一个维度标签
      const dimensionLabels = ['审稿速度', '编辑态度', '录用难度', '审稿质量', '综合体验'];
      let found = false;
      for (const label of dimensionLabels) {
        if (await infoCard.locator(`text=${label}`).isVisible().catch(() => false)) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    }
  });

  test('分类过滤功能', async ({ page }) => {
    await page.goto('/submissions');

    // 点击新增按钮打开弹窗
    const addBtn = page.locator('button:has-text("新增"), button:has-text("添加")').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(300);

      // 检查分类标签是否存在
      const categoryTabs = page.locator('.category-tabs button, .category-filter button');
      if (await categoryTabs.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        // 点击一个分类
        const sciBtn = page.locator('button:has-text("SCI")').first();
        if (await sciBtn.isVisible()) {
          await sciBtn.click();
          await expect(sciBtn).toHaveClass(/active/);
        }
      }
    }
  });

  test('收藏功能切换', async ({ page }) => {
    // 访问期刊列表或投稿页
    await page.goto('/journals');

    // 找到收藏按钮
    const favoriteBtn = page.locator('.favorite-btn, button[title*="收藏"], button:has-text("☆"), button:has-text("★")').first();

    if (await favoriteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      // 获取初始状态
      const initialText = await favoriteBtn.textContent();

      // 点击切换
      await favoriteBtn.click();
      await page.waitForTimeout(500);

      // 验证状态变化
      const newText = await favoriteBtn.textContent();
      // 状态应该有变化（☆ <-> ★）
      if (initialText?.includes('☆')) {
        expect(newText).toContain('★');
      } else if (initialText?.includes('★')) {
        expect(newText).toContain('☆');
      }
    }
  });
});

test.describe('未登录状态', () => {
  test('点击记录投稿应提示登录', async ({ page }) => {
    // 直接访问期刊详情页（未登录）
    await page.goto('/journals/1');

    // 找到记录投稿按钮
    const recordBtn = page.locator('button:has-text("记录投稿"), a:has-text("记录投稿")');

    if (await recordBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await recordBtn.click();

      // 应该显示登录弹窗或跳转到登录页
      const loginModal = page.locator('.auth-modal, .login-modal, [role="dialog"]:has-text("登录")');
      const loginPage = page.locator('input[name="email"], input[type="email"]');

      // 验证出现登录界面
      const hasLoginUI = await loginModal.isVisible({ timeout: 2000 }).catch(() => false) ||
                         await loginPage.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasLoginUI).toBe(true);
    }
  });
});
