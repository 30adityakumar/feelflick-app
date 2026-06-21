// e2e/fixtures/browse.js
// Deterministic Browse fixture for the "explicit curiosity" redesign.
// The dev user authenticates for real (/auth/v1/** passes through) but EVERY
// /rest/v1/** read/write is intercepted so no Browse query reaches the backend.
// TMDB images + search are mocked. A fixed clock + seeded RNG keep the route
// reproducible.
//
// The candidate pool is returned for any `movies` request (browseMovies +
// peekTerritory both read it), with a content-range count so pagination + the
// honest result count render deterministically. History / ratings / similarity
// are returned empty, so the profile is COLD: the "Start somewhere" row shows its
// editorial paths (hidden gems / cult / short) — personal paths are exercised by
// unit tests (useCuriosityPaths), not these baselines (the same offline limitation
// the Home baselines document for embedding-driven rows).
//
// No secrets or live user data appear here.

const POSTERS = ['one', 'two', 'three', 'four', 'five', 'six']

function movieRow(i) {
  return {
    id: 7001 + i, tmdb_id: 700001 + i, title: `Browse Film ${i + 1}`,
    overview: 'A well-made film with a clear point of view.',
    release_date: `20${String(10 + (i % 9)).padStart(2, '0')}-01-01`, release_year: 2010 + (i % 9),
    runtime: i % 4 === 0 ? 86 : 104 + (i % 5) * 7,
    original_language: 'en', poster_path: `/browse-${POSTERS[i % POSTERS.length]}.jpg`, backdrop_path: null,
    director_name: i % 3 === 0 ? 'Mara Vance' : 'Idris Calloway',
    primary_genre: 'Drama', genres: ['Drama'], mood_tags: ['tender'],
    vote_average: 7.8, vote_count: 1500, is_valid: true,
    ff_final_rating: 8.6, ff_confidence: 0.9,
    ff_critic_rating: 78 - i, ff_critic_confidence: 80,
    ff_audience_rating: 88 - i * 0.1, ff_audience_confidence: 0.9,
    // Rare, single strong signals so badges stay sparse + deterministic: only one
    // "exceptional", one "cult", one "hidden gem" across the 18-film page.
    ff_rating_genre_normalized: i === 8 ? 8.6 : 6.9 + (i % 3) * 0.3,
    cult_status_score: i === 2 ? 82 : 28 + (i % 4) * 4,
    discovery_potential: i === 5 ? 78 : 36 + (i % 5) * 3,
    accessibility_score: 60, vfx_level_score: 20,
    pacing_score: 50, intensity_score: 40, emotional_depth_score: 70,
    dialogue_density: 50, attention_demand: 50, ff_critic_audience_gap: 0,
  }
}
const POOL = Array.from({ length: 18 }, (_, i) => movieRow(i))

function svgFor(url) {
  const w = url.includes('backdrop') ? 1280 : 300
  const h = url.includes('backdrop') ? 720 : 450
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#1d1b18"/></svg>`
}

function readFor(table, opts) {
  if (opts.dataState === 'empty' && table === 'movies') return []
  switch (table) {
    case 'movies': return POOL
    default: return [] // user_history / user_watchlist / user_ratings / user_similarity → cold
  }
}

export async function installBrowseFixture(page, options = {}) {
  const opts = { dataState: 'ready', reducedMotion: false, ...options }

  await page.clock.setFixedTime(new Date('2026-02-13T15:00:00Z'))
  await page.addInitScript(() => {
    let seed = 0x2bee5eed
    Math.random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
  })
  if (opts.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' })

  await page.route('**/image.tmdb.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svgFor(route.request().url()) }))

  // TMDB search/discover → empty so text-search mode degrades gracefully.
  await page.route('**/api.themoviedb.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [], total_pages: 1, total_results: 0 }) }))

  await page.route('**/rest/v1/rpc/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))

  await page.route('**/rest/v1/**', (route) => {
    const req = route.request()
    const method = req.method()
    const url = new URL(req.url())
    const table = decodeURIComponent(url.pathname.split('/rest/v1/')[1] || '').split('?')[0]

    if (method === 'GET' || method === 'HEAD') {
      if (opts.dataState === 'load_error' && table === 'movies') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"mock load error"}' })
      }
      const rows = readFor(table, opts)
      const accept = req.headers()['accept'] || ''
      const body = accept.includes('pgrst.object') ? JSON.stringify(rows[0] ?? null) : JSON.stringify(rows)
      return route.fulfill({
        status: 200, contentType: 'application/json',
        // Expose content-range so supabase-js can read the exact count cross-origin
        // (browseMovies pagination + peekTerritory path validation both rely on it).
        headers: {
          'content-range': `0-${Math.max(0, rows.length - 1)}/${rows.length}`,
          'access-control-expose-headers': 'content-range',
        },
        body,
      })
    }

    if (method === 'DELETE') return route.fulfill({ status: 204, body: '' })

    // Writes (save/watched) echo back success.
    let body = null
    try { body = req.postDataJSON() } catch { body = null }
    const echo = Array.isArray(body) ? body : body ? [body] : []
    return route.fulfill({ status: method === 'POST' ? 201 : 200, contentType: 'application/json', headers: { 'content-range': '*/*' }, body: JSON.stringify(echo) })
  })
}
