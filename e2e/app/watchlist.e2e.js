import { test, expect } from '@playwright/test'

// Exercises the exact write path the 2026-05-29 RLS migration touched: a movie
// detail page → toggle Save → user_watchlist write (RLS-protected, self-owned).
// Self-cleaning (ends un-saved) and idempotent, so it's safe to run repeatedly.
//
// The Save toggle is OPTIMISTIC (flips aria-pressed before the network write
// resolves), so we wait on the actual user_watchlist request to complete before
// asserting/reloading — otherwise a reload aborts the in-flight write.
const TMDB_ID = 350 // The Devil Wears Prada — stable catalog title
const WL = /\/rest\/v1\/user_watchlist/
const saveButton = (page) => page.getByRole('button', { name: /^Saved?$/ }).first()

test('Save adds a film to the watchlist and the change persists', async ({ page }) => {
  await page.goto(`/movie/${TMDB_ID}`)
  const save = saveButton(page)
  await expect(save).toBeVisible()
  // Movie data + initial watchlist-status fetch must settle so the toggle is
  // functional (it no-ops until the internal movie id resolves).
  await page.waitForLoadState('networkidle')

  // Normalize: ensure we start un-saved (await the DELETE if needed).
  if ((await save.getAttribute('aria-pressed')) === 'true') {
    await Promise.all([
      page.waitForResponse((r) => WL.test(r.url()) && r.request().method() === 'DELETE'),
      save.click(),
    ])
    await expect(save).toHaveAttribute('aria-pressed', 'false')
  }

  // ADD — wait for the POST to actually complete (not just the optimistic flip).
  const [addResp] = await Promise.all([
    page.waitForResponse((r) => WL.test(r.url()) && r.request().method() === 'POST'),
    save.click(),
  ])
  expect(addResp.ok(), 'user_watchlist POST should succeed').toBeTruthy()
  await expect(save).toHaveAttribute('aria-pressed', 'true')
  await expect(save).toHaveText(/Saved/)

  // Reload → proves it persisted to the DB, not just optimistic UI. This is the
  // assertion that fails if an RLS/grant regression blocks user_watchlist writes.
  await page.reload()
  await page.waitForLoadState('networkidle')
  const saveAfter = saveButton(page)
  await expect(saveAfter).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 })

  // Cleanup + exercise the remove path (await the DELETE).
  const [delResp] = await Promise.all([
    page.waitForResponse((r) => WL.test(r.url()) && r.request().method() === 'DELETE'),
    saveAfter.click(),
  ])
  expect(delResp.ok(), 'user_watchlist DELETE should succeed').toBeTruthy()
  await expect(saveAfter).toHaveAttribute('aria-pressed', 'false')
})
