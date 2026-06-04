# F12A — Route-by-Route Premium Visual Audit

> **Phase F12A audit (no implementation).** Evidence keys: **B** = browser-observed screenshot,
> **M** = computed metric, **C** = code-grounded. Engine frozen `2.17`. Screenshots in `/tmp/ff-f12a/`.

**Date:** 2026-06-04. **Captured:** 13 routes × 6 breakpoints (390/430/768/1024/1280/1440).
**Global positives (M, all routes):** ✅ **zero horizontal overflow** at every breakpoint · ✅
**console clean** everywhere · ✅ **all images carry `alt`** (0 missing).

---

## Scoreboard (premium feel, 1–5)

| Route | 390 | 768 | 1280 | 1440 | Headline issue |
|---|---|---|---|---|---|
| `/` landing | 4 | 4 | 5 | 4 | wide-screen max-width; tiny tap targets |
| `/about` | 3 | 3 | 4 | 4 | type scale; uses shared `<Button>` (baseline) |
| `/privacy` `/terms` | 3 | 3 | 3 | 3 | legal density; small h1 (36→48) |
| `/home` | 3 | 3 | 4 | 4 | **no h1**; skeleton dominates mobile fold |
| `/movie/:id` | 4 | 4 | 5 | 5 | rich + coherent; mobile tap targets |
| `/profile` | 4 | 4 | 5 | 5 | strong; long-page rhythm |
| `/discover` | 5 | 5 | 5 | 5 | **premium exemplar** — protect it |
| `/browse` | 2 | 3 | 4 | 4 | **no h1**; **74 sub-44px targets @390** |
| `/watchlist` | 3 | 3 | 4 | 4 | dense list; tap targets |
| `/history` | 2 | 3 | 4 | 4 | **no h1**; **76 sub-44px targets @390** |
| `/account` | 3 | 3 | 4 | 4 | **no h1**; mobile density |
| `/onboarding` | n/a | n/a | n/a | n/a | redirects to /home (onboarded user) — not observed |

---

## Public

### `/` landing — **B (390,1280) · M ×6**
- **Premium:** cinematic editorial hero, italic-accent headline (56→89.6px clamp, M), starfield, the
  PICKS / Ritual / Briefing / Pricing sections; visual-regression-locked.
- **MVP/risk:** no shell max-width → on **1440** the content can drift wide (M: `mainMaxW:none`).
  `btnHmin@390 = 6px` (M) — a near-zero-height interactive element (likely a thin footer/inline link)
  and **7 sub-44px targets** (M). **Sev P2** (max-width), **P2** (targets). Fix in F12C; **do not break
  the `/` visual baseline** — re-baseline deliberately. Risk: med (baseline route).

### `/about` — **B(1280) · M ×6**
- **Premium:** clean editorial legal-adjacent page; one h1 (40→68px, M).
- **MVP/risk:** uses the shared `<Button>` (C) → **any button change re-baselines `/about`**. Type
  scale is mid-tier (not hero, not body) and a touch large. **Sev P3.** Defer to F12D (button) /
  the type pass; deliberate re-baseline. Risk: med.

### `/privacy` · `/terms` — **M ×6**
- **Solid, plain.** h1 small (36→48px, M) — reads more "doc" than "premium product." 9–10 sub-44px
  targets @390 (M) = inline legal links (acceptable for legal, but spacing could improve). **Sev P3**,
  defer. Risk: low.

---

## Core authenticated

### `/home` — **B(390,1280) · M ×6**
- **Premium:** mood pills, the Briefing hero, the "Tonight has more than one glow" Discover panel; the
  populated state (seen earlier this session: Chungking Express) is cinematic.
