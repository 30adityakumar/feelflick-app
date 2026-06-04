# F9D — Production Observability + Security-Header Hardening

> **Phase F9D. Production hardening — NOT product or tuning work.** Makes FeelFlick
> production-observable and safer at the HTTP/security-header layer without changing
> product behavior. No scoring / ranking / threshold / `ENGINE_VERSION` / schema /
> RLS / migration / Edge Function / OpenAI / route / UI / package change.

**Status:** ✅ security headers shipped (config); Sentry 403 root-caused → **needs a
one-time Sentry dashboard change** (documented; not code/env). **F8C tuning remains
BLOCKED.** **Date:** 2026-06-04.

---

## 0. Serving-platform finding (important)

`app.feelflick.com` is served by **Cloudflare Pages**, not Vercel — confirmed by:
`public/_redirects` (a Cloudflare Pages convention), the production response
(`server: cloudflare`, `cf-cache-status: DYNAMIC`, `cf-ray`, Cloudflare `NEL`/`report-to`),
and **zero `x-vercel-*` headers**. The repo also has a Vercel deploy (used for PR
previews / the `Vercel` check), but the **live domain is Cloudflare Pages**.

Consequence: **Cloudflare Pages reads `public/_headers`** from the build output —
that file (not `vercel.json`) is what reaches production. F9D ships **both**:
`public/_headers` (effective on prod) + a mirrored `vercel.json` `headers` block
(for the Vercel preview/deploy path), so headers apply on whichever platform serves.

---

## 1. Sentry ingest 403 — diagnosis

**Symptom (F9C):** the only console error on every core route was a `403` from
`https://o4511197071736832.ingest.us.sentry.io/.../envelope/…`. Production error
monitoring was therefore **not ingesting events**.

**Diagnosis — it is an Origin/allowed-domains rejection, NOT a bad DSN/env:**

| Request to the exact ingest endpoint | Result |
|---|---|
| POST **without** an `Origin` header (server-to-server) | **200** — DSN, project, key are all VALID; ingest works |
| POST with `Origin: https://app.feelflick.com` | **403** |
| POST with `Origin: https://feelflick.com` | 403 |
| POST with `Origin: http://localhost:5173` | 403 |
| `OPTIONS` preflight from app.feelflick.com | 200 (`access-control-allow-origin: *`) |

A 200 server-to-server but 403 for **any** browser `Origin` (including the real
production domain) is the signature of Sentry's **Inbound Filters → "Allowed
Domains"**: the project has an allowlist set that does **not** include
`app.feelflick.com`, so Sentry rejects browser-originated events. (The 403 carries
no `x-sentry-error` body — consistent with a silent domain rejection.)

