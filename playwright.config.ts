import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:9002',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run Firebase emulators and Next.js dev server before starting the tests */
  webServer: [
    {
      name: 'firebase-emulators',
      command: 'firebase emulators:start --only firestore,auth',
      url: 'http://127.0.0.1:4000', // Emulator UI
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      name: 'nextjs-dev',
      command: 'npm run dev',
      url: 'http://localhost:9002',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      dependencies: ['firebase-emulators'], // Wait for emulators first
      env: {
        ENABLE_TEST_AUTH: 'true',
        FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
        FIREBASE_EMULATOR_HUB: 'http://127.0.0.1:4000',
      },
    },
  ],

  /* Test timeout - increased for AI generation tests */
  timeout: 120 * 1000, // 2 minutes for AI generation
  expect: {
    /* Maximum time expect() should wait for the condition to be met. */
    timeout: 10 * 1000,
  },
});

