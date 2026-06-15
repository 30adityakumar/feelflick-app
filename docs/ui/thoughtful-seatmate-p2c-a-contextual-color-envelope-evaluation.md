# Thoughtful Seatmate P2C-A — Contextual Film Color Normalization Envelope: Evaluation Evidence

> Evidence packet for the P2C-A experiment: whether a bounded, poster-derived contextual
> color field adds useful film specificity beyond the accepted warm-graphite foundation,
> and what the lowest chroma envelope is that remains expressive across artwork without
> contaminating hierarchy, semantics, readability or identity. Runs in an isolated,
> **un-merged** Design Lab prototype; the screenshot bundles, ZIPs, and the variant key
> live **outside this repository** and are not copied here.
>
> **§1–§21 below are the construction-phase packet, preserved as written.** During
> construction **no winner was chosen**, and the Variant W / X / Y / Z → treatment mapping
> and the exact envelope caps were **sealed** — not revealed in this document or either
> review bundle — so they could not anchor the blind review. **That sealing applied only
> through the blind-scoring and objective-reconciliation stages.** The blind scorecard was
> locked before the objective evidence was opened, and the mapping was revealed **only
> after** reconciliation. The authoritative mapping and the resulting decision are now
> recorded in the **Final outcome** section at the end of this document and in
> [ADR 017](../decisions/017-thoughtful-seatmate-p2c-a-contextual-color-envelope.md).
> **Aura opacity/strength and the extraction method remain unresolved (P2C-B).** No
> production change is authorized.

**Status:** **Closed by [ADR 017](../decisions/017-thoughtful-seatmate-p2c-a-contextual-color-envelope.md) — Accepted (2026-06-15).** Accepted envelope: **strict (C = 0.04, L = 0.62, hue preserved)**. See the **Final outcome** section. **Date:** 2026-06-15.
**Fixed by:** [ADR 014](../decisions/014-thoughtful-seatmate-p1-core-voice.md) (Inter), [ADR 015](../decisions/015-thoughtful-seatmate-p2a-foundation.md) (warm graphite / projection-ivory foundation), [ADR 016](../decisions/016-thoughtful-seatmate-p2b-decision-signal.md) (ivory-only decision signal).

## 1. Experiment question
Does a bounded, poster-derived contextual color field add useful film specificity beyond the
accepted warm-graphite foundation — and, if so, what is the lowest chroma envelope that
remains expressive across artwork without contaminating hierarchy, semantics, readability or
product identity? This is a **normalization-envelope** experiment — not an opacity, extraction,
multi-color-gradient, brand-palette, CTA, decision-signal, or production experiment.

## 2. Why P2C is split (A then B)
P2C-A tests the **normalization envelope** at one fixed compositing strength (alpha 0.14, a
control inherited from prior prototypes). P2C-B — later, after P2C-A is reviewed and formally
decided — holds the accepted envelope fixed and compares aura opacity/strength. The two are
not combined; opacity alternatives are **not** tested here and P2C-B candidates are not
pre-built. If the off control wins P2C-A, P2C-B does not run.

## 3. Fixed controls (ADR 014–016)
Immutable for every variant: **Inter** (ADR 014); the exact **ADR 015 foundation** (canvas
`#15120f`, surfaces `#1d1814`/`#241e19`/`#2d2621`, text `#f3ecdf`/`#beb8ad`/`#8d887f`, borders
`#302c28`/`#46423d`, neutral action `#efe7d7`/`#221b13`, focus `#f3ecdf`); the **semantic
palette** (amber `#f5b860`, red `#ef6a6a`, green `#5fd0a0`, info `#7db5e6`); the **ADR 016
ivory decision marker** (`#f3ecdf`, 7px dot / 14px slot, never recoloured by the aura); the
neutral primary action; one visible Tonight pick; sequential "Not tonight" replacement;
truthful reasoning; reduced-motion safety.

## 4. Extraction vs normalization
This experiment tests **normalization**, not extraction. No live/network poster pixels are
read during rendering. Each fixture has an **explicit deterministic artwork seed** (a manifest
of source colours); the normalization consumes only the seed. The seed is identical across all
variants; the poster image may render for context but never feeds the aura; a missing/invalid
seed produces no contextual color. Extraction method: manual representative-dominant-hue
assignment (deterministic constants). Extraction algorithms are neither evaluated nor chosen.

## 5. Aura architecture
`ContextualFilmAura` is one restrained, single-hue environmental field behind one focal film:
exactly one normalized hue; no second hue; no purple→pink or legacy gradient; no blend-mode/
geometry/opacity/blur variation; no colour on text, icons, borders, buttons or the marker; no
colour inside the poster; no ambient animation/pulse/parallax. Rendering: one fixed radial
field clipped to the focal hero, fading to transparent, normal compositing, no full-page wash.
Size, position, gradient stops, falloff, blur, clipping, DOM, z-index, transition and
responsive behaviour are identical across variants. **Fixed compositing alpha = 0.14** (a
control; not varied in P2C-A).

