// e2e/fixtures/account.js
// Deterministic, fully-intercepted fixture for authenticated Playwright runs of /account.
//
// The dev test user authenticates for real (storageState boots an authed session), but this
// fixture then makes the run hermetic + PII-free: an init script rewrites the stored session to a
// SYNTHETIC identity (name / email / provider), /auth/v1/** is synthesised (so getUser/refresh/
// logout never hit the real backend and never mutate the real test account), and EVERY /account
// read/write under /rest/v1/** is intercepted. A ledger records reads, settings writes, RPCs,
// auth writes, sign-outs and any storage call so tests can assert behaviour (e.g. that disabling
// avatar editing means NO storage write ever happens). All names/emails here are fictional.

export const CLOCK = '2026-06-21T12:00:00Z'

export const SYN = {
  id: 'SELF',
  email: 'mira.sen@example.test',
  name: 'Mira Sen',
  longName: 'Mirabel Seraphina Şenoğlu-Wątróbień de la Cruz',
  joined: '2025-04-01T00:00:00Z',
}

const DEFAULT_SETTINGS = () => ({
  notifications: [{ id: 'daily', label: 'Daily Briefing', desc: 'A daily email with tonight’s picks.', enabled: true, badge: 'Recommended' }],
  privacy: { showOnLeaderboards: false, analytics: true },
  prefs: { engine: { avoid: [] } }, // owned by /preferences — must survive every account write
})

const REDACT = (s) => String(s).replace(/(apikey|access_token|authorization|email|password|token)=[^&]+/gi, '$1=REDACTED')
const svg = (l) => `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" fill="#2c2533"/><text x="30" y="32" fill="#fff" font-size="9" text-anchor="middle">${l}</text></svg>`

