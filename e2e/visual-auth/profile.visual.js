import { test, expect } from '@playwright/test'
import { installProfileFixture } from '../fixtures/profile.js'

// Authenticated, deterministic Cinematic DNA visual baselines (/profile). Runs under the
// `visual-app` project (saved session + setup dependency). Every Profile read/write, the editorial
// Edge Function, and every image are intercepted by the fixture, so the route is fully offline +
// reproducible (fixed clock + seeded RNG + reduced motion + animation freeze). The fixed global
// chrome (header carrying the authenticated avatar + bottom nav) is hidden so captures show only
// deterministic Cinematic DNA content and never any account identity.
//
// Eight states (4 desktop + 4 mobile), mirroring Home/Discover/Movie/Library's eight, chosen to
// capture the largest F7.4–F7.6 trust + accessibility changes (labelled reflection, evidence
// summary, qualitative confidence, forming suppression, stale refresh prompt, denominated charts).

const DESKTOP = { width: 1280, height: 720 }
const MOBILE = { width: 390, height: 844 }
const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
const HIDE_CHROME = 'header,.fixed.top-0.left-0.right-0,.fixed.bottom-0.left-0.right-0{display:none!important}'

async function open(page) {
  await page.goto('/profile')
  await expect(page.locator('#cinematic-dna-content')).toBeVisible({ timeout: 20_000 })
}
async function freeze(page) {
  await page.addStyleTag({ content: FREEZE + HIDE_CHROME })
  await page.waitForTimeout(150)
}
const shot = (page, sel) => expect(page.locator(sel).first())

test.describe('Cinematic DNA — authenticated visual baselines', () => {
  // ── Desktop 1280×720 ──────────────────────────────────────────────────────────
  test('desktop — established hero + current reflection', async ({ page }) => {
    await installProfileFixture(page, { mode: 'established_current', reducedMotion: true })
    await page.setViewportSize(DESKTOP)
    await open(page)
    await freeze(page)
    await shot(page, '.ff-profile-masthead').toHaveScreenshot('profile-hero-established-desktop.png')
  })

  test('desktop — evidence + qualitative confidence', async ({ page }) => {
    await installProfileFixture(page, { mode: 'established_current', reducedMotion: true })
    await page.setViewportSize(DESKTOP)
    await open(page)
    await freeze(page)
    await shot(page, '.ff-profile-dnaconf-grid').toHaveScreenshot('profile-confidence-desktop.png')
  })

  test('desktop — stale editorial: explicit refresh prompt', async ({ page }) => {
    await installProfileFixture(page, { mode: 'established_stale', reducedMotion: true })
    await page.setViewportSize(DESKTOP)
    await open(page)
    await freeze(page)
    await shot(page, '.ff-profile-masthead').toHaveScreenshot('profile-stale-refresh-desktop.png')
  })

  test('desktop — Mood Radar + ordered textual equivalent', async ({ page }) => {
    await installProfileFixture(page, { mode: 'established_current', reducedMotion: true })
    await page.setViewportSize(DESKTOP)
    await open(page)
    await freeze(page)
    await shot(page, '.ff-profile-mood-grid').toHaveScreenshot('profile-moodradar-desktop.png')
  })

  // ── Mobile 390×844 ────────────────────────────────────────────────────────────
  test('mobile — forming hero (no generated identity)', async ({ page }) => {
    await installProfileFixture(page, { mode: 'forming', reducedMotion: true })
    await page.setViewportSize(MOBILE)
    await open(page)
    await freeze(page)
    await shot(page, '.ff-profile-masthead').toHaveScreenshot('profile-forming-hero-mobile.png')
  })

  test('mobile — established hero fold (wrapped masthead + signature)', async ({ page }) => {
    await installProfileFixture(page, { mode: 'established_current', reducedMotion: true })
    await page.setViewportSize(MOBILE)
    await open(page)
    await freeze(page)
    await shot(page, '.ff-profile-masthead').toHaveScreenshot('profile-hero-established-mobile.png')
  })

  test('mobile — refresh settled to a new reflection', async ({ page }) => {
    await installProfileFixture(page, { mode: 'established_missing', edgeMode: 'success', reducedMotion: true })
    await page.setViewportSize(MOBILE)
    await open(page)
    await page.getByRole('button', { name: /generate reflection/i }).click()
    await expect(page.getByText(/A freshly generated reflection/)).toBeVisible({ timeout: 10_000 })
    await freeze(page)
    await shot(page, '.ff-profile-masthead').toHaveScreenshot('profile-refresh-settled-mobile.png')
  })

  test('mobile — viewing patterns (decade / runtime / daypart, denominated)', async ({ page }) => {
    await installProfileFixture(page, { mode: 'established_current', reducedMotion: true })
    await page.setViewportSize(MOBILE)
    await open(page)
    await freeze(page)
    await shot(page, '.ff-profile-pattern-grid').toHaveScreenshot('profile-patterns-mobile.png')
  })
})
