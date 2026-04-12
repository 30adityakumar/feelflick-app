# ADR 002 — MovieCard Hover: Expand In Place, No Portal

**Status:** Accepted  
**Date:** 2025-07  
**Decided by:** Aditya Kumar

## Context

MovieCard needs to show expanded info (title, meta, genres, description, streaming, actions) on hover without crowding the default card size. Two main options were considered:

1. **Portal / floating overlay** — render expanded card in a portal at a fixed position above everything
2. **Expand in place** — card grows vertically inside the carousel scroll container

## Decision

Expand in place. No portal. No floating overlay.

Three files own this behaviour and must all be read before any modification:
- `Row/index.jsx` — owns `expandedId` state + 450ms intent timer (do not change)
- `Card/index.jsx` — owns height transition: `isExpanded ? height * 1.55 : height`
- `MovieCard.jsx` — owns the content rendering inside the card

Scroll container must have `overflow-x: auto; overflow-y: visible`. No ancestor `overflow: hidden`.

## Rationale

- Portal approach breaks scroll container z-index stacking across carousel rows
- In-place expansion is more cinematic — siblings dim and scale down, reinforcing focus
- Simpler DOM — one card, one position, no absolute coordinate math
- 450ms intent timer prevents accidental triggers during casual scroll

## Consequences

- ✅ No z-index wars between rows
- ✅ Sibling dim effect (`opacity-60 scale-[0.97]`) works naturally
- ✅ No extra DOM nodes from portals
- ⚠️  Scroll container overflow rules are strict — any ancestor `overflow:hidden` breaks the expanded card
- ⚠️  Adding a new info panel to the card requires careful ordering (see MovieCard content order in CLAUDE.md)

## Rule

> **No portal. No floating overlay. One card, expands in place. Do not change the 450ms timer.**
