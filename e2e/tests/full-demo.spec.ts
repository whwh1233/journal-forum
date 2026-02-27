import { test, expect } from '@playwright/test';
import {
  selectors,
  routes,
  searchTerms,
  demoUsers,
  adminSelectors,
  profileSelectors,
  dashboardSelectors,
  favoriteSelectors,
} from '../fixtures/test-data';
import {
  delay,
  showChapterTitle,
  showToast,
  demoAction,
  demoClick,
  demoFill,
  demoType,
  demoScroll,
  highlight,
  log,
} from '../fixtures/demo-helpers';

test.describe('完整功能演示', () => {
  test('全部功能可视化演示', async ({ page }, testInfo) => {
    // 设置超长超时（10分钟）
    testInfo.setTimeout(600000);

    log('🚀', '开始完整功能演示...\n');

    // ==========================================
    // 第 1 幕：游客体验
    // ==========================================
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await showChapterTitle(page, '第 1 幕：游客体验', '浏览、搜索、筛选期刊');

    // 等待期刊加载
    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });
    log('📚', '期刊列表已加载');

    // 展开侧边栏
    await demoClick(page, selectors.sideNav.toggle, '📌 展开侧边导航');
    await delay(800);

    // 滚动浏览
    await demoScroll(page, 'down', 400, '📜 滚动浏览期刊列表');
    await demoScroll(page, 'down', 400);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await delay(800);

    // 搜索功能
    const searchInput = page.locator(selectors.search.input);
    if (await searchInput.isVisible()) {
      await demoType(page, selectors.search.input, searchTerms[0], '🔍 搜索期刊');
      const searchBtn = page.locator(selectors.search.searchBtn);
      if (await searchBtn.isVisible()) {
        await demoClick(page, selectors.search.searchBtn, '🔍 执行搜索');
      } else {
        await searchInput.press('Enter');
      }
      await delay(1500);

      // 清除搜索
      await searchInput.clear();
      const clearBtn = page.locator(selectors.search.clearBtn);
      if (await clearBtn.isVisible()) {
        await clearBtn.click();
      }
      await delay(800);
    }

    // 分类筛选
    const categorySelect = page.locator(selectors.search.categorySelect);
    if (await categorySelect.isVisible()) {
      await demoAction(page, selectors.search.categorySelect, '📂 选择学科分类');
      await categorySelect.selectOption({ index: 1 });
      await delay(1200);

      const clearBtn = page.locator(selectors.search.clearBtn);
      if (await clearBtn.isVisible()) {
        await clearBtn.click();
      }
      await delay(800);
    }

    // 查看期刊详情
    await demoClick(page, selectors.journal.card, '📖 查看期刊详情');
    await page.waitForSelector(`${selectors.journal.panel}.open`, { timeout: 5000 });
    await delay(1000);

    // 滚动查看内容
    const panelBody = page.locator('.journal-panel-body');
    for (let i = 0; i < 3; i++) {
      await panelBody.evaluate((el) => el.scrollBy({ top: 200, behavior: 'smooth' }));
      await delay(500);
    }
    await showToast(page, '📝 查看评论区');
    await delay(1000);

    // 尝试评论（未登录）
    const loginPrompt = page.locator(selectors.comment.loginPrompt);
    if (await loginPrompt.isVisible()) {
      await demoAction(page, selectors.comment.loginPrompt, '🔒 需要登录才能评论');
    }

    // 关闭详情
    await demoClick(page, selectors.journal.panelClose, '❌ 关闭详情面板');
    await delay(500);

    // ==========================================
    // 第 2 幕：用户注册
    // ==========================================
    await showChapterTitle(page, '第 2 幕：用户注册', '注册新账户');

    // 打开登录弹窗
    await demoClick(page, selectors.topBar.loginBtn, '👤 点击登录');
    await page.waitForSelector(selectors.auth.loginForm, { timeout: 5000 });

    // 切换到注册
    await demoClick(page, selectors.auth.switchToRegister, '🔄 切换到注册');
    await delay(500);

    // 填写注册表单
    const nameInput = page.locator('input#name');
    if (await nameInput.isVisible()) {
      await demoFill(page, 'input#name', demoUsers.newUser.name, '📝 输入用户名');
    }
    await demoFill(page, selectors.auth.emailInput, demoUsers.newUser.email, '📧 输入邮箱');
    await demoFill(page, selectors.auth.passwordInput, demoUsers.newUser.password, '🔑 输入密码');

    const confirmInput = page.locator('input#confirmPassword');
    if (await confirmInput.isVisible()) {
      await demoFill(page, 'input#confirmPassword', demoUsers.newUser.password, '🔑 确认密码');
    }

    // 提交注册
    await demoClick(page, selectors.auth.submitBtn, '✅ 提交注册');
    await delay(2500);

    // ==========================================
    // 第 3 幕：用户功能
    // ==========================================
    await showChapterTitle(page, '第 3 幕：用户功能', '评论、收藏、关注');

    // 打开期刊详情
    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });
    await demoClick(page, selectors.journal.card, '📖 查看期刊详情');
    await page.waitForSelector(`${selectors.journal.panel}.open`, { timeout: 5000 });

    // 滚动到评论区
    const panel = page.locator('.journal-panel-body');
    await panel.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }));
    await delay(1000);

    // 评分
    const stars = page.locator(selectors.comment.ratingStars);
    if (await stars.first().isVisible()) {
      await demoAction(page, selectors.comment.ratingStars, '⭐ 选择评分');
      await stars.nth(4).click();
      await delay(600);
    }

    // 发表评论
    const textarea = page.locator(selectors.comment.textarea);
    if (await textarea.isVisible()) {
      await demoFill(
        page,
        selectors.comment.textarea,
        '这是一篇非常有价值的期刊！',
        '📝 输入评论'
      );
      await demoClick(page, selectors.comment.submitBtn, '✅ 发布评论');
      await delay(2000);
    }

    // 收藏期刊
    await panel.evaluate((el) => el.scrollTo({ top: 0, behavior: 'smooth' }));
    await delay(500);
    const favoriteBtn = page.locator(favoriteSelectors.btn);
    if (await favoriteBtn.isVisible()) {
      await demoClick(page, favoriteSelectors.btn, '⭐ 收藏期刊');
      await delay(1000);
    }

    // 关闭详情
    await demoClick(page, selectors.journal.panelClose, '❌ 关闭详情');
    await delay(500);

    // 进入仪表盘
    await showToast(page, '📊 进入仪表盘');
    await page.goto(routes.dashboard);
    await page.waitForLoadState('networkidle');
    await delay(1500);

    // 展示统计数据
    const statsCards = page.locator(dashboardSelectors.statsCards);
    const cardCount = await statsCards.count();
    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      await demoAction(page, `${dashboardSelectors.statsCards}:nth-child(${i + 1})`, `📈 统计 ${i + 1}`);
    }

    // 编辑个人资料
    await showToast(page, '✏️ 编辑个人资料');
    await page.goto(routes.profileEdit);
    await page.waitForLoadState('networkidle');
    await delay(1000);

    const bioInput = page.locator(profileSelectors.edit.bioInput);
    if (await bioInput.isVisible()) {
      await demoFill(page, profileSelectors.edit.bioInput, '热爱学术研究', '📝 修改简介');
    }

    const submitBtn = page.locator(profileSelectors.edit.submitBtn);
    if (await submitBtn.isVisible()) {
      await demoClick(page, profileSelectors.edit.submitBtn, '💾 保存修改');
      await delay(2000);
    }

    // 退出登录
    await showToast(page, '👋 退出登录');
    await page.goto('/');
    const userDropdown = page.locator(selectors.topBar.userDropdown);
    if (await userDropdown.isVisible()) {
      await userDropdown.click();
      await delay(500);
      const logoutBtn = page.locator('button:has-text("退出")');
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await delay(1500);
      }
    }

    // ==========================================
    // 第 4 幕：主题切换
    // ==========================================
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await showChapterTitle(page, '第 4 幕：主题切换', '切换视觉主题');

    const themeTrigger = page.locator(selectors.theme.trigger);
    if (await themeTrigger.isVisible()) {
      await demoClick(page, selectors.theme.trigger, '🎨 打开主题选择器');
      await delay(300);

      const themeOptions = page.locator(selectors.theme.option);
      const themeCount = await themeOptions.count();

      // 点击主题后面板会关闭，需要重新打开
      for (let i = 0; i < Math.min(themeCount, 4); i++) {
        const panel = page.locator('.theme-picker-panel');
        if (!(await panel.isVisible())) {
          await themeTrigger.click();
          await delay(200);
        }
        await page.locator(selectors.theme.option).nth(i).click();
        await showToast(page, `✨ 主题 ${i + 1}`);
        await delay(500);
      }
    }

    // ==========================================
    // 第 5 幕：管理后台
    // ==========================================
    await showChapterTitle(page, '第 5 幕：管理后台', '管理员功能演示');

    // 管理员登录
    await page.goto('/');
    const loginBtn = page.locator(selectors.topBar.loginBtn);
    if (await loginBtn.isVisible()) {
      await demoClick(page, selectors.topBar.loginBtn, '👤 管理员登录');
      await page.waitForSelector(selectors.auth.loginForm, { timeout: 5000 });
      await demoFill(page, selectors.auth.emailInput, demoUsers.admin.email, '📧 管理员邮箱');
      await demoFill(page, selectors.auth.passwordInput, demoUsers.admin.password, '🔑 管理员密码');
      await demoClick(page, selectors.auth.submitBtn, '✅ 登录');
      await delay(2000);
    }

    // 用户管理
    await showToast(page, '👥 用户管理');
    await page.goto(routes.admin.users);
    await page.waitForLoadState('networkidle');
    await delay(1500);
    await demoAction(page, adminSelectors.users.table, '📋 用户列表');
    await delay(1000);

    // 期刊管理
    await showToast(page, '📚 期刊管理');
    await page.goto(routes.admin.journals);
    await page.waitForLoadState('networkidle');
    await delay(1500);
    await demoAction(page, adminSelectors.journals.table, '📋 期刊列表');
    await delay(1000);

    // 评论管理
    await showToast(page, '💬 评论管理');
    await page.goto(routes.admin.comments);
    await page.waitForLoadState('networkidle');
    await delay(1500);

    const commentTable = page.locator(adminSelectors.comments.table);
    if (await commentTable.isVisible()) {
      await demoAction(page, adminSelectors.comments.table, '📋 评论列表');
    }
    await delay(1000);

    // ==========================================
    // 演示结束
    // ==========================================
    await showChapterTitle(page, '演示完成', '感谢观看！');

    log('🎉', '完整功能演示结束！');

    expect(true).toBe(true);
  });
});
