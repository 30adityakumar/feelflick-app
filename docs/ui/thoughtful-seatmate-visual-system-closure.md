# FeelFlick — Thoughtful Seatmate Visual-System Closure

> ⚠️ **HISTORICAL — superseded by Adaptive Editorial Cinema (ADR 021).** The "closure"
> recorded here (warm-graphite/projection-ivory palette, rose accent, the consolidated
> Thoughtful Seatmate visual system) was subsequently revised: the visual foundation is
> now **Adaptive Editorial Cinema** — deep neutral ink, paper-white type, cinematic
> coral-red, neutral inverse actions, flat-first composition. See
> [`design-authority-adaptive-editorial-cinema.md`](design-authority-adaptive-editorial-cinema.md)
> and [ADR 021](../decisions/021-adaptive-editorial-cinema-foundation.md). This file is
> preserved as accurate history of the prior decision.

> **(Historical.) This document consolidated accepted visual decisions and retired further
> visual-system experimentation. It did not authorize an immediate production-wide
> migration.**

It supersedes the typography, gradient-survival, and contextual-colour *experimentation*
tracks as the way FeelFlick settles its visual identity. The remaining work is a
deliberate, staged surface migration — planned separately in
[`thoughtful-seatmate-visual-migration-plan.md`](thoughtful-seatmate-visual-migration-plan.md)
and **not started in this document**.

---

## 1. Status

- **Status:** Visual system **consolidated and closed for experimentation**. Accepted at
  the **decision/direction level**. **Not yet migrated in production.**
- **Date:** 2026-06-17.
- **Authority:** This is the consolidated visual-system record. It sits beside, and is
  consistent with, the active design authority
  ([`design-authority-thoughtful-seatmate.md`](design-authority-thoughtful-seatmate.md))
  and the durable rule ([`.claude/rules/design-system.md`](../../.claude/rules/design-system.md)),
  which it updates. It **consolidates** ADR 014–018; it does not supersede or contradict
  them, and it introduces **no new ADR** (see §19).
- **No further blind studies, no continued P2E, no new design-lab prototype** are
  authorized to settle the visual system. The visual direction is decided.
- **P2E (legacy-gradient survival) was stopped** before a valid blind review and produced
  **no decision, no winner, and no applied decision rule.** Its artifacts are preserved
  but not evaluated further (see §15).

---

## 2. Final visual direction

Adopt this as the target system:

> Near-black to warm-graphite background depth, solid graphite surfaces, projection-ivory
> hierarchy, Inter typography, neutral primary actions, ivory-only decisions, and one
> restrained solid rose brand accent.

The system must feel: **calm; intelligent; cinematic without theatricality; warm rather
than cold; premium without luxury clichés; distinctive without decorative excess;
emotionally aware without becoming sentimental; legible and operationally simple.**

It is the **Thoughtful Seatmate**: serious taste without arrogance, calm at first glance,
intelligent on closer inspection, deep only when invited. It is a **thoughtful companion**,
not a streaming catalogue, a social app, or a luxury editorial magazine.

---

## 3. Typography

**Inter everywhere.** Inter is the only target typeface for navigation, buttons, labels,
chips, titles, recommendation reasons, **long-form Film File prose**, Diary, Cinematic DNA,
Tonight, landing, modals, **exported share artifacts**, and all future surfaces.

- Resolved by **P1 / [ADR 014](../decisions/014-thoughtful-seatmate-p1-core-voice.md)**
  (Inter is the single core Latin sans-serif) and by **P2D** (the bounded Newsreader
  long-form Film File exception tied Inter-only 90–90, lost on coherence / robustness /
  reflow, and was rejected under the pre-registered tie-defaults-to-Inter rule; Film File
  long-form prose stays Inter — see
  [`thoughtful-seatmate-p2d-reading-voice-closure.md`](thoughtful-seatmate-p2d-reading-voice-closure.md)).
- **Do not introduce** Newsreader, Outfit, another serif, another display face, or a second
  reading voice into new work.
- **Existing Newsreader and Outfit usage is transitional migration debt.** Do not remove it
  opportunistically in unrelated work; remove it only when the owning surface is
  deliberately migrated.

---

## 4. Background depth

Use a restrained **near-black to warm-graphite** tonal transition for large page
backgrounds. This is a **neutral depth treatment, not a brand gradient** (see §10).

Accepted foundation values (per [ADR 015](../decisions/015-thoughtful-seatmate-p2a-foundation.md),
prototype / pilot-scoped — **not yet global production tokens**):

