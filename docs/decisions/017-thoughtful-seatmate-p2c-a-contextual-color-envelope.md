# ADR 017 — Thoughtful Seatmate P2C-A: Strict Contextual-Color Envelope

**Status:** Accepted
**Date:** 2026-06-15
**Decided by:** Aditya Kumar, informed by one completed AI-assisted blind review of the anonymized P2C-A evidence bundle, followed by objective reconciliation. The blind scorecard was locked **before** the objective evidence was opened, and the authoritative Variant→treatment mapping was revealed **only after** reconciliation. No winner was selected during construction.

> Decision statement:
>
> **Contextual film color earns a restrained role on a single focal-film surface.
> The accepted normalization envelope preserves source hue, normalizes output
> lightness to L = 0.62, and caps retained chroma at C = 0.04, subject to the
> fixed low-saturation, semantic-safety and gamut-mapping rules. Aura strength
> remains unresolved and must be tested separately in P2C-B. No production
> implementation is authorized by this decision.**

Companion docs: active authority
[`design-authority-thoughtful-seatmate.md`](../ui/design-authority-thoughtful-seatmate.md),
durable rule [`.claude/rules/design-system.md`](../../.claude/rules/design-system.md),
full evidence packet
[`thoughtful-seatmate-p2c-a-contextual-color-envelope-evaluation.md`](../ui/thoughtful-seatmate-p2c-a-contextual-color-envelope-evaluation.md).
Predecessors: [ADR 014](014-thoughtful-seatmate-p1-core-voice.md) (Inter), [ADR 015](015-thoughtful-seatmate-p2a-foundation.md) (warm graphite / projection-ivory foundation), [ADR 016](016-thoughtful-seatmate-p2b-decision-signal.md) (ivory-only decision signal).

---

## 1. Status

Accepted. This closes the **P2C-A — Contextual-Color Normalization Envelope**
prototype experiment. It is a **prototype-and-pilot-scoped** visual-system decision —
**not** a production token promotion, **not** a production aura, and **not** a
product-strategy change. It resolves only the normalization **envelope** (how much
retained chroma a focal-film contextual color may keep). Aura **opacity/strength** and
the **extraction** method are deliberately not decided here.

## 2. Decision

**Contextual film color earns a restrained role on a single focal-film surface. The
accepted normalization envelope preserves source hue, normalizes output lightness to
L = 0.62, and caps retained chroma at C = 0.04, subject to the fixed low-saturation,
semantic-safety and gamut-mapping rules. Aura strength remains unresolved and must be
tested separately in P2C-B. No production implementation is authorized by this
decision.**

This selects the **strict** envelope (the lowest tested non-zero cap). It does not
authorize a production aura, a global contextual-color token, a compositing strength,
or an extraction algorithm.

## 3. Context

The active design authority accepted "normalized contextual film color for emotional
specificity" as a principle but left the **strength** and the exact **normalization
thresholds** explicitly open. [ADR 014](014-thoughtful-seatmate-p1-core-voice.md) fixed
the core voice (Inter); [ADR 015](015-thoughtful-seatmate-p2a-foundation.md) fixed the
foundation; [ADR 016](016-thoughtful-seatmate-p2b-decision-signal.md) fixed the
ivory-only decision signal. P2C-A is the controlled experiment built to answer the
narrower of the two contextual-color questions — the **normalization envelope** — on
real FeelFlick focal-film surfaces, before any pilot or production work, and
explicitly separated from the opacity question (§7).

## 4. Questions resolved

1. **Does a bounded, poster-derived contextual color add useful film specificity over
   an off control? → Yes**, on a single focal-film surface (the **balanced** envelope
   independently cleared the pre-registered threshold against off; see §17–§18).
2. **What is the accepted normalization envelope? → the strict envelope:** preserve
   source hue, normalize output lightness to **L = 0.62**, cap retained chroma at
   **C = 0.04**, under the fixed low-saturation, semantic-safety and gamut rules.
3. **How much retained chroma is justified? → the lowest tested non-zero cap
   (C = 0.04).** Higher caps were not justified once the lower-envelope rule applied
   (§18).

## 5. Questions still unresolved

- **Aura opacity/strength.** The compositing alpha was a fixed control (0.14) in
  P2C-A and is **not** decided here; it is the subject of **P2C-B**.
- **The extraction algorithm and seed-generation method.** P2C-A used **manually
  assigned deterministic artwork seeds** only to isolate normalization; no extraction
  method is accepted.
