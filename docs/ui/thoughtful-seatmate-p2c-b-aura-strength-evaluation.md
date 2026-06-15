# Thoughtful Seatmate P2C-B — Contextual Film Color Aura Strength: Evaluation Evidence

> Evidence packet for the P2C-B experiment: with the accepted ADR 017 normalization envelope
> held fixed, what is the lowest aura **compositing strength** that adds meaningful film presence
> over an off control without becoming decorative, weakening hierarchy, tinting neutral elements,
> or making FeelFlick's identity change between films? Runs in an isolated, **un-merged** Design
> Lab prototype; the screenshot bundles, ZIPs, and the variant key live **outside this
> repository** and are not copied here.
>
> **§1–§17 below are the construction-phase packet, preserved as written.** During construction
> **no winner was chosen**, and the Variant W / X / Y / Z → strength assignment (including which
> variant is the off control) and the exact per-variant strengths were **sealed** — not revealed in
> this document or either review bundle — so they could not anchor the blind review. **That sealing
> applied only through the blind-scoring and objective-reconciliation stages.** The blind scorecard
> was locked before the objective evidence was opened, and the mapping was revealed **only after**
> reconciliation. The authoritative mapping and the resulting decision are now recorded in the
> **Final outcome** section at the end of this document and in
> [ADR 018](../decisions/018-thoughtful-seatmate-p2c-b-aura-strength.md). **The normalization
> envelope (ADR 017) was out of scope here; the extraction method remains unresolved.** No
> production change is authorized.

**Status:** **Closed by [ADR 018](../decisions/018-thoughtful-seatmate-p2c-b-aura-strength.md) — Accepted (2026-06-15).** Accepted aura strength: **alpha 0.14** on the strict envelope (C = 0.04, L = 0.62, hue preserved). See the **Final outcome** section. **Date:** 2026-06-15.
**Fixed by:** [ADR 014](../decisions/014-thoughtful-seatmate-p1-core-voice.md) (Inter), [ADR 015](../decisions/015-thoughtful-seatmate-p2a-foundation.md) (warm graphite / projection-ivory foundation), [ADR 016](../decisions/016-thoughtful-seatmate-p2b-decision-signal.md) (ivory decision signal), [ADR 017](../decisions/017-thoughtful-seatmate-p2c-a-contextual-color-envelope.md) (strict contextual-color normalization envelope).

## 1. Experiment question
With the accepted strict normalization envelope fixed, what is the lowest aura compositing
strength that adds meaningful film presence over an off control without becoming decorative,
weakening hierarchy, tinting neutral elements, or making FeelFlick's identity change between
films? This is a **compositing-strength** experiment — not a chroma-envelope, hue, extraction,
geometry, gradient, blur, motion, or production experiment.

## 2. Fixed ADR 014–017 controls
Immutable for every variant: **Inter** (ADR 014); the exact **ADR 015 foundation** (canvas
`#15120f`, surfaces `#1d1814`/`#241e19`/`#2d2621`, text `#f3ecdf`/`#beb8ad`/`#8d887f`, borders
`#302c28`/`#46423d`, neutral action `#efe7d7`/`#221b13`, focus `#f3ecdf`); the **semantic palette**
(amber `#f5b860`, red `#ef6a6a`, green `#5fd0a0`, info `#7db5e6`); the **ADR 016 ivory decision
marker** (`#f3ecdf`, 7px dot / 14px slot, never recoloured by the aura); and the **ADR 017
normalization envelope** — preserve source hue, normalize output lightness to L = 0.62, cap
retained chroma at C = 0.04, under the fixed low-saturation, semantic-safety, and gamut rules. The
aura geometry is also fixed. The normalized aura colour is therefore identical across every non-off
variant for a given film.

## 3. Exact experiment boundary
P2C-A and ADR 017 resolved the normalization envelope. P2C-B tests **only the aura compositing
alpha**; everything else is fixed. It is not a chroma-envelope, hue, extraction, geometry,
gradient, blur, motion, or production experiment.

