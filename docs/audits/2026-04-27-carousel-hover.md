# Carousel hover audit

## Current architecture

On `mouseenter`, `useMovieCardHover` (called once inside `CarouselRow`) immediately sets both `intentId` and `openId` to the hovered movie's ID in the same synchronous call (`CARD_EXPAND_DELAY_MS = 0`). Row maps each item's ID against `openId` / `intentId` to derive a `hoverPhase` prop (`'rest'` | `'peek'` | `'expanded'`) and passes it down to `MovieCard`, which passes it to `Card`. `Card` uses it to drive CSS transitions on the slot outer div (height) and the absolutely-positioned article element (left, width, height, transform, opacity, border-color, box-shadow). Inside the article, `MovieCard` uses a Framer Motion `AnimatePresence` to crossfade between a collapsed poster view and a fully expanded info panel; the expanded panel reveals backdrop image, title, meta, description, streaming provider, and action buttons via staggered `motion.div` animations. Siblings of the expanded card receive `dimmed=true` (opacity 0.6, scale 0.97) and `siblingOffset` props (±18px for immediate neighbours, ±8px for the card two away) applied through the same CSS transform on the article. On `mouseleave`, a 90ms `setTimeout` fires before clearing both IDs; the row also calls `closeNow()` directly on any carousel scroll event. A window-level scroll listener registered with `{ capture: true }` calls `closeNow()` on any scroll — including horizontal carousel scroll — with no target filtering.

---

## Timing / easing / scale inventory

| File | Property | Value | Notes |
|---|---|---|---|
| Card/index.jsx:46 | height (slot div) | `280ms cubic-bezier(0.22, 1, 0.36, 1)` | outer slot grows to `height × 1.55` |
| Card/index.jsx:73 | opacity (article) | `200ms ease` | dimmed siblings fade here |
| Card/index.jsx:73 | left (article) | `280ms cubic-bezier(0.22, 1, 0.36, 1)` | center-expand offset |
| Card/index.jsx:73 | width (article) | `280ms cubic-bezier(0.22, 1, 0.36, 1)` | 220 → 444px at xl |
| Card/index.jsx:73 | height (article) | `280ms cubic-bezier(0.22, 1, 0.36, 1)` | 330 → 512px at xl |
| Card/index.jsx:73 | transform (article) | `300ms ease` | scale + translateX (siblings) + translateY (hover lift) |
| Card/index.jsx:73 | box-shadow (article) | `300ms ease` | |
| Card/index.jsx:73 | border-color (article) | `300ms ease` | |
| MovieCard.jsx:167 | Framer shell (expanded ↔ collapsed switch) | `duration 0.28s ease [0.22, 1, 0.36, 1]` | opacity 0→1, scale 0.985→1 on enter; reversed on exit |
| MovieCard.jsx:163 | Framer content items (7 staggered divs) | `duration 0.22s ease [0.22, 1, 0.36, 1]` | delays: 0.06 / 0.08 / 0.10 / 0.11 / 0.12 / 0.15 / 0.18s |
| MovieCard.jsx:511–513 | poster img transform | `380ms cubic-bezier(0.22, 1, 0.36, 1)` | scale 1 → 1.04 at peek (DEAD — see Friction 4) |
| MovieCard.jsx:511–513 | poster img opacity | `220ms ease` | fade-in on load only |
| MovieCard.jsx:511–513 | poster img filter | `280ms ease` | saturate/contrast at peek (DEAD) |
| MovieCard.jsx:281 | backdrop img opacity | `240ms ease` | fade-in on load |
| MovieCard.jsx:540 | collapsed glow div | `300ms` (Tailwind `duration-300`) | opacity 0.25 → 1 at peek (DEAD) |
| MovieCard.jsx:557–585 | below-card title (motion.div) | `duration 0.22s ease [0.22, 1, 0.36, 1]` | opacity, y, height, marginTop collapse when expanded |
| Row/index.jsx:43 | ScrollButton | `opacity 200ms ease, transform 200ms ease, background 200ms ease` | |
| useMovieCardHover.js:3 | CARD_EXPAND_DELAY_MS | `0` ms | intent → open: immediate |
| useMovieCardHover.js:4 | CLOSE_DELAY_MS | `90` ms | mouseleave → close: 90ms grace |

