// e2e/fixtures/home.js
// Deterministic Home fixture + Supabase/TMDB interception for authenticated
// Playwright runs. The dev test user is authenticated for real (Supabase
// /auth/v1/** passes through), but EVERY Home read/write under /rest/v1/** is
// intercepted so no Home row ever reaches the backend. Writes are recorded in a
// ledger; unexpected write-capable requests are aborted + recorded so a test fails
// loudly if anything escapes. TMDB provider + image requests are mocked too, so
// /home is fully deterministic and offline.
//
// No secrets or live user data appear here.

// ── Deterministic candidate rows ──────────────────────────────────────────────
// The Briefing candidate query (overlaps mood_tags) returns FILMS; the QuickLog
// getSeenCandidates query (ordered by ff_audience_confidence) returns SEEN. Two
// FILMS share the default 'tender' mood (so Not-tonight promotes the second); the
// third is 'cozy' only (the deterministic alternate-mood pick, never in the tender
// Briefing). SEEN films use unrelated moods so they never enter a Briefing pool.
function movieRow(over) {
  return {
    id: 0, tmdb_id: 0, title: '', overview: '', release_date: '2019-01-01', release_year: 2019,
    runtime: 116, director_name: 'Unknown', primary_genre: 'Drama', genres: ['Drama'],
    poster_path: '/home-poster.jpg', original_language: 'en', trailer_youtube_key: null,
    mood_tags: ['tender'], tone_tags: [], fit_profile: null,
    ff_audience_rating: 82, ff_audience_confidence: 90, ff_critic_rating: 82,
    ff_final_rating: 82, ff_rating: 82, ff_rating_genre_normalized: 82,
    discovery_potential: 50, polarization_score: 20,
    llm_pacing: 50, llm_intensity: 40, llm_emotional_depth: 70,
    llm_dialogue_density: 50, llm_attention_demand: 50,
    is_valid: true,
    ...over,
  }
}

// Two tender candidates (One initial / Two promotes) + one cozy alternate (Three).
const FILMS = [
  movieRow({
    id: 8001, tmdb_id: 800001, title: 'Lantern Hill', overview:
      'A lighthouse keeper hosts the grown daughter she gave up, and one long northern evening becomes a quiet reckoning. Tender, unhurried, and warm.',
    release_date: '2021-04-01', release_year: 2021, runtime: 114, director_name: 'Mara Vance',
    primary_genre: 'Drama', genres: ['Drama'], poster_path: '/home-poster-one.jpg',
    mood_tags: ['tender', 'romantic'], tone_tags: ['warm'],
    ff_audience_rating: 92, ff_audience_confidence: 95, ff_critic_rating: 90, ff_final_rating: 92, ff_rating: 92,
  }),
  movieRow({
    id: 8002, tmdb_id: 800002, title: 'Paper Boats', overview:
      'Two pen-pals finally meet in a rain-soft city and spend a day deciding whether a decade of letters can survive a single afternoon.',
    release_date: '2020-08-01', release_year: 2020, runtime: 108, director_name: 'Idris Calloway',
    primary_genre: 'Drama', genres: ['Drama'], poster_path: '/home-poster-two.jpg',
    mood_tags: ['tender'], tone_tags: ['reflective'],
    ff_audience_rating: 84, ff_audience_confidence: 88, ff_critic_rating: 83, ff_final_rating: 84, ff_rating: 84,
  }),
  movieRow({
    id: 8003, tmdb_id: 800003, title: 'The Long Quiet', overview:
      'A snowed-in inn, a pot of soup that never empties, and a houseful of strangers learning to like each other before the thaw.',
    release_date: '2019-11-01', release_year: 2019, runtime: 121, director_name: 'Petra Wolf',
    primary_genre: 'Drama', genres: ['Drama'], poster_path: '/home-poster-three.jpg',
    mood_tags: ['cozy', 'heartwarming'], tone_tags: ['warm'],
    ff_audience_rating: 88, ff_audience_confidence: 91, ff_critic_rating: 86, ff_final_rating: 88, ff_rating: 88,
  }),
]

