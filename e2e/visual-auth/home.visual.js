import { test, expect } from '@playwright/test'
import { installHomeFixture } from '../fixtures/home.js'

// Authenticated, deterministic visual baselines for the redesigned Home (bounded
// personal discovery). Runs under the `visual-app` project (saved session + setup
// dependency). installHomeFixture intercepts every Home read/write + TMDB with a
// fixed clock + seeded RNG + reduced motion, so the route is offline + reproducible.
// Platform-specific baselines: Darwin generated locally, Linux via the
// visual-baselines/** CI flow.
//
// The composition is engine-driven (hero + bounded rows OR an honest cold state),
// so we anchor on the always-present shortcut strip rather than specific films, then
// capture the full page for human review.

const DESKTOP = { width: 1280, height: 720 }
const MOBILE = { width: 390, height: 844 }
const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
// The AppShell mobile bottom nav is position:fixed and would overlap a full-page
// capture (chrome is tested separately). Hide it so the Home composition is clean.
const HIDE_CHROME = '.fixed.bottom-0.left-0.right-0.z-30{display:none!important}'

const shortcuts = (page) => page.getByRole('navigation', { name: 'Quick actions' })

async function gotoHome(page, opts = {}) {
  await installHomeFixture(page, { reducedMotion: true, ...opts })
  await page.goto('/home')
  // Settled into content or the honest cold state (both render the shortcut strip).
  await expect(shortcuts(page)).toBeVisible({ timeout: 20_000 })
}
async function freeze(page) {
  await page.addStyleTag({ content: FREEZE + HIDE_CHROME })
  await page.waitForTimeout(150)
}

test.describe('Home — authenticated visual baselines (redesign)', () => {
  test('desktop — full Home composition', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await gotoHome(page)
    await freeze(page)
    await expect(page).toHaveScreenshot('home-desktop.png', { fullPage: true })
  })

  test('mobile — full Home composition', async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await gotoHome(page)
    await freeze(page)
    await expect(page).toHaveScreenshot('home-mobile.png', { fullPage: true })
  })

  test('desktop — honest cold-start state', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await gotoHome(page, { dataState: 'no_candidates' })
    await freeze(page)
    await expect(page).toHaveScreenshot('home-cold-desktop.png', { fullPage: true })
  })
})
