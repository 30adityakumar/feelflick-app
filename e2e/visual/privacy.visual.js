import { test, expect } from '@playwright/test'

// Visual regression on the rebuilt /privacy legal document (deterministic, logged-out).
// Guards the shared SiteHeaderHost + LandingFooter + the .ff-l-legal editorial document
// styles. Baselines are platform-specific: the committed baseline is for the dev platform;
// Linux baselines are (re)generated via the visual-baselines/* CI flow.
// Run locally: `npm run test:visual` (update: `npm run test:visual:update`).
test('privacy page — visual baseline', async ({ page }) => {
  await page.goto('/privacy')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('privacy-fullpage.png', { fullPage: true })
})
