# F12A — Component / System Audit

> **Phase F12A audit (no implementation).** Per component: issue · ideal FeelFlick pattern · where ·
> consistency (1–5) · a11y risk · mobile risk · proposed primitive/token fix. Evidence: **B**rowser /
> **M**etric / **C**ode. Engine frozen `2.17`.

**Date:** 2026-06-04.

---

| # | Component | Consistency | a11y risk | mobile risk |
|---|---|---|---|---|
| 1 | Buttons / CTAs | 3 | med | **high** |
| 2 | Page containers | **2** | low | med |
| 3 | Cards (Card/AccentPanel) | 4 | low | low |
| 4 | Movie posters / MovieCard | 4 | low | med |
| 5 | Chips / badges | 3 | low | **high** |
| 6 | Section headers | 4 | low | low |
| 7 | Top nav / BottomNav | 4 | med | med |
| 8 | Forms / inputs | 3 | **med** | med |
| 9 | Empty states | 4 | low | low |
| 10 | Loading skeletons | 3 | low | med |
| 11 | Modals / dialogs | 4 | low | low |
| 12 | Trust panels | **5** | low | low |
| 13 | Profile / DNA panels | 4 | low | med |
| 14 | Typography scale | **2** | med | med |

---

### 1. Buttons / CTAs — consistency 3 · mobile risk **high**
- **Issue (M/C):** smallest interactive height **17px** on most routes (`btnHmin@390`), with 6–8px
  outliers on `/` and onboarding — well under the 44px touch floor. The primary gradient pill is great
  (discover/home); but **secondary/ghost/icon treatments vary** and sizes aren't on a touch-comfortable
  scale. This is the user's "button selection not polished" concern, confirmed.
- **Ideal:** the shared `<Button>` is the single source — `size="sm|md|lg"` with **min-heights ≥ 40/44/48**,
  one primary per view, ghost/secondary clearly subordinate (discover's `Begin →` + `or, surprise me`
  is the model).
- **Where:** every route. **a11y:** focus ring exists (good); size is the gap.
- **Fix:** **F12D** — Button size/min-height tokens + an audit of secondary usage. ⚠️ `/about` +
  `/` use `<Button>` → **deliberate re-baseline required**; keep out of F12B.

### 2. Page containers — consistency **2** · the biggest structural gap
- **Issue (M):** `<main>` has **no max-width** on any route; horizontal gutters are re-implemented
  per-section (88px desktop inline, `px-5→sm:px-8→lg:px-[88px]` on home). App `<main>` carries only a
  65px top offset. Section max-widths vary (880 / 1080 / 1280). → wide-screen (1440) drift + "content
  doesn't sit well / cards feel inconsistent across devices."
- **Ideal:** **one `<PageContainer>`** (or container tokens) — a shared max-width + responsive gutter
  scale (e.g. `gutter 20→32→88`, `maxW` per surface-type) every route composes.
- **Fix:** **F12B** — additive `<PageContainer>` primitive; proof-migrate ONE route. Low risk.

### 3. Cards — `<Card>` / `<AccentPanel>` — consistency 4
- **Good:** F11B.1–B.5 gave flat `<Card>` + `<AccentPanel>` tint/gradient; RADIUS/SHADOW/SURFACE tokens.
- **Issue:** adoption is partial — many surfaces still inline their tint/radius; **card *proportions***
  (aspect, padding) vary between trust panels, list cards, and poster cards.
- **Fix:** **F12E** — continue migration + a card-padding rhythm token. Low risk.

### 4. Movie posters / MovieCard — consistency 4 · mobile risk med
- **Good:** the hover LAW (pure poster `scale(1.04)`), clean grids (browse 5-col, B).
- **Issue (M):** on mobile, poster cards + their below-card actions fall under 44px (contributes to
  browse 74 / history 76 tiny targets). Poster proportions differ across browse vs carousels vs
  watchlist cards.
- **Fix:** **F12E** — poster/card proportion + mobile tap-area pass. **Do not touch the hover LAW.**

