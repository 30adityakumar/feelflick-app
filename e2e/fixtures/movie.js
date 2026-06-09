// e2e/fixtures/movie.js
// Deterministic Film File (/movie/:id) fixture + Supabase/TMDB/overlay interception
// for authenticated Playwright runs. The dev test user is authenticated for real
// (Supabase /auth/v1/** passes through), but EVERY Film File read/write under
// /rest/v1/**, the generate-movie-overlay Edge Function, all TMDB API + image
// requests, and the YouTube embed are intercepted, so the route is fully
// deterministic and offline and no Film File row ever reaches the backend. Writes are
// recorded in a ledger; unexpected write-capable requests are aborted + recorded so a
// test fails loudly if anything escapes.
//
// No secrets or live user data appear here.

// ── Canonical Film File movie (ids chosen to avoid Home/Discover collisions) ────
export const MOVIE = {
  tmdbId: 705001,
  internalId: 9501,
  title: 'The Lantern Keeper',
  year: 2021,
  director: 'Mara Vance',
  directorId: 555001,
  trailerKey: 'mockTrailerKey',
  featuretteKey: 'mockFeaturetteKey',
}

// Friend + taste-twin identities. The fixture RETURNS the real twin name/avatar; the
// rendered page must prove they are NOT shown (F5.6 anonymisation).
export const SOCIAL = {
  friends: [
    { user_id: 'friend-aida', rating: 9, review_text: 'Quietly devastating — it stayed with me for days.', users: { id: 'friend-aida', name: 'Aida Moreno', avatar_url: null } },
    { user_id: 'friend-cole', rating: 8, review_text: null, users: { id: 'friend-cole', name: 'Cole Park', avatar_url: null } },
  ],
  twin: { user_id: 'twin-jordan', rating: 9, review_text: 'A patient film about repair. It earns its silences.', rated_at: '2026-01-12T18:30:00Z', users: { id: 'twin-jordan', name: 'Jordan Lee', avatar_url: 'https://image.tmdb.org/t/p/w185/twin-avatar.jpg' } },
  twinSimilarity: 0.84,
}

// Six similar + six director films so the UI proves it renders only four, in order.
export const SIMILAR_TITLES = ['Saltwater Hours', 'The Tin Almanac', 'North of Quiet', 'Paper Harbor', 'Winter Tenants', 'The Long Field']
export const DIRECTOR_TITLES = ['Harbor Light', 'The Wolf Year', 'Slowly, Then', 'Field Notes', 'The Glass Coast', 'Late Ferry']

function tmdbDetails() {
  const cast = Array.from({ length: 6 }, (_, i) => ({
    id: 556001 + i, name: `Cast Member ${i + 1}`, character: `Role ${i + 1}`, profile_path: `/cast-${i + 1}.jpg`, order: i,
  }))
  return {
    id: MOVIE.tmdbId,
    title: MOVIE.title,
    original_title: MOVIE.title,
    tagline: 'Some lights are kept, not found.',
    overview:
      'A lighthouse keeper on a fog-bound northern coast takes in the grown daughter she gave up, and one long winter becomes a patient reckoning with everything left unsaid. Tender, deliberate, and quietly exact.',
    release_date: '2021-05-14',
    runtime: 124,
    status: 'Released',
    homepage: '',
    budget: 12000000,
    revenue: 41500000,
    vote_average: 8.1,
    original_language: 'en',
    spoken_languages: [{ iso_639_1: 'en', english_name: 'English', name: 'English' }],
    production_countries: [{ iso_3166_1: 'US', name: 'United States of America' }],
    genres: [{ id: 18, name: 'Drama' }, { id: 9648, name: 'Mystery' }],
    poster_path: '/film-poster.jpg',
    backdrop_path: '/film-backdrop.jpg',
    credits: {
      cast,
      crew: [
        { id: MOVIE.directorId, name: MOVIE.director, job: 'Director', department: 'Directing' },
        { id: 555002, name: 'E. Ashworth', job: 'Screenplay', department: 'Writing' },
        { id: 555003, name: 'R. Okonkwo', job: 'Director of Photography', department: 'Camera' },
        { id: 555004, name: 'L. Hartmann', job: 'Original Music Composer', department: 'Sound' },
      ],
    },
    videos: {
      results: [
        { id: 'v1', key: MOVIE.trailerKey, site: 'YouTube', type: 'Trailer', name: 'Official Trailer', official: true },
        { id: 'v2', key: MOVIE.featuretteKey, site: 'YouTube', type: 'Featurette', name: 'Making the Light', official: true },
      ],
    },
    recommendations: {
      results: SIMILAR_TITLES.map((title, i) => ({
        id: 706001 + i, title, release_date: `201${i}-03-01`, poster_path: `/sim-${i + 1}.jpg`, vote_count: 800 - i * 10, vote_average: 7.5 - i * 0.1,
      })),
    },
    similar: { results: [] },
    keywords: { keywords: [] },
    images: { backdrops: [] },
  }
}

