# ADR 019 — Thoughtful Seatmate: Website-Wide Canonical Theme

**Status:** Accepted
**Date:** 2026-06-18
**Decided by:** Aditya Kumar. Supersedes the route-by-route adoption model of Stages 1–6 with a single centrally-controlled theme architecture, implemented in one coordinated PR.

> Decision statement:
>
> **The Thoughtful Seatmate visual system is promoted from a scoped, route-by-route
> pilot to the canonical theme for the whole web application. A single root theme
> boundary (`.theme-thoughtful`, applied once at the app root) owns the semantic
> `--color-*` tokens; legacy token systems (`--ts-*`, `--bg-*`, `--brand-*`, the
> Tailwind `--purple-*`/`--pink-*` scale, `--font-editorial`, `HP`/`ROSE`) are kept
> working through temporary compatibility aliases that point at the canonical tokens.
> Changing one canonical token now propagates site-wide. A `VITE_UI_THEME` switch
> provides immediate, file-revert-free rollback to the legacy system.**

Predecessors: [ADR 014](014-thoughtful-seatmate-p1-core-voice.md) (Inter), [ADR 015](015-thoughtful-seatmate-p2a-foundation.md) (warm-graphite / projection-ivory foundation), [ADR 016](016-thoughtful-seatmate-p2b-decision-signal.md) (ivory-only decision signal), [ADR 017](017-thoughtful-seatmate-p2c-a-contextual-color-envelope.md) + [ADR 018](018-thoughtful-seatmate-p2c-b-aura-strength.md) (contextual color — deferred, NOT implemented). Implementation record: [`../ui/thoughtful-seatmate-website-wide-migration.md`](../ui/thoughtful-seatmate-website-wide-migration.md).

---

## 1. Status

Accepted. This is an **architecture** decision (how the theme is owned and applied),
plus the website-wide visual migration that realizes it, delivered in one branch / one
PR. It does **not** change ADR 014–018's accepted *values* — it changes how those
values are owned (one canonical token source) and applied (one root boundary instead of
per-route `.ts-root` wrappers). Contextual film color (ADR 017/018) remains **deferred
and unimplemented**.

## 2. Context

Stages 1–6 deliberately migrated one route family at a time, each opting into the
foundation via a local `<ThoughtfulRoot>` wrapper and scoped `--ts-*` tokens, while the
rest of the app stayed on the legacy purple/pink + Newsreader/Outfit system. That
isolation was correct for de-risking, but it left the site visibly half-migrated, and a
token change could not propagate without editing every route. The globalization-readiness
review (Stage 4) and foundation hardening (Stage 5) closed the prerequisites; this ADR
flips the model from scoped adoption to a single canonical theme.

## 3. Decision

1. **One canonical token contract.** The semantic `--color-*` tokens are defined in
   `src/shared/ui/thoughtful-seatmate/foundations.css` (`.theme-thoughtful`), with a JS mirror
   `CANONICAL_THEME` in `tokens.js`. The two are manually maintained mirrors (neither is
   generated from the other) — **one canonical token contract with a CSS mirror and a JS
   mirror, kept in sync by a drift test** that compares every token name + value.
2. **One root boundary.** `src/App.jsx` wraps the entire app (the router, so every route,
   shell, and overlay) in `.theme-thoughtful`. No route declares its own theme root for
   colour; the legacy per-route `<ThoughtfulRoot>` wrappers become harmless no-ops nested
   inside the global theme (documented for later removal).
3. **Compatibility aliases.** Under `.theme-thoughtful`, the legacy token systems alias the
   canonical tokens: `--ts-*` → `--color-*` (foundations.css); `--bg-*`, `--brand-ivory`,
   `--brand-rose`, `--font-editorial`, `--font-display`, and the Tailwind `--purple-*`/
   `--pink-*` scale → `--color-*` (src/index.css). The shared JS tokens (`HP`, `ROSE`,
   `IVORY`, `SHADOW.focus`, `C`) resolve to `var(--color-*, <legacy>)`. Aliases hold exactly
   one value (the canonical one); they are temporary and removed once consumers are migrated
   off the legacy names.
4. **Emergency theme fallback (partial visual rollback).** `VITE_UI_THEME=legacy` swaps the
   root class to a no-op `.theme-legacy`, disabling the canonical alias layer so the pre-existing
   `:root` tokens + the legacy literal `var()` fallbacks resolve again where they still exist. This
   is a **runtime token-layer fallback** for palette / theme-boundary mitigation — a **partial**
   visual rollback, **not** an exact restoration of the pre-migration site (it does not undo the
   removed Newsreader/Outfit font loading, the changed shared-component defaults, or the directly
   edited shell/route/CSS/SVG/JS presentation). A **full** return to the pre-#315 appearance
   requires **reverting this PR's squash commit** (see §6). `thoughtful` is the production default.