## 4. Why extraction stays excluded
P2C-B uses the same hand-assigned deterministic artwork seeds as P2C-A, solely to hold the
normalized colour fixed while strength varies. No live pixel reads, canvas extraction,
dominant-color libraries, or network calls feed the aura; poster images render only for visual
context. No extraction algorithm is evaluated or accepted — extraction remains an open question.

## 5. Fixed aura architecture
One restrained, single-hue radial field behind one focal film: one hue, one layer, no second
colour, no multi-color or legacy purple→pink gradient, no blend-mode/geometry/blur/coverage/
transition variation between variants, no full-page wash, no colour on text/controls/marker, no
ambient animation beyond one fixed ≤180ms replacement crossfade, reduced-motion instant. The
field's colour source is identical among all non-off variants; only the final compositing alpha
changes.

## 6. Single experimental variable
Four treatments: one aura-**off** control and three non-zero compositing-strength levels — a
monotonic, equally-spaced ladder: **off, plus three equally spaced non-zero strengths, including
the prior P2C-A control strength.** The only treatment-specific value is one scalar, the aura
compositing alpha, applied once per variant. Exact per-variant strengths are sealed; the highest
remains within a plausibly adoptable range (no intentionally theatrical candidate). Strength is
never hand-tuned by film, surface, genre, viewport, or state.

## 7. Permitted and forbidden scope
**Permitted** (one film is the clear focal object): Tonight's primary recommendation hero; Film
File's hero; their mobile equivalents; the active replacement film after "Not tonight."
**Forbidden:** landing before a focal film exists; navigation and bottom navigation; logo; CTA and
controls; the decision marker and focus; chips, tabs, filters; text, icons, borders; ratings and
semantics; loading and error; missing-poster fallback; Diary; Cinematic DNA; grids and multi-film
comparison; footer; modal chrome; AI/premium signaling; decorative empty regions. After "Not
tonight" the old field disappears with the old film (no stale aura, no dual field).

## 8. Fixture matrix
Eighteen deterministic stress seeds spanning colour space (deep red, orange, yellow, olive, green,
cyan, cool blue, deep blue, violet, magenta, skin-tone, warm beige, near-black, near-white,
low-saturation grey, neon-like, missing, malformed) plus content fixtures (six genres;
bright/dark/warm/cool/low-saturation/missing posters; long/one-word titles; long explanation;
mixed-script metadata; cold-start and mature-history profiles; uncertain availability; loading;
error; sequential replacement) and opacity-specific stresses (large empty hero region, dense
explanation region, poster-edge match and contrast, aura behind a long title, aura adjacent to
semantic status, and low-/high-display-brightness approximations).

## 9. Accessibility and hierarchy gates
Pre-capture, every treatment must satisfy: all ADR 015 text-contrast requirements **measured
against the composited rendered background**; unchanged CTA/decision-signal/focus/semantic colours;
the aura communicates no state (removable without information loss); no text/control/border/icon/
marker inherits the aura colour; no clipping/overflow/touch-target reduction/layout shift/stale
aura; reduced-motion complete; 200% zoom and 360px usable; forced-colors understandable; missing/
low-saturation seed falls back safely. The aura must stay subordinate to title, poster, CTA, the
ivory decision signal, reasoning, and semantic status; a strength that dominates, washes the page,
tints neutrals, or destabilizes identity between films is penalized or disqualified. A hard
accessibility failure disqualifies a treatment; no candidate is repaired individually.

## 10. Anonymization and methodological limitation
Treatments are randomly mapped to **W / X / Y / Z** (cryptographic Fisher–Yates) with four
counterbalanced orders. Strength values, candidate names, and the mapping are kept out of both
bundles (sealed key). **This is not fully treatment-blind:** the off control may appear to have no
field, and different strengths may be approximately inferable. Protections: anonymous labels,
cryptographic assignment, counterbalanced order, hidden numeric strengths/names/measurements,
pre-registered scoring, scorecard lock before objective evidence, and mapping reveal only after
reconciliation.

## 11. Two-stage review protocol
1. **Blind visual scoring** — the blind bundle; score five weighted dimensions, answer twenty
   questions, lock the scorecard. No numeric strength or measurement present.
