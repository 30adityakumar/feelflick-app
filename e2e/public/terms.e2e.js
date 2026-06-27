import { test, expect } from '@playwright/test'

// /terms rebuilt in the Adaptive Editorial Cinema direction — a self-contained .ff-landing
// legal document reusing the SAME shared header + footer as the landing, with all legal
// clauses preserved.

test('terms renders the rebuilt legal document with shared chrome + key clauses', async ({ page }) => {
  await page.goto('/terms')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Terms of Service', { timeout: 15_000 })
  await expect(page.getByText(/Last updated: November 15, 2025/)).toBeVisible()

  // Shared app header (same as the landing + /about + /privacy).
  const banner = page.getByRole('banner')
  await expect(banner).toHaveCount(1)
  await expect(banner.getByRole('link', { name: 'FEELFLICK' })).toBeVisible()

  // Load-bearing clauses preserved.
  await expect(page.getByRole('heading', { level: 2, name: /agreement to terms/i })).toBeVisible()
  await expect(page.getByText(/FeelFlick is a discovery tool/)).toBeVisible()
  await expect(page.getByText(/We do not host, stream/)).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /intellectual property/i })).toBeVisible()
  await expect(page.getByText(/FeelFlick uses the TMDB API but is not endorsed/)).toBeVisible()
  await expect(page.getByText(/shall not exceed the amount you paid us/i)).toBeVisible()

  // Contact + report emails are real mailto links.
  await expect(page.locator('a[href="mailto:legal@feelflick.com"]').first()).toBeVisible()
  await expect(page.locator('a[href="mailto:support@feelflick.com"]')).toBeVisible()

  // Shared footer with required TMDB attribution + legal links.
  const footer = page.getByRole('contentinfo')
  await expect(footer.getByText(/not endorsed or certified by TMDB/i)).toBeVisible()
  await expect(footer.getByRole('link', { name: 'Privacy' })).toBeVisible()

  const body = await page.locator('body').innerText()
  expect(body).not.toMatch(/films that know you/i)

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, 'terms must not cause horizontal overflow').toBeLessThanOrEqual(0)
})

test('terms: one h1 + sibling banner/main/contentinfo landmarks', async ({ page }) => {
  await page.goto('/terms')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.getByRole('banner')).toHaveCount(1)
  await expect(page.getByRole('main')).toHaveCount(1)
  await expect(page.getByRole('contentinfo')).toHaveCount(1)
})