// QuickLog "you probably saw these" candidates — distinct ids/titles/posters.
const SEEN = [
  movieRow({ id: 8101, tmdb_id: 800101, title: 'Static Bloom', poster_path: '/home-seen-one.jpg', mood_tags: ['curious'], ff_audience_rating: 81, ff_audience_confidence: 93 }),
  movieRow({ id: 8102, tmdb_id: 800102, title: 'Glasshouse', poster_path: '/home-seen-two.jpg', mood_tags: ['curious'], ff_audience_rating: 80, ff_audience_confidence: 92 }),
  movieRow({ id: 8103, tmdb_id: 800103, title: 'Tin Roof', poster_path: '/home-seen-three.jpg', mood_tags: ['witty'], ff_audience_rating: 79, ff_audience_confidence: 90 }),
]

// Stable titles exported for the E2E/visual tests (so they never assert a live row).
export const HOME_FILM_TITLES = { tender: ['Lantern Hill', 'Paper Boats'], cozy: 'The Long Quiet' }
export const SEEN_TITLES = ['Static Bloom', 'Glasshouse', 'Tin Roof']

// Per-table / per-query read fixtures. The default-empty rows keep the removed Home
// tail (continue-watching / social / lists / DNA) empty + force a cold-start profile
// compute (so the candidate pick + QuickLog stay deterministic).
function readFor(table, search, opts) {
  switch (table) {
    case 'movies': {
      // Briefing candidate query overlaps mood_tags; getSeenCandidates orders by
      // ff_audience_confidence; anything else is a non-rendered tail query → [].
      if (search.includes('mood_tags=ov')) {
        return opts.dataState === 'no_candidates' ? [] : FILMS
      }
      if (search.includes('order=ff_audience_confidence')) {
        return opts.quickLogState === 'empty' ? [] : SEEN
      }
      return []
    }
    case 'users': return [{ taste_baseline_moods: [] }]      // baseline → tender first
    case 'user_settings': return [{ settings: { prefs: { avoidGenres: [] } } }]
    case 'user_profiles_computed': return []                  // cold compute (no cache)
    case 'recommendation_impressions':
      // updateImpression / recordRecommendationOutcome look up the most-recent
      // impression row (select=id, order=shown_at) to flip a flag — give them one
      // so the skipped/outcome PATCH actually fires. The exclusion query
      // (select=movie_id) stays empty so no candidate is excluded.
      return search.includes('order=shown_at')
        ? [{ id: 9999, shown_at: '2026-02-13T14:59:00Z', clicked: false, skipped: false, marked_watched: false, added_to_watchlist: false }]
        : []
    default: return []                                        // history/ratings/prefs/similarity/feedback/sessions/watchlist…
  }
}

// Tables whose writes are EXPECTED on the Home journey. Anything else write-capable
// under /rest/v1/** is an escape.
const EXPECTED_WRITE_TABLES = new Set([
  'recommendation_impressions', // hero + quick_picks impressions, skipped update, outcome
  'user_interactions',          // trackInteraction('dismiss')
  'user_sessions',              // trackInteraction session bookkeeping
  'user_watchlist',             // Save
  'user_history',               // Mark Watched + QuickLog
  'user_profiles_computed',     // computeUserProfile cold-compute cache upsert
])
const isExpectedWrite = (table) => EXPECTED_WRITE_TABLES.has(table) || table.startsWith('rpc/')

// A targeted write should FAIL (compatible Supabase error) for the failure tests,
// while still being recorded in the ledger. user_history is shared by Mark-Watched
// (source 'mood_recommendation') and QuickLog (source 'home_quicklog'), so the body
// source disambiguates which failure key applies.
function shouldFailWrite(table, body, writeFailures) {
  if (!writeFailures || writeFailures.length === 0) return false
  const row = Array.isArray(body) ? body[0] : body
  const source = row?.source
  if (table === 'user_watchlist' && writeFailures.includes('watchlist')) return true
  if (table === 'user_history' && source === 'mood_recommendation' && writeFailures.includes('history')) return true
  if (table === 'user_history' && source === 'home_quicklog' && writeFailures.includes('quicklog')) return true
  return false
}

