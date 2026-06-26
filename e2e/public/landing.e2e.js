import { test, expect } from '@playwright/test'

// Logged-out: the redesigned Adaptive Editorial Cinema landing renders at /.
test('landing renders for logged-out visitors with the locked positioning', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /movies, made personal/i })).toBeVisible({ timeout: 15_000 })
})

test('landing auth CTAs use one canonical "Continue with Google" label', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: /continue with google/i }).first()).toBeVisible()
  // The misleadingly different labels are gone.
  await expect(page.getByRole('button', { name: /start with google/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^sign in$/i })).toHaveCount(0)
})

test('landing head carries the canonical metadata', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('FeelFlick — Movies, made personal.')
  const desc = await page.locator('meta[name="description"]').getAttribute('content')
  expect(desc).toBe('Personal movie discovery built around your taste, your moment, and your curiosity.')
})

test('desktop header is simplified: FeelFlick wordmark + one "How it works" link + one CTA, no Menu', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  const header = page.locator('header.ff-l-header')
  // Canonical mixed-case wordmark (not all-caps FEELFLICK).
  await expect(header.getByRole('link', { name: /feelflick home/i })).toHaveText('FeelFlick')
  // Exactly one header nav link, and it is "How it works".
  await expect(header.locator('.ff-l-nav a')).toHaveCount(1)
  await expect(header.getByRole('link', { name: /how it works/i })).toHaveAttribute('href', '#how-it-works')
  for (const gone of [/film file/i, /cinematic dna/i, /^library$/i, /people/i]) {
    await expect(header.getByRole('link', { name: gone })).toHaveCount(0)
  }
  // One compact Continue with Google action; no Menu trigger; no drawer/dialog.
  await expect(header.getByRole('button', { name: /continue with google/i })).toHaveCount(1)
  await expect(page.getByRole('button', { name: /^menu$/i })).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('mobile header shows only the wordmark initially (no Menu, no visible header CTA)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('header.ff-l-header').getByRole('link', { name: /feelflick home/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /^menu$/i })).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  // The header CTA is present in the DOM but not visible while the hero CTA is in view.
  await expect(page.locator('.ff-l-header-cta')).toBeHidden()
})

test('mobile header reveals a compact "Continue with Google" once the hero CTA scrolls away', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  const headerCta = page.locator('.ff-l-header-cta')
  await expect(headerCta).toBeHidden()
  // Scroll the hero CTA out of view.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect(headerCta).toBeVisible()
  await expect(headerCta).toHaveAccessibleName(/continue with google/i)
  // Scroll back up — it hides again.
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(headerCta).toBeHidden()
})

test('every landing tab aria-controls resolves to a panel in the DOM', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  const dangling = await page.evaluate(() =>
    [...document.querySelectorAll('[role="tab"]')].filter((t) => {
      const id = t.getAttribute('aria-controls')
      return !id || !document.getElementById(id)
    }).length
  )
  expect(dangling, 'tabs whose aria-controls does not resolve').toBe(0)
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
