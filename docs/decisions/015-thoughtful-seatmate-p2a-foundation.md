# ADR 015 — Thoughtful Seatmate P2A: P1-Control Warm Graphite Foundation

> ⚠️ **Superseded in part by [ADR 021](021-adaptive-editorial-cinema-foundation.md).** The
> concrete warm-graphite / projection-ivory foundation *values* accepted here are replaced
> by Adaptive Editorial Cinema's deep-neutral-ink + paper-white palette. Method and rationale
> preserved as history. ADR 014 (Inter) is unaffected.

**Status:** Accepted (foundation values superseded by ADR 021)
**Date:** 2026-06-14
**Decided by:** Aditya Kumar, informed by one completed AI-assisted blind review of the anonymized P2A evidence bundle followed by objective reconciliation. The blind scorecard and objective reconciliation were completed and locked **before** the variant→candidate mapping was revealed.

> Decision statement:
>
> **The P1-control warm graphite system is the accepted Thoughtful Seatmate
> prototype foundation. Its twelve values are fixed for P2B and for scoped/local use
> in the Tonight and Film File pilots. They are not yet global production tokens.**

Companion docs: active authority
[`design-authority-thoughtful-seatmate.md`](../ui/design-authority-thoughtful-seatmate.md),
durable rule [`.claude/rules/design-system.md`](../../.claude/rules/design-system.md),
full evidence packet
[`thoughtful-seatmate-p2a-foundation-evaluation.md`](../ui/thoughtful-seatmate-p2a-foundation-evaluation.md).
Predecessor: [ADR 014](014-thoughtful-seatmate-p1-core-voice.md) (P1 — Core Voice, fixed Inter).

---

## 1. Status

Accepted. This closes the **P2A — Foundation Neutrals** prototype experiment. It is
a **prototype-and-pilot-scoped** foundation decision for the visual system — **not**
a production token promotion and **not** a product-strategy change. It resolves one
active prototype question from the authority: the exact warm-neutral / graphite
foundation values and the projection-ivory value.

## 2. Decision

**The P1-control warm graphite system is the accepted Thoughtful Seatmate prototype
foundation. Its twelve values are fixed for P2B and for scoped/local use in the
Tonight and Film File pilots. They are not yet global production tokens.**

The twelve coherent foundation roles (canvas, three surfaces, three text tones, two
borders, neutral-action fill/text, neutral focus) are now fixed at the P1-control
warm graphite values listed in §12. They must be used **unchanged** as the fixed
foundation in P2B and as scoped/local values in the Tonight (`/home`) and Film File
(`/movie/:id`) pilots. They must **not** yet be promoted into global production
tokens or used for broad surface migration.

## 3. Context

The active design authority
([`design-authority-thoughtful-seatmate.md`](../ui/design-authority-thoughtful-seatmate.md))
accepted a "warm graphite / warm-neutral foundation" and "projection-ivory text" as
**principles** but left the **exact** warm-neutral / graphite token values and the
exact ivory value as explicit open prototype questions. [ADR 014](014-thoughtful-seatmate-p1-core-voice.md)
had already fixed the single core voice (Inter). P2A was the controlled experiment
built to answer only the foundation-temperature variable, on real FeelFlick surfaces,
before any pilot or production migration.

The existing P1-control foundation was **not** assumed correct. It was entered into a
blind comparison as one of three candidates and had to win on the merits. This ADR
records that it was **validated**, not retained by inertia.

## 4. Alternatives considered

Three constructed foundation candidates, differing only in neutral temperature:

- **P1 control** — the current warm graphite foundation, included as an anchor.
- **Warmer graphite** — a modest umber increase, deliberately short of
  brown/sepia/plum.
- **Neutral graphite** — reduced warm chroma (no blue/slate), a more restrained
  off-white.

Out of scope for P2A (held as fixed controls, not alternatives): the typeface (Inter,
ADR 014), geometry/type scale, semantic palette, contextual-aura algorithm and
strength, primary-action structure, and the ivory-only selected state. Blending the
candidates or inventing a fourth, untested hybrid was explicitly **not** an option —
the accepted system is exactly one of the three tested candidates.

## 5. Controlled experiment

