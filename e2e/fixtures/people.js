// e2e/fixtures/people.js
// Deterministic, fail-closed interception for authenticated Playwright runs of /people. The dev test
// user authenticates for real (/auth/v1/** passes through), but EVERY People read/write under
// /rest/v1/** is intercepted before the route loads — so no live People data is ever read or written.
//
// People's data flow (post the F8.8-prep identity fix):
//   * Phase 1 (GET):  user_follows (own follows), user_follows HEAD (followers count),
//                     user_similarity ×2 (numbers only — NO embedded users() join), user_settings (opt-in).
//   * Phase 2 (RPC):  get_people_public_identities (id/name/avatar), get_discoverable_taste_profiles.
//   * FOF (RPC):      get_follow_suggestions (+ more get_people_public_identities).
//   * Search (RPC):   search_people_by_name.
//   * Writes:         user_follows INSERT (follow) / DELETE (unfollow); user_sessions = shell bookkeeping.
//
// Ledgers record reads / RPCs / follow-writes / shell-writes / images / unexpected. Any cross-user
// BEHAVIORAL read (user_history, user_ratings, reviews) or a retired view (user_fingerprint_public,
// user_similarity_discoverable) is recorded as FORBIDDEN, aborted, and fails the test. Any other
// write-capable request is an escape — aborted + recorded. No real names/emails/IDs appear here.

import { readFileSync } from 'node:fs'

export const CLOCK = '2026-03-15T20:00:00Z'

// The authenticated dev user's id, decoded from the stored session JWT (sub claim) — no network and
// no navigation, so interception can be installed before any page load. Used ONLY internally to seed
// the self-candidate defense; never rendered (the provider filters it) and never logged.
function readSelfId() {
  try {
    const store = JSON.parse(readFileSync('e2e/.auth/user.json', 'utf8'))
    for (const origin of store.origins || []) {
      for (const item of origin.localStorage || []) {
        if (!/auth-token/.test(item.name)) continue
        const session = JSON.parse(item.value)
        const token = session.access_token || session?.currentSession?.access_token
        if (!token) continue
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'))
        if (payload.sub) return payload.sub
      }
    }
  } catch { /* no stored session → no self candidate */ }
  return null
}

// Deterministic fictional candidate UUIDs (v4-shaped). `self` is replaced at install time with the
// authenticated user's real id so the self-candidate defense can be exercised honestly.
const U = {
  ana: 'aaaa0001-0000-4000-8000-000000000001',
  bo:  'aaaa0002-0000-4000-8000-000000000002',
  cy:  'aaaa0003-0000-4000-8000-000000000003',
  eve: 'aaaa0005-0000-4000-8000-000000000005',
  fin: 'aaaa0006-0000-4000-8000-000000000006', // already followed
  gus: 'aaaa0007-0000-4000-8000-000000000007', // opted OUT of discovery
  hal: 'aaaa0008-0000-4000-8000-000000000008',
  ida: 'aaaa0009-0000-4000-8000-000000000009',
  jay: 'aaaa0010-0000-4000-8000-000000000010',
  kim: 'aaaa0011-0000-4000-8000-000000000011',
  lee: 'aaaa0012-0000-4000-8000-000000000012', // FOF-only (not in similarity) — Suggested via Fin
}

const NAME = {
  [U.ana]: 'Ana Okafor', [U.bo]: 'Bo Tremblay', [U.cy]: 'Cy Nakamura', [U.eve]: 'Eve Salenko',
  [U.fin]: 'Fin Adeyemi', [U.gus]: 'Gus Halloran', [U.hal]: 'Hal Voss', [U.ida]: 'Ida Pereira',
  [U.jay]: 'Jay Okonkwo', [U.kim]: 'Kim Larsen', [U.lee]: 'Lee Okafor',
}

