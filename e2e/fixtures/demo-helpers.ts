import { Page } from '@playwright/test';
import { ErrorCollector, ErrorReport, startErrorCollector } from './error-collector';
import { InteractionTracker, CoverageReport, startInteractionTracker } from './interaction-tracker';

// 全局实例，用于在 demo 函数中记录步骤
let currentErrorCollector: ErrorCollector | null = null;
let currentInteractionTracker: InteractionTracker | null = null;

/**
 * Demo 实例接口
 */
export interface DemoInstance {
  errorCollector: ErrorCollector;
  interactionTracker: InteractionTracker;
}

/**
 * Demo 报告接口
 */
export interface DemoReport {
  errorReport: ErrorReport;
  interactionReport: CoverageReport;
}

/**
 * 初始化 Demo 测试 - 创建并启动 ErrorCollector 和 InteractionTracker
 */
export async function initDemo(page: Page, testName: string): Promise<DemoInstance> {
  log('🚀', `初始化 Demo: ${testName}`);

  const errorCollector = await startErrorCollector(page);
  const interactionTracker = await startInteractionTracker(page);

  // 保存全局引用
  currentErrorCollector = errorCollector;
  currentInteractionTracker = interactionTracker;

  // 记录测试开始步骤
  errorCollector.recordStep('test_start', undefined, testName);

  return { errorCollector, interactionTracker };
}

/**
 * 完成 Demo 测试 - 获取报告并打印
 */
export async function finishDemo(): Promise<DemoReport> {
  if (!currentErrorCollector || !currentInteractionTracker) {
    throw new Error('Demo not initialized. Call initDemo() first.');
  }

  // 获取报告
  const errorReport = currentErrorCollector.getReport();
  const interactionReport = await currentInteractionTracker.generateReport();

  // 打印报告
  currentErrorCollector.printReport();
  await currentInteractionTracker.printReport();

  // 停止收集器
  currentErrorCollector.stop();
  currentInteractionTracker.stop();

  // 清除全局引用
  const collector = currentErrorCollector;
  currentErrorCollector = null;
  currentInteractionTracker = null;

  log('✅', `Demo 完成 - 错误: ${errorReport.totalErrors}, 交互覆盖: ${interactionReport.coveragePercent}%`);

  return { errorReport, interactionReport };
}

/**
 * 获取当前 ErrorCollector（内部使用）
 */
function getErrorCollector(): ErrorCollector | null {
  return currentErrorCollector;
}

/**
 * 延迟函数
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 元素高亮（红色边框，1秒后自动消失）
 */
export async function highlight(page: Page, selector: string): Promise<void> {
  try {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLElement;
      if (el) {
        el.style.outline = '3px solid #ff4444';
        el.style.outlineOffset = '2px';
        el.style.transition = 'outline 0.2s ease';
        setTimeout(() => {
          el.style.outline = '';
          el.style.outlineOffset = '';
        }, 1000);
      }
    }, selector);
  } catch {
    // 元素可能不存在，忽略错误
  }
}

/**
 * 浮动文字提示（右上角显示，自动消失）
 */
export async function showToast(page: Page, message: string, duration = 2000): Promise<void> {
  await page.evaluate(([msg, dur]) => {
    // 移除已存在的 toast
    const existing = document.getElementById('demo-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'demo-toast';
    toast.textContent = msg;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      background: rgba(0, 0, 0, 0.9);
      color: #fff;
      padding: 14px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s ease;
    `;
    document.body.appendChild(toast);

    // 动画进入
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });

    // 动画退出并移除
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, dur);
  }, [message, duration] as const);
}

/**
 * 显示章节标题（大字居中显示）
 */
export async function showChapterTitle(page: Page, title: string, subtitle?: string): Promise<void> {
  await page.evaluate(([t, s]) => {
    const overlay = document.createElement('div');
    overlay.id = 'demo-chapter';
    overlay.innerHTML = `
      <div style="font-size: 36px; font-weight: bold; margin-bottom: 10px;">${t}</div>
      ${s ? `<div style="font-size: 18px; opacity: 0.8;">${s}</div>` : ''}
    `;
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 99999;
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      opacity: 0;
      transition: opacity 0.5s ease;
    `;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });

    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 300);
    }, 1200);
  }, [title, subtitle] as const);

  await delay(1500);
}

/**
 * 组合操作：显示提示 + 高亮元素 + 延迟
 */
export async function demoAction(
  page: Page,
  selector: string,
  description: string,
  delayMs = 400
): Promise<void> {
  // 记录操作步骤
  const collector = getErrorCollector();
  if (collector) {
    collector.recordStep('action', selector, description);
  }

  await showToast(page, description);
  await delay(200);
  await highlight(page, selector);
  await delay(delayMs);
}

/**
 * 等待元素并执行演示操作
 */
export async function demoClick(
  page: Page,
  selector: string,
  description: string
): Promise<void> {
  // 记录点击操作步骤
  const collector = getErrorCollector();
  if (collector) {
    collector.recordStep('click', selector, description);
  }

  await demoAction(page, selector, description);
  await page.locator(selector).first().click();
  await delay(500);
}

/**
 * 演示输入操作（逐字输入效果）
 */
export async function demoType(
  page: Page,
  selector: string,
  text: string,
  description: string
): Promise<void> {
  // 记录输入操作步骤
  const collector = getErrorCollector();
  if (collector) {
    collector.recordStep('type', selector, text);
  }

  await showToast(page, description);
  await highlight(page, selector);
  await delay(300);

  const input = page.locator(selector);
  await input.click();

  // 逐字输入
  for (const char of text) {
    await input.type(char, { delay: 50 });
  }

  await delay(500);
}

/**
 * 演示填充操作（快速填充）
 */
export async function demoFill(
  page: Page,
  selector: string,
  text: string,
  description: string
): Promise<void> {
  // 记录填充操作步骤
  const collector = getErrorCollector();
  if (collector) {
    collector.recordStep('fill', selector, text);
  }

  await showToast(page, description);
  await highlight(page, selector);
  await delay(300);
  await page.locator(selector).fill(text);
  await delay(500);
}

/**
 * 演示滚动操作
 */
export async function demoScroll(
  page: Page,
  direction: 'down' | 'up',
  amount = 300,
  description?: string
): Promise<void> {
  // 记录滚动操作步骤
  const collector = getErrorCollector();
  if (collector) {
    collector.recordStep('scroll', direction, String(amount));
  }

  if (description) {
    await showToast(page, description);
  }
  const delta = direction === 'down' ? amount : -amount;
  await page.mouse.wheel(0, delta);
  await delay(600);
}

/**
 * 控制台日志（带格式）
 */
export function log(emoji: string, message: string): void {
  console.log(`${emoji} ${message}`);
}
