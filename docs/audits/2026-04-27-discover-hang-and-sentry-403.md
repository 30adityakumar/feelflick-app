# Pre-Launch Audit: Discover Hang + Sentry 403

**Date:** 2026-04-27  
**Auditor:** Claude (read-only pass — no code changed)  
**Branch at time of audit:** `main` (post-PR #68 squash merge)  
**Status:** Research complete. Phase 2 requires explicit authorization.

---

## Item 1 — Discover hangs forever when the pool returns 0 results

### Call-path trace

```
DiscoverPage (line 205)
  → useRecommendations(moodId, viewingContext, ...) [shared/hooks/useRecommendations.js:579]
      → getMoodRecommendations(...) [shared/services/recommendations.js:4734]
  ↓
  recommendations: Movie[]    loading: boolean    error: string|null
  ↓
DiscoverPage phase === 'loading' branch (line 481)
  → <NarratedLoader
        resultsReady={!loading && recommendations.length > 0}   ← BUG IS HERE
        onComplete={() => setPhase('results')}
     />
```

### Finding 1 — The hang mechanism (primary bug)

`DiscoverPage.jsx:483`:

```jsx
resultsReady={!loading && recommendations.length > 0}
```

When the recommendation engine returns an empty array, `loading` goes `false` (hook resolves cleanly) but `recommendations.length === 0`, so `resultsReady` stays `false` permanently.

`NarratedLoader.jsx` has two completion paths — **both gate on `resultsReady`**:

1. **Primary complete** (line 42–48): `if (!resultsReady || completedRef.current) return` — skipped.
2. **Force-complete fallback** (line 51–60):
   ```js
   const maxWait = LINE_INTERVAL_MS * LINES.length + 4000  // ≈ 7600 ms
   const t = setTimeout(() => {
     if (!completedRef.current && resultsReady) {   // ← ALSO checks resultsReady
       completedRef.current = true
       onComplete()
     }
   }, maxWait)
   ```
   The 7.6-second safety net also checks `resultsReady` before calling `onComplete()`. When `resultsReady` is permanently `false`, the fallback fires but does nothing.

**Result: the narrated loader hangs forever. No spinner, no empty state, no recovery.**

### Finding 2 — The hook itself is safe

`useRecommendations.js` resolves cleanly in all branches:

- Normal fetch: `finally { setLoading(false) }` (line 657) — always fires.
- Early-return guard: `if (!moodId || !userId) { setLoading(false); return }` (line 600).
- Error path: `catch` sets `setError(err.message)`; `finally` still fires.

The hook never hangs. The hang is entirely in how `DiscoverPage` passes `resultsReady`.

### Finding 3 — getMoodRecommendations zero-result paths

Every zero-result branch in `recommendations.js` returns `[]` — never throws a non-AbortError:

| Condition | Line | Return |
|---|---|---|
| `moodData.weights.length === 0` (language guard) | 4755 | `return []` |
| `candidates.length === 0` (pool empty) | 4782 | `return []` |
| `scored.length === 0` (all candidates excluded) | 4827 | `return []` |
| Non-AbortError catch | 4852 | `return []` |
| AbortError catch | 4849 | `throw error` (re-thrown, hook ignores aborts) |

The service is safe. `useRecommendations` always receives an array. The bug is upstream in `DiscoverPage`.

### Finding 4 — Smallest-set fix for Phase 2

Two changes required, one in each file:

**A. `DiscoverPage.jsx`** — decouple "loading done" from "has results":

```jsx
// Add derived state after recommendations destructure:
const exhausted = !loading && !error && recommendations.length === 0

// Pass to NarratedLoader:
<NarratedLoader
  resultsReady={!loading && !error}   // done = loading finished, not "has results"
  onComplete={() => setPhase(exhausted ? 'empty' : 'results')}
/>

// Add empty-state render branch (after 'results' branch):
{phase === 'empty' && (
  <DiscoverEmptyState onRetry={() => { /* reset trigger */ }} />
)}
```

**B. `NarratedLoader.jsx`** — remove `resultsReady` guard from force-complete fallback:

```js
// Line 54 — change:
if (!completedRef.current && resultsReady) {
// to:
if (!completedRef.current) {
```

The force-complete fallback is already time-gated (7.6 s). The `resultsReady` guard inside it is redundant and harmful.

**C. `DiscoverEmptyState` component** — needs to be created (small, ~30 lines). Possible copy:
> "We couldn't find a match for that mood right now. Try a different feeling or check back later."

### Finding 5 — Mobile / thin-pool notes

On mobile the mood pool can be thinner for several reasons:
- User has already excluded many genres in preferences
- `excluded` movies array (from `user_preferences`) shrinks the scored set
- Users with short watch history have fewer similarity vectors → smaller candidate set

The hang is **equally likely on mobile** — there's no mobile-specific code path in the Discover flow. The fix in Finding 4 covers all clients.

### Phase 2 estimate

~2 hours. Breakdown:
- `DiscoverPage.jsx` changes: 30 min
- `NarratedLoader.jsx` one-line fix: 5 min
- `DiscoverEmptyState` component: 45 min (design + copy + a11y)
- Tests: 30 min
- Lint → test → build: 10 min

---

## Item 2 — Sentry 403 in production

### Code-side state

**`main.jsx:18–32` — Sentry.init with hardcoded DSN fallback:**

```js
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || 'https://769b544f824e0c2cf23509c830c8b9b5@o4511197071736832.ingest.us.sentry.io/4511197073768448',
  enabled: import.meta.env.PROD,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
```

The DSN is hardcoded as a fallback. **Sentry will fire in production even if `VITE_SENTRY_DSN` is not set in Vercel.** This means the hardcoded DSN must be valid and point to an active, correctly-configured project — otherwise every event hits an invalid endpoint and returns 403.

**Sentry appears in 5 files:**

| File | Usage |
|---|---|
| `src/main.jsx` | `Sentry.init(...)` |
| `src/App.jsx` | `Sentry.ErrorBoundary` wrapper |
| `src/app/ErrorBoundary.jsx` | `Sentry.captureException(err)` |
| `src/app/router.jsx` | `Sentry.wrapCreateBrowserRouterV7(...)` |
| `src/shared/lib/vitals.js` | `Sentry.metrics.distribution(...)` for web vitals |

### Repository regressions since last known-good

Checked `git log --oneline -30`. **No commits in the last 30 touched:**
- `index.html` (no CSP header changes)
- `vite.config.js` (no proxy or header rules)
- `main.jsx` Sentry block (DSN fallback has been there since initial setup)
- Vercel config (`vercel.json`) — no changes visible in git history

The 403 is **not a recent regression introduced by code changes in this repo.** The most likely causes are external:

1. **Ad-blocker / privacy shield** (most common): Brave Shields, uBlock Origin, and Firefox Enhanced Tracking Protection all block `*.sentry.io` and `*.ingest.sentry.io` at the network level. The browser console shows `net::ERR_BLOCKED_BY_CLIENT` which can surface in Sentry's own dashboard (if events from non-blocked clients reach it) as a 0-event anomaly — or the user sees the blocked request and misreads it as 403.
2. **Stale or revoked DSN**: The hardcoded DSN key `769b544f824e0c2cf23509c830c8b9b5` may have been rotated in the Sentry dashboard. If the key was regenerated, the old key returns 403.
3. **Rate-limit**: Sentry's free tier enforces event quotas. If the quota was exceeded, ingest returns 429 (not 403), but some dashboards surface this ambiguously.
4. **Project transfer or deletion**: If the Sentry project was moved to a different organization, the DSN path `o4511197071736832` may no longer be valid.

### Manual checklist for Aditya

Run these before authorizing Phase 2 Sentry work:

- [ ] **Open Chrome DevTools → Network → filter `sentry`**. Reproduce a page load and find the Sentry ingest request. Check: (a) what HTTP status code does it return? (b) Is the response body a JSON error from Sentry, or is the request blocked at the OS/extension level (`ERR_BLOCKED_BY_CLIENT`)?
- [ ] **Repeat with all extensions disabled** (open an Incognito window with extensions off, or use a fresh Chrome profile). If the 403 disappears → ad-blocker. If it persists → real server-side 403.
- [ ] **Log in to sentry.io** → Settings → Projects → find the FeelFlick project → Client Keys (DSN). Confirm the key `769b544f824e0c2cf23509c830c8b9b5` is listed and **not revoked**.
- [ ] **Check the Sentry project's Usage & Billing** page. Confirm the account is not over quota (quota exhaustion shows as 429, but worth ruling out).
- [ ] **Check `VITE_SENTRY_DSN` in Vercel** (Project → Settings → Environment Variables). Is it set? If yes, does its value match the key in step 3? If it's not set at all, the hardcoded fallback in `main.jsx` is what's active in production.

### Recommended fix path (after checklist)

**If the DSN key is valid and the 403 is an ad-blocker**: No code fix required. Standard behaviour — Sentry events from ad-blocker users are simply lost. Consider [Sentry's tunnel relay](https://docs.sentry.io/platforms/javascript/troubleshooting/#using-the-tunnel-option) to route events through your own domain and bypass blockers. This is a Vercel Edge Function / Worker of ~10 lines.

**If the DSN key is revoked or wrong**: Regenerate in the Sentry dashboard → update `VITE_SENTRY_DSN` in Vercel → redeploy. Also update the hardcoded fallback in `main.jsx` or remove the fallback entirely (prefer failing silently over baking in a key that can go stale).

**Cleanup regardless of root cause**: Remove the hardcoded DSN fallback from `main.jsx`. Replace with:
```js
dsn: import.meta.env.VITE_SENTRY_DSN,
enabled: import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN,
```
This makes "no `VITE_SENTRY_DSN`" mean "Sentry is silently disabled" rather than "Sentry fires at a potentially-stale hardcoded endpoint."

---

## Forward-carried constraint

**STOP after this commit. Do not begin Phase 2 implementation.**

Before Phase 2 is authorized, Aditya must:
1. Read this audit.
2. Run the Item 2 manual checklist and report the Network tab finding.
3. Explicitly say "go ahead with Phase 2" (or scope it to Item 1 only).

Phase 2 touches `DiscoverPage.jsx`, `NarratedLoader.jsx`, and adds a new `DiscoverEmptyState` component — three files, ~2 hours. The fix is straightforward but DiscoverPage is a 500-line file and deserves a fresh explicit authorization before touching it.
