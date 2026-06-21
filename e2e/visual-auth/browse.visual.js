import { test, expect } from '@playwright/test'
import { installBrowseFixture } from '../fixtures/browse.js'

// Authenticated, deterministic visual baselines for the redesigned /browse
// ("explicit curiosity"). Runs under the `visual-app` project (saved session +
// setup dependency). installBrowseFixture intercepts every Browse read/write +
// TMDB with a fixed clock + seeded RNG + reduced motion, so the route is offline
// and reproducible. Platform-specific baselines: Darwin generated locally, Linux
// via the visual-baselines/browse-* CI flow.
//
// WHAT THESE CAPTURE — and what they intentionally don't:
//   Masthead (eyebrow + "Follow your curiosity." + ribbon + scoped search +
//   scoped surprise), the "Start somewhere" curiosity row (EDITORIAL paths under
//   the offline cold profile), the sticky filter bar + sort tabs, and the dense
//   18-film poster grid + finite pagination. They lock that composition + the
//   shared-chrome integration + responsive grid behaviour.
//
//   PERSONAL curiosity paths (top genre / world cinema / filmmaker) depend on a
//   live profile (computeUserProfileV3 over real history/ratings/similarity) that
//   can't be faithfully synthesised offline, so the fixture is cold and they're
//   covered by unit tests (useCuriosityPaths). See
//   docs/browse/browse-explicit-curiosity-redesign.md.

const DESKTOP = { width: 1280, height: 720 }
const MOBILE = { width: 390, height: 844 }
const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
const HIDE_CHROME = '.fixed.bottom-0.left-0.right-0.z-30{display:none!important}'

async function gotoBrowse(page, url = '/browse') {
  await installBrowseFixture(page, { reducedMotion: true })
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Follow your curiosity.' })).toBeVisible({ timeout: 20_000 })
  // Settle into results (grid card present).
  await expect(page.getByRole('button', { name: /Open Film File for Browse Film 1$/ })).toBeVisible({ timeout: 20_000 })
}
async function freeze(page) {
  await page.addStyleTag({ content: FREEZE + HIDE_CHROME })
  await page.waitForTimeout(150)
}

test.describe('Browse — authenticated visual baselines (redesign)', () => {
  test('desktop — masthead + curiosity paths + filter bar + grid', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await gotoBrowse(page)
    await freeze(page)
    await expect(page).toHaveScreenshot('browse-desktop.png', { fullPage: true })
  })

  test('mobile — masthead + curiosity paths + grid', async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await gotoBrowse(page)
    await freeze(page)
    await expect(page).toHaveScreenshot('browse-mobile.png', { fullPage: true })
  })

  test('desktop — territory selected (genre + active chip)', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await gotoBrowse(page, '/browse?genre=Drama&sort=ff_critic_rating.desc')
    await freeze(page)
    await expect(page).toHaveScreenshot('browse-territory-desktop.png', { fullPage: true })
  })
})
