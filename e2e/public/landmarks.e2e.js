import { test, expect } from '@playwright/test'

// F2-B: landmark & heading hygiene. One <main> per document, one id="main",
// a working skip-link target, exactly one h1 on /discover, and an AT-intact
// drop-cap sentence on the landing.
//
// NOTE: /movie/:id is intentionally NOT asserted here — its second <main
// id="film-file-content"> is referenced by e2e/app/movie.e2e.js, movie.css and
// FilmFileLandmarks.test.jsx, so that conversion was stopped per F2-B's stop
// condition and is documented in docs/movie/f5-summary.md for a deliberate
// future pass (section[role=region] + coordinated test updates).

test('landing: single <main>, single id="main", skip link targets it', async ({ page }) => {
  await page.goto('/')
  // Landing is lazy-loaded: assert only after its content mounts, otherwise the
  // count passes trivially against the shell during the Suspense window.
  await expect(page.getByRole('heading', { level: 1, name: /films that know you/i })).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('main')).toHaveCount(1)
  await expect(page.locator('[id="main"]')).toHaveCount(1)

  const target = page.locator('#main')
  await expect(target).toHaveCount(1)
  expect(await target.evaluate((el) => el.tagName)).toBe('MAIN')

  const skip = page.locator('a.ff-skip[href="#main"]')
  await expect(skip).toHaveCount(1)
})

test('landing: drop-cap sentence is intact for assistive tech, split fragments hidden', async ({ page }) => {
  await page.goto('/')

  // The Film File demo paragraph (the only one carrying the drop cap).
  const para = page.locator('p.ff-body', { hasText: 'Los Angeles' }).first()
  await expect(para).toBeAttached()

  const probe = await para.evaluate((p) => {
    const dropCap = p.querySelector('span[style*="float"]') || p.querySelector('.ff-italic')
    const srOnly = p.querySelector('.sr-only')
    // Accessible-text computation: remove aria-hidden subtrees, read what's left.
    const clone = p.cloneNode(true)
    clone.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove())
    return {
      dropCapHidden: dropCap?.getAttribute('aria-hidden') === 'true',
      dropCapVisibleChar: dropCap?.textContent ?? null,
      srOnlyText: srOnly?.textContent ?? null,
      accessibleText: clone.textContent.replace(/\s+/g, ' ').trim(),
    }
  })

  // Visual fragments exist but are hidden from AT…
  expect(probe.dropCapVisibleChar, 'visual drop cap still renders').toBe('N')
  expect(probe.dropCapHidden, 'split drop-cap fragment must be aria-hidden').toBe(true)
  // …and the accessible text is the intact sentence.
  expect(probe.accessibleText).toMatch(/^Near-future Los Angeles\./)
  expect(probe.srOnlyText).toMatch(/^Near-future Los Angeles\./)
})

test('discover: single <main> and exactly one h1 (the mood question)', async ({ page }) => {
  await page.goto('/discover')
  await expect(page.locator('main')).toHaveCount(1)

  // Each Discover stage owns exactly one <h1>; the opening stage's is the mood
  // question. Later stages swap in their own single h1 (the night-context
  // checkpoint, then the pick title) — never two at once.
  const h1 = page.locator('h1')
  await expect(h1).toHaveCount(1, { timeout: 15_000 })
  await expect(h1).toHaveText(/How should tonight feel\?$/)
})
