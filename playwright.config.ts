import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  webServer: [
    {
      command: 'cd backend && npm start',
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
  timeout: 120000,
  retries: 1,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    channel: 'chrome',
    // Slow down actions for visibility
    launchOptions: {
      slowMo: 500, // 500ms delay between actions
    },
  },
  projects: [{ name: 'chrome', use: { channel: 'chrome' } }],
});
