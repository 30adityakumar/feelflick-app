// e2e/fixtures/profile.js
// Deterministic Cinematic DNA fixture + full interception for authenticated Playwright runs of
// /profile (and the private /profile/:userId). The dev test user authenticates for real
// (/auth/v1/** passes through), but EVERY Profile read/write under /rest/v1/**, the editorial
// Edge Function (/functions/v1/generate-taste-summary), and all images are intercepted before the
// route loads — so no behavioral row ever reaches the backend and no taste-summary is ever
// generated live. Reads, Edge calls and cache writes are recorded in distinct ledgers; any
// unexpected write-capable request is aborted + recorded so a test fails loudly if anything
// escapes. No secrets or live user data appear here — all films/reflections are fictional.

import { PROFILE_EVIDENCE_VERSION } from '../../src/shared/lib/profileEvidenceVersion.js'

// "today" = 2026-03-15 (mid-month, so "This month" has entries + a 12-month trajectory exists).
export const CLOCK = '2026-03-15T20:00:00Z'

function pMovie(over) {
  return { id: 0, tmdb_id: 0, title: '', director_name: 'Unknown', release_date: '2020-01-01', runtime: 100, mood_tags: ['tender'], tone_tags: ['quiet'], fit_profile: 'slow-burn', poster_path: '/p.jpg', ...over }
}

// 16 watched films → established (≥15 watched). Repeated directors (Mara Vance ×4, Cole Park ×3,
// Idris Bell ×3) make signature directors; moods/tones/decades/runtimes/dayparts vary for the
// radar, motifs, decade lean, runtime band and daypart distribution.
const DIR = ['Mara Vance', 'Mara Vance', 'Mara Vance', 'Mara Vance', 'Cole Park', 'Cole Park', 'Cole Park', 'Idris Bell', 'Idris Bell', 'Idris Bell', 'Lena Cho', 'Lena Cho', 'Priya Raman', 'Priya Raman', 'Sora Ito', 'Sora Ito']
const MOOD = ['tender', 'tender', 'reflective', 'reflective', 'tense', 'tense', 'melancholy', 'tender', 'cozy', 'reflective', 'tense', 'tender', 'melancholy', 'reflective', 'cozy', 'tender']
const TONE = ['quiet', 'quiet', 'ornate', 'brooding', 'kinetic', 'brooding', 'quiet', 'earnest', 'cozy', 'ornate', 'kinetic', 'quiet', 'brooding', 'earnest', 'cozy', 'quiet']
const FIT  = ['slow-burn', 'slow-burn', 'demanding', 'slow-burn', 'easy', 'demanding', 'slow-burn', 'easy', 'easy', 'demanding', 'easy', 'slow-burn', 'demanding', 'slow-burn', 'easy', 'slow-burn']
const REL  = ['2021-04-01', '2022-06-01', '2020-09-01', '2023-01-01', '2014-03-01', '2016-07-01', '2012-11-01', '2019-02-01', '2008-05-01', '2021-10-01', '2015-08-01', '2022-02-01', '2009-12-01', '2018-04-01', '2023-07-01', '2011-01-01']
const RUN  = [114, 96, 142, 101, 88, 133, 119, 97, 156, 104, 92, 128, 110, 99, 84, 137]
// watched_at spread over ~12 months with varied hours (Morning 8 / Afternoon 14 / Evening 20 / Late 1)
const WATCHED = [
  '2026-03-12T21:00:00Z', '2026-03-05T20:00:00Z', '2026-02-20T22:00:00Z', '2026-02-08T19:00:00Z',
  '2026-01-25T20:00:00Z', '2026-01-10T14:00:00Z', '2025-12-22T21:00:00Z', '2025-12-05T20:00:00Z',
  '2025-11-18T01:00:00Z', '2025-10-30T19:00:00Z', '2025-09-15T20:00:00Z', '2025-08-20T08:00:00Z',
  '2025-07-11T21:00:00Z', '2025-06-02T20:00:00Z', '2025-05-14T19:00:00Z', '2025-04-09T20:00:00Z',
]
export const FILMS = Array.from({ length: 16 }, (_, i) => ({
  movie_id: 9300 + i,
  watched_at: WATCHED[i],
  movies: pMovie({ id: 9300 + i, tmdb_id: 930000 + i, title: `Lantern ${i + 1}`, director_name: DIR[i], release_date: REL[i], runtime: RUN[i], mood_tags: [MOOD[i]], tone_tags: [TONE[i]], fit_profile: FIT[i], poster_path: `/p${i}.jpg` }),
}))

