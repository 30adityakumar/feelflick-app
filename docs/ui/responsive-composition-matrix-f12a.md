# F12A — Responsive Composition Matrix

> **Phase F12A audit (no implementation).** How each route composes across the 6 breakpoints. Cells:
> ✅ good · ⚠️ needs work · 🔴 problem · — n/a. Premium = 1–5. Grounded in computed metrics (M) +
> screenshots (B). Engine frozen `2.17`.

**Date:** 2026-06-04. **Global:** overflow ✅ (0px every route × bp) · console ✅ clean · alt ✅ 100%.

---

## A. Premium-feel score per route × breakpoint

| Route | 390 | 430 | 768 | 1024 | 1280 | 1440 |
|---|---|---|---|---|---|---|
| `/` | 4 | 4 | 4 | 5 | 5 | 4 |
| `/about` | 3 | 3 | 3 | 4 | 4 | 4 |
| `/privacy` | 3 | 3 | 3 | 3 | 3 | 3 |
| `/terms` | 3 | 3 | 3 | 3 | 3 | 3 |
| `/home` | 3 | 3 | 3 | 4 | 4 | 4 |
| `/movie/:id` | 4 | 4 | 4 | 5 | 5 | 5 |
| `/profile` | 4 | 4 | 4 | 5 | 5 | 5 |
| `/discover` | **5** | **5** | **5** | **5** | **5** | **5** |
| `/browse` | **2** | 2 | 3 | 4 | 4 | 4 |
| `/watchlist` | 3 | 3 | 3 | 4 | 4 | 4 |
| `/history` | **2** | 2 | 3 | 4 | 4 | 4 |
| `/account` | 3 | 3 | 3 | 4 | 4 | 4 |

**Pattern:** scores **dip at 390–768 (mobile/tablet)** and **peak at 1024–1280**, then **soften at 1440**
(no shell max-width). The premium gap is **mobile-first** + **wide-screen containment**.

## B. Dimension × breakpoint (worst-case across routes)

| Dimension | 390 | 430 | 768 | 1024 | 1280 | 1440 | Notes |
|---|---|---|---|---|---|---|---|
| Content fit | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | no shell max-width → wide drift @1440 (M) |
| Typography | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | mid-tier h1 36–102px, no scale (M) |
| CTA hierarchy | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | discover ✅; elsewhere 2ndary/ghost vary |
| Card rhythm | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | poster vs trust vs list proportions differ |
| Spacing | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | per-section gutters, no container system |
| Overflow | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **0px everywhere (M) — strong** |
| Touch comfort | 🔴 | 🔴 | ⚠️ | ✅ | ✅ | ✅ | **sub-44px targets: browse 74, history 76, account 20 @390 (M)** |
| Premium feel | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ⚠️ | dips mobile + 1440 |

## C. Component × breakpoint (touch + fit)

| Component | 390 | 430 | 768 | 1280 | 1440 | Worst signal |
|---|---|---|---|---|---|---|
| Buttons | 🔴 | 🔴 | ⚠️ | ✅ | ✅ | btnHmin 17px (6px on `/`, onboarding) (M) |
| Filter chips (browse) | 🔴 | 🔴 | ⚠️ | ✅ | ✅ | part of 74 tiny targets @390 (M) |
| Poster cards | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | below-card actions < 44px mobile (M) |
| Mood pills (home) | ✅ | ✅ | ✅ | ✅ | ✅ | scrollable, OK (B) |
| BottomNav (mobile) | ⚠️ | ⚠️ | — | — | — | verify item hit-area ≥ 44px (B/M) |
| Trust panels | ✅ | ✅ | ✅ | ✅ | ✅ | AccentPanel — best in class |
| Page container | ⚠️ | ⚠️ | ⚠️ | ⚠️ | 🔴 | no max-width, per-section gutters (M) |
| Type scale | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | no shared mid-tier scale (M) |
| Loading (home) | 🔴 | ⚠️ | ✅ | ✅ | ✅ | skeleton dominates mobile fold (B) |
| History list | 🔴 | 🔴 | ⚠️ | ✅ | ✅ | 76 tiny targets + 125 controls @390 (M) |

## D. Reading

- **Strong everywhere:** overflow control (0px), console hygiene, alt coverage, trust panels, the
  discover hero. These are genuinely premium — **protect them**.
- **Weak mobile (390–768):** touch targets, button size, type scale, loading fold. → **F12C mobile-first**.
- **Weak wide (1440):** no container max-width. → **F12B container system**.
- **The cheapest premium win:** a **container system + type scale + 44px touch floor** lifts the whole
  mobile + wide column without any redesign.