Ruled out: invalid/stale DSN (server-to-server 200 proves it's valid); ad-blocker
(that yields `ERR_BLOCKED`, not a server 403); CSP (none was set pre-F9D); rate limit
(that's 429, not 403). The SDK already **fails open** — a blocked POST never breaks
the app; only telemetry is lost.

**Code/env status:** `src/main.jsx` `Sentry.init` is correct —
`dsn: import.meta.env.VITE_SENTRY_DSN || '<the valid prod DSN>'`, `enabled: PROD`,
`replayIntegration({ maskAllText: true })`, tracing 0.2. The DSN is a **public**
client key (safe to ship; the hardcoded fallback is intentional per CLAUDE.md). **No
code or env-var change is required** — and changing the DSN would NOT fix a 403.

### Fix required (one-time, Sentry dashboard — server-side; cannot be done from this repo)

> The Sentry MCP token is expired in this environment, so this must be applied in
> the Sentry UI (or via the Sentry API with a valid token).

**Sentry → Settings → Projects → `feelflick` (project id `4511197073768448`, org
`o4511197071736832`) → Security & Privacy (Inbound Filters) → "Allowed Domains":**
- **Option A (recommended, explicit allowlist):** set it to
  `app.feelflick.com`, `feelflick.com`, `*.feelflick.com`, `localhost` (+ any
  Cloudflare/Vercel preview domains you want monitored).
- **Option B:** **clear** the Allowed Domains field (empty = accept all origins).

After the change, re-verify (browser console on app.feelflick.com should show **no**
Sentry 403; a forced test error should appear in Sentry Issues). Until then, **Sentry
cannot be confirmed ingesting** — F9D fixed everything in-repo; the remaining step is
this dashboard toggle.

*(Optional, larger, not done in F9D: a Sentry "tunnel" via a Cloudflare Pages
Function proxy would bypass both origin filters and ad-blockers — but that adds an
infra function and can't be verified without deploying, so the dashboard fix is the
smaller, correct root-cause change.)*

---

## 2. Security headers shipped

Added to **`public/_headers`** (Cloudflare Pages, effective on prod) and mirrored in
**`vercel.json`** (`headers` for `/(.*)`). Applied to all routes:

| Header | Value | Why |
|---|---|---|
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking — the app isn't framed cross-origin; OAuth is a redirect (not an iframe); trailers are *us* embedding YouTube (unaffected by XFO). |
| `X-Content-Type-Options` | `nosniff` | Stop MIME-sniffing. (Cloudflare already sent this; now explicit + portable.) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Don't leak full URLs/paths cross-origin. (Already present; now explicit.) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` | Disable powerful features the app never uses + opt out of the Topics API. **Leaves `fullscreen` allowed** so YouTube trailer fullscreen still works. |
| `Strict-Transport-Security` | `max-age=31536000` | Enforce HTTPS for 1 year. Conservative: **no `includeSubDomains`/`preload`** (can't verify every `feelflick.com` subdomain is HTTPS) — upgrade later once confirmed. On a Cloudflare-fronted domain, HSTS is also manageable in the Cloudflare dashboard. |

All five are **non-breaking** — they don't restrict any origin the app talks to.
Verified: `npm run build` copies `public/_headers` → `dist/_headers`; `vercel.json`
is valid JSON.

---

## 3. Content-Security-Policy — deliberately DEFERRED (with a draft)

**Decision: do not ship an enforcing CSP in F9D.** The app's architecture forces a
weak style-src and a careful script-src, so a blind CSP would break the app:
- **Inline styles everywhere** — feature surfaces + the v3 landing use inline
  `style={…}` pervasively, and `index.html` has an inline `<style>`. A CSP must
  include `style-src 'unsafe-inline'` or the entire UI breaks.
- **Scripts** — bundles are external (`/assets/*.js`), but the **Cloudflare Insights
  beacon** injects a script, **PostHog** loads `array.js` from its assets host, and
  **Sentry Replay** uses web-worker `blob:` — each needs explicit allowances.

**Plan:** ship the safe headers now (above); land CSP as a follow-up phase, **first
as `Content-Security-Policy-Report-Only`** (never blocks; surfaces violations),
tune against real traffic, then enforce. Draft starting policy (report-only):

```
default-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'self';
script-src 'self' https://static.cloudflareinsights.com https://us-assets.i.posthog.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https://image.tmdb.org https://*.tmdb.org https://i.ytimg.com https://lh3.googleusercontent.com;
connect-src 'self' https://*.supabase.co https://api.themoviedb.org https://*.ingest.us.sentry.io https://us.i.posthog.com https://us-assets.i.posthog.com https://cloudflareinsights.com https://static.cloudflareinsights.com;
frame-src https://www.youtube.com https://www.youtube-nocookie.com https://accounts.google.com;
worker-src 'self' blob:;
form-action 'self' https://*.supabase.co https://accounts.google.com;
```

> Source allowlist derived from the F9C production network capture (Supabase, TMDB
> img+api, Google Fonts, Sentry ingest, PostHog, Cloudflare Insights) + YouTube
> trailers + Google OAuth. Validate report-only before enforcing; expect to adjust
> `script-src`/`worker-src` for Sentry Replay + PostHog.

---

## 4. CI secrets / gates readiness

Two CI jobs are intentionally **skip-green** until repo secrets exist (they never
block PRs pre-setup). No secret values are printed here.

| Gate | Workflow | Becomes non-skip when these **GitHub repo secrets** are set | Effect |
|---|---|---|---|
| **E2E (Playwright)** | `app-quality.yml` (`e2e` job) | `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TMDB_API_KEY` | runs `npm run test:e2e` (public+app) on PRs |
| **Lighthouse CI** | `lighthouse.yml` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TMDB_API_KEY` | builds + runs Lighthouse perf/a11y budget |

**Where:** GitHub → repo → Settings → Secrets and variables → Actions → *New
repository secret*. Use the dev test user for `E2E_TEST_*` (the same client-side
sign-in the suite already uses). The `VITE_*` values are the production-safe public
client keys (anon key, read-only TMDB key) — RLS enforces access, so they are safe as
CI secrets. **Do not weaken the gates; just supply the inputs.** After adding them,
the `e2e` + `lighthouse` jobs run (not skip) on the next PR.

> Visual regression already runs in CI (it uses dummy env — no secrets needed).

---

## 5. Validation

| Gate | Result |
|---|---|
| `vercel.json` JSON validity | ✅ valid |
| `npm run lint` | ✅ clean |
| `npm run test` | ✅ 487 passed (44 files) |
| `npm run build` | ✅ (emits `dist/_headers`) |
| `npm audit --omit=dev --audit-level=high` | ✅ 0 vulnerabilities |
| e2e / visual | unaffected (config + docs only, no `src` change) — green on the identical tree in F9C |

**Header verification:** the new headers take effect only **after deploy**. They were
verified in the build output (`dist/_headers`) and as valid `vercel.json`; live
verification (`curl -I`) should be done on the PR's **Cloudflare Pages preview** and,
after merge, on `https://app.feelflick.com` (expect `x-frame-options`,
`permissions-policy`, `strict-transport-security` to appear).

---

## 6. Remaining hardening items (after F9D)

1. **Apply the Sentry Allowed-Domains fix** (§1) — the only step blocking real prod
   error monitoring; one dashboard toggle.
2. **Ship CSP report-only** (§3), tune, then enforce.
3. **Configure CI secrets** (§4) to make E2E + Lighthouse non-skip.
4. **HSTS upgrade** — add `includeSubDomains` (+ consider `preload`) once every
   `feelflick.com` subdomain is confirmed HTTPS; consider managing HSTS in the
   Cloudflare dashboard.
5. **Color-contrast a11y** — tracked editorial exception; separate pass.
6. **Dead paths** — `recommendation_events` + `RecommendationFeedback` (F8B doc §9).

## 7. F8C gate — unchanged

**F8C (engine tuning) remains BLOCKED.** F9D is observability/security only and does
not touch the engine. F8C still needs a post-deploy outcome-capture baseline that is
non-trivial and **stable across real users** (sliced by `placement`,
`algorithm_version`, cold/warm) — capture is proven (F9C) but real-user volume is not
there yet.

## 8. Non-scope (F9D)

No scoring/ranking/threshold/`ENGINE_VERSION`/schema/RLS/migration/Edge-Function/
OpenAI/route/IA/UI/package change. Sentry fix is a documented dashboard toggle (no
code/env change). `stash@{0}` (parked Eyebrow WIP) untouched.
