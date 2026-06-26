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
    expect(overflow, `horizontal overflow at ${label}`).toBeLessThanOrEqual(0)

    // An auth entry remains reachable: the Continue-with-Google CTA directly,
    // or the Menu trigger (which opens a drawer containing it) on small screens.
    const ctaCount = await page.getByRole('button', { name: /continue with google/i }).count()
    const menuCount = await page.getByRole('button', { name: /^menu$/i }).count()
    expect(ctaCount + menuCount, `no reachable auth entry at ${label}`).toBeGreaterThan(0)
  })
}
