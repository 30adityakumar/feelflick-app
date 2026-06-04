# F11A — UI Inventory (current state, code-grounded)

> **Phase F11A. A factual inventory of FeelFlick's current UI system** — tokens, primitives,
> patterns — read from the source (`src/shared/lib/tokens.js`, `src/shared/ui/*`, `src/index.css`,
> the per-feature CSS) + live computed styles from the landing. **No code change.** This is the
> baseline the [consistency audit](ui-consistency-audit-f11a.md) measures drift against.

**Status:** ✅ inventoried. **Date:** 2026-06-04. **Stack:** React 19 · Tailwind 4 (CSS-first,
`@import 'tailwindcss'`) · inline-style feature surfaces + per-feature CSS · Outfit/Inter.

---

## 1. Tokens — color

Canonical source: [`src/shared/lib/tokens.js`](../../src/shared/lib/tokens.js) (`HP` core, `HP_GRAD`,
`C` landing) + CSS vars in [`src/index.css`](../../src/index.css) `:root`.

**Brand (the only identity/gradient hues):** `purple #A78BFA` · `purpleDeep #7C3AED` · `pink #EC4899` · `HP_GRAD = linear-gradient(135deg, #9333ea, #ec4899)`.
**Semantic accents (not brand):** `amber #F59E0B` (stars / "stale") · `red #EF4444` (destructive) · `green #34D399` (success / watched).
**Surfaces/text (HP):** `bg #000` · `bgDeep #06060a` · `panel rgba(255,255,255,.04)` · `border .08` · `borderStrong .14` · `text #FAFAFA` · `textSoft .72` · `textMuted .45` · `textFaint .40` (AA-large floor).
**CSS vars (`:root`):** full `--purple-50…900` / `--pink-50…900` scales · `--brand-gradient` (+ `--gradient-primary` back-compat alias) · `--bg-base #06060a` · `--bg-elevated #0d0b14` · `--font-display` (Outfit) · `--font-body` (Inter).
**Landing `C`:** same hexes, different names (`bgPure`=bg, `textMid`=textSoft, `hairline`=border) + landing tints `bgLight #0d0b14`, `bgPaper #0f0c18`, `textHi .92`, `textLow .55`.

## 2. Tokens — typography

- **Faces:** Outfit (display/eyebrows/numbers/buttons) + Inter (body/italic blurbs). Single Google Fonts link (Inter 300–900, Outfit 200–700). System mono stack for keycaps.
- **Hero (live-measured @1350px):** Outfit, **94.5px**, weight **200**, letter-spacing **−0.055em**, line-height **0.92**, `#FAFAFA`. (Landing `.ff-d1`: Outfit 200, ls −0.055em, lh 0.92; `.ff-d2`: Outfit 200, ls −0.045em, lh 0.96; both tighten at the mobile breakpoint.)
- **Feature hero (inline):** Outfit 200–300, 56–104px, ls −0.04…−0.05em, `textWrap: balance`.
- **Eyebrow/kicker:** two implementations — shared `Eyebrow` (Outfit **700**, 11px, 0.28em, `HP.purple`, optional 22px rule) vs landing `.ff-eyebrow` (Outfit **600**, 11px, 0.28em, white **.42**). *(divergence — see audit.)*
- **Body:** Inter, `textWrap: pretty`, line-height ~1.5–1.65 for prose.

## 3. Tokens — spacing / radius / elevation

- **Spacing:** no single numeric scale token; feature surfaces use inline px (section rhythm `56–72px 88px` desktop, 32px landing) + Tailwind utilities elsewhere. Editorial grid: page max 1440px (feature) / 1280px (landing); content 1080px; desktop padding 88px (feature) / 32px (landing).
- **Radius (no scale — ad-hoc):** inline `borderRadius` spans **3, 4, 5, 6, 8, 10, 14, 999** (counts: 999≈178×, 6≈82×, 8≈48×, 4≈26×, 3≈18×, 10≈17×, 14≈10×). Primitives: `Button` `rounded-full`, `EmptyState` icon `rounded-2xl` (16px), modal/cards vary. *(biggest token gap — see audit.)*
- **Elevation:** shadows are **inline / ad-hoc** (e.g. CTA `0 12px 28px -8px rgba(236,72,153,.5)`); no shadow scale; feature CSS files carry essentially no `box-shadow`. Borders do most of the elevation work (`HP.border` hairlines).

## 4. Shared primitives (`src/shared/ui/`)

