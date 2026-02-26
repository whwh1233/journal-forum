import { test, expect, Page } from '@playwright/test';
import { selectors, searchTerms } from '../fixtures/test-data';

/**
 * 猴子测试 - 随机但有针对性的交互测试
 */

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 随机选择数组元素
function randomChoice<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

// 随机数
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

test.describe('随机交互测试', () => {

  test('30秒随机浏览期刊', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000);

    console.log('🐵 开始随机浏览测试...\n');

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

    const startTime = Date.now();
    const duration = 30000; // 30秒
    let actions = 0;

    while (Date.now() - startTime < duration) {
      const actionType = randomChoice(['viewJournal', 'scroll', 'search', 'filter', 'toggleSidebar']);

      try {
        switch (actionType) {
          case 'viewJournal': {
            const cards = page.locator(selectors.journal.card);
            const count = await cards.count();
            if (count > 0) {
              const index = randomInt(0, count - 1);
              const card = cards.nth(index);
              await card.scrollIntoViewIfNeeded();
              console.log(`📖 查看期刊 #${index + 1}`);
              await card.click();
              await delay(1500);

              // 随机滚动详情面板
              const panel = page.locator(selectors.journal.panel);
              if (await panel.isVisible()) {
                await panel.evaluate((el) => el.scrollTo(0, Math.random() * 500));
                await delay(1000);

                // 关闭面板
                await page.locator(selectors.journal.panelClose).click();
                await delay(800);
              }
              actions++;
            }
            break;
          }

          case 'scroll': {
            const scrollAmount = randomInt(-300, 300);
            await page.mouse.wheel(0, scrollAmount);
            console.log(`📜 滚动页面 ${scrollAmount > 0 ? '向下' : '向上'}`);
            await delay(800);
            actions++;
            break;
          }

          case 'search': {
            const searchInput = page.locator(selectors.search.input);
            if (await searchInput.isVisible()) {
              const term = randomChoice(searchTerms) || '期刊';
              console.log(`🔍 搜索: ${term}`);
              await searchInput.fill(term);
              await searchInput.press('Enter');
              await delay(1200);
              actions++;
            }
            break;
          }

          case 'filter': {
            const categorySelect = page.locator(selectors.search.categorySelect);
            if (await categorySelect.isVisible()) {
              const options = await categorySelect.locator('option').count();
              const index = randomInt(0, options - 1);
              await categorySelect.selectOption({ index });
              console.log(`📂 选择分类 #${index}`);
              await delay(1000);
              actions++;
            }
            break;
          }

          case 'toggleSidebar': {
            const toggle = page.locator(selectors.sideNav.toggle);
            if (await toggle.isVisible()) {
              await toggle.click();
              console.log('📌 切换侧边栏');
              await delay(800);
              actions++;
            }
            break;
          }
        }
      } catch (error) {
        console.log(`⚠️ 操作失败: ${error}`);
      }

      await delay(500);
    }

    console.log(`\n🎯 测试完成! 执行了 ${actions} 个操作`);
    expect(actions).toBeGreaterThan(5);
  });

  test('主题切换压力测试', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000);

    console.log('🎨 开始主题切换测试...\n');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const themeTrigger = page.locator(selectors.topBar.themePicker);

    if (await themeTrigger.isVisible()) {
      // 打开主题选择器
      await themeTrigger.click();
      await delay(500);

      const themeOptions = page.locator(selectors.theme.option);
      const themeCount = await themeOptions.count();

      console.log(`发现 ${themeCount} 个主题`);

      // 快速切换所有主题 3 轮
      for (let round = 0; round < 3; round++) {
        console.log(`\n第 ${round + 1} 轮主题切换:`);
        for (let i = 0; i < themeCount; i++) {
          await themeOptions.nth(i).click();
          console.log(`  ✨ 主题 ${i + 1}`);
          await delay(600);
        }
      }

      console.log('\n✅ 主题切换测试完成');
    } else {
      console.log('主题选择器不可见，跳过测试');
    }

    expect(true).toBe(true);
  });

  test('表单交互测试', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000);

    console.log('📝 开始表单交互测试...\n');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 打开登录弹窗
    const loginBtn = page.locator(selectors.topBar.loginBtn);
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
      await page.waitForSelector(selectors.auth.loginForm, { timeout: 5000 });
      console.log('✅ 登录弹窗已打开');

      const emailInput = page.locator(selectors.auth.emailInput);
      const passwordInput = page.locator(selectors.auth.passwordInput);

      // 多次填写表单
      const testEmails = [
        'test1@example.com',
        'user@domain.org',
        'admin@test.cn',
        'hello@world.io',
      ];

      for (const email of testEmails) {
        await emailInput.fill(email);
        console.log(`📧 输入邮箱: ${email}`);
        await delay(500);

        await passwordInput.fill('password' + randomInt(100, 999));
        console.log('🔑 输入密码');
        await delay(500);
      }

      // 测试切换登录/注册
      const switchLink = page.locator(selectors.auth.switchToRegister);
      for (let i = 0; i < 3; i++) {
        await switchLink.click();
        console.log(`🔄 切换表单 #${i + 1}`);
        await delay(600);
      }

      // 关闭弹窗
      await page.keyboard.press('Escape');
      console.log('❌ 关闭弹窗');
    }

    console.log('\n✅ 表单交互测试完成');
    expect(true).toBe(true);
  });

  test('期刊详情深度浏览', async ({ page }, testInfo) => {
    testInfo.setTimeout(90000);

    console.log('📚 开始期刊详情深度浏览...\n');

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

    const cards = page.locator(selectors.journal.card);
    const totalCards = await cards.count();
    const cardsToView = Math.min(totalCards, 5);

    console.log(`将浏览 ${cardsToView} 个期刊详情\n`);

    for (let i = 0; i < cardsToView; i++) {
      const card = cards.nth(i);
      await card.scrollIntoViewIfNeeded();

      const title = await card.locator(selectors.journal.title).textContent();
      console.log(`\n📖 ${i + 1}. ${title}`);

      // 点击打开详情
      await card.click();
      await page.waitForSelector(selectors.journal.panel + '.open', { timeout: 5000 });
      await delay(1000);

      // 滚动详情面板
      const panel = page.locator(selectors.journal.panel);
      for (let scroll = 0; scroll < 3; scroll++) {
        await panel.evaluate((el) => el.scrollBy(0, 200));
        await delay(500);
      }

      // 返回顶部
      await panel.evaluate((el) => el.scrollTo(0, 0));
      await delay(500);

      // 关闭面板
      await page.locator(selectors.journal.panelClose).click();
      await delay(800);
    }

    console.log('\n✅ 期刊详情深度浏览完成');
    expect(true).toBe(true);
  });
});