2. **Objective reconciliation** — only after locking, open the objective bundle (metrics +
   alpha-control / normalization-invariance / accessibility / semantic-separation / geometry /
   scope / determinism / replacement audits).
3. **Private mapping reveal** — unseal the W/X/Y/Z → strength key.
4. **Decision record** — a later record fixes the aura strength (or off) if accepted.

## 12. Scorecard
Five weighted dimensions: Film presence and emotional usefulness 30 · Restraint and hierarchy
preservation 30 · Cross-artwork and cross-surface robustness 20 · Accessibility and semantic safety
10 · Implementation confidence 10. `weighted_total = Σ (rating_d / 5) × weight_d` — **maximum 100,
practical range 20–100**. Twenty mandatory written questions accompany the ratings.

## 13. Pre-registered decision rule
Any accessibility failure, any colour entering text/controls/semantics/marker/focus, any color-only
state, any stale aura after replacement, any strength that makes the aura dominant over title/
poster/CTA/reasoning, or any strength that makes FeelFlick appear film-**themed** rather than
film-**aware** — disqualifies. Then: each non-off treatment must independently beat the off control
by **≥5 points** to qualify; a non-off lead below 5 points defaults to off; among qualifying
treatments within 5 points, choose the **lower** strength (a higher strength overrides only if it
leads film presence by ≥1 full point with no restraint/hierarchy/robustness/semantic/accessibility
penalty); if none qualifies, select off and authorize no aura; visibility and "cinematic/premium/
dramatic/richer" cannot win; do not average, blend, or invent a fifth value. The result decides
only aura strength for the accepted strict envelope; extraction remains unresolved; no production
implementation is authorized. **No winner is chosen here, and the rule was not applied.**

## 14. Objective metrics plan
From the rendered DOM + the deterministic pipeline + native crops: per-seed normalized colour
(variant-independent, at the fixed envelope), output lightness/chroma/hue, suppression and any
interventions; per-variant effective compositing, composited background, luminance movement from
the no-aura baseline, text/CTA/marker/focus contrast, nearest-semantic distance, aura coverage/
bounding box, pixel difference from off (avg/peak), geometry, overflow, layout shift, stale-aura
status, console errors — plus a source-level and rendered-DOM single-variable audit. The objective
bundle proves the envelope, foundation, typography, marker, semantics, aura colour and geometry are
identical and only the compositing strength differs, and that forbidden/suppressed surfaces are
pixel-identical.

## 15. Evidence limitations
A prototype with synthetic content and deterministic seeds (no engine, no personalization, no real
users, no live extraction); structured single-reviewer decision evidence, not user research or a
statistical study; not fully treatment-blind (§10); colour-vision and display-brightness sheets are
approximations, not medical or device certainty; numbers are from the dev-server DOM, not a
production benchmark.

## 16. No winner
No treatment is recommended; the off control is a legitimate outcome. This packet establishes that
the comparison is single-variable (only the compositing strength differs), the normalization
envelope is invariant, the comparison is scope-controlled and accessible; the judgement is the
reviewer's, under the pre-registered rule, after reconciliation and reveal.

## 17. No production change authorized
P2C-B is an isolated, dev-guarded prototype, absent from production builds. It changes no production
tokens, components, routes, fonts, CSS, or visual baselines, does not begin the Tonight or Film File
pilots, creates no global contextual-color token, and accepts no extraction method. Any adoption
would follow the authority's migration gates via a future decision record.

---

# Final outcome (post-reveal decision)

> Recorded after the two-stage review completed. **No winner was selected during construction.** The
> decision was made only after (1) the blind scorecard was locked, (2) the objective evidence was
> reconciled against the locked scores, and (3) the private Variant→strength mapping was revealed. The
> authoritative decision is [ADR 018](../decisions/018-thoughtful-seatmate-p2c-b-aura-strength.md).

## A. Revealed mapping

| Variant | Treatment | Alpha |
|---|---|---|
| **W** | low strength | 0.07 |
| **X** | high strength | 0.21 |
| **Y** | reference strength | 0.14 |
| **Z** | off control | 0 |

Equal ladder: **0 → 0.07 → 0.14 → 0.21** (the reference strength is the prior P2C-A fixed control).

