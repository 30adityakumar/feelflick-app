import { test, expect } from '@playwright/test'
import { installHomeFixture } from '../fixtures/home.js'

// Authenticated, deterministic Home visual baselines. Runs under the `visual-app`
// project (saved session + setup dependency). installHomeFixture intercepts every
// Home read/write + TMDB, with a fixed clock + seeded RNG + reduced motion, so the
// route is fully offline + reproducible. Platform-specific baselines: Darwin
// generated locally, Linux via the visual-baselines/** CI flow.

const DESKTOP = { width: 1280, height: 720 }
const MOBILE = { width: 390, height: 844 }
const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
// The mobile app-shell bottom nav is position:fixed and would overlap Home content
// in a full/section capture (chrome tested separately, not Home). Hide it so the
// Home composition itself is fully visible.
const HIDE_CHROME = '.fixed.bottom-0.left-0.right-0.z-30{display:none!important}'

// h2 inside the labelled Briefing region — never the QuickLog / PageEndCard h2.
const pick = (page) => page.getByRole('region', { name: "Tonight's briefing" }).getByRole('heading', { level: 2 })
const quickLogSection = (page) => page.locator('section').filter({ hasText: 'Feed the engine' })
const discoverSection = (page) => page.locator('section').filter({ hasText: 'Or shape your own' })

async function freeze(page) {
  await page.addStyleTag({ content: FREEZE + HIDE_CHROME })
  await page.waitForTimeout(120)
}
async function gotoHome(page, opts = {}) {
  await installHomeFixture(page, { reducedMotion: true, ...opts })
  await page.goto('/home')
  await expect(pick(page)).toBeVisible({ timeout: 20_000 })
  if (opts.providerState === 'found' || !opts.providerState) {
    // wait for the deterministic provider chip so the capture is stable
    await page.getByText('Mock Stream').first().waitFor({ timeout: 5_000 }).catch(() => {})
  }
}
async function selectCozy(page) {
  await page.getByRole('button', { name: 'Cozy', exact: true }).click()
  await expect(pick(page)).toHaveText('The Long Quiet')
}

test.describe('Home — authenticated visual baselines', () => {
  // ── Desktop 1280×720 ──────────────────────────────────────────────────────────
  test('desktop — Home Briefing (initial pick, provider found)', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await gotoHome(page, { providerState: 'found' })
    await freeze(page)
    await expect(page).toHaveScreenshot('home-briefing-desktop.png')
  })

  test('desktop — Adjust mood (alternate deterministic pick)', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await gotoHome(page, { providerState: 'found' })
    await selectCozy(page)
    await freeze(page)
    await expect(page).toHaveScreenshot('home-adjusted-mood-desktop.png')
  })

  test('desktop — provider empty (honest availability copy)', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await gotoHome(page, { providerState: 'empty' })
    await expect(page.getByText('Availability not found')).toBeVisible()
    await freeze(page)
    await expect(page).toHaveScreenshot('home-provider-empty-desktop.png')
  })

  test('desktop — QuickLog + Discover tail', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await gotoHome(page)
    await quickLogSection(page).scrollIntoViewIfNeeded()
    await freeze(page)
    await expect(quickLogSection(page)).toHaveScreenshot('home-tail-desktop.png')
  })

  // ── Mobile 390×844 ────────────────────────────────────────────────────────────
  test('mobile — Home Briefing (initial fold)', async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await gotoHome(page, { providerState: 'found' })
    await freeze(page)
    await expect(page).toHaveScreenshot('home-briefing-mobile.png')
  })

  test('mobile — Adjust mood (mood strip + alternate pick)', async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await gotoHome(page, { providerState: 'found' })
    await selectCozy(page)
    await freeze(page)
    await expect(page).toHaveScreenshot('home-adjusted-mood-mobile.png')
  })

  test('mobile — QuickLog interaction surface', async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await gotoHome(page)
    await quickLogSection(page).scrollIntoViewIfNeeded()
    await freeze(page)
    await expect(quickLogSection(page)).toHaveScreenshot('home-quicklog-mobile.png')
  })

  test('mobile — Discover closing card', async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await gotoHome(page)
    await discoverSection(page).scrollIntoViewIfNeeded()
    await freeze(page)
    await expect(discoverSection(page)).toHaveScreenshot('home-discover-close-mobile.png')
  })
})
