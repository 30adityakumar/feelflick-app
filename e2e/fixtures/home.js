// e2e/fixtures/home.js
// Deterministic Home fixture for the redesigned (bounded personal discovery) Home.
// The dev test user authenticates for real (/auth/v1/** passes through) but EVERY
// Home read/write under /rest/v1/** is intercepted, so no Home row ever reaches the
// backend. TMDB images + provider lookups are mocked. A fixed clock + seeded RNG
// keep the route reproducible and offline.
//
// The redesigned Home draws its hero + rows from the tier-aware homepage row engine
// (useHomepageRows → computeUserProfileV3 + the homepageRows builders) and its DNA
// strip from the slimmed HomeDataProvider. This fixture feeds that pipeline a small,
// well-formed candidate pool + light history so the page settles deterministically;
// the visual/e2e specs assert STRUCTURE (hero or rows, shortcuts, DNA), not specific
// engine output, so they stay robust across engine tuning.
//
// No secrets or live user data appear here.

function movieRow(over) {
  return {
    id: 0, tmdb_id: 0, title: '', overview: 'A quiet, well-made film with a clear point of view.',
    tagline: null, release_date: '2021-01-01', release_year: 2021, runtime: 112,
    original_language: 'en', poster_path: '/home-poster.jpg', backdrop_path: '/home-backdrop.jpg',
    trailer_youtube_key: null, director_name: 'Mara Vance', lead_actor_name: 'A. Lead',
    primary_genre: 'Drama', genres: ['Drama'], keywords: [],
    mood_tags: ['tender'], tone_tags: ['warm'], fit_profile: 'prestige_drama',
    ff_rating: 86, ff_final_rating: 86, ff_confidence: 90, quality_score: 86, vote_average: 7.8,
    ff_critic_rating: 86, ff_critic_confidence: 80, ff_audience_rating: 86, ff_audience_confidence: 90,
    ff_community_rating: 86, ff_community_confidence: 70, ff_community_votes: 1200, ff_rating_genre_normalized: 86,
    pacing_score: 50, intensity_score: 40, emotional_depth_score: 70,
    pacing_score_100: 50, intensity_score_100: 40, emotional_depth_score_100: 70,
    dialogue_density: 50, attention_demand: 50, vfx_level_score: 20,
    cult_status_score: 20, popularity: 30, vote_count: 1500, revenue: 0,
    discovery_potential: 50, accessibility_score: 60, polarization_score: 20, starpower_score: 40,
    user_satisfaction_score: 80, user_satisfaction_confidence: 70,
    is_valid: true,
    ...over,
  }
}

const POSTERS = ['one', 'two', 'three', 'four', 'five', 'six']
const TOP_DIRECTOR = 'Mara Vance'

// === Candidate pool (the rows' universe) — ids 8001..8024, DISJOINT from the
// watched set below so nothing gets excluded. Strongly matches the watched
// taste signature (Drama · tender · prestige_drama · en, ~half by the top
// director) with high, confident ratings so films clear the engine's personal
// score floor; a slice is < 90 min for the short-films row.
const POOL = Array.from({ length: 24 }, (_, i) => movieRow({
  id: 8001 + i,
  tmdb_id: 800001 + i,
  title: `Fixture Film ${i + 1}`,
  poster_path: `/home-poster-${POSTERS[i % POSTERS.length]}.jpg`,
  backdrop_path: `/home-backdrop-${POSTERS[i % POSTERS.length]}.jpg`,
  director_name: i % 2 === 0 ? TOP_DIRECTOR : 'Idris Calloway',
  release_year: 2015 + (i % 9),
  runtime: i % 4 === 0 ? 84 : 104 + (i % 5) * 7,
  ff_rating: 95 - (i % 9), ff_final_rating: 95 - (i % 9), quality_score: 95 - (i % 9), ff_rating_genre_normalized: 95 - (i % 9),
  ff_audience_rating: 94 - (i % 9), ff_audience_confidence: 93,
  ff_critic_rating: 93 - (i % 7), ff_critic_confidence: 90,
  user_satisfaction_score: 88, user_satisfaction_confidence: 80,
}))
const MARA_POOL = POOL.filter(m => m.director_name === TOP_DIRECTOR)