## 6. Fixed normalization pipeline
One deterministic pipeline runs for every non-off treatment: validate seed → OKLCH → suppress
missing/invalid/effectively-achromatic → preserve hue → normalize lightness to a fixed target
→ cap chroma to the treatment envelope → candidate-independent semantic-safety desaturation →
deterministic gamut map → composite at alpha 0.14. The fixed gates (output lightness, the
low-saturation threshold, the semantic-danger distance, the gamut method) were chosen before
capture, are documented in the objective bundle, and are identical across candidates — they
are **not** candidate variables. Source hue is preserved (never rotated to a preferred hue).

## 7. Single experimental variable
Four treatments: one contextual-color-**off** control and three normalized chroma-envelope
levels (a monotonic, equally-spaced ladder of maximum retained chroma). All non-off treatments
share the same seed, source hue, output lightness, alpha, semantic-safety rule, gamut mapping,
and aura geometry. The **only** treatment difference is the maximum retained normalized chroma.
Exact caps are sealed; even the highest cap stays well below semantic chroma so it remains
plausibly adoptable; no candidate is an intentionally excessive theatrical option.

## 8. Permitted and forbidden scope
**Permitted** (one film is the clear focal object): Tonight's primary recommendation hero;
Film File's hero; their mobile equivalents; the active replacement film after "Not tonight."
Normal composition shows the field behind a single focal recommendation only.
**Forbidden:** landing before a focal film exists; navigation; logo; CTA; secondary controls;
the decision marker; focus ring; chips; filters; tabs; text; icons; borders; ratings; caution;
errors; watched/success; availability; confidence; loading; missing-poster fallback; Diary
rows; Cinematic DNA; film grids; multi-film comparison; footer; modal chrome; AI/premium
signaling; decorative areas. After "Not tonight" the old aura disappears with the old film.

## 9. Fallback policy
Missing or malformed seed → no aura (no invented default colour). Source below the
low-saturation threshold (near-black, near-white, low-saturation grey) → suppress; use the
plain ADR 015 foundation; do not artificially boost chroma.

## 10. Semantic-safety policy
Contextual color must never become semantic color. A deterministic, candidate-independent rule
compares the normalized aura against amber/red/green/info; inside the pre-registered danger
distance it reduces chroma (never rotates hue, never modifies the semantics) until it clears,
or suppresses the aura if it cannot stay meaningful. Every intervention is recorded in the
objective bundle.

## 11. Fixture matrix
Eighteen deterministic stress seeds spanning colour space (deep red, orange, yellow, olive,
green, cyan, cool blue, deep blue, violet, magenta, skin-tone, warm beige, near-black,
near-white, low-saturation grey, neon-like, missing, malformed) plus content fixtures (six
genres; bright/dark/warm/cool/low-saturation/missing posters; long/one-word titles; long
explanation; mixed-script metadata; cold-start and mature-history profiles; uncertain
availability; loading; error; sequential replacement). A violet/magenta film seed is included
for stress; it stays one bounded film-derived hue, never a purple→pink gradient or identity.

## 12. Accessibility gates
Pre-capture, every treatment must satisfy: all ADR 015 text-contrast requirements **measured
against the composited rendered background**; unchanged CTA/decision-signal/focus/semantic
colours; the aura never communicates state (removable without information loss); no
text/control/border/icon/marker inherits the aura colour; no clipping/overflow/touch-target
reduction/layout shift/stale aura; reduced-motion complete; 200% zoom and 360px usable;
forced-colors understandable; missing/low-saturation seed falls back safely; semantic-danger
input desaturated/suppressed by the fixed rule. A hard accessibility failure disqualifies a
treatment; no candidate is repaired with candidate-specific geometry/opacity/thresholds.

## 13. Anonymization and methodological limitation
Treatments are randomly mapped to **W / X / Y / Z** (cryptographic Fisher–Yates) with four
counterbalanced orders. Candidate names, cap values, and the mapping are kept out of both
bundles (sealed key). **This is not fully treatment-blind:** one treatment visibly has no
contextual color. Protections: anonymous labels, random assignment, counterbalanced order,
hidden names/caps/measurements, pre-registered scoring, scorecard lock before objective
evidence, mapping reveal only after reconciliation.

## 14. Two-stage review protocol
1. **Blind visual scoring** — the blind bundle; score five weighted dimensions, answer twenty
   questions, lock the scorecard. No numeric colour evidence present.
2. **Objective reconciliation** — only after locking, open the objective bundle (metrics +
   pipeline / seed-manifest / accessibility / semantic-separation / intervention / geometry /
   scope / determinism audits).
