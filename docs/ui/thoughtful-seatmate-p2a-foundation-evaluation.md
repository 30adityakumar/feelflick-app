# Thoughtful Seatmate P2A — Foundation Neutrals: Evaluation Evidence (closed — outcome recorded)

> Evidence packet for the P2A — Foundation Neutrals experiment: which neutral
> *temperature* should anchor the Thoughtful Seatmate foundation. The experiment
> ran in an isolated, **un-merged** Design Lab prototype; the screenshot bundle,
> capture tooling, ZIP, and the variant key live **outside this repository** and are
> not copied here. This document records the method and the objective,
> controlled-variable evidence, followed by the final outcome.
>
> The experiment is **closed**: the blind scorecard and objective reconciliation
> were completed and locked, then the variant→candidate mapping was revealed. The
> formal decision is [ADR 015](../decisions/015-thoughtful-seatmate-p2a-foundation.md).
> The body below records the experiment as it was *conducted* (blind, sealed); the
> revealed mapping, scores, reconciliation, and accepted values are in the
> **Final outcome** section at the end.

**Status:** Closed — blind review + objective reconciliation complete; decision
recorded in [ADR 015](../decisions/015-thoughtful-seatmate-p2a-foundation.md).
**Date:** 2026-06-14.
**Predecessor:** [ADR 014](../decisions/014-thoughtful-seatmate-p1-core-voice.md) fixed the core voice (Inter). P2A holds Inter fixed and isolates the foundation neutral.

---

## Experiment question

> What neutral **temperature** should anchor the Thoughtful Seatmate foundation —
> the current warm graphite, a more **neutral** graphite, or a **warmer** graphite —
> judged on reading comfort, intentional character, surface hierarchy, semantic and
> contextual-colour coexistence, and action clarity with the warm cue disabled?

### Hypothesis

> A single foundation neutral can feel like an intentional, filmic warm-neutral —
> calm, legible, intentional, and film-literate — **without** tipping into
> sepia/brown or cold slate, and **without** depending on a warm decision cue to make
> the primary action obvious.

## Candidates (constructed, not hand-picked)

Three foundation candidates were derived programmatically in OKLCH so they could be
compared on **temperature alone**:

- the current **P1 control** foundation, included as an anchor;
- a **more neutral** graphite — reduced warm chroma, no blue/slate, a restrained off-white;
- a **warmer** graphite — a modest umber increase, deliberately short of brown/sepia/plum.

All three were built on a **shared OKLCH lightness ladder**: each foundation role
(canvas, the three surfaces, the three text tones, the two borders, the neutral
action fill/text, the focus colour) holds the **same lightness `L`** across
candidates, while chroma `C` and hue `H` vary. Candidates therefore differ by
**temperature, not brightness** — the precondition for a fair single-variable read.
Out-of-gamut values were resolved by reducing chroma, never by shifting lightness.
Exact per-candidate OKLCH and sRGB values are recorded in the sealed key; the
per-variant values (keyed X/Y/Z only) are in the post-score objective-evidence
bundle's `metrics.csv`.

## Controlled variables

Candidate definitions were restricted to the **twelve-role foundation neutral set**:
`--p2-canvas, --p2-surface-1, --p2-surface-2, --p2-surface-raised, --p2-text-primary,
--p2-text-secondary, --p2-text-muted, --p2-border-subtle, --p2-border-strong,
--p2-neutral-action-fill, --p2-neutral-action-text, --p2-neutral-focus`.

**Eleven** of these roles differed between at least two candidates;
`--p2-neutral-action-text` remained fixed at `#221b13` across all three (P1 control,
warmer graphite, neutral graphite) and therefore functioned as a control. No styling
values outside this twelve-role system differed — twelve roles comprise the selected
foundation, eleven were experimentally varied, and one remained fixed within the
experiment.

Held identical across all three (fixed controls): Inter; the component tree; all
content and fixtures; layout, breakpoints, spacing, type scale and weights;
line-heights and letter-spacing; poster crops; the primary-action structure;
interaction and motion; the **semantic palette** (rating amber, error red, success
green, info); and the **contextual film-colour ("aura") algorithm and a single
fixed strength**. The P1 **warm decision cue is disabled** — selected states are
ivory-only and the rating amber is never reused as a brand/selection signal.

**Verified objectively** (read from the rendered DOM, all three variants):

- Geometry & typography **identical** across X/Y/Z — font-family, size, weight,
  line-height, letter-spacing, min-height and radius matched on every probed
  selector (`metrics.csv` → `geometry-identical`).
- Semantic colours **identical** across X/Y/Z (`semantic-fixed`).
- Contextual aura strength **identical** across X/Y/Z in each mode — off = 0,
  fixed = 0.14 (`metrics.csv` → `aura-control`); the aura never colours text,
  actions, chips or semantics.
- The three canvases share lightness to within ΔL ≈ 0.001 (e.g. canvas L ≈ 0.184
  for all three) while their chroma/hue differ — confirming temperature-only variation.

## Accessibility gate (pre-capture, all variants pass)

Contrast was gated **before** capture and re-published in the objective-evidence
bundle's `metrics.csv`. As captured, every variant clears every floor:

