import { test, expect } from '@playwright/test'

// Logged-out: the canonical v3 editorial landing renders at /.
test('landing renders for logged-out visitors', async ({ page }) => {
  await page.goto('/')
  // Hero headline: "Films that know you." ("you." is an italic accent fragment).
  await expect(page.getByText(/Films that know/i)).toBeVisible()
})

test('landing exposes a primary call-to-action', async ({ page }) => {
  await page.goto('/')
  // Approved CTA copy: "Start free →" (appears in header, hero, and pricing —
  // assert the primary one renders).
  await expect(page.getByRole('button', { name: /start free/i }).first()).toBeVisible()
})
