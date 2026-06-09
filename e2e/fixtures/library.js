// e2e/fixtures/library.js
// Deterministic User Library fixture + Supabase/TMDB interception for authenticated
// Playwright runs of /watchlist, /history and the /watched alias. The dev test user is
// authenticated for real (Supabase /auth/v1/** passes through), but EVERY Library
// read/write under /rest/v1/** is intercepted before the route loads, so no Library row
// ever reaches the backend. Writes are recorded in a ledger; any unexpected write-capable
// request is aborted + recorded so a test fails loudly if anything escapes. TMDB poster
// images are mocked too, so the routes are fully deterministic and offline.
//
// No secrets or live user data appear here — all films/reviews are obviously fictional.

// Fixed UTC anchor for the relative saved-age / watched-date labels (matches the clock
// set in the installer). "today" = 2026-02-13.
export const CLOCK = '2026-02-13T20:00:00Z'

// ── Watchlist (4 films) — joined movies shape the Watchlist query expects ──────────
// Covers: multiple film moods (tender ×2, cozy, tense), different runtimes, a very long
// title, a missing-director + missing-runtime + no-poster case, and a range of saved
// dates (today / yesterday / 3 days ago / an explicit date).
function wlMovie(over) {
  return { id: 0, tmdb_id: 0, title: '', director_name: 'Unknown', release_date: '2020-01-01', runtime: 100, mood_tags: ['tender'], poster_path: '/wl.jpg', ...over }
}
export const WATCHLIST = [
  { movie_id: 9104, added_at: '2026-02-13T08:00:00Z', status: 'want_to_watch', movies: wlMovie({ id: 9104, tmdb_id: 910004, title: 'Paper Harbor', director_name: 'Lena Cho', release_date: '2022-07-01', runtime: 121, mood_tags: ['tender'], poster_path: '/wl-paper.jpg' }) },
  { movie_id: 9101, added_at: '2026-02-12T10:00:00Z', status: 'want_to_watch', movies: wlMovie({ id: 9101, tmdb_id: 910001, title: 'The Cartographer’s Daughter and the Long Winter Road Home', director_name: 'Mara Vance', release_date: '2021-05-14', runtime: 142, mood_tags: ['tender'], poster_path: '/wl-carto.jpg' }) },
  { movie_id: 9102, added_at: '2026-02-10T10:00:00Z', status: 'want_to_watch', movies: wlMovie({ id: 9102, tmdb_id: 910002, title: 'Saltwater Hours', director_name: 'Idris Bell', release_date: '2019-03-01', runtime: 98, mood_tags: ['cozy'], poster_path: '/wl-salt.jpg' }) },
  { movie_id: 9103, added_at: '2026-01-02T10:00:00Z', status: 'want_to_watch', movies: wlMovie({ id: 9103, tmdb_id: 910003, title: 'North', director_name: null, release_date: '2018-11-01', runtime: null, mood_tags: ['tense'], poster_path: null }) },
]

