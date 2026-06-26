import { test, expect } from '@playwright/test'

// Logged-out: the redesigned Adaptive Editorial Cinema landing renders at /.
test('landing renders for logged-out visitors with the locked positioning', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /movies, made personal/i })).toBeVisible({ timeout: 15_000 })
})

test('landing marketing CTAs use one canonical "Continue with Google" label', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  // The hero + final marketing CTAs are the canonical "Continue with Google".
  await expect(page.getByRole('button', { name: /continue with google/i }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /start with google/i })).toHaveCount(0)
})

test('landing head carries the canonical metadata', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('FeelFlick — Movies, made personal.')
  const desc = await page.locator('meta[name="description"]').getAttribute('content')
  expect(desc).toBe('Personal movie discovery built around your taste, your moment, and your curiosity.')
})

// The Landing header IS the shared app header (src/app/header), rendered via
// SiteHeaderHost — not a Landing-specific clone.
test('desktop: Landing uses the shared app header (FEELFLICK + Discover/Browse + Search + Sign in)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })

  const banner = page.getByRole('banner')
  await expect(banner).toHaveCount(1)
  await expect(banner.getByRole('link', { name: 'FEELFLICK' })).toHaveAttribute('href', '/')
  await expect(banner.getByRole('link', { name: 'Discover' })).toHaveAttribute('href', '/discover')
  await expect(banner.getByRole('link', { name: 'Browse' })).toHaveAttribute('href', '/browse')

  // Shared search launcher + shared Sign in (visible "Sign in", accessible "Sign in with Google").
  await expect(banner.getByRole('button', { name: /search films/i })).toBeVisible()
  const signIn = banner.getByRole('button', { name: /sign in with google/i })
  await expect(signIn).toBeVisible()
  await expect(signIn).toHaveText(/^Sign in$/)

  // The Landing-specific header CTA is gone: no "Continue with Google" in the header.
  await expect(banner.getByRole('button', { name: /continue with google/i })).toHaveCount(0)
  // The mobile hamburger is hidden on desktop (full nav + Sign in are shown).
  await expect(banner.getByRole('button', { name: /open menu/i })).toHaveCount(0)

  // The hero CTA + "See how it works" anchor + #how-it-works section remain.
  await expect(page.getByRole('button', { name: /continue with google/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /see how it works/i })).toHaveCount(1)
  await expect(page.locator('#how-it-works')).toHaveCount(1)
})

test('mobile: shared header = FEELFLICK + Search + hamburger; menu holds Discover/Browse/Sign in', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })

  const banner = page.getByRole('banner')
  await expect(banner.getByRole('link', { name: 'FEELFLICK' })).toBeVisible()
  await expect(banner.getByRole('button', { name: /search films/i })).toBeVisible()

  // Desktop nav + bar Sign in are hidden on mobile; the hamburger holds them.
  const hamburger = banner.getByRole('button', { name: /open menu/i })
  await expect(hamburger).toBeVisible()
  await hamburger.click()
  const menu = page.getByRole('navigation', { name: /site/i })
  await expect(menu.getByRole('link', { name: 'Discover' })).toHaveAttribute('href', '/discover')
  await expect(menu.getByRole('link', { name: 'Browse' })).toHaveAttribute('href', '/browse')
  await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible()

  // No anonymous bottom navigation.
  await expect(page.getByRole('navigation', { name: /mobile navigation/i })).toHaveCount(0)
})

test('Landing search is functional (shared SearchBar): click + "/" open, Escape closes', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })

  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('banner').getByRole('button', { name: /search films/i }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('searchbox', { name: /search movies/i })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)

  // "/" opens it again when not typing.
  await page.keyboard.press('/')
  await expect(page.getByRole('dialog')).toBeVisible()
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
