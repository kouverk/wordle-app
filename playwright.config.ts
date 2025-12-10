import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 14'] },
    },
  ],

  // Run your local dev servers before starting tests
  webServer: [
    {
      command: 'cd wordle-backend && node server.js',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd wordleapp && ng serve',
      port: 4200,
      reuseExistingServer: !process.env.CI,
      timeout: 120000, // Angular can be slow to start
    },
  ],
});
