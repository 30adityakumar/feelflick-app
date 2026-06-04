// Cloudflare Pages Function — root middleware (runs on every request).
//
// F9G.3: emit a PER-REQUEST CSP nonce so that Cloudflare's JavaScript Detections
// (Bot Management) injected inline `__CF$cv$params` script is auto-nonced. Per
// Cloudflare's docs, when the CSP response header carries a `nonce-…`, Cloudflare
// parses it and applies the same nonce to the scripts it injects — which clears the
// only remaining CSP report-only violation (see docs/cloudflare-rum-csp-cleanup-f9g2.md)
// WITHOUT adding `script-src 'unsafe-inline'`.
//
// A static `public/_headers` file cannot generate per-request nonces, hence this
// Function. It is still REPORT-ONLY (never blocks). The five ENFORCED security
// headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
// Permissions-Policy, Strict-Transport-Security) stay in `public/_headers`.
//
// Scope: only HTML documents get the nonced CSP (where scripts execute and where
// Cloudflare injects JSD). Static assets pass straight through so their edge caching
// is unaffected. Fail-open: any error returns the original response untouched, so this
// can never break the site. No dependencies; the nonce is a public per-request token,
// not a secret.

const REPORT_URI =
  'https://o4511197071736832.ingest.us.sentry.io/api/4511197073768448/security/?sentry_key=769b544f824e0c2cf23509c830c8b9b5&sentry_environment=production'

/**
 * Build the report-only CSP. Identical allowlist to the prior static policy, plus a
 * per-request `nonce-…` in script-src (script-src otherwise stays strict — host/self
 * sources still gate external scripts; only inline scripts require the nonce).
 * @param {string} nonce
 * @returns {string}
 */
function buildCspReportOnly(nonce) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    `script-src 'self' 'nonce-${nonce}' https://static.cloudflareinsights.com https://us-assets.i.posthog.com https://us.i.posthog.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://image.tmdb.org https://*.tmdb.org https://i.ytimg.com https://lh3.googleusercontent.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://api.themoviedb.org https://*.ingest.us.sentry.io https://*.ingest.sentry.io https://us.i.posthog.com https://us-assets.i.posthog.com https://*.posthog.com https://cloudflareinsights.com https://static.cloudflareinsights.com",
    'frame-src \'self\' https://www.youtube.com https://www.youtube-nocookie.com https://accounts.google.com https://challenges.cloudflare.com',
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "media-src 'self' https://image.tmdb.org",
    "manifest-src 'self'",
    "form-action 'self' https://*.supabase.co https://accounts.google.com",
    `report-uri ${REPORT_URI}`,
  ].join('; ')
}

/** Generate a base64, cryptographically-random per-request nonce. */
function makeNonce() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

export async function onRequest(context) {
  const response = await context.next()
  try {
    const contentType = response.headers.get('content-type') || ''
    // Only HTML navigations: that is where scripts execute and where Cloudflare
    // injects its JS-Detections inline script. Static assets keep their cached
    // headers from public/_headers untouched.
    if (!contentType.includes('text/html')) return response

    const nonce = makeNonce()
    // Clone so headers are mutable; preserves status + body stream.
    const res = new Response(response.body, response)
    res.headers.set('Content-Security-Policy-Report-Only', buildCspReportOnly(nonce))
    return res
  } catch {
    // Never let observability tooling break the page.
    return response
  }
}
