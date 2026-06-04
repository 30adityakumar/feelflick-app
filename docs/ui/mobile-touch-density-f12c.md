# F12C — Mobile Touch-Target + Density Pass

> **Phase F12C. Bring key route-local interactive controls to a practical 44px mobile touch floor —
> WITHOUT a Button redesign, MovieCard change, or card/poster redesign.** Engine frozen `2.17`.
> **Does not unblock F8C.**

**Status:** ✅ implemented. **Date:** 2026-06-04.

---

## Baseline (Playwright, authenticated, @390px)

Every sub-44px target is **route-local** — **0** inside the poster/MovieCard system (it's off-limits and
already ≥44 for the poster `<a>`). Counts + the dominant fixable groups:

| Route | sub-44px @390 | dominant fixable controls |
|---|---|---|
| **Browse** | 20 | **15× FilterPill chips** (h34) · search input (h42) · `ff-browse-search-btn` (h42) · `ff-browse-refine-btn` (h34) |
| **History** | 76 | **~5 FilterBar filter buttons** (h28) · **sort `<select>` h17** · search input (h38) · **+~67 per-item diary icon buttons** (rewatch/remove, h28) |
| **Account** | 20 | **14× Toggle switches** (44×24) · **4× "View my profile →" inline links** (h17) |
| **Home** | 9 | **6× mood pills** (h36) · reshuffle icon (32×32) |

Excluded from F12C (not route-local): the shared **Header** logo (`a.shrink-0` h28) + mobile menu
(`button.lg:hidden` 36×36) appear on every route — touching them is a shared-chrome change, out of scope.

## Target categories + technique

- **Text controls** (chips, pills, filter buttons, search inputs, sort) → **`min-height:44px` (mobile
  only)**. They grow a little taller on phones — the intended touch improvement; desktop unchanged.
- **Icon / switch controls** (account Toggle 44×24, home reshuffle 32×32, inline links) → **pseudo-element
  hit-area expansion** (`.ff-tap-hit::after`, absolute, ≥44×44, transparent). **Visual size unchanged, no
  layout/density change** — the right technique for switches/icons.

Two mobile-only utilities (added to `index.css`):
```css
@media (max-width: 767px) {
  .ff-tap { min-height: 44px; }                 /* text controls grow to the floor */
  .ff-tap-hit { position: relative; }
  .ff-tap-hit::after { content:''; position:absolute; top:50%; left:50%;
    transform:translate(-50%,-50%); min-width:44px; min-height:44px; width:100%; height:100%; }
}
```

## Files to touch

| File | Change |
|---|---|
| `src/index.css` | + `.ff-tap` / `.ff-tap-hit` mobile utilities |
| `src/features/browse/components.jsx` | `ff-tap` on FilterPill chip + search/refine buttons + search input |
| `src/features/history/History.jsx` | `ff-tap` on FilterBar filter buttons + search input + sort label |
| `src/features/account/sections-top.jsx` | `ff-tap-hit` on Toggle; `ff-tap-hit` on "View my profile" links |
| `src/features/home/sections-top.jsx` | `ff-tap` on mood pills; `ff-tap-hit` on reshuffle |

## Intentionally deferred (documented)

- **History per-item diary icon buttons (~67)** — rewatch/remove icons packed tightly in each diary row.
  Expanding each to a 44px hit area would make adjacent zones **overlap → mis-taps**; safely fixing them
  needs a **list-row rhythm change** → **F12E** (card/list pass), not F12C.
- **Home loading skeleton** — **no change.** `BriefingSkeleton` is content-shaped and accurately mirrors
  the loaded Briefing (poster + title + why + actions); its mobile-fold size IS the Briefing's poster-led
  mobile layout. Shrinking it would cause **CLS** and misrepresent the pick. The "domination" is a design
  choice, not a skeleton defect.
- **Shared Header** tap targets — shared chrome, not route-local.
- **Shared `<Button>`** — untouched (F12D).

## Expected impact

Mobile (≤767px): control bars grow to a 44px floor; switches/icons get a 44px hit area at unchanged
visual size. **Desktop (≥768px): zero change.** No behavior/data/copy change. `/` + `/about` untouched.

## Rollback plan

Revert the PR. Utilities are additive; class additions are 1:1 reversible.

## Validation plan

`lint → test → build → audit` + the Playwright **before/after tap-target measurement** (390/430/768) +
authenticated screenshots + `npm run test:e2e`. `/` + `/about` untouched → CI Visual Regression covers
public baselines.
