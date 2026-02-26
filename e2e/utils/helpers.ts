import { Page } from '@playwright/test';

/**
 * Collects console errors from the page
 */
export class ErrorCollector {
  private errors: string[] = [];

  attach(page: Page): void {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      this.errors.push(error.message);
    });
  }

  getErrors(): string[] {
    return [...this.errors];
  }

  clear(): void {
    this.errors = [];
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }
}

/**
 * Gets all clickable elements on the page
 */
export async function getClickableElements(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const selectors: string[] = [];
    const clickableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input[type="submit"]:not([disabled])',
      'input[type="button"]:not([disabled])',
      '[role="button"]:not([disabled])',
      '[onclick]',
      '[tabindex]:not([tabindex="-1"])',
    ];

    clickableSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el, index) => {
        const tagName = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const classes = el.className && typeof el.className === 'string'
          ? '.' + el.className.split(' ').filter(Boolean).join('.')
          : '';

        if (id) {
          selectors.push(id);
        } else if (classes) {
          selectors.push(`${tagName}${classes}`);
        } else {
          selectors.push(`${selector}:nth-of-type(${index + 1})`);
        }
      });
    });

    return [...new Set(selectors)];
  });
}

/**
 * Random delay between min and max milliseconds
 */
export function randomDelay(min: number = 100, max: number = 500): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Randomly selects an element from an array
 */
export function randomChoice<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generates a random string for form inputs
 */
export function randomString(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Waits for page to be stable (no network activity)
 */
export async function waitForPageStable(page: Page, timeout: number = 5000): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch {
    // Timeout is acceptable, page might have continuous polling
  }
}

/**
 * Safely clicks an element, catching any errors
 */
export async function safeClick(page: Page, selector: string): Promise<boolean> {
  try {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 1000 })) {
      await element.click({ timeout: 2000 });
      return true;
    }
  } catch {
    // Element not clickable or not found
  }
  return false;
}

/**
 * Takes a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `test-results/screenshots/${name}-${timestamp}.png` });
}
