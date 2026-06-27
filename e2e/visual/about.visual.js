import { test, expect } from '@playwright/test'

// Visual regression on a deterministic static page. The landing is unsuitable
// (mood-cycling hero, random starfield, time-based greeting); /about is stable
// and still guards the shared SiteHeaderHost/LandingFooter + editorial typography.
//
// LOCAL-FIRST: snapshot baselines are platform-specific. The committed baseline
// is for the dev platform; generate Linux baselines (e.g. via the Playwright
// docker image or `--update-snapshots` in CI) before gating CI on this.
// Run locally: `npm run test:visual` (update: `npm run test:visual:update`).
test('about page — visual baseline', async ({ page }) => {
  await page.goto('/about')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('about-fullpage.png', { fullPage: true })
})
