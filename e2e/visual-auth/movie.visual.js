import { test, expect } from '@playwright/test'
import { installMovieFixture, MOVIE } from '../fixtures/movie.js'

// Authenticated, deterministic Film File (/movie/:id) visual baselines for the
// redesigned, spoiler-safe living Film File. Runs under the `visual-app` project
// (saved session + setup dependency). Every Film File read/write, the overlay Edge
// Function, TMDB, and all poster/embed images are intercepted, so the route is fully
// offline + reproducible. Reduced motion + a fixed clock + seeded RNG + an animation
// freeze pin every moving part. Linux baselines are generated via the
// visual-baselines/movie-* CI flow (Docker not available locally).
//
// States truthfully cover the approved redesign: pre-watch hero + case, synopsis +
// provider, experience profile, the spoiler boundary, exploration/continuation, the
// watched generic post-watch fallback, the Parasite-only curated Film Portrait, the
// mobile Your Take form, and the mobile action bar.

const DESKTOP = { width: 1280, height: 720 }
const MOBILE = { width: 390, height: 844 }
const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
// Hide position:fixed surfaces that would land mid-content in a capture: the
// scroll-progress bar, film grain, the desktop sticky action bar (behaviour tested in
// E2E), the skip link, and the mobile app-shell bottom nav (chrome tested separately).
// The mobile Movie action bar is hidden by default and shown only in its own state.
const HIDE_BASE =
  '.ff-movie-scroll-progress,.ff-movie-grain,.ff-movie-sticky-bar,.ff-movie-skip-link{display:none!important}' +
  '.fixed.bottom-0.left-0.right-0.z-30{display:none!important}'
const HIDE_ACTIONBAR = '.ff-movie-action-bar{display:none!important}'

const ROUTE = `/movie/${MOVIE.tmdbId}`
const PARASITE_ID = 496243
const PARASITE_ROUTE = `/movie/${PARASITE_ID}`