// === Watch history — ids 9001..9024 (DISJOINT from POOL). Each row carries the
// nested movie features computeUserProfileV3 reads, so the user lands in the
// 'engaged' tier with a strong Drama / tender / prestige_drama / Mara-Vance
// affinity. The first few double as ≥8 "loved" ratings (orbit seed).
const WATCHED_IDS = Array.from({ length: 24 }, (_, i) => 9001 + i)
const watchedMovie = (id) => ({
  id, tmdb_id: 900000 + id, original_language: 'en', runtime: 118, release_year: 2020,
  primary_genre: 'Drama', director_name: TOP_DIRECTOR, genres: ['Drama'],
  fit_profile: 'prestige_drama', mood_tags: ['tender', 'romantic'], tone_tags: ['warm'],
})
const HISTORY = WATCHED_IDS.map((id, i) => ({
  movie_id: id, source: 'manual',
  watched_at: `2026-01-${String(1 + (i % 27)).padStart(2, '0')}T12:00:00Z`,
  watch_duration_minutes: 112, mood_session_id: null,
  movies: watchedMovie(id),
}))
const SEED = { id: WATCHED_IDS[0], title: 'A Quiet Light' }

const FINGERPRINT = {
  taste_fingerprint: {
    topMoodTags: [{ key: 'tender', count: 14, share: 0.55 }, { key: 'contemplative', count: 6, share: 0.24 }],
    topToneTags: [{ key: 'warm', count: 12, share: 0.5 }, { key: 'reflective', count: 7, share: 0.29 }],
    topFitProfiles: [{ key: 'prestige_drama', count: 16, share: 0.66 }],
    total: 24,
  },
  taste_fingerprint_at: '2026-02-13T00:00:00Z',
}

function readFor(table, search, opts) {
  switch (table) {
    case 'movies':
      if (opts.dataState === 'no_candidates') return []
      // The signature-director row narrows to the top director; mirror that so the
      // row reads as "More from Mara Vance" rather than a mixed set.
      if (search.includes('director_name')) return MARA_POOL
      return POOL
    case 'user_history':
      return opts.dataState === 'cold' ? [] : HISTORY
    case 'user_ratings': {
      if (opts.dataState === 'cold') return []
      // Shape the nested join PostgREST returns per query Home issues.
      if (search.includes('runtime')) return HISTORY.slice(0, 4).map(() => ({ movies: { runtime: 112 } }))
      if (search.includes('poster_path')) return [{ movie_id: SEED.id, rating: 9, rated_at: '2026-01-20T12:00:00Z', movies: { id: SEED.id, title: SEED.title, poster_path: '/home-poster-one.jpg' } }]
      return WATCHED_IDS.slice(0, 6).map((id, i) => ({ movie_id: id, rating: i < 3 ? 9 : 8, rated_at: `2026-01-2${i}T12:00:00Z`, movies: { id, title: i === 0 ? SEED.title : `Loved Film ${i + 1}` } }))
    }
    case 'users': return [{ taste_baseline_moods: [] }]
    case 'user_settings': return [{ settings: { prefs: { avoidGenres: [] } } }]
    case 'user_profiles_computed':
      return opts.dataState === 'cold' ? [] : [FINGERPRINT]
    case 'recommendation_impressions':
      return search.includes('order=shown_at')
        ? [{ id: 9999, shown_at: '2026-02-13T14:59:00Z', clicked: false, skipped: false, marked_watched: false, added_to_watchlist: false }]
        : []
    case 'user_watchlist': return []
    default: return []
  }
}

// Embedding-neighbour ids the orbit row ("Because you loved …") expands a seed to.
const SEED_NEIGHBORS = POOL.slice(0, 10).map((m, i) => ({ id: m.id, similarity: 0.95 - i * 0.02 }))

