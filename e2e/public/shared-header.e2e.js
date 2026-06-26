import { test, expect } from '@playwright/test'

// The shared app header renders identically on the anonymous Landing and the
// anonymous app routes (/discover, /browse), which are publicly viewable. There is
// no anonymous bottom navigation anywhere. The header mounts before route data, so
// these assertions target the banner, not page content.
const ROUTES = ['/', '/discover', '/browse']

for (const route of ROUTES) {
  test(`anonymous shared header is consistent at ${route} (desktop)`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(route)
    const banner = page.getByRole('banner')
    await expect(banner).toHaveCount(1, { timeout: 15_000 })
    // Landing uses the quiet variant; anonymous app routes keep the default one.
    await expect(banner).toHaveAttribute('data-tone', route === '/' ? 'quiet' : 'default')
    await expect(banner.getByRole('link', { name: 'FEELFLICK' })).toHaveAttribute('href', '/')
    await expect(banner.getByRole('link', { name: 'Discover' })).toHaveAttribute('href', '/discover')
    await expect(banner.getByRole('link', { name: 'Browse' })).toHaveAttribute('href', '/browse')
    await expect(banner.getByRole('button', { name: /sign in with google/i })).toBeVisible()
    await expect(banner.getByRole('button', { name: /search films/i })).toBeVisible()
    // No anonymous bottom bar; no horizontal overflow.
    await expect(page.getByRole('navigation', { name: /mobile navigation/i })).toHaveCount(0)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `horizontal overflow at ${route} (desktop)`).toBeLessThanOrEqual(0)
  })

  test(`anonymous shared header is consistent at ${route} (mobile)`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(route)
    const banner = page.getByRole('banner')
    await expect(banner).toHaveCount(1, { timeout: 15_000 })
    await expect(banner.getByRole('link', { name: 'FEELFLICK' })).toBeVisible()
    await expect(banner.getByRole('button', { name: /search films/i })).toBeVisible()
    await expect(banner.getByRole('button', { name: /sign in with google/i })).toBeVisible()
    await expect(page.getByRole('navigation', { name: /mobile navigation/i })).toHaveCount(0)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `horizontal overflow at ${route} (mobile)`).toBeLessThanOrEqual(0)
  })
}

test('anonymous app-route search opens and closes via the shared SearchBar (/discover)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/discover')
  const banner = page.getByRole('banner')
  await expect(banner).toHaveCount(1, { timeout: 15_000 })
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await banner.getByRole('button', { name: /search films/i }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