- Exact **bottom-navigation structure** and **couple-mode** mechanics remain open, and the
  contextual-color **extraction** method remains deferred. *(Update 2026-06-17: legacy-gradient
  survival → resolved, retired from the target (P2E stopped without a decision); the long-form
  Film File serif role → resolved Inter-only by P2D. See the Status update at the end of this
  file.)*

## 6. Fixed ADR 014–016 controls

Immutable for every variant, unchanged by this experiment: **Inter** (ADR 014); the
exact **ADR 015 foundation** (all twelve roles — canvas `#15120f`, surfaces
`#1d1814`/`#241e19`/`#2d2621`, text `#f3ecdf`/`#beb8ad`/`#8d887f`, borders
`#302c28`/`#46423d`, neutral action `#efe7d7`/`#221b13`, focus `#f3ecdf`); the
semantic palette (amber `#f5b860`, red `#ef6a6a`, green `#5fd0a0`, info `#7db5e6`); the
**ADR 016 ivory decision marker** (`#f3ecdf`, a 7px dot in a reserved 14px slot, never
recoloured by the aura). These were verified identical across all four variants in the
rendered DOM; **only the contextual aura color differed**, and it was driven solely by
the chroma-envelope cap.

## 7. Reason for separating P2C-A and P2C-B

Contextual color has two independent variables — *how much chroma it retains* (the
normalization envelope) and *how strongly it composites* (opacity/strength). Testing
both at once would confound them. P2C-A fixes a single compositing strength (alpha
0.14, a control) and varies only the envelope. **P2C-B** — later, only if an envelope
is accepted — will hold the accepted envelope fixed and compare opacity. The two are
never combined; opacity alternatives were not tested here and P2C-B candidates were not
pre-built. (Had the off control won, P2C-B would not run; because a non-off envelope
cleared the threshold, P2C-B is now warranted — but it has **not** started.)

## 8. Extraction-versus-normalization boundary

P2C-A tested **normalization**, not extraction. No live or network poster pixels were
read during rendering. Each fixture carried an **explicit deterministic artwork seed**;
the normalization consumed only the seed, identical across all variants. The seeds were
**manually assigned deterministic constants**, used solely to isolate the normalization
variable. **No extraction algorithm or seed-generation method is accepted** by this
ADR; that remains an open question (§5).

## 9. Aura architecture

One restrained, single-hue environmental field (`ContextualFilmAura`) behind one focal
film: exactly one normalized hue; no second hue; no purple→pink or legacy gradient; no
blend-mode/geometry/opacity/blur variation between variants; no color on text, icons,
borders, buttons, the marker, focus, or semantics; no color inside the poster; no
ambient animation/pulse/parallax. It renders as one fixed radial field clipped to the
focal hero, fading to transparent, normal compositing, no full-page wash. Geometry,
position, gradient stops, falloff, clipping, DOM, z-index, transition, and responsive
behavior were identical across variants. The compositing **alpha (0.14) was a fixed
control, not part of this decision** (§7, §19).

## 10. Normalization pipeline

The accepted deterministic pipeline, in this exact order:

1. validate the explicit deterministic artwork seed;
2. convert source color to OKLCH;
3. suppress missing or invalid seed;
4. suppress effectively achromatic source where C < 0.04;
5. preserve source hue;
6. normalize output lightness to L = 0.62;
7. cap retained chroma at C = 0.04;
8. compare against semantic colors using the fixed danger distance < 0.05;
9. reduce chroma without rotating hue until the semantic boundary clears;
10. suppress if the result falls below the low-saturation threshold;
11. gamut-map by reducing chroma in 0.005 increments until in sRGB;
12. composite through the fixed aura architecture.

This pipeline is candidate-independent; the **only** thing P2C-A varied across the
non-off treatments was step 7's cap value.

## 11. Permitted and forbidden scope

**Permitted** (only where one film is the clear focal object): (1) the Tonight primary
recommendation hero; (2) the Film File hero; (3) their mobile equivalents; (4) the
active replacement film after "Not tonight."

**Forbidden:** landing before a focal film exists; navigation; bottom navigation; logo
or wordmark; CTA; secondary controls; the selected/committed marker; focus ring; chips;
tabs; filters; text; icons; borders; ratings; caution; errors; watched/success;
availability; confidence; loading; missing-poster fallback; Diary; Cinematic DNA;
grids; multi-film comparison; footer; modal chrome; AI or premium signaling; decorative
empty regions.

The aura remains: single hue; poster-derived through a deterministic seed;
environmental only; never semantic; never informational; never a brand color; never a
control color; never a purple→pink gradient; never applied globally.

## 12. Fixture matrix