3. **Private mapping reveal** — unseal the W/X/Y/Z → treatment key.
4. **Decision record** — a later ADR records the outcome (an envelope, or off) if accepted.

## 15. Scorecard
Five weighted dimensions: Film specificity and emotional usefulness 30 · Restraint and
hierarchy preservation 25 · Cross-artwork robustness 20 · Semantic and accessibility safety 15
· Implementation confidence 10. `weighted_total = Σ (rating_d / 5) × weight_d` — **maximum 100,
practical range 20–100**. Twenty mandatory written questions accompany the ratings.

## 16. Pre-registered decision rule
Any accessibility failure, any colour applied to text/control/semantic/marker, any colour-only
state, any stale aura after replacement, any invented colour from missing/low-saturation art,
or any field that dominates the focal film/title/CTA/reasoning — disqualifies. Compare weighted
totals; a non-off treatment must beat off by **≥5 points** to justify contextual film colour in
the pilots; under 5 points defaults to **off**; ties between non-off envelopes prefer the lower
chroma (unless the higher leads film-specificity by ≥1 full point with no penalty); visibility/
"cinematic"/"premium" cannot win; do not blend envelopes or invent a fifth option. The result,
if any, determines only the P2C-A envelope; **opacity remains for P2C-B**; if off wins, P2C-B
does not run. **No winner is chosen here, and the rule was not applied.**

## 17. Objective metrics plan
From the rendered DOM + the deterministic pipeline: per-seed source/output OKLCH, fixed alpha,
composited background, text/CTA/marker/focus contrast, nearest semantic + distance, desaturation/
suppression flags + reasons, gamut correction, aura geometry/coverage, pixel-difference from off,
marker count, geometry, overflow, layout shift, stale-aura state, console errors — plus a
source-level and rendered-DOM single-variable audit. The objective bundle proves the foundation,
typography, marker, semantics, alpha, aura geometry and seed are identical and only the envelope
cap differs, and that forbidden/missing-seed surfaces are pixel-identical.

## 18. Evidence limitations
A prototype with synthetic content and deterministic seeds (no engine, no personalization, no
real users, no live extraction); structured single-reviewer decision evidence, not user research
or a statistical study; not fully treatment-blind (§13); colour-vision sheets are approximations,
not medical certainty; numbers are from the dev-server DOM, not a production benchmark. A bounded
warm-leaning field necessarily sits in colour space near the warm semantics, mitigated by the
caps + semantic-safety rule.

## 19. No winner
No treatment is recommended; the off control is a legitimate outcome. This packet establishes
that the comparison is single-variable, deterministic, scope-controlled and accessible; the
judgement is the reviewer's, under the pre-registered rule, after reconciliation and reveal.

## 20. Opacity remains unresolved
Aura compositing strength is fixed at 0.14 here and is **not** evaluated. It is the subject of
the separate, later P2C-B experiment, which runs only if an envelope is accepted.

## 21. No production change authorized
P2C-A is an isolated, dev-guarded prototype, absent from production builds. It changes no
production tokens, components, routes, fonts, CSS, or visual baselines, and does not begin the
Tonight or Film File pilots. Any adoption would follow the authority's migration gates via a
future decision record.

---

# Final outcome (post-reveal decision)

> Recorded after the two-stage review completed. **No winner was selected during
> construction.** The decision was made only after (1) the blind scorecard was locked,
> (2) the objective evidence was reconciled against the locked scores, and (3) the private
> Variant→treatment mapping was revealed. The authoritative decision is
> [ADR 017](../decisions/017-thoughtful-seatmate-p2c-a-contextual-color-envelope.md).

## A. Revealed mapping

| Variant | Treatment | Cap |
|---|---|---|
| **W** | permissive envelope | C = 0.10 |
| **X** | strict envelope | C = 0.04 |
| **Y** | off control | no aura |
| **Z** | balanced envelope | C = 0.07 |

Equal ladder spacing: **off → 0.04 → 0.07 → 0.10.**

## B. Locked blind scores

| Dimension | Weight | Permissive (W) | Strict (X) | Off (Y) | Balanced (Z) |
|---|---:|---:|---:|---:|---:|
| Film specificity and emotional usefulness | 30 | 5 | 4 | 3 | 5 |
| Restraint and hierarchy preservation | 25 | 3 | 5 | 5 | 4 |
| Cross-artwork robustness | 20 | 3 | 5 | 5 | 5 |
| Semantic and accessibility safety | 15 | 4 | 5 | 5 | 5 |
| Implementation confidence | 10 | 4 | 4 | 5 | 4 |
| **Weighted total** | **100** | **77** | **92** | **88** | **93** |

Blind order: **balanced 93 → strict 92 → off 88 → permissive 77.**

## C. Objective behavior

All four treatments passed the hard technical and accessibility gates.