// 6 ratings → established (≥5 rated). One Loved (9–10), a couple unrated.
export const RATINGS = [
  { movie_id: 9300, rating: 9, review_text: 'A patient northern film that earns its silences.', rated_at: '2026-03-12T21:30:00Z' },
  { movie_id: 9301, rating: 8, review_text: null, rated_at: '2026-03-05T20:30:00Z' },
  { movie_id: 9302, rating: 7, review_text: 'Ornate and demanding; rewards a second look.', rated_at: '2026-02-20T22:30:00Z' },
  { movie_id: 9304, rating: 6, review_text: null, rated_at: '2026-01-25T20:30:00Z' },
  { movie_id: 9307, rating: 8, review_text: null, rated_at: '2025-12-05T20:30:00Z' },
  { movie_id: 9310, rating: 5, review_text: null, rated_at: '2025-09-15T20:30:00Z' },
]

// Duplicate raw history: film 9300 logged 3× via different paths/dates. Canonical = latest (Mar 12).
export const DUPLICATE_FILMS = [
  { movie_id: 9300, watched_at: '2026-01-02T18:00:00Z', id: 'd-onb', source: 'onboarding', movies: FILMS[0].movies },
  { movie_id: 9300, watched_at: '2026-02-15T20:00:00Z', id: 'd-dsc', source: 'discover_marked', movies: FILMS[0].movies },
  { movie_id: 9300, watched_at: '2026-03-12T21:00:00Z', id: 'd-ff', source: 'film_file', movies: FILMS[0].movies },
  ...FILMS.slice(1), // 15 other films, one row each → 16 canonical films total
]

// The cached taste fingerprint (drives the Mood Radar). Current evidence version.
function fingerprint(over = {}) {
  return {
    topMoodTags: [
      { key: 'tender', count: 6, share: 6 / 16 }, { key: 'reflective', count: 4, share: 4 / 16 },
      { key: 'tense', count: 3, share: 3 / 16 }, { key: 'melancholy', count: 2, share: 2 / 16 }, { key: 'cozy', count: 1, share: 1 / 16 },
    ],
    topToneTags: [{ key: 'quiet', count: 6 }, { key: 'brooding', count: 3 }, { key: 'ornate', count: 2 }],
    topFitProfiles: [{ key: 'slow-burn', count: 7 }, { key: 'easy', count: 5 }, { key: 'demanding', count: 4 }],
    total: 16,
    evidenceVersion: PROFILE_EVIDENCE_VERSION,
    editorialVersion: PROFILE_EVIDENCE_VERSION,
    ...over,
  }
}

const EDITORIAL = {
  summary: 'You drift toward quiet, patient films — northern light, held silences, and people repairing what time frayed.',
  signature: 'A keeper of quiet, patient light.',
  archetype: ['The Watcher', 'The Quiet', 'The Patient'],
}

// archetype the deterministic fallback would produce (archetypeForFingerprint) — used when no
// stored editorial archetype exists. Kept generic + fictional.
const FALLBACK_ARCHETYPE = ['The Tender', 'The Reflective', 'The Slow-burning']

const REDACT = (s) => String(s).replace(/(apikey|access_token|authorization|email|password|token)=[^&]+/gi, '$1=REDACTED')
const FRESH_TS = '2026-03-15T10:00:00Z'   // 10h before the CLOCK → comfortably within the 24h TTL
const STALE_TS = '2026-01-01T20:00:00Z'   // outside TTL