// overall_similarity (0-1), movies_in_common, fingerprint total (counterpart maturity).
// Mix of evidence tiers: established (total≥15) / emerging (5-14) / forming (<5) / no-films-in-common.
const CANDIDATES = [
  { id: U.ana, sim: 0.92, inCommon: 18,   total: 40 }, // established, strong evidence  → "Very close taste"
  { id: U.bo,  sim: 0.81, inCommon: 6,    total: 11 }, // emerging                       → cautious band
  { id: U.cy,  sim: 0.70, inCommon: 4,    total: 3  }, // forming counterpart            → "Taste still forming"
  { id: U.eve, sim: 0.62, inCommon: null, total: 30 }, // established, NO films-in-common → band, no evidence line
  { id: U.fin, sim: 0.55, inCommon: 9,    total: 22, following: true }, // already followed → "Following"
  { id: U.gus, sim: 0.50, inCommon: 8,    total: 18, optedOut: true },  // excluded from discovery
  { id: U.hal, sim: 0.48, inCommon: 12,   total: 25 },
  { id: U.ida, sim: 0.44, inCommon: 2,    total: 16 }, // insufficient overlap → "Not enough shared evidence yet"
  { id: U.jay, sim: 0.40, inCommon: 7,    total: 14 },
  { id: U.kim, sim: 0.36, inCommon: 5,    total: 9  },
  { id: U.lee, sim: 0,    inCommon: null, total: 20, fofOnly: true }, // opted-in, NOT in similarity → only reachable via FOF
]

const FOLLOWING = CANDIDATES.filter(c => c.following).map(c => c.id) // [fin]

const svg = (label) => `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="#2c2533"/><text x="24" y="27" fill="#fff" font-size="8" text-anchor="middle">${label}</text></svg>`
const REDACT = (s) => String(s).replace(/(apikey|access_token|authorization|email|password|token)=[^&]+/gi, '$1=REDACTED')

// Retired projection views — must NEVER be read again (always fail-closed).
const RETIRED_VIEWS = new Set(['user_fingerprint_public', 'user_similarity_discoverable'])
// Behavioral tables — People must not read them CROSS-USER. An own/shell read (user_id=eq.self) is
// harmless and fulfilled empty; a cross-user read (user_id=in.(…) or one naming a candidate) fails closed.
const BEHAVIORAL_TABLES = new Set(['user_history', 'user_ratings', 'reviews', 'review_notes', 'diary_entries'])
// The only writes People legitimately performs.
const FOLLOW_WRITE_TABLES = new Set(['user_follows'])
// Authenticated AppShell session bookkeeping fires on every authed route.
const ALLOWED_SHELL_WRITES = new Set(['user_sessions', 'user_events', 'user_interactions'])

// Search rows (identity-only, from search_people_by_name).
const SEARCH_ROWS = [
  { id: U.hal, name: NAME[U.hal], avatar_url: null },
  { id: U.jay, name: NAME[U.jay], avatar_url: null },
]

