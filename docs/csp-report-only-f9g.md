# F9G — Content-Security-Policy (Report-Only)

> **Phase F9G. Report-only security hardening — NOT enforcement.** Ships a
> `Content-Security-Policy-Report-Only` header so we can collect violation reports
> and confirm what would break **before** enforcing CSP. It **never blocks**
> anything. No enforcing `Content-Security-Policy`, no product/engine/schema/Edge/
> package change. F8C remains blocked.

**Status:** ✅ report-only CSP shipped in `public/_headers` (Cloudflare Pages — prod)
+ mirrored in `vercel.json`; reports go to Sentry. **Date:** 2026-06-04.

---

## 1. Why report-only (enforcement deferred)

A blind enforced CSP would break the app:
- **Inline styles everywhere** — feature surfaces + the v3 landing use inline
  `style={…}` pervasively, and `index.html` ships an inline `<style>`. CSP must
  allow `style-src 'unsafe-inline'` or the entire UI breaks. (This can only be
  removed by refactoring every inline style to classes/nonces — out of scope here.)
- **Third-party sources** must be allowlisted exactly (Supabase, TMDB, Google Fonts,
  Sentry, Cloudflare Insights/RUM, YouTube trailers, Google OAuth) or real features
  break.

Report-only lets the browser **report** what the policy *would* block without
blocking it — so we tune the allowlist against real traffic, then flip to enforce in
a later phase.

## 2. Source inventory (from the F9C/F9F production network captures)

| Directive | Sources | Why |
|---|---|---|
| `default-src` | `'self'` | safe default; every fetch falls back here |
| `script-src` | `'self'` · `static.cloudflareinsights.com` · `us-assets.i.posthog.com` · `us.i.posthog.com` | app bundles (`/assets/*.js`) are `'self'`; Cloudflare RUM beacon; PostHog (defensive — not active in prod today). **No `'unsafe-inline'`** — the built `index.html` has no inline-executable script (only `type="module" src=…` + a `application/ld+json` data block, which CSP ignores). |
| `style-src` | `'self'` · `'unsafe-inline'` · `fonts.googleapis.com` | **`'unsafe-inline'` required** (inline `style=` + inline `<style>`); Google Fonts CSS. |
| `img-src` | `'self'` · `data:` · `blob:` · `image.tmdb.org` · `*.tmdb.org` · `i.ytimg.com` · `lh3.googleusercontent.com` | TMDB posters/backdrops; YouTube thumbnails; Google avatars; data/blob for inline + generated images. |
| `font-src` | `'self'` · `fonts.gstatic.com` | Inter + Outfit woff2. |
| `connect-src` | `'self'` · `*.supabase.co` · `api.themoviedb.org` · `*.ingest.us.sentry.io` · `*.ingest.sentry.io` · `us.i.posthog.com` · `us-assets.i.posthog.com` · `*.posthog.com` · `cloudflareinsights.com` · `static.cloudflareinsights.com` | Supabase REST/Auth/Realtime; TMDB API; Sentry ingest; PostHog (defensive); Cloudflare RUM. |
| `frame-src` | `'self'` · `www.youtube.com` · `www.youtube-nocookie.com` · `accounts.google.com` · `challenges.cloudflare.com` | YouTube trailer embeds; Google OAuth; Cloudflare bot-challenge iframe. |
| `worker-src` / `child-src` | `'self'` · `blob:` | Sentry Session Replay uses a `blob:` web worker. |
| `media-src` | `'self'` · `image.tmdb.org` | safety for any media. |
| `manifest-src` | `'self'` | `site.webmanifest`. |
| `form-action` | `'self'` · `*.supabase.co` · `accounts.google.com` | OAuth form/redirect targets (defensive). |
| `frame-ancestors` | `'self'` | clickjacking (CSP equivalent of the enforced `X-Frame-Options: SAMEORIGIN`). |
| `base-uri` | `'self'` | block `<base>` hijack. |
| `object-src` | `'none'` | no plugins. |

## 3. The exact policy shipped