// Build the user_profiles_computed row for a mode: fingerprint + editorial fields.
function profileRowFor(mode) {
  const base = { user_id: 'SELF', profile: {}, taste_fingerprint_computed_at: FRESH_TS }
  switch (mode) {
    case 'established_current':
    case 'emerging':
    case 'duplicate':
      return { ...base, taste_fingerprint: fingerprint(), editorial_summary: EDITORIAL.summary, editorial_signature: EDITORIAL.signature, editorial_archetype: EDITORIAL.archetype, editorial_generated_at: FRESH_TS }
    case 'established_stale':
      // editorial present, but fingerprint.editorialVersion is OLD → 'stale'
      return { ...base, taste_fingerprint: fingerprint({ editorialVersion: PROFILE_EVIDENCE_VERSION - 1 }), editorial_summary: EDITORIAL.summary, editorial_signature: EDITORIAL.signature, editorial_archetype: EDITORIAL.archetype, editorial_generated_at: FRESH_TS }
    case 'established_missing':
      return { ...base, taste_fingerprint: fingerprint({ editorialVersion: undefined }), editorial_summary: null, editorial_signature: null, editorial_archetype: null, editorial_generated_at: null }
    case 'forming':
      // no fingerprint (computeFingerprint will return null for <5 films); no editorial
      return { ...base, taste_fingerprint: null, taste_fingerprint_computed_at: null, editorial_summary: null, editorial_signature: null, editorial_archetype: null, editorial_generated_at: null }
    case 'forming_cached':
      // a leftover cached editorial that MUST be suppressed because maturity is forming
      return { ...base, taste_fingerprint: fingerprint({ total: 3, editorialVersion: PROFILE_EVIDENCE_VERSION }), editorial_summary: EDITORIAL.summary, editorial_signature: EDITORIAL.signature, editorial_archetype: EDITORIAL.archetype, editorial_generated_at: FRESH_TS }
    default:
      return { ...base, taste_fingerprint: fingerprint(), editorial_summary: EDITORIAL.summary, editorial_signature: EDITORIAL.signature, editorial_archetype: EDITORIAL.archetype, editorial_generated_at: FRESH_TS }
  }
}

function historyFor(mode) {
  if (mode === 'forming' || mode === 'forming_cached') return FILMS.slice(0, 3)
  if (mode === 'emerging') return FILMS.slice(0, 8)
  if (mode === 'duplicate') return DUPLICATE_FILMS
  return FILMS
}
function ratingsFor(mode) {
  if (mode === 'forming' || mode === 'forming_cached') return RATINGS.slice(0, 1)
  if (mode === 'emerging') return RATINGS.slice(0, 3)
  return RATINGS
}

const svg = (label) => `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" fill="#2c2533"/><text x="30" y="32" fill="#fff" font-size="9" text-anchor="middle">${label}</text></svg>`

// Tables that may legitimately be WRITTEN, and only via the explicit editorial refresh flow.
const REFRESH_WRITE_TABLES = new Set(['user_profiles_computed'])
// Authenticated AppShell session bookkeeping fires on every authed route — recorded separately.
const ALLOWED_SHELL_WRITES = new Set(['user_sessions'])

