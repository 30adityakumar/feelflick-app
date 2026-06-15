# ADR 014 — Thoughtful Seatmate P1: Inter as the Core Product Voice

**Status:** Accepted
**Date:** 2026-06-14
**Decided by:** Aditya Kumar, on a completed blind reviewer comparison (P1 — Core Voice)

> Decision statement:
>
> **Inter is FeelFlick’s single core Latin sans-serif target. Instrument Sans will
> not replace it as the product-wide core voice.**

Companion docs: active authority
[`design-authority-thoughtful-seatmate.md`](../ui/design-authority-thoughtful-seatmate.md),
durable rule [`.claude/rules/design-system.md`](../../.claude/rules/design-system.md),
full evidence packet
[`thoughtful-seatmate-p1-core-voice-evaluation.md`](../ui/thoughtful-seatmate-p1-core-voice-evaluation.md).

---

## 1. Status

Accepted. This closes the P1 — Core Voice prototype experiment. It is a
**target-direction** decision for the visual system, not a production migration and
not a product-strategy change.

## 2. Date

2026-06-14.

## 3. Decision

**Inter is FeelFlick’s single core Latin sans-serif target. Instrument Sans will
not replace it as the product-wide core voice.**

The Thoughtful Seatmate direction calls for *one coherent human sans-serif voice*
(no permanent serif-versus-system personality split). That single core voice is
**Inter**. Instrument Sans was the challenger in a controlled blind comparison and
did not earn the migration.

## 4. Context

The active design authority
([`design-authority-thoughtful-seatmate.md`](../ui/design-authority-thoughtful-seatmate.md))
accepted "one coherent human sans-serif voice" as a principle but left **which**
font (Instrument Sans versus Inter) as an explicit open prototype question. P1 was
the controlled experiment built to answer only that one variable, on real FeelFlick
surfaces, before any production migration.

## 5. Alternatives considered

- **Inter** — already the global interface font in the shipped product; widely
  legible; low operational risk.
- **Instrument Sans** — a contemporary humanist sans with slightly more display
  character and a more compact body, loaded only in the isolated Design Lab
  prototype for the test.
- (Out of scope for P1: retaining a permanent serif/editorial split — already
  retired by the authority; multi-font systems — rejected by the one-voice
  principle.)

## 6. Experiment design

A controlled A/B prototype in the isolated Design Lab (`/design-lab/thoughtful-seatmate`)
held everything constant except `font-family`:

- same component tree, content, and fixtures;
- same spacing, sizes, weights, line-height, and tracking;
- same colors and contextual treatment;
- same actions and interaction states;
- **only `font-family` differed** (verified: identical non-font computed styles
  across probed selectors; only `font-family` varied).

Coverage: five representative surface families (Landing, Tonight, Film File, dense
Library = Diary + Cinematic DNA, Mobile recommendation flow); desktop and mobile;
six genre fixtures (comfort comedy, romance, horror, action, animation, serious
international drama); and stress cases — long title, missing poster, long
explanation, cold start, mature history. Evidence included blind X/Y and reversed
Y/X presentation, grayscale and text-only comparisons, objective line-box and
rendered-dimension measurements, and font-loading + blocked-font fallback testing.

## 7. Blind-review methodology

The two fonts were randomly assigned to anonymized **Variant X** and **Variant Y**.
Reviewers scored a weighted rubric (cinematic decision surfaces 30%, dense/utility
25%, mobile/robustness 20%, product character 15%, accessibility & implementation
confidence 10%) on a 1–5 scale, using counterbalanced left/right (Set X = X|Y;
Set Y = Y|X), grayscale, 100% crops, and text-only sheets. The font↔variant
mapping was sealed and **revealed only after scoring was complete**. (The private
key is not stored in this repository.)

## 8. Revealed mapping

- **Variant X = Inter**
- **Variant Y = Instrument Sans**

## 9. Objective findings

- Both fonts rendered reliably; the experiment was genuinely controlled (only
  `font-family` differed).
- Line-box and rendered-dimension measurements showed no material wrapping or
  layout differences on the sampled content; Instrument Sans was marginally more
  compact on dense/mobile layouts.
- Font-loading evidence: low measured CLS; no title line-count change during the
  sampled swap; a deliberately delayed Instrument Sans caused a small
  control-position shift; a **blocked** Instrument Sans degraded safely to the
  system fallback with the surface intact.
- Full detail and the measurement tables are in the evidence packet
  ([`thoughtful-seatmate-p1-core-voice-evaluation.md`](../ui/thoughtful-seatmate-p1-core-voice-evaluation.md)).

## 10. Subjective findings (weighted blind scores)

