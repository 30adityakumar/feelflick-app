# Thoughtful Seatmate P1 — Core Voice: Evaluation Evidence (maintained record)

> Maintained summary of the P1 — Core Voice typography experiment (Inter vs
> Instrument Sans). The experiment ran in an isolated, **un-merged** Design Lab
> prototype; the screenshot bundle, capture tooling, ZIP, and the private
> font-key live outside this repository and are **not** copied here. This document
> is the durable evidence record; the formal decision is
> [ADR 014](../decisions/014-thoughtful-seatmate-p1-core-voice.md).

**Status:** Closed — decision Accepted (see ADR 014). **Date:** 2026-06-14.

---

## Experiment question

> Which single core sans-serif voice better expresses the Thoughtful Seatmate
> across FeelFlick’s real product surfaces: **Inter** or **Instrument Sans**?

### Hypothesis

> A single human sans-serif voice can make FeelFlick feel coherent, calm, credible,
> and film-literate **without** a permanent serif-versus-interface personality split.

## Controlled variables

A controlled A/B prototype changed **only `font-family`**. Held identical:
component tree, content, fixtures, layout, widths, spacing, type sizes, weights
(400/500/600/700), line-heights, letter-spacing, colors, poster treatment, the one
fixed contextual-aura strength, the neutral primary action, motion, interaction,
and all states. Verified objectively: in side-by-side mode, computed non-font
styles were identical across probed selectors and only `font-family` differed.

## Surfaces & fixtures

Five surface families (Landing, Tonight, Film File, dense Library = Diary +
Cinematic DNA, Mobile flow) × desktop + mobile; six genres (comfort comedy,
romance, horror, action, animation, serious international drama); stress cases
(long title, one-word title, bright/dark/missing poster, long explanation,
non-English/multilingual, uncertain availability, cold start, mature history,
loading, error). Presentation was blind X/Y with reversed Y/X counterbalancing,
plus grayscale and text-only isolation, at full resolution and 100% crops.

## Revealed mapping (after blind scoring)

- **Variant X = Inter**
- **Variant Y = Instrument Sans**

## Objective findings

- Both fonts loaded and rendered reliably; the comparison was genuinely controlled.
- Line-box (`Range`-based) and rendered-dimension measurements showed no material
  wrapping/layout difference on the sampled content; Instrument Sans was marginally
  more compact on dense/mobile layouts.
- Font-loading: low CLS; no title line-count change on the sampled swap; a
  deliberately delayed Instrument Sans produced a small control-position shift; a
  **blocked** Instrument Sans degraded safely to the system fallback with the
  surface intact (no broken layout, no hidden content).

## Subjective findings (weighted blind scores)

| Area | Weight | Inter (X) | Instrument Sans (Y) |
|---|---:|---:|---:|
| Cinematic decision surfaces | 30% | 4.37 | 4.12 |
| Dense and utility surfaces | 25% | 4.02 | 4.38 |
| Mobile and robustness | 20% | 4.04 | 4.36 |
| Product character | 15% | 4.40 | 4.16 |
| Accessibility & implementation confidence | 10% | 4.14 | 4.14 |
| **Weighted total** | | **4.20** | **4.24** |

- The 0.04 weighted-total gap is an **effective tie**, not a win.
- **Inter** led on human warmth, trust, cinematic decision surfaces, and product
  character. **Instrument Sans** was more compact and led on dense utility and
  mobile. Instrument Sans showed **no clear whole-product advantage**.

## Accessibility & performance notes

Keyboard operability and visible focus held in both variants; reduced motion was
honored (reveal collapses to the final state; actions never animation-gated);
contrast on warm-graphite/projection-ivory is high. The production font-loading
strategy (self-host vs CDN) and non-Latin coverage were **not** validated.

## Adversarial summary

- **Inter** risk: can read as a generic "default app" sans; less distinctive on
  the hero. **Instrument Sans** risk: trend-dating / "styled" read; unverified calm
  on dense surfaces; added production loading/fallback/multilingual burden.
- Neither risk was decisive; Inter’s genericness risk is offset by composition,
  contextual film light, copy, poster treatment, the rare warm signal, and motion.

## Evidence limitations

- Screenshot-scale review for fine letterforms (mitigated by 100% crops + text-only
  sheets in the external bundle); dev-server (not production) font-loading numbers;
  no italics in product surfaces (assessed on the text-only sheet); fixtures
  contained no non-Latin-script titles.

---

## Final outcome (decision)

**Inter is FeelFlick’s single core Latin sans-serif target. Instrument Sans will
not replace it as the product-wide core voice.**

The pre-registered threshold — *adopt Instrument Sans only if it clearly improves
cinematic identity and product character without a meaningful loss in dense
utility, mobile, accessibility, or loading; in a genuine tie, retain Inter* — was
**not met**. Instrument Sans did not earn the migration.

Still **unresolved:** whether a serif has a narrowly bounded role in genuinely
long-form Film File reading. This decision is scoped to the Latin core voice
(non-Latin fallback untested), is a target direction (the shipped product is mixed
and transitional — Newsreader/Inter/Outfit coexist until gated migration), and
approves **no** immediate production font change.

See [ADR 014](../decisions/014-thoughtful-seatmate-p1-core-voice.md) for the formal
record and [`design-authority-thoughtful-seatmate.md`](design-authority-thoughtful-seatmate.md)
for the updated active authority.
