# Composition-system ownership contract

**Status:** current authority. **Scope:** how FeelFlick's shipped composition system is owned — the
canonical theme, which components are canonical vs domain-specific vs unresolved, and the approved order
for resolving the rest.

This document is descriptive of what is **shipped** at the website-wide Thoughtful Seatmate migration
(`feat: apply Thoughtful Seatmate across the website (#315)`) and prescriptive about ownership going
forward. It is documentation only; it changes no runtime behaviour.

**This document, [ADR 019](../decisions/019-thoughtful-seatmate-website-wide-theme.md), the current
`.claude/rules/design-system.md`, and the shipped implementation are the authorities.** Where any
Thoughtful Seatmate *stage / pilot / evaluation* document disagrees with these, the stage document is
**historical** and does not govern (see [Historical documents](#historical-documents)).

---

## Current architecture

Four distinct concerns are easy to conflate. Keep them separate:

1. **Global theme adoption (shipped, site-wide).** The canonical Thoughtful Seatmate theme is applied
   **once at the application root** (`.theme-thoughtful` on the root element in `src/App.jsx`) and its
   tokens are loaded **globally** via `@import './shared/ui/thoughtful-seatmate/foundations.css'` in
   `src/index.css`. Changing a single canonical `--color-*` value propagates to the shell, every route,
   and every shared component — no per-route colour editing. **Every route is theme-migrated.**

2. **Component / composition adoption (partial, per surface).** Separately from the theme, a surface may
   adopt the Thoughtful Seatmate **primitives** (`ThoughtfulRoot`, `PageDepth`, `Surface`,
   `PrimaryAction`, …) to compose its layout and surfaces. Today this is **home, movie, and watchlist**
   (plus the dev-only showcase). The other authenticated routes are **theme-migrated but not yet
   composition-migrated**: they are recoloured by the global theme while still using legacy primitives
   and inline structure. *Centrally controlled (colour) is not the same as centrally composed.*

3. **Temporary legacy compatibility (transitional).** A documented, **temporary** alias block in
   `src/index.css` (under `.theme-thoughtful`) remaps every legacy token and the entire Tailwind
   purple/pink scale to the canonical `--color-*` values, so legacy consumers (inline HP/ROSE styles,
   `bg-purple-*`/`text-pink-*` utilities, `--bg-*` / `--brand-*` / `--font-editorial`) are recoloured
   site-wide with **no per-file edits**. It is a bridge, not the end state (see
   [removal gate](#compatibility-alias-removal-gate)).

4. **Intentional domain-specific components.** Some components are deliberately *not* generic primitives
   and must not be flattened into the theme or merged into a generic control (e.g. the rose card-action
   family, `MatchBadge`, mood identity colour). They carry meaning the generic system should not own.

---

## Canonical foundations

These are the current, decided foundations:

- **`CANONICAL_THEME` (JS, `src/shared/ui/thoughtful-seatmate/tokens.js`) and `.theme-thoughtful` (CSS,
  `foundations.css`) are the canonical website-theme contract.** They are 1:1 mirrors, kept in sync by
  drift tests (`__tests__/website-theme.test.js`, `__tests__/tokens.test.js`); neither is generated from
  the other. Change a value in **both** mirrors or the drift test fails. Hard constraints hold: exactly
  one restrained rose accent, **no** gradient token, no decision-colour token, no contextual-colour
  token, no purple/plum target token.
- **`PageContainer` owns functional-route width and horizontal gutters** where applicable (max-width caps
  + responsive gutters). Functional routes should not re-declare ad-hoc `maxWidth` / `margin: auto`.
- **`PageDepth` owns large page/section atmosphere** — the neutral near-black → warm-graphite depth
  treatment for page/hero/immersive-modal/large-section backgrounds. It is **not** a brand gradient and
  not a replacement for the retired legacy gradient. Never on cards/buttons/chips/nav/selected/semantic
  states.
- **`ThoughtfulRoot` owns Thoughtful Seatmate scope and composition context.** It marks a
  composition-migrated region and keeps the `--ts-*` names resolving (the values come from the global
  theme). It does not "activate" tokens any more (the global root does) and must not be used to introduce
  a second theme boundary.
- **The compatibility-alias block in `src/index.css` remains temporary but must not be removed
  prematurely.** It is load-bearing for every legacy consumer and for the emergency fallback. Removal is
  gated (see below).
- **Mood identity colours and semantic colours must not be flattened into generic theme colour.** Mood
  hex (mood identity, avatars, poster/data-viz) are **identity/data**, carried as JS literals and
  intentionally exempt from the theme remap. Semantic colours (success/warning/destructive/rating/status)
  are selected by function and must not be forced into the rose/ivory chrome.

---

## Component ownership status

Status legend: **CANONICAL** (the system's owned answer) · **DOMAIN-SPECIFIC** (intentionally separate;
carries meaning) · **COMPATIBILITY** (temporary bridge) · **CANDIDATE** (likely canonical, not yet
ratified/adopted) · **UNRESOLVED** (needs a decision; do not act in passing) · **HISTORICAL** (superseded;
retained for context only).

### Theme + layout foundations

| Component / token | Status | Notes |
|---|---|---|
| `CANONICAL_THEME` + `.theme-thoughtful` (`tokens.js` / `foundations.css`) | **CANONICAL** | The website-theme contract; drift-tested mirrors. |
| Legacy `:root` tokens + `.theme-thoughtful` alias block (`src/index.css`) | **COMPATIBILITY** | Temporary; remaps legacy + Tailwind purple/pink → canonical. Removal gated. |
| `ThoughtfulRoot` | **CANONICAL** | Thoughtful Seatmate composition scope. |
| `PageDepth` | **CANONICAL** | Large page/section atmosphere (neutral depth). |
| `PageContainer` | **CANONICAL** | Width + horizontal gutters for applicable functional routes. |

### Actions / buttons

| Component | Status | Notes |
|---|---|---|
| `Button` | **CANONICAL** generic app-interface button · **CANONICAL** neutral-primary public API | One button system for interface controls; `variant="primary"` owns the neutral-primary semantic/accessibility implementation (Slice A). `PrimaryAction` temporarily **wraps** it (see its `COMPATIBILITY` row, Slice B). Ownership is **resolved**; pending only the final resting-visual recipe, production-consumer migration, and compatibility-CSS retirement. |
| `PrimaryAction` (Thoughtful Seatmate) | **COMPATIBILITY** (wrapper over `Button`) | Now a thin wrapper over `<Button variant="primary">` (Slice B) — delegates all semantics / loading / focus / forced-colours to Button; `PrimaryAction.css` only preserves the legacy visual recipe. Import path kept for existing home/movie/watchlist consumers. **No new adopters** — use `Button`. Retire (remove wrapper + CSS) once production imports reach zero, in a dedicated PR. |
| `ActionButton`, `SecondaryActionButton`, `ChipButton` | **DOMAIN-SPECIFIC** | Intentional rose card-action family. **Not** automatically merged into `Button`. `ChipButton` is a compact action, not a selection pill. |

### Surfaces

| Component | Status | Notes |
|---|---|---|
| `Surface` (Thoughtful Seatmate) | **CANDIDATE** | Candidate canonical contained-surface primitive; adopted by movie/`PrimaryCaseCard`. |
| `Card` | **UNRESOLVED** | Do **not** deprecate or migrate in this PR. |
| `AccentPanel` | **UNRESOLVED** | Currently **not actively rendered** in production. Adopt-or-retire is a later decision. |

### Typography

| Component / token | Status | Notes |
|---|---|---|
| `Text` (Thoughtful Seatmate) | **CANDIDATE** | Candidate canonical typography component (Inter-only, semantic variants). |
| `TYPE` (`src/shared/lib/tokens.js`) | **UNRESOLVED** | Low/no current adoption. Decision deferred. |

### Pills / chips / badges / selection (semantically different families — do not unify)

| Component / family | Status | Notes |
|---|---|---|
| Interactive selection controls (mood/filter toggles, `aria-pressed`) | **DOMAIN-SPECIFIC** | A selection family; distinct from informational labels and from actions. |
| `MoodPill` (informational) | **DOMAIN-SPECIFIC** | Informational mood **label** (carries mood identity colour). Not a generic pill, not a selector. |
| `MatchBadge` | **DOMAIN-SPECIFIC** | Numeric/status badge with its own rendering; keep separate (performance + semantics). |
| `DecisionMarker` | **DOMAIN-SPECIFIC** | Supplementary ivory selected/committed marker. Never sufficient alone — the owning control supplies the semantic state + ≥2 non-colour cues. |
| Navigation pills | **DOMAIN-SPECIFIC** | Navigation state, not selection. |
| `ChoicePill` / `MoodSelector` (proposed) | **CANDIDATE** (deferred) | A unified selection primitive is **deferred** until the higher-priority ownership collisions (Button/PrimaryAction, then Surface/typography) are settled and adoption evidence justifies it. |

### Retired

| Item | Status | Notes |
|---|---|---|
| `HP_GRAD` / `--brand-gradient` / legacy purple→pink gradient | **HISTORICAL** | Retired from the target system; guard-frozen (no new uses). Not deleted in this PR. |

---

## Button/PrimaryAction freeze

> **RESOLVED (Slices A + B) — the framing below is the historical record of how this was settled.**
> Ownership is now decided: **`Button` is the canonical neutral-primary public API** and **`PrimaryAction`
> is a COMPATIBILITY wrapper** over `<Button variant="primary">` (see the Actions / buttons table and
> **Status — Slice B** below). The original collision framing and bullets in this section are retained,
> not erased, but are **superseded**; the only still-pending items are the final resting-visual recipe,
> production-consumer migration, and compatibility-CSS retirement. No new `PrimaryAction` adopters.

The collision (original framing, now resolved): `Button` (variant `primary`) and `PrimaryAction` both
represent the neutral ivory primary action. This was the single most important ownership collision to
resolve, and it was **frozen** until a dedicated parity task:

- They are **not behaviourally identical** — they are two implementations (`Button` via Tailwind utility
  classes; `PrimaryAction` via a dedicated CSS class) that happen to render the same ivory action today.
- **Do not introduce any new `PrimaryAction` adopters** before the parity task.
- **Do not delete either component, and do not wrap one with the other yet.** No compatibility wrapper in
  this phase.
- **Radii are not a difference:** both are pill-shaped. Do not justify a decision on radius.
- The next implementation phase **must compare**, with evidence from the live components and consumers:
  **sizes**, **loading behaviour**, **focus state**, **disabled state**, **motion**, **hover/press
  behaviour**, and **current consumers** — then decide which is canonical, whether the other becomes a
  thin wrapper or is deprecated, and the migration path.

### Status — Slice A (canonical Button contract hardened)

The long-term public API direction is **approved: `Button`**. The first slice has **hardened `Button`'s
semantic / accessibility / loading / focus / forced-colours contract** so it can later absorb the
neutral-primary role without regressing accessibility: `type="button"` default (explicit `type="submit"`
preserved); `loading` now sets `aria-busy`/`data-loading`, overlays an `aria-hidden`, reduced-motion-safe
spinner over a **width-reserving label** (accessible name preserved, no horizontal layout shift); the
component owns `disabled`/`aria-busy`/`data-loading` (callers can't override the loading state); the focus
ring is replaced by the canonical **2px offset `--color-focus` outline** (forced-colors: visible boundary +
`Highlight` focus); invalid `size` falls back to `md`.

Explicitly **not** done in this slice:

- `PrimaryAction` remains **frozen and standalone** — not modified, not wrapped, not aliased.
- **No compatibility wrapper** and **no consumer migration** have happened.
- **Resting visual convergence is unresolved** — `Button` keeps its `40/44/48` size ramp, padding,
  type scale, shadow, and hover/press direction unchanged this slice (the 44px small-size + visual
  reconciliation are deferred). The only intentional interaction change is the keyboard focus outline.
- **No new `PrimaryAction` adopters are allowed.** Convergence is **not** complete.

### Status — Slice B (PrimaryAction is now a compatibility wrapper)

`PrimaryAction` status moves from **UNRESOLVED** to **COMPATIBILITY**. It no longer maintains a duplicate
semantic/loading implementation — it renders `<Button variant="primary">` and **delegates** native button +
default `type`, `disabled`/`loading` precedence, `aria-busy`, `data-loading`, the loading DOM, accessible-name
preservation + loading width-stability, the offset `--color-focus` focus-visible outline, forced-colours, the
reduced-motion-safe spinner, and invalid-size fallback to Button.

- Its **old import path remains temporarily supported** (`@/shared/ui/thoughtful-seatmate`).
- `PrimaryAction.css` is now a **temporary visual-compatibility stylesheet** that preserves the legacy
  visual recipe (flat ivory, legacy 44/44/48 size metrics, darken-on-hover, 1px press translate) on the
  rendered Button. Scoped to `.ts-action-primary`; no global selectors; no focus/spinner/forced-colours
  duplication (Button owns those).
- **No new `PrimaryAction` usage is allowed.**
- **Consumer migration has not begun** — home, movie and watchlist are untouched and render unchanged.
- **Final visual reconciliation remains pending** (Button keeps its own primary recipe for direct use;
  PrimaryAction keeps the legacy recipe via compat CSS until consumers migrate).
- **Retirement** requires **zero production `PrimaryAction` imports** and a dedicated PR that removes the
  wrapper + `PrimaryAction.css`.

---

## Compatibility-alias removal gate

The temporary alias block in `src/index.css` (and the legacy `:root` fallback tokens it depends on) may be
removed **only** after all of the following are true. Do **not** specify an arbitrary removal date.

- Production scans show that the **intended legacy token consumers have been migrated** off the legacy
  names (`--bg-*`, `--brand-*`, `--font-editorial`, `--ts-*` where used as a legacy shim, etc.).
- The **legacy Tailwind purple/pink utilities no longer provide necessary compatibility** (no production
  surface depends on `bg-purple-*` / `text-pink-*` / etc. resolving through the alias).
- **Inline HP / legacy variables have been classified or migrated** (each remaining use is either removed,
  migrated to canonical tokens, or explicitly classified as intentional identity/data).
- The **emergency fallback strategy has been replaced or intentionally retired** (`VITE_UI_THEME=legacy`
  is either superseded by a different rollback mechanism or its removal is an accepted decision).
- **Route-level visual-regression tests pass without the alias block** (removal produces no unexpected
  visual change).
- **Removal is approved in a dedicated PR** (not bundled with unrelated work).

Until every condition holds, the alias block stays. It is a bridge with a clear end state, not permanent
debt.

---

## Migration sequence

The approved order for resolving the remaining composition work (do not reorder without cause):

1. **Documentation truth-up and ownership contract.** *(this PR)*
2. **`Button` vs `PrimaryAction` parity and ownership resolution.**
3. **`Surface` and typography ownership/adoption** (settle `Surface`, `Text`; decide `Card`, `TYPE`,
   `AccentPanel`).
4. **`PageContainer` and route-composition adoption** (functional routes adopt the canonical width/gutter
   + composition primitives).
5. **Forms, overlays, responsive accessibility, and motion.**
6. **Compatibility-layer retirement and stronger enforcement** (only once the [removal gate](#compatibility-alias-removal-gate) is met).
7. **Interactive pill consolidation** (`ChoicePill` / `MoodSelector`) — only when justified by adoption
   evidence.

---

## Historical documents

The Thoughtful Seatmate **stage / pilot / evaluation** documents under `docs/ui/` (e.g.
`thoughtful-seatmate-stage1-foundations-implementation.md`, `…-stage2-tonight-pilot.md`,
`…-stage3-film-file-pilot.md`, `…-stage4-globalization-readiness.md`, `…-stage5-foundation-hardening.md`,
and the `…-p1/p2*-…-evaluation.md` series) describe **historical decisions** taken while the system was a
scoped pilot. They are retained for context and audit trail. They **must not override**:

- [ADR 019 — website-wide canonical theme](../decisions/019-thoughtful-seatmate-website-wide-theme.md);
- the **current production implementation** (the shipped code is the source of truth);
- **this composition-system ownership document**;
- the **current design-system rules** (`.claude/rules/design-system.md`).

If a stage document still describes the system as pilot-only, opt-in, tree-shaken from production,
unadopted, or "not yet globalized," treat that as historical framing superseded by the shipped
website-wide theme.
