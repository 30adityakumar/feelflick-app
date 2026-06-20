# ADR 021 — Adaptive Editorial Cinema visual foundation

**Status:** Accepted
**Date:** 2026-06-19
**Supersedes:** ADR 015's exact warm-graphite/projection-ivory values and the bounded rose identity.
**Preserves:** ADR 014 (Inter), ADR 016's neutral non-brand decision signal, ADR 019's single root theme architecture, and ADR 020's personal-discovery doctrine.

## Context

FeelFlick is now a personal movie discovery platform across three complementary modes: Made for you, Tuned to the moment, and Yours to explore. The previous warm-graphite system was developed around a sparse, focal single-pick experience. The visual-foundation audit found excellent text contrast and central theme architecture, but weak layer separation, a muted tier that failed normal-text AA on the raised surface, theme-bypassing cool glass and purple/pink remnants, universal pill geometry, and atmosphere tuned too strongly to one focal film.

Benchmark review of Netflix, Apple TV, MUBI, Letterboxd, Criterion, Apple Human Interface Guidelines, Carbon and WCAG supported a quieter neutral shell, clear contextual layers, content-led imagery, accessible semantic roles, and depth that appears only when attention or interaction requires it.

## Decision

FeelFlick adopts **Adaptive Editorial Cinema**:

- **Deep Neutral Ink:** `#0f1010`, `#171819`, `#222427`, `#2e3135`.
- **Paper-White Typography:** `#f5f2eb`, `#c9c5bc`, `#a5a198`.
- **Functional boundaries:** decorative `#3a3d41`; strong interactive `#747a82`.
- **Neutral inverse primary action:** `#f0ece4` on `#0f1010` text.
- **Cinematic coral-red signature:** `#e5636f`; accessible text `#ed7a87`; strong white-text fill `#b83d4f`.
- **Inter remains the single core typeface.**
- **Flat-first composition:** a solid ink canvas is normal; neutral depth is opt-in for introductions, a focal film, or immersive modal context.
- **Editorial structure with responsive focus:** text buttons use restrained rounded rectangles; pills are reserved for compact choices and icon controls; focus and hover clarify attention without decorative scale or glow.
- **Selective cinematic imagery:** posters and backdrops provide recognition and atmosphere; FeelFlick's explanations, history and personal evidence provide meaning. One dominant backdrop per viewport is the normal ceiling.

Brand accent remains separate from commands, selection, focus, mood identity and semantic success/warning/error states.

## Architecture

The existing `.theme-thoughtful` class name remains temporarily for compatibility, but its canonical token contract now renders Adaptive Editorial Cinema. CSS and JavaScript mirrors remain drift-tested. Legacy purple/pink/font aliases and `VITE_UI_THEME=legacy` remain a removal-gated rollback bridge.

## Consequences

- Every route inherits the new foundation through the single root theme boundary.
- Shared Button, Card, PageDepth, browser chrome, carousel rows and movie cards adopt the new interaction language.
- Old rose token names remain temporary aliases; new work uses `brand-accent` roles.
- Visual baselines require deliberate regeneration after review.
- Route-level hardcoded legacy colors remain migration debt when they bypass semantic tokens; they must not be copied into new work.
- This decision changes visual presentation only. Recommendation logic, data contracts, analytics, schemas and permissions remain unchanged.

## Rollback

`VITE_UI_THEME=legacy` remains a partial token-layer fallback. A complete rollback requires reverting the implementation PR because shared-component geometry and directly edited presentation are outside the token switch.