**Scale ratios at xl breakpoint (itemWidth = 220, posterHeight = 330):**

| hoverPhase | Article width | Article height | Slot height | scale | translateY |
|---|---|---|---|---|---|
| rest | 220 px | 330 px | 330 px | 1.0 | 0 |
| peek | 220 px | 330 px | 330 px | 1.012 | −3 px |
| expanded | 444 px | 512 px | 512 px | 1.02 | −8 px |

`expandedWidth` call site (Row/index.jsx:102–105):
```js
const expandedWidth = useMemo(
  () => Math.max(Math.round(itemWidth * 2.02), itemWidth + 220),
  [itemWidth]
)
```
At xl: `max(round(220 × 2.02), 440) = max(444, 440) = 444`.

`expandedHeight` call site (Row/index.jsx:106–109):
```js
const expandedHeight = useMemo(
  () => Math.round(posterHeight * 1.55),
  [posterHeight]
)
```
At xl: `round(330 × 1.55) = round(511.5) = 512`.

Center-expand left offset (Card/index.jsx:20–26): `−round((444 − 220) / 2) = −112 px`.

---

## State machine

```
hoverPhase values:  'rest'  |  'peek'  |  'expanded'
(derived in Row/index.jsx:305-306 from openId and intentId)

State variables in useMovieCardHover:
  intentId  — the movie ID the cursor is over (set on mouseenter)
  openId    — the movie ID whose panel is fully open (set on mouseenter, cleared on close)
  canHover  — boolean; false on touch/coarse-pointer devices

Possible combinations:
  intentId=null, openId=null   → hoverPhase='rest'       (initial / after close)
  intentId=X,    openId=null   → hoverPhase='peek'        (UNREACHABLE — see below)
  intentId=X,    openId=X      → hoverPhase='expanded'    (current active hover)
  intentId=null, openId=X      → IMPOSSIBLE (open always implies intent)

CARD_EXPAND_DELAY_MS = 0  (useMovieCardHover.js:3)
Because the delay is 0, scheduleOpen (lines 62-64) skips the timer branch:
    if (CARD_EXPAND_DELAY_MS <= 0) {
      setOpenId(item.id)   // synchronous
      return
    }
intentId and openId are both set in the same React batch.
Result: rest → expanded in ONE render. The 'peek' state is never reached.

Mouseenter (canHover=true):
  clearCloseTimer() → clearIntentTimer() → setIntentId(X) → setOpenId(X)
  hoverPhase: rest ──────────────────────────────────────────► expanded

Mouseleave:
  clearIntentTimer() → clearCloseTimer() → setTimeout(90ms):
    setIntentId(null) + setOpenId(null)
  hoverPhase: expanded ──────── 90ms ───────────────────────► rest

Fast mouseenter A → mouseleave A → mouseenter B (within 90ms):
  Close timer for A is cancelled by clearCloseTimer() in scheduleOpen(B).
  Result: A collapses immediately, B opens immediately. Clean handoff.

Fast mouseenter A → mouseleave A → no re-entry:
  After 90ms, both IDs cleared. Clean.

NO flicker window exists between intentId and openId with CARD_EXPAND_DELAY_MS=0
because both are set in the same synchronous call and React 18 batches them.

Scroll / resize: closeNow() fires immediately (no timer), skipping the 90ms grace.

Touch/coarse-pointer guard:
  canHover set by window.matchMedia('(hover: hover) and (pointer: fine)')
  handleCardEnter checks `if (!canHover) return` (line 82)
  handleCardFocus does NOT check canHover — keyboard focus can still expand on touch
```

---

## Frictions identified

