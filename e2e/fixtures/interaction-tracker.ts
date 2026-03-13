import { Page } from '@playwright/test';

/**
 * 交互元素信息
 */
export interface InteractedElement {
  selector: string;
  tagName: string;
  text?: string;
  id?: string;
  className?: string;
  interactionCount: number;
  lastInteraction: number;
}

/**
 * 可点击元素信息
 */
export interface ClickableElement {
  selector: string;
  tagName: string;
  text?: string;
  id?: string;
  className?: string;
  isVisible: boolean;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * 覆盖率报告
 */
export interface CoverageReport {
  totalClickable: number;
  totalInteracted: number;
  coveragePercent: number;
  interactedElements: InteractedElement[];
  uninteractedElements: ClickableElement[];
}

/**
 * 交互追踪器 - 追踪页面元素的交互情况
 */
export class InteractionTracker {
  private page: Page;
  private isStarted = false;
  private interactedElements: Map<string, InteractedElement> = new Map();

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * 启动追踪器 - 注入 DOM 追踪脚本
   */
  async start(): Promise<void> {
    if (this.isStarted) return;
    this.isStarted = true;

    // 注入追踪脚本到页面
    await this.page.addInitScript(() => {
      // 全局追踪存储
      (window as unknown as { __interactionTracker: Map<string, unknown> }).__interactionTracker = new Map();

      // 生成元素选择器
      const getSelector = (el: Element): string => {
        if (el.id) {
          return `#${el.id}`;
        }

        const tagName = el.tagName.toLowerCase();
        const classList = Array.from(el.classList).join('.');
        const parent = el.parentElement;

        if (classList) {
          const classSelector = `${tagName}.${classList}`;
          if (parent && parent.querySelectorAll(classSelector).length === 1) {
            return classSelector;
          }
        }

        // 使用 nth-child
        if (parent) {
          const siblings = Array.from(parent.children);
          const index = siblings.indexOf(el) + 1;
          const parentSelector = getSelector(parent);
          return `${parentSelector} > ${tagName}:nth-child(${index})`;
        }

        return tagName;
      };

      // 监听点击事件
      document.addEventListener(
        'click',
        (e) => {
          const target = e.target as Element;
          if (!target) return;

          const selector = getSelector(target);
          const tracker = (window as unknown as { __interactionTracker: Map<string, InteractedElement> }).__interactionTracker;
          const existing = tracker.get(selector);

          if (existing) {
            existing.interactionCount++;
            existing.lastInteraction = Date.now();
          } else {
            tracker.set(selector, {
              selector,
              tagName: target.tagName.toLowerCase(),
              text: (target as HTMLElement).innerText?.slice(0, 50),
              id: target.id || undefined,
              className: target.className || undefined,
              interactionCount: 1,
              lastInteraction: Date.now(),
            });
          }
        },
        true
      );

      // 监听输入事件
      document.addEventListener(
        'input',
        (e) => {
          const target = e.target as Element;
          if (!target) return;

          const selector = getSelector(target);
          const tracker = (window as unknown as { __interactionTracker: Map<string, InteractedElement> }).__interactionTracker;
          const existing = tracker.get(selector);

          if (existing) {
            existing.interactionCount++;
            existing.lastInteraction = Date.now();
          } else {
            tracker.set(selector, {
              selector,
              tagName: target.tagName.toLowerCase(),
              id: target.id || undefined,
              className: target.className || undefined,
              interactionCount: 1,
              lastInteraction: Date.now(),
            });
          }
        },
        true
      );
    });

    // 每次导航后重新注入
    this.page.on('load', async () => {
      await this.injectTracker();
    });
  }

  /**
   * 注入追踪脚本到当前页面
   */
  private async injectTracker(): Promise<void> {
    await this.page.evaluate(() => {
      if (!(window as unknown as { __interactionTracker?: unknown }).__interactionTracker) {
        (window as unknown as { __interactionTracker: Map<string, unknown> }).__interactionTracker = new Map();
      }
    });
  }

  /**
   * 获取已交互的元素列表
   */
  async getInteractions(): Promise<InteractedElement[]> {
    try {
      const interactions = await this.page.evaluate(() => {
        const tracker = (window as unknown as { __interactionTracker?: Map<string, InteractedElement> }).__interactionTracker;
        if (!tracker) return [];
        return Array.from(tracker.values());
      });
      return interactions;
    } catch {
      return [];
    }
  }