export async function installPeopleFixture(page, options = {}) {
  const opts = {
    mode: 'healthy',          // 'healthy' | 'empty'
    followDelayMs: 0,         // delay the follow INSERT response so a pending window exists
    followWrite: 'success',   // 'success' | 'failure' | 'duplicate'
    unfollowWrite: 'success', // 'success' | 'failure'
    search: 'success',        // 'success' | 'empty' | 'failure'
    rpc: 'ok',                // 'ok' | 'identity_fail' | 'taste_fail'
    reducedMotion: false,
    includeSelfCandidate: false,
    ...options,
  }

  const ledger = {
    requests: [], reads: [], rpcs: [], followWrites: [], shellWrites: [], images: [],
    forbiddenReads: [], unexpectedRequests: [],
    rpcsFor(name) { return this.rpcs.filter(r => r.name === name) },
    readsFor(t) { return this.reads.filter(r => r.table === t) },
  }

  await page.clock.setFixedTime(new Date(CLOCK))
  await page.addInitScript(() => {
    let seed = 0x2bee5eed
    Math.random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
  })
  if (opts.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' })

  const selfId = readSelfId() // decoded from the stored session JWT — no navigation, no live read.

  // Mutable follow state so follow/unfollow reflects on a re-load within the session.
  const followingSet = new Set(opts.mode === 'empty' ? [] : FOLLOWING)

  function discoverableCandidates() {
    if (opts.mode === 'empty') return []
    return CANDIDATES.filter(c => !c.optedOut)
  }
  // user_similarity rows the provider reads (numbers only — identity comes from the RPC).
  function similarityRows() {
    if (opts.mode === 'empty') return []
    const rows = CANDIDATES.filter(c => !c.fofOnly).map(c => ({ user_b_id: c.id, overall_similarity: c.sim, movies_in_common: c.inCommon }))
    if (opts.includeSelfCandidate && selfId) {
      rows.unshift({ user_b_id: selfId, overall_similarity: 0.99, movies_in_common: 20 }) // must be filtered out
    }
    return rows
  }
  function settingsRows() {
    // opted-out candidates carry privacy.showOnLeaderboards=false; others omitted (default opt-in).
    return CANDIDATES.filter(c => c.optedOut).map(c => ({ user_id: c.id, settings: { privacy: { showOnLeaderboards: false } } }))
  }
  // get_people_public_identities — identity for the discoverable candidates (+ self, harmless: filtered upstream).
  function identitiesFor(ids) {
    const known = new Set([...discoverableCandidates().map(c => c.id), ...(selfId ? [selfId] : [])])
    return ids.filter(id => known.has(id)).map(id => ({ id, name: id === selfId ? 'You' : NAME[id] || 'Anonymous', avatar_url: null }))
  }
  // get_discoverable_taste_profiles — least-data fingerprints for opted-in users (+ caller's own row).
  function tasteProfiles() {
    const rows = discoverableCandidates().map(c => ({
      user_id: c.id, top_mood_tags: [{ key: 'tender' }], top_tone_tags: [{ key: 'quiet' }],
      top_fit_profiles: [{ key: 'slow-burn' }], total: c.total,
    }))
    if (selfId) rows.push({ user_id: selfId, top_mood_tags: [{ key: 'tense' }], top_tone_tags: [], top_fit_profiles: [], total: 25 })
    return rows
  }

  await page.route(/image\.tmdb\.org|googleusercontent\.com|gravatar/, (route) => {
    ledger.images.push({})
    return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg('img') })
  })

  await page.route('**/rest/v1/**', async (route) => {
    const req = route.request()
    const method = req.method()
    const url = new URL(req.url())
    const path = decodeURIComponent(url.pathname.split('/rest/v1/')[1] || '')
    const table = path.split('?')[0]
    const isRpc = table.startsWith('rpc/')
    const rpcName = isRpc ? table.slice('rpc/'.length) : null
    ledger.requests.push({ method, table, query: REDACT(url.search) })
    const json = (status, obj, headers = {}) => route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(obj) })

    // ── RPCs (always POST) ───────────────────────────────────────────────────────────────────
    if (isRpc) {
      let body = null
      try { body = req.postDataJSON() } catch { body = null }
      ledger.rpcs.push({ name: rpcName, body })
      switch (rpcName) {
        case 'get_people_public_identities':
          if (opts.rpc === 'identity_fail') return json(500, { code: 'MOCK', message: 'identity RPC failed' })
          return json(200, identitiesFor((body && body.requested_user_ids) || []))
        case 'get_discoverable_taste_profiles':
          if (opts.rpc === 'taste_fail') return json(500, { code: 'MOCK', message: 'taste RPC failed' })
          return json(200, tasteProfiles())
        case 'get_follow_suggestions':
          // Caller-scoped FOF: Lee is suggested via Fin (followed). Empty in 'empty' mode.
          return json(200, opts.mode === 'empty' ? [] : [{ suggested_user_id: U.lee, via_user_id: U.fin }])
        case 'search_people_by_name':
          if (opts.search === 'failure') return json(500, { code: 'MOCK', message: 'search failed' })
          return json(200, opts.search === 'empty' ? [] : SEARCH_ROWS)
        default:
          ledger.unexpectedRequests.push({ method, table })
          return route.abort()
      }
    }

    // ── reads ────────────────────────────────────────────────────────────────────────────────
    if (method === 'GET' || method === 'HEAD') {
      // Retired views: never legitimate → fail closed.
      if (RETIRED_VIEWS.has(table)) {
        ledger.forbiddenReads.push({ method, table })
        return route.abort()
      }
      // Behavioral tables: a CROSS-USER read is the violation; an own/shell read is harmless.
      if (BEHAVIORAL_TABLES.has(table)) {
        const crossUser = /user_id=in\./.test(url.search) || CANDIDATES.some(c => url.search.includes(c.id)) || (selfId && url.search.includes('user_id=eq.') && !url.search.includes(`eq.${selfId}`))
        if (crossUser) { ledger.forbiddenReads.push({ method, table, query: REDACT(url.search) }); return route.abort() }
        ledger.reads.push({ table, query: REDACT(url.search) })
        return json(200, [], { 'content-range': '*/*' }) // own/shell read → empty, nothing leaks
      }
      ledger.reads.push({ table, query: REDACT(url.search) })
      switch (table) {
        case 'user_follows': {
          // HEAD = "how many people follow ME" (following_id=eq.self) → fixed for deterministic visuals.
          if (method === 'HEAD') return route.fulfill({ status: 200, headers: { 'content-range': `0-2/3` }, body: '' })
          // own follows: select=following_id&follower_id=eq.SELF
          if (url.search.includes('following_id') && url.search.includes('follower_id=eq')) {
            return json(200, [...followingSet].map(id => ({ following_id: id })), { 'content-range': `0-${Math.max(0, followingSet.size - 1)}/${followingSet.size}` })
          }
          return json(200, [], { 'content-range': '*/*' })
        }
        case 'user_similarity': {
          // simAsA = .eq(user_a_id); simAsB = .eq(user_b_id). All counterparts come back via simAsA.
          const rows = url.search.includes('user_a_id=eq') ? similarityRows() : []
          return json(200, rows, { 'content-range': `0-${Math.max(0, rows.length - 1)}/${rows.length}` })
        }
        case 'user_settings': {
          const rows = settingsRows()
          return json(200, rows, { 'content-range': `0-${Math.max(0, rows.length - 1)}/${rows.length}` })
        }
        default:
          return json(200, [], { 'content-range': '*/*' })
      }
    }

    // ── writes ───────────────────────────────────────────────────────────────────────────────
    if (method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
      let body = null
      try { body = req.postDataJSON() } catch { body = req.postData() || null }
      const entry = { method, table, query: REDACT(url.search), body, seq: ledger.requests.length }

      if (FOLLOW_WRITE_TABLES.has(table)) {
        if (method === 'POST') { // follow INSERT
          ledger.followWrites.push({ ...entry, op: 'follow' })
          const target = (Array.isArray(body) ? body[0] : body)?.following_id
          if (opts.followDelayMs) await new Promise(r => setTimeout(r, opts.followDelayMs))
          if (opts.followWrite === 'failure') return json(400, { code: '42501', message: 'permission denied (mock)' })
          if (opts.followWrite === 'duplicate') return json(409, { code: '23505', message: 'duplicate key value violates unique constraint' })
          if (target) followingSet.add(target)
          return json(201, [], { 'content-range': '*/*' })
        }
        if (method === 'DELETE') { // unfollow
          ledger.followWrites.push({ ...entry, op: 'unfollow' })
          if (opts.unfollowWrite === 'failure') return json(400, { code: '42501', message: 'permission denied (mock)' })
          const m = /following_id=eq\.([^&]+)/.exec(url.search)
          if (m) followingSet.delete(decodeURIComponent(m[1]))
          return json(200, [], { 'content-range': '*/*' })
        }
      }

      if (ALLOWED_SHELL_WRITES.has(table)) {
        ledger.shellWrites.push(entry)
        const echo = Array.isArray(body) ? body : body ? [body] : []
        return json(method === 'POST' ? 201 : 200, echo, { 'content-range': '*/*' })
      }

      // anything else write-capable (a cross-user behavioral write, an unexpected RPC, …) → escape.
      ledger.unexpectedRequests.push({ method, table })
      return route.abort()
    }

    return route.fulfill({ status: 204, body: '' })
  })

  ledger.selfId = selfId
  ledger.candidateIds = CANDIDATES.map(c => c.id)
  ledger.NAME = NAME
  ledger.U = U
  return ledger
}
