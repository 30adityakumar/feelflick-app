import { test, expect } from '@playwright/test'

// Authenticated cinematic social profile — now served at /profile (+ the cross-user /profile/:userId
// route, which needs the profilePublic-gated RPCs deployed; migration files exist but are not
// applied). Uses the shared app storageState (see playwright.config project "app" →
// e2e/.auth/user.json). Owner view only. The private Cinematic DNA portrait lives at /DNA.

test('owner reaches /profile (not bounced to landing) with the social profile chrome', async ({ page }) => {
  await page.goto('/profile')
  await expect(page).toHaveURL(/\/profile(?:[/?#]|$)/)
  // logged-in: no landing CTA
  await expect(page.getByRole('button', { name: /continue with google/i })).toHaveCount(0)
  // profile tabs + owner action are present
  await expect(page.getByRole('tab')).toHaveCount(7)
  await expect(page.getByRole('button', { name: /edit profile/i })).toBeVisible()
  // never ships prototype fiction
  await expect(page.getByText(/mayawatches|284 films/i)).toHaveCount(0)
})

test('lowercase /dna redirects to the canonical /DNA portrait', async ({ page }) => {
  // waitUntil:'commit' returns as soon as the response is received, leaving the full
  // 30 s budget for React to boot + fire the Navigate (Vite cold-start in CI is slow).
  await page.goto('/dna', { waitUntil: 'commit' })
  await page.waitForURL(/\/DNA(?:[/?#]|$)/, { timeout: 30_000 })
})

test('social-profile tab selection is deep-linkable and survives reload', async ({ page }) => {
  await page.goto('/profile?tab=films')
  await expect(page.getByRole('heading', { name: /film library/i })).toBeVisible()
  await page.reload()
  await expect(page).toHaveURL(/tab=films/)
  await expect(page.getByRole('heading', { name: /film library/i })).toBeVisible()
})

test('the private Cinematic DNA portrait at /DNA is still intact', async ({ page }) => {
  await page.goto('/DNA')
  await expect(page).toHaveURL(/\/DNA(?:[/?#]|$)/)
})