  /**
   * 获取所有可点击元素
   */
  async getAllClickableElements(): Promise<ClickableElement[]> {
    const elements = await this.page.evaluate(() => {
      const clickableSelectors = [
        'a',
        'button',
        'input[type="button"]',
        'input[type="submit"]',
        'input[type="reset"]',
        '[role="button"]',
        '[onclick]',
        '[tabindex]:not([tabindex="-1"])',
        'select',
        'input[type="checkbox"]',
        'input[type="radio"]',
        'label[for]',
      ];

      const getSelector = (el: Element): string => {
        if (el.id) return `#${el.id}`;
        const tagName = el.tagName.toLowerCase();
        const classList = Array.from(el.classList).slice(0, 3).join('.');
        if (classList) return `${tagName}.${classList}`;
        return tagName;
      };

      const isVisible = (el: Element): boolean => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          parseFloat(style.opacity) > 0 &&
          rect.width > 0 &&
          rect.height > 0
        );
      };

      const results: ClickableElement[] = [];
      const seen = new Set<string>();

      for (const selector of clickableSelectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        for (const el of elements) {
          const elSelector = getSelector(el);
          if (seen.has(elSelector)) continue;
          seen.add(elSelector);

          const rect = el.getBoundingClientRect();
          results.push({
            selector: elSelector,
            tagName: el.tagName.toLowerCase(),
            text: (el as HTMLElement).innerText?.slice(0, 50),
            id: el.id || undefined,
            className: el.className || undefined,
            isVisible: isVisible(el),
            boundingBox: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            },
          });
        }
      }

      return results;
    });

    return elements;
  }

  /**
   * 获取可见的可点击元素
   */
  async getVisibleClickableElements(): Promise<ClickableElement[]> {
    const all = await this.getAllClickableElements();
    return all.filter((el) => el.isVisible);
  }

  /**
   * 生成覆盖率报告
   */
  async generateReport(): Promise<CoverageReport> {
    const clickable = await this.getAllClickableElements();
    const interacted = await this.getInteractions();
    const interactedSelectors = new Set(interacted.map((e) => e.selector));

    const uninteracted = clickable.filter(
      (el) => !interactedSelectors.has(el.selector)
    );

    const totalClickable = clickable.length;
    const totalInteracted = interacted.length;
    const coveragePercent =
      totalClickable > 0
        ? Math.round((totalInteracted / totalClickable) * 100)
        : 0;

    return {
      totalClickable,
      totalInteracted,
      coveragePercent,
      interactedElements: interacted,
      uninteractedElements: uninteracted,
    };
  }

  /**
   * 打印覆盖率报告到控制台
   */
  async printReport(): Promise<void> {
    const report = await this.generateReport();

    console.log('\n========================================');
    console.log('      INTERACTION COVERAGE REPORT       ');
    console.log('========================================\n');

    console.log(`Total Clickable Elements: ${report.totalClickable}`);
    console.log(`Total Interacted Elements: ${report.totalInteracted}`);
    console.log(`Coverage: ${report.coveragePercent}%`);
    console.log('');

    if (report.interactedElements.length > 0) {
      console.log('--- Interacted Elements ---');
      for (const el of report.interactedElements.slice(0, 10)) {
        console.log(
          `  [${el.interactionCount}x] ${el.selector} - "${el.text?.slice(0, 30) || ''}"`
        );
      }
      if (report.interactedElements.length > 10) {
        console.log(`  ... and ${report.interactedElements.length - 10} more`);
      }
      console.log('');
    }

    if (report.uninteractedElements.length > 0) {
      console.log('--- Uninteracted Elements (sample) ---');
      const visible = report.uninteractedElements.filter((el) => el.isVisible);
      for (const el of visible.slice(0, 10)) {
        console.log(`  ${el.selector} - "${el.text?.slice(0, 30) || ''}"`);
      }
      if (visible.length > 10) {
        console.log(`  ... and ${visible.length - 10} more visible elements`);
      }
      console.log('');
    }

    console.log('========================================\n');
  }

  /**
   * 获取随机一个未交互的可见元素
   */
  async getRandomUninteractedElement(): Promise<ClickableElement | null> {
    const report = await this.generateReport();
    const visible = report.uninteractedElements.filter((el) => el.isVisible);

    if (visible.length === 0) return null;

    const index = Math.floor(Math.random() * visible.length);
    return visible[index];
  }

  /**
   * 清空追踪数据
   */
  async clear(): Promise<void> {
    this.interactedElements.clear();
    try {
      await this.page.evaluate(() => {
        const tracker = (window as unknown as { __interactionTracker?: Map<string, unknown> }).__interactionTracker;
        if (tracker) tracker.clear();
      });
    } catch {
      // 页面可能已关闭
    }
  }

  /**
   * 停止追踪器
   */
  stop(): void {
    this.isStarted = false;
  }
}

/**
 * 工厂函数 - 创建交互追踪器实例
 */
export function createInteractionTracker(page: Page): InteractionTracker {
  return new InteractionTracker(page);
}

/**
 * 便捷函数 - 创建并启动交互追踪器
 */
export async function startInteractionTracker(
  page: Page
): Promise<InteractionTracker> {
  const tracker = createInteractionTracker(page);
  await tracker.start();
  return tracker;
}