- **MVP/risk:**
  - 🔴 **No `<h1>`** (M: `h1count:0`) — the masthead is styled text, not a semantic heading. **Sev P1**
    (a11y + landmark). Fix F12B (visually-fitting or visually-hidden h1). Risk: low.
  - ⚠️ **Skeleton dominates the mobile fold** (B: `home-390` shows a large empty skeleton block; the
    pick often isn't loaded in-window). On a slow first paint the page reads empty/MVP. **Sev P2.**
    F12C (a denser/branded skeleton or above-the-fold reassurance). Risk: low.
  - ⚠️ no shell max-width; `interCount` 15→60 across bp (M) — many controls; check tap sizes. **P2.**

### `/movie/:id` — **B(1280) · M ×6**
- **Premium:** hero → PrimaryCaseCard (now `<AccentPanel gradient>`) → ViewerNotes → recs → cast →
  "how it traveled" → receipts. Rich, coherent, on-doctrine. 1 h1 (39→92px, M — the title scales well).
- **MVP/risk:** **11 sub-44px targets @390** (M) — action buttons / chips / inline links on mobile.
  Long page (10169px @390, M) — rhythm is fine but verify section spacing on mobile. **Sev P2**, F12C.
  Risk: low. **Do not touch ViewerNotes / overlay / movie-data.**

### `/profile` — **B(1280) · M ×6**
- **Premium:** masthead + DnaConfidence (honest 45%) + mood/voices/charts/"4 films"/skew/twins. Strong.
  1 h1 (50.7→96px, M). 7 sub-44px @390 (M) — relatively clean.
- **MVP/risk:** very long (8340px @390, M); standard-section padding mildly inconsistent (40 vs 56, from
  F11B.3). **Sev P3**, defer. Risk: low. **Do not migrate DnaConfidence.**

---

## Utility

### `/discover` — **B(1280) · M ×6** — ⭐ **PREMIUM EXEMPLAR**
- Calm starfield, centered "It's Thursday afternoon. / How do *you* feel?" (102px italic-accent hero,
  M — intentional, not a defect), one-line sub, **clean two-button hierarchy** (gradient `Begin →` +
  ghost `or, surprise me`). Only 2 sub-44px targets @390 (M — the best). **This is the bar.** Score 5.
  **Action: protect it; mine its patterns (CTA hierarchy, calm spacing) for the rest of the app.**

### `/browse` — **B(1280) · M ×6**
- **Premium (desktop):** clean 5-col poster grid (B: `browse-1280`) with filter chips + search +
  pagination — Letterboxd-grade catalog.
- **MVP/risk:**
  - 🔴 **No `<h1>`** (M) — the filter bar replaces a heading. **Sev P1.** F12B.
  - 🔴 **74 sub-44px tap targets @390** (M) — the **biggest mobile target problem**: filter chips +
    poster cards + pagination dots render small. **Sev P1 (mobile a11y).** F12C.
  - Card proportions on mobile need a rhythm pass. **P2**, F12E.

### `/watchlist` — **B(390) · M ×6**
- **Premium:** "The *queue*." editorial title (1 h1, M), filter/sort, 2-col movie cards, honest
  "waiting over 60 days" nudge (B: `watchlist-390`). Coherent.
- **MVP/risk:** dense on mobile; **11 sub-44px @390** (M) = filter tabs + card actions. **Sev P2**, F12C.
  Card rhythm → F12E. Risk: low.

### `/history` — **M ×6**
- **MVP/risk:** 🔴 **No `<h1>`** (M). 🔴 **76 sub-44px targets @390** + **125 interactive elements** (M)
  — the densest route; the diary list packs many small controls. **Sev P1 (mobile a11y + density).**
  F12C. Risk: low (not browser-observed at 390 in detail — **M-grounded**, flag for F12C visual pass).

### `/account` — **B(390) · M ×6**
- **Premium:** honest section headers ("What we ping you about", "The bridge you can burn"), pink
  toggles, connected-accounts list (B: `account-390`). Organized.
- **MVP/risk:** 🔴 **No `<h1>`** (M). **20 sub-44px @390** (M) = toggles + connect buttons + nav pills.
  Mobile **density** (many stacked sections). **Sev P1** (h1) / **P2** (targets/density). F12B (h1) + F12C.

### `/onboarding` — **M (redirect only)**
- Redirects to `/home` for the onboarded dev user (M: `finalUrl:/home`). **The real genres → movies →
  ratings → mood steps were NOT observed.** **Action: a fresh-user onboarding pass is its own task**
  (needs a throwaway account); flagged, not scored.

---

## Cross-route themes (→ component audit + backlog)

1. **No shell container system** (M: `mainMaxW:none`, gutters per-section) → wide-screen + cross-route
   inconsistency. **P1/P2.**
2. **Missing `<h1>` on 4 core routes** (home, browse, history, account). **P1 a11y.**
3. **Mobile sub-44px tap targets everywhere, severe on browse/history/account.** **P1 mobile a11y.**
4. **Type scale not normalized** (h1 36→102px, no shared mid-tier scale). **P2.**
5. **Small min button heights (17px; 6px outliers).** **P2 (button system).**
6. **Discover is the premium north-star** — replicate its restraint elsewhere.
