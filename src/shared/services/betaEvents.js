// src/shared/services/betaEvents.js
//
// B1.3 — the single source of truth for the private-beta event taxonomy and the ONE hardened
// path every beta event flows through. Builds on B1.2: events go through analytics.track (which
// honors opt-out + the absence of PostHog), and this wrapper additionally:
//   * rejects any event name not in EVENTS (the allow-list);
//   * drops any payload key not in ALLOWED_KEYS;
//   * drops PII-shaped / freeform / Error values (email, JWT, URL, long text, objects);
//   * strips null/undefined.
// Product code must call trackEvent(EVENTS.x, {...}) — never a raw string, never posthog directly.

import { track as analyticsTrack } from './analytics'

// ── Event allow-list (add here intentionally; the test fails on un-listed names) ──────────────
export const EVENTS = Object.freeze({
  // Onboarding
  onboarding_started: 'onboarding_started',
  onboarding_step_completed: 'onboarding_step_completed',
  onboarding_abandoned: 'onboarding_abandoned',
  onboarding_error: 'onboarding_error',
  onboarding_completed: 'onboarding_completed',
  // Discover
  discover_opened: 'discover_opened',
  recommendation_requested: 'recommendation_requested',
  recommendation_shown: 'recommendation_shown',
  recommendation_opened: 'recommendation_opened',
  recommendation_saved: 'recommendation_saved',
  recommendation_error: 'recommendation_error',
  // Home
  home_opened: 'home_opened',
  nightly_pick_shown: 'nightly_pick_shown',
  home_error: 'home_error',
  // Profile
  profile_opened_self: 'profile_opened_self',
  profile_reflection_refresh_started: 'profile_reflection_refresh_started',
  profile_reflection_refresh_succeeded: 'profile_reflection_refresh_succeeded',
  profile_reflection_refresh_failed: 'profile_reflection_refresh_failed',
  profile_forming_state_seen: 'profile_forming_state_seen',
  // People
  people_opened: 'people_opened',
  people_search_used: 'people_search_used',
  people_search_empty: 'people_search_empty',
  people_follow_succeeded: 'people_follow_succeeded',
  people_follow_failed: 'people_follow_failed',
  people_unfollow_succeeded: 'people_unfollow_succeeded',
  people_hide_suggestion: 'people_hide_suggestion',
  people_empty_state: 'people_empty_state',
  // System / reliability
  route_error: 'route_error',
  auth_error: 'auth_error',
  supabase_error: 'supabase_error',
  edge_function_error: 'edge_function_error',
})

const EVENT_NAMES = new Set(Object.values(EVENTS))

// ── Payload key allow-list (everything else is dropped). All non-PII, non-freeform. ───────────
export const ALLOWED_KEYS = new Set([
  'event_version', 'surface', 'source', 'step_key', 'reaction', 'placement',
  'result_count', 'result_kind', 'has_results', 'from_cache',
  'movie_id', // catalog id — safe + useful
  'genre_count_bucket', 'movie_count_bucket', 'rating_count_bucket', 'mood_count_bucket', 'count_bucket',
  'query_length_bucket', 'latency_bucket', 'retry_count_bucket', 'status_bucket',
  'error_kind',
])

// Reject obviously-PII / freeform / unsafe values. Numbers, booleans and short enum-ish strings
// pass; emails, JWTs, URLs, long text, objects, arrays and Errors are dropped.
export function isUnsafeValue(v) {
  if (v == null) return false
  const t = typeof v
  if (t === 'number' || t === 'boolean') return false
  if (t !== 'string') return true // objects / arrays / Error instances are never sent
  if (v.length > 64) return true // long freeform text
  if (/@/.test(v)) return true // email-ish
  if (/^ey[A-Za-z0-9_-]{6,}\./.test(v)) return true // JWT
  if (/https?:\/\//i.test(v)) return true // URL (may carry query params)
  return false
}

const isDev = () => { try { return !!import.meta.env?.DEV } catch { return false } }

/**
 * Emit a private-beta analytics event. Fail-closed: unknown event → dropped; disallowed/unsafe
 * payload keys → dropped. In dev it warns loudly so misuse is caught during development.
 */
export function trackEvent(name, payload = {}) {
  if (!EVENT_NAMES.has(name)) {
    if (isDev()) console.warn(`[betaEvents] dropped un-allow-listed event "${name}"`)
    return
  }
  const safe = {}
  for (const [k, v] of Object.entries(payload || {})) {
    if (!ALLOWED_KEYS.has(k)) { if (isDev()) console.warn(`[betaEvents] "${name}": dropped key "${k}"`); continue }
    if (v == null) continue
    if (isUnsafeValue(v)) { if (isDev()) console.warn(`[betaEvents] "${name}": dropped unsafe value for "${k}"`); continue }
    safe[k] = v
  }
  analyticsTrack(name, safe) // analytics.track respects opt-out + no-op when PostHog is absent
}

// ── Coarse, non-identifying bucket helpers ────────────────────────────────────────────────────
export const countBucket = (n) =>
  n == null ? undefined : n <= 0 ? '0' : n <= 2 ? '1-2' : n <= 5 ? '3-5' : n <= 10 ? '6-10' : '11+'

export const latencyBucket = (ms) =>
  ms == null ? undefined : ms < 200 ? '<200' : ms < 500 ? '200-500' : ms < 1000 ? '500-1000' : ms < 3000 ? '1-3s' : '3s+'

export const queryLengthBucket = (len) =>
  len == null ? undefined : len <= 0 ? '0' : len <= 2 ? '1-2' : len <= 5 ? '3-5' : len <= 10 ? '6-10' : '11+'

// Replace dynamic route segments (ids / uuids / slugs that could identify a user or their content)
// with a stable route-pattern label, so `page_viewed` never carries a real id in its path value.
// Order matters: the more specific /lists/curated|personal must run before the generic /lists/:id.
const PATH_RULES = [
  [/^\/profile\/[^/]+/, '/profile/:id'],
  [/^\/movie\/[^/]+/, '/movie/:id'],
  [/^\/collection\/[^/]+/, '/collection/:id'],
  [/^\/lists\/curated\/[^/]+/, '/lists/curated/:slug'],
  [/^\/lists\/personal\/[^/]+/, '/lists/personal/:type'],
  [/^\/lists\/[^/]+/, '/lists/:id'],
  [/^\/mood\/[^/]+/, '/mood/:tag'],
  [/^\/tone\/[^/]+/, '/tone/:tag'],
  [/^\/browse\/fit\/[^/]+/, '/browse/fit/:profile'],
]
export function redactPath(pathname) {
  if (typeof pathname !== 'string' || !pathname) return '/'
  const path = pathname.split('?')[0].split('#')[0] // drop any query/hash
  for (const [re, label] of PATH_RULES) if (re.test(path)) return label
  return path
}

/**
 * Map any error to a stable, non-identifying bucket. NEVER returns raw error text.
 */
export function errorKind(err) {
  const msg = String(err?.message || err?.code || err || '').toLowerCase()
  if (/jwt|not authenticated|auth\b|\b401\b|session/.test(msg)) return 'auth'
  if (/permission|denied|rls|\b403\b|42501/.test(msg)) return 'permission_denied'
  if (/timeout|timed out|aborted/.test(msg)) return 'timeout'
  if (/network|failed to fetch|offline|connection/.test(msg)) return 'network'
  if (/edge|functions\/v1|non-2xx/.test(msg)) return 'edge_error'
  if (/supabase|postgrest|pgrst/.test(msg)) return 'supabase_error'
  return 'unknown'
}
