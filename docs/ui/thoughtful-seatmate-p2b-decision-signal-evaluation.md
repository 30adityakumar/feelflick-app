# Thoughtful Seatmate P2B — Decision Signal: Evaluation Evidence (closed — outcome recorded)

> Evidence packet for the P2B — Decision Signal experiment: whether meaningful
> selected/committed states should stay ivory-only or gain one restrained warm
> decision signal, and if so which warm hue and at what permitted scope. The
> experiment ran in an isolated, **un-merged** Design Lab prototype; the screenshot
> bundles, capture tooling, ZIPs, and the variant keys live **outside this
> repository** and are not copied here.
>
> The experiment is **closed**: the (re-blinded **v2**) blind scorecard was locked
> before the v2 objective evidence, objective reconciliation completed, and the
> authoritative v2 mapping was revealed afterward. The formal decision is
> [ADR 016](../decisions/016-thoughtful-seatmate-p2b-decision-signal.md). The body
> below records the experiment as it was *conducted* (blind, sealed); the revealed
> mapping, locked scores, reconciliation, and accepted treatment are in the
> **Final outcome** section at the end. No private key or generated bundle is stored
> in this repository.

**Status:** Closed — blind scoring + objective reconciliation complete; decision
recorded in [ADR 016](../decisions/016-thoughtful-seatmate-p2b-decision-signal.md).
**Date:** 2026-06-15.
**Fixed by:** [ADR 014](../decisions/014-thoughtful-seatmate-p1-core-voice.md) (Inter) and [ADR 015](../decisions/015-thoughtful-seatmate-p2a-foundation.md) (warm graphite / projection-ivory foundation).

---

## 1. Experiment question

> Does a restrained warm decision signal improve meaningful selection and commitment
> beyond the accepted ivory-only treatment — and, if so, which warm hue earns that
> role without becoming decorative brand colour, semantic confusion, or repeated
> interface noise?

This is a decision-signal **colour** experiment, not a component-style experiment. It
resolves cue presence and exact hue together so the answer cannot depend on a
different marker design.

## 2. Fixed controls (ADR 014 + ADR 015)

Immutable for every variant: **Inter** (ADR 014); the exact **ADR 015 foundation**
(canvas `#15120f`, surfaces `#1d1814`/`#241e19`/`#2d2621`, text
`#f3ecdf`/`#beb8ad`/`#8d887f`, borders `#302c28`/`#46423d`, neutral action
`#efe7d7`/`#221b13`, focus `#f3ecdf`); the semantic palette (amber `#f5b860`, red
`#ef6a6a`, green `#5fd0a0`, info `#7db5e6`); the contextual-aura algorithm and a
single fixed strength (0.14); all geometry/typography; the neutral primary commitment
action; the ivory-only selected baseline; one-pick hierarchy; sequential "Not
tonight" replacement; honest reasoning; and reduced-motion safety.

## 3. The single variable

`--p2b-decision-signal` — and nothing else. Source-level: the variant stylesheet sets
only this token, and the token is consumed by exactly one rule (the `.p2b-sig` marker
dot). Four distinct values: an ivory control (the ADR 015 projection ivory) and three
warm candidates.

## 4. Marker architecture

`DecisionSignal` is a small, redundant confirmation mark — a **7px circular dot** in a
permanently reserved **14px slot**, no blur/glow/gradient/shadow, identical geometry
across all variants. The slot reserves space in every state and variant, so the dot
toggles visibility with **zero layout shift**. It may pair with an existing
check/bookmark icon but never recolours a whole control. The marker is supplementary:
every selected/committed state is communicated by **at least two non-colour signals**
(aria-pressed, changed label, check/bookmark icon, neutral fill/border, position,
status text). No state depends on colour.

## 5. Permitted cue scope

The signal appears only after a meaningful user selection or commitment: an explicitly
selected session intent; a recommendation explicitly chosen for tonight; a confirmed
save to watchlist; and one current/present-tense active pick reflected in memory.
Normal composition shows at most one marker in the primary decision area; an explicit
two-marker over-density case (committed + saved) is included to find where rarity
breaks down, and never exceeds two.

## 6. Forbidden cue scope

No marker on: the default primary CTA, hover, keyboard focus, navigation, tabs,
ordinary filters, every chip, loading, disabled, error, destructive actions, ratings,
caution, success/watched (uses the green semantic), availability, confidence,
explanation headings, logo/wordmark, AI/premium signalling, poster aura, page
atmosphere, or decorative separators. Watched Diary history uses its semantic rating
and carries no decision marker.

## 7. Candidate-construction method (sealed during scoring)

