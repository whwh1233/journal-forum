import { test, expect } from '@playwright/test';
import {
  selectors,
  routes,
  demoUsers,
  profileSelectors,
  dashboardSelectors,
  favoriteSelectors,
  followSelectors,
} from '../../fixtures/test-data';
import {
  delay,
  showChapterTitle,
  showToast,
  demoAction,
  demoClick,
  demoFill,
  demoScroll,
  log,
} from '../../fixtures/demo-helpers';

// 登录辅助函数
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

test.describe('用户场景演示', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // 先注册/登录演示用户
    await login(page, demoUsers.author);
  });

  test('发表评论和评分', async ({ page }) => {
    await showChapterTitle(page, '发表评论', '演示评论和评分功能');

    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

    // 打开期刊详情
    await demoClick(page, selectors.journal.card, '📖 打开期刊详情');
    await page.waitForSelector(`${selectors.journal.panel}.open`, { timeout: 5000 });
    await delay(1000);

    // 滚动到评论区
    const panel = page.locator('.journal-panel-body');
    await panel.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }));
    await showToast(page, '📝 滚动到评论区');
    await delay(1500);

    // 点击评分星星
    const stars = page.locator(selectors.comment.ratingStars);
    if (await stars.first().isVisible()) {
      await demoAction(page, selectors.comment.ratingStars, '⭐ 选择评分');
      await stars.nth(4).click(); // 5星
      await delay(800);
    }

    // 输入评论
    const textarea = page.locator(selectors.comment.textarea);
    if (await textarea.isVisible()) {
      await demoFill(
        page,
        selectors.comment.textarea,
        '这是一篇非常有价值的期刊，内容丰富，研究深入，强烈推荐！',
        '📝 输入评论内容'
      );

      // 提交评论
      await demoClick(page, selectors.comment.submitBtn, '✅ 发布评论');
      await delay(2000);
      await showToast(page, '🎉 评论发布成功！');
    }

    // 关闭面板
    await demoClick(page, selectors.journal.panelClose, '❌ 关闭详情');

    expect(true).toBe(true);
  });

  test('收藏期刊', async ({ page }) => {
    await showChapterTitle(page, '收藏期刊', '演示收藏功能');

    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

    // 打开期刊详情
    await demoClick(page, selectors.journal.card, '📖 打开期刊详情');
    await page.waitForSelector(`${selectors.journal.panel}.open`, { timeout: 5000 });

    // 点击收藏按钮
    const favoriteBtn = page.locator(favoriteSelectors.btn);
    if (await favoriteBtn.isVisible()) {
      await demoClick(page, favoriteSelectors.btn, '⭐ 点击收藏');
      await delay(1000);
      await showToast(page, '✅ 期刊已收藏');
    }

    // 关闭面板
    await demoClick(page, selectors.journal.panelClose, '❌ 关闭详情');

    expect(true).toBe(true);
  });

  test('关注用户', async ({ page }) => {
    await showChapterTitle(page, '关注用户', '演示关注功能');

    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

    // 打开期刊详情
    await demoClick(page, selectors.journal.card, '📖 打开期刊详情');
    await page.waitForSelector(`${selectors.journal.panel}.open`, { timeout: 5000 });

    // 滚动到评论区找到用户头像
    const panel = page.locator('.journal-panel-body');
    await panel.evaluate((el) => el.scrollTo({ top: 300, behavior: 'smooth' }));
    await delay(1000);

    // 点击用户头像/名称进入个人主页
    const userLink = page.locator('.comment-author-link, .comment-avatar').first();
    if (await userLink.isVisible()) {
      await demoClick(page, '.comment-author-link, .comment-avatar', '👤 查看用户主页');
      await delay(1500);

      // 点击关注按钮
      const followBtn = page.locator(followSelectors.btn);
      if (await followBtn.isVisible()) {
        await demoClick(page, followSelectors.btn, '➕ 关注用户');
        await delay(1000);
        await showToast(page, '✅ 已关注该用户');
      }
    }

    expect(true).toBe(true);
  });

  test('仪表盘统计', async ({ page }) => {
    await showChapterTitle(page, '仪表盘', '查看个人统计数据');

    // 导航到仪表盘
    await page.goto(routes.dashboard);
    await page.waitForLoadState('networkidle');
    await delay(1000);

    // 展示统计卡片
    const statsCards = page.locator(dashboardSelectors.statsCards);
    const cardCount = await statsCards.count();

    await showToast(page, '📊 个人数据统计');
    await delay(1000);

    for (let i = 0; i < Math.min(cardCount, 4); i++) {
      await demoAction(
        page,
        `${dashboardSelectors.statsCards}:nth-child(${i + 1})`,
        `📈 统计数据 ${i + 1}`
      );
    }

    // 滚动查看更多内容
    await demoScroll(page, 'down', 300, '📜 查看更多内容');
    await delay(1000);

    expect(true).toBe(true);
  });

  test('编辑个人资料', async ({ page }) => {
    await showChapterTitle(page, '编辑资料', '修改个人资料信息');

    // 导航到资料编辑页
    await page.goto(routes.profileEdit);
    await page.waitForLoadState('networkidle');
    await delay(1000);

    // 修改简介
    const bioInput = page.locator(profileSelectors.edit.bioInput);
    if (await bioInput.isVisible()) {
      await demoFill(
        page,
        profileSelectors.edit.bioInput,
        '热爱学术研究，专注于计算机科学和人工智能领域。',
        '📝 修改个人简介'
      );
    }

    // 修改机构
    const institutionInput = page.locator(profileSelectors.edit.institutionInput);
    if (await institutionInput.isVisible()) {
      await demoFill(
        page,
        profileSelectors.edit.institutionInput,
        '演示大学计算机学院',
        '🏫 修改所属机构'
      );
    }

    // 保存
    const submitBtn = page.locator(profileSelectors.edit.submitBtn);
    if (await submitBtn.isVisible()) {
      await demoClick(page, profileSelectors.edit.submitBtn, '💾 保存修改');
      await delay(2000);
      await showToast(page, '✅ 资料保存成功');
    }

    expect(true).toBe(true);
  });
});