`Content-Security-Policy-Report-Only` (one line, on `/*` in `public/_headers`, mirrored in `vercel.json`):

```
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self';
script-src 'self' https://static.cloudflareinsights.com https://us-assets.i.posthog.com https://us.i.posthog.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: blob: https://image.tmdb.org https://*.tmdb.org https://i.ytimg.com https://lh3.googleusercontent.com;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https://*.supabase.co https://api.themoviedb.org https://*.ingest.us.sentry.io https://*.ingest.sentry.io https://us.i.posthog.com https://us-assets.i.posthog.com https://*.posthog.com https://cloudflareinsights.com https://static.cloudflareinsights.com;
frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://accounts.google.com https://challenges.cloudflare.com;
worker-src 'self' blob:; child-src 'self' blob:; media-src 'self' https://image.tmdb.org; manifest-src 'self';
form-action 'self' https://*.supabase.co https://accounts.google.com;
report-uri https://o4511197071736832.ingest.us.sentry.io/api/4511197073768448/security/?sentry_key=…&sentry_environment=production
```

## 4. Reporting endpoint

`report-uri` → the **Sentry CSP security endpoint** for project `feelflick-app`
(`…/api/4511197073768448/security/?sentry_key=…`). It's a **real, working endpoint**
— verified: a sample CSP report POST with `Origin: app.feelflick.com` returns **HTTP
200** (now that the Allowed-Domains fix from F9F is in place). Violations appear in
**Sentry → Security**. (`report-uri` is used for Sentry compatibility; the modern
`report-to`/Reporting-API can be added later. The `sentry_key` is the public DSN key
— safe to ship, already in the client bundle.)

**Secondary monitoring:** browser DevTools console logs every report-only violation
(`[Report Only] Refused to …`).

## 5. Known expected violations / noise

Because the policy is intentionally complete, violations should be **rare**. Watch for:
- **Cloudflare bot-challenge inline scripts** — under a managed challenge Cloudflare
  may inject an inline `<script>`; `script-src` has no `'unsafe-inline'`, so that
  would report. Expected/acceptable; handle before enforcing (nonce or accept).
- **PostHog** — currently inactive in prod (no `VITE_POSTHOG_KEY`); allowlisted
  defensively, so enabling it later won't newly violate.
- New third-party hosts added in future code → will report (that's the point).

## 6. What must be cleaned before ENFORCING (future phase)

1. Run report-only on prod for a few days; review Sentry → Security; confirm the only
   reports are known/acceptable.
2. Decide on inline styles: keep `style-src 'unsafe-inline'` (pragmatic) or refactor
   to nonces/classes (large change).
3. Resolve any `script-src` inline-script reports (Cloudflare challenge etc.) with a
   nonce/hash or an explicit allowance.
4. Add a `report-to`/`Reporting-Endpoints` header (modern Reporting API) alongside
   `report-uri`.
5. Flip the header name `Content-Security-Policy-Report-Only` → `Content-Security-Policy`.

## 7. Rollback

Report-only **cannot break the app**, so rollback is rarely needed. If a report-only
CSP must be removed: delete the `Content-Security-Policy-Report-Only` line from
`public/_headers` (and the entry in `vercel.json`), commit, redeploy. (Cloudflare
Pages also lets you instant-rollback to the previous deployment.)

## 8. Validation

✅ `vercel.json` valid JSON · ✅ `npm run lint` clean · ✅ `npm run test` 487 passed
(44 files) · ✅ `npm run build` (emits `dist/_headers` with the CSP) · ✅ `npm audit
--omit=dev --audit-level=high` 0 vulnerabilities. Sentry security endpoint probe →
**200**. Live header + console verification on the CF Pages preview / prod after deploy
(report-only → app must render unchanged; only the header is added).

## 9. F8C gate — unchanged

**F8C (engine tuning) remains BLOCKED.** F9G is HTTP-layer hardening only. F8C still
needs a post-deploy outcome-capture baseline that is non-trivial and **stable across
real users** — capture is proven (F9C), real-user volume is not there yet.
