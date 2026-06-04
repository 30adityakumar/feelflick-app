# F12A — Premium UI Visual-QA Protocol

> **Phase F12A. The methodology for a route-by-route premium visual QA across real breakpoints.**
> Engine frozen `2.17`. **Audit only — no UI implementation in F12A.** The output is a prioritized
> backlog (F12B–F12F), not code. **Does not unblock F8C.**

**Date:** 2026-06-04.

---

## Purpose

The app is stable and the design-system foundation is in place (tokens, `Card`, `AccentPanel`), but it
still **feels MVP-like in places**. Passing tests proves stability, **not** premium feel. This protocol
defines how we judge "premium" with **real captured evidence** (computed metrics + screenshots across
6 breakpoints), so the polish backlog is grounded, not vibes.

## What "premium" means for FeelFlick

Borrowed disciplines, translated — never copied:
- **Stripe** — clarity, trust, intentional hierarchy; every value on a consistent scale.
- **Netflix / Apple TV+** — the *film* is the hero; chrome recedes; media-first.
- **Linear** — speed, restraint, sharp alignment; one container rhythm.
- **Craft / Read.cv** — typography-led calm; a real type scale.
- **Awwwards** — motion/polish *only where it improves clarity*.
- **Letterboxd** — film reverence — **without** the social/feed noise (anti-scroll).

Concretely, premium = **one container system**, **one type scale**, **comfortable touch targets**,
**consistent card rhythm**, **a clear single primary CTA per view**, **calm motion**, and **the honesty
layer intact**.

## What NOT to copy

- ❌ Stripe's blue/gradient marketing aesthetic — keep FeelFlick's purple/pink editorial dark.
- ❌ Netflix's infinite grid / autoplay — betrays anti-scroll + the single pick.
- ❌ Awwwards' heavy scroll-jacking / decorative motion — clarity over spectacle.
- ❌ Letterboxd's social feed — we pick *one* film, we don't surface activity streams.

## Breakpoints (tested)

| Token | Width | Class |
|---|---|---|
| mobile | **390** | iPhone baseline |
| large-mobile | **430** | iPhone Pro Max |
| tablet | **768** | iPad portrait |
| small-laptop | **1024** | iPad landscape / small laptop |
| desktop | **1280** | standard desktop |
| wide | **1440** | wide desktop (shell-max-width stress) |

## Route list (audited)

- **Public:** `/`, `/about`, `/privacy`, `/terms`
- **Auth/onboarding:** `/onboarding` (⚠️ the dev test user is already onboarded → redirects to
  `/home`; the real onboarding genres/movies/ratings/mood steps were **not browser-observed** — a
  documented limitation; they need a fresh user).
- **Core authed:** `/home`, `/movie/:id` (496243 Parasite), `/profile`
- **Utility:** `/discover`, `/browse`, `/watchlist`, `/history`, `/account`

## Scoring rubric (per route × breakpoint)

Each cell scored **1–5** (5 = premium):
- **5 Premium** — Stripe/Apple-grade; nothing to fix.
- **4 Polished** — strong; minor refinement.
- **3 Solid** — works, on-brand, but reads "good app," not "premium."
- **2 MVP** — functional but visibly unrefined (spacing/scale/targets off).
- **1 Breakable** — overflow, broken layout, or a11y blocker.

Dimensions: content fit · typography · CTA hierarchy · card rhythm · spacing · overflow · touch
comfort · premium feel.

## Severity levels

- **P0** — breakable / a11y blocker / overflow. **P1** — clearly MVP, high visibility.
- **P2** — refinement that raises the floor. **P3** — nice-to-have polish.

## Evidence types

- **Browser-observed (B):** a screenshot was captured + visually reviewed at that breakpoint.
- **Computed-metric (M):** a measured value (overflow px, container max-width, h1 font-size,
  interactive-target dims, h1 count, alt coverage, console errors) from the Playwright capture.
- **Code-grounded (C):** read from source (no render).
Every backlog item cites which it rests on. **Synthetic ≠ real-user validation** — these are
heuristics, not tester findings.

## Method (how the evidence was gathered — honestly)

- **Authenticated** via the sanctioned **Playwright e2e harness** (`auth.setup.js`, creds in env from
  `.claude/local-secrets.json`, **never printed**). chrome-devtools can't be authed here (Google OAuth
  + credential guard); Playwright is the sanctioned authed-browser path.
- Temp capture specs (`e2e/{app,public}/_f12a-capture.e2e.js`) recorded **metrics at all 6
  breakpoints** + **full-page screenshots at 390 & 1280** for all 13 routes. Specs are **deleted after
  the audit**; screenshots live in **`/tmp/ff-f12a/`** (not committed — too large).
- 7 screenshots were directly reviewed (home 390/1280, movie, profile, browse, discover, account,
  watchlist); the rest are metric-grounded. Caveat: `/home` Briefing often renders as **skeleton** in
  the capture window (pick not yet loaded) — noted wherever relevant.

## Screenshot naming convention

`/tmp/ff-f12a/<route-key>-<breakpoint>.png` (e.g. `home-390.png`, `movie-1280.png`).

## Implementation guardrails (for F12B+)

- No engine/schema/auth/route/package changes. Engine frozen `2.17`.
- **No `<Button>` render/font change in any phase that touches a `/about` visual-baseline route**
  without a deliberate re-baseline.
- Preserve the **honesty layer** (WhyThisPick, PrimaryCaseCard, ViewerNotes, DnaConfidence) + the
  **MovieCard hover LAW**.
- Every pixel-changing phase uses the **authenticated-walkthrough parity loop** (capture before/after).
- Additive primitives first; migrate one route as proof before broad rollout.