## B. Locked blind scores

| Dimension | Weight | Low (W) | High (X) | Reference (Y) | Off (Z) |
|---|---:|---:|---:|---:|---:|
| Film presence and emotional usefulness | 30 | 4 | 5 | 5 | 3 |
| Restraint and hierarchy preservation | 30 | 5 | 3 | 4 | 5 |
| Cross-artwork and cross-surface robustness | 20 | 5 | 4 | 5 | 5 |
| Accessibility and semantic safety | 10 | 5 | 5 | 5 | 5 |
| Implementation confidence | 10 | 4 | 4 | 5 | 5 |
| **Weighted total** | **100** | **92** | **82** | **94** | **88** |

Blind order: **reference 94 → low 92 → off 88 → high 82.**

## C. Objective evidence
All four passed the hard accessibility and technical gates. The experiment stayed single-variable
(only the compositing alpha differed; the normalized colour, envelope, geometry, foundation,
semantics, and ivory marker were identical). At the strict cap there were zero semantic-safety
desaturations, so rising strength scaled the same safe low-chroma colour. Composited text and
ivory-marker contrast stayed far above the ADR 015 7:1 floor at every strength; forbidden and
suppressed surfaces were pixel-identical across variants.

## D. Threshold reasoning (no tie-break)
Relative to the off control (88): **low 92 − 88 = +4** (does not clear the ≥5-point bar; does not
qualify); **reference 94 − 88 = +6** (clears the bar; qualifies); **high 82 − 88 = −6** (below off;
rejected). So **the reference strength (alpha 0.14) independently cleared the five-point threshold,
alpha 0.07 did not, and alpha 0.21 lost to off** (weakened hierarchy and product consistency).
Because **exactly one** non-off treatment qualified, **no lower-strength tie-break was needed**, and
**no blending, averaging, or interpolation occurred** — the accepted value is one of the
pre-registered ladder strengths, selected by the rule. Off remains a credible baseline but is not
selected.

## E. Exact accepted alpha
```text
aura compositing alpha: 0.14
```

## F. Complete accepted contextual-color treatment
preserve source hue · output lightness **L = 0.62** · retained chroma cap **C = 0.04** · aura
**compositing alpha 0.14** · single focal-film scope · under the fixed low-saturation, semantic-safety
(reduce chroma, never rotate hue), and gamut rules · one single-hue radial field with fixed geometry
and one fixed ≤180ms transition (instant under reduced motion).

## G. Accepted scope
**Permitted** (one focal film only): Tonight primary recommendation hero; Film File hero; their mobile
equivalents; the active replacement film after "Not tonight." **Forbidden** everywhere else (landing
pre-focal, navigation/bottom navigation, logo, CTA/controls, marker/focus, chips/tabs/filters,
text/icons/borders, ratings/semantic statuses, loading/error, missing-poster fallback, Diary,
Cinematic DNA, grids/multi-film comparison, footer, modal chrome, AI/premium signaling, decorative
regions). Single hue, environmental only, never semantic/brand/control, never a purple→pink gradient,
never global.

## H. Unresolved: extraction
P2C-A and P2C-B both used **manually assigned deterministic artwork seeds** solely to isolate the
variable under test. **No extraction algorithm or seed-generation method is accepted**, and manual
deterministic seeds are **not** an accepted production extraction method.

## I. Decision scope
ADR 018 fixes only the aura **strength** for the accepted strict envelope, for scoped pilot
evaluation. It does **not** authorize a production aura, a global contextual-color token, or an
extraction method; it does not reopen ADR 017, change the ladder, or blend strengths; and it does not
alter ADR 014–017 or product doctrine. **No production change is authorized.**

## J. Integrity notes
- **No winner was selected during construction**; the decision happened only after blind scoring,
  objective reconciliation, and the private mapping reveal.
- **No private key, blind/objective ZIP, screenshots, generated metrics, or normalization/capture
  scripts are stored in this repository** — they live only outside it.
- **No production pilot was started**, and **no production change is authorized**.
- Authoritative decision record:
  [ADR 018](../decisions/018-thoughtful-seatmate-p2c-b-aura-strength.md).