async function freeze(page, { keepActionBar = false } = {}) {
  await page.addStyleTag({ content: FREEZE + HIDE_BASE + (keepActionBar ? '' : HIDE_ACTIONBAR) })
  await page.waitForTimeout(120)
}
async function load(page, route = ROUTE, title = MOVIE.title) {
  await page.goto(route)
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible({ timeout: 20_000 })
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

// ── Inline Parasite (496243) intercept for the curated portrait baselines. The real
//    auth session passes through; only TMDB + /rest/v1 for 496243 are mocked. The
//    watched user_history row unlocks the curated post-watch chapter. ──────────────
const PARASITE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="300" height="450" fill="#2c2533"/></svg>'
function parasiteDetails() {
  return {
    id: PARASITE_ID, title: 'Parasite', original_title: '기생충', tagline: 'Act like you own the place.',
    overview: 'A poor family schemes to become employed by a wealthy household.',
    release_date: '2019-05-30', runtime: 132, status: 'Released', budget: 11400000, revenue: 263000000,
    vote_average: 8.5, original_language: 'ko', spoken_languages: [{ iso_639_1: 'ko', english_name: 'Korean', name: 'Korean' }],
    production_countries: [{ iso_3166_1: 'KR', name: 'South Korea' }], genres: [{ id: 18, name: 'Drama' }, { id: 53, name: 'Thriller' }],
    poster_path: '/poster.jpg', backdrop_path: '/backdrop.jpg',
    credits: { cast: Array.from({ length: 5 }, (_, i) => ({ id: 900 + i, name: `Actor ${i + 1}`, character: `Role ${i + 1}`, profile_path: '/c.jpg', order: i })), crew: [{ id: 5000, name: 'Bong Joon-ho', job: 'Director', department: 'Directing' }] },
    videos: { results: [{ id: 'v1', key: 'mockKey', site: 'YouTube', type: 'Trailer', name: 'Trailer', official: true }] },
    recommendations: { results: [] }, similar: { results: [] }, keywords: { keywords: [] }, images: { backdrops: [] },
  }
}
function parasiteRow() {
  return { id: 9624, tmdb_id: PARASITE_ID, title: 'Parasite', overview: '', release_date: '2019-05-30', release_year: 2019, runtime: 132, director_name: 'Bong Joon-ho', primary_genre: 'Drama', genres: ['Drama', 'Thriller'], poster_path: '/poster.jpg', original_language: 'ko', mood_tags: ['tense', 'sharp'], tone_tags: ['cold'], fit_profile: 'challenge', ff_audience_rating: 92, ff_critic_rating: 95, ff_final_rating: 93, ff_rating: 93, llm_pacing: 60, llm_intensity: 80, llm_emotional_depth: 85, llm_dialogue_density: 60, llm_attention_demand: 80, is_valid: true }
}
async function installParasite(page) {
  await page.clock.setFixedTime(new Date('2026-02-13T20:00:00Z'))
  await page.addInitScript(() => { let seed = 0x2bee5eed; Math.random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff } })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/image.tmdb.org/**', (r) => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: PARASITE_SVG }))
  await page.route(/https?:\/\/(www\.)?(youtube(-nocookie)?\.com|youtu\.be)\/.*/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html>' }))
  await page.route('**/functions/v1/generate-movie-overlay', (r) => r.abort())
  await page.route('**/api.themoviedb.org/**', (r) => {
    const u = r.request().url()
    if (u.includes('/watch/providers')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: PARASITE_ID, results: { US: { link: 'https://www.justwatch.com', flatrate: [{ provider_id: 8, provider_name: 'Mock Stream', logo_path: '/p.png', display_priority: 1 }] } } }) })
    if (u.includes('/release_dates')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [{ iso_3166_1: 'US', release_dates: [{ certification: 'R' }] }] }) })
    if (u.includes('/movie_credits')) return r.fulfill({ status: 200, contentType: 'application/json', body: '{"cast":[],"crew":[]}' })
    if (new RegExp(`/movie/${PARASITE_ID}`).test(u)) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(parasiteDetails()) })
    return r.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })
  await page.route('**/rest/v1/**', (r) => {
    const req = r.request(); const url = new URL(req.url())
    const table = decodeURIComponent(url.pathname.split('/rest/v1/')[1] || '').split('?')[0]
    const search = decodeURIComponent(url.search)
    if (req.method() !== 'GET' && req.method() !== 'HEAD') return r.fulfill({ status: 201, contentType: 'application/json', body: '[]' })
    let rows = []
    if (table === 'movies' && search.includes('tmdb_id=eq')) rows = [parasiteRow()]
    else if (table === 'user_history' && search.includes('movie_id=eq')) rows = [{ movie_id: 9624 }]
    else if (table === 'user_settings') rows = [{ settings: { prefs: {} } }]
    const accept = req.headers()['accept'] || ''
    return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'content-range': `0-${Math.max(0, rows.length - 1)}/${rows.length}` }, body: accept.includes('pgrst.object') ? JSON.stringify(rows[0] ?? null) : JSON.stringify(rows) })
  })
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

  test('desktop — cast section', async ({ page }) => {
    await installMovieFixture(page, { reducedMotion: true })
    await page.setViewportSize(DESKTOP)
    await load(page)
    await freeze(page)
    await scrollTo(page, page.locator('.ff-movie-cast-grid'))
    await expect(page).toHaveScreenshot('cast-section-desktop.png')
  })

  test('desktop — spoiler boundary (pre-watch)', async ({ page }) => {
    await installMovieFixture(page, { reducedMotion: true })
    await page.setViewportSize(DESKTOP)
    await load(page)
    await freeze(page)
    await scrollTo(page, page.getByText(/The page stops here/i))
    await expect(page).toHaveScreenshot('spoiler-boundary-desktop.png')
  })

  test('desktop — exploration tail (always visible)', async ({ page }) => {
    await installMovieFixture(page, { reducedMotion: true })
    await page.setViewportSize(DESKTOP)
    await load(page)
    await freeze(page)
    await scrollTo(page, page.getByText('Continue the thread'))
    await expect(page).toHaveScreenshot('continuation-desktop.png')
  })

  test('desktop — generic post-watch fallback', async ({ page }) => {
    await installMovieFixture(page, { reducedMotion: true, watched: true })
    await page.setViewportSize(DESKTOP)
    await load(page)
    const portrait = page.locator('#after-watching')
    await expect(portrait).toBeVisible({ timeout: 10_000 })
    await freeze(page)
    await scrollTo(page, portrait)
    await expect(page).toHaveScreenshot('postwatch-generic-desktop.png', { fullPage: true })
  })

  test('desktop — Parasite curated Film Portrait', async ({ page }) => {
    await installParasite(page)
    await page.setViewportSize(DESKTOP)
    await load(page, PARASITE_ROUTE, 'Parasite')
    const portrait = page.locator('#after-watching')
    await expect(portrait).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/A FeelFlick reading/i)).toBeVisible({ timeout: 10_000 })
    await freeze(page)
    await expect(page).toHaveScreenshot('parasite-portrait-desktop.png', { fullPage: true })
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
    const stars = page.getByLabel('Your star rating')
    await expect(stars).toBeVisible({ timeout: 10_000 })
    await freeze(page)
    await scrollTo(page, stars)
    await expect(page).toHaveScreenshot('your-take-mobile.png')
  })

  test('mobile — spoiler boundary (pre-watch)', async ({ page }) => {
    await installMovieFixture(page, { reducedMotion: true })
    await page.setViewportSize(MOBILE)
    await load(page)
    await freeze(page)
    await scrollTo(page, page.getByText(/The page stops here/i))
    await expect(page).toHaveScreenshot('spoiler-boundary-mobile.png')
  })

  test('mobile — Movie action bar above BottomNav', async ({ page }) => {
    await installMovieFixture(page, { reducedMotion: true })
    await page.setViewportSize(MOBILE)
    await load(page)
    // Keep the mobile action bar visible (its own state); the app-shell BottomNav is
    // still hidden by HIDE_BASE so only the Movie action surface is baselined.
    await freeze(page, { keepActionBar: true })
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(120)
    await expect(page).toHaveScreenshot('action-bar-mobile.png')
  })

  test('mobile — generic post-watch fallback', async ({ page }) => {
    await installMovieFixture(page, { reducedMotion: true, watched: true })
    await page.setViewportSize(MOBILE)
    await load(page)
    const portrait = page.locator('#after-watching')
    await expect(portrait).toBeVisible({ timeout: 10_000 })
    await freeze(page)
    await expect(page).toHaveScreenshot('postwatch-generic-mobile.png', { fullPage: true })
  })

  test('mobile — Parasite curated Film Portrait', async ({ page }) => {
    await installParasite(page)
    await page.setViewportSize(MOBILE)
    await load(page, PARASITE_ROUTE, 'Parasite')
    const portrait = page.locator('#after-watching')
    await expect(portrait).toBeVisible({ timeout: 10_000 })
    await freeze(page)
    await expect(page).toHaveScreenshot('parasite-portrait-mobile.png', { fullPage: true })
  })
})