```css
--canvas: #15120f;
--surface-1: #1d1814;
--surface-2: #241e19;
--surface-raised: #2d2621;
--text-primary: #f3ecdf;   /* projection ivory */
--text-secondary: #beb8ad;
--text-muted: #8d887f;
--border-subtle: #302c28;
--border-strong: #46423d;
```

**Approved neutral background-depth treatment (preferred — radial):**

```css
background:
  radial-gradient(
    circle at 50% 0%,
    #241e19 0%,
    #1d1814 38%,
    #15120f 100%
  );
```

A **linear** equivalent may be used **only where the surface geometry clearly requires it**:

```css
background:
  linear-gradient(
    180deg,
    #241e19 0%,
    #1d1814 42%,
    #15120f 100%
  );
```

Use this neutral depth treatment **only** for: page canvas; hero regions; immersive modal
backgrounds; Tonight and Film File page depth; large section transitions.

**Do not** use it inside every card; on buttons; on chips; on navigation items; as a
selected state; as a semantic state; as a decorative glow; or as a separate identity
treatment per section. Cards and contained surfaces remain **mostly solid** using the
accepted graphite surface values.

---

## 5. Solid surfaces

Cards and contained surfaces are **mostly solid graphite**, using `--surface-1`,
`--surface-2`, and `--surface-raised`. Borders are subtle graphite (`--border-subtle`,
`--border-strong`); avoid heavy outlines and excessive card nesting.

Shadows are **minimal and warm-neutral** — **no coloured shadows, no rose glow, no purple
glow.** Keep the existing restrained radius scale; do not introduce oversized soft SaaS
cards. A surface must not become "premium" merely by adding blur, transparency, gradient
border, glow, shadow, noise, or animated shimmer.

---

## 6. Text hierarchy

Projection-ivory hierarchy: `--text-primary: #f3ecdf`, `--text-secondary: #beb8ad`,
`--text-muted: #8d887f`. Hierarchy comes from scale, weight, measure, tracking, and
placement in **one** Inter voice — not from a second family. Text is never set on the
legacy gradient and never on a raw extracted poster colour.

---

## 7. Primary actions

Primary actions remain **neutral**: projection-ivory fill, dark text.

```css
--neutral-action-fill: #efe7d7;
--neutral-action-text: #221b13;
--neutral-focus: #f3ecdf;
```

The main action is high-contrast, calm, and obvious. **Do not** use rose, purple, gradient,
or contextual-colour primary buttons (per [ADR 015](../decisions/015-thoughtful-seatmate-p2a-foundation.md)
and [ADR 016](../decisions/016-thoughtful-seatmate-p2b-decision-signal.md)).

---

## 8. Decision and selected states

Meaningful selected and committed states remain **ivory-only**
([ADR 016](../decisions/016-thoughtful-seatmate-p2b-decision-signal.md)): a supplementary
projection-ivory marker (`#f3ecdf`) — a 7px circle in a reserved 14px slot, no
glow/blur/gradient/shadow/pulse, zero layout shift, reduced-motion safe — always paired
with **≥2 redundant non-colour cues** (semantic state, changed label, check/bookmark icon,
neutral fill/border, status text, stable position).

**Do not** use rose, purple, pink, gradient, contextual film colour, glow, or animation
alone for a decision/selected state. **No new decision-signal colour token** (no global
`--decision-signal` alias).

---

## 9. Brand accent

Use **one restrained solid rose** accent as the recognizable FeelFlick colour.

- **Frozen value:** `--brand-rose: #DD4E83` (the rose already shipped most consistently on
  migrated surfaces). The darker `#C0356C` is retained **only** as the required
  AA-contrast variant for white text on rose — it is a contrast state, **not** a second
  brand hue or a new semantic token.
- **Use rose sparingly for:** wordmark detail; lightweight links; subtle active emphasis;
  small signature marks; limited expressive accents; carefully bounded promotional or
  editorial moments.
- **Do not** use rose for: primary buttons; selected or committed states; semantic
  success / error / warning; recommendation confidence; navigation backgrounds; large page
  atmospheres; ordinary card fills; pervasive glow; every heading; every icon.
- Rose must remain an accent, **not** the dominant interface colour. This does **not**
  reintroduce rose as a primary action or a decision signal — those stay neutral
  ([ADR 015](../decisions/015-thoughtful-seatmate-p2a-foundation.md)) and ivory-only
  ([ADR 016](../decisions/016-thoughtful-seatmate-p2b-decision-signal.md)). What is retired
  is rose as a *permanent, pervasive brand signature / default-CTA colour*; what is
  accepted is rose as the **one bounded brand accent**.
- Muted plum and a plum-beside-rose system are **not** part of the target; do not introduce
  plum or purple as supporting atmosphere on migrated surfaces.

---

## 10. Gradient retirement

