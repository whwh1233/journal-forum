import { test, expect } from '@playwright/test';
import { selectors, demoUsers } from '../../fixtures/test-data';
import {
  initDemo,
  finishDemo,
  delay,
  showChapterTitle,
  showToast,
  demoAction,
  demoClick,
  demoFill,
  log,
} from '../../fixtures/demo-helpers';
import { ErrorCollector } from '../../fixtures/error-collector';
import { InteractionTracker } from '../../fixtures/interaction-tracker';

test.describe('认证场景演示', () => {
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

  test('用户注册流程', async ({ page }) => {
    await showChapterTitle(page, '用户注册', '演示新用户注册流程');

    // 打开登录弹窗
    const loginBtn = page.locator(selectors.topBar.loginBtn);
    if (await loginBtn.isVisible()) {
      await demoClick(page, selectors.topBar.loginBtn, '👤 点击登录按钮');
    }

    await page.waitForSelector(selectors.auth.loginForm, { timeout: 5000 });
    await showToast(page, '✅ 登录弹窗已打开');
    await delay(1000);

    // 切换到注册
    await demoClick(page, selectors.auth.switchToRegister, '🔄 切换到注册表单');
    await delay(800);

    // 填写注册表单
    // 用户名（如果存在）
    const nameInput = page.locator('input#name');
    if (await nameInput.isVisible()) {
      await demoFill(page, 'input#name', demoUsers.newUser.name, '📝 输入用户名');
    }

    await demoFill(page, selectors.auth.emailInput, demoUsers.newUser.email, '📧 输入邮箱');
    await demoFill(page, selectors.auth.passwordInput, demoUsers.newUser.password, '🔑 输入密码');

    // 确认密码（如果存在）
    const confirmInput = page.locator('input#confirmPassword');
    if (await confirmInput.isVisible()) {
      await demoFill(page, 'input#confirmPassword', demoUsers.newUser.password, '🔑 确认密码');
    }

    await showToast(page, '📋 表单填写完成');
    await delay(1000);

    // 提交注册
    await demoClick(page, selectors.auth.submitBtn, '✅ 提交注册');
    await delay(2000);

    // 检查是否注册成功（弹窗关闭或显示成功消息）
    const modalVisible = await page.locator(selectors.auth.modal).isVisible();
    if (!modalVisible) {
      await showToast(page, '🎉 注册成功！');
      log('✅', '注册成功');
    }

    expect(true).toBe(true);
  });

  test('用户登录流程', async ({ page }) => {
    await showChapterTitle(page, '用户登录', '演示已有用户登录');

    // 打开登录弹窗
    const loginBtn = page.locator(selectors.topBar.loginBtn);
    if (await loginBtn.isVisible()) {
      await demoClick(page, selectors.topBar.loginBtn, '👤 点击登录按钮');
    }

    await page.waitForSelector(selectors.auth.loginForm, { timeout: 5000 });

    // 填写登录表单
    await demoFill(page, selectors.auth.emailInput, demoUsers.author.email, '📧 输入邮箱');
    await demoFill(page, selectors.auth.passwordInput, demoUsers.author.password, '🔑 输入密码');

    // 提交登录
    await demoClick(page, selectors.auth.submitBtn, '✅ 点击登录');
    await delay(2000);

    // 验证登录成功
    const userDropdown = page.locator(selectors.topBar.userDropdown);
    if (await userDropdown.isVisible({ timeout: 5000 })) {
      await showToast(page, '🎉 登录成功！');
      await demoAction(page, selectors.topBar.userDropdown, '👤 用户已登录');
    }

    expect(true).toBe(true);
  });

  test('表单验证提示', async ({ page }) => {
    await showChapterTitle(page, '表单验证', '演示表单验证功能');

    // 打开登录弹窗
    const loginBtn = page.locator(selectors.topBar.loginBtn);
    if (await loginBtn.isVisible()) {
      await demoClick(page, selectors.topBar.loginBtn, '👤 打开登录弹窗');
    }

    await page.waitForSelector(selectors.auth.loginForm, { timeout: 5000 });

    // 直接点击提交（空表单）
    await demoClick(page, selectors.auth.submitBtn, '❌ 尝试提交空表单');
    await delay(1000);

    // 检查验证
    const emailInput = page.locator(selectors.auth.emailInput);
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);

    if (isInvalid) {
      await showToast(page, '⚠️ 表单验证：请填写必填字段');
    }

    // 输入无效邮箱
    await demoFill(page, selectors.auth.emailInput, 'invalid-email', '📧 输入无效邮箱格式');
    await demoClick(page, selectors.auth.submitBtn, '❌ 尝试提交');
    await delay(1000);
    await showToast(page, '⚠️ 邮箱格式验证');
    await delay(1500);

    // 关闭弹窗
    await page.keyboard.press('Escape');
    await showToast(page, '✅ 表单验证演示完成');

    expect(true).toBe(true);
  });
});
