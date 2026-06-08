// e2e/fixtures/discover.js
// Deterministic Discover fixture + Supabase/TMDB interception for authenticated
// Playwright runs. The dev test user is authenticated for real (Supabase
// /auth/v1/** passes through), but EVERY Discover read/write under /rest/v1/** is
// intercepted so no Discover row ever reaches the backend. Writes are recorded in a
// ledger; unexpected write-capable requests are aborted + recorded so a test fails
// loudly if anything escapes. TMDB provider + image requests are mocked too, so the
// route is fully deterministic and offline.
//
// No secrets or live user data appear here.

// ── Deterministic movie candidates ────────────────────────────────────────────
// At least three so controlled progression (Not tonight / Already watched) is
// observable: Film One is the initial pick, Film Two promotes next, Film Three
// stays hidden. mood_tags drive the cold-start fit vector; the ratings + tender
// signal make the order unambiguous (One > Two > Three for a Tender selection).
const POSTER = { one: '/poster-one.jpg', two: '/poster-two.jpg', three: '/poster-three.jpg' }

function movieRow(over) {
  return {
    id: 0, tmdb_id: 0, title: '', overview: '', release_date: '2019-01-01', release_year: 2019,
    runtime: 118, director_name: 'Unknown', primary_genre: 'Drama', genres: ['Drama'],
    poster_path: POSTER.one, original_language: 'en', trailer_youtube_key: null,
    mood_tags: ['tender'], tone_tags: [], fit_profile: null,
    ff_audience_rating: 80, ff_audience_confidence: 90, ff_critic_rating: 82,
    ff_final_rating: 80, ff_rating: 80, ff_rating_genre_normalized: 80,
    discovery_potential: 50, polarization_score: 20,
    llm_pacing: 50, llm_intensity: 40, llm_emotional_depth: 70,
    llm_dialogue_density: 50, llm_attention_demand: 50,
    is_valid: true,
    ...over,
  }
}

const FILMS = {
  one: movieRow({
    id: 9001, tmdb_id: 700001, title: 'The Quiet Hour', overview:
      'A translator returns to the lakeside town she left a decade ago and spends one long evening reckoning with the family she kept at a distance. A patient, tender film about the small repairs that hold a life together.',
    release_date: '2021-05-01', release_year: 2021, runtime: 118, director_name: 'Mara Vance',
    primary_genre: 'Drama', genres: ['Drama'], poster_path: POSTER.one, trailer_youtube_key: 'mockTrailerOne',
    mood_tags: ['tender', 'gentle', 'quiet'], tone_tags: ['warm'],
    ff_audience_rating: 92, ff_audience_confidence: 95, ff_critic_rating: 90, ff_final_rating: 92, ff_rating: 92,
  }),
  two: movieRow({
    id: 9002, tmdb_id: 700002, title: 'After the Rain', overview:
      'Two estranged siblings drive across a wet coastline to scatter their mother’s ashes, arguing and forgiving in equal measure.',
    release_date: '2020-09-01', release_year: 2020, runtime: 112, director_name: 'Idris Calloway',
    primary_genre: 'Drama', genres: ['Drama'], poster_path: POSTER.two, trailer_youtube_key: 'mockTrailerTwo',
    mood_tags: ['tender', 'bittersweet'], tone_tags: ['reflective'],
    ff_audience_rating: 84, ff_audience_confidence: 88, ff_critic_rating: 83, ff_final_rating: 84, ff_rating: 84,
  }),
  three: movieRow({
    id: 9003, tmdb_id: 700003, title: 'Long Shadows', overview:
      'A clockmaker in a fog-bound town measures out his last winter in small, deliberate acts.',
    release_date: '2018-02-01', release_year: 2018, runtime: 142, director_name: 'Petra Wolf',
    primary_genre: 'Drama', genres: ['Drama'], poster_path: POSTER.three, trailer_youtube_key: null,
    mood_tags: ['slow', 'cerebral'], tone_tags: ['cold'],
    ff_audience_rating: 76, ff_audience_confidence: 82, ff_critic_rating: 78, ff_final_rating: 76, ff_rating: 76,
  }),
}

// Horror candidates for filtered_empty: real live rows that the engine's gated-genre
// exclusion removes for a user with no Horror watch history (films=0, candidates>0).
const HORROR = [
  movieRow({ id: 9101, tmdb_id: 700101, title: 'The Hollow Wood', primary_genre: 'Horror', genres: [27], mood_tags: ['tense'], poster_path: '/poster-h1.jpg', ff_audience_rating: 88, ff_final_rating: 88 }),
  movieRow({ id: 9102, tmdb_id: 700102, title: 'Cellar Door', primary_genre: 'Horror', genres: [27], mood_tags: ['tense'], poster_path: '/poster-h2.jpg', ff_audience_rating: 85, ff_final_rating: 85 }),
]

