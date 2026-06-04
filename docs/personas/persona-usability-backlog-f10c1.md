# F10C.1 — Persona Usability Backlog (classified)

> **Phase F10C.1. A controlled, docs-only backlog from the F10C persona pilot — NOTHING is
> acted on here.** This classifies the [pilot findings](persona-pilot-findings-f10c.md) into
> four buckets so they can be triaged later, in order, without anyone mistaking a **synthetic**
> observation for a green light. **Synthetic personas are archetypes, not real users** — no item
> below is real-user validation, and **none of this unblocks F8C.** No product/engine/schema/
> auth/UI/package change is made in this phase.

**Status:** ✅ backlog classified. **Date:** 2026-06-04. **Engine:** frozen `2.17`.

## How to read this

- **Severity:** `P0` (blocking/trust-breaking) · `P1` (significant friction) · `P2` (polish) ·
  `Insight` (product/strategy/rec-quality signal — *log, don't act*).
- **Validate-first rule:** anything touching the *pick, the cold-start experience, or trust*
  must be **confirmed with real testers (Wave 1+) before any change** — synthetic reactions only
  tell us *what to watch for*.
- **No-act rule (this phase):** even "safe UX candidates" are **not** implemented here. They're
  queued for a *future, explicitly-approved* UI phase, and only after real-user validation where noted.
- A finding being **rec-quality** (the pick itself) is an **Insight for F8C**, which stays blocked —
  never a scoring change.

---

## Bucket 1 — Validate with real users (do not change until confirmed)

These are the highest-value pilot signals, but they're **hypotheses**. The next step for each is a
real-user observation in the preview, **not** a code change.

| ID | Finding | Source persona(s) | Evidence | Severity | Real-user validation required? | Recommended next action |
|---|---|---|---|---|---|---|
| **B1** | **Cold-start re-seeding weakness** — "three short questions" underrepresents deep taste; no diary/Trakt import → warm users start cold; "taste-deep" is weakest on night 1 | P1 Letterboxd, P15 cold-start (also P5, P14) | Landing promises "three short questions. one film."; onboarding seeds only a few films (code-grounded) | **Insight (high)** | **YES** — measure night-1 perceived fit + onboarding drop-off with real cold + warm testers | In Wave 1, watch the onboarding→first-pick funnel + ask "did night 1 feel like it knew you?"; do **not** redesign onboarding yet |
| **B2** | **Cold Briefing shows no "Why this pick"** — `WhyThisPick` is null-safe (renders nothing without a grounded reason), so a brand-new user's first pick can read as unjustified exactly when trust is lowest | P3 Netflix, P15 cold-start | `WhyThisPick.jsx`: "NULL-SAFE BY DESIGN… we never fabricate a 'why'" → returns null | **Insight / P2** | **YES** — does a real new user read the no-why pick as *honest* or as *unjustified*? | Decide the microcopy question (B5) only after a real new user reacts; keep the no-fabrication behavior |
| **B3** | **`/home` supporting-tail re-scroll risk** — carousels below the Briefing could re-create the Netflix grid for low-patience users | P3 Netflix, P7 Prime | Anti-drift tell ("a wall of carousels as the *primary* surface"); tail not live-verified in the pilot | **Insight (anti-drift)** | **YES** — observe whether real users treat the Briefing as primary or fall into the tail | Live-verify Briefing-primacy during Wave 1 smoke; if the tail competes, that's a future IA fix (gated) |

## Bucket 2 — Safe UX candidate *after* validation (queued, not built)

Plausibly low-risk copy/affordance changes — but **not implemented in this phase**, and each gated on
its Bucket-1 validation landing first. All are **microcopy/guidance**, no engine, no new surface.

| ID | Candidate | Tied to | Severity | Validation gate | Recommended next action |
|---|---|---|---|---|---|
| **B5** | **First-night "why may be thin" microcopy** — an honest cold-state line on the Briefing (e.g. "Still learning your taste — here's a strong starting pick") *instead of nothing*, so the cold pick reads as honest-not-unjustified | B2 | **P2** | after B2 confirms real users want it | Draft copy options in a future UI phase; A/B against the current null-safe blank; never fabricate a reason |
| **B6** | **Onboarding re-seeding / "bring your taste" prompt** — an honest nudge for users with existing history ("logged a lot elsewhere? add a few favorites so night 1 fits"), *without* building an importer | B1 | **P2** | after B1 confirms the gap matters to real power users | Copy/affordance only; the actual import (B-defer) stays deferred |
| **B7** | **Clearer "teach FeelFlick" guidance** — make it legible that save/skip/rate *visibly* sharpen tomorrow's pick (the loop), so users feel heard | B1, B2 | **P2** | after Wave-1 feedback on whether the loop feels legible | Microcopy on the Briefing/Profile; aligns with doctrine "skipping visibly teaches the engine" |

## Bucket 3 — Protect / do not regress (guardrails, already-correct)

These are **wins** the pilot surfaced. They are not tasks — they're **invariants to defend** in every
future change. Any PR that weakens one is a regression.

| ID | Invariant | Evidence (real copy/behavior) | Why it matters |
|---|---|---|---|
| **B8** | **Null-safe non-fabrication** of the pick's "why" | `WhyThisPick.jsx` returns null when there's no grounded reason | Honesty over persuasion; trust moat (P1/P14 respected it) |
| **B9** | **ViewerNotes honesty** | "Illustrative impressions FeelFlick generated… **not real reviews or quotes from real critics**" | No fabricated critic authority (P10/P14 standout win) |
| **B10** | **DnaConfidence honesty** | "**taste evidence… not a score of you, and not a measure of accuracy**"; tiers "Still learning / Getting sharper / Reading you well" | Honest cold-state; no fake confidence (P12/P15) |
| **B11** | **No fake social proof** | no fabricated counts / "people like you" in the surfaces inspected | Doctrine + CLAUDE.md "Never Do #4" |
| **B12** | **Honest match % gloss** | PrimaryCaseCard: "NN% · match · **how it fits your taste so far**" | Number framed as evidence, not a grade (P2 TMDB) |

> Recommended action for Bucket 3: add these to the review checklist / `design-system-guard` mental
> model so they're consciously preserved. (No file change in this phase.)

## Bucket 4 — Defer / not now (out of scope by doctrine)

Real integrations the personas asked for. All are **deliberately out of scope** ([do-not-become](../product-doctrine.md#do-not-become-list)
/ surface hierarchy) or large future bets. The only near-term action is **graceful "not yet" copy** (a B-defer-copy item),
not the integration.

| ID | Deferred item | Source persona | Why deferred | Near-term action |
|---|---|---|---|---|
| **D1** | **Real diary / logging home-base** | P1 Letterboxd | not-a-Letterboxd-clone; logging is substrate | none (set expectation in copy) |
| **D2** | **Trakt / Letterboxd import** | P1, P5 | large; risks "taste-deep" shortcut + maintenance | none now; revisit if cold-start (B1) proves a real blocker for many testers |
| **D3** | **Plex / personal-library integration** | P8 Plex | out of scope; ownership model differs | graceful "not supported yet" if asked |
| **D4** | **JustWatch / availability ("where can I watch")** | P4 JustWatch | where-to-watch is convenience, not the loop | consider an honest "not yet" line; integration deferred |
| **D5** | **Social / taste-twins expansion** | P10 Reddit, P13 couple | `/people` is parked — compounds only post-scale | keep minimal pre-scale (doctrine) |
| **D6** | **Multi-user / "the couple" mode** | P13 couple | no multi-user model today | log as a real future bet; single-pick still helps a couple decide |

## Summary by bucket

| Bucket | Count | Acted on this phase? |
|---|---|---|
| 1 — Validate with real users | 3 (B1–B3) | ❌ no — observe in Wave 1 |
| 2 — Safe UX candidate (after validation) | 3 (B5–B7) | ❌ no — queued, gated |
| 3 — Protect / do not regress | 5 (B8–B12) | ✅ documented as invariants (no code) |
| 4 — Defer / not now | 6 (D1–D6) | ❌ no — out of scope |

**Nothing in this backlog is implemented in F10C.1.** Buckets 1–2 wait on real-user validation;
Bucket 3 is a guardrail list; Bucket 4 is deferred. **F8C stays blocked.**

---

## Next persona-walkthrough queue (future runs — not run here)

Run these via the [prompt pack](claude-persona-test-prompts-f10c.md) in a later phase, to widen
coverage of the wedge's hardest cases. **Synthetic; for UX inspection only; will not unblock F8C.**

| Order | Persona | Why next | Primary thing it stress-tests |
|---|---|---|---|
| 1 | **P15 Cold-start** | directly probes B1/B2 (the top pilot signal) | cold-state honesty + first-pick believability |
| 2 | **P14 Anti-slop cinephile** | the harshest honesty/quality test (trust moat) | fabrication, mediocrity, recency bias |
| 3 | **P13 The couple** | shared-decision gap (D6) | single-pick as a tiebreaker for two |
| 4 | **P4 JustWatch availability-first** | the where-to-watch boundary (D4) | does "no availability" frustrate or read as honest |
| 5 | **P8 Plex collector** | scope-honesty (D3) | how gracefully the app says "not yet" |

> When real testers arrive (Wave 1), **real-user findings outrank every synthetic one** — fold the
> two streams together, with real users as the tiebreaker, before any Bucket-2 change is built.
