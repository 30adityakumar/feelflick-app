import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// B1.2 — fail-closed analytics privacy guard. Two layers:
//   (1) behavior: identify/track/opt-out with a mocked PostHog;
//   (2) source guards: scan ALL app source so a future change that re-introduces PII
//       (email/name in identify, raw query in an event, a new un-allow-listed event,
//       or un-masked replay) fails this test on purpose.

// ── Mocked PostHog + Supabase for the behavior layer ──────────────────────────────
// vi.hoisted so the (hoisted) vi.mock factory can reference the spy object safely.
const ph = vi.hoisted(() => ({
  init: vi.fn(), identify: vi.fn(), capture: vi.fn(),
  opt_in_capturing: vi.fn(), opt_out_capturing: vi.fn(), reset: vi.fn(), debug: vi.fn(),
}))
vi.mock('posthog-js', () => ({ default: ph }))
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({
      maybeSingle: async () => ({ data: { settings: { privacy: { analytics: true } } } }),
    }) }) }),
  },
}))

import { initAnalytics, identify, track, setAnalyticsOptOut } from '../analytics.js'

describe('analytics privacy — identify / track / opt-out behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test')
    initAnalytics()
    setAnalyticsOptOut(false)
  })
  afterEach(() => vi.unstubAllEnvs())

  it('identify sends ONLY the stable user id — no email/name/traits to PostHog', async () => {
    await identify('user-uuid-123')
    expect(ph.identify).toHaveBeenCalledTimes(1)
    const [id, traits] = ph.identify.mock.calls[0]
    expect(id).toBe('user-uuid-123')
    const t = traits || {}
    for (const k of ['email', 'name', 'display_name', 'username', 'avatar', 'avatar_url']) {
      expect(t).not.toHaveProperty(k)
    }
  })

  it('track is suppressed entirely when the user has opted out', () => {
    setAnalyticsOptOut(true)
    track('page_viewed', { path: '/home' })
    expect(ph.capture).not.toHaveBeenCalled()
  })

  it('track fires when opted in', () => {
    track('page_viewed', { path: '/home' })
    expect(ph.capture).toHaveBeenCalledWith('page_viewed', { path: '/home' })
  })

  it('opt-out stops PostHog capture + replay (opt_out_capturing)', () => {
    setAnalyticsOptOut(true)
    expect(ph.opt_out_capturing).toHaveBeenCalled()
  })
})

// ── Source guards (fail-closed) ───────────────────────────────────────────────────
describe('analytics privacy — source guards', () => {
  const ALLOWED_EVENTS = new Set([
    'page_viewed', 'search_performed', 'signup', 'onboarding_completed',
    'card_clicked', 'card_watchlisted', 'row_scrolled',
  ])
  const DISALLOWED_KEYS = new Set([
    'email', 'name', 'display_name', 'username', 'full_name', 'avatar', 'avatar_url',
    'phone', 'address', 'review', 'review_text', 'diary', 'diary_text', 'note', 'notes',
    'query', 'search', 'prompt', 'text', 'body', 'content',
    'token', 'secret', 'jwt', 'access_token', 'refresh_token',
  ])

  const all = import.meta.glob('/src/**/*.{js,jsx}', { query: '?raw', import: 'default', eager: true })
  const appFiles = Object.entries(all).filter(([p]) => !p.includes('__tests__') && !p.includes('.test.'))

  const trackCalls = (src) => {
    const out = []
    const re = /\btrack\(\s*['"]([\w-]+)['"]\s*(?:,\s*(\{[^}]*\}))?\s*\)/g
    let m
    while ((m = re.exec(src))) out.push({ event: m[1], payload: m[2] || '' })
    return out
  }

  it('every emitted analytics event is in the allow-list (new events must opt in)', () => {
    const seen = new Set()
    for (const [, src] of appFiles) for (const c of trackCalls(src)) seen.add(c.event)
    expect(seen.size).toBeGreaterThan(0)
    for (const e of seen) expect(ALLOWED_EVENTS.has(e), `un-allow-listed analytics event "${e}"`).toBe(true)
  })

  it('no analytics payload contains a disallowed PII/freeform key (incl. raw query)', () => {
    for (const [path, src] of appFiles) {
      for (const c of trackCalls(src)) {
        const keys = [...c.payload.matchAll(/(\w+)\s*:/g)].map((x) => x[1])
        for (const k of keys) {
          expect(DISALLOWED_KEYS.has(k), `${path}: event "${c.event}" sends disallowed key "${k}"`).toBe(false)
        }
      }
    }
  })

  it('AppShell identify() passes no email/name', async () => {
    const src = await import('@/app/AppShell.jsx?raw').then((m) => m.default)
    const m = src.match(/[^.]identify\(([^)]*)\)/)   // the call, not the import
    expect(m).toBeTruthy()
    expect(m[1]).not.toMatch(/email|name/)
  })

  it('analytics.js identify forwards only the id to PostHog', async () => {
    const src = await import('../analytics.js?raw').then((m) => m.default)
    expect(src).toMatch(/posthog\.identify\(\s*userId\s*\)/)
    expect(src).not.toMatch(/posthog\.identify\([^)]*(email|name|traits)/)
  })

  it('PostHog session replay masks ALL text and inputs', async () => {
    const src = await import('../analytics.js?raw').then((m) => m.default)
    expect(src).toMatch(/maskTextSelector:\s*['"]\*['"]/)
    expect(src).toMatch(/maskAllInputs:\s*true/)
  })

  it('Account analytics copy is honest (no false "no PII" / "Aggregated" claim)', async () => {
    const src = await import('@/features/account/panes/PrivacyPane.jsx?raw').then((m) => m.default)
    const m = src.match(/ANALYTICS_DESC = ['"]([^'"]+)['"]/)
    expect(m).toBeTruthy()
    expect(m[1]).not.toMatch(/no PII/i)
    expect(m[1]).not.toMatch(/aggregated/i)
    expect(m[1]).toMatch(/email/i)            // states what is NOT sent
  })

  it('Privacy page discloses analytics accurately, without claiming PostHog deletion', async () => {
    const src = await import('@/features/legal/Privacy.jsx?raw').then((m) => m.default)
    expect(src).toMatch(/PostHog/)
    expect(src).toMatch(/Sentry/)
    expect(src).toMatch(/masked/i)
    expect(src).toMatch(/turn product analytics off/i)
    expect(src).not.toMatch(/deleted from PostHog|PostHog data is deleted/i)
  })
})
