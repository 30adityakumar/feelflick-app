# ADR 018 — Thoughtful Seatmate P2C-B: Contextual-Color Aura Strength

> ⚠️ **Superseded by [ADR 021](021-adaptive-editorial-cinema-foundation.md) where it conflicts.**
> The contextual-color aura remains **deferred and unimplemented** under Adaptive Editorial
> Cinema. Preserved as history, not a production target.

**Status:** Accepted (deferred; superseded by ADR 021 where it conflicts)
**Date:** 2026-06-15
**Decided by:** Aditya Kumar, informed by one completed AI-assisted blind review of the anonymized P2C-B evidence bundle, followed by objective reconciliation. The blind scorecard was locked **before** the objective evidence was opened, and the authoritative Variant→treatment mapping was revealed **only after** reconciliation. No winner was selected during construction.

> Decision statement:
>
> **The accepted contextual-film-color aura strength is alpha 0.14, applied only
> to the ADR 017 strict normalization envelope (C = 0.04, L = 0.62, source
> hue preserved) and only on a single focal-film surface. Alpha 0.07 was too
> subtle to independently justify its complexity, while alpha 0.21 weakened
> hierarchy and product consistency. Extraction remains unresolved. No production
> implementation is authorized by this decision.**

Companion docs: active authority
[`design-authority-thoughtful-seatmate.md`](../ui/design-authority-thoughtful-seatmate.md),
durable rule [`.claude/rules/design-system.md`](../../.claude/rules/design-system.md),
full evidence packet
[`thoughtful-seatmate-p2c-b-aura-strength-evaluation.md`](../ui/thoughtful-seatmate-p2c-b-aura-strength-evaluation.md).
Predecessors: [ADR 014](014-thoughtful-seatmate-p1-core-voice.md) (Inter), [ADR 015](015-thoughtful-seatmate-p2a-foundation.md) (warm graphite / projection-ivory foundation), [ADR 016](016-thoughtful-seatmate-p2b-decision-signal.md) (ivory-only decision signal), [ADR 017](017-thoughtful-seatmate-p2c-a-contextual-color-envelope.md) (strict normalization envelope).

---

## 1. Status

Accepted. This closes the **P2C-B — Contextual-Color Aura Strength** prototype experiment.
It is a **prototype-and-pilot-scoped** visual-system decision — **not** a production token
promotion, **not** a production aura, and **not** a product-strategy change. It resolves only
the aura **compositing strength** (alpha) for the already-accepted ADR 017 normalization
envelope. The **extraction** method remains deliberately undecided.

## 2. Decision

**The accepted contextual-film-color aura strength is alpha 0.14, applied only to the ADR 017
strict normalization envelope (C = 0.04, L = 0.62, source hue preserved) and only on a single
focal-film surface. Alpha 0.07 was too subtle to independently justify its complexity, while
alpha 0.21 weakened hierarchy and product consistency. Extraction remains unresolved. No
production implementation is authorized by this decision.**

## 3. Context

[ADR 017](017-thoughtful-seatmate-p2c-a-contextual-color-envelope.md) accepted the contextual-color
**normalization envelope** (strict: hue preserved, L = 0.62, retained chroma cap C = 0.04) but
deliberately left the aura **compositing strength** open — a fixed control of 0.14 in P2C-A — to be
decided separately so the two variables would not confound each other. P2C-B is that controlled
experiment: it holds the accepted envelope fixed and varies **only** the compositing alpha, on real
FeelFlick focal-film surfaces, before any pilot or production work. [ADR 014](014-thoughtful-seatmate-p1-core-voice.md)
(Inter), [ADR 015](015-thoughtful-seatmate-p2a-foundation.md) (foundation), and
[ADR 016](016-thoughtful-seatmate-p2b-decision-signal.md) (ivory decision signal) remain fixed.

## 4. Questions resolved

1. **Does a non-off aura strength earn a role over off, and which? → Yes — alpha 0.14** (the
   reference strength independently cleared the pre-registered threshold; see §15–§16).
2. **The complete accepted contextual-color treatment is now fully specified:** preserve source
   hue, output L = 0.62, retained chroma cap C = 0.04, **compositing alpha 0.14**, single
   focal-film scope.

## 5. Questions still unresolved

- **The extraction algorithm and seed-generation method.** P2C-A and P2C-B both used **manually
  assigned deterministic artwork seeds** only to isolate the variable under test; **no extraction
  method is accepted**, and manual deterministic seeds are **not** an accepted production extraction
  method.
- Exact **bottom-navigation structure** and **couple-mode** mechanics remain open, and the
  contextual-color **extraction** method remains deferred. *(Update 2026-06-17: legacy-gradient
  survival → resolved, retired from the target (P2E stopped without a decision); the long-form Film
  File serif role → resolved Inter-only by P2D. See the Status update at the end of this file.)*