Eighteen deterministic stress seeds spanning color space (deep red, orange, yellow,
olive, green, cyan, cool blue, deep blue, violet, magenta, skin-tone, warm beige,
near-black, near-white, low-saturation grey, neon-like, missing, malformed) plus
content fixtures: six genres; bright/dark/warm/cool/low-saturation/missing posters;
long and one-word titles; a long explanation; mixed-script metadata; cold-start and
mature-history profiles; uncertain availability; loading; error; and sequential
"Not tonight" replacement. A violet/magenta film seed was included as a legacy-identity
stress; it stayed one bounded film-derived hue, never a purple→pink gradient.

## 13. Blind methodology

The four treatments were randomly mapped to anonymized **Variant W / X / Y / Z**
(cryptographic Fisher–Yates) and presented in four counterbalanced column orders
(WXYZ / XYZW / YZWX / ZWXY), with grayscale and color-vision-simulation sheets and
full-resolution native crops. A two-stage protocol was used: (1) **blind visual
scoring** of five weighted dimensions (Film specificity and emotional usefulness 30 ·
Restraint and hierarchy preservation 25 · Cross-artwork robustness 20 · Semantic and
accessibility safety 15 · Implementation confidence 10) on a 1–5 scale, normalized by
`Σ (rating_d / 5) × weight_d` (**maximum 100, practical range 20–100** under the 1–5
rubric), with twenty mandatory written questions; (2) **objective reconciliation**;
(3) **private mapping reveal**; (4) this decision record. The scores are structured
single-reviewer decision evidence — not user research or a statistical study. The
private key is **not** stored in this repository.

## 14. Revealed mapping

Authoritative, revealed only after the scorecard was locked and reconciliation
complete:

- **Variant W = permissive envelope — cap C = 0.10**
- **Variant X = strict envelope — cap C = 0.04**
- **Variant Y = off control — no aura**
- **Variant Z = balanced envelope — cap C = 0.07**

Equal ladder spacing: **off → 0.04 → 0.07 → 0.10.**

## 15. Blind scores

| Dimension | Weight | Permissive (W) | Strict (X) | Off (Y) | Balanced (Z) |
|---|---:|---:|---:|---:|---:|
| Film specificity and emotional usefulness | 30 | 5 | 4 | 3 | 5 |
| Restraint and hierarchy preservation | 25 | 3 | 5 | 5 | 4 |
| Cross-artwork robustness | 20 | 3 | 5 | 5 | 5 |
| Semantic and accessibility safety | 15 | 4 | 5 | 5 | 5 |
| Implementation confidence | 10 | 4 | 4 | 5 | 4 |
| **Weighted total** | **100** | **77** | **92** | **88** | **93** |

Blind order: **balanced 93 → strict 92 → off 88 → permissive 77.**

## 16. Objective evidence

All four treatments passed the hard technical and accessibility gates. Observed
behavior:

- **off control:** no aura;
- **strict:** retained chroma cap C = 0.04; **no** semantic-safety reductions;
- **balanced:** retained chroma cap C = 0.07; **two** semantic-safety reductions;
- **permissive:** retained chroma cap C = 0.10; **five** semantic-safety reductions.

Shared controls remained fixed across all variants: output lightness L = 0.62; alpha
0.14; source-hue preservation; the semantic-danger threshold; low-saturation
suppression; deterministic gamut mapping; aura geometry; ADR 014 typography; ADR 015
foundation; ADR 016 decision marker; CTA, focus, and semantic colors. The rising
semantic-safety intervention count with rising cap (0 → 2 → 5) is the objective
signature of the restraint/robustness penalty the blind reviewer felt at higher chroma.

## 17. Pre-registered decision rule

Recorded before scoring; applied only at reconciliation. Any accessibility failure, any
color applied to text/control/semantic/marker, any color-only state, any stale aura
after replacement, any invented color from missing/low-saturation art, or any field
that dominates the focal film/title/CTA/reasoning — disqualifies. Then: compare
weighted totals; **a non-off treatment must beat the off control by ≥5 points** to
justify contextual film color in the pilots; a lead under 5 points **defaults to off**
(environmental color must earn its complexity); **when two non-off envelopes are within
5 points, choose the lower chroma envelope, unless the higher leads film specificity by
≥1 full rating point with no hierarchy/semantic/accessibility/robustness penalty**;
visibility alone, and "cinematic/premium/dramatic/more colorful," cannot justify a win;
do not blend envelopes or invent a fifth option. The result determines only the P2C-A
envelope; opacity remains for P2C-B; if off had won, P2C-B would not run.

## 18. Threshold-versus-lower-envelope reasoning

