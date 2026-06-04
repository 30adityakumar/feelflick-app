# F9G.3 — Cloudflare JSD CSP Resolution: per-request nonce (Pages Function)

> **Phase F9G.3. Option B chosen + implemented.** Resolves the one CSP report-only
> violation (Cloudflare JavaScript Detections inline script) by emitting a
> **per-request CSP nonce** from a Cloudflare Pages Function, so Cloudflare
> auto-nonces its injected script — **without** `script-src 'unsafe-inline'`. Still
> **report-only** (never blocks). No enforcing CSP, no engine/schema/Edge/package
> change. F8C remains blocked.

**Status:** ✅ implemented + verified on the Cloudflare Pages preview; ⏳ the JSD-nonce
effect confirms only on production (the preview bypasses zone-level JS Detections).
**Date:** 2026-06-04.

---

## 1. Decision: Option B (nonce via Pages Function)

F9G.2 found the violation is **Cloudflare JavaScript Detections** (Bot Management),
which injects a per-request inline script. The options were **A.** disable JS
Detections (a Cloudflare dashboard toggle) or **B.** a per-request CSP nonce.

- **Option A is unavailable from this repo** — there is no Cloudflare zone-settings
  access (the Cloudflare MCP is Developer-Platform only; no API token), and on Bot
  Fight Mode (free) JSD can't be disabled at all.
- **Option B chosen** (per the user). It keeps JS Detections (bot protection) *and*
  keeps `script-src` strict. It's Cloudflare's own recommended approach: *"If your CSP
  uses a `nonce` for script tags, Cloudflare will add these nonces to the scripts it
  injects by parsing your CSP response header."*

A static `public/_headers` file can't produce per-request nonces, so this requires a
**Cloudflare Pages Function** (the repo's first).

## 2. What was implemented

| File | Change |
|---|---|
| **NEW `functions/_middleware.js`** | Root Pages-Function middleware. On **HTML responses only**, generates a fresh base64 crypto nonce and sets `Content-Security-Policy-Report-Only` with `script-src 'self' 'nonce-…' …` (same allowlist as before; otherwise strict). Static assets pass straight through (caching untouched). **Fail-open** — any error returns the original response, so it can never break the site. No dependencies; the nonce is a public per-request token, not a secret. |
| `public/_headers` | **Removed** the static CSP report-only line (the Function now owns the CSP → exactly one source + a per-request nonce). **Kept** the five enforced F9D headers (they apply to every response). |
| `vercel.json` | **Unchanged** — keeps the static report-only CSP for the non-Cloudflare (Vercel) preview path, which has no JS Detections, so no nonce is needed there. |

**Why the nonce doesn't break our own scripts:** with a nonce in `script-src`,
host/`'self'` sources still gate **external** scripts (our `/assets/*.js` bundles +
`cloudflareinsights`), while **inline** scripts require the nonce. Our app has no
inline-executable scripts; Cloudflare's injected JSD inline script gets the nonce from
Cloudflare. (No `'strict-dynamic'`, so `'self'`/host allowlisting stays in effect.)

## 3. Verification — Cloudflare Pages preview

`curl` on the `*.pages.dev` branch preview + browser:

- ✅ `Content-Security-Policy-Report-Only` present with a **`nonce-…` in `script-src`**.
- ✅ **Per-request nonce** — two requests returned different nonces
  (`PkxfiYDDz4qV97omnnXk+A==` vs `g1hI0Yklv/ajw2NLEsvIdw==`).
- ✅ **Exactly one** CSP-RO header (no duplicate); **zero** enforcing CSP.
- ✅ **All five F9D headers present** on the HTML response → `public/_headers` still
  applies through the Function (no regression, no duplicate F9D headers).
- ✅ **SPA renders** — React mounts, our external bundles execute, Google Fonts + TMDB
  posters load. So the strict `script-src` + nonce does not block anything.
- ✅ **Zero CSP violations** on the preview (no `cspviolationreport`, no `[Report Only]`
  console messages). The only console error is the expected preview-origin Sentry 403
  (`*.pages.dev` isn't in Sentry's Allowed Domains — production `app.feelflick.com` is).

## 4. Production-only verification (after merge + deploy)

The **preview has no JS Detections** (zone-level features only run on the proxied
`app.feelflick.com`), so the JSD-nonce effect can only be confirmed on production:

1. Merge this PR → Cloudflare Pages production deploy.
2. `curl -I https://app.feelflick.com` → confirm one `content-security-policy-report-only`
   with a `nonce-…`, the five F9D headers, no enforcing CSP.
3. Open `app.feelflick.com` in a fresh browser session (so JSD injects) → DevTools
   console should show **no** `script-src-elem` inline-script violation; Cloudflare's
   `__CF$cv$params` inline script should now carry the matching nonce.
4. Confirm Sentry → Security stops receiving new `FEELFLICK-APP-5`-type inline-script
   reports.
5. App still renders; fonts/TMDB/Supabase/Sentry all work.

## 5. Notes & tradeoffs

- **Caching:** HTML responses are now dynamic (Function-generated, not edge-cached) so
  the nonce is unique per request; static assets are untouched and stay cached.
- **SPA routing** is preserved — the middleware wraps `context.next()`, which still
  honours `public/_redirects`.
- The `report-uri` still points at the Sentry CSP security endpoint (works; F9G.1).

## 6. Rollback

- Revert this PR (deletes `functions/_middleware.js`, restores the static CSP-RO in
  `public/_headers`) → back to the F9G.2 state (report-only CSP via `_headers`, the
  benign JSD violation reported again). Cloudflare Pages can also instant-rollback to
  the prior deployment.

## 7. Enforcement readiness

🟡 Closer, still deferred. After the §4 production check confirms the JSD violation is
gone, the remaining steps before flipping to enforcing CSP are: add a `report-to` /
`Reporting-Endpoints` header (modern Reporting API), drop the deprecated `child-src`
(keep `worker-src` + `frame-src`), monitor Sentry → Security a few more days, then
change `Content-Security-Policy-Report-Only` → `Content-Security-Policy` in the
Function and re-smoke.

## 8. F8C gate — unchanged

**F8C (engine tuning) remains BLOCKED.** F9G.3 is CSP hardening only. F8C still needs a
post-deploy outcome-capture baseline that is non-trivial and **stable across real
users** — capture is proven (F9C), real-user volume is not there yet.
