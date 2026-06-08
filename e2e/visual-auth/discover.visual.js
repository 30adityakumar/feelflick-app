import { test, expect } from '@playwright/test'
import { installDiscoverFixture } from '../fixtures/discover.js'

// Authenticated, deterministic Discover visual baselines. Runs under the
// `visual-app` project (saved session + setup dependency). Every Discover read/
// write, the TMDB provider, and all poster images are intercepted by the fixture,
// so the route is fully offline + reproducible. Reduced motion + a fixed clock +
// seeded RNG + an animation freeze pin every moving part. Platform-specific
// baselines: Darwin generated locally, Linux via the visual-baselines/** CI flow.
//
// We deliberately do NOT baseline the transient StageResolve (it's 0ms under
// reduced motion and would be brittle to freeze mid-transition).

const DESKTOP = { width: 1280, height: 720 }
const MOBILE = { width: 390, height: 844 }
const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
// Hide the two position:fixed overlays that land mid-content in a full-page
// capture: the mobile app-shell bottom nav (chrome tested separately) and the
// Discover AudioToggle (behavior tested in the E2E keyboard test + unit tests).
// This keeps the Discover composition itself fully visible and unobscured.
const HIDE_CHROME =
  '.fixed.bottom-0.left-0.right-0.z-30{display:none!important}' +
  'button[aria-label="Sound off"],button[aria-label="Sound on"]{display:none!important}'

const moodBtn = (page) => page.locator('button:has(.ff-mood-label:text-is("Tender"))')

async function freeze(page) {
  await page.addStyleTag({ content: FREEZE + HIDE_CHROME })
  await page.waitForTimeout(120)
}
async function gotoMood(page) {
  await page.goto('/discover')
  await expect(moodBtn(page)).toBeVisible({ timeout: 20_000 })
}
async function gotoSummary(page) {
  await gotoMood(page)
  await moodBtn(page).click()
  await page.getByRole('button', { name: /^continue/i }).click()
  await expect(page.getByRole('heading', { name: 'A few details, already filled in.' })).toBeVisible()
}
async function gotoExpanded(page) {
  await gotoSummary(page)
  await page.getByRole('button', { name: /adjust details/i }).click()
  await expect(page.getByRole('button', { name: /done adjusting/i })).toBeVisible()
}
async function gotoResult(page) {
  await gotoSummary(page)
  await page.getByRole('button', { name: /find my film/i }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'The Quiet Hour' })).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('Mock Stream')).toBeVisible({ timeout: 5_000 }) // deterministic provider chip
}

test.describe('Discover — authenticated visual baselines', () => {
  for (const [device, vp] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
    const full = device === 'mobile' // mobile result/editor stack taller than the viewport

    test(`${device} — mood front door`, async ({ page }) => {
      await installDiscoverFixture(page, { reducedMotion: true })
      await page.setViewportSize(vp)
      await gotoMood(page)
      await freeze(page)
      await expect(page).toHaveScreenshot(`mood-${device}.png`)
    })

    test(`${device} — night-context summary`, async ({ page }) => {
      await installDiscoverFixture(page, { reducedMotion: true })
      await page.setViewportSize(vp)
      await gotoSummary(page)
      await freeze(page)
      await expect(page).toHaveScreenshot(`night-summary-${device}.png`)
    })

    test(`${device} — night-context details expanded`, async ({ page }) => {
      await installDiscoverFixture(page, { reducedMotion: true })
      await page.setViewportSize(vp)
      await gotoExpanded(page)
      await freeze(page)
      await expect(page).toHaveScreenshot(`night-details-${device}.png`, { fullPage: full })
    })

    test(`${device} — one-pick result`, async ({ page }) => {
      await installDiscoverFixture(page, { reducedMotion: true })
      await page.setViewportSize(vp)
      await gotoResult(page)
      await freeze(page)
      await expect(page).toHaveScreenshot(`result-${device}.png`, { fullPage: full })
    })
  }
})