Candidate definitions were restricted to the **twelve-role foundation system** below
— the complete accepted foundation. **Eleven** of these roles differed between at
least two candidates; `neutral-action-text` remained fixed at `#221b13` across all
three (P1 control, warmer graphite, neutral graphite) and therefore functioned as a
control within the experiment. No styling values outside this twelve-role system
differed. So twelve roles comprise the selected foundation, eleven were
experimentally varied, and one remained fixed within the experiment.

The twelve foundation roles (the complete accepted system):

- canvas
- surface 1
- surface 2
- raised surface
- primary text
- secondary text
- muted text
- subtle border
- strong border
- neutral action fill
- neutral action text — **fixed at `#221b13`** across all three candidates (the one role held constant within the experiment)
- neutral focus

Held fixed across all candidates:

- Inter
- component structure
- content and fixtures
- geometry and typography
- film imagery
- interaction and motion
- semantic colors
- contextual-aura algorithm and strength
- primary-action structure
- ivory-only selected state

All candidates used the **same perceptual lightness ladder** (per-role OKLCH `L`
held constant); **temperature / chroma was the controlled variable**. This was
verified objectively from the rendered DOM: geometry, typography, semantic colors,
and aura strength were identical across variants, and the three canvases shared
lightness to within ΔL ≈ 0.001 while chroma/hue differed.

## 6. Blind-review methodology

The three candidates were randomly assigned to anonymized **Variant X / Y / Z**, with
counterbalanced column orders (XYZ / YZX / ZXY), grayscale and text-only sheets, and
full-resolution native crops. Review followed a deliberate **two-stage protocol** so
objective numbers could not anchor qualitative judgement:

1. **Blind visual scoring** — one AI-assisted blind reviewer scored the five weighted
   dimensions (Foundation character 30 · Film framing / genre neutrality 25 ·
   Reading & information hierarchy 20 · Surface structure & mobile comfort 15 ·
   Accessibility & implementation confidence 10) on a 1–5 scale, combined into a
   weighted total by `Σ (rating_d / 5) × weight_d` — a maximum of 100 and a
   practical range of 20–100 under the 1–5 rubric — and answered ten mandatory
   questions. The blind bundle contained no hex/OKLCH values, contrast ratios, or
   perceptual distances.
2. **Objective reconciliation** — only after the scorecard was locked were the
   objective metrics (contrast, lightness ladder, perceptual separability) opened and
   reconciled against the blind result.
3. **Private mapping reveal** — the variant→candidate mapping was unsealed.
4. **This decision record.**

The scores are **structured decision evidence — not aggregated user research,
population-preference data, or a statistical study.** The variant→candidate mapping
was sealed during scoring and revealed only after the scorecard and reconciliation
were locked. (The private key is **not** stored in this repository.)

## 7. Revealed mapping

- **Variant X = P1 control**
- **Variant Y = warmer graphite**
- **Variant Z = neutral graphite**

## 8. Blind scores

| Dimension | Weight | P1 control (X) | Warmer graphite (Y) | Neutral graphite (Z) |
|---|---:|---:|---:|---:|
| Foundation character | 30 | 5 | 3 | 4 |
| Film framing / genre neutrality | 25 | 5 | 4 | 5 |
| Reading and information hierarchy | 20 | 4 | 4 | 4 |
| Surface structure and mobile comfort | 15 | 4 | 4 | 5 |
| Accessibility and implementation confidence | 10 | 4 | 4 | 4 |
| **Normalized total** | **100** | **91** | **74** | **88** |

The P1 control led neutral graphite by **three points** (91 vs 88), which is **inside
the pre-registered 5-point near-tie band** — so the result triggered the near-tie
reconciliation criteria rather than an automatic winner. The warmer graphite (74)
was clearly behind.

## 9. Objective evidence

- **All candidates passed the accessibility gate** (see §13).
- **Geometry, typography, semantic colors, and aura strength were identical** across
  candidates (verified from the rendered DOM).
- **Candidate lightness was effectively controlled** — the per-role OKLCH lightness
  ladder was shared; the maximum lightness difference across any role/pair was
  ΔL ≈ 0.0025, so the difference between candidates is chromatic (temperature), not
  brightness.
- **Objective chroma ordering:** neutral graphite < P1 control < warmer graphite
  (mean OKLCH chroma ≈ 0.0044 < 0.0146 < 0.0219).
