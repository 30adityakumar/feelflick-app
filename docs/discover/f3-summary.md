# F3 — `/discover` Redesign: Final Initiative Summary

> ⚠️ **Historical record — superseded product framing.** This summary's "one-pick"
> Discover product framing is **no longer current product authority**. FeelFlick's
> canonical definition is now **personal movie discovery** through three complementary
> modes, and Discover's target is a **small, focused, finite selection** (Tuned to the
> moment), not exactly one film — see [../product-doctrine.md](../product-doctrine.md)
> (rationale: [ADR 020](../decisions/020-personal-movie-discovery-and-bounded-choice.md)).
> This document is preserved as an accurate account of what F3 shipped; its body is
> intentionally not rewritten. The shipped one-pick `/discover` result remains current
> runtime, being migrated separately.

**Status:** COMPLETE · **Route verdict:** READY FOR PRIVATE / BETA TESTING
**Span:** F3.1 → F3.14 · **Final `main` lineage:** the F3.13 coverage merge `c74c856e` + the F3.13 beta-readiness note `fcb91a7a`
**Companion docs:** [`beta-readiness-f312.md`](beta-readiness-f312.md) (the F3.11 verdict + F3.12 hardening + the F3.13 evidence append).

This is the closure ledger for the `/discover` redesign: why it was rebuilt, the final experience, the per-phase record (verified against git/GitHub), the product transformation, the final architecture, the trust / accessibility / fallback-truth outcomes, the frozen contracts, the verification evidence, the test-safety model, the readiness verdict, and the deferred (evidence-driven) follow-ups.

---

## 1. Initiative overview

`/discover` carried accumulated friction and theatre that worked against FeelFlick's doctrine. The rebuild targeted these original problems:

- a separate, redundant **hero** screen before the mood input;
- a fixed **"Surprise Me"** preset that fabricated intent;
- repeated **mood/context friction** across stages;
- **four forced question taps** to set the night context;
- a **6.2-second forced ceremony** (breath → constellation-collapse → title-card) before an already-computed pick;
- **visible alternates** and hidden-deck ("N more queued") language;
- **mood / taste percentage theatre** (false scientific precision);
- a **weak source/fallback distinction** (live-empty, fetch-failure, and a static fallback all looked the same);
- a **monolithic component** (one large `Discover.jsx`);
- **no route-level E2E** and **no authenticated visual** coverage.

The target product doctrine: **mood-first · one film for tonight · anti-scroll · taste-deep · emotionally intelligent · editorial · accessible · evidence-backed · no fake AI or scientific certainty.**

## 2. Final experience

The journey, in product-facing terms:

1. **Mood front door** — `/discover` opens directly on MoodStage; pick 1–3 moods (no hero, no "Surprise Me").
2. **Honest onboarding seed** — arriving from onboarding may pre-select the mapped baseline moods (deduped, ≤3, order-preserved); a direct visit starts with **no fabricated current mood**.
3. **Optional night-context checkpoint** — StageNightContext shows four predicted starting values (intention · time · who · energy) summary-first; all editing is behind one optional **Adjust details** disclosure.
4. **Explicit acceptance** — **Find my film →** accepts the visible context (the only preference-commit point).
5. **900ms resolve** — one calm, honest transition (0ms under reduced motion); no progress bars, no "analyzing".
6. **One confident recommendation** — StagePick presents a single film: title, director · year · runtime, descriptor chips, **Why this one** (an honest because-line + a true-only **runtime-fit** line), real synopsis when present, **provider availability**, **trailer** when present.
7. **Actions** — **Open Film File** (`/movie/:tmdbId`), **Save for later**, **Already watched**, **Not tonight**.
8. **Honest exhausted state** — when the internal list is consumed: "No more strong fits…" with *Adjust tonight* / *Start over* (no auto-refill).
9. **Reason-aware fallback states** — a labelled example pick when live data is unavailable.

The internal ranked list (depth 15) is a **controlled escape path** behind *Not tonight* / *Already watched* — **never a visible feed, deck, or count.**

