# F3 Design Authority Lock — Historical Record (Superseded)

> ## ⚠️ SUPERSEDED — historical record only
>
> **This document no longer governs FeelFlick design.** The active design
> authority is
> [`design-authority-thoughtful-seatmate.md`](design-authority-thoughtful-seatmate.md).
>
> This file is kept as a **historical decision record**. It documents the **F3/F4
> direction that is currently shipped** (Midnight Film Journal identity, Newsreader
> editorial voice, rose `#DD4E83` accent, numbered I/II recommendation case) — a
> **transitional production baseline**, not the target.
>
> - The **migration order below is no longer active.** Do not migrate new surfaces
>   to Newsreader / rose / numbered-case.
> - **Do not use this document as the target for new design work.** Build toward the
>   Thoughtful Seatmate direction instead.
> - The "locked … follow without re-debating" language below reflects the F3/F4
>   decision *at the time*; it no longer constrains new work. The shipped
>   implementation it describes must not be removed or rewritten except as a
>   deliberate, gated re-migration.
>
> Everything below this banner is preserved verbatim as the original F3/F4 record.

**Status:** Historical — superseded by the Thoughtful Seatmate direction; records the shipped F3/F4 transitional baseline

**Date:** 2026-06-12  
**Phase:** F3-DesignAuthorityLock  
**Evidence:** F0 Design Lab (3 directions, 6-judge adversarial critique) + F1-BriefingMigration + F2-HomeShellAlignment

---

## Decision

The FeelFlick visual direction is locked. Future Claude Code sessions doing design or migration work on any surface should follow this direction without re-debating it.

The approved direction is a hybrid:

> **Midnight Film Journal as the base identity + Cinematic Concierge's numbered explanation-case structure.**

The third direction (Emotional Mood Instrument) is reserved for Discover and mood-specific moments only.

---

## Approved direction

Eight locked signals, in priority order:

1. **Midnight Film Journal canvas** — near-black warm canvas (`#09090b`–`#0e0c0d`), low-contrast surface separation, no heavy card borders or backgrounds competing with the poster
2. **Newsreader editorial voice** — Newsreader is the curator speaking; Inter is the product speaking. Do not use Newsreader for buttons, labels, metadata, or chips.
3. **Warm cinematic dark neutrals** — ivory/bone text (`#F2ECE1`) at primary scale; muted warm secondaries; no cool blue-black or stark pure-white neutrals
4. **Restrained rose accent** — `#DD4E83` is a red-ink accent (kicker rules, primary CTAs, selective editorial emphasis), not a glow, not a gradient, not the dominant surface color
5. **Hairline rules over generic cards** — surface separation via `rgba(242,236,225,0.12–0.20)` hairlines; no ambient glow, no rounded-glass panels, no shadows as premium signals
6. **Poster as cinematic/editorial object** — tipped-in with a warm mat border and faint rose/warm shadow; it has physical weight, not a flat thumbnail in a grid
7. **Numbered I/II recommendation case** — the explanation is the emotional center; Newsreader italic for the reason, Inter for the synopsis; roman numerals only when both rungs present
8. **Reduced decorative chrome** — warm atmosphere comes from restrained radial pools behind the poster, not from stacked glow/blur/glass/gradient effects

### Palette reference (as used in F1/F2 production)

```js
const IVORY       = '#F2ECE1'
const IVORY_SOFT  = 'rgba(242,236,225,0.82)'
const IVORY_META  = 'rgba(242,236,225,0.62)'
const IVORY_SEP   = 'rgba(242,236,225,0.30)'
const IVORY_LABEL = 'rgba(242,236,225,0.70)'
const HAIRLINE    = 'rgba(242,236,225,0.12)'
const WARM_KEYLINE= 'rgba(242,236,225,0.20)'
const ROSE        = '#DD4E83'
const ROSE_MAT    = 'rgba(221,78,131,0.30)'
```

These constants are currently local to `/home`. They will be promoted to shared tokens once two production surfaces validate the values.

---

## Anti-patterns — never reintroduce on migrated surfaces

1. **Purple→pink gradient CTA carrying brand + premium + AI + primary-action all at once.** Retired from `/home`. The bone-slab primary and rose-ghost secondary replace it. May be reconsidered for wordmark or narrow atmospheric moments, not as a CTA.

