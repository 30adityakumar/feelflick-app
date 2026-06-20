import { test, expect } from '@playwright/test'

// Smoke: the authenticated home surfaces recommendation content — real TMDB
// poster images, which depend on the engine returning candidates and the catalog
// reads working (the RLS public-read path).
test('home surfaces recommendation posters', async ({ page }) => {
  await page.goto('/home')
  await expect(page).toHaveURL(/\/home(?:[/?#]|$)/)

  // Cards render <img alt={title} src="https://image.tmdb.org/...">. Wait for the
  // first real poster (home loads async behind skeletons).
  const poster = page.locator('img[src*="image.tmdb.org"]').first()
  await expect(poster).toBeVisible({ timeout: 20_000 })
})

test('a recommended poster opens its film detail page', async ({ page }) => {
  await page.goto('/home')
  // The redesigned Home opens a film via an "Open Film File" control — the hero
  // primary ("Open Film File") or a card overlay ("Open Film File for <title>").
  // (The first image.tmdb.org element is now the decorative hero backdrop, which
  // is intentionally NOT a navigation target.)
  const opener = page.getByRole('button', { name: /Open Film File/i }).first()
  await expect(opener).toBeVisible({ timeout: 20_000 })
  await opener.click()
  await expect(page).toHaveURL(/\/movie\/\d+/, { timeout: 15_000 })
})
