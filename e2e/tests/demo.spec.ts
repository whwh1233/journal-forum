import { test, expect, Page } from '@playwright/test';
import { selectors, searchTerms } from '../fixtures/test-data';

/**
 * 演示测试 - 慢速执行，展示自动化测试效果
 * 每个操作之间有明显的延迟，方便观察
 */

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 高亮元素（视觉反馈）
async function highlight(page: Page, selector: string) {
  try {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLElement;
      if (el) {
        el.style.outline = '3px solid red';
        el.style.outlineOffset = '2px';
        setTimeout(() => {
          el.style.outline = '';
          el.style.outlineOffset = '';
        }, 1000);
      }
    }, selector);
  } catch {
    // 忽略错误
  }
}

test.describe('自动化测试演示', () => {

  test('完整功能演示', async ({ page }, testInfo) => {
    // 设置超长超时
    testInfo.setTimeout(180000); // 3 分钟

    console.log('🚀 开始自动化测试演示...\n');

    // ===== 1. 首页加载 =====
    console.log('1️⃣ 加载首页...');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });
    console.log('   ✅ 首页加载成功');
    await delay(1500);

    // ===== 2. 展开侧边栏 =====
    console.log('\n2️⃣ 展开侧边导航...');
    await highlight(page, selectors.sideNav.toggle);
    await delay(800);
    await page.locator(selectors.sideNav.toggle).click();
    await delay(1000);
    console.log('   ✅ 侧边栏已展开');

    // ===== 3. 浏览期刊列表（带滚动） =====
    console.log('\n3️⃣ 浏览期刊列表...');
    const journalCards = page.locator(selectors.journal.card);
    const cardCount = await journalCards.count();
    console.log(`   📚 发现 ${cardCount} 个期刊`);

    // 先滚动到页面底部
    console.log('   📜 滚动浏览页面...');
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 300);
      await delay(600);
    }

    // 滚动回顶部
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await delay(1000);

    // 滚动浏览前几个期刊
    for (let i = 0; i < Math.min(3, cardCount); i++) {
      const card = journalCards.nth(i);
      await card.scrollIntoViewIfNeeded();
      await highlight(page, `${selectors.journal.card}:nth-child(${i + 1})`);
      const title = await card.locator(selectors.journal.title).textContent();
      console.log(`   📖 期刊 ${i + 1}: ${title}`);
      await delay(1000);
    }

    // ===== 4. 打开期刊详情 =====
    console.log('\n4️⃣ 打开期刊详情...');
    const firstCard = journalCards.first();
    await highlight(page, selectors.journal.card);
    await delay(800);
    await firstCard.click();
    await page.waitForSelector(selectors.journal.panel + '.open', { timeout: 5000 });
    console.log('   ✅ 详情面板已打开');
    await delay(2000);

    // 滚动查看详情内容和评论区
    console.log('   📜 滚动查看评论区...');
    const panelBody = page.locator('.journal-panel-body');
    for (let i = 0; i < 5; i++) {
      await panelBody.evaluate((el) => el.scrollBy({ top: 200, behavior: 'smooth' }));
      await delay(700);
    }
    console.log('   📝 浏览评论列表...');
    await delay(1000);

    // 滚动回顶部
    await panelBody.evaluate((el) => el.scrollTo({ top: 0, behavior: 'smooth' }));
    await delay(800);

    // 关闭详情
    console.log('   🔙 关闭详情面板...');
    await page.locator(selectors.journal.panelClose).click();
    await delay(1000);

    // ===== 5. 搜索功能 =====
    console.log('\n5️⃣ 测试搜索功能...');
    const searchInput = page.locator(selectors.search.input);
    if (await searchInput.isVisible()) {
      await highlight(page, selectors.search.input);
      await delay(800);

      // 逐字输入搜索词
      const searchTerm = searchTerms[0];
      console.log(`   🔍 搜索: "${searchTerm}"`);
      await searchInput.click();
      await delay(500);

      for (const char of searchTerm) {
        await searchInput.type(char);
        await delay(150);
      }
      await delay(500);

      // 点击搜索按钮
      const searchBtn = page.locator(selectors.search.searchBtn);
      if (await searchBtn.isVisible()) {
        await searchBtn.click();
      }
      await delay(1500);

      const resultCount = await journalCards.count();
      console.log(`   📊 搜索结果: ${resultCount} 个期刊`);

      // 清空搜索
      await searchInput.clear();
      await delay(500);
      const clearBtn = page.locator(selectors.search.clearBtn);
      if (await clearBtn.isVisible()) {
        await clearBtn.click();
      }
      await delay(1000);
    }

    // ===== 6. 分类筛选 =====
    console.log('\n6️⃣ 测试分类筛选...');
    const categorySelect = page.locator(selectors.search.categorySelect);
    if (await categorySelect.isVisible()) {
      await highlight(page, selectors.search.categorySelect);
      await delay(800);
      await categorySelect.selectOption({ index: 1 });
      console.log('   📂 选择学科分类');
      await delay(1500);

      // 选择评分筛选
      const ratingSelect = page.locator(selectors.search.ratingSelect);
      if (await ratingSelect.isVisible()) {
        await highlight(page, selectors.search.ratingSelect);
        await delay(800);
        await ratingSelect.selectOption({ index: 1 });
        console.log('   ⭐ 选择评分筛选');
        await delay(1500);
      }

      // 重置筛选
      const clearBtn = page.locator(selectors.search.clearBtn);
      if (await clearBtn.isVisible()) {
        await clearBtn.click();
        console.log('   🔄 清除筛选');
      }
      await delay(1000);
    }

    // ===== 7. 打开登录弹窗 =====
    console.log('\n7️⃣ 测试登录功能...');
    const topBarLoginBtn = page.locator(selectors.topBar.loginBtn);
    if (await topBarLoginBtn.isVisible()) {
      await highlight(page, selectors.topBar.loginBtn);
      await delay(800);
      await topBarLoginBtn.click();
      await page.waitForSelector(selectors.auth.loginForm, { timeout: 5000 });
      console.log('   ✅ 登录弹窗已打开');
      await delay(1500);

      // 填写表单（演示）
      console.log('   📝 填写登录表单...');
      const emailInput = page.locator(selectors.auth.emailInput);
      const passwordInput = page.locator(selectors.auth.passwordInput);

      await highlight(page, selectors.auth.emailInput);
      await delay(500);
      await emailInput.fill('demo@example.com');
      await delay(800);

      await highlight(page, selectors.auth.passwordInput);
      await delay(500);
      await passwordInput.fill('password123');
      await delay(800);

      // 切换到注册
      console.log('   🔄 切换到注册表单...');
      const switchLink = page.locator(selectors.auth.switchToRegister);
      await highlight(page, selectors.auth.switchToRegister);
      await delay(800);
      await switchLink.click();
      await delay(1500);

      // 关闭弹窗（按 Escape）
      console.log('   ❌ 关闭登录弹窗...');
      await page.keyboard.press('Escape');
      await delay(1000);
    }

    // ===== 8. 主题切换 =====
    console.log('\n8️⃣ 测试主题切换...');
    const themeTrigger = page.locator(selectors.theme.trigger);
    if (await themeTrigger.isVisible()) {
      await highlight(page, selectors.theme.trigger);
      await delay(800);
      await themeTrigger.click();
      await delay(1000);

      const themeOptions = page.locator(selectors.theme.option);
      const themeCount = await themeOptions.count();
      console.log(`   🎨 发现 ${themeCount} 个主题`);

      // 依次预览每个主题
      for (let i = 0; i < Math.min(themeCount, 6); i++) {
        const option = themeOptions.nth(i);
        await option.click();
        console.log(`   ✨ 切换到主题 ${i + 1}`);
        await delay(1000);

        // 重新打开主题选择器（因为选择后会关闭）
        if (i < Math.min(themeCount, 6) - 1) {
          await themeTrigger.click();
          await delay(500);
        }
      }
    }

    // ===== 9. 再次浏览期刊 =====
    console.log('\n9️⃣ 继续浏览期刊...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);

    // 点击第二个期刊
    if (cardCount > 1) {
      const secondCard = journalCards.nth(1);
      await secondCard.scrollIntoViewIfNeeded();
      await highlight(page, `${selectors.journal.card}:nth-child(2)`);
      await delay(800);
      await secondCard.click();
      await page.waitForSelector(selectors.journal.panel + '.open', { timeout: 5000 });
      console.log('   📖 打开第二个期刊详情');
      await delay(2000);

      await page.locator(selectors.journal.panelClose).click();
      await delay(1000);
    }

    // ===== 10. 收起侧边栏 =====
    console.log('\n🔟 收起侧边导航...');
    await page.locator(selectors.sideNav.toggle).click();
    await delay(1000);

    console.log('\n🎉 自动化测试演示完成！');
    console.log('==========================================');
  });
});