Four candidates were derived programmatically in OKLCH. One is the ivory control (the
ADR 015 projection ivory — the accepted ivory-only treatment). Three are restrained
warm hues constructed to share **identical OKLCH lightness and identical OKLCH
chroma**, differing **only in hue**, spanning a deliberately narrow, plausible warm
arc in the restrained muted-warm region between red and amber — each clearly warm and
clearly clear of both. None is purple/plum/magenta/pink/rose, gold, or neon; none is
poster-derived or a legacy-gradient colour; none is a full secondary palette. Gamut
correction reduced chroma uniformly (preserving equal lightness and equal chroma
across the three). The candidates were not hand-picked to favour one; the warm arc is
plausible throughout. Exact values, OKLCH, derivation parameters, and the mapping
were sealed in an out-of-repo key during scoring; they are recorded in the
**Final outcome** section below now that the experiment is closed.

## 8. Controlled-variable proof (from the rendered DOM)

Identical across W/X/Y/Z: the twelve ADR 015 foundation values; the semantic palette;
the aura strength; typography/geometry; and the marker geometry (7×7px dot, 14×14px
slot). The primary CTA fill is the neutral action fill, never the signal. The only
differing value is `--p2b-decision-signal` (four distinct values). Default/unselected
screens differ between variants only by the hidden token, not by any visible pixel.
Marker counts per state are identical across variants.

## 9. Surfaces and fixtures

Five surface families (Landing/session-start, Tonight, Film File, Library = Diary +
Cinematic DNA, Mobile flow). Fixtures cover six genres; bright/dark/cool/warm/
low-saturation/missing posters; long and one-word titles; long explanation;
mixed-script metadata; cold-start and mature-history profiles; uncertain
availability; loading and error; reduced motion; 200% zoom / 360px reflow; and a
multiple-commitment stress case. Copy is identical across variants.

## 10. Accessibility gates

Pre-capture gates: marker ≥3:1 against its immediate background; marker
distinguishable from adjacent border/fill; state understandable without marker
colour; keyboard focus is the ADR 015 neutral focus, not the signal; semantics remain
distinguishable; foundation contrast unchanged; the cue is never the only
differentiator under colour-vision simulation; 200%/360px usable; no clipping or
touch-target reduction; zero layout shift; reduced-motion complete. All four variants
clear the gate.

## 11. Anonymization and methodological limitation

Candidates are randomly mapped to **W / X / Y / Z** (cryptographically random) with
four counterbalanced column orders. Candidate names and exact values were kept out of
both bundles; the private mapping was written only to an out-of-repo key.
**This is not fully treatment-blind:** a reviewer sees that one marker is ivory and
three are warm. The controlled protections are anonymous labels, random mapping,
counterbalanced position, hidden names, hidden numerical values, pre-registered
scoring, blind scoring before any objective metric, and mapping reveal only after
reconciliation.

## 12. Two-stage review protocol

1. **Blind visual scoring** — the blind bundle; score five weighted dimensions,
   answer fifteen questions, lock the scorecard. No numeric colour evidence present.
2. **Objective reconciliation** — only after locking, open the objective bundle.
3. **Private mapping reveal** — unseal the W/X/Y/Z → candidate key.
4. **Decision record** — [ADR 016](../decisions/016-thoughtful-seatmate-p2b-decision-signal.md).

## 13. Scorecard

Five weighted dimensions: Decision clarity and usefulness 30 · Restraint and rarity
25 · Thoughtful Seatmate character and foundation harmony 20 · Semantic separation
and cross-context robustness 15 · Accessibility and implementation confidence 10.
`weighted_total = Σ (rating_d / 5) × weight_d` — **maximum 100, practical range
20–100** under the 1–5 rubric. Fifteen mandatory written questions accompany the
ratings.

## 14. Pre-registered decision rule

Recorded before scoring; applied only at reconciliation: any accessibility failure,
semantic confusion, or colour-only state meaning disqualifies; compare weighted
totals; **a warm candidate must beat the ivory control by ≥5 points** to earn a
permanent role; **a lead under 5 points is a near-tie and defaults to ivory-only**;
novelty/saturation/"cinematic" appearance cannot win; ties break on semantic
separation → restraint → clarity → harmony → mobile; a winning hue stays restricted
to selection/commitment markers; do not blend candidates or invent a fifth option.

## 15. Re-blinding correction