// ── SVG placeholder per poster (stable label + tone → visual progression obvious) ─
function svgFor(url) {
  const map = [
    ['home-poster-one', ['Film One', '#3b2f4a']], ['home-poster-two', ['Film Two', '#2f3b4a']],
    ['home-poster-three', ['Film Three', '#2f4a3b']],
    ['home-seen-one', ['Seen 1', '#42302a']], ['home-seen-two', ['Seen 2', '#2a3042']],
    ['home-seen-three', ['Seen 3', '#30422a']], ['mock-logo', ['Logo', '#222']],
  ]
  const hit = map.find(([k]) => url.includes(k))
  const [label, tone] = hit ? hit[1] : ['Poster', '#222']
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="300" height="450" fill="${tone}"/><text x="150" y="225" fill="#fff" font-family="sans-serif" font-size="22" text-anchor="middle">${label}</text></svg>`
}

function providerJson(providerState) {
  if (providerState === 'empty') return { id: 0, results: {} }
  return { id: 0, results: { CA: { link: 'https://example.test', flatrate: [{ provider_id: 8, provider_name: 'Mock Stream', logo_path: '/mock-logo.png', display_priority: 1 }] } } }
}

// ── installer ─────────────────────────────────────────────────────────────────
export async function installHomeFixture(page, options = {}) {
  const opts = {
    dataState: 'ready', providerState: 'found', quickLogState: 'ready',
    writeFailures: [], reducedMotion: false, ...options,
  }

  const ledger = {
    reads: [], writes: [], unexpectedRequests: [],
    resetWrites() { this.writes = [] },
    writesFor(table) { return this.writes.filter(w => w.table === table) },
  }

  // Deterministic clock (mid-UTC-day → todaySeed stable, never crosses midnight) +
  // seeded RNG, before any app script runs.
  await page.clock.setFixedTime(new Date('2026-02-13T15:00:00Z'))
  await page.addInitScript(() => {
    let seed = 0x2bee5eed
    Math.random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
  })
  if (opts.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' })

  // TMDB poster/logo images → deterministic SVG (no network, no snapshot drift).
  await page.route('**/image.tmdb.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svgFor(route.request().url()) }))

  // TMDB watch-providers API → deterministic provider state (or error).
  await page.route('**/api.themoviedb.org/**', (route) => {
    const url = route.request().url()
    if (url.includes('/watch/providers')) {
      // 403 is NON-retryable in the TMDB client → getMovieWatchProviders rejects
      // immediately (no retry delay) → useStreamingProvider's 'error' state.
      if (opts.providerState === 'error') return route.fulfill({ status: 403, contentType: 'application/json', body: '{"status_message":"mock error"}' })
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(providerJson(opts.providerState)) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  // All Supabase REST. /auth/v1/** is NOT matched here → real auth passes through.
  await page.route('**/rest/v1/**', (route) => {
    const req = route.request()
    const method = req.method()
    const url = new URL(req.url())
    const table = decodeURIComponent(url.pathname.split('/rest/v1/')[1] || '').split('?')[0]

    if (method === 'GET' || method === 'HEAD') {
      ledger.reads.push({ table, query: url.search })
      // load_error: return a non-array body for the Briefing candidate query so the
      // candidate processing throws → useHomeData's catch sets the honest error state.
      if (opts.dataState === 'load_error' && table === 'movies' && url.search.includes('mood_tags=ov')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{"_mock":"non-array forces the catch path"}' })
      }
      const rows = readFor(table, url.search, opts)
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
      const entry = { method, table, body, query: url.search }
      if (isExpectedWrite(table)) {
        ledger.writes.push(entry)
        if (shouldFailWrite(table, body, opts.writeFailures)) {
          return route.fulfill({
            status: 400, contentType: 'application/json',
            body: JSON.stringify({ code: 'MOCK', message: 'mock write failure', details: null, hint: null }),
          })
        }
        const echo = Array.isArray(body) ? body : body ? [body] : []
        return route.fulfill({
          status: method === 'POST' ? 201 : 200, contentType: 'application/json',
          headers: { 'content-range': '*/*' }, body: JSON.stringify(echo),
        })
      }
      // Unexpected write-capable request — never reach the backend; record (redacted)
      // and abort so the test fails loudly.
      ledger.unexpectedRequests.push({ method, table })
      return route.abort()
    }

    // OPTIONS preflight etc. — answer locally, don't hit the network.
    return route.fulfill({ status: 204, body: '' })
  })

  return ledger
}