// /person/{directorId}/movie_credits → director's filmography (crew, job Director).
function directorCredits() {
  return {
    id: MOVIE.directorId,
    crew: DIRECTOR_TITLES.map((title, i) => ({
      id: 707001 + i, title, job: 'Director', department: 'Directing',
      release_date: `201${i}-09-01`, poster_path: `/dir-${i + 1}.jpg`, vote_average: 7.8 - i * 0.1, vote_count: 600 - i * 10,
    })),
    cast: [],
  }
}

// The internal movies engine row (MOVIE_ENGINE_COLS) — real FF aggregates + the LLM
// mood-radar columns + mood tags that drive Why-for-you and the mood profile.
function filmDbRow() {
  return {
    id: MOVIE.internalId, tmdb_id: MOVIE.tmdbId, title: MOVIE.title,
    overview: '', release_date: '2021-05-14', release_year: 2021, runtime: 124,
    director_name: MOVIE.director, primary_genre: 'Drama', genres: ['Drama', 'Mystery'],
    poster_path: '/film-poster.jpg', original_language: 'en', trailer_youtube_key: MOVIE.trailerKey,
    mood_tags: ['tender', 'reflective', 'melancholy', 'quiet'], tone_tags: ['warm', 'wintry'],
    fit_profile: 'comfort_watch', // a fit-profile KEY (string), not an object

    ff_audience_rating: 88, ff_audience_confidence: 92, ff_critic_rating: 91,
    ff_final_rating: 89, ff_rating: 89, ff_rating_genre_normalized: 89,
    discovery_potential: 60, polarization_score: 18,
    llm_pacing: 35, llm_intensity: 45, llm_emotional_depth: 85,
    llm_dialogue_density: 55, llm_attention_demand: 70,
    is_valid: true,
  }
}

// Curated editorial overlay row (movies_editorial_overlay). Its presence means the
// generate-movie-overlay Edge Function is NOT called in the success scenario.
function overlayRow() {
  return {
    why_for_you: { headline: 'Built for a slow, attentive evening.', rationale: 'Its tender, reflective register and unhurried pacing line up with the films you finish and rate highly.' },
    mood_fingerprint: null, // fall back to llm_*-derived axes
    ff_take: 'A keeper of small repairs — the kind of quiet film that rewards the patience it asks for.',
    critic_quotes: ['Reads as a held breath from frame one.', 'Tender without sentimentality; exact without coldness.'],
    film_palette: { tone: '#6c4a78' },
    daypart_fit: 'evening',
    hero_signature: null,
  }
}

function providerJson(providerMode) {
  if (providerMode === 'empty') return { id: MOVIE.tmdbId, results: {} }
  return {
    id: MOVIE.tmdbId,
    results: {
      US: {
        link: 'https://www.justwatch.com/us/movie/the-lantern-keeper',
        flatrate: [{ provider_id: 8, provider_name: 'Mock Stream', logo_path: '/prov-stream.png', display_priority: 1 }],
        rent: [{ provider_id: 10, provider_name: 'Mock Rent', logo_path: '/prov-rent.png', display_priority: 2 }],
        buy: [{ provider_id: 12, provider_name: 'Mock Buy', logo_path: '/prov-buy.png', display_priority: 3 }],
      },
    },
  }
}

