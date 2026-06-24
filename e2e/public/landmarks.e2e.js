import { test, expect } from '@playwright/test'

// Landmark & heading hygiene. The redesigned landing is a TOP-LEVEL route that owns
// its own <header>/<main id="main">/<footer> as SIBLINGS (not nested inside a shell
// main). One <main> per document, one id="main", a working skip link, exactly one h1,
// and exactly one h1 on /discover.
//
// NOTE: /movie/:id is intentionally NOT asserted here — its second labelled region is
// covered by e2e/app/movie.e2e.js + FilmFileLandmarks.test.jsx.

test('landing: single <main>, single id="main", skip link, sibling header/footer', async ({ page }) => {
  await page.goto('/')
  // Landing is lazy-loaded: assert only after its content mounts.
  await expect(page.getByRole('heading', { level: 1, name: /movies, made personal/i })).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('main')).toHaveCount(1)
  await expect(page.locator('[id="main"]')).toHaveCount(1)
  await expect(page.locator('h1')).toHaveCount(1)

  const target = page.locator('#main')
  await expect(target).toHaveCount(1)
  expect(await target.evaluate((el) => el.tagName)).toBe('MAIN')

  // Skip link targets the landing's own main.
  await expect(page.locator('a.ff-l-skip[href="#main"]')).toHaveCount(1)

  // The PAGE-level banner header + contentinfo footer are SIBLINGS of main (not
  // nested inside it). Section-level <header class="ff-l-section-head"> elements are
  // valid generic headers inside <main> and are intentionally not asserted here.
  await expect(page.locator('main .ff-l-header, main .ff-l-footer')).toHaveCount(0)
  await expect(page.locator('.ff-landing > header.ff-l-header')).toHaveCount(1)
  await expect(page.locator('.ff-landing > footer.ff-l-footer')).toHaveCount(1)
})

test('discover: single <main> and exactly one h1 (the mood question)', async ({ page }) => {
  await page.goto('/discover')
  await expect(page.locator('main')).toHaveCount(1)
  const h1 = page.locator('h1')
  await expect(h1).toHaveCount(1, { timeout: 15_000 })
  await expect(h1).toHaveText(/How should tonight feel\?$/)
})
