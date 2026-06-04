# F10D — Synthetic UX Backlog (prioritized)

> **SYNTHETIC backlog from the 16-persona cohort — NOTHING is implemented.** Extends the
> [F10C.1 backlog](persona-usability-backlog-f10c1.md) with full-cohort weight. **Synthetic ≠
> real-user validation.** Buckets 1–3 are **gated on Wave-1 real-user confirmation**; Bucket 4 is
> deferred; Bucket 5 is a protect-list. **Does not unblock F8C.** Per the
> [protocol](full-synthetic-simulation-protocol-f10d.md).

**Status:** ✅ classified. **Date:** 2026-06-04. **Engine:** frozen `2.17`.
**Confidence** = how strongly the *synthetic* cohort points at it (still a hypothesis).

---

## Bucket 1 — Validate in Wave 1 before acting (do not change yet)

| ID | Title | Source personas | Evidence | Journey step | Severity | Confidence | Validation needed | Next action | ⚠️ Not-to-do |
|---|---|---|---|---|---|---|---|---|---|
| **D-1** | Cold first pick shows **no "Why this pick"** | P3,P11,P15 | `WhyThisPick.jsx` null-safe → returns null | first pick / why | Insight·P2 | High | Does a real new user read it as honest or unjustified? | Observe + ask in Wave 1 | Don't fabricate a reason; keep null-safe until validated |
| **D-2** | **Cold-start can't represent deep taste** (no import) | P1,P5,P14,P15 | onboarding = 4 steps; no Letterboxd/Trakt import | onboarding | Insight | High | Do power users feel night-1 as a dealbreaker? | Watch onboarding→pick + ask power testers | Don't build an importer on a hunch (Bucket 4) |
| **D-3** | **`/home` tail carousels** risk re-scroll | P3,P7,P11 | `sections-bottom.jsx` Rows ("Pick up where you paused." etc.) | post-pick `/home` | Insight (anti-drift) | Med | Do real users treat the Briefing as primary or fall into the tail? | Live-verify Briefing-primacy in Wave-1 smoke | Don't remove the tail blindly; it self-hides when empty |
| **D-4** | **Sign-in + 4-step onboarding gate value** | P3,P7,P9 | landing CTA "Start free →" → Google → onboarding before any pick | T2–T3 | P2 | Med | Real funnel drop-off at sign-in/onboarding | Measure the funnel | Don't drop sign-in/onboarding without the data |
| **D-5** | **Real pick fit is unmeasured** (the core) | all | the served pick is NOT OBSERVED here | first pick | Insight→F8C | High (that it matters) | Does the real pick fit casual *and* cinephile? | Capture in Wave-1 SQL + feedback | **F8C blocked — measure, never tune now** |

## Bucket 2 — Safe microcopy candidates (after validation; queued, not built)

| ID | Title | Source | Evidence | Step | Severity | Confidence | Validation gate | Next action | ⚠️ Not-to-do |
|---|---|---|---|---|---|---|---|---|---|
| **D-6** | Honest **cold-state "why" line** ("Still learning your taste — here's a strong starting pick") instead of nothing | P3,P11,P15 | D-1 | first pick | P2 | Med | after D-1 confirms users want it | draft copy options; A/B vs blank | never fabricate a *specific* reason |
| **D-7** | Align landing **"three short questions"** with the real 4-step onboarding | P3,P7,P15 | landing copy vs `onboarding/steps/` (4) | landing/onboarding | P2 (copy) | High | low-risk; still confirm cheaply | fix the count or the flow copy | don't overstate brevity |
| **D-8** | **"Bring your taste" nudge** for users with external history (copy only, no importer) | P1,P5 | D-2 | onboarding | P2 | Med | after D-2 | honest prompt to add a few favorites | the actual import stays deferred (D-15) |
| **D-9** | Clearer **"teach FeelFlick"** guidance (save/skip/rate sharpen tomorrow) | P5,P11,P16 | doctrine "skipping visibly teaches the engine" | Briefing/Profile | P2 | Med | after Wave-1 loop-legibility check | microcopy on the loop | don't imply more learning than happens |
| **D-10** | Graceful **"not yet"** copy for scope gaps (where-to-watch, library) | P4,P8 | silent gaps observed | Film File / pick | P2 | Med | after gap-frustration is seen | one honest line, no integration | don't promise a date |