// ── deterministic poster/logo SVG (stable label + tone) ─────────────────────────
function svgFor(url) {
  const m = url.match(/\/(film-poster|film-backdrop|sim-\d|dir-\d|cast-\d|prov-\w+|twin-avatar)/)
  const label = m ? m[1] : 'img'
  const tone = url.includes('backdrop') ? '#15131c' : url.includes('prov') ? '#222' : '#2c2533'
  const w = url.includes('backdrop') ? 1280 : 300
  const h = url.includes('backdrop') ? 720 : 450
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${tone}"/><text x="${w / 2}" y="${h / 2}" fill="#fff" font-family="sans-serif" font-size="22" text-anchor="middle">${label}</text></svg>`
}

// Read fixtures, keyed by table + query so each Film File read resolves deterministically.
function readFor(table, search, opts) {
  switch (table) {
    case 'movies':
      // The Film File row is fetched by tmdb_id; the profile-cache / history-film /
      // dir reads are by id=in.(…) → empty (cold profile, no history films).
      return search.includes('tmdb_id=eq') ? [filmDbRow()] : []
    case 'movies_editorial_overlay':
      return opts.overlayMode === 'absent' ? [] : [overlayRow()]
    case 'user_settings':
      return [{ settings: { prefs: { avoidGenres: [] } } }]
    case 'user_profiles_computed':
      return [] // cold compute → upsert (expected write)
    case 'user_follows':
      return SOCIAL.friends.map((f) => ({ following_id: f.user_id }))
    case 'user_similarity':
      return [{ user_b_id: SOCIAL.twin.user_id, overall_similarity: SOCIAL.twinSimilarity }]
    case 'user_ratings': {
      if (search.includes('user_id=eq')) {
        // own rating (useUserRating) — maybeSingle
        return opts.rating != null ? [{ rating: opts.rating, review_text: null }] : []
      }
      if (search.includes('rated_at')) return [SOCIAL.twin]                 // taste-twin read
      if (search.includes('rating=gte.8')) return SOCIAL.friends            // friends-loved read
      return []
    }
    case 'user_movie_feedback':
      return [] // no prior reaction
    case 'user_watchlist':
      return opts.saved ? [{ movie_id: MOVIE.internalId }] : []
    case 'user_history':
      // status check is movie_id=eq.{internalId}; cast-also-in + profile reads → []
      if (search.includes('movie_id=eq')) return opts.watched ? [{ movie_id: MOVIE.internalId }] : []
      return []
    default:
      return [] // recommendation_impressions exclusion, prefs, sessions, …
  }
}

// Writes EXPECTED on the Film File. Anything else write-capable is an escape.
const EXPECTED_WRITE_TABLES = new Set([
  'user_watchlist',             // Save
  'user_history',               // Mark Watched
  'user_ratings',               // Your Take rating
  'user_movie_feedback',        // Your Take reaction
  'user_interactions',          // trailer / share / click analytics
  'recommendation_impressions', // outcome capture
  'user_profiles_computed',     // cold-compute cache upsert
  'user_sessions',              // session bookkeeping
])
const isExpectedWrite = (table) => EXPECTED_WRITE_TABLES.has(table) || table.startsWith('rpc/')

// A targeted write fails (compatible Supabase error) for the failure scenarios.
function shouldFailWrite(table, body, opts) {
  const row = Array.isArray(body) ? body[0] : body
  if (table === 'user_watchlist' && opts.saveMode === 'failure') return true
  if (table === 'user_history' && opts.watchedMode === 'failure') return true
  if (table === 'user_ratings' && opts.ratingMode === 'failure') return true
  void row
  return false
}

const REDACT = (s) => s.replace(/(apikey|access_token|authorization)=[^&]+/gi, '$1=REDACTED')

