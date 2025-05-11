// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000, 
  expect: { timeout: 10000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, 
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:8090',
    trace: 'on',
    launchOptions: {
      args: ['--start-maximized'],
      headless: false,
      slowMo: 500,
      devtools: true,
    }
  },


  projects: [
    {
      name: 'chrome',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome'
      },
    }
  ],
});