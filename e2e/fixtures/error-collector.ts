import { Page, Response } from '@playwright/test';

/**
 * 用户操作步骤记录
 */
export interface ActionStep {
  timestamp: number;
  action: string;
  selector?: string;
  value?: string;
  screenshot?: string;
}

/**
 * 收集的错误信息
 */
export interface CollectedError {
  type: 'js' | 'api' | 'console';
  message: string;
  stack?: string;
  url: string;
  timestamp: number;
  steps: ActionStep[];
  screenshot?: string;
}

/**
 * 错误报告
 */
export interface ErrorReport {
  totalErrors: number;
  jsErrors: CollectedError[];
  apiErrors: CollectedError[];
  consoleErrors: CollectedError[];
}

/**
 * 错误收集器 - 用于 E2E 测试中收集和报告各类错误
 */
export class ErrorCollector {
  private page: Page;
  private errors: CollectedError[] = [];
  private steps: ActionStep[] = [];
  private isStarted = false;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * 启动错误收集器，附加各类错误监听器
   */
  async start(): Promise<void> {
    if (this.isStarted) return;
    this.isStarted = true;

    // 监听 JavaScript 错误
    this.page.on('pageerror', async (error) => {
      await this.captureError('js', error.message, error.stack);
    });

    // 监听控制台错误
    this.page.on('console', async (msg) => {
      if (msg.type() === 'error') {
        await this.captureError('console', msg.text());
      }
    });

    // 监听 API 响应错误
    this.page.on('response', async (response: Response) => {
      const status = response.status();
      if (status >= 400) {
        const url = response.url();
        let body = '';
        try {
          body = await response.text();
        } catch {
          // 忽略读取响应体失败
        }
        await this.captureError(
          'api',
          `HTTP ${status}: ${response.statusText()} - ${url}`,
          body
        );
      }
    });

    // 监听请求失败
    this.page.on('requestfailed', async (request) => {
      const failure = request.failure();
      if (failure) {
        await this.captureError(
          'api',
          `Request failed: ${request.url()} - ${failure.errorText}`
        );
      }
    });
  }

  /**
   * 记录用户操作步骤
   */
  recordStep(action: string, selector?: string, value?: string): void {
    const step: ActionStep = {
      timestamp: Date.now(),
      action,
      selector,
      value,
    };
    this.steps.push(step);

    // 保留最近 20 步操作
    if (this.steps.length > 20) {
      this.steps.shift();
    }
  }

  /**
   * 捕获错误并截图
   */
  async captureError(
    type: 'js' | 'api' | 'console',
    message: string,
    stack?: string
  ): Promise<void> {
    let screenshot: string | undefined;

    try {
      const buffer = await this.page.screenshot({ type: 'png' });
      screenshot = `data:image/png;base64,${buffer.toString('base64')}`;
    } catch {
      // 截图失败时忽略
    }

    const error: CollectedError = {
      type,
      message,
      stack,
      url: this.page.url(),
      timestamp: Date.now(),
      steps: [...this.steps], // 复制当前步骤快照
      screenshot,
    };

    this.errors.push(error);
  }

  /**
   * 获取所有收集的错误
   */
  getErrors(): CollectedError[] {
    return [...this.errors];
  }

  /**
   * 检查是否有错误
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * 生成错误报告
   */
  getReport(): ErrorReport {
    const jsErrors = this.errors.filter((e) => e.type === 'js');
    const apiErrors = this.errors.filter((e) => e.type === 'api');
    const consoleErrors = this.errors.filter((e) => e.type === 'console');

    return {
      totalErrors: this.errors.length,
      jsErrors,
      apiErrors,
      consoleErrors,
    };
  }

