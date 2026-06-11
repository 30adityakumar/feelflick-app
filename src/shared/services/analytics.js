// src/shared/services/analytics.js
import posthog from 'posthog-js'
import { supabase } from '@/shared/lib/supabase/client'

let _initialized = false
// Mirror of user_settings.privacy.analytics, fetched lazily on identify().
// Defaults to true (opted-in) when never set — matches SETTINGS.privacy default.
let _optedOut = false

/**
 * Initialise PostHog. Call once before React mounts.
 * No-ops silently when VITE_POSTHOG_KEY is absent (e.g. local dev without the key).
 */
export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY
  if (!key) return
  posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    capture_pageview: false,
    autocapture: false,
    // UX insight: heatmaps (clicks, rage-clicks, scroll depth) without enabling
    // full autocapture.
    enable_heatmaps: true,
    // Session replay. Honors the same consent as events — opt_out_capturing()
    // below also stops recording. B1.2 privacy hardening: mask ALL form inputs AND
    // ALL rendered text (maskTextSelector: '*'), matching Sentry's maskAllText=true,
    // so private surfaces (Diary, reviews/"Your Take", Cinematic DNA reflection,
    // People names/search) can never be captured in a replay. Global, not per-element,
    // so new private surfaces are masked by default.
    // NOTE: also enable Session Replay in the PostHog project settings.
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '*',
    },
    loaded(ph) {
      if (import.meta.env.DEV) ph.debug()
    },
  })
  _initialized = true
}

/**
 * Associate the current session with an authenticated user.
 * Also reads their `user_settings.privacy.analytics` flag and honors opt-out.
 *
 * B1.2 privacy hardening: identify by the stable user id ONLY. We never send email,
 * name, display name, username, avatar, or any freeform/profile trait to PostHog —
 * the id is sufficient to stitch a session and is not directly identifying on its own.
 * @param {string} userId
 */
export async function identify(userId) {
  if (!_initialized || !userId) return
  posthog.identify(userId)
  // Best-effort opt-out check; failure leaves us opted-in (the safe default
  // for product analytics — explicit opt-out should be persisted by the time
  // we identify).
  try {
    const { data } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .maybeSingle()
    const analyticsEnabled = data?.settings?.privacy?.analytics
    // Treat missing as opted-in (true). Only explicit `false` opts out.
    if (analyticsEnabled === false) {
      _optedOut = true
      posthog.opt_out_capturing()
    } else {
      _optedOut = false
      posthog.opt_in_capturing()
    }
  } catch {
    /* leave default opt-in state */
  }
}

/**
 * Send a named analytics event. No-op when the user has opted out.
 * @param {string} event
 * @param {Record<string, unknown>} [properties]
 */
export function track(event, properties = {}) {
  if (!_initialized || _optedOut) return
  posthog.capture(event, properties)
}

/**
 * Reset identity on sign-out. Also clears opt-out state so the next signed-in
 * session re-derives from its own user_settings.
 */
export function resetAnalytics() {
  if (!_initialized) return
  posthog.reset()
  _optedOut = false
}

/**
 * Immediate opt-out from the UI side (e.g. when the user toggles the
 * Privacy → Product analytics switch off without re-identifying). Keeps the
 * mirror in sync with user_settings without needing a reload.
 */
export function setAnalyticsOptOut(optOut) {
  if (!_initialized) return
  _optedOut = !!optOut
  if (optOut) posthog.opt_out_capturing()
  else posthog.opt_in_capturing()
}
