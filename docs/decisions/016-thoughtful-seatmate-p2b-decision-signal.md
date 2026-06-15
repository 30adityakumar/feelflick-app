# ADR 016 — Thoughtful Seatmate P2B: Ivory-Only Decision Signal

**Status:** Accepted
**Date:** 2026-06-15
**Decided by:** Aditya Kumar, informed by one completed AI-assisted blind review of the anonymized **v2** P2B evidence bundle, followed by objective reconciliation. The v2 blind scorecard was locked **before** the v2 objective evidence was opened, and the authoritative v2 variant→treatment mapping was revealed **only after** reconciliation.

> Decision statement:
>
> **Meaningful selected and committed states remain ivory-only. The accepted
> decision signal uses the existing ADR 015 projection ivory `#f3ecdf`, supported
> by redundant non-color state communication. No separate permanent warm
> decision-signal hue or new color token is introduced.**

Companion docs: active authority
[`design-authority-thoughtful-seatmate.md`](../ui/design-authority-thoughtful-seatmate.md),
durable rule [`.claude/rules/design-system.md`](../../.claude/rules/design-system.md),
full evidence packet
[`thoughtful-seatmate-p2b-decision-signal-evaluation.md`](../ui/thoughtful-seatmate-p2b-decision-signal-evaluation.md).
Predecessors: [ADR 014](014-thoughtful-seatmate-p1-core-voice.md) (Inter), [ADR 015](015-thoughtful-seatmate-p2a-foundation.md) (warm graphite / projection-ivory foundation).

---

## 1. Status

Accepted. This closes the **P2B — Decision Signal** prototype experiment. It is a
**prototype-and-pilot-scoped** visual-system decision — **not** a production token
promotion and **not** a product-strategy change.

## 2. Decision

**Meaningful selected and committed states remain ivory-only. The accepted decision
signal uses the existing ADR 015 projection ivory `#f3ecdf`, supported by redundant
non-color state communication. No separate permanent warm decision-signal hue or new
color token is introduced.**

This does not prohibit warmth elsewhere in the interface; it means selection and
commitment do not receive a separate permanent warm color role.

## 3. Context

The active design authority accepted a "neutral primary action, with one rare warm
signal for meaningful selection or commitment" as a principle but left two questions
explicitly open: the **exact warm decision-signal hue**, and whether selected states
are **ivory-only** or **ivory-plus-a-warm-cue**. [ADR 015](015-thoughtful-seatmate-p2a-foundation.md)
fixed the foundation (including projection ivory `#f3ecdf`) and [ADR 014](014-thoughtful-seatmate-p1-core-voice.md)
fixed the core voice (Inter). P2B was the controlled experiment built to answer the
decision-signal question on real FeelFlick surfaces, before any pilot or production
work.

## 4. Questions resolved

1. **Ivory-only versus ivory-plus-warm-cue → ivory-only.**
2. **Exact warm decision-signal hue → none accepted.**

## 5. Fixed controls

Immutable for every variant: **Inter** (ADR 014); the exact **ADR 015 foundation**
(all twelve roles — canvas `#15120f`, surfaces `#1d1814`/`#241e19`/`#2d2621`, text
`#f3ecdf`/`#beb8ad`/`#8d887f`, borders `#302c28`/`#46423d`, neutral action
`#efe7d7`/`#221b13`, focus `#f3ecdf`); the semantic palette (amber `#f5b860`, red
`#ef6a6a`, green `#5fd0a0`, info `#7db5e6`); the contextual-aura algorithm and a
single fixed strength (0.14); all typography and geometry; the marker architecture;
the state scope; and the layouts. **Only `--p2b-decision-signal` differed** between
variants.

## 6. Experiment design

A controlled four-variant comparison in the isolated Design Lab
(`/design-lab/thoughtful-seatmate-p2b`, dev-guarded; absent from production builds).
Four anonymized variants: one ivory control and three restrained warm hues
constructed in OKLCH to share identical lightness and chroma, differing only in hue
(a narrow warm arc clear of red and amber; not purple/plum/pink/rose/gold/neon, not
poster-derived, not a gradient colour). Five surface families (Landing, Tonight, Film
File, Library, Mobile); fixtures spanning six genres, bright/dark/cool/warm/
low-saturation/missing posters, long/one-word titles, long explanation, mixed-script
metadata, cold-start and mature-history profiles, uncertain availability, loading and
error, reduced motion, 200%/360px reflow, and a multiple-commitment stress case.

## 7. Marker architecture

`DecisionSignal` — a small, redundant confirmation mark: a **7px circular marker** in
a **permanently reserved 14px slot**; no glow, blur, gradient, shadow, pulse, or
ambient animation; **zero layout shift**; reduced-motion safe; colour = projection
ivory `#f3ecdf`. The marker is supplementary and never the sole state indicator —
every selected/committed state also uses redundant non-color communication (semantic
state such as `aria-pressed`/`role=status`, a changed label, a check/bookmark icon, a
neutral selected fill or border, status text, and stable position).

## 8. Permitted and forbidden scope

