# F10D — Synthetic Outcome Matrix

> ⚠️ **SYNTHETIC BEHAVIORAL PREDICTION — NOT measured outcome data.** This mirrors the Wave-1
> outcome-capture lens **on purpose** (so we know what to measure), but every number here is a
> *simulated guess* from the persona schema + observed product behavior. **Do NOT compare these to
> production SQL as if they were real.** Use them only to decide **what to watch for** in the real
> preview. **Does not unblock F8C.** Per the [protocol](full-synthetic-simulation-protocol-f10d.md).

**Status:** ✅ matrix built (synthetic). **Date:** 2026-06-04. **Engine:** frozen `2.17`.

---

## 1. Per-persona behavioral prediction (Step 4 — synthetic "Wave-1 checklist")

> `Y` likely · `~` maybe · `N` unlikely. **Scores:** Trust/Return 1–5 (5 best); **Friction 1–5
> (1 = smooth, 5 = heavy).** All **predicted**, not observed.

| # | Persona | Signed in? | Onboarded? | 1st pick? | Why noticed? | Film File? | Saved? | Skipped? | Watched? | DNA? | Feedback? | Likely issue | Ret | Tru | Fri |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---|:-:|:-:|:-:|
| P1 | Letterboxd | Y | Y | Y | Y | Y | ~ | ~ | ~ | Y | Y | Insight (import) | 4 | 3 | 3 |
| P2 | TMDB | Y | Y | Y | Y | Y | ~ | ~ | ~ | Y | ~ | Insight (evidence depth) | 3 | 4 | 2 |
| P3 | Netflix scroller | ~ | ~ | Y | N | N | ~ | ~ | ~ | N | N | P2 (gate) + Insight (cold no-why) | 3 | 3 | 3 |
| P4 | JustWatch | Y | Y | Y | Y | Y | N | Y | N | N | ~ | Insight (where-to-watch) | 2 | 3 | 4 |
| P5 | Trakt | Y | Y | Y | Y | Y | ~ | ~ | ~ | Y | ~ | Insight (no-repeat/tracking) | 3 | 3 | 3 |
| P6 | Apple TV | Y | Y | Y | Y | Y | ~ | ~ | ~ | Y | ~ | Insight (sustain craft) | 4 | 4 | 2 |
| P7 | Prime | ~ | ~ | Y | ~ | N | ~ | ~ | Y | N | N | P2 (onboarding effort) | 3 | 3 | 3 |
| P8 | Plex | Y | Y | Y | Y | ~ | N | ~ | N | Y | ~ | Insight (library) | 2 | 3 | 4 |
| P9 | YouTube trailer | N | ~ | ~ | N | N | N | ~ | N | N | N | P2 (time-to-visual) | 2 | 2 | 4 |
| P10 | Reddit | Y | Y | Y | Y | Y | ~ | ~ | ~ | Y | Y | Win (no-fake-proof) | 4 | 4 | 2 |
| P11 | Fried ⭐ | Y | ~ | Y | ~ | ~ | Y | ~ | Y | ~ | ~ | Insight (cold no-why, tail) | 4 | 4 | 2 |
| P12 | Curious ⭐ | Y | Y | Y | Y | Y | Y | ~ | Y | Y | Y | Insight (cold DNA thin) | 4 | 4 | 2 |
| P13 | Couple ⭐ | Y | Y | Y | Y | Y | Y | ~ | Y | ~ | ~ | Insight (multi-user) | 3 | 3 | 3 |
| P14 | Anti-slop ⭐ | Y | Y | Y | Y | Y | ~ | Y | ~ | Y | Y | Insight (pick quality, import) | 4 | 4 | 3 |
| P15 | Cold-start ⭐ | ~ | Y | Y | N | ~ | ~ | ~ | ~ | Y | ~ | Insight-high (cold no-why) | 3 | 3 | 3 |
| P16 | Warmed-up ⭐ | Y | (done) | Y | Y | Y | Y | ~ | Y | Y | Y | Insight (repeated-pick) | 4 | 5 | 2 |

## 2. Simulated journey-funnel (cohort-level — NOT data)

> Rough *predicted* conversion shape across the 16 personas. **Synthetic.**