const EXPECTED_WRITE_TABLES = new Set([
  'recommendation_impressions', 'user_interactions', 'user_sessions', 'user_watchlist', 'user_history', 'user_profiles_computed',
])
const isExpectedWrite = (table) => EXPECTED_WRITE_TABLES.has(table) || table.startsWith('rpc/')

function shouldFailWrite(table, body, writeFailures) {
  if (!writeFailures || writeFailures.length === 0) return false
  const row = Array.isArray(body) ? body[0] : body
  const source = row?.source
  if (table === 'user_watchlist' && writeFailures.includes('watchlist')) return true
  if (table === 'user_history' && source !== 'home_quicklog' && writeFailures.includes('history')) return true
  return false
}

function svgFor(url) {
  const tone = url.includes('backdrop') ? '#1b1714' : '#2f2a44'
  const w = url.includes('backdrop') ? 1280 : 300
  const h = url.includes('backdrop') ? 720 : 450
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${tone}"/></svg>`
}

function providerJson(providerState) {
  if (providerState === 'empty') return { id: 0, results: {} }
  return { id: 0, results: { CA: { link: 'https://example.test', flatrate: [{ provider_id: 8, provider_name: 'Mock Stream', logo_path: '/mock-logo.png', display_priority: 1 }] } } }
}

export async function installHomeFixture(page, options = {}) {
  const opts = { dataState: 'ready', providerState: 'found', writeFailures: [], reducedMotion: false, ...options }

  const ledger = {
    reads: [], writes: [], unexpectedRequests: [],
    resetWrites() { this.writes = [] },
    writesFor(table) { return this.writes.filter(w => w.table === table) },
  }

  await page.clock.setFixedTime(new Date('2026-02-13T15:00:00Z'))
  await page.addInitScript(() => {
    let seed = 0x2bee5eed
    Math.random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
  })
  if (opts.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' })

  await page.route('**/image.tmdb.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svgFor(route.request().url()) }))

  await page.route('**/api.themoviedb.org/**', (route) => {
    const url = route.request().url()
    if (url.includes('/watch/providers')) {
      if (opts.providerState === 'error') return route.fulfill({ status: 403, contentType: 'application/json', body: '{"status_message":"mock error"}' })
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(providerJson(opts.providerState)) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  // RPCs the row engine may call. get_seed_neighbors expands the orbit row's seed
  // to embedding neighbours (return pool ids so "Because you loved …" populates);
  // any other RPC returns empty so its dependent row simply hides. Registered
  // before the generic /rest/v1 handler so it wins for /rest/v1/rpc/** paths.
  await page.route('**/rest/v1/rpc/**', (route) => {
    const rpc = new URL(route.request().url()).pathname.split('/rest/v1/rpc/')[1] || ''
    const body = rpc.startsWith('get_seed_neighbors') && opts.dataState !== 'no_candidates'
      ? JSON.stringify(SEED_NEIGHBORS)
      : '[]'
    return route.fulfill({ status: 200, contentType: 'application/json', body })
  })

  await page.route('**/rest/v1/**', (route) => {
    const req = route.request()
    const method = req.method()
    const url = new URL(req.url())
    const table = decodeURIComponent(url.pathname.split('/rest/v1/')[1] || '').split('?')[0]

    if (method === 'GET' || method === 'HEAD') {
      ledger.reads.push({ table, query: url.search })
      // load_error: fail the provider's history read → HomeDataProvider catch → honest error.
      if (opts.dataState === 'load_error' && table === 'user_history') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"mock load error"}' })
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
          return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 'MOCK', message: 'mock write failure' }) })
        }
        const echo = Array.isArray(body) ? body : body ? [body] : []
        return route.fulfill({ status: method === 'POST' ? 201 : 200, contentType: 'application/json', headers: { 'content-range': '*/*' }, body: JSON.stringify(echo) })
      }
      ledger.unexpectedRequests.push({ method, table })
      return route.abort()
    }

    return route.fulfill({ status: 204, body: '' })
  })

  return ledger
}