| Check | Floor | X | Y | Z |
|---|:--:|:--:|:--:|:--:|
| Body text vs canvas | 7:1 | 15.9 | 15.9 | 15.9 |
| Body text vs raised surface | 7:1 | ✓ | ✓ | ✓ |
| Secondary vs surface-2 | 4.5:1 | ✓ | ✓ | ✓ |
| Essential muted vs surface-1 | 4.5:1 | ✓ | ✓ | ✓ |
| CTA text vs CTA fill | 7:1 | 13.8 | 13.8 | 13.8 |
| Focus ring vs canvas | clear | ✓ | ✓ | ✓ |
| Layers distinguishable without glow | — | ✓ | ✓ | ✓ |

Surface layers are separated by a deliberate OKLCH lightness step at each rung
(canvas → surface-1 → surface-2 → raised); see the objective-evidence bundle's
`metrics.csv` → `staircase`. No pure black or pure white is used as a core identity
colour. Exact ratios per role are in that `metrics.csv` and in `accessibility-details.md`.

## Surfaces, fixtures & capture matrix

Five surface families (Landing; Tonight; Film File; Library = Diary + Cinematic DNA;
Mobile flow) on the five reused P1 surface families, with the exact P1 content. Six
genres (comfort comedy, romance, horror, action, animation, serious international
drama) and the full edge set (long / one-word title, bright / dark / low-saturation /
missing poster, long explanation, mixed-script language, uncertain availability,
cold start, loading, error).

Captured anonymized (X/Y/Z only), deterministically (reduced-motion final state):

- **Core, no aura** — 5 surfaces × desktop + mobile × 3 variants = **30**
- **Contextual colour, fixed** — Tonight + Film File × desktop + mobile × 3 = **12**
- **Genre** — Tonight desktop, fixed aura × 6 genres × 3 = **18**
- **Mobile stress** — 6 stress cases × 3 = **18**
- **Supporting specimens** — text/surface (no-poster long-form reading), semantic
  coexistence, surface staircase, neutral CTA + ivory-only selected, keyboard focus,
  poster edge / missing poster — **21**

**99 full-resolution native crops**, composed into **20 review sheets** (primary in
three counterbalanced orders XYZ / YZX / ZXY, plus grayscale; aura off-vs-fixed;
genre and mobile grids with grayscale; and the specimens). Sheets are framed on a
neutral grey to avoid biasing temperature perception.

## Two-stage review protocol

Review was deliberately split so objective numbers could not anchor qualitative
judgement. The protocol ran in four steps:

1. **Blind visual scoring** — using the *blind visual bundle*
   (`reviewer-scorecard.md`, `accessibility-gate-summary.md`, `sheets/`, `crops/`).
   The reviewer scored the five weighted dimensions 1–5 per variant, computed the
   weighted totals (a maximum of 100, practical range 20–100 under the 1–5 rubric),
   and answered the ten mandatory questions. No hex/OKLCH values, contrast ratios, or
   perceptual distances were present at this stage.
2. **Objective reconciliation** — only after the scorecard was locked, the reviewer
   opened the *post-score objective-evidence bundle* (`metrics.csv`,
   `metrics-summary.md`, `accessibility-details.md`, `candidate-separability.md`) and
   reconciled the blind result against the measured contrast, lightness ladder, and
   perceptual separability (including whether a near-tie reflects genuine candidate
   proximity).
3. **Private mapping reveal** — the Variant X / Y / Z → candidate mapping was unsealed
   from the out-of-repo private key.
4. **Decision record** — the outcome recorded in
   [ADR 015](../decisions/015-thoughtful-seatmate-p2a-foundation.md).

The blind scorecard carried the five weighted dimensions — **Foundation character 30
· Film framing / genre neutrality 25 · Reading & information hierarchy 20 · Surface
structure & mobile comfort 15 · Accessibility & implementation confidence 10**
(semantic/aura coexistence and action clarity evaluated as subcriteria within these)
— the ten mandatory questions, the **weighted-score formula**
(`Σ (rating_d / 5) × weight_d`, maximum 100, practical range 20–100), and the **pre-registered decision
rule**: any accessibility failure disqualifies → compare normalized totals →
a lead < 5 points is a near-tie → near-tie tie-breaks on foundation character, then
film framing / genre neutrality, then reading comfort, then grayscale hierarchy →
a candidate that depends on fixed aura to feel intentional cannot win → a warmer
candidate cannot win merely for looking cinematic on an empty specimen → a neutral
candidate cannot win merely through familiarity if it feels cold/blue-black/generic →
in a genuine tie, choose the least chromatic candidate that still feels unmistakably
warm. The rule was recorded in advance and applied **only at step 2**, not during
blind scoring.

## Scope & non-conclusions (of the experiment)

- P2A is a **prototype**: synthetic content, no engine output, no personalization,
  no real user data; the route is dev-guarded and **absent from production builds**.
- P2A **selects a foundation temperature direction**, not a production palette. It
  does **not** authorise any change to production tokens, components, routes, fonts,
  CSS, or visual baselines.