  /**
   * 生成 Playwright 复现脚本
   */
  generateReproScript(error?: CollectedError): string {
    const targetError = error || this.errors[this.errors.length - 1];
    if (!targetError) {
      return '// 没有可复现的错误';
    }

    const lines: string[] = [
      "import { test, expect } from '@playwright/test';",
      '',
      "test('reproduce error', async ({ page }) => {",
      `  // 错误发生时间: ${new Date(targetError.timestamp).toISOString()}`,
      `  // 错误类型: ${targetError.type}`,
      `  // 错误信息: ${targetError.message}`,
      '',
      `  await page.goto('${targetError.url.split('?')[0]}');`,
      '',
      '  // 重现步骤:',
    ];

    for (const step of targetError.steps) {
      const comment = `  // ${new Date(step.timestamp).toLocaleTimeString()}`;
      lines.push(comment);

      switch (step.action) {
        case 'click':
          if (step.selector) {
            lines.push(`  await page.locator('${step.selector}').click();`);
          }
          break;
        case 'fill':
        case 'type':
          if (step.selector && step.value) {
            lines.push(
              `  await page.locator('${step.selector}').fill('${step.value.replace(/'/g, "\\'")}');`
            );
          }
          break;
        case 'navigate':
          if (step.value) {
            lines.push(`  await page.goto('${step.value}');`);
          }
          break;
        case 'scroll':
          lines.push(`  await page.mouse.wheel(0, ${step.value || 300});`);
          break;
        default:
          lines.push(`  // ${step.action}: ${step.selector || ''} ${step.value || ''}`);
      }
    }

    lines.push('');
    lines.push('  // 此处应该触发错误');
    lines.push(`  // 预期错误: ${targetError.message}`);
    lines.push('});');

    return lines.join('\n');
  }

  /**
   * 控制台输出格式化报告
   */
  printReport(): void {
    const report = this.getReport();

    console.log('\n========================================');
    console.log('         ERROR COLLECTOR REPORT         ');
    console.log('========================================\n');

    if (report.totalErrors === 0) {
      console.log('No errors collected.');
      return;
    }

    console.log(`Total Errors: ${report.totalErrors}`);
    console.log(`  - JS Errors: ${report.jsErrors.length}`);
    console.log(`  - API Errors: ${report.apiErrors.length}`);
    console.log(`  - Console Errors: ${report.consoleErrors.length}`);
    console.log('');

    if (report.jsErrors.length > 0) {
      console.log('--- JS Errors ---');
      for (const err of report.jsErrors) {
        console.log(`  [${new Date(err.timestamp).toLocaleTimeString()}] ${err.message}`);
        if (err.stack) {
          console.log(`    Stack: ${err.stack.split('\n')[0]}`);
        }
        console.log(`    URL: ${err.url}`);
        console.log(`    Steps before error: ${err.steps.length}`);
      }
      console.log('');
    }

    if (report.apiErrors.length > 0) {
      console.log('--- API Errors ---');
      for (const err of report.apiErrors) {
        console.log(`  [${new Date(err.timestamp).toLocaleTimeString()}] ${err.message}`);
        if (err.stack) {
          // 对于 API 错误，stack 包含响应体
          const preview = err.stack.slice(0, 200);
          console.log(`    Response: ${preview}${err.stack.length > 200 ? '...' : ''}`);
        }
      }
      console.log('');
    }

    if (report.consoleErrors.length > 0) {
      console.log('--- Console Errors ---');
      for (const err of report.consoleErrors) {
        console.log(`  [${new Date(err.timestamp).toLocaleTimeString()}] ${err.message}`);
        console.log(`    URL: ${err.url}`);
      }
      console.log('');
    }

    console.log('========================================\n');
  }

  /**
   * 清空收集的错误和步骤
   */
  clear(): void {
    this.errors = [];
    this.steps = [];
  }

  /**
   * 停止收集器（移除监听器）
   */
  stop(): void {
    this.isStarted = false;
    // Playwright 的 page 事件监听器会在页面关闭时自动清理
  }
}

/**
 * 工厂函数 - 创建错误收集器实例
 */
export function createErrorCollector(page: Page): ErrorCollector {
  return new ErrorCollector(page);
}

/**
 * 便捷函数 - 创建并启动错误收集器
 */
export async function startErrorCollector(page: Page): Promise<ErrorCollector> {
  const collector = createErrorCollector(page);
  await collector.start();
  return collector;
}
