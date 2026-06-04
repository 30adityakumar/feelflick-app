# F9G.4 — CSP Nonce Middleware: Production Verification

> **Phase F9G.4. Merge + verify — no code change.** Merged the F9G.3 CSP-nonce Pages
> Function (PR #177) and verified on production that the nonce'd report-only CSP is
> live and that **Cloudflare's JavaScript-Detections inline-script violation is
> gone**. CSP stays **report-only** (no enforcing CSP). No engine/schema/Edge/package
> change. F8C remains blocked.

**Status:** ✅ **The last CSP report-only violation is RESOLVED in production.**
Cloudflare now auto-nonces its injected JSD script; the `script-src-elem` report no
longer fires. **Date:** 2026-06-04.

---

## 1. Merge

- **PR #177** — *Resolve Cloudflare JSD CSP blocker via Pages Function nonce* —
  **merged (squash)** → `main` as **`8f68a235`**. `functions/_middleware.js` is now on `main`.
- Standard squash (repo convention).

## 2. Deployment

Push to `main` → all CI green and the Cloudflare Pages **production deploy succeeded**:
quality-gate, CodeQL, Lighthouse, E2E (skip-green), Cloudflare Pages, Vercel/GitGuardian.
The Pages Function (`functions/_middleware.js`) is now active on `app.feelflick.com`.

## 3. Production header verification (`curl -I https://app.feelflick.com`, repeated)

- ✅ `content-security-policy-report-only` present, with a **`nonce-…` in `script-src`**.
- ✅ **Nonce rotates per request** — observed `nonce-WTWwtbi2GLffg7LhGM+Kng==` then
  `nonce-FMYjfHGWu1ymiT//rdaytw==` on two consecutive requests.
- ✅ **Exactly one** CSP-RO header (no duplicate static + Function CSP).
- ✅ **No enforcing** `content-security-policy`.
- ✅ All five F9D headers intact: `x-frame-options: SAMEORIGIN`,
  `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`,
  `permissions-policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`,
  `strict-transport-security: max-age=31536000`.

## 4. Cloudflare JSD script is now nonced — violation gone

Loaded `app.feelflick.com` in a **fresh, isolated (cookie-free) browser context** so
JS Detections would inject:

- ✅ **JSD injected** (`__CF$cv$params` inline script present) — bot protection still active.
- ✅ **It now carries a `nonce`** (e.g. `nonce="jDE8vY805akFlP6RH4uBBA=="`). In F9G.1/F9G.2
  it had **no** nonce, which is exactly why it violated — Cloudflare now parses the CSP
  response header and applies the nonce to its injected script, as designed.
- ✅ **No `script-src-elem` inline-script CSP violation** in the console (it was present
  in F9G.1–F9G.3; now gone). The only console items are 3 benign **"Deprecated feature
  used"** notices (`report-uri` + `child-src` — to address at enforcement; non-breaking).
- ✅ **No CSP report POST** (`…/security/…`) and no `cspviolationreport` for the JSD script.
- ✅ App renders; JSD challenge ran (`/cdn-cgi/challenge-platform/…/jsd/oneshot/…` → 200);
  **Sentry error ingest works** (envelopes → 200); Cloudflare RUM → 204.

## 5. Sentry Security status

Issue [`FEELFLICK-APP-5`](https://feelflick.sentry.io/issues/FEELFLICK-APP-5) ("Blocked
'script' from 'inline:'", culprit `script-src-elem`): **2 events, first seen ~1h ago,
last seen ~1h ago** — both **pre-deploy** reproductions. The post-deploy fresh-session
test produced **no new event** → new JSD violations have **stopped**. The 2 events are
**stale pre-deploy**; no real production blocker remains. *(Housekeeping: the issue can
be Resolved in Sentry — the MCP here is read-only, so it wasn't resolved programmatically.)*

## 6. Remaining violations

**None** that block enforcement. The report-only CSP now reports **zero** violations on
production. Outstanding (non-violation) cleanups before enforcing: add a `report-to` /
`Reporting-Endpoints` header (the deprecated `report-uri` warning), and drop the
deprecated `child-src` (keep `worker-src` + `frame-src`).

## 7. Enforcement readiness

🟢 **Eligible after a short monitoring window.** The single blocker (the JSD inline
script) is resolved in production; the allowlist otherwise reports clean. Recommended
before flipping `Content-Security-Policy-Report-Only` → `Content-Security-Policy` (in
`functions/_middleware.js`):
1. Monitor Sentry → Security for a few days of real traffic; confirm no new violations.
2. Add `report-to`/`Reporting-Endpoints`; drop deprecated `child-src`.
3. Flip to enforcing in the Function; re-smoke `/`, `/about`, `/home`, `/movie/:id`.

## 8. Rollback

Revert PR #177 → removes `functions/_middleware.js` and restores the static report-only
CSP in `public/_headers` (the benign JSD violation would report again, app unaffected).
Cloudflare Pages can also instant-rollback to the prior deployment.

## 9. F8C gate — unchanged

**F8C (engine tuning) remains BLOCKED.** F9G.4 is CSP-hardening verification only. F8C
still needs a post-deploy outcome-capture baseline that is non-trivial and **stable
across real users** — capture is proven (F9C), real-user volume is not there yet.