| Synthetic stage | Predicted rate | Reading |
|---|---|---|
| Landing → understands the wedge (10s) | **High** (~13/16) | clarity is a strength; non-target personas still "get it" |
| Understands → signs in | **Med** (~11/16) | gate + Google; impatient archetypes hesitate (P3/P7/P9) |
| Signs in → completes onboarding | **Med** (~10/16) | 4 steps; convenience/trailer personas may drop |
| Onboarding → first pick viewed | **High** (~14/16 of those onboarded) | the payoff moment |
| First pick → **"Why this pick" noticed** | **Low–Med** | **null on cold-start** → invisible for new users (P3/P11/P15) |
| First pick → **trusted** | **NOT OBSERVED** | depends on the *real* pick — the core unknown |
| Pick → opened / saved | **Med** | targets save (P11/P12/P16); scrollers maybe |
| Pick → skipped | **Med** | healthy signal; high for P4 (can't watch) / P14 (if slop) |
| Pick → watched | **NOT OBSERVED** | the real conversion; needs a real session |
| Viewed Profile / DNA | **Med** | targets + skeptics (P10/P12/P14/P16); scrollers no |
| Return-tomorrow intent | **Med–High for targets**, low for non-targets | the ritual forms for P11/P12/P16 |
| Feedback likely | **Med** | analytical/skeptic personas most vocal (P1/P10/P14) |

## 3. Segment breakdowns (simulated tendencies — NOT data)

> Qualitative direction only (▲ higher / ◼ mixed / ▼ lower), not measured.

### Platform archetype vs FeelFlick target
| Segment | Shown→trusted | Return intent | Friction | Note |
|---|:-:|:-:|:-:|---|
| Platform archetypes (P1–P10) | ◼ | ◼ | ▲ | they judge FeelFlick vs their current tool's strength |
| **FeelFlick targets (P11–P16)** | ▲ | ▲ | ▼ | the wedge is built for them — highest predicted trust/return |

### Cold vs warm
| Segment | Shown→trusted | Cold-start drop-off | Note |
|---|:-:|:-:|---|
| **Cold** (P15, new P1/P3/P11) | ▼ | **▲ (highest predicted drop-off)** | onboarding + cold no-"why" = the make-or-break |
| **Warm** (P16, logged P5/P14) | ▲ | ▼ | DNA reads "Reading you well"; **predicted trust increase** as history compounds |

### Casual vs cinephile
| Segment | Trust driver | Friction driver |
|---|---|---|
| Casual (P3/P7/P9/P11) | fast, safe, low-effort pick | sign-in/onboarding gate; niche picks |
| Cinephile (P1/P6/P14) | honesty + specificity + non-mediocrity | cold-start underrepresentation; any slop/fakery |

### Solo vs couple
| Segment | Fit |
|---|---|
| Solo (most) | ▲ — the product models one taste well |
| Couple (P13) | ◼ — single pick helps as a tiebreaker, but no dual-taste model |

### Availability-first vs taste-first
| Segment | Fit |
|---|---|
| Availability-first (P4) | ▼ — no where-to-watch → dead end (by doctrine) |
| Taste-first (P1/P12/P14) | ▲ — the whole point; honesty seals it |

### Tracker vs non-tracker
| Segment | Fit |
|---|---|
| Tracker (P5/P8) | ◼ — Diary exists but isn't a tracking/library home; wants no-repeat proof |
| Non-tracker (P11/P12) | ▲ — doesn't miss tracking; just wants tonight's pick |

## 4. The three numbers that matter (and why they're blank here)

| Metric | Synthetic value | Real source (Wave 1) |
|---|---|---|
| shown → **watched** | **NOT OBSERVED** | `recommendation_impressions.marked_watched` (windowed) |
| shown → **trusted** (proxy: saved + not skipped + return) | **NOT OBSERVED** | save/skip flags + feedback form |
| cold-start drop-off | **predicted high** | onboarding→first-pick funnel + real cohort |

> These are the numbers F8C actually needs — and they are **exactly** what a synthetic cohort cannot
> produce. The matrix above tells us **what to instrument and watch**; only Wave 1 fills the blanks.

## 5. How to use this matrix

- As a **checklist of what to measure** in Wave 1 (the [watch items](real-preview-watch-items-from-simulation-f10d.md) operationalize it).
- To **prioritize observation** on the high-drop-off, high-impact stages (cold-start, the no-"why" pick, the tail).
- **Never** as evidence, a baseline, or an F8C input. Real numbers replace every cell here.
