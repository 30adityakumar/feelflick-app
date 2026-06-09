import { test, expect } from '@playwright/test'
import { installMovieFixture, MOVIE } from '../fixtures/movie.js'

// Authenticated, deterministic Film File (/movie/:id) visual baselines. Runs under the
// `visual-app` project (saved session + setup dependency). Every Film File read/write,
// the overlay Edge Function, TMDB, and all poster/embed images are intercepted by the
// fixture, so the route is fully offline + reproducible. Reduced motion + a fixed clock
// + seeded RNG + an animation freeze pin every moving part. Platform-specific baselines:
// Darwin generated locally, Linux via the visual-baselines/** CI flow.
//
// Eight states (4 desktop + 4 mobile), mirroring Home/Discover's eight.

const DESKTOP = { width: 1280, height: 720 }
const MOBILE = { width: 390, height: 844 }
const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
// Hide the position:fixed surfaces that would land mid-content in a capture: the
// scroll-progress bar, film grain, the sticky action bar (behavior tested in E2E),
// the skip link, and the mobile app-shell bottom nav (chrome tested separately).
const HIDE_CHROME =
  '.ff-movie-scroll-progress,.ff-movie-grain,.ff-movie-sticky-bar,.ff-movie-skip-link{display:none!important}' +
  '.fixed.bottom-0.left-0.right-0.z-30{display:none!important}'

const ROUTE = `/movie/${MOVIE.tmdbId}`

async function freeze(page) {
  await page.addStyleTag({ content: FREEZE + HIDE_CHROME })
  await page.waitForTimeout(120)
}
async function load(page) {
  await page.goto(ROUTE)
  await expect(page.getByRole('heading', { level: 1, name: MOVIE.title })).toBeVisible({ timeout: 20_000 })
}
const disclosure = (page, name) => page.locator('details', { has: page.getByText(name, { exact: true }) })
async function openDisclosure(page, name) {
  const d = disclosure(page, name)
  await d.locator('summary').scrollIntoViewIfNeeded()
  if (!(await d.evaluate((el) => el.open))) await d.locator('summary').click()
}
async function scrollTo(page, locator) {
  await locator.scrollIntoViewIfNeeded()
  await page.waitForTimeout(60)
}

test.describe('Film File — authenticated visual baselines', () => {
  // ── Desktop 1280×720 ──────────────────────────────────────────────────────────
  test('desktop — hero + primary case', async ({ page }) => {
    await installMovieFixture(page, { reducedMotion: true })
    await page.setViewportSize(DESKTOP)
    await load(page)
    await freeze(page)
    await expect(page).toHaveScreenshot('hero-case-desktop.png')
  })

  test('desktop — synopsis + provider found', async ({ page }) => {
    await installMovieFixture(page, { reducedMotion: true, providerMode: 'found' })
    await page.setViewportSize(DESKTOP)
    await load(page)
    await freeze(page)
    await scrollTo(page, page.getByLabel('Where to watch'))
    await expect(page).toHaveScreenshot('synopsis-provider-desktop.png')
  })

  test('desktop — decision evidence expanded', async ({ page }) => {
    await installMovieFixture(page, { reducedMotion: true })
    await page.setViewportSize(DESKTOP)
    await load(page)
    await openDisclosure(page, 'Why this film')
    await freeze(page)
    await scrollTo(page, disclosure(page, 'Why this film'))
    await expect(page).toHaveScreenshot('decision-evidence-desktop.png')
  })

  test('desktop — tail: social + exploration expanded', async ({ page }) => {
    await installMovieFixture(page, { reducedMotion: true })
    await page.setViewportSize(DESKTOP)
    await load(page)
    await openDisclosure(page, 'What others thought')
    await openDisclosure(page, 'Explore from here')
    await freeze(page)
    await expect(page).toHaveScreenshot('tail-expanded-desktop.png', { fullPage: true })
  })

  // ── Mobile 390×844 ────────────────────────────────────────────────────────────
  test('mobile — hero / primary action fold', async ({ page }) => {
    await installMovieFixture(page, { reducedMotion: true })
    await page.setViewportSize(MOBILE)
    await load(page)
    await freeze(page)
    await expect(page).toHaveScreenshot('hero-fold-mobile.png')
  })

  test('mobile — synopsis + provider empty', async ({ page }) => {
    await installMovieFixture(page, { reducedMotion: true, providerMode: 'empty' })
    await page.setViewportSize(MOBILE)
    await load(page)
    await freeze(page)
    await scrollTo(page, page.getByLabel('Where to watch'))
    await expect(page).toHaveScreenshot('synopsis-provider-empty-mobile.png')
  })

  test('mobile — watched / full Your Take', async ({ page }) => {
    await installMovieFixture(page, { reducedMotion: true, watched: true })
    await page.setViewportSize(MOBILE)
    await load(page)
    // wait for the watched reflection form to settle (the isWatched flip remounts the
    // section) before anchoring the capture to the stable star-rating control.
    const stars = page.getByLabel('Your star rating')
    await expect(stars).toBeVisible({ timeout: 10_000 })
    await freeze(page)
    await scrollTo(page, stars)
    await expect(page).toHaveScreenshot('your-take-mobile.png')
  })

  test('mobile — lower tail / disclosures', async ({ page }) => {
    await installMovieFixture(page, { reducedMotion: true })
    await page.setViewportSize(MOBILE)
    await load(page)
    await openDisclosure(page, 'What others thought')
    await openDisclosure(page, 'Explore from here')
    await freeze(page)
    await expect(page).toHaveScreenshot('tail-mobile.png', { fullPage: true })
  })
})