- **Decision scope.** The selected candidate becomes the exact accepted prototype
  foundation used unchanged in P2B and as the scoped/local foundation for the Tonight
  and Film File pilots. It does not become an app-wide production token system until
  both pilots validate it and the migration gate for shared-token promotion is reached.

## Reproducibility

The isolated harness (route `/design-lab/thoughtful-seatmate-p2a`, dev-guarded by
`import.meta.env.DEV || VITE_ENABLE_DESIGN_LAB`) and its capture/compose/metrics
scripts produced every artifact above from the rendered DOM, so the published
numbers match the captured pixels. The candidate derivation, the sealed key, the
screenshots, and the ZIP are intentionally **not** committed to the repository.

---

# Final outcome (post-decision)

> Recorded after the blind scorecard and objective reconciliation were completed and
> locked, and the variant→candidate mapping was revealed. The formal decision is
> [ADR 015](../decisions/015-thoughtful-seatmate-p2a-foundation.md).

## Revealed mapping

- **Variant X = P1 control**
- **Variant Y = warmer graphite**
- **Variant Z = neutral graphite**

## Blind scores

| Dimension | Weight | P1 control (X) | Warmer graphite (Y) | Neutral graphite (Z) |
|---|---:|---:|---:|---:|
| Foundation character | 30 | 5 | 3 | 4 |
| Film framing / genre neutrality | 25 | 5 | 4 | 5 |
| Reading and information hierarchy | 20 | 4 | 4 | 4 |
| Surface structure and mobile comfort | 15 | 4 | 4 | 5 |
| Accessibility and implementation confidence | 10 | 4 | 4 | 4 |
| **Normalized total** | **100** | **91** | **74** | **88** |

The P1 control led neutral graphite by three points (91 vs 88) — inside the
pre-registered 5-point near-tie band — so the near-tie criteria were applied rather
than an automatic winner. Warmer graphite (74) was clearly behind.

## Objective reconciliation

- All three candidates **passed the accessibility gate**; contrast was necessary but
  not decisive.
- Geometry, typography, semantic colours, and aura strength were **identical** across
  candidates; candidate lightness was effectively controlled (max ΔL ≈ 0.0025).
- Objective chroma ordering: **neutral graphite < P1 control < warmer graphite**
  (mean OKLCH chroma ≈ 0.0044 < 0.0146 < 0.0219).
- The strongest temperature difference appeared in the **projection-ivory and
  neutral-action roles**, not in the darkest canvas; no candidate depended on
  contextual aura to function.
- Near-tie tie-breakers: foundation character **P1 control won 5–4**; film framing
  **tied 5–5**; reading comfort **tied 4–4**; surface hierarchy **neutral graphite
  won 5–4**. Neutral graphite was least chromatic but read **neutral-to-cool**, not
  unmistakably warm; warmer graphite was **visibly too warm** in text, surfaces, and
  the ivory action fill. The P1 control was the least-chromatic candidate that
  clearly remained warm and intentional — the final tie-break clause selected it.

## Decision

The **P1-control warm graphite system** is the accepted Thoughtful Seatmate prototype
foundation. The existing control was **validated**, not retained by inertia; both a
warmer and a more-neutral alternative were rejected. Do not blend the candidates or
create a fourth, untested system.

## Exact accepted values

Fixed for P2B and for scoped/local use in the Tonight and Film File pilots; **not yet
global production tokens**.

```css
--canvas: #15120f;
--surface-1: #1d1814;
--surface-2: #241e19;
--surface-raised: #2d2621;

--text-primary: #f3ecdf;        /* projection ivory */
--text-secondary: #beb8ad;
--text-muted: #8d887f;

--border-subtle: #302c28;
--border-strong: #46423d;

--neutral-action-fill: #efe7d7;
--neutral-action-text: #221b13;
--neutral-focus: #f3ecdf;
```

## Accessibility evidence (selected foundation)

| Pair | Ratio |
|---|---:|
| primary text / canvas | 15.88:1 |
| primary text / surface 1 | 14.98:1 |
| primary text / surface 2 | 14.02:1 |
| primary text / raised | 12.67:1 |
| secondary text / canvas | 9.46:1 |
| muted text / canvas | 5.30:1 |
| muted text / surface 1 | 5.00:1 |
| action text / fill | 13.84:1 |
| action fill / canvas | 15.18:1 |
| focus / canvas | 15.88:1 |

## Scope of the decision

- Accepted as **prototype / pilot-scoped** values: fixed in P2B and used as
  scoped/local values in the Tonight (`/home`) and Film File (`/movie/:id`) pilots.
- **Not** global production tokens; shared-token promotion remains gated by pilot
  validation. No production typography, CSS, tokens, components, routes, tests, or
  visual baselines change as a result.
- Still open after P2A: the warm decision-signal hue, ivory-only-vs-ivory-plus-warm-cue
  selected states, contextual-colour strength and normalization thresholds, gradient
  survival, the long-form Film File serif exception, navigation, and couple mode.

See [ADR 015](../decisions/015-thoughtful-seatmate-p2a-foundation.md) for the full
decision record.
