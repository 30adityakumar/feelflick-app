// e2e/fixtures/preferences.js
// Deterministic, fail-closed interception for authenticated Playwright runs of /preferences.
// The dev user authenticates for real (/auth/v1/** passes through); every /rest/v1/** read/write
// is intercepted before the page loads, so no live preference data is touched.
//
// Preferences data flow:
//   * Load (GET):  user_settings (settings + updated_at), user_preferences (genre rows),
//                  user_history (director suggestions).
//   * Save (RPC):  save_user_preferences_v2 — the ONLY persistence path. A direct write to
//                  user_settings / user_preferences / user_profiles_computed is recorded as a
//                  FORBIDDEN directWrite, aborted, and fails the test (no legacy multi-write fallback).
//
// options: { rpc: 'success'|'conflict'|'error', settingsError: false|true|'once',
//            prefsError, historyError, saveDelayMs }

export const CLOCK = '2026-03-15T20:00:00Z'
const T_LOADED = '2026-03-15T19:00:00Z'
const T_SAVED = '2026-03-15T19:05:00Z'

const PREFS = {
  moodWeights: { tender: 0.85, 'slow-burn': 0.9, cerebral: 0.25 },
  avoidGenres: ['Horror'],
  trustedDirectors: ['Bong Joon-ho'],
  mutedDirectors: [],
  runtimeFloor: 95, runtimeCap: 160,
  boundaries: { graphic: false, sexual: true, animals: false, noise: false },
  subtitles: 'always-welcome', spoilerTier: 'brief',
  languages: ['English', 'Korean'],
  // unexposed keys that must be preserved untouched by the RPC:
  daypart: { evening: true }, subscriptions: { netflix: true },
}
const PREF_ROWS = [{ genre_id: 18, excluded: false }, { genre_id: 9648, excluded: false }]
const HISTORY = ['Bong Joon-ho', 'Bong Joon-ho', 'Wong Kar-wai'].map((d) => ({ movies: { director_name: d } }))
const FORBIDDEN_DIRECT_WRITE = new Set(['user_preferences', 'user_settings', 'user_profiles_computed'])

export async function installPreferencesFixture(page, options = {}) {
  const opts = { rpc: 'success', settingsError: false, prefsError: false, historyError: false, saveDelayMs: 0, ...options }
  let settingsFailsLeft = opts.settingsError === 'once' ? 1 : opts.settingsError ? Infinity : 0
  // user_preferences is read ONLY by the Preferences provider on /preferences, so failing it is the
  // unambiguous way to drive the critical load_error (no other reader can consume a one-shot failure).
  let prefsFailsLeft = opts.prefsError === 'once' ? 1 : opts.prefsError ? Infinity : 0
  const ledger = { requests: [], reads: [], rpcs: [], directWrites: [], unexpected: [] }
  const json = (route, status, obj, headers = {}) => route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(obj) })

  await page.route(/image\.tmdb\.org|googleusercontent\.com|gravatar/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"></svg>' }))

  await page.route('**/rest/v1/**', async (route) => {
    const req = route.request()
    const method = req.method()
    const url = new URL(req.url())
    const path = decodeURIComponent(url.pathname.split('/rest/v1/')[1] || '')
    const table = path.split('?')[0]
    const rpcName = path.startsWith('rpc/') ? table.slice(4) : null
    ledger.requests.push({ method, table })

    if (rpcName) {
      let body = {}
      try { body = req.postDataJSON() } catch { /* ignore */ }
      ledger.rpcs.push({ name: rpcName, body })
      if (rpcName === 'save_user_preferences_v2') {
        if (opts.saveDelayMs) await new Promise((r) => setTimeout(r, opts.saveDelayMs))
        if (opts.rpc === 'conflict') return json(route, 409, { code: 'PT409', message: 'changed elsewhere' })
        if (opts.rpc === 'error') return json(route, 400, { code: 'PT400', message: 'invalid' })
        return json(route, 200, { updated_at: T_SAVED })
      }
      return json(route, 200, []) // any other RPC (shell) → empty
    }

    if (method === 'GET' || method === 'HEAD') {
      if (table === 'user_settings') {
        // Fail ONLY the Preferences provider's read (it uniquely selects updated_at as its
        // concurrency token), so the failure isn't consumed by another user_settings reader.
        const isPrefsLoad = url.search.includes('updated_at')
        if (settingsFailsLeft > 0 && isPrefsLoad) { settingsFailsLeft -= 1; return json(route, 500, { message: 'boom' }) }
        ledger.reads.push({ table })
        return json(route, 200, { settings: { prefs: PREFS }, updated_at: T_LOADED })
      }
      if (table === 'user_preferences') {
        if (prefsFailsLeft > 0) { prefsFailsLeft -= 1; return json(route, 500, { message: 'boom' }) }
        ledger.reads.push({ table })
        return json(route, 200, PREF_ROWS, { 'content-range': `0-${PREF_ROWS.length - 1}/${PREF_ROWS.length}` })
      }
      if (table === 'user_history') {
        if (opts.historyError) return json(route, 500, { message: 'boom' })
        ledger.reads.push({ table })
        return json(route, 200, HISTORY, { 'content-range': '0-2/3' })
      }
      ledger.reads.push({ table })
      return json(route, 200, [], { 'content-range': '0-0/0' })
    }

    // Writes: Preferences must persist ONLY through the RPC.
    if (FORBIDDEN_DIRECT_WRITE.has(table)) {
      ledger.directWrites.push({ method, table })
      return route.abort()
    }
    // Shell write-capable requests (e.g. session bookkeeping) succeed empty.
    ledger.unexpected.push({ method, table })
    return json(route, 200, [], { 'content-range': '*/*' })
  })

  return ledger
}
