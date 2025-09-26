// src/shared/lib/analytics.js
/**
 * Minimal analytics shim so builds never break.
 * Replace the internals with your real analytics later (PostHog, GA4, etc.).
 */

/**
 * Track an analytics event.
 * @param {string} event
 * @param {Record<string, any>=} props
 */
export function track(event, props = {}) {
  // Only log in dev; do nothing in production
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[analytics.track]', event, props)
  }
}

// Optional convenience methods if you add them later.
// Exporting them as no-ops keeps imports safe if you reference them.
export function identify(_userId, _traits) { /* no-op */ }
export function page(_name, _props) { /* no-op */ }

// Default export (handy if ever imported as default)
export default { track, identify, page }