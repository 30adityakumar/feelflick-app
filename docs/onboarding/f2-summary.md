# F2 — Onboarding Rebuild: Summary & Phase Ledger

*Status: complete. Verdict: see [`beta-readiness.md`](./beta-readiness.md). Last updated at F2.26.*

## 1. Initiative overview

F2 rebuilt the FeelFlick `/onboarding` journey so the **first-time experience** matches
the product's North Star and the unified editorial language used across the app. The
rebuild was deliberately incremental — audit → safe behavior-preserving implementation
→ validation → squash-merge — so the high-traffic completion flow was never destabilized.

**Target product language:** mood-first, taste-deep, **anti-scroll**, cinematic,
editorial, and **accessible**. Onboarding is the front door to "how you feel → one
considered film tonight"; it captures the cold-start taste signal that the engine needs.

**Frozen throughout F2 (never changed without an explicit, separately-approved phase):**

- onboarding step **validation thresholds** — `MIN_GENRES = 1`, `MIN_MOVIES = 5`, mood maximum currently **3**;
- the **selected-data contracts** — the selected-movie shape, genre-preference semantics, mood-baseline semantics;
- the **completion destination** — first landing is **`/discover`** (cold-start), not `/home`;
- the **deferred auth flip** — `completeOnboarding({ markAuthComplete: false })` during onboarding, flipped only after the celebration + `/discover` handoff;
- the **rating mappings** — `okay = 5`, `liked = 7`, `loved = 9`.

## 2. Final experience summary

A first-time user signs in with Google → `PostAuthGate` routes the incomplete user to
`/onboarding` (BrandSplash-gated, no flash-of-home). The journey:

- **Cinematic DNA rail** — one persistent chrome row: FEELFLICK wordmark + a brand-gradient
  progressbar + a compact Mood/Genre/Film/Rated tally + the step counter.
- **Mood-reactive atmosphere** — `AmbientGlow` tints the backdrop from the user's mood picks (mood stays ambient; brand stays purple/pink).
- **MoodStep** — pick up to 3 moods (non-colour selected affordance, max-cap feedback).
- **GenresStep** — multi-select genres (≥1 to continue).
- **MoviesStep** — an **editorial poster grid** of engine suggestions + a distinct "Your anchors" zone; an **accessible movie-search combobox** (listbox/options, arrow-key nav, Escape/outside-click, focus restore); surfaced loading / error / retry states; ≥5 anchors to continue.
- **RatingStep** — three **editorial verdict controls** (Okay / Liked / Loved) as the primary, tap-first interaction; a quiet optional swipe; keyboard parity; auto-finish on the last rating.
- **CelebrationReveal** — a calm, personal editorial close: mood pills + the user's poster mosaic + "Tonight is yours." + one accurate coaching beat, then a cinematic fade.
- **`/discover` handoff** — navigate to `/discover` (which opens on "How do you feel?"), then the auth metadata is flipped.

## 3. Phase ledger (F2.1 – F2.25)

Implementation/test phases carry their merged **squash SHA** + **PR**. Audit/spec phases
produced docs only (no merge SHA — *intentionally omitted*).

