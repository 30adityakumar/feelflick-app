# F12B — PageContainer + Type Scale + Missing H1s

> **Phase F12B. The first premium-polish wave from the F12A backlog — a container/heading
> *foundation*.** Engine frozen `2.17`. Additive primitive + tokens + a11y landmarks + **byte-identical**
> proof adoptions. **No `<Button>` render change, no `/about` impact, no redesign.** Does not unblock F8C.

**Status:** ✅ implemented. **Date:** 2026-06-04.

---

## Target files

| File | Change |
|---|---|
| `src/shared/ui/PageContainer.jsx` (new) | the container primitive |
| `src/shared/ui/PageContainer.css` (new) | responsive gutter classes |
| `src/shared/ui/__tests__/PageContainer.test.jsx` (new) | tests |
| `src/shared/ui/index.js` | export `PageContainer` |
| `src/shared/lib/tokens.js` | **+ `LAYOUT`, `GUTTER`, `TYPE`** (additive) |
| `src/shared/lib/__tests__/tokens.test.js` | pin the new tokens |
| `src/features/home/Home.jsx` | + sr-only `<h1>` |
| `src/features/browse/Browse.jsx` | + sr-only `<h1>` |
| `src/features/history/History.jsx` | + sr-only `<h1>` + adopt `<PageContainer size="wide">` |
| `src/features/account/Account.jsx` | + sr-only `<h1>` + adopt `<PageContainer size="app">` |

## Current route container patterns (F12A + code-grounded)

- **AppShell `<main>`** (`AppShell.jsx:124`): only a top offset (`--hdr-h`), **no max-width, no h-padding**;
  each route sets its own inner cap.
- **Home** (`Home.jsx:152`): **no max-width** (full-width, per-section gutters).
- **Browse** (`Browse.jsx:607`): inner `maxWidth:1440; margin:0 auto`.
- **History** (`History.jsx:353`): inner `maxWidth:1440; margin:0 auto`.
- **Account** (`Account.jsx:39`): inner `maxWidth:1280; margin:0 auto`.
- **The inconsistency:** Home uncapped · Browse/History 1440 · Account 1280 → no shared system.

## PageContainer API

```jsx
<PageContainer size="app|wide|narrow" padding="none|sm|default|lg" as="div|section|main" className style>
```
- **size → max-width** from `LAYOUT`: `app=1280` · `wide=1440` · `narrow=1080`. Centered (`margin:auto`,
  `width:100%`). No arbitrary widths.
- **padding → responsive gutters** (CSS classes, media-query'd): `none` (0) · `sm` (16→32) ·
  `default` (20→32→88, matches the existing `px-5→sm:px-8→lg:px-[88px]`) · `lg`.
- **No** background, decoration, animation, or route-specific magic. Owns layout only.

## Type-scale tokens (additive, **not broadly applied in F12B**)

`TYPE = { pageTitle, sectionTitle, cardTitle, body }` (size/weight/spacing/lineHeight). Added + pinned
by tests; **visible application is deferred** (a broad heading normalization is a redesign risk — F12B
ships the *scale*, not a sweep). Excludes the heroes (landing/discover/movie titles, `.ff-d1/.ff-d2`).

## H1 insertion plan — **sr-only, documented**

Each route gets a route-level `<h1 className="sr-only">` at the top of its main content:
- Home → "Tonight" · Browse → "Browse films" · History → "Your diary" · Account → "Account settings".

**Why sr-only (the documented reason):** each route's visual masthead is *intentional* — the Briefing
hero (Home), the filter toolbar (Browse), the "Diary" eyebrow + stats (History), the **editable
identity** name (Account, an `<input>`/`<button>` — cannot be a heading). A second *visible* page-title
would duplicate/clutter the composition or change the intended hierarchy. sr-only delivers the actual
F12A finding — **the missing landmark + heading order (h1→h2)** — at **zero visual risk / no layout
shift**. A visible-title design pass, if wanted, is a deliberate later phase.

## PageContainer adoption — **byte-identical proof, 2 routes**

- **Account:** replace `<div style={{maxWidth:1280, margin:'0 auto'}}>` → `<PageContainer size="app"
  padding="none">` (`app=1280`) — **byte-identical** (same max-width + centering).
- **History:** replace `<div style={{maxWidth:1440, margin:'0 auto'}}>` → `<PageContainer size="wide"
  padding="none">` (`wide=1440`) — **byte-identical**.
- **Browse + Home:** h1 only this phase (Browse's grid + Home's uncapped shell need a width *decision*,
  not just tokenizing — deferred). **No mass conversion.**

> F12B **tokenizes** the existing widths via the primitive; it does **not** normalize Account-vs-History
> to one width (that's a visual-review decision for F12B.x). Foundation first.

## Expected visual impact

**None.** sr-only h1s are invisible; the two adoptions are byte-identical max-width swaps; TYPE tokens
aren't visibly applied. Verified by authenticated screenshots at 390/768/1280/1440.

## Rollback plan

Revert the PR. PageContainer + tokens are additive; h1s + adoptions are 1:1 reversible.

## Validation plan

`lint → test → build → audit` + PageContainer/token tests + the 4 routes' existing tests + an
**authenticated Playwright check** (390/768/1280/1440 on home/browse/history/account: no overflow, h1
present + sr-only, no layout shift, console clean) + `npm run test:e2e`. `/` and `/about` untouched →
CI Visual Regression covers public baselines.
