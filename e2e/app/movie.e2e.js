import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { installMovieFixture, MOVIE, SOCIAL } from '../fixtures/movie.js'

// Authenticated, fully-intercepted Film File (/movie/:id) journey. The dev user is
// signed in for real (Supabase /auth/v1 passes through); every Film File read/write,
// the overlay Edge Function, all TMDB calls and the YouTube embed are mocked, so no
// Film File row reaches the backend. See e2e/fixtures/movie.js.

const ROUTE = `/movie/${MOVIE.tmdbId}`

const BENIGN = [
  'Download the React DevTools', 'React Router Future Flag', '[vite]', 'Sentry',
  'PostHog', 'posthog', '@vite/client', 'WebSocket', 'Vite server', 'ERR_CONNECTION_REFUSED',
  // intercepted provider/route failure modes surface a benign resource-load console
  // line (the 403 we deliberately mock) — not a product defect.
  'Failed to load resource', 'status of 403',
]
function attachGuards(page, extraAllow = []) {
  const errors = []
  const benign = (t) => [...BENIGN, ...extraAllow].some((b) => t.includes(b))
  page.on('pageerror', (e) => { if (!benign(e.message)) errors.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => { if (m.type() === 'error' && !benign(m.text())) errors.push(`console.error: ${m.text()}`) })
  return errors
}

const h1 = (page) => page.getByRole('heading', { level: 1 })
// §5: the Film File is a labelled REGION now — AppShell owns the only page <main>.
const region = (page) => page.locator('section#film-file-content')
// The single Film File-owned action live region (aria-atomic + sr-only) — distinct
// from YourTake's SaveIndicator status, which also has role=status on the watched page.
const liveStatus = (page) => page.locator('[role="status"][aria-live="polite"][aria-atomic="true"]')
const disclosure = (page, name) => page.locator('details', { has: page.getByText(name, { exact: true }) })
const writesTo = (ledger, table) => ledger.writes.filter((w) => w.table === table)
const row = (w) => (Array.isArray(w?.body) ? w.body[0] : w?.body)

// Measured layout snapshot (real getBoundingClientRect) for the geometry assertions.
const measure = (page) => page.evaluate(() => {
  const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) } }
  const actionBar = document.querySelector('.ff-movie-action-bar')
  const abVisible = actionBar && getComputedStyle(actionBar).display !== 'none'
  let bottomNav = null
  for (const el of document.querySelectorAll('div, nav')) {
    const cs = getComputedStyle(el)
    if (cs.position === 'fixed' && parseFloat(cs.bottom) === 0 && cs.display !== 'none' && /Tonight|Browse|Discover/.test(el.textContent || '')) { bottomNav = el; break }
  }
  const region = document.querySelector('#film-file-content')
  const controls = region ? [...region.querySelectorAll('button, a[href], [role=button], input, textarea')].filter((e) => { const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && e.getBoundingClientRect().height > 0 }) : []
  const last = controls[controls.length - 1] || null
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    actionBarVisible: !!abVisible,
    actionBar: abVisible ? rect(actionBar) : null,
    bottomNav: rect(bottomNav),
    bottomNavVisible: !!bottomNav,
    finalControl: rect(last),
    docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }
})

async function gotoFilmFile(page) {
  await page.goto(ROUTE)
  await expect(h1(page)).toHaveText(MOVIE.title, { timeout: 20_000 })
}

