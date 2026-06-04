# F10D — Synthetic Cohort Findings (cross-persona)

> **SYNTHETIC cohort report across all 16 personas — NOT real-user validation.** Aggregates
> [the per-persona findings](full-synthetic-persona-findings-f10d.md). Patterns are **hypotheses**
> to confirm/deny with real testers (Wave 1+). **Does not unblock F8C.** Per the
> [protocol](full-synthetic-simulation-protocol-f10d.md).

**Status:** ✅ cohort synthesized. **Date:** 2026-06-04. **Engine:** frozen `2.17`.

---

## Executive summary

The wedge **resonates most with exactly who it's built for.** The FeelFlick-target personas
(P11 Fried, P12 Curious, P14 Anti-slop, P16 Warmed-up) score highest on simulated trust + return;
the lowest scorers (P4 JustWatch, P8 Plex, P9 YouTube) are archetypes the [doctrine](../product-doctrine.md#do-not-become-list)
deliberately doesn't serve. That's the *right* shape: strong for the patient, weak for the
availability/library/instant-gratification crowd.

The simulation's single loudest signal is **cold-start**: every target persona's experience hinges
on a moment the product is honest-but-thin (onboarding + the first pick), and that's where trust is
won or lost. The single loudest *strength* is the **honesty layer** — it converts the most skeptical
archetypes (P1, P10, P14) instead of repelling them. Neither finding is real-user-validated; both are
**top Wave-1 watch-items.**

## Top 10 cross-persona findings (simulated)

| # | Finding | Personas | Type |
|---|---|---|---|
| 1 | **Cold-start is the make-or-break** — onboarding + the first pick decide adoption for every target persona | P1,P11,P12,P14,P15,P16 | Insight (high) |
| 2 | **Honesty layer is the top trust-builder** — null-safe "why", "not real reviews", "not a score of you", honest match gloss disarm skeptics | P1,P2,P10,P12,P14 | **Strength (protect)** |
| 3 | **Cold Briefing shows no "Why this pick"** (null-safe) → first pick can read as unjustified when trust is lowest | P3,P11,P15 | Insight / P2 |
| 4 | **No external-taste import** → deep/warm users start cold; "taste-deep" weakest on night 1 | P1,P5,P14 | Insight |
| 5 | **Sign-in + 4-step onboarding gate the first pick** → drop-off risk for impatient archetypes | P3,P7,P9 | P2 |
| 6 | **`/home` supporting-tail carousels** risk re-creating the scroll the product promises to kill | P3,P7,P11 | Insight (anti-drift) |
| 7 | **Onboarding is 4 steps, landing promises "three short questions"** → small expectation mismatch | P3,P7,P15 | P2 (copy) |
| 8 | **Out-of-scope needs surface as silent gaps** (where-to-watch, library, diary home) → need graceful "not yet" copy | P1,P4,P8 | Insight |
| 9 | **The single justified pick genuinely ends decision paralysis** (incl. a couple's standoff) | P3,P11,P13 | **Strength** |
| 10 | **Pick quality/fit is unmeasured here** — the thing that actually decides everything is NOT OBSERVED (needs a real account) | all | Insight → F8C (blocked) |

## Recurring friction patterns

- **The gate before value** (sign-in + onboarding before any pick) — felt by impatient archetypes (P3/P7/P9).
- **Cold thinness** — onboarding can't represent deep taste; first pick has no "why" (P1/P14/P15).
- **Silent scope gaps** — where-to-watch (P4), library (P8), diary/import (P1/P5) just aren't there, with no "not yet."
- **Re-scroll temptation** — the carousel tail under the Briefing (P3/P7).

## Recurring trust-builders

- **Non-fabrication everywhere** — the product would rather show *nothing* than a fake reason/review/score (P1/P10/P14).
- **Honest numbers** — match "% … how it fits your taste so far"; DNA "taste evidence… not a score of you" (P2/P12).
- **An editorial voice ("M.")** that reads like a person, not marketing (P6/P10).
- **The single pick as a decision, not a list** — relief for the fatigued (P3/P11/P13).

## Product strengths (simulated)

1. The wedge is legible in 10 seconds for its target ("one pick, with the article that makes its case").
2. The honesty/anti-fabrication stack is a genuine differentiator vs. "algorithmic slop."
3. Mood-first framing + the anti-scroll hook ("23 minutes picking, watched thirty") land emotionally.
4. Craft/typography reads as considered (Apple-grade ambition).

## Product weaknesses (simulated)

1. Cold-start underrepresents deep taste; no import path.
2. Cold first pick lacks a visible "why."
3. Value gated behind sign-in + a 4-step onboarding.
4. Supporting-tail carousels risk anti-scroll drift.
5. Scope gaps presented silently (no graceful "not yet").

## Wedge-fit analysis

| Wedge clause | Cohort read |
|---|---|
| **Mood-first** | ✅ resonates (P11/P12); the front door is mood, not a search box |
| **Taste-deep** | ⚠️ weakest on night 1 (cold-start/import) — strongest for the warmed-up (P16) |
| **Single justified pick** | ✅ the strongest, most-loved property (P3/P11/P13/P14) — *iff* the "why" is present |
| **Anti-scroll** | ✅ in the Briefing; ⚠️ undercut by the `/home` tail carousels |
| **Makes its case** | ✅ honest + specific when warm; ⚠️ silent (no "why") when cold |

## Anti-scroll: success / failure

- **Success:** the Briefing is one decision; Discover surfaces a *small* set ("pick between three"), not a grid; no infinite feed.
- **Failure risk:** the `/home` supporting tail ("Pick up where you paused.", "What your twins are watching.", "Your taste, taking shape.") is exactly the carousel pattern the doctrine warns against as a *primary* surface — it must stay visibly secondary. **Validate live.**

## Onboarding findings

- 4 steps (genres → mood → movies → rating). Good for the curious (a fun taste quiz); heavy for convenience-seekers; thin for cinephiles; longer than the landing's "three short questions" promise. The value-before-commitment principle holds *only if* the first pick lands.

## Tonight / Briefing findings

- The single pick + "M."'s note is the product's heart and its strongest draw. **WhyThisPick is null-safe** — a deliberate honesty choice that, on cold-start, leaves the first pick unexplained. The biggest single lever on first-night trust.

## Film File findings

- **PrimaryCaseCard** ("FeelFlick's read", honest match gloss) + **ViewerNotes** ("not real reviews or quotes from real critics") are standout trust-builders, especially for skeptics. Low-patience personas may never reach them.

## Cinematic DNA findings

- **DnaConfidence** honesty ("taste evidence… not a score of you"; "Still learning") is broadly trusted and disarms the "is this fake?" objection. It *under*-represents users with deep external history until they re-log.

## Platform-switching findings

- **Most-switchable:** P11 Fried, P12 Curious, P16 Warmed-up — the wedge directly beats their status quo.
- **Conditional:** P1 Letterboxd, P10 Reddit, P14 Anti-slop — switch *iff* picks prove genuine taste + honesty.
- **Unlikely (by design):** P4 JustWatch (needs availability), P8 Plex (needs library), P9 YouTube (needs instant visual).

## Likely retention drivers (simulated)

- A night-1 pick that genuinely fits (the gate to everything).
- The compounding loop (P16) — "it knows me better each week."
- The honesty layer keeping skeptics from bouncing.
- The ritual: mood → one pick → watched, no scroll.

## Likely abandonment drivers (simulated)

- A cold first pick that feels random/unjustified.
- A mediocre/popular or repeated pick (P14/P16) — *rec-quality, F8C-gated*.
- The sign-in/onboarding gate (impatient personas).
- Silent scope gaps with no "not yet" (P4/P8).
- Falling back into the tail carousels (anti-scroll drift).

## Risk matrix (simulated likelihood × impact on the wedge)

| Risk | Likelihood | Wedge impact | Priority |
|---|---|---|---|
| Cold first pick feels unjustified (no "why") | High | High (first-night trust) | **Validate first** |
| Cold-start can't represent deep taste (no import) | High | Med–High | Validate |
| `/home` tail re-introduces scrolling | Med | High (anti-scroll) | Validate live |
| Sign-in/onboarding drop-off | Med | Med | Validate (funnel) |
| Pick is mediocre/popular/repeated | Unknown (NOT OBSERVED) | Very High | F8C-gated — measure, don't tune |
| Scope gaps frustrate (availability/library) | Med (non-target) | Low–Med | Defer + "not yet" copy |

## What to validate with real users (→ [watch items](real-preview-watch-items-from-simulation-f10d.md))

1. Does a **real night-1 pick** actually fit a casual *and* a cinephile? (the NOT OBSERVED core.)
2. Does the **cold no-"why"** pick read as honest or unjustified to a real new user?
3. Does the **`/home` tail** keep the Briefing primary, or invite scrolling?
4. **Sign-in → onboarding → first-pick** drop-off for impatient users.
5. Do power users feel the **import gap** as a deal-breaker?
6. For the warmed-up user: does it **compound** + **never repeat**?

> Every line above is **synthetic**. Real Wave-1 findings override all of it.