**Retire the legacy purple–pink gradient from the target design system.**

The legacy gradient is `linear-gradient(135deg, #9333ea 0%, #ec4899 100%)` — shipped as
`--brand-gradient` / `--gradient-primary` (`src/index.css`) and `HP_GRAD`
(`src/shared/lib/tokens.js`).

- Do **not** preserve a special memory-only role. Do **not** preserve a share-only role.
- Do **not** create a replacement gradient. Do **not** create a new gradient token. Do
  **not** introduce new gradient usage anywhere.
- The **neutral warm-graphite depth treatment** in §4 is a separate, neutral atmospheric
  treatment — it is **not** a brand gradient and is **not** a replacement for the legacy
  gradient.
- **Existing shipped gradient usage remains transitional migration debt.** Remove it only
  during deliberate surface migration. **Do not claim it is already gone from production**
  (it is not — see §15).
- The **P2E gradient-survival study is closed without a decision**: it was stopped before a
  valid blind review and produced no winner. Gradient survival is **resolved by
  simplification — retired** — not by an experiment outcome (see §15).

---

## 11. Contextual-colour deferral

Keep the accepted appearance research, **but defer implementation.**

- Accepted appearance (per [ADR 017](../decisions/017-thoughtful-seatmate-p2c-a-contextual-color-envelope.md)
  and [ADR 018](../decisions/018-thoughtful-seatmate-p2c-b-aura-strength.md)): **source hue
  preserved; L = 0.62; C = 0.04; alpha = 0.14; single focal-film scope.**
- **No automatic extraction method is accepted.** Edge-context failed the genuine
  real-poster holdout (P2C-D); manual deterministic seeds are not a production method.
- Do **not**: revive edge-context; create a manual production seed workflow; ship a
  production aura; create global contextual-colour tokens; or **block the main design
  migration on this feature.**
- Treat contextual film colour as a **deferred enhancement**. Revisit only when there is a
  materially different extraction hypothesis, a clear product need, or production evidence
  that neutral surfaces are insufficient.

---

## 12. Product-character rules

Every migrated surface should support **design for someone smart but tired**:

- one clear primary action;
- minimal simultaneous choices;
- progressive depth;
- restrained motion;
- readable density;
- calm hierarchy;
- no decorative urgency;
- no visual shouting;
- no gratuitous "cinematic" effects;
- no nostalgia-driven retention of old styling.

The product should feel like a **thoughtful companion**, not a streaming catalogue, a
social app, or a luxury editorial magazine.

---

## 13. Resolved questions

These are **resolved** and closed to further visual-system experimentation:

| Question | Resolution | Basis |
|---|---|---|
| Core typography | **Inter only** | P1 / ADR 014 |
| Long-form Film File typography | **Inter only** (no serif) | P2D (rejected) |
| Background foundation | **near-black to warm graphite** | P2A / ADR 015 |
| Neutral depth treatment | **accepted** (radial preferred; linear where geometry requires) | this closure (§4) |
| Primary action treatment | **neutral projection-ivory fill** | ADR 015 / ADR 016 |
| Selected-state treatment | **ivory only** | P2B / ADR 016 |
| Legacy gradient survival | **retired from target** | this closure (§10); P2E stopped, no decision |
| Brand accent strategy | **one restrained solid rose** (`#DD4E83`) | this closure (§9) |

Plain-language record:

- **Typography:** Inter only
- **Background:** near-black to warm graphite
- **Surfaces:** solid graphite
- **Primary action:** projection ivory
- **Decision signal:** ivory only
- **Brand accent:** one restrained solid rose
- **Legacy purple–pink gradient:** retired from target
- **Contextual film colour:** deferred

The **serif role** and **gradient survival** are removed from all unresolved-question lists.

---

## 14. Remaining questions

Only genuine product / interaction questions remain open. **Do not reopen resolved
visual-system questions** during migration unless implementation exposes a real
accessibility or usability failure.

- exact **bottom-navigation structure**;
- **couple-mode** interaction mechanics;
- **production surface migration sequencing** (planned in the migration plan);
- **contextual-colour extraction**, *if* revisited later (deferred; no method accepted).

---

## 15. Transitional production reality

The shipped app does **not** yet match this target. As of 2026-06-17, production is mixed
and transitional:

- Foundation in production uses the legacy palette (`#000000` / `#06060a` base, `#FAFAFA`
  off-white text via `src/shared/lib/tokens.js`); the accepted foundation tokens
  (`#15120f` … `#2d2621`, projection ivory `#f3ecdf`) exist **only in the design docs** and
  are marked *do not edit production CSS yet*.
- Fonts: Inter, Newsreader, and Outfit are all loaded; many F4 surfaces ship Newsreader /
  Inter / rose, and residual global/shared/legacy areas still use Outfit and purple/pink.
