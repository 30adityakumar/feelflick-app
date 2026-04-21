// src/shared/services/analytics.js
import posthog from 'posthog-js'

let _initialized = false

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
    loaded(ph) {
      if (import.meta.env.DEV) ph.debug()
    },
  })
  _initialized = true
}

/**
 * Associate the current session with an authenticated user.
 * @param {string} userId
 * @param {{ email?: string, name?: string }} [traits]
 */
export function identify(userId, traits = {}) {
  if (!_initialized) return
  posthog.identify(userId, traits)
}

/**
 * Send a named analytics event.
 * @param {string} event
 * @param {Record<string, unknown>} [properties]
 */
export function track(event, properties = {}) {
  if (!_initialized) return
  posthog.capture(event, properties)
}

/**
 * Reset identity on sign-out.
 */
export function resetAnalytics() {
  if (!_initialized) return
  posthog.reset()
}
