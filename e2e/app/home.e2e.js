import { test, expect } from '@playwright/test'

// Authenticated (storageState from auth.setup.js).

test('authenticated user reaches /home (not bounced to landing)', async ({ page }) => {
  await page.goto('/home')
  // RequireAuth would redirect an unauthenticated visitor to "/"; staying on
  // /home proves the saved session is honored.
  await expect(page).toHaveURL(/\/home(?:[/?#]|$)/)
  // And we're not looking at the logged-out landing hero.
  await expect(page.getByText(/Films that know/i)).toHaveCount(0)
})

test('root redirects an authenticated user to /home', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/home(?:[/?#]|$)/)
})