- The legacy gradient **still ships** as `--brand-gradient` / `--gradient-primary` in
  `src/index.css` (and `HP_GRAD`). It is **not** removed from production.
- Rose `#DD4E83` (and `#C0356C`) already ship across migrated surfaces.

**P2E artifacts are preserved and not evaluated further.** The isolated worktree, the
original blind bundle, the corrected partial evidence, the objective bundle, the private
key, the temporary captures, and the audit logs all remain in place. The objective bundle
was **not opened**, the private key was **not revealed**, **no winner** was selected, and
the **P2E decision rule was not applied**. None of the P2E prototype or evidence is
committed.

---

## 16. Migration boundary

This document is **documentation and migration-planning only**. It **does not** authorize
any production change, token edit, font change, CSS change, route change, or test change.

Migration is governed by the staged plan in
[`thoughtful-seatmate-visual-migration-plan.md`](thoughtful-seatmate-visual-migration-plan.md)
and the migration gates in
[`design-authority-thoughtful-seatmate.md`](design-authority-thoughtful-seatmate.md) §21 and
[`.claude/rules/design-system.md`](../../.claude/rules/design-system.md). Production work
begins only when a surface deliberately enters its migration scope under those gates.

---

## 17. Migration principles

- one surface group at a time;
- no feature-logic, data-model, or recommendation-behaviour changes;
- no navigation restructuring unless separately approved;
- no contextual-colour implementation;
- no gradient exceptions; no new fonts; no new colour families;
- no hidden token globalisation before two representative surfaces validate;
- visual diff review required; desktop **and** mobile required;
- reduced motion, forced colours, 200% and 400% zoom, and contrast checks required;
- a rollback plan required for every stage.

---

## 18. Accessibility constraints

Every migrated surface must preserve or improve accessibility:

- text and non-text contrast (projection ivory on graphite; `#C0356C` for white text on
  rose where rose carries text);
- focus visibility; **non-colour** state communication (decisions never rely on colour
  alone);
- readable line length; text zoom and reflow at 200% and 400%; touch-target floor (44px);
- motion sensitivity (reduced-motion safe; the neutral depth treatment and any transition
  collapse under `prefers-reduced-motion`);
- forced-colours understandable; keyboard navigation; screen-reader structure; image
  alternatives; disabled and error states.

A hard accessibility failure in a migrated surface blocks that surface's migration.

---

## 19. No-new-experiment rule

The visual system is **closed for experimentation.** Do **not** begin another blind study,
continue P2E, or create another design-lab prototype to settle typography, gradient
survival, contextual colour, the foundation, the primary action, the decision signal, or
the brand accent. These are decided.

**No new ADR is created by this consolidation.** The repository's decision governance
([`docs/decisions/DECISIONS.md`](../decisions/DECISIONS.md)) records decisions via a
"worth recording" heuristic; it does **not** explicitly require a separate ADR for a
consolidated visual-system implementation policy. ADR 014–018 already record the
substantive decisions and remain authoritative and unchanged; this closure consolidates
them and records the legacy-gradient retirement. If and when a production-wide migration is
later authorized, a consolidation ADR may be added at that point.

A genuinely new question may be opened later only with a materially different hypothesis, a
clear product need, or production evidence that the accepted system is insufficient.

---

## 20. No-production-change statement

This task changed **Markdown only.** It made **no** change to source code, CSS, tokens,
fonts, package files, routes, tests, or visual baselines, and it began **no** production
migration. The accepted foundation tokens, the neutral depth treatment, the neutral primary
action, the ivory decision signal, the one rose accent, and the gradient retirement are
recorded as the **target**; production still ships the transitional baseline described in
§15. Nothing here authorizes deployment.

---

## Related documents

- [`thoughtful-seatmate-visual-migration-plan.md`](thoughtful-seatmate-visual-migration-plan.md) — the staged surface migration plan (not started)
- [`design-authority-thoughtful-seatmate.md`](design-authority-thoughtful-seatmate.md) — active design authority
- [`.claude/rules/design-system.md`](../../.claude/rules/design-system.md) — durable visual implementation rule
- [ADR 014–018](../decisions/) — the resolved Thoughtful Seatmate decisions this closure consolidates
- [`thoughtful-seatmate-p2d-reading-voice-closure.md`](thoughtful-seatmate-p2d-reading-voice-closure.md) — long-form Film File serif resolved (Inter-only)
- [`thoughtful-seatmate-p2c-d-validation-closure.md`](thoughtful-seatmate-p2c-d-validation-closure.md) — contextual-colour extraction failed its holdout (deferred)
