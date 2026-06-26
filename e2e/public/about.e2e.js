import { test, expect } from '@playwright/test'

// /about rebuilt in the Adaptive Editorial Cinema direction — a self-contained .ff-landing
// page reusing the SAME shared header + footer as the landing.

test('about renders the rebuilt editorial page with the shared header + footer', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/movies, made personal\./i, { timeout: 15_000 })

  // Shared app header (same as the landing): banner + FEELFLICK + Discover/Browse + Sign in.
  const banner = page.getByRole('banner')
  await expect(banner).toHaveCount(1)
  await expect(banner.getByRole('link', { name: 'FEELFLICK' })).toBeVisible()

  // Sections.
  await expect(page.getByRole('heading', { level: 2, name: /except a decision/i })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /three ways in/i })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /keeps evolving/i })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /convictions/i })).toBeVisible()
  for (const name of [/for tonight/i, /from your taste/i, /follow a curiosity/i]) {
    await expect(page.getByRole('heading', { level: 3, name })).toBeVisible()
  }

  // Canonical CTA (reused from the landing).
  await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible()

  // Shared footer: required TMDB attribution + legal links.
  const footer = page.getByRole('contentinfo')
  await expect(footer.getByText(/not endorsed or certified by TMDB/i)).toBeVisible()
  await expect(footer.getByRole('link', { name: 'Privacy' })).toBeVisible()
  await expect(footer.getByRole('link', { name: 'Terms' })).toBeVisible()

  // Honesty: no match %, no retired doctrine.
  const body = await page.locator('body').innerText()
  expect(body, 'no match percentages').not.toMatch(/\d+\s*%/)
  expect(body, 'no retired tagline').not.toMatch(/films that know you/i)
  expect(body, 'no retired pricing claim').not.toMatch(/free\.?\s*forever|always free/i)

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, 'about must not cause horizontal overflow').toBeLessThanOrEqual(0)
})

test('about: one h1 + sibling banner/main/contentinfo landmarks', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.getByRole('banner')).toHaveCount(1)
  await expect(page.getByRole('main')).toHaveCount(1)
  await expect(page.getByRole('contentinfo')).toHaveCount(1)
})