This is the crux of the decision and must not be misread.

Scores relative to the off control (88):

- **strict: 92 − 88 = +4** — **does not** clear the 5-point threshold on its own;
- **balanced: 93 − 88 = +5** — **clears** the threshold;
- **permissive: 77 − 88 = −11** — far below off; **rejected**.

Therefore **balanced — not strict — independently cleared the five-point off
threshold.** Balanced is what **proved contextual color could earn a role** over off.
Strict on its own would have defaulted to off under the ≥5-point bar.

Balanced and strict were then **within one point** of each other (93 vs 92), which
activates the **lower-envelope rule**: when two non-off envelopes are within five
points, choose the lower chroma envelope **unless** the higher one leads film
specificity by ≥1 full rating point **and** carries no hierarchy/semantic/
accessibility/robustness penalty. Balanced did lead film specificity by one point
(5 vs 4), **but** it also carried a **hierarchy/restraint penalty** (restraint 4 vs
strict's 5, with two semantic-safety reductions vs strict's zero). Because the
exception requires the higher envelope to have **no** such penalty, the exception was
**not** satisfied.

The pre-registered lower-envelope rule therefore **selected strict**. This is **not a
post-hoc compromise and not a blend** of strict and balanced — it is the direct,
pre-registered application of the tie-breaking rule. **Strict is the lowest tested
non-zero cap (C = 0.04).** **Permissive is rejected.** **Off remains a credible
baseline but is not selected**, because a non-off envelope (balanced) cleared the
threshold and the rule then resolved to the lower adjacent envelope (strict).

The documentation must not claim that strict independently cleared the five-point off
threshold; it did not. Balanced cleared it; the lower-envelope rule then carried the
accepted cap down to strict.

## 19. Exact accepted envelope

```text
maximum retained normalized chroma: C = 0.04
output lightness target:            L = 0.62
source hue:                         preserved
```

Subject to the fixed pipeline (§10): suppress missing/invalid source; suppress source
C < 0.04; semantic danger distance < 0.05 → reduce chroma without rotating hue;
suppress if the safety reduction drops below the low-saturation threshold; deterministic
gamut mapping by chroma reduction in 0.005 increments.

**Not part of this acceptance:** the compositing **alpha 0.14** is **not** accepted as
the production strength — it was only the fixed experimental control and remains
unresolved (P2C-B). **No global contextual-color production token** is created. **No
extraction algorithm** is accepted.

## 20. Fallback policy

Missing or malformed seed → **no aura** (no invented default color). Effectively
achromatic source (near-black, near-white, low-saturation grey; any source OKLCH
C < 0.04) → **suppress**; use the plain ADR 015 foundation; do not artificially boost
chroma. These fallbacks were verified across all caps: every must-suppress seed
returned no output color, for the correct chroma-measured reason.

## 21. Semantic-safety policy

Contextual color must never become semantic color. A deterministic, candidate-
independent rule compares the normalized aura against amber `#f5b860`, red `#ef6a6a`,
green `#5fd0a0`, and info `#7db5e6`; within the danger distance < 0.05 it **reduces
chroma — never rotates hue — and never modifies the semantics** until the aura clears,
or **suppresses** the aura if it cannot stay meaningful. At the accepted strict cap this
rule produced **zero** reductions across the seed matrix (strict sits comfortably clear
of the semantics); the rule still governs the envelope as a hard safety boundary.

## 22. Accessibility evidence

All four treatments passed the hard accessibility gates against the **composited**
background. Measured composited text contrast stayed well above the ADR 015 7:1 floor
(aggregate minimum ≥ 13.5:1 — a faint aura over the dark foundation barely moves
luminance). The aura never communicates state (it is removable without information
loss); CTA, decision-marker, focus, and semantic colors are unchanged and independent
of the aura; there is no clipping, overflow, touch-target reduction, layout shift, or
stale aura after replacement; the field renders its final state instantly under reduced
motion; color-vision simulations (protanopia/deuteranopia/tritanopia) showed the aura
never becomes the sole differentiator and never reads as a semantic. Color-vision sheets
are approximations, not medical certainty.

## 23. Consequences

- The contextual-color **normalization-envelope** question is **closed**: strict,
  C = 0.04, L = 0.62, hue preserved, under the fixed safety/fallback/gamut rules.
- The aura architecture (§9), normalization pipeline (§10), permitted/forbidden scope
  (§11), fallback policy (§20), and semantic-safety policy (§21) are **accepted** as the
  prototype/pilot pattern.
- The authority and the durable rule move the **normalization envelope** from
  provisional to accepted; **opacity/strength** and **extraction** stay on the
  unresolved lists.
