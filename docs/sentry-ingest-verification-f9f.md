# F9F — Sentry Ingest Verification

> **Phase F9F. Verification only — no code/product change.** Confirms that
> production Sentry error ingestion works after the manual Allowed-Domains fix.
> No scoring / schema / RLS / Edge / package change. F8C remains blocked.

**Status:** ✅ **Sentry ingest is WORKING in production.** The 403 is gone, a test
error landed in Sentry Issues (env `production`, url `app.feelflick.com`), and the
production console is clean. **Date:** 2026-06-04.

---

## 1. Manual change confirmed (by user)

Sentry → project **`feelflick-app`** → Inbound Filters → **Allowed Domains** now
includes:
- `app.feelflick.com`
- `*.feelflick.com`
- `localhost`

This is exactly the F9D §1 / F9E §4 fix. No repo/code/env change was involved.

## 2. The 403 is gone — confirmed three ways

**(a) Server-side probe of the ingest endpoint** (the same diagnostic that returned
403 in F9D/F9E), by `Origin`:

| `Origin` | Before (F9D/F9E) | Now (F9F) |
|---|---|---|
| `https://app.feelflick.com` | 403 | **200** ✅ |
| `https://sub.feelflick.com` (`*.feelflick.com`) | 403 | **200** ✅ |
| `https://example.com` (control, not allowlisted) | 403 | **403** ✅ |

The control still 403s — proving the filter is **still enforcing**, just now allowing
the feelflick domains (the user *added* domains, didn't disable the filter).

**(b) Real browser traffic on `https://app.feelflick.com/`:** the Sentry envelope
`POST …/envelope/…` now returns **200** (it was 403 in F9E). On the first load one
envelope briefly 403'd while a sibling 200'd — **transient config-propagation lag**
(the Allowed-Domains change had just been applied; Sentry's ingest edge is eventually
consistent). A reload a few seconds later showed **all Sentry envelopes 200**.

**(c) Production console is clean** — after the reload, **no console errors/warnings**
at all (the Sentry 403 that was the *only* error on every route in F9C–F9E is gone).
The app renders fully; Google Fonts, TMDB posters, JS/CSS bundles, Supabase/Cloudflare
all load (the F9D security headers remain present and non-breaking).

## 3. Test event landed in Sentry

To verify the full pipeline end-to-end, a **single, clearly-labeled, uncaught test
error** was triggered at runtime in the browser (via DevTools — **NOT committed**, no
test code/UI added):

```
FeelFlick F9F Sentry ingest verification — safe test error [F9F-SENTRY-VERIFY-1780538368772]
```

The error envelope (and the on-error replay/transaction envelopes) all POSTed **200**.
Confirmed via the read-only Sentry MCP (`search_events`, errors dataset, last 1h):

- **Found 1 matching error** in project `feelflick-app`.
- **environment:** `production`
- **url:** `https://app.feelflick.com/`
- timestamp: 2026-06-04T01:59:28Z

→ The project is now **receiving and grouping browser events from app.feelflick.com**.
Sentry view: `https://feelflick.sentry.io` → Issues (filter the `F9F-SENTRY-VERIFY` marker).

> **Cleanup note:** that one labeled "F9F Sentry ingest verification" test Issue can
> be **Resolved/Deleted** in the Sentry dashboard — it's a synthetic verification
> error, not a real bug. (The Sentry MCP available here is read-only, so it can't be
> resolved programmatically.)

## 4. Privacy / no sensitive text exposed

Sentry replay is configured `replayIntegration({ maskAllText: true, blockAllMedia: false })`
(`src/main.jsx`) — so session replays **mask all text** (search queries, names,
emails never leave the browser); only non-sensitive media (posters) stays visible.
The verification test error contains only the synthetic marker string — no user PII.
Nothing sensitive was exposed.

## 5. Routes checked

- **`/` (production landing, logged-out):** network + console verified (Sentry 200,
  clean console, app renders). The end-to-end test error was triggered here.
- **`/home`, `/movie/:id`, `/profile` (authenticated):** **not separately re-checked
  in F9F** — Sentry ingest is **domain-gated** (per-Origin), not route-gated, so the
  fix applies identically to every route; F9C already verified those routes render.

## 6. Validation

✅ `npm run lint` clean · ✅ `npm run test` 487 passed (44 files) · ✅ `npm run build` ·
✅ `npm audit --omit=dev --audit-level=high` 0 vulnerabilities.

## 7. Remaining observability / hardening items

Production error monitoring is now live. Still open (non-blocking, from F9D/F9E):
- **CSP** — ship the draft report-only policy → tune → enforce.
- **CI secrets** — set repo secrets to make E2E + Lighthouse non-skip.
- **HSTS** — add `includeSubDomains` (+ preload) once subdomains are HTTPS-confirmed.
- Color-contrast a11y pass; retire/revive dead `recommendation_events` / `RecommendationFeedback`.
- Resolve the F9F test Issue in Sentry (housekeeping).

## 8. F8C gate — unchanged

**F8C (engine tuning) remains BLOCKED.** F9F is observability verification only and
does not touch the engine. F8C still needs a post-deploy outcome-capture baseline
that is non-trivial and **stable across real users** (by `placement`,
`algorithm_version`, cold/warm) — capture is proven (F9C), real-user volume is not
there yet.