- **The strongest temperature difference appeared in the projection-ivory and
  neutral-action roles** (the light, high-lightness roles — the ivory action fill was
  the only "clearly visible" pairwise difference), **not** in the darkest canvas,
  where the three candidates are closest.
- **No candidate depended on contextual aura to function** — each foundation read as
  intentional with the aura off.

## 10. Near-tie rule

The pre-registered decision rule was applied **only at reconciliation**, after the
blind scorecard was locked:

1. Any accessibility failure disqualifies a candidate — none failed.
2. Compare normalized totals — P1 control 91, neutral graphite 88, warmer 74.
3. A lead smaller than 5 points is a near-tie — 91 vs 88 (Δ3) is a near-tie between
   the P1 control and neutral graphite; warmer graphite is out of contention.
4. Near-tie tie-breakers, in order, on the top two:
   - **Foundation character:** P1 control won, 5–4.
   - **Film framing / genre neutrality:** tied, 5–5.
   - **Reading comfort:** tied, 4–4.
   - **Surface hierarchy:** neutral graphite won, 5–4.
5. A candidate that depends on fixed aura to feel intentional cannot win — neither
   did.
6. A warmer candidate cannot win merely for looking cinematic on an empty specimen —
   warmer graphite was, in fact, measurably and visibly **too warm** in text,
   surfaces, and the neutral action fill.
7. A neutral candidate cannot win merely through familiarity if it feels
   cold/blue-black/generic — neutral graphite was the least chromatic, but the blind
   review found it **neutral-to-cool rather than unmistakably warm**.
8. In a genuine tie, choose the least chromatic candidate that **still feels
   unmistakably warm** — the P1 control was the least-chromatic candidate that
   clearly remained warm and intentional.

The first decisive tie-breaker (foundation character) favored the P1 control, and the
final clause confirmed it: it is the least-chromatic candidate that still reads as
unmistakably warm. The P1 control is the winner.

## 11. Rationale

- The result was a **near-tie** between the P1 control (91) and neutral graphite (88),
  and the pre-registered tie-breakers resolved it toward the P1 control on the
  highest-weighted, most identity-defining dimension (foundation character).
- **The existing control was validated, not retained by inertia.** It entered the
  comparison anonymized and had to win on the merits; it did.
- **The test rejected both alternatives.** Warmer graphite imposed **too much
  atmosphere** — measurably and visibly too warm in text, surfaces, and the ivory
  action fill, the strongest-chroma roles. Neutral graphite **weakened the human
  warmth** that defines the Thoughtful Seatmate foundation, reading neutral-to-cool
  rather than unmistakably warm, despite winning surface hierarchy.
- The P1 control sits at the **right point on the temperature axis**: the least
  chromatic of the candidates that still feels intentionally warm — enough warmth to
  feel human and film-literate, little enough chroma to avoid sepia and to frame
  posters without tinting them.
- **Do not blend the candidates or create a fourth, untested system.** The accepted
  foundation is exactly the P1-control candidate as tested. A hybrid would be an
  unvalidated new system.

## 12. Exact accepted values

These twelve values are the accepted Thoughtful Seatmate prototype foundation. They
are fixed for P2B and for scoped/local use in the Tonight and Film File pilots. They
are **not** global production tokens (see §16).

```css
--canvas: #15120f;
--surface-1: #1d1814;
--surface-2: #241e19;
--surface-raised: #2d2621;

--text-primary: #f3ecdf;
--text-secondary: #beb8ad;
--text-muted: #8d887f;

--border-subtle: #302c28;
--border-strong: #46423d;

--neutral-action-fill: #efe7d7;
--neutral-action-text: #221b13;
--neutral-focus: #f3ecdf;
```

## 13. Accessibility evidence

Contrast was gated **before** capture; the selected foundation clears every
requirement with comfortable margin (WCAG relative-luminance ratios):

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

Contrast was **necessary but not decisive**: all three candidates passed the
accessibility gate, so accessibility did not pick the winner. The decision rested on
foundation character and the near-tie tie-breakers. Surface layers are distinguished
by the shared OKLCH lightness ladder (not by borders or glow), and no pure black or
pure white is used as a core identity color.

## 14. Consequences

- The exact warm graphite foundation values and the projection-ivory hierarchy are
  now **accepted** (prototype/pilot-scoped). They move out of the
  provisional/prototype-question lists in the maintained authority and rule.
- The twelve values become **fixed controls for P2B** — P2B builds on this
  foundation rather than re-opening it.
