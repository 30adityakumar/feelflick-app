import { test, expect } from '@playwright/test'
import { installHomeFixture } from '../fixtures/home.js'

// Authenticated, deterministic visual baselines for the redesigned Home (bounded
// personal discovery). Runs under the `visual-app` project (saved session + setup
// dependency). installHomeFixture intercepts every Home read/write + TMDB with a
// fixed clock + seeded RNG + reduced motion, so the route is offline + reproducible.
// Platform-specific baselines: Darwin generated locally, Linux via the
// visual-baselines/** CI flow.
//
// WHAT THESE CAPTURE — and what they intentionally don't:
//   The fixture drives the REAL v3 homepage row engine offline, which
//   deterministically produces the poster-led recommendation rows (e.g. "More
//   from <director>", "Because you loved <seed>") + the Cinematic DNA strip, plus
//   the honest cold-start state. These baselines lock that composition + the
//   shared-chrome integration + responsive grid↔carousel behaviour.
//
//   The full-bleed HERO + the embedding-heavy TOP_OF_TASTE / mood rows are NOT
//   asserted here: the v3 hero/TOP_OF_TASTE scoring depends on live embedding /
//   seed-similarity context that cannot be faithfully synthesised from an offline
//   Supabase fixture. The hero is covered by unit tests (HomeHero.test.jsx — nav,
//   active-film update, impressions, Save/Watched/Not-tonight/Open Film File) and
//   was visually validated across all eight viewports via a dev-only preview. See
//   docs/home/home-bounded-discovery-redesign.md.

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
  test('desktop — personalized rows + Cinematic DNA', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await gotoHome(page)
    await freeze(page)
    await expect(page).toHaveScreenshot('home-rows-desktop.png', { fullPage: true })
  })

  test('mobile — personalized rows + Cinematic DNA', async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await gotoHome(page)
    await freeze(page)
    await expect(page).toHaveScreenshot('home-rows-mobile.png', { fullPage: true })
  })

  test('desktop — honest cold-start state', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await gotoHome(page, { dataState: 'no_candidates' })
    await freeze(page)
    await expect(page).toHaveScreenshot('home-cold-desktop.png', { fullPage: true })
  })
})