## 3. Phase ledger (verified against git/GitHub)

| Phase | Title | Type | PR | Squash SHA | Outcome | Key frozen contract preserved |
|---|---|---|---|---|---|---|
| **F3.1** | Discover product/UI/architecture audit | audit/spec | — | — (audit-only) | Mapped drift + the F3 plan | — |
| **F3.2** | Extract Discover derivation helpers + test net | extraction | #223 | `7aa9c9a1` | Pure mood/defaults/explanation/diversity → `derive.js` + tests | Scoring/ranking values unchanged |
| **F3.3** | Extract Discover pre-result stages | extraction | #224 | `9f2060d2` | Decomposed the ceremony/entry stages into `sections/` | Stage durations + behavior unchanged |
| **F3.4** | Extract Discover result stage | extraction | #225 | `de673c80` | `StagePick` + result hooks/sections extracted verbatim | Write payloads + event names unchanged |
| **F3.5** | Open Discover on the mood front door | product/UI | #227 | `da240a94` | MoodStage is the entry; hero + Surprise Me removed; onboarding seed gated | Onboarding handoff + mood max 3 |
| **F3.6** | Make Discover night context optional | product/UI | #228 | `901ba351` | Summary-first context + one optional editor; commit only on Find-my-film | Preference payload unchanged |
| **F3.7** | Shorten the Discover recommendation resolve | product/UI | #229 | `f21ea26d` | 6.2s ceremony → one 900ms StageResolve (0ms reduced motion) | Find-my-film order + commit point |
| **F3.8** | Redesign Discover as one confident pick | product/UI | #231 | `1cf93d0b` | One pick; alternates/queue/percentages/parallax removed; internal list kept | Ranking, `diversifyTop3`, `MAX_PICKS=15`, payloads |
| **F3.9** | Harden Discover result trust + accessibility | reliability/a11y | #232 | `d0f27f9d` | Live status, action semantics, write-error honesty, trailer focus, provider truth | Scoring + write payloads byte-identical |
| **F3.10** | Clarify Discover fallback data states | reliability | #234 | `1d3b0161` | Explicit `dataSource` (live_ok/empty/filtered_empty/error) + reason-aware copy | Fetch/ranking + films shape unchanged |
| **F3.11** | Production-readiness audit | audit/spec | — | — (audit-only) | Verdict: private/beta ready, **no P0/P1** | — |
| **F3.12** | Harden Discover for private beta | reliability/a11y | #235 | `fd571181` | AudioToggle 44px + name, exhausted `<h1>`, fallback `role=note`, non-blocking impression `.catch` | Ranking/payloads/route unchanged |
| **F3.13** | Authenticated E2E + visual coverage | testing/tooling | #236 (+ docs #237) | `c74c856e` (+ `fcb91a7a`) | Intercepted E2E (9) + 8 authenticated visual states (Darwin + Linux) | **No `src/**` change; no live Discover write** |

*F3.1 and F3.11 are audit-only — no PR or merge SHA. PR numbers #226 / #230 / #233 are unrelated to F3.*

## 4. Product transformation

| Before | Final |
|---|---|
| Hero before mood | Mood is the entry |
| Fixed Surprise Me preset | Explicit mood selection |
| Four required context taps | Summary-first optional context |
| 6.2-second ceremony | 900ms resolve (0ms reduced motion) |
| Three visible choices / queue | One confident pick |
| Mood/taste percentages | Evidence-backed case |
| Hidden queued films marked seen | Only displayed picks marked seen |
| Generic fallback state | Reason-aware fallback truth |
| Result action ambiguity | Honest success/error states |
| No browser coverage | Intercepted E2E + authenticated visuals |

## 5. Final architecture

