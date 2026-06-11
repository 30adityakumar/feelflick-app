import { test, expect } from '@playwright/test'
import { installPeopleFixture } from '../fixtures/people.js'

// Authenticated, deterministic /people visual baselines. Runs under the `visual-app` project (saved
// session + setup dependency). Every People read/write and every avatar image is intercepted by the
// fail-closed fixture, so the route is fully offline + reproducible. Reduced motion + a fixed clock +
// seeded RNG + an animation freeze pin every moving part; the fixed global chrome (header with the
// authenticated avatar + the mobile bottom nav) is hidden so no account identity is ever captured.
// Platform-specific baselines: Darwin generated locally, Linux via visual-baselines/people-*.
//
// Eight states (4 desktop + 4 mobile), mirroring Home/Discover/Movie/Library/Profile's eight.

const DESKTOP = { width: 1280, height: 720 }
const MOBILE = { width: 390, height: 844 }
const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
const HIDE_CHROME = 'header,.fixed.top-0.left-0.right-0,.fixed.bottom-0.left-0.right-0.z-30{display:none!important}'

const h1 = (page) => page.getByRole('heading', { level: 1 })
const followControl = (page, name) => page.getByRole('button', { name: new RegExp(`^(Follow|Unfollow) ${name}`) })

async function openPeople(page) {
  await page.goto('/people')
  await expect(h1(page)).toHaveText(/taste matches/i, { timeout: 20_000 })
}
async function freeze(page) {
  await page.addStyleTag({ content: FREEZE + HIDE_CHROME })
  await page.waitForTimeout(120)
}

test.describe('People — authenticated visual baselines', () => {
  // ── Desktop 1280×720 ──────────────────────────────────────────────────────────
  test('desktop — healthy first fold', async ({ page }) => {
    await installPeopleFixture(page, { reducedMotion: true })
    await page.setViewportSize(DESKTOP)
    await openPeople(page)
    await expect(followControl(page, 'Ana Okafor')).toBeVisible()
    await freeze(page)
    await expect(page).toHaveScreenshot('people-healthy-desktop.png')
  })

  test('desktop — discovery rails (bands, films-in-common, Follow/Hide)', async ({ page }) => {
    await installPeopleFixture(page, { reducedMotion: true })
    await page.setViewportSize(DESKTOP)
    await openPeople(page)
    await expect(followControl(page, 'Ana Okafor')).toBeVisible()
    await freeze(page)
    await expect(page.getByRole('region', { name: /More people to discover/i })).toHaveScreenshot('people-rails-desktop.png')
  })

  test('desktop — follow settled (Following)', async ({ page }) => {
    await installPeopleFixture(page, { reducedMotion: true, followWrite: 'success' })
    await page.setViewportSize(DESKTOP)
    await openPeople(page)
    await followControl(page, 'Ana Okafor').click()
    await expect(page.getByRole('button', { name: /^Unfollow Ana Okafor/ })).toHaveAttribute('aria-pressed', 'true')
    await freeze(page)
    await expect(page.getByRole('region', { name: /People who get it/i })).toHaveScreenshot('people-follow-settled-desktop.png')
  })

  test('desktop — empty discovery', async ({ page }) => {
    await installPeopleFixture(page, { reducedMotion: true, mode: 'empty' })
    await page.setViewportSize(DESKTOP)
    await openPeople(page)
    await expect(page.getByText('No taste matches yet')).toBeVisible()
    await freeze(page)
    await expect(page).toHaveScreenshot('people-empty-desktop.png')
  })

  // ── Mobile 390×844 ──────────────────────────────────────────────────────────────
  test('mobile — healthy first fold (wrapped)', async ({ page }) => {
    await installPeopleFixture(page, { reducedMotion: true })
    await page.setViewportSize(MOBILE)
    await openPeople(page)
    await expect(followControl(page, 'Ana Okafor')).toBeVisible()
    await freeze(page)
    await expect(page).toHaveScreenshot('people-healthy-mobile.png')
  })

  test('mobile — search results', async ({ page }) => {
    await installPeopleFixture(page, { reducedMotion: true, search: 'success' })
    await page.setViewportSize(MOBILE)
    await openPeople(page)
    await page.getByRole('textbox', { name: 'Search for users by name' }).fill('hal')
    await expect(followControl(page, 'Hal Voss')).toBeVisible()
    await freeze(page)
    await expect(page).toHaveScreenshot('people-search-mobile.png')
  })

  test('mobile — hidden suggestion (focus-safe)', async ({ page }) => {
    await installPeopleFixture(page, { reducedMotion: true })
    await page.setViewportSize(MOBILE)
    await openPeople(page)
    await page.getByRole('button', { name: 'Hide Ana Okafor from your suggestions' }).click()
    await expect(followControl(page, 'Ana Okafor')).toHaveCount(0)
    await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0) })
    await freeze(page)
    // region capture (scroll-stable): the twins rail re-rendered with Ana removed (Bo now first).
    await expect(page.getByRole('region', { name: /People who get it/i })).toHaveScreenshot('people-hidden-mobile.png')
  })

  test('mobile — degraded discovery (taste RPC failure)', async ({ page }) => {
    // get_discoverable_taste_profiles fails → cards still render from the identity RPC, but without
    // fingerprint totals the bands degrade gracefully (no crash, no raw error, honest fallbacks).
    await installPeopleFixture(page, { reducedMotion: true, rpc: 'taste_fail' })
    await page.setViewportSize(MOBILE)
    await openPeople(page)
    await expect(followControl(page, 'Ana Okafor')).toBeVisible()
    await freeze(page)
    await expect(page).toHaveScreenshot('people-degraded-mobile.png')
  })
})
