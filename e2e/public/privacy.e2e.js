import { test, expect } from '@playwright/test'

// /privacy rebuilt in the Adaptive Editorial Cinema direction — a self-contained .ff-landing
// legal document reusing the SAME shared header + footer as the landing, with all legal
// disclosures preserved.

test('privacy renders the rebuilt legal document with shared chrome + key disclosures', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy Policy', { timeout: 15_000 })
  await expect(page.getByText(/Last updated: November 15, 2025/)).toBeVisible()

  // Shared app header (same as the landing + /about).
  const banner = page.getByRole('banner')
  await expect(banner).toHaveCount(1)
  await expect(banner.getByRole('link', { name: 'FEELFLICK' })).toBeVisible()

  // Load-bearing legal disclosures preserved.
  await expect(page.getByRole('heading', { level: 2, name: /information we collect/i })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /what we never do/i })).toBeVisible()
  await expect(page.getByText(/sell it to anyone/i)).toBeVisible()
  await expect(page.getByText(/PostHog/)).toBeVisible()
  await expect(page.getByText(/Sentry/)).toBeVisible()
  await expect(page.getByText(/Appear in taste-match discovery/)).toBeVisible()
  await expect(page.getByText(/children under 13/i)).toBeVisible()

  // Contact email is a real mailto link.
  await expect(page.locator('a[href="mailto:privacy@feelflick.com"]').first()).toBeVisible()

  // Shared footer with required TMDB attribution + legal links.
  const footer = page.getByRole('contentinfo')
  await expect(footer.getByText(/not endorsed or certified by TMDB/i)).toBeVisible()
  await expect(footer.getByRole('link', { name: 'Terms' })).toBeVisible()

  // No retired tagline.
  const body = await page.locator('body').innerText()
  expect(body).not.toMatch(/films that know you/i)

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, 'privacy must not cause horizontal overflow').toBeLessThanOrEqual(0)
})

test('privacy: one h1 + sibling banner/main/contentinfo landmarks', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.getByRole('banner')).toHaveCount(1)
  await expect(page.getByRole('main')).toHaveCount(1)
  await expect(page.getByRole('contentinfo')).toHaveCount(1)
})