## Bucket 3 — Product-strategy candidates (bigger; validate hard first)

| ID | Title | Source | Evidence | Severity | Confidence | Validation needed | Next action | ⚠️ Not-to-do |
|---|---|---|---|---|---|---|---|---|
| **D-11** | **Reduce time-to-first-pick** (lighter/optional onboarding, value-before-commitment) | P3,P7,P9,P11 | gate friction (D-4) | P1 | Med | Wave-1 funnel + does a lighter cold pick still feel believable? | design options *after* data; gated UI phase | don't gut the taste-seed that makes night-1 work |
| **D-12** | **Repeated-pick fatigue** safeguards surfaced to the user | P5,P16 | weighted-random + cooldowns (code) but felt-experience NOT OBSERVED | Insight | Med | warm real user over multiple nights | watch déjà-vu in Wave 1; **rec-quality → F8C-gated** | don't tune scoring now |
| **D-13** | **Couple / shared-decision** consideration | P13 | single-user model only | Insight | Low | is single-user enough for couples? | log as a real future bet | don't build multi-user speculatively |

## Bucket 4 — Defer / out of scope (by doctrine)

| ID | Item | Source | Why deferred | Near-term action |
|---|---|---|---|---|
| **D-14** | Diary / logging home-base | P1 | not-a-Letterboxd-clone | expectation-setting copy only |
| **D-15** | Letterboxd / Trakt **import** | P1,P5 | large; risks "taste-deep" shortcut | revisit only if D-2 proves a real blocker for many |
| **D-16** | Plex / personal-library integration | P8 | ownership model differs; out of scope | graceful "not yet" |
| **D-17** | JustWatch / availability ("where to watch") | P4 | convenience, not the loop | honest "not yet" line; defer integration |
| **D-18** | Social / taste-twins expansion | P10,P13 | `/people` parked; compounds post-scale | keep minimal pre-scale |
| **D-19** | Multi-user / couple mode | P13 | no multi-user model | future bet, not now |

## Bucket 5 — Protect / do not regress (invariants)

| ID | Invariant | Evidence | Why |
|---|---|---|---|
| **D-20** | Null-safe **non-fabrication** of the "why" | `WhyThisPick.jsx` returns null | honesty > persuasion (P1/P10/P14) |
| **D-21** | **ViewerNotes** honesty disclaimer | "not real reviews or quotes from real critics" | no fake critic authority |
| **D-22** | **DnaConfidence** honesty | "taste evidence… not a score of you" | no fake confidence |
| **D-23** | **Honest match gloss** | "% … how it fits your taste so far" | number as evidence, not a grade |
| **D-24** | **No fake social proof** anywhere | none observed | doctrine + "Never Do #4" |
| **D-25** | **Discover stays complementary** (small set, not a grid) | "pick between three" | anti-scroll; not a second recommender |
| **D-26** | **Briefing stays the primary surface** | IA / surface hierarchy | anti-scroll; the tail must stay subordinate (cf. D-3) |

## Summary

| Bucket | Count | Acted on now? |
|---|---|---|
| 1 — Validate in Wave 1 | 5 (D-1…D-5) | ❌ observe only |
| 2 — Safe microcopy (after validation) | 5 (D-6…D-10) | ❌ queued |
| 3 — Product strategy | 3 (D-11…D-13) | ❌ validate hard first |
| 4 — Defer | 6 (D-14…D-19) | ❌ out of scope |
| 5 — Protect | 7 (D-20…D-26) | ✅ documented invariants (no code) |

**Nothing implemented in F10D.** Buckets 1–3 wait on real users; Bucket 4 deferred; Bucket 5 is a
guardrail list. **F8C stays blocked.** Cross-referenced from the
[F10C.1 backlog](persona-usability-backlog-f10c1.md).