export async function installProfileFixture(page, options = {}) {
  const opts = { mode: 'established_current', edgeMode: 'success', cacheWriteMode: 'success', reducedMotion: false, ...options }

  const state = { profileRow: profileRowFor(opts.mode), editorial: null }

  const ledger = {
    requests: [], reads: [], writes: [], shellWrites: [], edgeCalls: [], unexpectedRequests: [],
    setMode(m) { opts.mode = m },
    setEdgeMode(m) { opts.edgeMode = m },
    setCacheWriteMode(m) { opts.cacheWriteMode = m },
    readsFor(t) { return this.reads.filter(r => r.table === t) },
    writesFor(t) { return this.writes.filter(w => w.table === t) },
  }

  await page.clock.setFixedTime(new Date(CLOCK))
  await page.addInitScript(() => {
    let seed = 0x2bee5eed
    Math.random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
  })
  if (opts.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' })

  // Images (TMDB posters + avatars) → tiny deterministic SVG; nothing leaves the browser.
  await page.route(/image\.tmdb\.org|googleusercontent\.com|gravatar/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg('img') }))

  // The editorial Edge Function — ONLY hit by the explicit refresh. The raw cross-origin fetch
  // (Authorization header) triggers a CORS preflight, so OPTIONS must be answered with CORS
  // headers and the POST response must carry Access-Control-Allow-Origin. edgeCalls counts the
  // real POST only, so the "zero generation on render" guarantee stays exact.
  const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST,OPTIONS', 'access-control-allow-headers': 'authorization,content-type,apikey,x-client-info' }
  await page.route('**/functions/v1/generate-taste-summary**', (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS, body: '' })
    ledger.edgeCalls.push({ at: ledger.requests.length })
    const json = (status, obj) => route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(obj) })
    if (opts.edgeMode === 'edge_failure') return json(500, { error: 'mock edge failure' })
    if (opts.edgeMode === 'malformed') return json(200, { nope: true })
    return json(200, { summary: 'A freshly generated reflection — newly attentive to your latest evenings of quiet film.', signature: 'Newly read, newly quiet.' })
  })

  function readFor(table) {
    switch (table) {
      case 'user_history': return historyFor(opts.mode)
      case 'user_ratings': return ratingsFor(opts.mode)
      case 'user_profiles_computed': return [state.profileRow]
      case 'user_similarity': return []            // self-view social: empty (FriendsRanked self-hides)
      case 'feelflick_stats': return []            // skew/community self-hides
      case 'users': return [{ id: 'SELF', name: 'Ada Lovelace', avatar_url: null, joined_at: '2025-04-01T00:00:00Z', total_movies_watched: 16, taste_baseline_moods: [] }]
      case 'user_settings': return [{ settings: { prefs: { avoidGenres: [] } } }]
      default: return []
    }
  }

  await page.route('**/rest/v1/**', (route) => {
    const req = route.request()
    const method = req.method()
    const url = new URL(req.url())
    const table = decodeURIComponent(url.pathname.split('/rest/v1/')[1] || '').split('?')[0]
    ledger.requests.push({ method, table, query: REDACT(url.search) })

    if (method === 'GET' || method === 'HEAD') {
      ledger.reads.push({ table, query: REDACT(url.search) })
      // load_error: the route's primary read (user_history) fails → provider catch → 'load_error'.
      if (opts.mode === 'load_error' && table === 'user_history') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: '42P01', message: 'relation does not exist (mock)', details: 'raw technical detail', hint: null }) })
      }
      const rows = readFor(table)
      const wantsObject = (req.headers()['accept'] || '').includes('pgrst.object')
      const body = wantsObject ? JSON.stringify(rows[0] ?? null) : JSON.stringify(rows)
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'content-range': `0-${Math.max(0, rows.length - 1)}/${rows.length}` }, body })
    }

    if (method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
      let body = null
      try { body = req.postDataJSON() } catch { body = req.postData() || null }
      const entry = { method, table, query: REDACT(url.search), seq: ledger.requests.length }

      // The ONLY permitted Profile write: the editorial/fingerprint merge on user_profiles_computed
      // — and ONLY ever happens after the explicit refresh flow (regenerateEditorial). On mount the
      // current-version cache means getTasteFingerprint never persists, so a write here on mount is
      // already an escape by construction.
      if (REFRESH_WRITE_TABLES.has(table)) {
        ledger.writes.push(entry)
        if (opts.cacheWriteMode === 'failure') return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 'MOCK', message: 'mock cache write failure' }) })
        // Reflect the editorial into fixture state (so a subsequent read is consistent).
        const f = Array.isArray(body) ? body[0] : body
        if (f) state.editorial = { summary: f.editorial_summary, signature: f.editorial_signature }
        return route.fulfill({ status: method === 'POST' ? 201 : 200, contentType: 'application/json', headers: { 'content-range': '*/*' }, body: '[]' })
      }

      if (ALLOWED_SHELL_WRITES.has(table)) {
        ledger.shellWrites.push(entry)
        const echo = Array.isArray(body) ? body : body ? [body] : []
        return route.fulfill({ status: method === 'POST' ? 201 : 200, contentType: 'application/json', headers: { 'content-range': '*/*' }, body: JSON.stringify(echo) })
      }

      // Any other write-capable request (user_history/user_ratings/user_similarity write, RPC, …)
      // is an escape — recorded + aborted so the test fails loudly.
      ledger.unexpectedRequests.push({ method, table })
      return route.abort()
    }

    return route.fulfill({ status: 204, body: '' })
  })

  return ledger
}