```
src/features/discover/
├── Discover.jsx            route orchestration · numeric stage state (1 / 2 / 2.3 / 3) ·
│                           allResults scoring memo · FFAudio shell + AudioToggle ·
│                           data wiring (isFallback/fallbackReason derivation)
├── derive.js               PURE — mood/constellation, predicted defaults, buildBecauseLine,
│                           diversifyTop3, mood-fit floors
├── constants.js            stable context option tables (intention/time/who/energy) + visual tokens
├── useDiscoverData.jsx     read orchestration · film shaping · exclusions · learned context ·
│                           classifyDiscoverDataSource (fallback-source metadata)
├── resultPresentation.js   truthful presentation helpers (moodFilter, buildRuntimeFitLine)
├── sections/               MoodStage · StageNightContext · StageResolve · StagePick ·
│                           TrailerModal · StreamingChip
└── hooks/                  useDiscoverResultActions (writes) · useStreamingProvider (provider load)

e2e/
├── fixtures/discover.js            deterministic Supabase/TMDB interception + write ledger
├── app/discover.e2e.js             authenticated journey E2E (app project)
└── visual-auth/discover.visual.js  authenticated visual baselines (visual-app project)
```

A **reducer / state-machine extraction was audited (F3.11) and deliberately deferred** — the four-stage numeric shell plus a few refs is readable and well protected by 204 unit tests + 9 E2E checks; extraction would be churn without a current pain point. Revisit only if branching complexity grows.

## 6. Trust and data-truth outcome

- Numeric **mood/taste precision removed** from the UI (engine scores remain internal for analytics).
- Recommendation evidence (**because-line**) **returns null when unsupported** — the section is omitted, never filled with filler.
- The **runtime-fit line appears only when the film's runtime is genuinely inside the selected band** (no tolerance, no fabrication).
- **Provider empty** ("Availability not found") and **provider failure** ("Availability unavailable") are distinguished — neither implies the film is unavailable everywhere.
- **Missing synopsis is hidden**, not templated.
- **Missing TMDB id removes the dead Film File action** (a quiet "Film file unavailable" note replaces it).
- Fallback states distinguish **`live_ok` / `live_empty` / `filtered_empty` / `live_error`**, and a fallback recommendation is **visibly labelled** ("Example pick — …").
- **Write success is not shown before the primary write succeeds** — Mark Watched awaits the `user_history` write before confirming and surfaces a retryable error on failure.
- **Analytics failures remain non-blocking** (`updateImpression`/`trackInteraction`/`logSurfaceImpressions` are fire-and-forget with `.catch`).

## 7. Accessibility outcome

- **MoodStage** — `role="group"`, `aria-pressed` per mood, max-three semantics.
- **StageNightContext** — single disclosure (`aria-expanded`/`aria-controls`), `<fieldset>`/`<legend>` groups, `aria-pressed` options.
- **StageResolve** — one polite, atomic `role="status"`.
- **StagePick** — one persistent polite `role="status"` live region narrating pick / promotion / save / watched / exhausted (queue depth never spoken).
- **Targets** — all result actions **and** the AudioToggle are ≥44px; visible focus on every control.
- **Headings** — exactly one top-level `<h1>` in both the result and exhausted states.
- **Semantics** — provider + fallback notes are SR-reachable (fallback note carries `role="note"`); poster alt `"{title} poster"`, provider logo alt `"{name} logo"`; decorative grain/vignette/glow + button icons are `aria-hidden`.
- **TrailerModal** — `role="dialog"`, `aria-modal`, accessible name includes the title, initial focus enters the dialog, Tab/Shift+Tab containment, Escape closes, focus restores to the opener, body scroll locked + restored.
- **Reduced motion** — StageResolve becomes immediate (0ms); the global `@media (prefers-reduced-motion: reduce)` reset neutralizes the remaining ambient loops (starfield, mood-orb).

## 8. Frozen product contracts