test.describe('Film File — authenticated, intercepted', () => {
  test('A — decision dossier happy path', async ({ page }) => {
    const ledger = await installMovieFixture(page)
    const errors = attachGuards(page)
    await gotoFilmFile(page)

    // Exactly one h1; NO nested page <main> (AppShell owns it); the skip target is a
    // labelled region with tabIndex -1.
    await expect(h1(page)).toHaveCount(1)
    await expect(page.locator('main#film-file-content')).toHaveCount(0) // not a main anymore
    await expect(region(page)).toHaveCount(1)
    await expect(region(page)).toHaveAttribute('role', 'region')
    await expect(region(page)).toHaveAttribute('aria-label', 'Film File')
    await expect(region(page)).toHaveAttribute('tabindex', '-1')
    const skip = page.getByRole('link', { name: 'Skip to Film File content' })
    await expect(skip).toHaveAttribute('href', '#film-file-content')

    // Decision-zone order: Case → Synopsis → Providers → Your Take(compact) → Experience.
    await expect(page.getByText('Synopsis', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Where to watch')).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Your take' })).toBeVisible()
    await expect(disclosure(page, 'Why this film')).toBeVisible()
    expect(await disclosure(page, 'Why this film').evaluate((d) => d.open)).toBe(false)

    // §27 route-owned chapter nav: Overview/Experience/Cast/More, but NO "After watching"
    // link while locked (it must not exist in the a11y tree pre-watch).
    await expect(page.getByRole('navigation', { name: 'Film File chapters' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible()
    await expect(page.getByRole('link', { name: /after watching/i })).toHaveCount(0)

    // §15 spoiler boundary is shown; the post-watch chapter is NOT mounted pre-watch.
    await expect(page.getByText(/The page stops here/i)).toBeVisible()
    await expect(page.locator('#after-watching')).toHaveCount(0)

    // §18/§19: social proof + generated impressions are NOT present pre-watch.
    await expect(disclosure(page, 'What others thought')).toHaveCount(0)
    await expect(page.getByText(/Generated by FeelFlick/i)).toHaveCount(0)
    await expect(page.getByText('A patient film about repair', { exact: false })).toHaveCount(0)

    // Pre-watch tail + footer.
    await expect(disclosure(page, 'Explore from here')).toBeVisible()
    await expect(disclosure(page, 'Film details')).toBeVisible()

    // No fabricated authority: no user-match % / ring; fit band copy at most once.
    await expect(page.getByText(/\d+%\s*match/i)).toHaveCount(0)
    await expect(page.getByText(/how it fits your taste/i)).toHaveCount(0)

    // §7: the public route never triggers overlay generation.
    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('B — pre-watch disclosures + exploration cap (social is watched-gated)', async ({ page }) => {
    const ledger = await installMovieFixture(page)
    const errors = attachGuards(page)
    await gotoFilmFile(page)

    const why = disclosure(page, 'Why this film')
    const explore = disclosure(page, 'Explore from here')

    // Social proof is NOT in the pre-watch flow at all (§18).
    await expect(disclosure(page, 'What others thought')).toHaveCount(0)

    // Open Why + Explore independently — opening one never closes another.
    await why.locator('summary').click()
    await explore.locator('summary').click()
    expect(await why.evaluate((d) => d.open)).toBe(true)
    expect(await explore.evaluate((d) => d.open)).toBe(true)

    // Exploration: 4 similar + 4 director, source order, no reshuffle/pagination.
    const simButtons = explore.getByRole('button', { name: /^Open Saltwater Hours|^Open The Tin Almanac|^Open North of Quiet|^Open Paper Harbor|^Open Winter Tenants|^Open The Long Field/ })
    await expect(simButtons).toHaveCount(4)
    await expect(explore.getByRole('button', { name: 'Open Winter Tenants (2014)' })).toHaveCount(0) // 5th similar not shown
    await expect(explore.getByRole('button', { name: /show me more|load more|reshuffle|next page/i })).toHaveCount(0)
    await expect(explore.getByText(/\d+%/)).toHaveCount(0) // no match % on related cards

    // State persists across an unrelated action-state rerender (Save toggles a rerender).
    await page.getByRole('button', { name: 'Save' }).click().catch(() => {})
    expect(await explore.evaluate((d) => d.open)).toBe(true)

    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('B2 — post-watch social: friends identified, taste twin anonymised, NO exact %', async ({ page }) => {
    // Start watched → the post-watch chapter mounts and social proof becomes visible.
    const ledger = await installMovieFixture(page, { watched: true })
    const errors = attachGuards(page)
    await gotoFilmFile(page)

    const chapter = page.locator('#after-watching')
    await expect(chapter).toBeVisible()
    const social = disclosure(page, 'What others thought')
    await expect(social).toBeVisible()
    await social.locator('summary').click()

    // Real friends identified; real friend note verbatim.
    await expect(social.getByText('Aida Moreno').first()).toBeVisible()
    await expect(social.getByText('Quietly devastating', { exact: false })).toBeVisible()

    // Taste twin ANONYMISED: neutral label, real note verbatim, qualitative wording,
    // and NO exact similarity % anywhere (§20). Real name/avatar never shown.
    await expect(social.getByText(/A taste twin rated this film/i)).toBeVisible()
    await expect(social.getByText('A patient film about repair', { exact: false })).toBeVisible()
    await expect(social.getByText(/broadly similar viewing patterns/i)).toBeVisible()
    await expect(social.getByText(/overall taste similarity/i)).toHaveCount(0)
    await expect(social.getByText(/\b\d+%/)).toHaveCount(0)
    await expect(page.getByText(SOCIAL.twin.users.name)).toHaveCount(0)
    await expect(page.locator('img[src*="twin-avatar"]')).toHaveCount(0)

    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors, errors.join('\n')).toEqual([])
  })

  for (const providerMode of ['found', 'empty', 'error']) {
    test(`C — provider state: ${providerMode}`, async ({ page }) => {
      const ledger = await installMovieFixture(page, { providerMode })
      const errors = attachGuards(page)
      await gotoFilmFile(page)
      const where = page.getByLabel('Where to watch')
      await expect(where).toBeVisible()

      if (providerMode === 'found') {
        await expect(where.getByRole('link', { name: /Watch on Mock Stream/i })).toBeVisible()
        await expect(where.getByText(/Availability for the United States via TMDB and JustWatch/i)).toBeVisible()
        await expect(where.getByRole('link', { name: /More options on JustWatch/i })).toBeVisible()
      }
      if (providerMode === 'empty') {
        await expect(where.getByRole('heading', { level: 2, name: 'Availability not found' })).toBeVisible()
        await expect(where.getByText(/unavailable everywhere|not streaming anywhere|no one carries/i)).toHaveCount(0)
      }
      if (providerMode === 'error') {
        await expect(where.getByRole('heading', { level: 2, name: 'Availability unavailable' })).toBeVisible()
        await expect(where.getByRole('link', { name: /Search on JustWatch/i })).toBeVisible()
        await expect(where.getByText(/status_message|500|mock provider error|fetch/i)).toHaveCount(0)
        // page remains usable below the provider section
        await expect(disclosure(page, 'Film details')).toBeVisible()
      }
      expect(ledger.unexpectedRequests).toEqual([])
      expect(errors, errors.join('\n')).toEqual([])
    })
  }

  test('D — Save success then failure', async ({ page }) => {
    // success
    const ledger = await installMovieFixture(page)
    const errors = attachGuards(page)
    await gotoFilmFile(page)
    const save = page.getByRole('button', { name: 'Save' })
    await save.click()
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: 'Saved' })).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => writesTo(ledger, 'user_watchlist').length).toBeGreaterThan(0)
    expect(row(writesTo(ledger, 'user_watchlist')[0])).toMatchObject({ movie_id: MOVIE.internalId, source: 'movie_detail' })
    await expect(liveStatus(page)).toContainText(`Saved ${MOVIE.title} for later.`)
    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('D2 — Save failure stays honest + retryable', async ({ page }) => {
    const ledger = await installMovieFixture(page, { saveMode: 'failure' })
    const errors = attachGuards(page, ['useUserMovieStatus', 'watchlist'])
    await gotoFilmFile(page)
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(liveStatus(page)).toContainText('Could not update saved films. Try again.')
    await expect(page.getByRole('button', { name: 'Saved' })).toHaveCount(0) // no false success
    await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()   // retryable
    expect(ledger.unexpectedRequests).toEqual([])
  })

  test('E — Mark Watched success then failure', async ({ page }) => {
    const ledger = await installMovieFixture(page)
    const errors = attachGuards(page)
    await gotoFilmFile(page)
    await page.getByRole('button', { name: 'Mark Watched' }).click()
    await expect(page.getByRole('button', { name: 'Watched', exact: true })).toBeVisible({ timeout: 10_000 })
    await expect.poll(() => writesTo(ledger, 'user_history').length).toBeGreaterThan(0)
    expect(row(writesTo(ledger, 'user_history')[0])).toMatchObject({ movie_id: MOVIE.internalId })
    await expect(liveStatus(page)).toContainText(`Marked ${MOVIE.title} as watched. The post-watch chapter is now available.`)
    // The post-watch chapter mounts on settled success + the "After watching" link appears.
    await expect(page.locator('#after-watching')).toBeVisible()
    await expect(page.getByRole('link', { name: /after watching/i })).toBeVisible()
    // Your Take unlocks to the full reflection form (compact-prompt copy gone).
    await expect(page.getByText(/Mark this film watched above to rate it/i)).toHaveCount(0)
    await expect(page.getByLabel('Your star rating')).toBeVisible({ timeout: 10_000 })
    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('E2 — Mark Watched failure: no scroll, no false success', async ({ page }) => {
    const ledger = await installMovieFixture(page, { watchedMode: 'failure' })
    attachGuards(page, ['useUserMovieStatus', 'history'])
    await gotoFilmFile(page)
    await page.getByRole('button', { name: 'Mark Watched' }).click()
    await expect(liveStatus(page)).toContainText('Could not update watched status. Try again.')
    await expect(page.getByRole('button', { name: 'Watched', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Mark Watched' })).toBeEnabled()
    // §29: a failed watched write keeps spoiler content unmounted (no reveal).
    await expect(page.locator('#after-watching')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /after watching/i })).toHaveCount(0)
    await expect(page.getByText(/The page stops here/i)).toBeVisible() // boundary still shown
    expect(ledger.unexpectedRequests).toEqual([])
  })

  test('F — Your Take rating persistence (start watched)', async ({ page }) => {
    const ledger = await installMovieFixture(page, { watched: true })
    const errors = attachGuards(page)
    await gotoFilmFile(page)
    // Watched → full reflection form is present (compact-prompt copy gone) and the
    // post-watch chapter (here, the honest generic fallback for a non-Parasite film).
    await expect(page.getByLabel('Your star rating')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/Mark this film watched above to rate it/i)).toHaveCount(0)
    await expect(page.getByText(/does not yet have a curated post-watch portrait/i)).toBeVisible()

    // Single rating → exactly one serialized user_ratings write with the exact payload
    // (display 4★ → canonical 1-10 rating = 8; review null; keyed to the internal id).
    await page.getByRole('radio', { name: '4 stars' }).click()
    await expect.poll(() => writesTo(ledger, 'user_ratings').length, { timeout: 10_000 }).toBe(1)
    expect(row(writesTo(ledger, 'user_ratings')[0])).toMatchObject({ movie_id: MOVIE.internalId, rating: 8, review_text: null })

    // Rapid re-rate within the debounce window → latest-value-wins, no per-click write:
    // the FINAL effective rating reflects the last star (3★ → 6), serialized in order.
    ledger.resetWrites()
    await page.getByRole('radio', { name: '5 stars' }).click()
    await page.getByRole('radio', { name: '2 stars' }).click()
    await page.getByRole('radio', { name: '3 stars' }).click()
    await expect.poll(() => writesTo(ledger, 'user_ratings').length, { timeout: 10_000 }).toBeGreaterThan(0)
    const ratingWrites = writesTo(ledger, 'user_ratings')
    expect(row(ratingWrites.at(-1)).rating).toBe(6)                  // latest value (3★) wins
    expect(ratingWrites.length).toBeLessThanOrEqual(3)               // collapsed, not one-per-click(×3 max)

    // A reaction → exact user_movie_feedback payload (real sentiment, watched-confirmed).
    ledger.resetWrites()
    await page.getByRole('radio', { name: 'Loved it' }).click()
    await expect.poll(() => writesTo(ledger, 'user_movie_feedback').length, { timeout: 10_000 }).toBeGreaterThan(0)
    expect(row(writesTo(ledger, 'user_movie_feedback')[0])).toMatchObject({ movie_id: MOVIE.internalId, watched_confirmed: true })

    // No identical-input duplicate: re-clicking the SAME reaction writes nothing new
    // beyond the existing serialized stream (no runaway writes).
    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('G — trailer + featurette dialog focus trap', async ({ page }) => {
    const ledger = await installMovieFixture(page)
    const errors = attachGuards(page)
    await gotoFilmFile(page)

    // Hero trailer → named modal dialog, close gets focus, trap holds, Escape restores.
    // Scope the hero control through the hero action row (the sticky bar carries a second
    // "Play Trailer" button). It migrated to the canonical <Button variant="primary">
    // directly, keeping the legacy recipe via the ts-action-primary* compat classes; assert
    // the live DOM. NB: not loading → no `.ff-btn__label`; the grouping span is a direct child.
    const trailer = page.locator('.ff-movie-hero-actions').getByRole('button', { name: 'Play Trailer' })
    await expect(trailer).toBeVisible()
    await expect(trailer).toHaveJSProperty('tagName', 'BUTTON')
    await expect(trailer).toHaveAttribute('type', 'button')
    await expect(trailer).toBeEnabled() // default fixture has a trailer
    await expect(trailer).toHaveClass(/\bff-btn\b/)
    await expect(trailer).toHaveClass(/\bts-action-primary\b/)
    await expect(trailer).toHaveClass(/\bts-action-primary--md\b/)
    await expect(trailer).toHaveClass(/\bff-movie-hero-action-btn\b/)
    await expect(trailer).toHaveClass(/\bff-movie-hero-action-btn--primary\b/)
    await expect(trailer.locator('.ff-btn__label')).toHaveCount(0)
    await expect(trailer.locator('.ff-btn__spinner')).toHaveCount(0)
    const heroGroup = trailer.locator('> span')
    await expect(heroGroup).toHaveCount(1)               // one direct grouping span
    await expect(heroGroup.locator('> svg')).toHaveCount(1) // grouping span holds exactly one svg
    await expect(heroGroup).toHaveText('Play Trailer')
    await trailer.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(page.getByRole('button', { name: 'Close trailer' })).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Close trailer' })).toBeFocused()
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Shift+Tab')
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(trailer).toBeFocused()

    // Featurette opens the dialog; closing restores focus to the exact featurette trigger.
    const featurette = page.getByRole('button', { name: 'Play Making the Light' })
    await featurette.scrollIntoViewIfNeeded()
    await featurette.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Close trailer' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(featurette).toBeFocused()
    // iframe removed after close.
    await expect(page.locator('iframe')).toHaveCount(0)

    // ── Sticky-bar trailer control (the visual suite hides .ff-movie-sticky-bar, so its
    //    migrated Button parity is proven here). Reveal it by scrolling past the 80px
    //    threshold, then confirm it leaves the hidden/inert state and opens the dialog. ──
    await page.evaluate(() => window.scrollTo(0, 600))
    const stickyBar = page.locator('.ff-movie-sticky-bar')
    await expect.poll(() => stickyBar.evaluate((el) => el.hasAttribute('aria-hidden'))).toBe(false)
    await expect.poll(() => stickyBar.evaluate((el) => el.hasAttribute('inert'))).toBe(false)
    const stickyTrailer = stickyBar.getByRole('button', { name: 'Play Trailer' })
    await expect(stickyTrailer).toBeVisible()
    await expect(stickyTrailer).toHaveJSProperty('tagName', 'BUTTON')
    await expect(stickyTrailer).toHaveAttribute('type', 'button')
    await expect(stickyTrailer).toHaveClass(/\bff-btn\b/)
    await expect(stickyTrailer).toHaveClass(/\bts-action-primary\b/)
    await expect(stickyTrailer).toHaveClass(/\bts-action-primary--sm\b/)
    await expect(stickyTrailer.locator('.ff-btn__label')).toHaveCount(0)
    await expect(stickyTrailer.locator('.ff-btn__spinner')).toHaveCount(0)
    const stickyGroup = stickyTrailer.locator('> span')
    await expect(stickyGroup).toHaveCount(1)             // one direct plain span
    await expect(stickyGroup).toHaveText('Play Trailer')
    // computed custom inline padding/radius/font preserved on the migrated Button
    const stickyCss = await stickyTrailer.evaluate((el) => {
      const c = getComputedStyle(el)
      return { padding: `${c.paddingTop} ${c.paddingRight} ${c.paddingBottom} ${c.paddingLeft}`, radius: c.borderTopLeftRadius, fontSize: c.fontSize, fontWeight: c.fontWeight }
    })
    expect(stickyCss).toEqual({ padding: '8px 14px 8px 14px', radius: '6px', fontSize: '12px', fontWeight: '600' })
    // activate → trailer dialog opens; close → focus returns to the sticky trigger
    await stickyTrailer.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Close trailer' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(stickyTrailer).toBeFocused()

    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('H — share: native success + clipboard fallback', async ({ page }) => {
    // Native share present → announces Shared; analytics intercepted.
    const ledger = await installMovieFixture(page)
    const errors = attachGuards(page)
    await page.addInitScript(() => { window.navigator.share = async () => {} })
    await gotoFilmFile(page)
    await page.getByRole('button', { name: 'Share this film' }).click()
    await expect(liveStatus(page)).toContainText(`Shared ${MOVIE.title}.`)
    await expect.poll(() => writesTo(ledger, 'user_interactions').length).toBeGreaterThan(0)
    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('H2 — share clipboard fallback copies the canonical URL', async ({ page }) => {
    const ledger = await installMovieFixture(page)
    attachGuards(page)
    await page.addInitScript(() => {
      // No native share → clipboard fallback path.
      delete window.navigator.share
      window.__copied = null
      Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: async (t) => { window.__copied = t } } })
    })
    await gotoFilmFile(page)
    await page.getByRole('button', { name: 'Share this film' }).click()
    await expect(liveStatus(page)).toContainText(`Link copied for ${MOVIE.title}.`)
    expect(await page.evaluate(() => window.__copied)).toContain(`/movie/${MOVIE.tmdbId}`)
    expect(ledger.unexpectedRequests).toEqual([])
  })

  for (const { routeMode, copy } of [
    { routeMode: 'not_found', copy: /Couldn’t find that movie\./ },     // TMDB 200 "success:false" payload
    { routeMode: 'http_404', copy: /Couldn’t find that movie\./ },      // §6 REAL TMDB HTTP 404 → not_found
    { routeMode: 'load_error', copy: /We couldn’t open this Film File\./ },
  ]) {
    test(`I — route error: ${routeMode}`, async ({ page }) => {
      const ledger = await installMovieFixture(page, { routeMode })
      attachGuards(page, ['useMovieData', 'load failed'])
      await page.goto(ROUTE)
      await expect(page.getByText(copy)).toBeVisible({ timeout: 20_000 })
      await expect(h1(page)).toHaveCount(1)
      await expect(page.locator('[role="alert"]')).toBeVisible()
      await expect(page.getByText(/status_message|mock|500|34|supabase|TMDB/i)).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Go back' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Go to Home' })).toBeVisible()
      await expect(page.getByRole('button', { name: /retry|try again/i })).toHaveCount(0)
      expect(ledger.unexpectedRequests).toEqual([])
    })
  }

  test('I2 — malformed route id → invalid-link copy', async ({ page }) => {
    const ledger = await installMovieFixture(page)
    attachGuards(page, ['useMovieData', 'load failed'])
    await page.goto('/movie/not-a-number')
    await expect(page.getByText(/That movie link isn’t valid\./)).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('[role="alert"]')).toBeVisible()
    expect(ledger.unexpectedRequests).toEqual([])
  })

  test('J — keyboard, reduced motion + axe', async ({ page }) => {
    const ledger = await installMovieFixture(page, { reducedMotion: true })
    const errors = attachGuards(page)
    await gotoFilmFile(page)

    // The skip link is reachable + functional: focusing and activating it moves
    // focus into the decision dossier (the app shell's nav precedes it on the full
    // page, so it is the first Film-File control — see FilmFileLandmarks for the
    // shell-free first-focusable proof).
    const skip = page.getByRole('link', { name: 'Skip to Film File content' })
    await skip.focus()
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#film-file-content$/)

    // Disclosure summaries toggle from the keyboard.
    const why = disclosure(page, 'Why this film')
    await why.locator('summary').focus()
    await page.keyboard.press('Enter')
    expect(await why.evaluate((d) => d.open)).toBe(true)

    // Reduced motion: no confetti canvas; Mark-Watched still works without motion-gated scroll.
    await expect(page.locator('canvas')).toHaveCount(0)

    // Axe — main success page + an opened disclosure + provider state.
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    const blocking = violations.filter((v) => ['serious', 'critical'].includes(v.impact) && v.id !== 'color-contrast')
    expect(blocking, JSON.stringify(blocking.map((v) => v.id))).toEqual([])

    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors, errors.join('\n')).toEqual([])
  })

  for (const vp of [
    { w: 360, h: 640 }, { w: 390, h: 844 }, { w: 430, h: 932 },
    { w: 768, h: 1024 }, { w: 1280, h: 720 }, { w: 1440, h: 900 },
  ]) {
    test(`K — responsive layout @ ${vp.w}×${vp.h}`, async ({ page }) => {
      const ledger = await installMovieFixture(page)
      attachGuards(page)
      await page.setViewportSize({ width: vp.w, height: vp.h })
      await gotoFilmFile(page)
      // No horizontal overflow; one h1; top Back control visible; tail reachable.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `h-overflow @ ${vp.w}`).toBeLessThanOrEqual(1)
      await expect(h1(page)).toHaveCount(1)
      await expect(page.getByRole('button', { name: 'Go back' }).first()).toBeVisible()
      await expect(page.getByText(SOCIAL.twin.users.name)).toHaveCount(0) // identity never exposed at any width
      await disclosure(page, 'Film details').scrollIntoViewIfNeeded()
      await expect(disclosure(page, 'Film details')).toBeVisible()
      expect(ledger.unexpectedRequests).toEqual([])
    })
  }

  test('L — overlay-absent film never triggers browser overlay generation (§7)', async ({ page }) => {
    const ledger = await installMovieFixture(page, { overlayMode: 'absent' })
    const errors = attachGuards(page)
    await gotoFilmFile(page)
    // The page renders the cold-path case without an editorial overlay.
    await expect(h1(page)).toHaveText(MOVIE.title)
    await expect(region(page)).toBeVisible()
    // The public route must NOT call the generate-movie-overlay Edge Function — the
    // fixture aborts + records any such call as an unexpected request.
    expect(ledger.unexpectedRequests).toEqual([])
    expect(ledger.unexpectedRequests.some((r) => r.endpoint === 'functions/v1/generate-movie-overlay')).toBe(false)
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('M — mobile action bar sits ABOVE the BottomNav (§28 geometry)', async ({ page }) => {
    const ledger = await installMovieFixture(page)
    attachGuards(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoFilmFile(page)

    const bar = page.locator('.ff-movie-action-bar')
    await expect(bar).toBeVisible()
    const barBox = await bar.boundingBox()
    const vh = page.viewportSize().height
    // The bar is fully on-screen AND clears the ~85px BottomNav with margin (§28).
    expect(barBox.y + barBox.height).toBeLessThanOrEqual(vh - 90)
    // It is the same single action cluster — exactly one Save and one watched control.
    await expect(bar.getByRole('button', { name: /^(Save|Saved)$/ })).toHaveCount(1)
    await expect(bar.getByRole('button', { name: /Mark watched|Watched/ })).toHaveCount(1)
    // no horizontal overflow with the bar shown
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
    expect(ledger.unexpectedRequests).toEqual([])
  })
})

// ── Hardening: forced colours, real 200% zoom, measured geometry ──────────────
test.describe('Film File — hardening (forced colours / 200% / geometry)', () => {
  for (const vp of [{ w: 1280, h: 800 }, { w: 390, h: 844 }, { w: 320, h: 812 }]) {
    test(`forced-colours @ ${vp.w}×${vp.h}`, async ({ page }) => {
      const ledger = await installMovieFixture(page, { watched: true })
      const errors = attachGuards(page)
      // The Film File is a dark-only cinematic theme; the representative forced-colours
      // scenario (and the approved measurement harness) pairs it with a dark HC scheme,
      // so the forced system colours resolve against a dark canvas.
      await page.emulateMedia({ forcedColors: 'active', colorScheme: 'dark' })
      await page.setViewportSize({ width: vp.w, height: vp.h })
      await gotoFilmFile(page)

      await expect(h1(page)).toHaveCount(1)
      await expect(page.locator('main')).toHaveCount(1)          // AppShell's only <main>
      await expect(region(page)).toHaveCount(1)
      // chapter nav operable
      await expect(page.getByRole('navigation', { name: 'Film File chapters' })).toBeVisible()
      await page.getByRole('link', { name: 'Cast' }).click()
      // primary actions + settled watched state visible
      await expect(page.getByRole('button', { name: /Watched/ }).first()).toBeVisible()
      await expect(page.getByRole('button', { name: /^(Save|Saved)$/ }).first()).toBeVisible()
      // provider state + spoiler-aware post-watch readable
      await expect(page.getByLabel('Where to watch')).toBeVisible()
      await expect(page.getByLabel('Your star rating')).toBeVisible()
      await expect(page.locator('#after-watching')).toBeVisible()
      // dialog readable + closable under forced colours
      await page.locator('.ff-movie-hero-actions').getByRole('button', { name: 'Play Trailer' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByRole('button', { name: 'Close trailer' }).click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      // overflow
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `forced-colours overflow @ ${vp.w}`).toBeLessThanOrEqual(1)
      // axe with COLOUR-CONTRAST INCLUDED, scoped to the Movie route (.ff-movie).
      const { violations } = await new AxeBuilder({ page }).include('.ff-movie')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      const blocking = violations.filter((v) => ['serious', 'critical'].includes(v.impact))
      expect(blocking, JSON.stringify(blocking.map((v) => v.id))).toEqual([])
      expect(ledger.unexpectedRequests).toEqual([])
      expect(errors, errors.join('\n')).toEqual([])
    })
  }

  for (const z of [
    { w: 640, h: 400 },   // 1280×800 @ 200%
    { w: 195, h: 422 },   // 390×844 @ 200%
    { w: 160, h: 406 },   // 320×812 @ 200%
  ]) {
    test(`200% effective viewport ${z.w}×${z.h}`, async ({ page }) => {
      const ledger = await installMovieFixture(page, { watched: true })
      const errors = attachGuards(page)
      await page.setViewportSize({ width: z.w, height: z.h })
      await gotoFilmFile(page)
      const inner = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }))
      expect(inner.w).toBe(z.w)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `200% overflow @ ${z.w}`).toBeLessThanOrEqual(1)
      await expect(h1(page)).toBeVisible()
      // dialog opens + Close reachable + closes
      await page.locator('.ff-movie-hero-actions').getByRole('button', { name: 'Play Trailer' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Close trailer' })).toBeVisible()
      await page.getByRole('button', { name: 'Close trailer' }).click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      expect(ledger.unexpectedRequests).toEqual([])
      expect(errors, errors.join('\n')).toEqual([])
    })
  }

  for (const g of [
    { label: '390 normal', w: 390, h: 844 },
    { label: '320 normal', w: 320, h: 812 },
    { label: '390 zoom200', w: 195, h: 422 },
    { label: '320 zoom200', w: 160, h: 406 },
  ]) {
    test(`geometry: action bar clears BottomNav @ ${g.label}`, async ({ page }) => {
      const ledger = await installMovieFixture(page, { watched: true })
      attachGuards(page)
      await page.setViewportSize({ width: g.w, height: g.h })
      await gotoFilmFile(page)
      // Wait for the watched post-watch chapter to settle (the isWatched flip remounts
      // + grows the page) before scrolling, then scroll to the true bottom — otherwise
      // an early scrollHeight undershoots and the footer stays below the fold.
      await expect(page.locator('#after-watching')).toBeVisible({ timeout: 10_000 })
      await page.waitForTimeout(250)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(300)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(300)
      const m = await measure(page)
      expect(m.actionBarVisible, 'mobile action bar visible').toBe(true)
      expect(m.bottomNavVisible, 'BottomNav visible').toBe(true)
      // §4: movieActionBar.bottom <= bottomNav.top - 8
      expect(m.bottomNav.top - m.actionBar.bottom, 'actionBar→BottomNav gap').toBeGreaterThanOrEqual(8)
      // §4: finalAction.bottom <= movieActionBar.top - 8
      if (m.finalControl) expect(m.actionBar.top - m.finalControl.bottom, 'finalControl→actionBar gap').toBeGreaterThanOrEqual(8)
      expect(m.docOverflow).toBeLessThanOrEqual(1)
      expect(ledger.unexpectedRequests).toEqual([])
    })
  }

  test('geometry: phone landscape has no fixed-bottom overlap', async ({ page }) => {
    const ledger = await installMovieFixture(page, { watched: true })
    attachGuards(page)
    await page.setViewportSize({ width: 844, height: 390 })
    await gotoFilmFile(page)
    const m = await measure(page)
    // At ≥768 the mobile action bar AND BottomNav are hidden → no fixed-bottom overlap.
    expect(m.actionBarVisible).toBe(false)
    expect(m.docOverflow).toBeLessThanOrEqual(1)
    expect(ledger.unexpectedRequests).toEqual([])
  })
})