5. **Token ownership.** Anyone tuning the palette edits the canonical `--color-*` in
   foundations.css (+ the JS mirror, guarded by the drift test); the alias layer fans it out.
   No route owns colour.

## 4. Why scoped pilot roots were replaced

- A scoped `.ts-root` per route cannot recolour the shell, overlays, or unmigrated routes,
  so the product stayed half-migrated indefinitely.
- "Change one token → whole site" is impossible when each route hardcodes or scopes its own
  colour; it is trivial when one root owns canonical tokens and everything else aliases them.
- The Tailwind `purple`/`pink` scale already compiled to `var(--purple-*)`/`var(--pink-*)`,
  so overriding those vars under the root class neutralises every purple/pink utility at once
  — a clean, low-risk lever the scoped model could not use.

## 5. Why the root theme is now canonical

The pilots (Stages 2/3/6) validated the foundation on real authenticated surfaces with no
regressions, and Stage 5 hardened the primitives + contrast rules. With the values proven,
centralizing ownership is the only way to (a) finish the migration, (b) make tuning a
one-line change, and (c) keep a single visual system rather than two maintained palettes.

## 6. How rollback works (two distinct levels)

**Runtime emergency theme fallback — `VITE_UI_THEME=legacy`.** Read once in `App.jsx`.
`thoughtful` → `.theme-thoughtful` (canonical tokens + aliases + theme application). `legacy`
→ `.theme-legacy` (no declarations), so `--color-*`/`--ts-*` are undefined and every
`var(--color-*, <legacy>)` / `var(--ts-*, …)` resolves to its historical literal, while the
untouched `:root` `--bg-*`/`--brand-*`/`--purple-*`/`--font-*` tokens resolve again **where
those fallbacks still exist**. This is a **runtime token-layer fallback** — useful for emergency
palette / theme-boundary mitigation — and a **partial** visual rollback. It does **not** restore
the removed Newsreader/Outfit font loading, the changed shared-component defaults, or the
directly-edited shell/route/CSS/SVG/JS presentation, and it does not restore the old visual
baselines. **Do not describe `.theme-legacy` as an exact restoration of the old website.**

**Full visual rollback — revert the PR.** A full return to the exact pre-#315 appearance
requires **reverting this PR's squash commit**. Because the migration lives behind one theme
boundary class + a contained set of presentation edits, that revert is a clean, isolated
operation — but it is the env switch *plus* the file changes, not the env switch alone.

Legacy mode is **temporary emergency support only**; its removal is scheduled with the
alias-removal cleanup (see the migration doc).

## 7. How token ownership works

`--color-*` (foundations.css + `CANONICAL_THEME` in tokens.js) is authoritative. The `--ts-*`
namespace, the legacy `--bg-*`/`--brand-*` tokens, the Tailwind `--purple-*`/`--pink-*` scale,
and the JS `HP`/`ROSE`/`C`/`SHADOW` objects are **consumers/aliases**, never independent
values. The guard (`legacy-gradient-guard.mjs`) + the new theme audit (`theme-audit.mjs`,
wired into `guard:foundations`) enforce that no forbidden purple/pink chrome or
Newsreader/Outfit face renders, and that the canonical tokens stay class-scoped (not promoted
to `:root`), preserving rollback.

## 8. Consequences

- One canonical token change propagates to the shell, all routes, and all shared components.
- The whole browser app is Inter-only, warm-graphite/ivory, with the legacy purple/pink
  gradient chrome retired (legacy-gradient debt reduced 16 → 10 occurrences, the remainder
  being the rollback-fallback `:root` tokens + unused `HP_GRAD` + test assertions).
- The legacy `<ThoughtfulRoot>` wrappers in Tonight/Film File/Library are now redundant
  no-ops; they are retained to minimize churn and scheduled for removal with the alias cleanup.
- Contextual film color stays deferred; no aura, no poster/mood-derived chrome is added.

## 9. What this does NOT decide

- It does **not** change the accepted ADR 014–018 *values* (Inter, the foundation hexes, the
  ivory decision signal, the contextual envelope/alpha which remain unimplemented).
- It does **not** implement contextual film color, a replacement brand gradient, or any
  product-behaviour / data / analytics / routing / IA change.
- It does **not** make the compatibility aliases permanent — they are temporary and removed
  when consumers are migrated off the legacy names.
- Share/export artifacts (`ShareCard` and any social/exported imagery) are a separate
  rendering environment and are explicitly deferred (see the migration doc, §27 scope).

## 10. Production implications

The shipped product moves fully onto the canonical theme (production default `thoughtful`).
Validation: `guard:foundations` (legacy-gradient + theme audit) green, lint clean, the full
unit suite green, build green; the website-wide visual baselines are regenerated and reviewed
as the intentional migration diff (see the migration doc). Emergency theme mitigation is a
single env/class flip (`VITE_UI_THEME=legacy`, a partial/runtime token-layer fallback); a full
visual rollback to the pre-#315 appearance requires reverting this PR (see §6).
