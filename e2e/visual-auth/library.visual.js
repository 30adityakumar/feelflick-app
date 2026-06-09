import { test, expect } from '@playwright/test'
import { installLibraryFixture } from '../fixtures/library.js'

// Authenticated, deterministic User Library visual baselines (/watchlist + /history).
// Runs under the `visual-app` project (saved session + setup dependency). Every Library
// read/write and every poster image is intercepted by the fixture, so the routes are
// fully offline + reproducible. Reduced motion + a fixed clock + seeded RNG + an
// animation freeze pin every moving part. The global app chrome (the fixed header — which
// carries the authenticated avatar — and the mobile bottom nav) is hidden so the captures
// show only the deterministic Library content and never any account identity.
// Platform-specific baselines: Darwin generated locally, Linux via visual-baselines/**.
//
// Eight states (4 desktop + 4 mobile), mirroring Home/Discover/Movie's eight.

const DESKTOP = { width: 1280, height: 720 }
const MOBILE = { width: 390, height: 844 }
const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
// Hide the position:fixed global chrome (header + scroll-progress + bottom nav) so it
// never lands mid-capture and no authenticated avatar/identity is rendered.
const HIDE_CHROME =
  'header,.fixed.top-0.left-0.right-0,.fixed.bottom-0.left-0.right-0.z-30{display:none!important}'

const h1 = (page) => page.getByRole('heading', { level: 1 })
async function freeze(page) {
  await page.addStyleTag({ content: FREEZE + HIDE_CHROME })
  await page.waitForTimeout(120)
}
async function openWatchlist(page) {
  await page.goto('/watchlist')
  await expect(h1(page)).toHaveText(/Saved for later\./, { timeout: 20_000 })
}
async function openDiary(page) {
  await page.goto('/history')
  await expect(h1(page)).toHaveText(/Your diary\./, { timeout: 20_000 })
}

test.describe('User Library — authenticated visual baselines', () => {
  // ── Desktop 1280×720 ──────────────────────────────────────────────────────────
  test('desktop — Watchlist populated', async ({ page }) => {
    await installLibraryFixture(page, { reducedMotion: true })
    await page.setViewportSize(DESKTOP)
    await openWatchlist(page)
    await freeze(page)
    await expect(page).toHaveScreenshot('watchlist-populated-desktop.png')
  })

  test('desktop — Watchlist filtered-empty', async ({ page }) => {
    await installLibraryFixture(page, { reducedMotion: true })
    await page.setViewportSize(DESKTOP)
    await openWatchlist(page)
    // Tense has one film (North); removing it empties the active mood filter.
    await page.getByRole('group', { name: 'Filter by film mood' }).getByRole('button', { name: 'Tense' }).click()
    await page.getByRole('button', { name: 'Remove North from Watchlist' }).click()
    await expect(page.getByText('No saved films match this mood.')).toBeVisible()
    await freeze(page)
    await expect(page).toHaveScreenshot('watchlist-filtered-empty-desktop.png')
  })

  test('desktop — Diary populated', async ({ page }) => {
    await installLibraryFixture(page, { reducedMotion: true })
    await page.setViewportSize(DESKTOP)
    await openDiary(page)
    await freeze(page)
    await expect(page).toHaveScreenshot('diary-populated-desktop.png')
  })

  test('desktop — Diary removal dialog', async ({ page }) => {
    await installLibraryFixture(page, { reducedMotion: true })
    await page.setViewportSize(DESKTOP)
    await openDiary(page)
    await page.getByRole('button', { name: 'Remove Lantern Hill from diary' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await freeze(page)
    await expect(page).toHaveScreenshot('diary-remove-dialog-desktop.png')
  })

  // ── Mobile 390×844 ──────────────────────────────────────────────────────────────
  test('mobile — Watchlist populated', async ({ page }) => {
    await installLibraryFixture(page, { reducedMotion: true })
    await page.setViewportSize(MOBILE)
    await openWatchlist(page)
    await freeze(page)
    await expect(page).toHaveScreenshot('watchlist-populated-mobile.png')
  })

  test('mobile — Watchlist true-empty', async ({ page }) => {
    await installLibraryFixture(page, { reducedMotion: true, mode: 'empty' })
    await page.setViewportSize(MOBILE)
    await openWatchlist(page)
    await freeze(page)
    await expect(page).toHaveScreenshot('watchlist-empty-mobile.png')
  })

  test('mobile — Diary populated', async ({ page }) => {
    await installLibraryFixture(page, { reducedMotion: true })
    await page.setViewportSize(MOBILE)
    await openDiary(page)
    await freeze(page)
    await expect(page).toHaveScreenshot('diary-populated-mobile.png')
  })

  test('mobile — Diary searched-empty', async ({ page }) => {
    await installLibraryFixture(page, { reducedMotion: true })
    await page.setViewportSize(MOBILE)
    await openDiary(page)
    await page.getByLabel('Search the diary').fill('zzzzz')
    await expect(page.getByText('0 of 4 match “zzzzz”')).toBeVisible()
    await freeze(page)
    await expect(page).toHaveScreenshot('diary-searched-empty-mobile.png')
  })
})
