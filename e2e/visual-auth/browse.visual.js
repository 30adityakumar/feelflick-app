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
//   Compact topbar (Browse title + scoped search + Surprise me), the sticky
//   filter bar (Genre / Era / Language / Runtime / Hidden gems + Sort), and the
//   dense 18-film poster grid + finite pagination. They lock that composition +
//   the shared-chrome integration + responsive grid behaviour.

const DESKTOP = { width: 1280, height: 720 }
const MOBILE = { width: 390, height: 844 }
const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
const HIDE_CHROME = '.fixed.bottom-0.left-0.right-0.z-30{display:none!important}'

async function gotoBrowse(page, url = '/browse') {
  await installBrowseFixture(page, { reducedMotion: true })
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Browse' })).toBeVisible({ timeout: 20_000 })
  // Settle into results (grid card present).
  await expect(page.getByRole('button', { name: /Open Film File for Browse Film 1$/ })).toBeVisible({ timeout: 20_000 })
}
async function freeze(page) {
  await page.addStyleTag({ content: FREEZE + HIDE_CHROME })
  await page.waitForTimeout(150)
}

test.describe('Browse — authenticated visual baselines (redesign)', () => {
  test('desktop — topbar + filter bar + grid', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await gotoBrowse(page)
    await freeze(page)
    await expect(page).toHaveScreenshot('browse-desktop.png', { fullPage: true })
  })

  test('mobile — topbar + filter strip + grid', async ({ page }) => {
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