// ── Diary (4 entries) — user_history (joined movies) + user_ratings ────────────────
// Covers: two months (Feb / Jan) and distinct days, rated + unrated entries, a Loved
// 9–10 entry, a long wrapping review (also used for review-text search), a no-poster
// entry, and explicit film moods.
function diMovie(over) {
  return { id: 0, tmdb_id: 0, title: '', director_name: 'Unknown', release_date: '2020-01-01', runtime: 100, mood_tags: ['tender'], poster_path: '/di.jpg', ...over }
}
export const HISTORY = [
  { movie_id: 9201, watched_at: '2026-02-12T21:00:00Z', movies: diMovie({ id: 9201, tmdb_id: 920001, title: 'Lantern Hill', director_name: 'Mara Vance', release_date: '2021-04-01', runtime: 114, mood_tags: ['tender'], poster_path: '/di-lantern.jpg' }) },
  { movie_id: 9202, watched_at: '2026-02-11T20:00:00Z', movies: diMovie({ id: 9202, tmdb_id: 920002, title: 'The Tin Almanac', director_name: 'Priya Raman', release_date: '2020-01-01', runtime: 101, mood_tags: ['reflective'], poster_path: '/di-tin.jpg' }) },
  { movie_id: 9203, watched_at: '2026-01-20T19:00:00Z', movies: diMovie({ id: 9203, tmdb_id: 920003, title: 'Winter Tenants', director_name: 'Cole Park', release_date: '2017-09-01', runtime: 96, mood_tags: ['melancholy'], poster_path: null }) },
  { movie_id: 9204, watched_at: '2026-01-19T18:00:00Z', movies: diMovie({ id: 9204, tmdb_id: 920004, title: 'The Long Field', director_name: 'Lena Cho', release_date: '2019-06-01', runtime: 133, mood_tags: ['tense'], poster_path: '/di-field.jpg' }) },
]
// F6.10 duplicate-history scenario (opt-in via { duplicateHistory: true } — NOT the default,
// so the visual baselines stay stable). The DB allows multiple user_history rows per
// (user, movie); here Lantern Hill (9201) has THREE rows from different watch paths with
// distinct watched_at + ids. The canonical (one-per-film) derivation must collapse them to
// the LATEST watch (Feb 13), so the Diary shows 4 entries (not 6) and stats count once.
export const DUPLICATE_HISTORY = [
  { movie_id: 9201, watched_at: '2026-02-10T18:00:00Z', id: 'h-9201-onb', source: 'onboarding',      movies: diMovie({ id: 9201, tmdb_id: 920001, title: 'Lantern Hill', director_name: 'Mara Vance', release_date: '2021-04-01', runtime: 114, mood_tags: ['tender'], poster_path: '/di-lantern.jpg' }) },
  { movie_id: 9201, watched_at: '2026-02-12T21:00:00Z', id: 'h-9201-ff',  source: 'film_file',       movies: diMovie({ id: 9201, tmdb_id: 920001, title: 'Lantern Hill', director_name: 'Mara Vance', release_date: '2021-04-01', runtime: 114, mood_tags: ['tender'], poster_path: '/di-lantern.jpg' }) },
  { movie_id: 9201, watched_at: '2026-02-13T08:00:00Z', id: 'h-9201-dsc', source: 'discover_marked', movies: diMovie({ id: 9201, tmdb_id: 920001, title: 'Lantern Hill', director_name: 'Mara Vance', release_date: '2021-04-01', runtime: 114, mood_tags: ['tender'], poster_path: '/di-lantern.jpg' }) },
  ...HISTORY.slice(1), // 9202, 9203, 9204 (one row each)
]
export const RATINGS = [
  { movie_id: 9201, rating: 9, review_text: 'A patient film about repair — it earns its silences, and the long northern evening it unfolds across feels like a held breath that never quite lets go.', rated_at: '2026-02-12T21:30:00Z' },
  { movie_id: 9202, rating: 7, review_text: null, rated_at: '2026-02-11T20:30:00Z' },
  // 9203 is intentionally UNRATED (no user_ratings row) — an unrated diary entry.
  { movie_id: 9204, rating: 6, review_text: 'Sun-blanched and patient; the kind of grief that arrives slowly and never quite leaves the frame, even when the field is finally empty.', rated_at: '2026-01-19T18:30:00Z' },
]

// Stable, asserted-against titles (so tests never depend on a live row).
export const TITLES = {
  watchlist: ['Paper Harbor', 'The Cartographer’s Daughter and the Long Winter Road Home', 'Saltwater Hours', 'North'],
  diary: ['Lantern Hill', 'The Tin Almanac', 'Winter Tenants', 'The Long Field'],
}

