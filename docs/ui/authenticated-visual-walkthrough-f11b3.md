# F11B.3 — Authenticated Visual Walkthrough (Home / Movie / Profile)

> **Phase F11B.3. A real, live authenticated visual pass** of the three core authenticated
> routes, used to decide what (if any) pixel-level rhythm work is justified. Engine frozen
> `2.17`. **Does not unblock F8C.**

**Status:** ✅ walkthrough completed. **Date:** 2026-06-04.

---

## Method (honest)

- **Login method: human/programmatic via the project's Playwright e2e harness** — the dev test
  user is signed in by `e2e/auth.setup.js` (`signInWithPassword`) reading creds from
  `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD` **env vars** (piped from `.claude/local-secrets.json`).
  **No credential or token ever passed through a command/tool-call or this doc.** (The
  chrome-devtools browser could not be used: Google OAuth won't complete in an automated browser,
  and the harness credential guard blocks injecting a dev-user session into it. The Playwright
  harness is the sanctioned path — same one `npm run test:e2e` uses.)
- **Captured:** full-page screenshots + section-rhythm computed styles for `/home`, `/movie/496243`
  (Parasite), `/profile` at **desktop 1280×900** and **mobile 390×844**. Screenshots saved to a
  local temp dir (not committed; no session data in them beyond the rendered app).
- **Console:** the only console errors were **Vite HMR-websocket failures** (a Playwright-network
  artifact — the dev HMR socket can't reach the runner), **not app errors**. Clean otherwise.
- **Caveat:** on `/home` the **Briefing pick rendered as skeletons** in the capture window (the
  dev user's pick didn't finish loading within ~2.8s), so the *populated* Briefing wasn't observed
  — structure + rhythm were. Movie + Profile rendered fully.

## What I actually saw

### `/home` (desktop + mobile)
- Top nav (FEELFLICK · Tonight/Discover/DNA · search · avatar) → "TONIGHT I FEEL" eyebrow → **mood
  pills** (Tender/Thrilled/Curious/Cozy/…) → **Briefing** (skeleton in capture) → a single
  **"Tonight has more than one glow." Discover-prompt panel** ("KEEP EXPLORING", "Discover by mood").
- **Mobile:** clean **BottomNav** (Browse/Discover/**Tonight** centered+highlighted/DNA/Account);
  mood pills horizontally scrollable; Briefing centered.
- **Rhythm (computed):** Tailwind-class driven — gutter `px-5 → sm:px-8 → lg:px-[88px]`; the
  supporting tail uses `py-16 sm:py-20` (96px desktop top). **Briefing is visibly primary; the tail
  is clearly subordinate (one panel, below the fold on mobile).** ✅ No anti-scroll drift observed.

### `/movie/:id` (Parasite, desktop)
- Hero (poster + backdrop + actions) → **PrimaryCaseCard "Bong shares your DNA."** sitting tight to
  the hero → why-tier cards → "How it feels" (mood radar) → "Streaming now" → "Featurettes & extras"
  → "If this hits, these will too" (recs) → "The cast" → "Where to go next" → "How it traveled"
  (Parasite timeline) → "The receipts".
- **Rhythm (computed):** `ff-movie-hero` padding `0` (full-bleed); `ff-movie-primary-case`
  `48px 88px 8px` (tight to hero — *intentionally* connected); standard `ff-movie-section`
  `72px 88px 48px` (consistent across sections). **The hero → PrimaryCaseCard relationship already
  reads as connected** — no gap to fix.

### `/profile` (claude-dev, desktop)
- Masthead (avatar + name + archetype quote + stats) → **DnaConfidence (45%, honest "taste
  evidence")** → "How you feel cinema" (mood bars + constellation) → "The voices you trust" → "What
  you keep finding" → charts ("The last twelve") → stats → "4 films that define you" → "How you
  skew" → "People who get it" (taste twins) → a share-card section.
- **Rhythm (computed):** `ff-profile-masthead` `80px 88px 24px`; standard `ff-profile-section`
  values seen at `40px` and `56px` (DnaConfidence) — i.e. **standard profile sections are slightly
  inconsistent (40 vs 56)** — the one mild drift worth noting.

## Visual issues + severity

| # | Issue | Route | Severity | Change now? |
|---|---|---|---|---|
| 1 | Section *padding* varies across routes (40/48/72/80/96) | all | **Insight — mostly intentional hierarchy** | **No** — flattening it would be a redesign (forbidden). The variation reads deliberate (hero/masthead/after-hero/standard/tail). |
| 2 | Ad-hoc inline `borderRadius`/`boxShadow` literals (F11A drift) still in movie/profile sections | Movie, Profile | **P2 (consistency)** | **Yes** — zero-pixel `RADIUS` token migration (no visual change). |
| 3 | Standard `ff-profile-section` padding inconsistent (40 vs 56) | Profile | **P3** | **Maybe** — small, but I cannot fully confirm which is "right" from a skeleton-affected capture; **defer** a value change to avoid an unverified pixel shift. |
| 4 | Vite HMR-websocket console errors | all (dev only) | **none (dev artifact)** | No — absent in prod. |

## Decision: restraint is correct

**The three routes are already visually coherent, cinematic, and on-doctrine** (Briefing primary,
tail subordinate, PrimaryCaseCard connected to the hero, honest DnaConfidence). The live evidence
does **not** justify aggressive pixel normalization — doing so would be the redesign the rules
forbid. So F11B.3 makes only the **evidence-supported, zero-pixel** change: continue the `RADIUS`/
`SHADOW` **token migration** across the movie/profile section files (pure consistency, no rendered
change — re-verified by re-screenshot + CI Visual Regression), and **defers** any padding-value
normalization (issue 3) until it can be visually confirmed on a fully-loaded Briefing.

## Flat surfaces evaluated for `<Card>`

Most surfaces are either **expressive/accent-tinted** (PrimaryCaseCard gradient, DnaConfidence
number block, the Discover-prompt glow) or **poster/image cards** (governed by the MovieCard hover
LAW) — neither is a drop-in for the flat `<Card>` (`SURFACE.card` tint). **No clean flat-surface
`<Card>` win** that wouldn't change tint/visuals → **Card adoption deferred** (don't force it).

## Sections that must NOT be touched
The Briefing hero, the MovieCard hover LAW, the PrimaryCaseCard/ViewerNotes honesty, the hero
full-bleed, the share-card, the mood radar/constellation — all expressive + correct; leave them.

## Scope for the F11B.3 change set (next)
- **Touch:** `src/features/movie/sections-top.jsx`, `src/features/movie/sections-bottom.jsx`,
  `src/features/profile/sections-top.jsx`, `src/features/profile/sections-bottom.jsx` — **add
  `RADIUS`/`SHADOW` import + migrate exact-match `borderRadius` literals to `RADIUS.*`** (zero-pixel).
  Migrate exact-match inline shadows to `SHADOW.*` only where the value matches exactly.
- **Don't touch:** any section *padding value*, the hero, the hover LAW, the landing, `/about`, the
  shared `<Button>`, any behavior/data.
- **Expected visual impact:** none (exact-value swaps).
- **Rollback:** revert the PR (1:1 swaps).
- **Validation:** lint/test/build/audit + e2e + a **post-change Playwright re-walk** (screenshots
  must match) + CI Visual Regression (no `/`,`/about` change).
