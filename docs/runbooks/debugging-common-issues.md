# Runbook — Debugging Common Issues

> Paste the relevant section into Claude Code when you hit one of these issues.
> This prevents 3–4 rounds of diagnostic back-and-forth.

---

## ESLint Errors

### react/no-unescaped-entities (×47 historically)
Use HTML entities in JSX text: `&apos;` `&quot;` `&amp;` `&lt;` `&gt;`  
Or wrap in a JS expression: `{"don't"}`

### react-hooks/rules-of-hooks (×8 historically)
Hooks called conditionally or inside loops. Move hook calls to the top level of the component. Never inside `if`, `for`, or nested functions.

### no-undef: `process` (×4 historically)
Use `import.meta.env.DEV` / `import.meta.env.PROD` instead of `process.env.NODE_ENV` in Vite.  
If `process` is needed, guard with: `typeof process !== 'undefined' && process.env.NODE_ENV`

### jsx-a11y/no-static-element-interactions (×8 historically)
Add `role` and keyboard handler to interactive `<div>` or `<span>` elements, or replace with `<button>`.

---

## Test Issues

### `Error: always broken` in test output
**Expected.** This is the `SectionErrorBoundary` test intentionally exercising error boundaries. Not a real failure.

### `recommendations.helpers.test.js` crashes on import
**Cause:** Requires `VITE_SUPABASE_URL` in env at import time.  
**Fix:** Ensure `src/test/setup.js` has the VITE_* env stubs loaded. All stubs are global — no per-file stubbing needed.

### VITE_* env vars undefined in tests
All `VITE_*` stubs are handled globally in `src/test/setup.js`. If a new env var is added, add its stub there.

---

## Carousel / Card Hover Issues

### Expanded card is clipped or hidden
**Cause:** An ancestor element has `overflow: hidden`.  
**Fix:** Scroll container must be `overflow-x: auto; overflow-y: visible`. Check every ancestor of `CarouselRow` for `overflow: hidden`.

### Card flickers or expands on accidental hover
**Cause:** 450ms intent timer in `Row/index.jsx` was changed.  
**Fix:** Restore `expandedId` state change to fire only after 450ms debounce. Do not change this value.

### Sibling cards not dimming when one expands
**Cause:** `opacity-60 scale-[0.97]` class not applied to non-expanded siblings.  
**Fix:** Check `Card/index.jsx` — the sibling style is applied when `expandedId !== null && expandedId !== card.id`.

---

## Recommendation Engine Issues

### Recommendations not updating after user interaction
**Cause:** `user_profiles_computed` cache has not expired.  
**Fix:** Check `CACHE_TTL` in `recommendation-cache.js:10` (default 5 min). Force refresh by incrementing `ENGINE_VERSION` in `recommendations.js:36` for testing only — revert after.

### Embedding calls failing
**Cause:** OpenAI key not set server-side, or `VITE_OPENAI_*` was mistakenly used.  
**Fix:** OpenAI key is server-side only. Never expose via `VITE_*`. Check server environment, not `.env`.

### TMDB rate limit errors (429)
**Cause:** Exceeding 40 requests per 10s window.  
**Fix:** `rateLimiter.maxRequests` in `tmdb.js:35` controls this. Do not increase above 40 — it is the TMDB API hard limit.

---

## npm audit Vulnerabilities

As of 2026-04-10: 8 vulnerabilities (3 moderate, 5 high) — not blocking dev or build.  
Run `npm audit` for current state. Run `npm audit fix` for safe automatic fixes only.  
Do not run `npm audit fix --force` without reviewing the changeset.

---

## Build Failures

### Vite build fails with import errors
Run `npm ci` first to ensure lockfile is in sync. Then `npm run lint` to catch syntax issues before the build.

### Supabase migration conflicts
Never delete existing migrations. Create a new migration file in `supabase/migrations/` with a timestamp prefix.