| Phase | Title | Type | PR | Squash SHA | What it shipped / preserved |
|---|---|---|---|---|---|
| F2.1 | CelebrationReveal extraction | implementation | #204 | `d3022587` | Extracted the celebration reveal into its own component; behavior preserved. |
| F2.2 | Onboarding test-safety cleanup | test-safety | #205 | `82e371e7` | Cleaned the onboarding test safety net (real-component coverage; removed contradictory stubs). |
| F2.3 | MoviesStep logic extraction | implementation | #206 | `71a16250` | Extracted MoviesStep suggestion/search logic into `suggestionPool.js` + `useSuggestionPool`/`useMovieSearch` hooks + `movies/*` components. Behavior unchanged. |
| F2.4 | Shared step chrome | implementation | #207 | `957e8c57` | Extracted reusable `StepShell`/`StepHeader`/`StepFooter`/`BackButton`. |
| F2.5 | Visual-direction audit | audit/spec | — | — | Onboarding visual-direction audit (no code). |
| F2.6 | Chrome / progress a11y | implementation | #208 | `e448c183` | Reskinned persistent chrome + closed progress / reduced-motion a11y gaps. |
| F2.7 | Typography polish | implementation | #209 | `e49060a8` | Aligned step typography + microcopy rhythm to the editorial language. |
| F2.8 | Mood-signature layer | implementation | #210 | `ea28c407` | Subtle wrapper-level mood-signature atmosphere (ambient-only). |
| F2.9 | MoodStep + GenresStep polish | implementation | #211 | `c2f715c0` | Polished the first two step bodies (non-colour selected state, max-cap feedback, gates). |
| F2.10 | DNA artifact spec | audit/spec | — | — | Spec for fusing Progress + TasteStrip into one Cinematic DNA artifact. |
| F2.11 | DnaRail | implementation | #212 | `d6e639f2` | Fused Progress + TasteStrip into one compact **DnaRail** (progressbar + aria-live tally + step-4 suppression). |
| F2.12 | MoviesStep audit | audit/spec | — | — | Visual/a11y redesign audit for MoviesStep (recommended the editorial grid). |
| F2.13 | MoviesStep a11y / error foundation | implementation | #213 | `40a63904` | Pool error + retry, search error state, accessible search input, skeleton status, mobile autofocus gated to `(pointer:fine)`. |
| F2.14 | Editorial movie grid | implementation | #214 | `663d64e7` | Replaced the horizontal shelves with a responsive editorial poster grid + the "Your anchors" zone. |
| F2.15 | Combobox accessibility | implementation | #215 | `a034fe87` | Full APG combobox/listbox: arrow/Home/End/Enter/Escape, outside-click, focus restore. |
| F2.16 | RatingStep audit | audit/spec | — | — | Visual/interaction/a11y audit for RatingStep (recommended editorial verdicts + the a11y/visual split). |
| F2.17 | RatingStep a11y foundation | implementation | #216 | `696c104a` | Live region, `role=alert`, focus-visible rings, scoped arrow-key shortcuts, reduced-motion completeness. Render-faithful. |
| F2.18 | Editorial verdict revoice | implementation | #217 | `c2f44aaf` | Meh→Okay (label==accessible name), removed ✕/✓/♥ symbols + stamps + peek, word-led verdict controls (Loved apex), softened swipe. |
| F2.19 | CelebrationReveal audit | audit/spec | — | — | Visual/content/timing/mobile/a11y audit (recommended protect-and-simplify + the a11y/visual split). |
| F2.20 | Celebration a11y + finish-flow tests | implementation / test | #218 | `6ec94830` | One sr-only atomic completion status (off the broad wrapper), single h1, reduced-motion delays→0; **added the finish-flow ordering test net**. |
| F2.21 | Celebration visual polish | implementation | #219 | `aeb80ba0` | Removed Sparkles / Edition №001 / stats receipt / heart badges / particles / all infinite loops; honest taste line + "From your picks" + accurate "Next up" coaching; short-viewport hardening. |
| F2.22 | Production-readiness audit | audit/spec | — | — | Full code/test-grounded audit; live disposable-user walkthrough **blocked by env safety**; ranked findings; verdict private/beta-ready. |
| F2.23 | User-scoped draft privacy fix | implementation | #220 | `622a29cc` | Fixed the **P1 cross-account draft leak** — per-user draft key, deferred hydration, clear on sign-out / completion / onboarded-redirect, legacy-key migration. |
| F2.24 | Completion idempotency | implementation | #221 | `409a159b` | Replace-by-source (`delete source='onboarding'` + insert) for `user_history` + `user_ratings` — re-run safe, non-onboarding rows untouched. |
| F2.25 | Completion-persistence architecture audit | audit/spec | — | — | RPC/transaction architecture audit; recommended **keep the client service for beta**, fully spec'd the hybrid RPC for post-beta. |

## 4. Structural outcome

- **`Onboarding.jsx`** — orchestration only: the auth gate, step state, the user-scoped draft (load/persist/clear via `draft.js`), `handleFinish` (the frozen finish flow), and the step/celebration composition. No step UI lives here.
- **Shared step components** — `components/{StepShell,StepHeader,StepFooter,BackButton,DnaRail,AmbientGlow,CelebrationReveal}`.
- **MoviesStep** — `steps/MoviesStep.jsx` composes `hooks/{useSuggestionPool,useMovieSearch}` + `suggestionPool.js` (the scoring engine, frozen) + `steps/movies/{MovieCard,CardSkeletonRow,SearchDropdown}`.
- **RatingStep** — `steps/RatingStep.jsx`: the container owns the frozen logic (swipe map, thresholds, the 280ms guard, the 700ms auto-finish); `SwipeableFilmCard`/`FilmCard`/`SentimentRow` are presentation.
- **CelebrationReveal** — isolated in `components/CelebrationReveal.jsx`; reads only `fadingOut`; owns the internal stage choreography.
- **Draft helper** — `features/onboarding/draft.js` (`draftKey`/`loadDraft`/`saveDraft`/`clearDraft`, user-scoped + legacy migration).
- **Completion service** — `shared/services/onboarding.js` (`completeOnboarding`, `markOnboardingAuthComplete`).
- **Tests** — `features/onboarding/__tests__/*` (step + chrome + draft + finish-flow), `shared/lib/auth/__tests__/onboardingStatus.test.js` (the gate derivation), `shared/services/__tests__/onboarding.test.js` (completion writes).