### 5. Chips / badges — consistency 3 · mobile risk **high**
- **Issue (M):** filter chips (browse), mood pills (home), PrimaryCaseCard chips, match badges — several
  render < 44px tall on mobile and use slightly different padding/radius (RADIUS.pill is consistent;
  height isn't).
- **Fix:** **F12C/F12E** — a chip size token with a 44px mobile tap floor (visual size can stay small via
  padding-only hit-area expansion).

### 6. Section headers — consistency 4
- **Good:** canonical `<SectionHeader>` + `<Eyebrow>` (the 22px purple rule + Outfit caps). Used widely.
- **Issue:** some surfaces still hand-roll eyebrows (the parked `stash@{0}` Eyebrow rollout). Minor.
- **Fix:** finish Eyebrow adoption (low priority, **defer**).

### 7. Top nav / BottomNav — consistency 4 · a11y med
- **Good (B):** desktop top nav (FeelFlick · Tonight/Discover/DNA) is clean; mobile **BottomNav**
  (Browse/Discover/**Tonight**/DNA/Account, Tonight centered+highlighted) is a strong mobile pattern.
- **Issue (M):** nav items contribute sub-44px targets on some routes; the 65px fixed-header offset is
  consistent (good). Verify BottomNav item hit-areas ≥ 44px.
- **Fix:** **F12C** — nav tap-target floor. Low risk.

### 8. Forms / inputs — consistency 3 · a11y **med**
- **Issue (C):** `<Input>`/`<Select>`/`<Textarea>` are label-less primitives → callers must supply
  `aria-label`/`<label>` (a11y-audit rule). Account toggles + search + onboarding inputs need a label
  audit. Input heights likely < 44px on mobile.
- **Fix:** **F12C/F12D** — input min-height + a label audit. Med a11y value.

### 9. Empty states — consistency 4
- **Good:** canonical `<EmptyState>`; sections `return null` when empty (the rule). Honest.
- **Fix:** verify each reachable empty state visually (not all observed) — **F12C minor**.

### 10. Loading skeletons — consistency 3 · mobile risk med
- **Issue (B):** `home-390` shows the Briefing **skeleton dominating the mobile fold** — a large empty
  block; reads MVP on slow first paint. Skeletons are correct (no spinners) but the *mobile fold
  composition* during load is weak.
- **Fix:** **F12C** — a denser/branded above-the-fold skeleton or a reassurance line. Low risk.

### 11. Modals / dialogs — consistency 4
- **Good:** shared `<Modal>` (focus trap, Escape, backdrop). Reuse it. **No change** — keep.

### 12. Trust panels — consistency **5** ⭐
- **WhyThisPick / PrimaryCaseCard now ride `<AccentPanel>`** (tint/gradient), byte-identical, honest.
  **This is the most polished system in the app. Protect it; do not regress.** DnaConfidence stays a
  structural section (leave it).

### 13. Profile / DNA panels — consistency 4 · mobile risk med
- **Good (B):** masthead, DnaConfidence, charts read cinematic. **Issue:** very long page; chart/legend
  controls may be small on mobile; F11B.3's 40-vs-56 section padding. **Fix:** **F12C/defer.**

### 14. Typography scale — consistency **2**
- **Issue (M):** h1 ranges **36px → 102px** with no shared scale; mid-tier headings (privacy 36, about
  40, movie/profile vary) feel ad-hoc → "some content too big, some too small." Heroes (discover 102,
  landing 90) are *intentional* and should be excluded from normalization.
- **Fix:** **F12B** — a shared display/heading **type-scale token** + normalize the **mid-tier** (non-hero)
  headings. Additive tokens, low risk; re-baseline any visual route deliberately.

---

## Summary — where the premium gap actually is

The **primitives are good** (Card, AccentPanel, SectionHeader, Modal, hover LAW, trust panels = best in
class). The gap is **system-level composition**: **(a) no container/max-width system**, **(b) no
normalized type scale**, **(c) sub-44px mobile touch targets**, **(d) button size scale**, **(e) missing
`<h1>`s**. Fix those five and the app moves from "good app" to "premium" without a redesign.