// Deterministic poster SVG (stable tone + label) so no TMDB image is ever fetched.
function svgFor(url) {
  const m = url.match(/\/(wl-[a-z]+|di-[a-z]+)\.jpg/)
  const label = m ? m[1] : 'poster'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="300" height="450" fill="#2c2533"/><text x="150" y="225" fill="#fff" font-family="sans-serif" font-size="20" text-anchor="middle">${label}</text></svg>`
}

// Only these tables may be WRITTEN (and only as DELETEs) from the Library routes. A
// user_ratings / user_movie_feedback delete during a Diary removal, or any profile-cache
// write from merely opening a route, is therefore an escape that fails the test.
const EXPECTED_DELETE_TABLES = new Set(['user_watchlist', 'user_history'])
// Authenticated AppShell bookkeeping that fires on EVERY authed route (not Library-
// specific). It is recorded separately in ledger.shellWrites — never in ledger.writes —
// so the Library-write assertions stay exact. (Same allowance the Home/Movie fixtures use.)
const ALLOWED_SHELL_WRITES = new Set(['user_sessions'])

const REDACT = (s) => String(s).replace(/(apikey|access_token|authorization|email|password|token)=[^&]+/gi, '$1=REDACTED')

// ── installer ──────────────────────────────────────────────────────────────────────
export async function installLibraryFixture(page, options = {}) {
  const opts = { mode: 'loaded', removeMode: 'success', reducedMotion: false, duplicateHistory: false, ...options }

  // Mutable in-memory state so removals are reflected by subsequent reads (and cross-nav).
  const state = {
    watchlist: WATCHLIST.map(r => ({ ...r })),
    history: (opts.duplicateHistory ? DUPLICATE_HISTORY : HISTORY).map(r => ({ ...r })),
    ratings: RATINGS.map(r => ({ ...r })),
    removedWatchlistIds: [],
    removedHistoryIds: [],
  }

  const ledger = {
    requests: [], reads: [], writes: [], shellWrites: [], unexpectedRequests: [],
    setMode(m) { opts.mode = m },
    setRemoveMode(m) { opts.removeMode = m },
    getWatchlistRows() { return state.watchlist },
    getHistoryRows() { return state.history },
    getRatings() { return state.ratings },
    writesFor(table) { return this.writes.filter(w => w.table === table) },
  }

  // Fixed UTC clock + seeded RNG before any app script runs → stable saved-age/watched
  // dates and zero render randomness.
  await page.clock.setFixedTime(new Date(CLOCK))
  await page.addInitScript(() => {
    let seed = 0x2bee5eed
    Math.random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
  })
  if (opts.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' })

  // TMDB poster images → deterministic SVG (no network, no snapshot drift).
  await page.route('**/image.tmdb.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svgFor(route.request().url()) }))

  // Reads, keyed by table. Each Library table has an explicit branch; the AppShell reads
  // (users / user_settings / user_profiles_computed) are explicit too, with a documented
  // safe default for incidental shell reads (e.g. impression-exclusion lists).
  function readFor(table) {
    switch (table) {
      case 'user_watchlist': return opts.mode === 'empty' ? [] : state.watchlist
      case 'user_history':   return opts.mode === 'empty' ? [] : state.history
      case 'user_ratings':   return opts.mode === 'empty' ? [] : state.ratings
      case 'users':                 return [{ taste_baseline_moods: [] }]
      case 'user_settings':         return [{ settings: { prefs: { avoidGenres: [] } } }]
      case 'user_profiles_computed': return [] // never WRITTEN from Library (asserted)
      default: return [] // incidental authenticated-shell reads (no Library dependency)
    }
  }

  // All Supabase REST. /auth/v1/** is NOT matched → real auth passes through untouched.
  await page.route('**/rest/v1/**', (route) => {
    const req = route.request()
    const method = req.method()
    const url = new URL(req.url())
    const table = decodeURIComponent(url.pathname.split('/rest/v1/')[1] || '').split('?')[0]
    const search = decodeURIComponent(url.search)
    ledger.requests.push({ method, table, query: REDACT(url.search) })

    if (method === 'GET' || method === 'HEAD') {
      ledger.reads.push({ table, query: REDACT(url.search) })
      // load_error: the route's primary read fails → provider catch → 'load_error'.
      if (opts.mode === 'load_error' && (table === 'user_watchlist' || table === 'user_history')) {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 'MOCK', message: 'mock load error', details: null, hint: null }) })
      }
      const rows = readFor(table)
      const accept = req.headers()['accept'] || ''
      const wantsObject = accept.includes('pgrst.object')
      const body = wantsObject ? JSON.stringify(rows[0] ?? null) : JSON.stringify(rows)
      return route.fulfill({
        status: 200, contentType: 'application/json',
        headers: { 'content-range': `0-${Math.max(0, rows.length - 1)}/${rows.length}` },
        body,
      })
    }

    if (method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
      let body = null
      try { body = req.postDataJSON() } catch { body = req.postData() || null }
      const movieId = (search.match(/movie_id=eq\.(\d+)/) || [])[1]
      const entry = { method, table, movieId: movieId ? Number(movieId) : null, query: REDACT(url.search), seq: ledger.writes.length + 1 }

      // The ONLY permitted writes are scoped DELETEs from user_watchlist / user_history.
      if (method === 'DELETE' && EXPECTED_DELETE_TABLES.has(table)) {
        ledger.writes.push(entry)
        if (opts.removeMode === 'failure') {
          return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 'MOCK', message: 'mock delete failure', details: null, hint: null }) })
        }
        // Reflect the successful delete so re-reads / cross-nav stay consistent — exactly
        // what the real backend would return. Ratings are deliberately NOT touched.
        if (table === 'user_watchlist' && movieId != null) {
          state.watchlist = state.watchlist.filter(r => r.movie_id !== Number(movieId))
          state.removedWatchlistIds.push(Number(movieId))
        }
        if (table === 'user_history' && movieId != null) {
          state.history = state.history.filter(r => r.movie_id !== Number(movieId))
          state.removedHistoryIds.push(Number(movieId))
        }
        return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'content-range': '*/*' }, body: '[]' })
      }

      // Legitimate authenticated-shell write (session bookkeeping) — recorded separately,
      // fulfilled locally, and NOT counted as a Library write.
      if (ALLOWED_SHELL_WRITES.has(table)) {
        ledger.shellWrites.push(entry)
        const echo = Array.isArray(body) ? body : body ? [body] : []
        return route.fulfill({ status: method === 'POST' ? 201 : 200, contentType: 'application/json', headers: { 'content-range': '*/*' }, body: JSON.stringify(echo) })
      }

      // Anything else write-capable (incl. any user_ratings / user_movie_feedback /
      // user_profiles_computed write, or any POST/PATCH/PUT/RPC) is an escape.
      ledger.unexpectedRequests.push({ method, table })
      return route.abort()
    }

    return route.fulfill({ status: 204, body: '' })
  })

  return ledger
}