export async function installAccountFixture(page, options = {}) {
  const opts = {
    provider: 'google', longName: false, reducedMotion: false,
    loadError: false, pending: false,
    settingsWrite: 'success',  // 'success' | 'fail' | 'hang'
    usersWrite: 'success',     // 'success' | 'fail'  (covers name PATCH + reset flag PATCH)
    authWrite: 'success',      // 'success' | 'fail'  (auth.updateUser)
    rpc: 'success',            // 'success' | 'fail'
    resetFailTable: null,      // table name whose DELETE returns 500
    signOut: 'success',        // 'success' | 'fail'
    ...options,
  }
  const nm0 = opts.longName ? SYN.longName : SYN.name
  const state = { settings: DEFAULT_SETTINGS(), pending: opts.pending, name: nm0 }
  const ledger = {
    requests: [], reads: [], writes: [], rpcs: [], authWrites: [], signOuts: [], storageCalls: [], resetOps: [], unexpected: [],
    set(k, v) { opts[k] = v },
    setPending(v) { state.pending = v },
    writesFor(t) { return this.writes.filter((w) => w.table === t) },
    lastSettings() { return state.settings },
  }

  const name = opts.longName ? SYN.longName : SYN.name
  const synUser = () => ({ id: SYN.id, aud: 'authenticated', role: 'authenticated', email: SYN.email, app_metadata: { provider: opts.provider }, user_metadata: { name, onboarding_complete: true, has_onboarded: true, avatar_url: null }, created_at: SYN.joined })

  await page.clock.setFixedTime(new Date(CLOCK))
  if (opts.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' })

  // Rewrite the stored session to the synthetic identity (no network needed for getSession).
  await page.addInitScript(([provider, nm, em, id, joined]) => {
    try {
      const far = Math.floor(Date.now() / 1000) + 31536000
      for (const k of Object.keys(localStorage)) {
        if (!/^sb-.*-auth-token$/.test(k)) continue
        const s = JSON.parse(localStorage.getItem(k) || 'null')
        if (!s) continue
        s.expires_at = far; s.expires_in = 31536000
        s.user = { ...(s.user || {}), id, email: em, app_metadata: { ...(s.user?.app_metadata || {}), provider }, user_metadata: { ...(s.user?.user_metadata || {}), name: nm, onboarding_complete: true, has_onboarded: true } }
        if (s.currentSession) s.currentSession.user = s.user
        localStorage.setItem(k, JSON.stringify(s))
      }
    } catch { /* ignore */ }
  }, [opts.provider, name, SYN.email, SYN.id, SYN.joined])

  await page.route(/image\.tmdb\.org|googleusercontent\.com|gravatar/, (r) => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg('img') }))

  // Avatar editing is disabled → any storage write is an escape. Record + abort so it fails loudly.
  await page.route('**/storage/v1/**', (route) => { ledger.storageCalls.push({ method: route.request().method(), url: REDACT(route.request().url()) }); return route.abort() })

  // No Edge functions are expected on /account.
  await page.route('**/functions/v1/**', (route) => route.fulfill({ status: 204, body: '' }))

  // Synthesise auth so the real test account is never read or mutated.
  await page.route('**/auth/v1/**', (route) => {
    const req = route.request(); const method = req.method(); const url = new URL(req.url())
    if (/\/auth\/v1\/logout/.test(url.pathname)) {
      ledger.signOuts.push({ scope: url.searchParams.get('scope') || 'local' })
      return route.fulfill({ status: opts.signOut === 'fail' ? 500 : 204, body: '' })
    }
    if (/\/auth\/v1\/user/.test(url.pathname) && (method === 'PUT' || method === 'PATCH')) {
      ledger.authWrites.push({ at: ledger.requests.length })
      if (opts.authWrite === 'fail') return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'mock auth error' }) })
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(synUser()) })
    }
    if (/\/auth\/v1\/token/.test(url.pathname)) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ access_token: 's.a.b', token_type: 'bearer', expires_in: 31536000, refresh_token: 'r', user: synUser() }) })
    if (/\/auth\/v1\/user/.test(url.pathname)) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(synUser()) })
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  const usersRow = () => ({ id: SYN.id, name: state.name, email: SYN.email, avatar_url: null, signup_source: opts.provider, joined_at: SYN.joined, onboarding_complete: true, last_active_at: CLOCK })
  const deletionRow = () => (state.pending ? [{ scheduled_for: '2026-06-28T20:00:00Z', requested_at: '2026-06-21T20:00:00Z' }] : [])

  await page.route('**/rest/v1/**', async (route) => {
    const req = route.request(); const method = req.method(); const url = new URL(req.url())
    const table = decodeURIComponent(url.pathname.split('/rest/v1/')[1] || '').split('?')[0]
    ledger.requests.push({ method, table, query: REDACT(url.search) })
    const send = (rows) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'content-range': `0-${Math.max(0, rows.length - 1)}/${rows.length}` }, body: (req.headers()['accept'] || '').includes('pgrst.object') ? JSON.stringify(rows[0] ?? null) : JSON.stringify(rows) })

    // RPCs
    if (table.startsWith('rpc/')) {
      const fn = table.slice(4)
      ledger.rpcs.push({ fn })
      if (opts.rpc === 'fail') return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'mock rpc error' }) })
      if (fn === 'request_account_deletion') { state.pending = true; return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scheduled_for: '2026-06-28T20:00:00Z', requested_at: '2026-06-21T20:00:00Z' }) }) }
      if (fn === 'cancel_account_deletion') { state.pending = false; return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }) }
      return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
    }

    if (method === 'GET' || method === 'HEAD') {
      ledger.reads.push({ table, query: REDACT(url.search) })
      if (table === 'users') return opts.loadError ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: '42P01', message: 'relation does not exist (mock)', details: 'raw technical detail' }) }) : send([usersRow()])
      if (table === 'user_settings') return send([{ settings: state.settings }])
      if (table === 'account_deletion_requests') return send(deletionRow())
      return send([])
    }

    // Writes
    const entry = { method, table, query: REDACT(url.search), seq: ledger.requests.length }
    if (table === 'user_settings') {
      ledger.writes.push(entry)
      if (opts.settingsWrite === 'hang') { await new Promise((r) => setTimeout(r, 60000)) }
      if (opts.settingsWrite === 'fail') return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'mock write error' }) })
      try { const b = req.postDataJSON(); const row = Array.isArray(b) ? b[0] : b; if (row?.settings) state.settings = row.settings } catch { /* ignore */ }
      return route.fulfill({ status: method === 'POST' ? 201 : 200, contentType: 'application/json', headers: { 'content-range': '*/*' }, body: '[]' })
    }
    if (table === 'users') {
      ledger.writes.push(entry)
      if (opts.usersWrite === 'hang') { await new Promise((r) => setTimeout(r, 60000)) }
      if (opts.usersWrite === 'fail') return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'mock users error' }) })
      try { const b = req.postDataJSON(); const row = Array.isArray(b) ? b[0] : b; if (row && typeof row.name === 'string') state.name = row.name } catch { /* ignore */ }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    }
    if (['user_ratings', 'user_history', 'user_preferences'].includes(table) && method === 'DELETE') {
      ledger.resetOps.push(entry)
      return opts.resetFailTable === table ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'mock reset error' }) }) : route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    }
    if (table === 'user_sessions') return route.fulfill({ status: method === 'POST' ? 201 : 200, contentType: 'application/json', headers: { 'content-range': '*/*' }, body: '[]' })
    ledger.unexpected.push({ method, table })
    return route.fulfill({ status: method === 'POST' ? 201 : 200, contentType: 'application/json', headers: { 'content-range': '*/*' }, body: '[]' })
  })

  return ledger
}