// ── installer ───────────────────────────────────────────────────────────────────
export async function installMovieFixture(page, options = {}) {
  const opts = {
    routeMode: 'success',     // 'success' | 'not_found' | 'load_error'
    providerMode: 'found',    // 'found' | 'empty' | 'error'
    overlayMode: 'present',   // 'present' | 'absent'
    saved: false, watched: false, rating: null,
    saveMode: 'success', watchedMode: 'success', ratingMode: 'success',
    reducedMotion: false,
    ...options,
  }

  const ledger = {
    requests: [], reads: [], writes: [], unexpectedRequests: [],
    resetWrites() { this.writes = [] },
    writesFor(table) { return this.writes.filter((w) => w.table === table) },
    getWrites(table) { return this.writes.filter((w) => w.table === table) },
  }

  // Fixed UTC clock + seeded RNG, before any app script runs.
  await page.clock.setFixedTime(new Date('2026-02-13T20:00:00Z'))
  await page.addInitScript(() => {
    let seed = 0x2bee5eed
    Math.random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
  })
  if (opts.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' })

  // TMDB poster/backdrop/logo images → deterministic SVG (no network / snapshot drift).
  await page.route('**/image.tmdb.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svgFor(route.request().url()) }))

  // YouTube embed + thumbnails → stub, so the trailer dialog opens with no real
  // iframe load and no "Invalid video id" page error.
  await page.route(/https?:\/\/(www\.)?(youtube(-nocookie)?\.com|youtu\.be)\/.*/, (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>mock embed</title>' }))
  await page.route('**/i.ytimg.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svgFor('/film-poster') }))

  // TMDB API.
  await page.route('**/api.themoviedb.org/**', (route) => {
    const url = route.request().url()
    ledger.requests.push({ kind: 'tmdb', url: REDACT(url) })

    if (url.includes('/watch/providers')) {
      if (opts.providerMode === 'error') return route.fulfill({ status: 403, contentType: 'application/json', body: '{"status_message":"mock provider error"}' })
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(providerJson(opts.providerMode)) })
    }
    if (url.includes('/release_dates')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [{ iso_3166_1: 'US', release_dates: [{ certification: 'R' }] }] }) })
    }
    if (url.includes('/movie_credits')) {
      const isDirector = url.includes(`/person/${MOVIE.directorId}/`)
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(isDirector ? directorCredits() : { cast: [], crew: [] }) })
    }
    // /movie/{id}?append… — the details document (or the route-failure modes).
    const movieMatch = url.match(/\/movie\/([^/?#]+)(?:[/?#]|$)/)
    if (movieMatch) {
      const reqId = movieMatch[1]
      const notFoundBody = '{"success":false,"status_code":34,"status_message":"mock not found"}'
      if (opts.routeMode === 'not_found' || reqId !== String(MOVIE.tmdbId)) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: notFoundBody })
      }
      // 403 is non-retryable in the TMDB client → getMovieDetails rejects immediately
      // → useMovieData's catch → load_error (never echoes the raw error).
      if (opts.routeMode === 'load_error') return route.fulfill({ status: 403, contentType: 'application/json', body: '{"status_message":"mock load error"}' })
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(tmdbDetails()) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  // The overlay Edge Function — present-overlay success path must NOT call it.
  await page.route('**/functions/v1/generate-movie-overlay', (route) => {
    ledger.unexpectedRequests.push({ method: route.request().method(), endpoint: 'functions/v1/generate-movie-overlay' })
    return route.abort()
  })

  // All Supabase REST. /auth/v1/** is NOT matched → real auth passes through.
  await page.route('**/rest/v1/**', (route) => {
    const req = route.request()
    const method = req.method()
    const url = new URL(req.url())
    const table = decodeURIComponent(url.pathname.split('/rest/v1/')[1] || '').split('?')[0]
    const search = decodeURIComponent(url.search)

    if (method === 'GET' || method === 'HEAD') {
      ledger.reads.push({ table, query: REDACT(url.search) })
      const rows = readFor(table, search, opts)
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
      const entry = { method, table, body, query: REDACT(url.search), seq: ledger.writes.length + 1 }
      if (isExpectedWrite(table)) {
        ledger.writes.push(entry)
        if (shouldFailWrite(table, body, opts)) {
          return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 'MOCK', message: 'mock write failure', details: null, hint: null }) })
        }
        // Reflect successful save/watched writes so the status hook's re-read (its
        // resolve effect re-runs on the `movie` object identity) stays consistent —
        // exactly what the real backend would return.
        if (table === 'user_watchlist') opts.saved = method !== 'DELETE'
        if (table === 'user_history') opts.watched = method !== 'DELETE'
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