- P2C-A focal surfaces and the scoped pilots may use the strict envelope (scoped/local
  values), gated for production by pilot validation; **no production aura is implemented
  by this ADR**.
- **P2C-B is warranted** (a non-off envelope cleared the threshold) but has **not**
  started.

## 24. What this does not decide

It does **not** decide aura **opacity/strength** (P2C-B); the **extraction** algorithm
or seed-generation method (manual deterministic seeds were used only to isolate
normalization); legacy-gradient survival; the long-form Film File serif role; bottom
navigation; or couple-mode mechanics. *(Update 2026-06-17: aura strength resolved by ADR 018;
the long-form serif role resolved Inter-only by P2D; legacy-gradient survival resolved — retired
from the target (P2E stopped without a decision); bottom navigation and couple-mode remain open;
extraction is deferred. See the Status update below.)* It does **not** authorize a production aura, a
global contextual-color token, or any production change. It does **not** change product
doctrine ([`product-doctrine.md`](../product-doctrine.md)) or
[`.claude/rules/product.md`](../../.claude/rules/product.md), and it does **not** alter
ADR 014, ADR 015, or ADR 016.

## 25. Production implications

**No production typography, CSS, tokens, components, routes, tests, or visual baselines
change as a result of this ADR.** The shipped product remains mixed and transitional.
This ADR authorizes only the normalization **envelope** for use in P2C-B and in scoped
pilot evaluation — not a production aura. Three disciplines hold: (1) **no global
contextual-color token** is created; any scoped pilot uses local values referencing the
accepted envelope. (2) **Alpha 0.14 is not promoted** — production strength is
unresolved until P2C-B. (3) **No extraction method is promoted** — a production aura
would additionally require an accepted, validated extraction/seed-generation approach.
The migration sequence stands: resolve opacity (P2C-B) and extraction → scoped Tonight
and Film File pilots with local values → pilot validation → shared primitives where
justified → systematic migration with deliberate visual-regression re-baselining.

## 26. Evidence limitations

A prototype with synthetic content and deterministic seeds (no engine, no
personalization, no real users, no live extraction); structured single-reviewer
decision evidence, not user research or a statistical study; the comparison was **not
fully treatment-blind** (one treatment visibly has no aura — mitigated by anonymous
labels, random mapping, counterbalanced order, hidden names/caps/measurements,
pre-registered scoring, scorecard lock before objective evidence, and reveal after
reconciliation); color-vision sheets are approximations, not medical certainty; numbers
are from the dev-server DOM, not a production benchmark. A bounded warm-leaning field
necessarily sits in color space near the warm semantics, mitigated by the cap and the
semantic-safety rule.

## 27. Follow-up work

- Run **P2C-B**: hold the accepted strict envelope (C = 0.04, L = 0.62, hue preserved)
  fixed and compare aura **opacity/strength** alternatives. Do not begin it in this
  documentation task.
- Resolve the **extraction/seed-generation** method separately before any production
  aura; manual deterministic seeds were an experiment device only.
- Keep the remaining authority prototype questions open: **bottom navigation and couple mode**
  (and the deferred contextual-color **extraction** method). (Legacy-gradient survival and the
  long-form serif role have since been resolved — see the Status update below.)
- When a contextual aura migrates, follow the migration gates: resolve opacity and
  extraction → scoped Tonight and Film File pilots (local values, not global tokens) →
  after both validate, promote shared primitives where justified → surface-by-surface
  migration with deliberate re-baselining. **Do not create an independent global
  contextual-color token; do not treat manual seed
  assignment as the accepted extraction method.** (Aura strength was subsequently
  accepted as alpha 0.14 by ADR 018.)

## Status update (2026-06-17 — Thoughtful Seatmate visual-system closure)

Of the remaining authority prototype questions listed above, two are now **resolved** and must
not be reopened during migration: **legacy-gradient survival** (retired from the target system —
the P2E gradient-survival study was stopped before a valid blind review and produced no decision;
no winner, no decision rule applied) and the **long-form Film File serif role** (P2D — Film File
stays Inter-only). The contextual-color **extraction** method (this ADR's follow-up) remains
**unresolved and deferred** — no automatic method is accepted; edge-context failed the P2C-D
holdout; contextual film color is implemented in no migration stage. This ADR's own decision —
the strict normalization envelope (hue preserved, L = 0.62, C = 0.04) — is unchanged and remains
authoritative. See
[`../ui/thoughtful-seatmate-visual-system-closure.md`](../ui/thoughtful-seatmate-visual-system-closure.md).