The **first** blind assignment (v1) was **superseded** because the v1 completion
report disclosed enough objective evidence (per-variant marker/background contrast
that identified the ivory control, and semantic-distance findings) **before**
independent review. The treatments themselves did not change — only the W/X/Y/Z
labels were re-randomized to a fresh cryptographic assignment that differs from the
superseded one. The **v2** bundle was reviewed independently; the v2 scorecard was
locked before the v2 objective evidence; the v2 mapping was revealed only after
reconciliation. This methodological correction **increases confidence** and is not a
design failure. v1 artifacts are superseded and must not be used; **v2 is
authoritative**.

## 16. Evidence limitations

A prototype with synthetic content (no engine, no personalization, no real users);
single-reviewer structured decision evidence, not user research or a statistical
study; the comparison is not fully treatment-blind (§11); colour-vision sheets are
approximations, not medical certainty; numbers are from the dev-server DOM, not a
production benchmark. A restrained warm cue necessarily occupies colour space near the
warm semantics (amber/red) — proximity was the primary risk the review weighed.

## 17. No production change authorized

P2B is an isolated, dev-guarded prototype, absent from production builds. It changes
no production tokens, components, routes, fonts, CSS, or visual baselines, and does
not begin the Tonight or Film File pilots. Adoption follows the authority's migration
gates via the decision record (ADR 016) and later pilots.

---

# Final outcome (post-decision)

> Recorded after the v2 blind scorecard and objective reconciliation were locked and
> the authoritative v2 mapping was revealed. The formal decision is
> [ADR 016](../decisions/016-thoughtful-seatmate-p2b-decision-signal.md). No winner
> was selected during prototype construction; the decision was made only after blind
> scoring, objective reconciliation, and mapping reveal. **v1 artifacts are
> superseded; v2 is authoritative.** No private key or generated bundle is stored in
> the repository.

## Revealed authoritative v2 mapping

- **Variant W = ivory control — `#f3ecdf`**
- **Variant X = warm copper — `#c79169`**
- **Variant Y = warm ember — `#ca8f6f`**
- **Variant Z = warm terracotta — `#cc8c76`**

## Locked blind scores

| Dimension | Weight | Ivory control (W) | Warm copper (X) | Warm ember (Y) | Warm terracotta (Z) |
|---|---:|---:|---:|---:|---:|
| Decision clarity and usefulness | 30 | 5 | 4 | 4 | 4 |
| Restraint and rarity | 25 | 5 | 4 | 4 | 3 |
| Thoughtful Seatmate character and foundation harmony | 20 | 4 | 4 | 5 | 4 |
| Semantic separation and cross-context robustness | 15 | 5 | 3 | 3 | 2 |
| Accessibility and implementation confidence | 10 | 5 | 4 | 4 | 4 |
| **Weighted total** | **100** | **96** | **77** | **81** | **69** |

Blind order: ivory control 96 → warm ember 81 → warm copper 77 → warm terracotta 69.
The ivory control led the strongest warm treatment by 15 points.

## Objective reconciliation

All four passed the hard accessibility gates. Marker/background contrast: ivory
control 15.88:1; warm copper 6.83:1; warm ember 6.82:1; warm terracotta 6.74:1. The
experiment remained single-variable (only `--p2b-decision-signal` differed). The warm
treatments sat nearest red in OKLab space (warm copper ΔEok 0.1076; warm ember 0.0982;
warm terracotta 0.0884 — terracotta closest, matching the blind "most error-adjacent"
finding) and converged toward amber/red under protanopia/deuteranopia; redundant
non-color communication prevented a hard failure but left a semantic-risk penalty.

## Decision and accepted treatment

> Meaningful selected and committed states remain ivory-only. The accepted decision
> signal uses the existing ADR 015 projection ivory `#f3ecdf`, supported by redundant
> non-color state communication. No separate permanent warm decision-signal hue or
> new color token is introduced.

```css
/* Reuse the ADR 015 projection-ivory value. */
decision-signal-color: #f3ecdf;
```

Not a new global production token; scoped pilots may use a local semantic alias to the
ADR 015 projection-ivory role.

## Permitted scope
Explicitly selected session intent; recommendation explicitly chosen for tonight;
confirmed watchlist save; one current/present-tense active pick in memory. No more
than one marker in the primary decision area; two only when chosen + saved coexist.

## Forbidden scope
Default CTA, hover, focus, navigation, tabs, routine filters, every chip, loading,
disabled, errors, destructive actions, ratings, caution, success/watched semantics,
availability, confidence, headings, wordmark/logo, AI/premium signalling, page
atmosphere, poster aura, decorative separators. Not a general brand accent.

## Decision scope
Accepted for prototype and scoped pilots; production migration is gated by pilot
validation. No global token migration is authorized. See
[ADR 016](../decisions/016-thoughtful-seatmate-p2b-decision-signal.md).
