import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  webServer: [
    {
      command: 'cd backend && cross-env NODE_ENV=test npm start',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: 'npm run dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
  timeout: 600000, // 10 分钟，完整演示需要更长时间
  retries: 0, // 演示测试不需要重试
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    channel: 'chrome',
    launchOptions: {
      slowMo: 100, // 减少默认延迟，演示测试自己控制节奏
    },
  },
  projects: [{ name: 'chrome', use: { channel: 'chrome' } }],
});
