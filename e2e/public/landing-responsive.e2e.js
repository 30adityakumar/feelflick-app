import { test, expect } from '@playwright/test'

// Durable responsive gate for the public landing. NOTE: a narrow effective
// viewport is only an APPROXIMATION of real 200% browser zoom, not identical to it.
const VIEWPORTS = [
  ['desktop-1440', 1440, 900],
  ['desktop-1280', 1280, 800],
  ['tablet-768', 768, 1024],
  ['mobile-390', 390, 844],
  ['mobile-320', 320, 812],
  ['landscape-844', 844, 390],
  ['zoom200-effective-720', 720, 450], // ~200% of a 1440 desktop (effective viewport, not a real zoom gesture)
]

for (const [label, width, height] of VIEWPORTS) {
  test(`landing: no horizontal overflow + core landmarks at ${label} (${width}x${height})`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: /movies, made personal/i })).toBeVisible({ timeout: 15_000 })

    await expect(page.locator('main')).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow, `horizontal overflow at ${label} (initial)`).toBeLessThanOrEqual(0)

    // Auth is always reachable: the shared header carries Sign in at every width, and
    // the hero carries "Continue with Google". The header has no Menu trigger.
    expect(await page.getByRole('button', { name: /continue with google/i }).count(),
      `no reachable hero auth entry at ${label}`).toBeGreaterThan(0)
    await expect(page.getByRole('banner').getByRole('button', { name: /sign in with google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^menu$/i })).toHaveCount(0)

    // The fixed shared header must never wrap or introduce horizontal scroll, including
    // after scrolling to the bottom (where the hide-on-scroll header re-reveals).
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(150)
    const overflowScrolled = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflowScrolled, `horizontal overflow at ${label} (scrolled)`).toBeLessThanOrEqual(0)
  })
}

// Mobile-specific: the shared header keeps FEELFLICK + Search + Sign in in the top bar
// (no anonymous bottom bar), with 44px practical touch targets and no overflow at 320.
for (const [label, width, height] of [['mobile-390', 390, 844], ['mobile-320', 320, 812]]) {
  test(`mobile shared header: FEELFLICK + Search + Sign in fit with 44px targets at ${label}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: /movies, made personal/i })).toBeVisible({ timeout: 15_000 })

    const banner = page.getByRole('banner')
    await expect(banner.getByRole('link', { name: 'FEELFLICK' })).toBeVisible()

    const search = banner.getByRole('button', { name: /search films/i })
    const signIn = banner.getByRole('button', { name: /sign in with google/i })
    await expect(search).toBeVisible()
    await expect(signIn).toBeVisible()

    const searchBox = await search.boundingBox()
    const signInBox = await signIn.boundingBox()
    expect(searchBox.height, `search target height at ${label}`).toBeGreaterThanOrEqual(44)
    expect(searchBox.width, `search target width at ${label}`).toBeGreaterThanOrEqual(44)
    expect(signInBox.height, `Sign in target height at ${label}`).toBeGreaterThanOrEqual(44)

    // No anonymous bottom navigation; no horizontal overflow.
    await expect(page.getByRole('navigation', { name: /mobile navigation/i })).toHaveCount(0)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `header must not cause overflow at ${label}`).toBeLessThanOrEqual(0)
  })
}
