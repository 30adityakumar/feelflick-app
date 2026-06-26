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

test('film file demonstrates the before -> after states with one Parasite specimen', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  const section = page.locator('#film-file')
  await section.scrollIntoViewIfNeeded()
  await expect(section.getByRole('heading', { level: 2 })).toHaveText(/decide before\. reflect after\./i)

  const before = page.locator('#ff-l-filmfile-panel-before')
  const after = page.locator('#ff-l-filmfile-panel-after')
  // Default: spoiler-safe before state visible; after state hidden.
  await expect(before).toBeVisible()
  await expect(after).toBeHidden()
  await expect(before.getByText('Before watching · spoiler-safe')).toBeVisible()
  await expect(before.getByRole('img', { name: 'Parasite poster' })).toBeVisible()

  // Activate "After watching": after state opens, before hides; honest portrait note shows.
  await page.getByRole('tab', { name: /after watching/i }).click()
  await expect(after).toBeVisible()
  await expect(before).toBeHidden()
  await expect(after.getByText('Watched · reflection open')).toBeVisible()
  await expect(after.getByText(/Other titles may offer a lighter reflection state/i)).toBeVisible()

  // No horizontal overflow introduced by the state switch.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, 'film file must not cause horizontal overflow').toBeLessThanOrEqual(0)
})

test('your film life shows distinct Watchlist (retrieval grid) and Diary (chronology) specimens', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  const section = page.locator('#library')
  await section.scrollIntoViewIfNeeded()
  await expect(section.getByRole('heading', { level: 2 })).toHaveText(/save the future\. remember the past\./i)

  const wl = page.locator('#ff-l-library-panel-watchlist')
  const di = page.locator('#ff-l-library-panel-diary')

  // Default: Watchlist visible as a retrieval grid (5 films); Diary hidden.
  await expect(wl).toBeVisible()
  await expect(di).toBeHidden()
  await expect(wl.getByRole('heading', { name: /saved for later/i })).toBeVisible()
  await expect(wl.getByText('Retrieval tools')).toBeVisible()
  await expect(wl.getByRole('img', { name: 'Past Lives poster' })).toBeVisible()
  await expect(wl.locator('.ff-l-watch-item')).toHaveCount(5)

  // Activate Diary: chronological record by month appears; Watchlist hides.
  await page.getByRole('tab', { name: /diary/i }).click()
  await expect(di).toBeVisible()
  await expect(wl).toBeHidden()
  await expect(di.getByRole('heading', { name: /a record of how films landed/i })).toBeVisible()
  await expect(di.getByRole('heading', { name: 'June 2026' })).toBeVisible()
  await expect(di.getByRole('heading', { name: 'May 2026' })).toBeVisible()
  await expect(di.getByText('It kept changing shape without ever losing control.')).toBeVisible()
  await expect(di.locator('.ff-l-diary-entry')).toHaveCount(4)
  // Diary is chronological, not the Watchlist poster grid.
  await expect(di.locator('.ff-l-watch-grid')).toHaveCount(0)

  // Month headings are not sticky (verified against real applied CSS in the browser).
  const monthPosition = await di.locator('.ff-l-diary-month__label').first().evaluate((el) => getComputedStyle(el).position)
  expect(monthPosition, 'diary month headings must not be sticky').not.toBe('sticky')

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, 'your film life must not cause horizontal overflow').toBeLessThanOrEqual(0)
})

test('people and control shows trusted voices + a private control list (no social feed, no fake controls)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  const sec = page.locator('#people-control')
  await sec.scrollIntoViewIfNeeded()

  await expect(sec.getByRole('heading', { level: 2 })).toHaveText(/the voices you trust\. the choices you keep\./i)
  await expect(sec.getByRole('heading', { level: 3, name: 'The voices you trust', exact: true })).toBeVisible()
  await expect(sec.getByRole('heading', { level: 3, name: 'Control stays with you', exact: true })).toBeVisible()
  await expect(sec.getByText('Illustrative people and preferences')).toHaveCount(1)

  // Anonymous followed voices (no names/avatars/Follow).
  await expect(sec.getByText('A followed voice')).toBeVisible()
  await expect(sec.getByText('Another followed voice')).toBeVisible()
  await expect(sec.getByText('The restraint is what made it stay.')).toBeVisible()

  // Control list: five records, four Editable + one Inspectable, + the streaming disclosure.
  await expect(sec.locator('.ff-l-pref-row')).toHaveCount(5)
  await expect(sec.getByText('Editable', { exact: true })).toHaveCount(4)
  await expect(sec.getByText('Inspectable', { exact: true })).toHaveCount(1)
  await expect(sec.getByText(/Streaming-service preferences are planned, but are not available yet\./i)).toBeVisible()

  // No links, buttons, inputs or fake switches inside the section.
  await expect(sec.locator('a, button, input, select, textarea, [role="switch"], [role="checkbox"]')).toHaveCount(0)

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, 'people and control must not cause horizontal overflow').toBeLessThanOrEqual(0)
})

test('footer links to valid legal routes only (no /feedback) + TMDB attribution', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.ff-l-footer-nav a[href="/about"]')).toHaveCount(1)
  await expect(page.locator('.ff-l-footer-nav a[href="/privacy"]')).toHaveCount(1)
  await expect(page.locator('.ff-l-footer-nav a[href="/terms"]')).toHaveCount(1)
  await expect(page.locator('a[href="/feedback"]')).toHaveCount(0)
  await expect(page.getByText(/not endorsed or certified by TMDB/i)).toBeVisible()
})