1. **Scroll capture kills hover on any scroll, anywhere** — `useMovieCardHover.js:49`
   ```js
   window.addEventListener('scroll', handleViewportChange, true)
   // handleViewportChange = () => closeNow()
   ```
   The listener body is `() => closeNow()` with no `event.target` check and no filtering. The `true` third argument registers it in the capture phase, so it fires before the scroll container's own handler. Any scroll — page scroll, trackpad swipe, browser rubber-banding, horizontal carousel drag — immediately calls `closeNow()` and collapses the expanded card. On a trackpad, a user who hovered a card and then tried to scroll the carousel to bring the card into better view would find the card snapping shut the instant the scroll begins. This is the single largest smoothness problem.
   **Severity: HIGH**

2. **Redundant close on carousel scroll** — `Row/index.jsx:164` + `useMovieCardHover.js:49`
   ```js
   // Row/index.jsx handleScrollArea:
   hover.closeNow()
   ```
   `handleScrollArea` is the `onScroll` handler for the carousel scroll container (line 299). It already calls `closeNow()` directly. The window capture listener fires for the same event and calls `closeNow()` again. The double-close is harmless but indicates the architecture over-guards against the expand state surviving a scroll. If the window listener were fixed (Friction 1), the `Row` direct call would be the correct and only close trigger.
   **Severity: LOW**

3. **`overflow-y: visible` overridden to `auto` by the browser** — `Row/index.jsx:286, 297`
   ```jsx
   className="... overflow-x-auto overflow-y-visible ..."
   style={{ overflowY: 'visible', ... }}
   ```
   CSS spec (CSS Overflow Level 3): when `overflow-x` is non-`visible`, a specified `overflow-y: visible` is computed as `overflow-y: auto`. This applies even when the inline style sets `visible` — the computed value is `auto`. The scroll container therefore has `overflow: auto` on both axes. The expanded card's article uses `translateY(-8px)` (Card/index.jsx:63) to lift it, but the scroll container's `paddingTop` is only `0.25rem` (4px, line 293). The top 4px of the lift overflows the scroll container boundary and is clipped. Whether this is visible depends on row position in the viewport, but the top shadow and border of the expanded card can be truncated.
   **Severity: MED**

4. **`peek` hoverPhase is dead code; expansion is abrupt** — `useMovieCardHover.js:3`
   ```js
   export const CARD_EXPAND_DELAY_MS = 0
   ```
   With the delay at zero, `scheduleOpen` sets `openId` immediately. `hoverPhase` transitions `rest → expanded` in one React render. The `peek` intermediate state (poster `scale(1.04)`, filter `saturate(1.1) contrast(1.04)`, soft glow at opacity 1) is never reached (MovieCard.jsx:219–224, 544). The intent behind `peek` was to give the user a 200–450ms window to see a subtle scale-up before committing to the full panel expansion — the same affordance Netflix and Apple TV+ use to signal "this is hoverable" without immediately opening the panel. With CARD_EXPAND_DELAY_MS=0, a fast cursor sweep across an entire row triggers a rapid open/close sequence on every card it touches, which reads as janky rather than responsive.
   **Severity: MED**

5. **Two independent animation systems drive the same visual** — `Card/index.jsx:71–76` + `MovieCard.jsx:256–554`
   CSS transitions on the article element drive `width`, `height`, `left`, and `transform` (280–300ms). Framer Motion's `AnimatePresence` simultaneously drives the content crossfade (`shellTransition: 0.28s`). These are deliberately close in duration but are not coordinated — they run on independent timers. On a slow device or when React is busy, the Framer Motion shell animation and the CSS dimension transition can drift apart, producing a visible gap where the container has finished resizing but the content is still fading in, or vice versa. There is also no single authoritative timeline; adding a new content element (another `motion.div`) shifts all downstream stagger delays without touching the CSS side.
   **Severity: MED**

---

## Recommended fix shape

**Shape A — Tune existing popup.**

Specific knobs to turn:

