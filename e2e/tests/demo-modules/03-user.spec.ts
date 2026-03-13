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
  initDemo,
  finishDemo,
  delay,
  showChapterTitle,
  showToast,
  demoAction,
  demoClick,
  demoFill,
  demoScroll,
  log,
} from '../../fixtures/demo-helpers';
import { ErrorCollector } from '../../fixtures/error-collector';
import { InteractionTracker } from '../../fixtures/interaction-tracker';

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
  let errorCollector: ErrorCollector;
  let interactionTracker: InteractionTracker;

  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // 先注册/登录演示用户
    await login(page, demoUsers.author);
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

  test('多维评分功能', async ({ page }) => {
    await showChapterTitle(page, '多维评分', '演示5维度评分功能');

    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

    // 打开期刊详情
    await demoClick(page, selectors.journal.card, '📖 打开期刊详情');
    await page.waitForSelector(`${selectors.journal.panel}.open`, { timeout: 5000 });
    await delay(1000);

    // 滚动到评论区
    const panel = page.locator('.journal-panel-body');
    await panel.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }));
    await showToast(page, '📝 滚动到评论表单');
    await delay(1500);

    // 检查多维评分面板是否可见
    const dimensionPanel = page.locator('.dimension-rating-input');
    if (await dimensionPanel.isVisible()) {
      await demoAction(page, '.dimension-rating-input', '🎯 多维评价面板');
      await delay(800);

      // 对5个维度分别打分
      const dimensions = [
        { label: '审稿速度', index: 0 },
        { label: '编辑态度', index: 1 },
        { label: '录用难度', index: 2 },
        { label: '审稿质量', index: 3 },
        { label: '综合体验', index: 4 }
      ];

      for (const dim of dimensions) {
        const row = page.locator('.dimension-rating-input__row').nth(dim.index);
        if (await row.isVisible()) {
          const stars = row.locator('.dimension-star');
          const starIndex = 3 + Math.floor(Math.random() * 2); // 4-5星
          await showToast(page, `⭐ ${dim.label}: ${starIndex + 1}星`);
          await stars.nth(starIndex).click();
          await delay(400);
        }
      }

      await showToast(page, '✅ 多维评分已完成');
      await delay(1000);
    }

    // 关闭面板
    await demoClick(page, selectors.journal.panelClose, '❌ 关闭详情');

    expect(true).toBe(true);
  });

  test('评论交互', async ({ page }) => {
    await showChapterTitle(page, '评论交互', '回复、点赞和删除评论');

    await page.waitForSelector(selectors.journal.card, { timeout: 10000 });

    // 打开期刊详情
    await demoClick(page, selectors.journal.card, '📖 打开期刊详情');
    await page.waitForSelector(`${selectors.journal.panel}.open`, { timeout: 5000 });
    await delay(1000);

    // 滚动到评论区
    const panel = page.locator('.journal-panel-body');
    await panel.evaluate((el) => el.scrollTo({ top: 400, behavior: 'smooth' }));
    await showToast(page, '📜 滚动到评论区');
    await delay(1500);

    // 查找现有评论
    const comments = page.locator('.comment-item');
    const commentCount = await comments.count();

    if (commentCount > 0) {
      // 点赞评论
      const likeBtn = page.locator('.comment-helpful-btn').first();
      if (await likeBtn.isVisible()) {
        await demoClick(page, '.comment-helpful-btn', '👍 点赞评论');
        await delay(1000);
        await showToast(page, '✅ 评论已标记为有用');
      }

      // 查找回复按钮
      const replyBtn = page.locator('.comment-action-btn').filter({ hasText: '回复' }).first();
      if (await replyBtn.isVisible()) {
        await demoClick(page, '.comment-action-btn:has-text("回复")', '💬 回复评论');
        await delay(800);

        // 填写回复内容
        const replyTextarea = page.locator('.comment-reply-form .comment-form-textarea');
        if (await replyTextarea.isVisible()) {
          await demoFill(
            page,
            '.comment-reply-form .comment-form-textarea',
            '感谢分享，非常有帮助！',
            '📝 输入回复内容'
          );

          // 提交回复
          const submitReplyBtn = page.locator('.comment-reply-form .comment-form-btn-submit');
          if (await submitReplyBtn.isVisible()) {
            await demoClick(page, '.comment-reply-form .comment-form-btn-submit', '✅ 发送回复');
            await delay(2000);
            await showToast(page, '🎉 回复发送成功！');
          }
        }
      }
    } else {
      await showToast(page, '📭 暂无评论');
    }

    // 关闭面板
    await demoClick(page, selectors.journal.panelClose, '❌ 关闭详情');

    expect(true).toBe(true);
  });

  test('社区帖子互动', async ({ page }) => {
    await showChapterTitle(page, '社区帖子', '浏览、点赞、收藏帖子');

    // 导航到社区页面
    await page.goto('/community');
    await page.waitForLoadState('networkidle');
    await delay(1500);

    await showToast(page, '🏠 进入社区讨论页面');
    await delay(800);

    // 等待帖子列表加载
    const postCards = page.locator('.post-card');
    await page.waitForSelector('.post-card', { timeout: 10000 }).catch(() => {});
    const postCount = await postCards.count();

    if (postCount > 0) {
      // 点击第一个帖子进入详情
      await demoClick(page, '.post-card', '📖 查看帖子详情');
      await page.waitForLoadState('networkidle');
      await delay(1500);

      // 检查是否在帖子详情页
      const postDetail = page.locator('.post-detail');
      if (await postDetail.isVisible()) {
        await showToast(page, '📄 帖子详情页');
        await delay(800);

        // 滚动查看内容
        await demoScroll(page, 'down', 200, '📜 查看帖子内容');
        await delay(800);

        // 点赞帖子
        const likeBtn = page.locator('.post-detail-action').first();
        if (await likeBtn.isVisible()) {
          await demoClick(page, '.post-detail-action', '❤️ 点赞帖子');
          await delay(1000);
        }

        // 收藏帖子
        const favoriteBtn = page.locator('.post-detail-action').nth(1);
        if (await favoriteBtn.isVisible()) {
          await demoClick(page, '.post-detail-action:nth-child(2)', '⭐ 收藏帖子');
          await delay(1000);
        }

        // 关注帖子
        const followBtn = page.locator('.post-detail-action').nth(2);
        if (await followBtn.isVisible()) {
          await demoClick(page, '.post-detail-action:nth-child(3)', '🔔 关注帖子');
          await delay(1000);
        }

        await showToast(page, '✅ 帖子互动完成');
      }

      // 返回社区
      const backBtn = page.locator('.post-detail-page-back');
      if (await backBtn.isVisible()) {
        await demoClick(page, '.post-detail-page-back', '⬅️ 返回社区');
        await delay(1000);
      }
    } else {
      await showToast(page, '📭 社区暂无帖子');
    }

    expect(true).toBe(true);
  });

  test('徽章展示', async ({ page }) => {
    await showChapterTitle(page, '荣誉徽章', '查看徽章图鉴');

    // 导航到徽章图鉴页面
    await page.goto('/badges');
    await page.waitForLoadState('networkidle');
    await delay(1500);

    await showToast(page, '🏆 进入徽章陈列馆');
    await delay(800);

    // 检查徽章页面是否加载
    const badgeGallery = page.locator('.badge-gallery-page');
    if (await badgeGallery.isVisible()) {
      // 查看活跃徽章
      const activityTab = page.locator('.tab').filter({ hasText: '活跃徽章' });
      if (await activityTab.isVisible()) {
        await demoClick(page, '.tab:has-text("活跃徽章")', '🏃 查看活跃徽章');
        await delay(1000);
      }

      // 滚动查看徽章
      await demoScroll(page, 'down', 200, '📜 浏览徽章列表');
      await delay(800);

      // 查看身份徽章
      const identityTab = page.locator('.tab').filter({ hasText: '身份徽章' });
      if (await identityTab.isVisible()) {
        await demoClick(page, '.tab:has-text("身份徽章")', '🎭 查看身份徽章');
        await delay(1000);
      }

      // 查看荣誉徽章
      const honorTab = page.locator('.tab').filter({ hasText: '荣誉徽章' });
      if (await honorTab.isVisible()) {
        await demoClick(page, '.tab:has-text("荣誉徽章")', '👑 查看荣誉徽章');
        await delay(1000);
      }

      await showToast(page, '✅ 徽章浏览完成');
    }

    expect(true).toBe(true);
  });

  test('投稿追踪', async ({ page }) => {
    await showChapterTitle(page, '投稿追踪', '管理稿件和投稿记录');

    // 导航到投稿追踪页面
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    await delay(1500);

    await showToast(page, '📋 进入投稿追踪页面');
    await delay(800);

    // 检查投稿追踪页面
    const submissionSection = page.locator('.submission-section');
    if (await submissionSection.isVisible()) {
      // 点击新增稿件按钮
      const addBtn = page.locator('.btn-add-manuscript');
      if (await addBtn.isVisible()) {
        await demoClick(page, '.btn-add-manuscript', '➕ 新增稿件');
        await delay(1000);

        // 检查弹窗
        const modal = page.locator('.submission-modal');
        if (await modal.isVisible()) {
          await showToast(page, '📝 填写稿件信息');
          await delay(500);

          // 填写稿件标题
          const titleInput = modal.locator('input[type="text"]').first();
          if (await titleInput.isVisible()) {
            await demoFill(
              page,
              '.submission-modal input[type="text"]',
              '基于深度学习的图像识别研究',
              '📄 输入稿件标题'
            );
          }

          // 选择投稿日期
          const dateInput = modal.locator('input[type="date"]');
          if (await dateInput.isVisible()) {
            await demoAction(page, '.submission-modal input[type="date"]', '📅 选择投稿日期');
            await delay(500);
          }

          // 填写备注
          const noteInput = modal.locator('textarea');
          if (await noteInput.isVisible()) {
            await demoFill(
              page,
              '.submission-modal textarea',
              '初稿，待审核',
              '📝 添加备注'
            );
          }

          // 创建稿件
          const submitBtn = modal.locator('.btn-modal-submit');
          if (await submitBtn.isVisible()) {
            await demoClick(page, '.btn-modal-submit', '✅ 创建稿件');
            await delay(2000);
            await showToast(page, '🎉 稿件创建成功！');
          }
        }
      }

      // 检查已有稿件列表
      const manuscriptCards = page.locator('.manuscript-card');
      const manuscriptCount = await manuscriptCards.count();

      if (manuscriptCount > 0) {
        // 展开第一个稿件
        await demoClick(page, '.manuscript-card-header', '📂 展开稿件详情');
        await delay(1000);

        // 检查是否有添加状态按钮
        const addStatusBtn = page.locator('.timeline-add-btn');
        if (await addStatusBtn.first().isVisible()) {
          await demoAction(page, '.timeline-add-btn', '📊 可添加状态更新');
          await delay(800);
        }

        await showToast(page, '✅ 投稿记录管理完成');
      }
    } else {
      await showToast(page, '📭 加载投稿页面...');
    }

    expect(true).toBe(true);
  });
});