| Primitive | Shape/notes |
|---|---|
| **Button** | Tailwind; 5 variants (primary gradient pill · secondary · ghost · icon · destructive), 3 sizes (sm/md/lg), `rounded-full`, focus-visible ring `ring-purple-400/50`, in-button spinner, disabled. |
| **Modal** | backdrop + Escape + click-outside + focus management; sizes sm/md/lg. |
| **Input / Textarea / Select** | pure styling primitives (no built-in label). |
| **Checkbox** | toggle switch. |
| **EmptyState** | centered; `rounded-2xl` icon tile (`white/5` + `white/10` border), bold title, `white/60` description, optional `<Button>` action. |
| **Eyebrow** | canonical kicker (Outfit 700, tone `section`/`meta`, optional 22px rule). Consolidated from ~210× hand-rolled. |
| **SectionHeader** | carousel-row header (3px gradient bar + bold title + gradient hairline rule). |
| **Tooltip** | hover/focus tooltip. |
| **BrandSplash** | full-screen splash (200ms delayed; errors immediate). |

> Domain widgets live in `src/shared/components/` (StarRating, FollowButton, Pagination, MatchBadge,
> ActionButton/ChipButton, MoodPill, sentiment/watchlist prompts — several have their own CSS).

## 5. Component-pattern inventory

- **Buttons:** the shared pill `Button` (Tailwind) **+** many **inline-style action buttons** in feature surfaces (`borderRadius: 6–8`, inline `HP_GRAD`, Outfit/Inter) — two button languages coexist.
- **Cards:** mostly inline-styled panels (`HP.panel`/`HP.border`, radius 8–14, gradient tints e.g. PrimaryCaseCard `linear-gradient(160deg, purple0f, transparent)`); no single `<Card>` primitive.
- **Page headers:** per-surface (editorial masthead with Eyebrow + Outfit display) — pattern is consistent in spirit, hand-built per route.
- **Nav:** global `Header` + `BottomNav` (mobile) + `SearchBar` (`src/app/header/`); nav centers the **Briefing ("Tonight")**.
- **Empty states:** canonical `EmptyState` **+** some per-surface inline empties (e.g. watchlist/history "Perfect for tonight" / diary states).
- **Forms/inputs:** `Input`/`Textarea`/`Select`/`Checkbox` primitives; onboarding steps + account use them (+ some inline fields).
- **Modals:** canonical `Modal` (lists Create/AddToList, etc.).
- **Poster / movie cards:** the **MovieCard hover LAW** (`components/carousel/` — `Card`/`Row`/`MovieCard` + `useMovieCardHover`): fixed slot, pure poster `scale(1.04)` (220ms cubic-bezier(0.22,1,0.36,1)), border/shadow ramp, static below-card title. No portal/overlay.
- **Loading/skeleton:** `animate-pulse` skeletons (route `RouteSkeleton`, `BrandSplash` for auth); in-button micro-spinner the documented exception. No page spinners.
- **Badges/chips:** `MatchBadge`, mood/genre chips (mostly `borderRadius: 999` pills, `white/5` + `HP.border`), `ChipButton`.
- **Callouts:** `WhyThisPick` (accent-tinted), PrimaryCaseCard, ViewerNotes (honesty disclaimer), DnaConfidence — all inline-styled, accent-tinted panels.
- **Section headers (carousel):** `SectionHeader` primitive (3px gradient bar + title + hairline).
- **Section kickers (editorial):** `Eyebrow` (purple rule kicker).

## 6. Motion

- **Library:** Framer Motion 12 + CSS transitions + `src/styles/animations.css`.
- **`prefers-reduced-motion`:** handled in ~10 files (AppShell, Home, landing + Hero, About, Discover, Onboarding, Browse, animations.css). **Not** found in movie / profile / watchlist / history / account — coverage gaps (see audit).
- **Signature motions:** landing `Reveal` (IntersectionObserver, threshold 0.15) + `Stars` starfield; MovieCard poster scale; weighted easing `cubic-bezier(0.22,1,0.36,1)`.

## 7. Mobile patterns

- Responsive inline styles + `clamp()` type; landing `.ff-d1/.ff-d2` tighten letter-spacing at the breakpoint; per-feature CSS media queries; mobile **BottomNav**. Touch-target sizing + per-route mobile spacing are **not centrally enforced** (per-surface).

## 8. Token-drift quick map (feeds the audit)

| Area | State |
|---|---|
| `HP` core | ✅ consolidated in `tokens.js`; `browse/data.js` + `Discover.jsx` spread `baseHP` (CLAUDE.md's "browse holdout" note is **stale**). |
| `Discover` `purpleDeep` | ⚠️ overridden to `#9333ea` (vs HP `#7C3AED`). |
| `C` landing palette | ◻ separate (same hexes) — fold-in deferred (visual-regression-tested landing). |
| Radius | ⚠️ no scale; 8 ad-hoc values. |
| Elevation | ⚠️ inline shadows; no scale. |
| Button | ⚠️ two languages (pill primitive vs inline rounded-rect). |
| Eyebrow | ⚠️ shared (700/purple) vs landing `.ff-eyebrow` (600/white .42). |
| reduced-motion | ⚠️ partial coverage. |

Everything above is **current state, no judgement** — judgement + severities live in the
[consistency audit](ui-consistency-audit-f11a.md).
