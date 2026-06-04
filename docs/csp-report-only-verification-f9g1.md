# F9G.1 — CSP Report-Only Production Verification

> **Phase F9G.1. Merge + verify — no code change.** Merged the F9G report-only CSP
> (PR #174), confirmed the header is live on production, and verified it's
> non-breaking. **No enforcing CSP.** No engine/schema/Edge/package change. F8C blocked.

**Status:** ✅ **CSP report-only is LIVE and non-breaking on `app.feelflick.com`.**
The monitoring pipeline works (console + Sentry Security). **One** violation found —
the Cloudflare-injected inline RUM beacon — to handle before enforcement.
**Date:** 2026-06-04.

---

## 1. Merge

- **PR #174** — *Add CSP report-only policy for FeelFlick production hardening* —
  **merged (squash)** → `main` as **`86a0ebab`**.
- Standard squash (repo convention). Post-merge CI green: Cloudflare Pages
  **production deploy success**, quality-gate, Lighthouse, CodeQL, E2E (skip-green),
  Vercel/GitGuardian.

## 2. Production header verification (`curl -I https://app.feelflick.com`)

- ✅ `content-security-policy-report-only` is **present** (the full F9G policy).
- ✅ Enforcing `content-security-policy` is **NOT present** (report-only only).
- ✅ All F9D headers intact: `x-frame-options: SAMEORIGIN`,
  `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`,
  `permissions-policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`,
  `strict-transport-security: max-age=31536000`.

## 3. Production smoke (browser)

`/` (logged-out landing) loaded fresh on `app.feelflick.com`:
- ✅ App renders fully (hero, all sections, "Start free"); **inline styles apply**
  (so `style-src 'unsafe-inline'` is doing its job — the UI is not unstyled).
- ✅ Google Fonts load; ✅ **TMDB posters load**; ✅ JS/CSS bundles load; ✅ Supabase
  reachable; ✅ **Sentry ingest 200** (regular envelopes); ✅ Cloudflare RUM/challenge OK.
- The F9G preview smoke already exercised the **authenticated `/home`** path (Supabase
  connect-src + engine traffic) with **zero** violations; production behaves the same
  for those calls (all hosts allowlisted).

> Note: report-only **cannot break the app** — these checks confirm the policy's
> allowlist matches real traffic, not that anything was blocked.

## 4. CSP violations observed — exactly ONE (classified)

| Violation | Directive | Source | Class | Landed in Sentry |
|---|---|---|---|---|
| `Blocked 'script' from 'inline:'` | `script-src-elem` | **Cloudflare's auto-injected RUM/Insights beacon loader** (`(function(){…window.__CF$cv…})`) — injected by the Cloudflare zone on the proxied prod domain; **not** present on the `*.pages.dev` preview | **Cloudflare-injected, expected; harmless under report-only; a real enforcement consideration** | ✅ Issue [`FEELFLICK-APP-5`](https://feelflick.sentry.io/issues/FEELFLICK-APP-5) "Blocked 'script' from 'inline:'", culprit `script-src-elem` |

Everything else (styles, fonts, TMDB images, Supabase, TMDB API, Sentry, Cloudflare
Insights, bundles) is **within the policy → no violations**. The inline `<script
type="application/ld+json">` in `index.html` is data (not executed) and is correctly
**not** flagged.

**Why prod differs from the F9G preview:** the preview (`*.pages.dev`) is served
directly by Cloudflare Pages and bypasses the zone-level features (RUM
auto-injection / Rocket Loader) that run on the proxied production domain — so the
inline beacon (and thus the violation) only appears in production. This is precisely
why report-only on **production** matters.

### Reporting pipeline — verified working
- **Sentry `report-uri`:** the browser POSTed the CSP report to the Sentry security
  endpoint (`…/security/…`) → **HTTP 200**, and it appears in **Sentry → Security**
  (issue `FEELFLICK-APP-5`). 
- **Browser console:** logged the violation with the directive + the script hash
  (`sha256-txqY/EpheUqe3qIYo7enr5TV/6skYO51yNRhW55NyFE=`).
- Chrome logged 3 **"Deprecated feature used"** notices (non-breaking) — `report-uri`
  is deprecated in favour of the Reporting API (`report-to`/`Reporting-Endpoints`),
  and `child-src` is deprecated (superseded by `worker-src` + `frame-src`, both
  already present). Address in the enforcement phase; they do not affect report-only.

## 5. Enforcement-readiness decision

**Not yet — one item to resolve first.** The allowlist matches real traffic; the only
blocker is the **Cloudflare-injected inline RUM beacon** under strict `script-src`.
Before flipping to enforce, pick one:
1. **(Preferred)** Disable Cloudflare's automatic RUM/Insights injection + Rocket
   Loader for the zone (Cloudflare dash → Speed/Web Analytics) and load the beacon
   as an external script (or via the SDK) → keeps `script-src` strict.
2. Add the script **hash** `'sha256-txqY/EpheUqe3qIYo7enr5TV/6skYO51yNRhW55NyFE='` to
   `script-src` (fragile — changes if Cloudflare updates the beacon).
3. Add `'unsafe-inline'` to `script-src` (weakens XSS protection — not recommended).

## 6. Remaining steps before enforcing CSP

1. Resolve the Cloudflare inline-beacon violation (§5).
2. Monitor **Sentry → Security** for a few days of real traffic; confirm no other
   violation types appear (the only one today is the beacon).
3. Add a modern `report-to` / `Reporting-Endpoints` header alongside `report-uri`;
   drop the deprecated `child-src` (keep `worker-src` + `frame-src`).
4. Flip `Content-Security-Policy-Report-Only` → `Content-Security-Policy` in
   `public/_headers` (+ `vercel.json`); re-smoke; rollback by reverting if needed.

## 7. Validation

✅ `npm run lint` clean · ✅ `npm run test` 487 passed (44 files) · ✅ `npm run build` ·
✅ `npm audit --omit=dev --audit-level=high` 0 vulnerabilities.

## 8. F8C gate — unchanged

**F8C (engine tuning) remains BLOCKED.** F9G.1 is HTTP-layer hardening verification
only. F8C still needs a post-deploy outcome-capture baseline that is non-trivial and
**stable across real users** — capture is proven (F9C), real-user volume is not there yet.
