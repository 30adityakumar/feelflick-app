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

test('taste-twins are framed as illustrative (no fake social proof)', async ({ page }) => {
  // reduced-motion → the reveal-on-scroll sections render in their final, visible
  // state, so the below-fold Community label is assertable without scripting scroll.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  // The example "taste twins" cards (named people + activity) MUST carry an
  // illustrative label so they can't read as real members — guards the
  // doctrine's "no fake social proof" rule for the parked People feature.
  await expect(page.getByText(/Illustrative/i)).toBeVisible()
})