1. **Filter the scroll listener** (`useMovieCardHover.js:46–54`). Add a check for whether the scroll event target is the carousel's scroll container element. The cleanest approach: accept an optional `scrollContainerRef` parameter to `useMovieCardHover`, and in the listener body, skip `closeNow()` if `event.target === scrollContainerRef.current`. Page-level scroll (e.g. the user scrolling the page past the carousel) still closes correctly. Trackpad horizontal swipe inside the row no longer snap-closes the card. This removes Friction 1 and makes Friction 2 redundant (the `Row` direct `closeNow()` on scroll remains as the correct handler for carousel scroll, and the window listener handles page scroll only).

2. **Restore `CARD_EXPAND_DELAY_MS` to ~180ms** (`useMovieCardHover.js:3`). This re-enables the `peek` phase, giving the cursor-position intent timer a moment to breathe. Fast sweeps no longer open panels; only deliberate pauses expand. The poster `scale(1.04)` and filter changes already written in MovieCard.jsx:219–224 immediately activate. This removes Friction 4.

3. **Fix the overflow-y clipping** (`Row/index.jsx:286–297`). Replace the `overflow-x-auto overflow-y-visible` approach with `overflow-x-auto` only, and increase `paddingTop` from `0.25rem` to `0.75rem` (12px) so the full `translateY(-8px)` + shadow clears the scroll container boundary. Alternatively, restructure so the article's `position: absolute` is relative to the section wrapper (outside the scroll container) using a portal — but that is materially more complex; the padding increase is the surgical path. This removes Friction 3.

Friction 5 (two animation systems) is not targeted in this shape — the coordination is close enough in practice that it rarely manifests on modern hardware. Document it as known tech debt.

**Estimated time: 3 hours**
- Scroll listener filter + ref threading: 1 h
- CARD_EXPAND_DELAY_MS restore + smoke-test peek appearance: 0.5 h
- paddingTop fix + visual verification of no clipping: 0.5 h
- Regression sweep across breakpoints: 1 h

**Rationale:** Friction 1 (the scroll capture listener) is the dominant smoothness problem and is solvable with a single targeted change that does not touch the visual design. Restoring `peek` (Friction 4) is a one-constant change that activates already-written code. These two together account for the majority of the "mid-animation snap" and "rapid-fire open/close on cursor sweep" impressions. Shape B would also fix them but would discard the info panel that the recommendation engine's metadata is specifically designed to surface (description, streaming provider, quality chips). The popup IS worth keeping if its primary friction is a filtering omission, not a conceptual problem.

---

## Estimated implementation time

**3 hours total.** Scroll listener filter 1h · peek phase restore 0.5h · overflow padding fix + visual QA 0.5h · cross-breakpoint regression 1h. Within the half-day Phase 2 budget.

---

## Out of scope

- **Touch / coarse-pointer behaviour.** `canHover` correctly gates expansion on touch devices via `(hover: hover) and (pointer: fine)`. `handleCardFocus` can still open a card via keyboard focus on touch+keyboard devices; this is intentional a11y behaviour and should not be changed.
- **`WatchProviders` network latency in the expanded panel.** The streaming provider fetch is gated on `enabled={isExpanded}`, so it fires on every expand. If it resolves slowly, the pill-sized skeleton lingers after the panel is fully open. Not a hover-smoothness issue; tracked separately.
- **CLAUDE.md doc drift.** CLAUDE.md describes `expandedId` state and a `450ms intent timer` in Row — the actual code uses `openId`/`intentId` in `useMovieCardHover.js` and `CARD_EXPAND_DELAY_MS = 0`. The doc should be updated to match the current implementation, but this is a documentation task, not a code task.
- **Virtualization mid-hover unmount.** With the current aggressive `closeNow()` on any scroll, a hovered card is always closed before it could scroll far enough to leave the virtualization window. If Friction 1 is fixed, a user who scrolled the carousel very aggressively could theoretically leave the overscan buffer while a card is open — but this is a corner case requiring the user to scroll 3+ card-widths (708px at xl) faster than the 90ms close grace timer. Not a priority for Phase 2.
- **Framer Motion + CSS dual-timeline coordination** (Friction 5). Not worth the refactor risk for the Phase 2 budget.