function moviesFor(source) {
  if (source === 'live_empty' || source === 'live_error') return []
  if (source === 'filtered_empty') return HORROR
  return [FILMS.one, FILMS.two, FILMS.three]
}

// The authenticated dev user's id is read from the saved session at install time so
// fixtures echo a plausible user row without hardcoding any real value.
function readFor(table, source) {
  switch (table) {
    case 'movies': return moviesFor(source)
    case 'users': return [{ taste_baseline_moods: [] }]
    case 'user_discover_preferences': return []   // cold → heuristic prediction
    case 'user_settings': return [{ settings: { prefs: { avoidGenres: source === 'filtered_empty' ? ['Horror'] : [] } } }]
    case 'user_profiles_computed': return []       // no cached profile → cold compute
    default: return []                             // history, ratings, follows, watchlist, impressions, overlay, prefs, feedback, sessions…
  }
}

// Tables whose writes are EXPECTED for the Discover journey. Anything else that is
// write-capable under /rest/v1/** is treated as an escape.
const EXPECTED_WRITE_TABLES = new Set([
  'user_discover_preferences', // preference upsert (Find my film)
  'recommendation_impressions', // logSurfaceImpressions + updateImpression
  'user_interactions',          // trackInteraction
  'user_watchlist',             // Save
  'user_history',               // Mark Watched
  'user_sessions',              // trackInteraction session bookkeeping
  'user_profiles_computed',     // computeUserProfile cache upsert (side effect)
])

// ── SVG placeholder per poster (stable label + tone → promotion stays visible) ──
function svgFor(url) {
  const map = [
    ['poster-one', ['Film One', '#3b2f4a']], ['poster-two', ['Film Two', '#2f3b4a']],
    ['poster-three', ['Film Three', '#4a3b2f']], ['poster-h1', ['Horror One', '#3a1f1f']],
    ['poster-h2', ['Horror Two', '#2a1515']],
  ]
  const hit = map.find(([k]) => url.includes(k))
  const [label, tone] = hit ? hit[1] : ['Poster', '#222']
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="300" height="450" fill="${tone}"/><text x="150" y="225" fill="#fff" font-family="sans-serif" font-size="22" text-anchor="middle">${label}</text></svg>`
}

function providerJson(providerState) {
  if (providerState === 'empty') return { id: 0, results: {} }
  // found
  return { id: 0, results: { CA: { link: 'https://example.test', flatrate: [{ provider_id: 8, provider_name: 'Mock Stream', logo_path: '/mock-logo.png', display_priority: 1 }] } } }
}

// ── installer ─────────────────────────────────────────────────────────────────
export async function installDiscoverFixture(page, options = {}) {
  const { source = 'live', reducedMotion = false, providerState = 'found' } = options

  const ledger = {
    reads: [], writes: [], unexpectedRequests: [],
    resetWrites() { this.writes = [] },
  }

  // Deterministic clock (fixed Toronto evening → stable energy prediction) +
  // seeded RNG, before any app script runs.
  await page.clock.setFixedTime(new Date('2026-02-13T20:00:00-05:00'))
  await page.addInitScript(() => {
    let seed = 0x2bee5eed
    Math.random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
  })
  if (reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' })

  // TMDB poster/logo images → deterministic SVG (no network, no snapshot drift).
  await page.route('**/image.tmdb.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svgFor(route.request().url()) }))

  // TMDB watch-providers API → deterministic provider state (or error).
  await page.route('**/api.themoviedb.org/**', (route) => {
    const url = route.request().url()
    if (url.includes('/watch/providers')) {
      if (providerState === 'error') return route.fulfill({ status: 500, contentType: 'application/json', body: '{"status_message":"mock error"}' })
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(providerJson(providerState)) })
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
      // live_error: supabase-js swallows network/HTTP errors into { error } (which
      // would read as live_empty), so we instead return a non-array body for the
      // candidate `movies` query. useDiscoverData's `for (const f of data)` then
      // throws → its catch sets dataSource = live_error (the real failure path).
      if (source === 'live_error' && table === 'movies') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{"_mock":"non-array forces the catch path"}' })
      }
      const rows = readFor(table, source)
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
      const isRpc = table.startsWith('rpc/')
      const entry = { method, table, body, query: url.search }
      if (EXPECTED_WRITE_TABLES.has(table) || isRpc) {
        ledger.writes.push(entry)
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