## 5. Accessibility outcome

- **Progressbar** — DnaRail exposes `role=progressbar` with `aria-valuemin/max/now` (`now = step + 1`); survives reduced-motion.
- **DnaRail textual labels** — Mood/Genre/Film/Rated words (non-colour affordance), in an `aria-live="polite"` tally that is suppressed on step 4.
- **Focus-visible** — all interactive controls (mood/genre tiles, combobox, verdict controls, Skip, Back, the rating stage) carry the brand focus-ring family.
- **Combobox/listbox** — the movie search is `role=combobox` (`aria-expanded`/`controls`/`autocomplete`/`activedescendant`) controlling a `role=listbox` of `role=option`s; arrow/Home/End/Enter/Escape + outside-click + focus restore.
- **RatingStep keyboard** — ArrowLeft→okay / ArrowUp→liked / ArrowRight→loved, **scoped to the rating stage** (`e.target === e.currentTarget` — never from a button); buttons keep Enter/Space.
- **Live-region ownership** — partitioned, **no competing announcements**: DnaRail tally (step-4 suppressed) · RatingStep `liveMessage` · CelebrationReveal's single sr-only status.
- **CelebrationReveal** — exactly **one** sr-only `role=status` `aria-live=polite` `aria-atomic=true` completion node (set once after mount), and a single visible `<h1>` ("Tonight is yours."); no focus is moved merely to announce success.
- **Reduced motion** — DnaRail instant fill; MoviesStep skeleton/card motion suppressed; RatingStep drag disabled; CelebrationReveal stage delays → 0 with **no `repeat:Infinity`**.
- **Decorative images** — posters use `alt=""`; Sparkles/grain/glow/icons are `aria-hidden`.
- **Touch targets** — controls ≥44px; MoviesStep autofocus gated to `(pointer:fine)` (no soft-keyboard pop on mobile entry).

## 6. Frozen finish-flow contract

The completion → `/discover` ordering (owned by `Onboarding.jsx` `handleFinish`) is:

1. `completeOnboarding({ markAuthComplete: false })` is called (the auth flip is **deferred**);
2. persistence + `prefetchHomeData` run **in parallel**;
3. the celebration holds for at least **`CELEBRATION_MIN_MS = 12000`** ms;
4. the fade-out lasts **900 ms** (hard-matched to the CelebrationReveal opacity tween);
5. `navigate('/discover', { replace: true, … })`;
6. `markOnboardingAuthComplete()` runs **after** navigation.

This ordering is **load-bearing** (the deferred flip + navigate-before-flip prevent `PostAuthGate` from yanking `/onboarding → /home` mid-celebration) and is **protected by `OnboardingFinishFlow.test.jsx`**, which drives the real `handleFinish` and asserts the exact order. **Do not change it casually.**

## 7. Testing outcome *(current — captured at F2.26)*

- **Targeted onboarding command** (`vitest run src/features/onboarding/__tests__/ src/shared/lib/auth/__tests__/onboardingStatus.test.js src/shared/services/__tests__/onboarding.test.js`): **174 tests / 15 files** passing.
- **Onboarding feature only** (`vitest run src/features/onboarding`): **153 tests / 13 files**.
- **Full suite** (`npm run test`): **678 tests / 61 files** passing.
- **lint** clean · **build** ✓.
- **Per-phase Playwright** viewport coverage (isolated component renders) across **360×640 / 390×844 / 430×932 / 768×1024 / 1280×720 / 1440×900** for MoviesStep (grid 3→5 cols), RatingStep (verdicts @48px), and CelebrationReveal (fit @360×640; 0 console errors).
- **Key test files & what they protect:** `OnboardingFinishFlow.test.jsx` (the frozen finish ordering) · `onboardingStatus.test.js` (the single-source gate derivation) · `onboarding.test.js` (completion writes + idempotency + rating mappings) · `MoviesStepStates`/`MoviesHooks` (grid + combobox + error/retry) · `RatingStepA11y`/`RatingStepVerdict` (keyboard + verdicts) · `CelebrationReveal.test.jsx` (one h1 / one atomic status / no infinite loops) · `OnboardingChrome.test.jsx` (DnaRail progressbar/tally) · `draft.test.js`/`OnboardingDraft.test.jsx` (user-scoped draft isolation).

> The 174/153/678 counts are the **current** command output (F2.26), not a remembered total — re-run the commands above to refresh.
