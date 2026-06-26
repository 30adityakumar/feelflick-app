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

    // Auth is always reachable from the hero's primary CTA (and, on desktop, the
    // header CTA). The header no longer has a Menu trigger.
    expect(await page.getByRole('button', { name: /continue with google/i }).count(),
      `no reachable auth entry at ${label}`).toBeGreaterThan(0)
    await expect(page.getByRole('button', { name: /^menu$/i })).toHaveCount(0)

    // Re-check overflow after scrolling to the bottom (the mobile header CTA reveals
    // there); the header must never wrap or introduce horizontal scroll.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(150)
    const overflowScrolled = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflowScrolled, `horizontal overflow at ${label} (scrolled)`).toBeLessThanOrEqual(0)
  })
}

// Mobile-specific: initial wordmark-only header, then a compact revealed CTA.
for (const [label, width, height] of [['mobile-390', 390, 844], ['mobile-320', 320, 812]]) {
  test(`mobile header reveal works without overflow at ${label}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: /movies, made personal/i })).toBeVisible({ timeout: 15_000 })
    const headerCta = page.locator('.ff-l-header-cta')
    await expect(headerCta).toBeHidden() // initial state: wordmark only
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(headerCta).toBeVisible() // revealed compact CTA
    await expect(headerCta).toHaveAccessibleName(/continue with google/i)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `header CTA reveal must not cause overflow at ${label}`).toBeLessThanOrEqual(0)
  })
}
