# F12E — Card / Poster / History-Row Rhythm Pass

> **Phase F12E. Safely solve the F12C-deferred History per-item diary controls via the row's grid
> rhythm, + a disciplined card/poster audit.** Engine frozen `2.17`. No MovieCard hover-LAW change, no
> broad poster redesign, no `/about` impact. **Does not unblock F8C.**

**Status:** ✅ implemented. **Date:** 2026-06-05.

---

## Current patterns (audit)

### History diary row (`History.jsx` `DiaryGroup`)
Each entry is a **CSS grid** `ff-hist-row`:
- **desktop:** `grid-template-columns: 64px 1fr auto auto` · `gap: 24` · `align-items: flex-start`.
- **mobile (≤720px, `history.css`):** `64px 1fr auto` · `gap: 12` · the **runtime column is hidden**.

Columns: **poster button** (64×96, `aria-label="Open …"` — large, ≥44 ✓) · **content** (title button +
year + stars/mood + note) · *(runtime, desktop only)* · **remove button** (trash icon, `padding:7px 10px`
≈ **28×34 — the sub-44 control**, `aria-label="Remove … from diary"`).

### The F12C-deferred issue — re-examined
F12C deferred the per-item controls because expanding them with the `::after` **overlay** technique on
packed controls risks **overlapping hit zones**. **But the remove button is in its OWN grid column,
separated from its neighbor by a 24px (desktop) / 12px (mobile) gap.** A **real 44×44 button** there
**cannot overlap** — grid cells don't overlap, and the gap is the breathing room. So the fix is a real
44×44 button, not an overlay. The row rhythm is already sufficient.

The **title button** (the movie title rendered as a button → opens the film) is a **redundant** open
affordance: the **64×96 poster button opens the same film** and is already a ≥44px tap target. So the
title text-button is an **accepted exception** — not worth inflating every row's height to make a
*second* 44px open-target for the same action.

## Where target sizes are unsafe / overlap risk
- **Remove button** — currently ~28×34, sub-44 → **fix to 44×44** (its grid cell + 12–24px gap = no
  overlap). ✅ safe.
- **Title button** — sub-44 but **redundant** with the poster (which is ≥44) → **accepted exception**,
  not changed (changing it would add height to every row for no new capability).

## Surfaces NOT touched (audit conclusion)
- **MovieCard / carousel / poster hover** — the hover LAW + poster ratios are correct; **no change**.
- **Browse / Watchlist cards** — coherent (F12A); browse filter chips already fixed in F12C; **no change**.
- **Shared `Card` / `AccentPanel` / `PageContainer`** — used as-is; no new primitive needed.
- **Movie poster image ratios** — no concrete issue found → **unchanged.**

## Proposed change (minimal, single-purpose)
**History remove button → a real 44×44 tap target** (`min-width/min-height: 44`, `inline-flex` centering
the 14px trash icon; keep transparent bg, border, color, behavior). Desktop + mobile. **Row height
unchanged** (rows are already taller than 44 via title + stars + note), **no overlap** (grid gap),
**no density change**, **no behavior/data change**.

## Rollback plan
Revert the PR. The change is a few style props on one button — 1:1 reversible.

## Validation plan
`lint → test → build → audit` + a History row test (the remove control keeps its accessible label +
gains the 44px sizing) + an **authenticated Playwright check** (`/history` @390/430/768/1280: remove
button ≥44×44, no overlap, no horizontal overflow; `/browse` + `/watchlist` unchanged) + `test:e2e`.
`/` + `/about` untouched → CI Visual Regression covers public baselines.