- The Tonight and Film File pilots use these as **scoped/local** values.
- Broad token promotion remains **gated by pilot validation** (authority migration
  gate 5): the values do not become shared/global production tokens until both pilots
  validate them.
- The warm graphite / projection-ivory **temperature question is closed**; do not
  re-litigate it or substitute a blended or fourth system.

## 15. What this decision does NOT decide

- It does **not** itself resolve the exact **warm decision-signal hue**, nor whether
  selected states are **ivory-only** or **ivory-plus-a-warm-cue** — those questions were later
  **resolved by ADR 016** (ivory-only; no separate warm cue). See the Status update below.
- It does **not** resolve **contextual-film-color strength** or **normalization
  thresholds**.
- It does **not** itself resolve whether the **legacy gradient** survives, the **long-form
  Film File serif exception**, **bottom navigation**, or **couple-mode** mechanics. *(Update
  2026-06-17: serif → resolved Inter-only by P2D; legacy-gradient survival → resolved, retired
  from the target (P2E stopped without a decision); bottom navigation and couple-mode remain
  open product questions. See the Status update at the end of this file.)*
- It does **not** promote these values to **global production tokens** or authorize
  broad surface migration.
- It does **not** change product doctrine
  ([`product-doctrine.md`](../product-doctrine.md)) or
  [`.claude/rules/product.md`](../../.claude/rules/product.md) — this is a
  visual-system decision.

## 16. Production implications

- This is a **prototype-and-pilot-scoped** decision. **No production typography, font
  loading, CSS, tokens, components, routes, tests, or visual baselines change as a
  result of this ADR.**
- The shipped product remains **mixed and transitional** (F4 Newsreader/Inter/rose on
  many surfaces; residual Outfit/purple/pink elsewhere). These accepted values do
  **not** describe what production currently uses.
- The values become global production tokens only later, through the authority's
  migration gates: scoped pilots on Tonight and Film File first, then — **after both
  pilots validate** — promotion to shared tokens, then systematic surface migration
  with deliberate visual-regression re-baselining.

## 17. Evidence limitations

- The scores are **structured single-reviewer decision evidence**, not user research,
  population-preference data, or a statistical study; the AI-assisted blind review is
  a UX-inspection method, not real-user validation.
- The comparison was on an **isolated dev-server prototype** with synthetic content;
  it did not validate the values on real production surfaces, real recommendation
  output, or real user data.
- Contrast and perceptual-distance numbers are computed from the rendered prototype
  DOM, not a production benchmark.
- The pilots (gate 4) are where these values must prove themselves on real surfaces
  before any shared-token promotion.

## 18. Follow-up work

- **P2B** proceeds on this fixed foundation (resolving the next questions — e.g. the
  warm decision-signal hue and ivory-only-vs-ivory-plus-warm-cue selected states —
  not re-opening the foundation).
- Keep the remaining authority prototype questions open: **bottom navigation and couple
  mode**. (Warm-cue hue and contextual-color strength/normalization thresholds were resolved by
  ADR 016 / 017 / 018; the long-form serif role and legacy-gradient survival have since been
  resolved — see the Status update below; contextual-color extraction is deferred.)
- When foundation migration is scheduled, follow the authority's migration gates:
  scoped Tonight + Film File pilots with these local values → after both validate,
  promote to shared tokens/primitives → surface-by-surface migration with deliberate
  visual-regression re-baselining. Do not globalize these tokens before pilot
  validation.

## Status update (2026-06-17 — Thoughtful Seatmate visual-system closure)

Of the remaining authority prototype questions listed above, two are now **resolved** and must
not be reopened during migration: the **long-form Film File serif role** (P2D — Film File stays
Inter-only) and **legacy-gradient survival** (retired from the target system — the P2E
gradient-survival study was stopped before a valid blind review and produced no decision; no
winner, no decision rule applied). The warm-cue hue and contextual-color strength/normalization
thresholds were resolved by ADR 016 / 017 / 018. The contextual-color **extraction** method
remains **deferred**, and bottom-navigation and couple-mode remain open product questions. This
ADR's own decision — the warm graphite foundation values — is unchanged and remains authoritative.
See [`../ui/thoughtful-seatmate-visual-system-closure.md`](../ui/thoughtful-seatmate-visual-system-closure.md).