- mood maximum = **3**; onboarding mood mapping unchanged.
- context dimensions: **intention · time · who · energy**.
- the preference commit occurs **only** through **Find my film →**; the preference payload (`intention_counts`/`time_counts`/`who_counts`/`energy_counts`/`total_commits`, `onConflict: 'user_id'`) is unchanged.
- StageResolve: **900ms** normal motion, **0ms** reduced motion.
- **one visible pick**; internal **`MAX_PICKS = 15`**; the internal list length is **never exposed**.
- **Not Tonight** and **Already Watched** promote the next ranked result.
- recommendation **scoring/ranking values are unchanged** across all of F3.
- **Open Film File** route remains **`/movie/:tmdbId`**.
- Supabase **tables, event names, and payloads are unchanged**; **no schema/RLS migration** occurred.

## 9. Test and verification outcome

**Unit / component** — Discover **204** tests; full suite **868**. Coverage spans: derivation (`derive.test`), entry behavior (`DiscoverEntry`), mood + timed stages (`DiscoverStages`), optional context (`DiscoverNightContext`), resolve timing (`DiscoverResolve`), result rendering + progression + action writes/errors + provider truth + fallback copy + trailer a11y (`DiscoverResult`), and data-source classification (`useDiscoverData`).

**Authenticated E2E** — **9 passing** (including setup), deterministic across repeated runs: the complete happy journey (no live writes), **Not Tonight** progression, **Save** and **Mark Watched** payloads, the three **fallback** states, **reduced motion + axe**, and the **keyboard / trailer-dialog** flow.

**Visual regression** — public visual **2** (unchanged); authenticated Discover **8** states — desktop **1280×720** (MoodStage · context summary · expanded details · result) and mobile **390×844** (MoodStage · context summary · expanded details · result); **8 Darwin + 8 Linux** baselines. The authenticated visual project (`visual-app`) is **separate** from the public visual coverage, and `npm run test:visual` stays credential-free.

## 10. Interception and backend-safety model (F3.13)

- **Real dev-user authentication only** — Supabase `/auth/v1/**` passes through.
- **All Discover `/rest/v1/**` traffic intercepted** — deterministic per-table reads; writes **recorded + fulfilled in memory** (never reach the backend); unknown write-capable requests **aborted** and recorded.
- **TMDB providers + poster images mocked**; **fixed clock**; **seeded randomness**.
- The **unexpected-write ledger is asserted empty** in every test.
- **Backend integrity verified** — the dev user's `user_discover_preferences.updated_at` and watchlist/history counts were **unchanged** during F3.13.
- **No credentials printed or committed.**

## 11. Readiness verdict

**READY FOR PRIVATE / BETA TESTING.**

- Browser-level evidence is now present (authenticated, intercepted E2E).
- Authenticated visual coverage is now present (8 states × 2 platforms).
- **No P0/P1 Discover defect remains** from the F3.11 audit.
- **No live Discover writes occurred** during verification.

This is **not** a claim of unrestricted public-production readiness. Public-production still requires:

- real **beta-user feedback**;
- **monitoring** actual fallback / provider / error frequency in production;
- **recommendation-quality evidence** across broader user cohorts;
- **operational** response/support;
- **live-traffic** observation;
- a **privacy and security review at launch scale**.

## 12. Deferred register (non-blocking, evidence-driven)

- static fallback-data cleanup (the unused `criticLine` / `twin` / `arc` fields on `FILMS_FALLBACK`, never rendered);
- an optional **retry / refetch** affordance for a live-recommendation failure;
- a **reducer / state-machine extraction** — only if branching complexity grows;
- real **recommendation-quality evaluation** across user cohorts;
- optional **provider freshness / coverage telemetry**;
- **beta-feedback-driven** refinements;
- any **colour-contrast** decisions, tracked separately under the existing project policy.

None of these is a reason for more immediate Discover UI work.

## 13. Closure statement

The **F3 `/discover` redesign is complete**. The route is **private/beta ready**: product experience, architecture, trust, accessibility, fallback truth, authenticated E2E, and authenticated visual coverage have all been addressed and verified. Further Discover work should be driven by **beta evidence or a concrete defect**, not speculative polish. The next product initiative is **`/home`**.