2. **Dark surface + rounded card + ambient glow + accent final word.** The "glowing dark mood card" pattern (PageEndCard before F2). Replaced by warm hairline panel + Newsreader editorial heading.

3. **Generic Tailwind card grid.** `rounded-xl bg-gray-800` or similar plain-dark card patterns. Use hairline panels or open composition instead.

4. **Netflix-style rail/hero.** Full-bleed hero with gradient overlay and three-card rails below. FeelFlick's primary mode is editorial briefing, not catalog browsing.

5. **Letterboxd/TMDB database feel.** Dense metadata grids, star-rating aggregates as the primary surface, social activity feeds. Use these signals inside the explanation case, not as the primary visual.

6. **Fake personalization evidence.** Never fabricate mood-claim copy ("For your tender night"), inferred taste assertions without real signal, or manufactured social proof. The honesty constraint is load-bearing.

7. **Decorative motion without product meaning.** Ambient parallax, looping shimmer, hover glow that appears on every card. Motion should communicate response, selection, or meaningful transition — not technical capability.

---

## Recommendation presentation rules

1. **Explanation is the emotional center.** Present it at editorial scale with Newsreader italic. Do not relegate it to a small tinted chip below the poster.

2. **Numbered case only when multiple truthful rungs exist.** `I · Why this pick` (engine reason) + `II · What you're in for` (synopsis). If only one rung has real data, present it unnumbered.

3. **Never fabricate the engine reason.** `engineReason` is null for baseline/generic picks (`resolveEngineReason` in `useHomeData.jsx`). When null, the case is absent — not replaced with generic copy like "this film matches your taste."

4. **Never claim the user's current mood as a visible assertion.** The auto-selected baseline mood is a ranking signal internally; it must not appear as a claim about the user's current state (e.g., "for your tender night," "since you're in a curious mood").

5. **"Not tonight" is dignified.** Skip/reject actions should feel calm and respectful, not destructive. The product should communicate that skipping is a useful signal, not a failure.

---

## Migration order

| Order | Surface | Notes |
|---|---|---|
| ✅ Done | `/home` briefing + shell | F1-BriefingMigration + F2-HomeShellAlignment |
| 1 | Movie Detail / Film File (`/movie/:id`) | The case structure is naturally suited to Film File's existing sections |
| 2 | Discover mood ritual | Emotional Mood Instrument ideas are appropriate here (mood-spectrum selector, contextual color) |
| 3 | Landing page | Large editorial canvas; will need Newsreader + warm neutrals pass |
| 4 | Onboarding, profile, library | After the primary user-facing surfaces are coherent |

---

## What not to touch yet

* **Recommendation engine** — scoring, ranking, filters, data contracts. The visual direction is independent of recommendation quality; do not couple them.
* **Shared components** — do not rewrite `Button`, `Card`, `AccentPanel`, `ActionButton`, `MovieCard` to the new direction until at least two production surfaces confirm the pattern. Premature promotion creates debt if the values shift.
* **Global CSS tokens** — the warm palette values are currently local constants in `/home` files. Promote to `src/shared/lib/tokens.js` or CSS custom properties only after two surfaces validate the specific values.
* **Design Lab files** (`src/features/design-lab/`) — keep isolated; they exist to compare alternatives, not as production UI.
* **AppShell header** — gradient wordmark, "Tonight" nav tab, purple avatar ring. These require a separate global header redesign pass.
* **App-wide `:focus-visible` ring** — still purple. Recoloring this touches every interactive element; scope it as a dedicated global token pass.

---

## Evidence trail

| Artifact | Location |
|---|---|
| F0 Design Lab directions | `src/features/design-lab/` (untracked, branch only) |
| F0 capture screenshots | `/tmp/feelflick-f0-capture/` (local) |
| F0 adversarial critique | Session 626a53f9 context |
| F1 migration | `src/features/home/{sections-top,WhyThisPick,home.css,index.html,index.css}` |
| F2 shell alignment | `src/features/home/{sections-bottom,sections-top,home.css}` |
| F1/F2 test regression | `HomeBriefingHierarchy.test.jsx` (+2 numbered-case tests) |
| F1 capture screenshots | `/tmp/feelflick-f1-briefing/` (local) |
| F2 capture screenshots | `/tmp/feelflick-f2-home-align/` (local) |
| Memory record | `.claude/projects/…/memory/project_briefing_migration_f1.md` |