- **off control:** no aura;
- **strict:** retained chroma cap C = 0.04; **no** semantic-safety reductions;
- **balanced:** retained chroma cap C = 0.07; **two** semantic-safety reductions;
- **permissive:** retained chroma cap C = 0.10; **five** semantic-safety reductions.

Shared controls stayed fixed across all variants (output lightness L = 0.62, alpha 0.14,
source-hue preservation, semantic-danger threshold, low-saturation suppression,
deterministic gamut mapping, aura geometry, ADR 014 typography, ADR 015 foundation,
ADR 016 decision marker, CTA/focus/semantic colors). Composited text contrast stayed well
above the ADR 015 7:1 floor (aggregate minimum ≥ 13.5:1).

## D. Exact decision reasoning (threshold versus lower-envelope)

The pre-registered rule required a non-off treatment to beat the off control by **≥5
points**. Scores relative to off (88):

- **strict: 92 − 88 = +4** — does **not** clear the threshold on its own;
- **balanced: 93 − 88 = +5** — **clears** the threshold;
- **permissive: 77 − 88 = −11** — rejected.

So **balanced — not strict — independently cleared the five-point off threshold**, proving
contextual color could earn a role over off. Strict and balanced were then **within one
point** (93 vs 92), activating the **lower-envelope rule**: when two non-off envelopes are
within five points, choose the lower chroma envelope **unless** the higher leads film
specificity by ≥1 full rating point **with no** hierarchy/semantic/accessibility/robustness
penalty. Balanced did lead film specificity by one point (5 vs 4) **but** carried a
**hierarchy/restraint penalty** (restraint 4 vs strict's 5; two semantic-safety reductions
vs strict's zero), so the exception was **not** satisfied. The lower-envelope rule therefore
selected **strict** — the **lowest tested non-zero cap**. This is **not a post-hoc
compromise or a blend** of strict and balanced. **Permissive is rejected.** **Off remains a
credible baseline but is not selected.** The documentation must not claim strict
independently cleared the off threshold — balanced did, and the lower-envelope rule carried
the accepted cap down to strict.

## E. Exact accepted envelope

```text
maximum retained normalized chroma: C = 0.04
output lightness target:            L = 0.62
source hue:                         preserved
```

## F. Fixed safety and fallback rules (accepted)

- suppress missing/invalid seed → no aura;
- suppress effectively achromatic source where **source C < 0.04**;
- semantic danger distance **< 0.05** → **reduce chroma, never rotate hue**, never modify
  the semantics; suppress if the reduction drops below the low-saturation threshold;
- deterministic **gamut mapping by chroma reduction** (0.005 increments) until in sRGB;
- semantics unchanged: amber `#f5b860`, red `#ef6a6a`, green `#5fd0a0`, info `#7db5e6`.

## G. Accepted contextual-color scope

**Permitted** (one focal film only): Tonight primary recommendation hero; Film File hero;
their mobile equivalents; the active replacement film after "Not tonight." **Forbidden**
everywhere else — landing before a focal film, navigation, bottom navigation, logo/wordmark,
CTA, secondary controls, the decision marker, focus ring, chips, tabs, filters, text, icons,
borders, ratings, caution, errors, watched/success, availability, confidence, loading,
missing-poster fallback, Diary, Cinematic DNA, grids, multi-film comparison, footer, modal
chrome, AI/premium signaling, decorative empty regions. The aura stays single-hue,
poster-derived through a deterministic seed, environmental only, never semantic, never a
brand or control color, never a purple→pink gradient, never global.

## H. Unresolved: aura opacity/strength

The compositing **alpha (0.14) was only the fixed experimental control** and is **not**
accepted. Aura opacity/strength is the subject of **P2C-B**, which holds the accepted strict
envelope fixed and compares strengths. **P2C-B has not started.**

## I. Unresolved: extraction

P2C-A used **manually assigned deterministic artwork seeds** solely to isolate
normalization. **No extraction algorithm or seed-generation method is accepted**; a
production aura would additionally require a validated extraction approach.

## J. Decision scope

ADR 017 accepts **only the normalization envelope** for use in P2C-B and scoped pilot
evaluation. It does **not** authorize a production aura, a global contextual-color token,
the alpha, or an extraction method, and it does not alter ADR 014/015/016 or product
doctrine. **No production change is authorized.**

## K. Integrity notes

- **No winner was selected during construction**; the decision happened only after blind
  scoring, objective reconciliation, and the private mapping reveal.
- **No private key, blind/objective ZIP, screenshots, generated metrics, or normalization/
  capture scripts are stored in this repository** — they live only outside it.
- **P2C-B has not started**, and **no production change is authorized**.
- Authoritative decision record:
  [ADR 017](../decisions/017-thoughtful-seatmate-p2c-a-contextual-color-envelope.md).