## 6. Fixed ADR 014–017 controls

Immutable for every variant, unchanged by this experiment: **Inter** (ADR 014); the exact **ADR 015
foundation** (canvas `#15120f`, surfaces `#1d1814`/`#241e19`/`#2d2621`, text
`#f3ecdf`/`#beb8ad`/`#8d887f`, borders `#302c28`/`#46423d`, neutral action `#efe7d7`/`#221b13`, focus
`#f3ecdf`); the semantic palette (amber `#f5b860`, red `#ef6a6a`, green `#5fd0a0`, info `#7db5e6`);
the **ADR 016 ivory decision marker** (`#f3ecdf`, 7px dot in a 14px slot, never recoloured by the
aura); and the **ADR 017 normalization envelope** — preserve source hue, output L = 0.62, retained
chroma cap C = 0.04, with the fixed gates: source C < 0.04 → suppress; semantic danger distance
< 0.05 → reduce chroma only, never rotate hue; suppress if the safety reduction falls below the
low-saturation threshold; deterministic gamut mapping by chroma reduction in 0.005 steps. The aura
geometry is also fixed. Verified identical across all four variants; **only the compositing alpha
differed**, and the normalized aura colour was identical across non-off variants for a given film.

## 7. Experimental boundary

P2C-B tested **only the aura compositing alpha**. It is not a chroma-envelope, hue, extraction,
geometry, gradient, blur, or motion experiment, and not a production implementation. No live pixel
extraction was used; the same deterministic seeds as P2C-A held the normalized colour fixed while
strength varied.

## 8. Aura architecture

The accepted aura is: one normalized hue; one radial environmental field behind the focal film;
**compositing alpha 0.14**; fixed geometry, clipping, falloff, and z-index; one fixed transition
(maximum 180ms; instant under reduced motion); no multi-color gradient; no legacy purple→pink
gradient; no blend-mode variation; no full-page wash; and **no colour applied to text, controls, the
decision marker, focus, icons, borders, or semantics**. The colour source is the ADR 017 envelope;
only the compositing alpha is fixed by this decision.

## 9. Permitted and forbidden scope

**Permitted** (only where one film is the clear focal object): (1) the Tonight primary
recommendation hero; (2) the Film File hero; (3) their mobile equivalents; (4) the active
replacement film after "Not tonight."

**Forbidden:** landing before a focal film exists; navigation and bottom navigation; logo; CTA and
controls; the decision marker and focus; chips, tabs, and filters; text, icons, and borders; ratings
and semantic statuses; loading and error; missing-poster fallback; Diary; Cinematic DNA; grids and
multi-film comparison; footer; modal chrome; AI/premium signaling; decorative regions. After "Not
tonight" the old field disappears with the old film (no stale aura, no dual field).

## 10. Fixture matrix

Eighteen deterministic stress seeds spanning colour space (deep red, orange, yellow, olive, green,
cyan, cool blue, deep blue, violet, magenta, skin-tone, warm beige, near-black, near-white,
low-saturation grey, neon-like, missing, malformed) plus content fixtures (six genres;
bright/dark/warm/cool/low-saturation/missing posters; long/one-word titles; long explanation;
mixed-script metadata; cold-start and mature-history profiles; uncertain availability; loading; error;
sequential replacement) and opacity-specific stresses (large empty hero region, dense explanation
region, poster-edge match and contrast, aura behind a long title, aura adjacent to semantic status,
and low-/high-display-brightness approximations).

## 11. Blind methodology

The four treatments were randomly mapped to anonymized **Variant W / X / Y / Z** (cryptographic
Fisher–Yates) and presented in four counterbalanced column orders (WXYZ / XYZW / YZWX / ZWXY), with
grayscale, colour-vision, and display-brightness simulation sheets and full-resolution native crops. A
two-stage protocol was used: (1) **blind visual scoring** of five weighted dimensions (Film presence
and emotional usefulness 30 · Restraint and hierarchy preservation 30 · Cross-artwork and
cross-surface robustness 20 · Accessibility and semantic safety 10 · Implementation confidence 10) on
a 1–5 scale, normalized by `Σ (rating_d / 5) × weight_d` (**maximum 100, practical range 20–100**),
with twenty mandatory written questions; (2) **objective reconciliation**; (3) **private mapping
reveal**; (4) this decision record. The scores are structured single-reviewer decision evidence — not
user research or a statistical study. The private key is **not** stored in this repository.

## 12. Revealed mapping

Authoritative, revealed only after the scorecard was locked and reconciliation complete:

- **Variant W = low strength — alpha 0.07**
- **Variant X = high strength — alpha 0.21**
- **Variant Y = reference strength — alpha 0.14**
- **Variant Z = off control — alpha 0**

Equal ladder: **0 → 0.07 → 0.14 → 0.21** (the reference strength is the prior P2C-A fixed control).

## 13. Blind scores

| Dimension | Weight | Low (W) | High (X) | Reference (Y) | Off (Z) |
|---|---:|---:|---:|---:|---:|
| Film presence and emotional usefulness | 30 | 4 | 5 | 5 | 3 |
| Restraint and hierarchy preservation | 30 | 5 | 3 | 4 | 5 |
| Cross-artwork and cross-surface robustness | 20 | 5 | 4 | 5 | 5 |
| Accessibility and semantic safety | 10 | 5 | 5 | 5 | 5 |
| Implementation confidence | 10 | 4 | 4 | 5 | 5 |
| **Weighted total** | **100** | **92** | **82** | **94** | **88** |

Blind order: **reference 94 → low 92 → off 88 → high 82.**

## 14. Objective evidence

All four treatments passed the hard accessibility and technical gates. The experiment remained
single-variable: ADR 014 Inter, all twelve ADR 015 foundation values, the semantic palette, the
ADR 016 marker, the ADR 017 envelope (cap C = 0.04, L = 0.62, hue preserved), and the aura geometry
were identical across variants; the normalized aura colour was identical across the non-off variants;
**only the compositing alpha differed.** Across the 18 stress seeds the strict envelope produced
zero semantic-safety desaturations (the field sits clear of the danger band at C = 0.04), so rising
strength scaled the same safe low-chroma colour rather than moving it toward a semantic. Composited
text and ivory-marker contrast stayed far above the ADR 015 7:1 floor at every strength; higher
strength moved the composited background luminance progressively more — the empirical signature of
the variable — but never near the floor. Forbidden and suppressed surfaces were pixel-identical
across variants.

## 15. Pre-registered decision rule

Recorded before capture; applied only at reconciliation. Any accessibility failure, any colour
entering text/controls/semantics/marker/focus, any colour-only state, any stale aura after
replacement, any strength that makes the aura dominant over title/poster/CTA/reasoning, or any
strength that makes FeelFlick appear film-**themed** rather than film-**aware** — disqualifies. Then:
**each non-off treatment must independently beat the off control by ≥5 points** to qualify; a non-off
lead below 5 points does not qualify and defaults to off; among qualifying treatments within 5 points
of one another, choose the **lower** strength (a higher strength overrides only if it leads film
presence by ≥1 full point with no restraint/hierarchy/robustness/semantic/accessibility penalty); if
no non-off treatment qualifies, select off; visibility and "cinematic/premium/dramatic/richer" cannot
win; do not average, blend, or invent a fifth value.

## 16. Threshold reasoning

Scores relative to the off control (88):

- **low: 92 − 88 = +4** — **does not** clear the ≥5-point threshold; does not qualify.
- **reference: 94 − 88 = +6** — **clears** the threshold; qualifies.
- **high: 82 − 88 = −6** — **below off**; lost to the off control; rejected.

Therefore **the reference strength (alpha 0.14) independently cleared the five-point threshold over
off, low (alpha 0.07) did not, and high (alpha 0.21) lost to off.** Because **exactly one** non-off
treatment qualified, the lower-strength tie-break did **not** apply and **no tie-break was needed**.
The accepted strength is the single qualifying treatment, alpha 0.14. **No blending, averaging, or
interpolation occurred** — the accepted value is one of the pre-registered ladder strengths, selected
by the rule. Off remains a credible baseline but is not selected (a qualifying non-off treatment
exists). Low is not selected (it did not clear the threshold); high is rejected (it scored below off,
reflecting weakened hierarchy and product consistency).

## 17. Exact accepted alpha

```text
aura compositing alpha: 0.14
```

Applied only to the ADR 017 strict envelope (retained chroma cap C = 0.04, output L = 0.62, source
hue preserved) and only on a single focal-film surface. This is **not** a new global production token,
**not** a production aura, and **not** an accepted extraction method.

## 18. Accessibility evidence

All four treatments passed the hard accessibility gates against the **composited** background. At the
accepted alpha 0.14, composited primary-text and ivory-marker contrast stayed far above the ADR 015
7:1 floor; CTA, decision-marker, focus, and semantic colours are unchanged and independent of the
aura; the aura communicates no state (removable without information loss); no text/control/icon/border/
marker inherits the aura colour; there is no clipping, overflow, touch-target reduction, layout shift,
or stale aura; the field renders its final state instantly under reduced motion; colour-vision and
display-brightness simulations show the aura never becomes the sole differentiator and never reads as
a semantic (approximations, not medical or device certainty).

