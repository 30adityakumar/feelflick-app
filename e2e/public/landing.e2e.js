import { test, expect } from '@playwright/test'

// Logged-out: the redesigned Adaptive Editorial Cinema landing renders at /.
test('landing renders for logged-out visitors with the locked positioning', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /movies, made personal/i })).toBeVisible({ timeout: 15_000 })
})

test('landing primary CTA uses the shared Google OAuth wording', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /start with google/i }).first()).toBeVisible()
})

test('landing carries none of the retired doctrine or false precision', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  const body = await page.locator('body').innerText()
  expect(body, 'no match percentages').not.toMatch(/\d+\s*%/)
  expect(body, 'no Briefing doctrine').not.toMatch(/the briefing/i)
  expect(body, 'no forever-pricing claim').not.toMatch(/free\.?\s*forever|always free|algorithm tax/i)
  expect(body, 'retired hero copy gone').not.toMatch(/films that know you|the right film\. right now/i)
  expect(body, 'no curator persona').not.toMatch(/meet m\.|your curator/i)
  expect(body, 'no named fake people').not.toMatch(/maya rao|jon lee/i)
})

test('landing shows the three entrances in the locked order (Discover/Home/Browse)', async ({ page }) => {
  await page.goto('/')
  const titles = page.locator('.ff-l-entrance__title')
  await expect(titles).toHaveCount(3)
  await expect(titles.nth(0)).toHaveText(/for tonight/i)
  await expect(titles.nth(1)).toHaveText(/from your taste/i)
  await expect(titles.nth(2)).toHaveText(/follow a curiosity/i)
})

test('landing previews use real tab patterns and no fake persistence controls', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('tab', { name: /before watching/i })).toBeVisible()
  await expect(page.getByRole('tab', { name: /after watching/i })).toBeVisible()
  await expect(page.getByRole('tab', { name: /watchlist/i })).toBeVisible()
  await expect(page.getByRole('tab', { name: /diary/i })).toBeVisible()
  // No fake switches / Follow buttons on the landing.
  await expect(page.locator('[role="switch"]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^follow$/i })).toHaveCount(0)
})

test('footer links to valid legal routes only (no /feedback) + TMDB attribution', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.ff-l-footer-nav a[href="/about"]')).toHaveCount(1)
  await expect(page.locator('.ff-l-footer-nav a[href="/privacy"]')).toHaveCount(1)
  await expect(page.locator('.ff-l-footer-nav a[href="/terms"]')).toHaveCount(1)
  await expect(page.locator('a[href="/feedback"]')).toHaveCount(0)
  await expect(page.getByText(/not endorsed or certified by TMDB/i)).toBeVisible()
})
