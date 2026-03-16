import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/electron',
  fullyParallel: false,
  retries: 0,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02
    }
  },
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 960 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  globalSetup: './tests/electron/global-setup.ts'
})
