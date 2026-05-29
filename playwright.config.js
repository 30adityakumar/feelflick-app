import { defineConfig, devices } from '@playwright/test'

// E2E config for FeelFlick. Tests live in e2e/ and use the *.e2e.js / *.setup.js
// naming so Vitest (which scans **/*.{test,spec}.*) never picks them up.
const baseURL = 'http://localhost:5173'

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.(e2e|setup|visual)\.js$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled' } },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Signs in the dev test user once, saves auth state for the `app` project.
    { name: 'setup', testMatch: /.*\.setup\.js$/ },

    // Logged-out flows (no stored auth).
    {
      name: 'public',
      testMatch: 'public/**/*.e2e.js',
      use: { ...devices['Desktop Chrome'] },
    },

    // Authenticated flows (reuse the saved Supabase session).
    {
      name: 'app',
      testMatch: 'app/**/*.e2e.js',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/user.json' },
    },

    // Visual regression on deterministic public pages. NOT part of the default
    // `test:e2e` run / CI e2e job (baselines are platform-specific — generate
    // Linux baselines before enabling in CI). Run locally via `npm run test:visual`.
    {
      name: 'visual',
      testMatch: 'visual/**/*.visual.js',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Auto-start the Vite dev server (reuse one if already running locally).
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