| Area | Weight | Inter (X) | Instrument Sans (Y) |
|---|---:|---:|---:|
| Cinematic decision surfaces | 30% | 4.37 | 4.12 |
| Dense and utility surfaces | 25% | 4.02 | 4.38 |
| Mobile and robustness | 20% | 4.04 | 4.36 |
| Product character | 15% | 4.40 | 4.16 |
| Accessibility & implementation confidence | 10% | 4.14 | 4.14 |
| **Weighted total** | | **4.20** | **4.24** |

The 0.04 weighted-total difference is an **effective tie**, not an Instrument Sans
win. Qualitatively: **Inter** was stronger on human warmth, trust, cinematic
decision surfaces, and Thoughtful Seatmate character; **Instrument Sans** was more
compact and slightly stronger on dense utility and mobile layouts. Instrument Sans
did **not** demonstrate a clear whole-product advantage.

## 11. Decision threshold

The pre-registered rule:

> Instrument Sans should be selected **only if** it clearly improves cinematic
> identity and product character **without** a meaningful loss in dense utility,
> mobile, accessibility, or loading confidence. In a genuine tie, retain Inter
> (already integrated, lower operational risk). A narrow visual preference alone is
> insufficient to justify migration.

Instrument Sans did not meet this threshold.

## 12. Rationale

- The result is a near-tie (Δ 0.04), and a genuine tie favours the
  already-integrated font.
- Where the two differed by character, **Inter led exactly where it matters most**
  for this product — cinematic decision surfaces and Thoughtful Seatmate character
  (the highest-weighted and most identity-defining areas). Instrument Sans’s edge
  was on dense/mobile density, which composition and calibration can also address.
- Instrument Sans is not a worse font; it simply **did not earn the migration**. It
  would add a production loading, fallback, and multilingual-validation burden for
  no clear whole-system gain.
- Distinctiveness for FeelFlick should be developed through composition, neutral
  calibration, contextual film light, copy, poster treatment, the rare warm signal,
  and motion — **not** by forcing a new core font.

## 13. Consequences

- "Which core sans-serif" is now an **accepted principle**: Inter. It is removed
  from the provisional/prototype-question lists in the maintained authority and
  rule.
- Future design and migration work builds toward Inter as the single core Latin
  sans-serif; no effort should go into adopting Instrument Sans as the core voice.
- Hierarchy is achieved through scale, weight, measure, spacing, and composition —
  not a permanent serif-versus-system split.

## 14. What this decision does NOT decide

- It does **not** resolve whether a serif has a **narrowly bounded** role in
  genuinely **long-form Film File reading** — that remains an open prototype
  question.
- It is **"Latin"** by intent: non-Latin / multilingual fallback coverage was not
  tested, so this decision is scoped to the Latin core voice.
- It does **not** claim every current surface already uses only Inter (see
  Production implications).
- It does **not** approve an immediate production font migration.
- It does **not** change product doctrine ([`product-doctrine.md`](../product-doctrine.md))
  or [`.claude/rules/product.md`](../../.claude/rules/product.md) — this is a
  visual-system decision.

## 15. Production implications

- This is a **target-direction** decision. The shipped product is **mixed and
  transitional**: Newsreader, Inter, and Outfit all currently appear across
  surfaces (F4 rolled Newsreader/Inter broadly; residual global/shared/legacy areas
  still use Outfit).
- Existing Newsreader and Outfit usage remains part of the transitional production
  baseline **until deliberate, gated surface migration**.
- No production typography, font loading, CSS, tokens, components, routes, tests, or
  baselines change as a result of this ADR. Migration to an Inter-only core voice
  happens later, surface-by-surface, only through the existing migration gates in
  the active authority.

## 16. Evidence limitations

- The comparison did not validate a **production** font-loading strategy
  (self-host vs CDN) and did not test **non-Latin script** coverage.
- Font-loading numbers are isolated dev-server prototype evidence, not a production
  benchmark.
- Product surfaces use no italics by design, so true-italic quality was assessed
  only on the text-only specimen sheet.
- Fixtures contained no non-Latin-script titles (multilingual was exercised via
  language metadata only).

## 17. Follow-up work

- Keep the long-form Film File **serif exception** as an open prototype question
  for a future, narrowly-scoped test.
- When typography migration is scheduled, follow the authority’s migration gates:
  resolve remaining provisional questions → decision record → scoped pilots
  (Tonight, Film File) with local values → promote to shared tokens/components →
  surface-by-surface migration with deliberate visual-regression re-baselining.
- A production font-loading decision (self-host vs CDN) and non-Latin coverage
  validation are prerequisites to any Inter-only consolidation that removes
  Outfit/Newsreader.