**Permitted** (meaningful selection/commitment only): (1) an explicitly selected
session intent; (2) a recommendation explicitly chosen for tonight; (3) a confirmed
watchlist save; (4) one current/present-tense active pick reflected in memory. Normal
composition shows **no more than one** marker in the primary decision area; two may
appear only when two legitimate commitments coexist (chosen + saved) — a density
boundary, not a decorative pattern.

**Forbidden:** default primary CTA, hover, focus, general navigation, tabs, routine
filters, every chip, loading, disabled states, errors, destructive actions, ratings,
caution, success/watched semantics, availability, confidence, recommendation
headings, wordmark/logo, AI signalling, premium signalling, page atmosphere, poster
aura, decorative separators. The marker does not become a general brand accent.

## 9. Blind-review methodology

The four treatments were randomly mapped to anonymized **Variant W / X / Y / Z** with
four counterbalanced column orders, grayscale and text-only sheets, and full-
resolution native crops. A two-stage protocol was used: (1) **blind visual scoring**
of five weighted dimensions (Decision clarity and usefulness 30 · Restraint and
rarity 25 · Thoughtful Seatmate character and foundation harmony 20 · Semantic
separation and cross-context robustness 15 · Accessibility and implementation
confidence 10) on a 1–5 scale, normalized by `Σ (rating_d / 5) × weight_d`
(**maximum 100, practical range 20–100** under the 1–5 rubric), with fifteen
mandatory written questions; (2) **objective reconciliation**; (3) **private mapping
reveal**; (4) this decision record. The scores are structured single-reviewer
decision evidence — not user research or a statistical study. The private key is
**not** stored in this repository.

## 10. Re-blinding correction

The **first** blind assignment (v1) was **superseded** because the v1 completion
report disclosed enough objective evidence — per-variant marker/background contrast
(which effectively identified the ivory control) and semantic-distance findings —
**before** independent review, which could have biased the reviewer. The correction:

- the **treatments themselves did not change** — the four candidate values are
  byte-identical to v1;
- **only the W/X/Y/Z labels were re-randomized** (a fresh cryptographic assignment
  that differs from the superseded one);
- the **v2 bundle was reviewed independently**;
- the **v2 scorecard was locked before the v2 objective evidence** was opened;
- the **v2 mapping was revealed only after reconciliation**.

This is a methodological correction that **increases confidence** in the result; it
is not a design failure. The v1 assignment and v1 review artifacts are superseded and
must not be used.

## 11. Revealed authoritative v2 mapping

- **Variant W = ivory control — `#f3ecdf`**
- **Variant X = warm copper — `#c79169`**
- **Variant Y = warm ember — `#ca8f6f`**
- **Variant Z = warm terracotta — `#cc8c76`**

## 12. Blind scores

| Dimension | Weight | Ivory control (W) | Warm copper (X) | Warm ember (Y) | Warm terracotta (Z) |
|---|---:|---:|---:|---:|---:|
| Decision clarity and usefulness | 30 | 5 | 4 | 4 | 4 |
| Restraint and rarity | 25 | 5 | 4 | 4 | 3 |
| Thoughtful Seatmate character and foundation harmony | 20 | 4 | 4 | 5 | 4 |
| Semantic separation and cross-context robustness | 15 | 5 | 3 | 3 | 2 |
| Accessibility and implementation confidence | 10 | 5 | 4 | 4 | 4 |
| **Weighted total** | **100** | **96** | **77** | **81** | **69** |

Blind order: ivory control 96 → warm ember 81 → warm copper 77 → warm terracotta 69.
The ivory control led the strongest warm treatment (ember) by **15 points**.

## 13. Objective evidence

All four treatments passed the hard accessibility gates. Measured marker/background
contrast: ivory control 15.88:1; warm copper 6.83:1; warm ember 6.82:1; warm
terracotta 6.74:1 — all ≥ 3:1.

The experiment remained single-variable: ADR 014 Inter unchanged; all twelve ADR 015
foundation values unchanged; semantics unchanged; contextual aura unchanged;
typography and geometry unchanged; marker architecture unchanged; state scope
unchanged; only `--p2b-decision-signal` differed.

The warm treatments occupied perceptual space closer to red and amber. Nearest-red
OKLab distances: warm copper ΔEok 0.1076; warm ember ΔEok 0.0982; warm terracotta
ΔEok 0.0884. Warm terracotta was objectively closest to red, matching the blind
finding that it felt most error-adjacent. Warm ember was the strongest warm treatment
visually, but it still trailed the ivory control by 15 points and did not improve
state comprehension. Under protanopia and deuteranopia simulations the warm
treatments converged toward amber/red; redundant non-color state communication
prevented a hard accessibility failure, but the convergence remained a semantic-risk
penalty.

## 14. Pre-registered decision rule