## 19. Consequences

- The contextual-color **aura-strength** question is **closed**: alpha 0.14 on the ADR 017 strict
  envelope, single focal-film scope.
- The complete accepted contextual-color treatment is now fully specified (§17): hue preserved,
  L = 0.62, C = 0.04, alpha 0.14, focal-film scope.
- The authority and the durable rule move aura strength from provisional to accepted; **extraction**
  stays on the unresolved list.
- P2C-B focal surfaces and the scoped pilots may use this treatment with scoped/local values, gated
  for production by pilot validation; **no production aura is implemented by this ADR**.

## 20. What this does not decide

It does **not** decide the **extraction** algorithm or seed-generation method (manual deterministic
seeds were an experiment device only and are **not** an accepted production extraction method); legacy
purple→pink gradient survival; the long-form Film File serif role; bottom navigation; or couple-mode
mechanics. *(Update 2026-06-17: the long-form serif role resolved Inter-only by P2D; legacy-gradient
survival resolved — retired from the target (P2E stopped without a decision); bottom navigation and
couple-mode remain open; extraction is deferred. See the Status update below.)* It does **not** authorize a production aura, a global contextual-color token, or any
production change. It does **not** reopen the ADR 017 normalization envelope, change the ladder, or
blend strengths. It does **not** alter product doctrine
([`product-doctrine.md`](../product-doctrine.md)) or
[`.claude/rules/product.md`](../../.claude/rules/product.md), and it leaves ADR 014–017 unchanged.

## 21. Production implications

**No production typography, CSS, tokens, components, routes, tests, or visual baselines change as a
result of this ADR.** The shipped product remains mixed and transitional. This ADR fixes only the aura
**strength** for the accepted strict envelope, for use in scoped pilot evaluation — not a production
aura. Disciplines: **no global contextual-color token** is created; any scoped pilot uses local values
referencing the accepted treatment. A production aura would additionally require an accepted, validated
**extraction/seed-generation** method. The migration sequence stands: resolve extraction → scoped
Tonight and Film File pilots with local values → pilot validation → shared primitives where justified →
systematic migration with deliberate visual-regression re-baselining.

## 22. Evidence limitations

A prototype with synthetic content and deterministic seeds (no engine, no personalization, no real
users, no live extraction); structured single-reviewer decision evidence, not user research or a
statistical study; the comparison was **not fully treatment-blind** (the off control may appear to
have no field, and strengths may be approximately inferable — mitigated by anonymous labels,
cryptographic assignment, counterbalanced order, hidden numeric strengths/names/measurements,
pre-registered scoring, scorecard lock before objective evidence, and reveal after reconciliation);
colour-vision and display-brightness sheets are approximations, not medical or device certainty;
numbers are from the dev-server DOM, not a production benchmark.

## 23. Follow-up work

- Resolve the **extraction/seed-generation** method before any production aura; manual deterministic
  seeds were an experiment device only and are **not** an accepted production solution.
- Carry the accepted treatment (hue preserved, L = 0.62, C = 0.04, alpha 0.14, focal-film scope) into
  the scoped Tonight and Film File pilots with scoped/local values, gated by pilot validation.
- Keep the remaining authority prototype questions open: **bottom navigation and couple mode** (and
  the deferred contextual-color **extraction** method). (Legacy-gradient survival and the long-form
  serif role have since been resolved — see the Status update below.)
- When a contextual aura migrates, follow the migration gates: resolve extraction → scoped pilots
  (local values, not global tokens) → after both validate, promote shared primitives where justified →
  surface-by-surface migration with deliberate re-baselining. **Do not create an independent global
  contextual-color token, and do not treat manual seed assignment as the accepted extraction method.**

## Status update (2026-06-17 — Thoughtful Seatmate visual-system closure)

Of the remaining authority prototype questions listed above, two are now **resolved** and must not
be reopened during migration: **legacy-gradient survival** (retired from the target system — the P2E
gradient-survival study was stopped before a valid blind review and produced no decision; no winner,
no decision rule applied) and the **long-form Film File serif role** (P2D — Film File stays
Inter-only). The contextual-color **extraction** method remains **unresolved and deferred** (no
automatic method accepted; edge-context failed the P2C-D holdout; contextual film color is implemented
in no migration stage), and bottom-navigation and couple-mode remain open product questions. This
ADR's own decision — aura strength alpha 0.14 on the strict envelope — is unchanged and remains
authoritative. See
[`../ui/thoughtful-seatmate-visual-system-closure.md`](../ui/thoughtful-seatmate-visual-system-closure.md).