Recorded before scoring; applied only at reconciliation: any accessibility failure,
any semantic confusion with rating/caution/error/success/information, or any
colour-only state meaning disqualifies; compare weighted totals; **a warm candidate
must lead the ivory control by ≥5 points to earn a permanent decision-signal role**;
a lead under 5 points is a near-tie that **defaults to ivory-only** (a new colour
token and usage rule must earn its complexity); novelty/saturation/"cinematic"
appearance cannot justify a win; ties break on semantic separation → restraint →
clarity → harmony → mobile; a winning hue stays restricted to selection/commitment
markers; do not blend candidates or invent an untested fifth option.

## 15. Rationale

- **No warm candidate met the threshold.** The strongest warm treatment trailed the
  ivory control by 15 points — far beyond the 5-point bar a warm cue had to clear.
- **The ivory control was strongest where it matters** — decision clarity, restraint,
  and semantic separation — and added no semantic-confusion risk.
- **The warm treatments carried a real semantic-proximity penalty.** Each sat nearest
  red in OKLab space, and all three converged toward amber/red under red-green
  colour-vision simulation; a warm decision cue would risk reading as caution/error.
- **A new colour token must earn its complexity.** Ivory-only avoids a second
  meaning-bearing colour, a new token, and a new usage rule, with no loss of clarity.
- The decision does **not** blend candidates or introduce a fifth, untested option.

## 16. Exact accepted treatment

```css
/* Reuse the ADR 015 projection-ivory value. */
decision-signal-color: #f3ecdf;
```

This is **not** a new global production token. Future scoped pilot implementations may
use a **local semantic alias** that references the ADR 015 projection-ivory role
(the source of colour truth remains ADR 015); no independent warm-cue colour token is
created.

## 17. Accessibility and semantic evidence

The accepted ivory marker has the highest marker/background contrast of the four
(15.88:1) and is the most distinct from the warm semantics. State is communicated by
≥2 non-color signals, so no state depends on colour; keyboard focus uses the ADR 015
neutral focus, visually separate from the marker. The marker reserves a constant slot
(zero layout shift) and renders its final state instantly under reduced motion. The
warm alternatives' red/amber proximity (§13) is precisely the semantic risk this
decision avoids by staying neutral.

## 18. Consequences

- The decision-signal question is **closed**: ivory-only, no warm hue, no new token.
- The `DecisionSignal` marker architecture (§7) and its permitted/forbidden scope
  (§8) are **accepted** as the prototype/pilot pattern.
- The authority and rule move these from provisional to accepted; the warm-cue hue
  and ivory-vs-warm-cue questions leave the unresolved lists.
- Selected/committed confirmation in P2B and the scoped pilots uses projection ivory
  `#f3ecdf` (local alias permitted), gated for production by pilot validation.

## 19. What this does not decide

It does **not** resolve contextual-film-color strength or normalization thresholds;
legacy-gradient survival; the long-form Film File serif role; bottom navigation; or
couple-mode mechanics — all remain open. It does **not** prohibit warmth elsewhere in
the interface; it scopes only the selection/commitment confirmation role. It does
**not** change product doctrine ([`product-doctrine.md`](../product-doctrine.md)) or
[`.claude/rules/product.md`](../../.claude/rules/product.md).

## 20. Production implications

**No production typography, font loading, CSS, tokens, components, routes, tests, or
visual baselines change as a result of this ADR.** The shipped product remains mixed
and transitional. Three concepts stay distinct. (1) **Color source:** the underlying
projection-ivory foundation value `#f3ecdf` belongs to ADR 015 and may later be
promoted through ADR 015's migration gates, after both pilots validate it. (2)
**Decision-signal role:** the ivory-only confirmation role and marker architecture may
later be implemented through shared interaction guidance or a shared
component/primitive, but the decision-signal colour must continue to reference the
ADR 015 projection-ivory source. (3) **Token discipline:** **no independent global
decision-signal color token is created** — it must not merely alias projection ivory.
The migration sequence stands: scoped Tonight and Film File pilots first; pilot
validation; shared primitives or interaction guidance where justified; then systematic
migration with deliberate visual-regression re-baselining.

## 21. Evidence limitations

A prototype with synthetic content (no engine, no personalization, no real users);
structured single-reviewer decision evidence, not user research or a statistical
study; the comparison was not fully treatment-blind (one marker is visibly ivory,
three warm — mitigated by anonymous labels, random mapping, counterbalanced order,
hidden names/values, pre-registered scoring, and reveal-after-reconciliation);
colour-vision sheets are approximations, not medical certainty; numbers are from the
dev-server DOM, not a production benchmark.

## 22. Follow-up work

- Carry the accepted ivory-only decision signal and its scope into the scoped Tonight
  and Film File pilots (local alias to ADR 015 ivory), not global tokens.
- Keep the remaining authority prototype questions open: contextual-color strength
  and normalization thresholds, gradient survival, long-form Film File serif, bottom
  navigation, couple mode.
- When the decision-signal role migrates, follow the migration gates: scoped pilots →
  after both validate, promote the **ADR 015 projection-ivory foundation value**
  and/or the decision-signal role (as shared interaction guidance or a shared
  primitive) → surface-by-surface migration with deliberate re-baselining. The
  decision-signal colour keeps referencing the ADR 015 projection-ivory source; **do
  not create an independent global decision-signal color token**.
