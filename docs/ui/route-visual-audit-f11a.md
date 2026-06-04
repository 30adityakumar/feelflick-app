# F11A — Route-by-Route Visual Audit

> **Phase F11A. Per-route visual audit — observation + opportunities, NO fixes.** Landing is
> **live-observed**; authenticated routes are **code-grounded** (real components; not live-walked
> under a session — a live authenticated pass is an F11B / Wave-1 follow-up). Measured against the
> [doctrine](../product-doctrine.md) + [visual direction](feelflick-visual-direction-f11a.md).
> **No code change. F8C stays blocked.**

**Status:** ✅ audited. **Date:** 2026-06-04. Legend per route: **Preserve** = don't touch ·
**Simplify** = candidate to calm · **F11B** = queued change.

---

## 1. Landing (`/`) — *live-observed*
- **First impression:** strong — "Films that know you." (Outfit 200, 94.5px) + "You spent 23 minutes picking. You watched thirty." nails the wedge in 10s.
- **Hierarchy:** clear, type-led, cinematic dark. Sections read as an editorial argument (problem → ritual → case → DNA → community → pricing).
- **Doctrine:** ✅ exemplary — anti-scroll framing, honesty ("ILLUSTRATIVE", "an example issue"), one gradient.
- **Mobile risk:** low (clamp type, breakpoint ls tightening) — verify long-section rhythm on small screens.
- **Trust risk:** low. **Preserve:** the whole editorial system, the honest framing, `Reveal`/`Stars`.
- **Simplify:** nothing major. **F11B:** reconcile `.ff-eyebrow` (600/white) with the shared Eyebrow as *one documented system* (re-baseline visual-regression deliberately).

## 2. Auth / Onboarding (`/onboarding`) — *code-grounded*
- **First impression:** 4 steps (genres → mood → movies → rating) — a taste quiz. Landing promises "three short questions" → **expectation mismatch** (F10D D-7).
- **Hierarchy:** step-based; `BrandSplash` for auth transitions.
- **Doctrine:** ✅ value-before-commitment *intent*; ⚠️ heavier than promised for impatient users.
- **Mobile risk:** medium — multi-step forms + search ("Search any film…") need touch-target + spacing checks.
- **Trust risk:** low (honest). **Preserve:** the "why we ask" framing, BrandSplash.
- **Simplify:** consider whether 4 steps reads as "three"; tighten step rhythm. **F11B:** align copy/flow (D-7, after Wave-1 funnel data — F10D W4); mobile spacing pass (F11B.5).

## 3. Home / Tonight (`/home`) — *code-grounded*
- **First impression:** the Briefing (single pick + "M." note + `WhyThisPick`) — the product's heart.
- **Hierarchy:** Briefing primary (`sections-top`); a **supporting tail of carousels** below (`sections-bottom`: "Pick up where you paused.", "What your twins are watching.", "Your taste, taking shape.").
- **Doctrine:** ✅ single pick leads; ⚠️ **the tail is the anti-scroll risk** (F10D D-3) — must stay visibly secondary.
- **Mobile risk:** medium — Briefing + carousels stacking; reduced-motion **gap** here? (Home *does* handle it — ok).
- **Trust risk:** ⚠️ cold-start shows **no "Why this pick"** (null-safe) — honest but can read unjustified (F10D W1).
- **Preserve:** the Briefing's primacy, WhyThisPick null-safety, MovieCard hover LAW. **Simplify:** keep the tail quiet (don't enrich it). **F11B:** verify Briefing-primacy live (B-tail guard); cold-state "why" microcopy *only after Wave-1* (D-6).

## 4. Movie / Film File (`/movie/:id`) — *code-grounded*
- **First impression:** **PrimaryCaseCard** leads ("FeelFlick's read" + honest match gloss "how it fits your taste so far") — the moat, up top.
- **Hierarchy:** case → details → **ViewerNotes** ("not real reviews or quotes from real critics") → cast etc. Strong, honest.
- **Doctrine:** ✅✅ makes-its-case + honesty are exemplary here.
- **Mobile risk:** medium — `48px 88px` section padding is desktop-tuned; long page; **reduced-motion gap** (movie not in the handled list).
- **Trust risk:** low (the honesty layer is the win). **Preserve:** PrimaryCaseCard, ViewerNotes disclaimer, match gloss. **Simplify:** the inline section padding (88px) → a shared rhythm token. **F11B:** add reduced-motion (B-A1); card-language primitive (B6); mobile padding (F11B.5).

## 5. Profile / Cinematic DNA (`/profile`) — *code-grounded*
- **First impression:** `DnaConfidence` ("taste evidence… not a score of you"; tiers "Still learning / Getting sharper / Reading you well"; "Built from N logged · N rated · N mood signals").
- **Hierarchy:** big honest number + bar + evidence + the "this is what FeelFlick weighs" line.
- **Doctrine:** ✅✅ honest, no fake confidence (F7 win).
- **Mobile risk:** medium — `1fr 1.3fr` grid + 88px padding; **reduced-motion gap**.
- **Trust risk:** low; ⚠️ under-represents users with deep external history until they re-log (F10D D-2).
- **Preserve:** DnaConfidence honesty, the evidence line. **Simplify:** grid→stack rhythm on mobile. **F11B:** reduced-motion (A1); mobile (F11B.5).

## 6. Discover (`/discover`) — *code-grounded*
- **First impression:** "The Discover Edition" — mood input → "pick between three" (a *small* complementary set), "Tonight's film, for your constellation".
- **Hierarchy:** mood canvas + a small set; **must stay complementary** to the Briefing, not a second recommender.
- **Doctrine:** ✅ small set (not a grid); ⚠️ token drift — Discover overrides `purpleDeep #9333ea` (B4); reduced-motion *is* handled here.
- **Mobile risk:** medium — mood canvas/starfield on small screens; **contrast risk** over the tint (A2).
- **Trust risk:** low. **Preserve:** the complementary small-set model, mood canvas. **Simplify:** the local token override. **F11B:** align `purpleDeep` (B4); axe contrast over tint (A2).

## 7. Browse (`/browse`, mood/tone/fit, collections) — *code-grounded*
- **First impression:** catalog access — intentionally **secondary** (utility tier).
- **Hierarchy:** editorial browse; must not compete with the Briefing for "what do I watch tonight."
- **Doctrine:** ✅ secondary by design; uses `browse/data.js` (spreads baseHP — ok).
- **Mobile risk:** medium (grids). **Trust risk:** low. **Preserve:** secondary positioning. **Simplify:** card/radius consistency (B1/B6). **F11B:** primitives pass (F11B.1/B3).

## 8. Watchlist / The Queue (`/watchlist`) — *code-grounded*
- **First impression:** the Queue + light stats ("Films per month", "Perfect for tonight", "Getting stale").
- **Hierarchy:** list + stats; utility tier.
- **Doctrine:** ✅ defer-a-pick utility; ⚠️ some **inline empty states** (not `EmptyState`) (B7); **reduced-motion gap**.
- **Mobile risk:** medium. **Trust risk:** low. **Preserve:** the "Perfect for tonight" surfacing. **Simplify:** route empties through `EmptyState`. **F11B:** empty/loading states (F11B.4); reduced-motion (A1).

## 9. History / The Diary (`/history`, `/watched`) — *code-grounded*
- **First impression:** the Diary + search ("Search the diary…").
- **Hierarchy:** log feeding the model; utility tier (**not** a Letterboxd home base — by doctrine).
- **Doctrine:** ✅ substrate, not front door; ⚠️ inline empties (B7); **reduced-motion gap**.
- **Mobile risk:** medium. **Trust risk:** low. **Preserve:** the substrate framing. **Simplify:** empties + radius. **F11B:** F11B.3/B4 + reduced-motion.

## 10. Account (`/account`) — *code-grounded*
- **First impression:** settings (`sections-top`/`sections-bottom` split). Recently changed (#168/#151 area).
- **Hierarchy:** standard settings; the **risk is drifting into a "generic SaaS dashboard"** look.
- **Doctrine:** ⚠️ keep cinematic-calm, not form-soup; **reduced-motion gap**.
- **Mobile risk:** medium (forms). **Trust risk:** low. **Preserve:** the eyebrow/editorial framing. **Simplify:** form rhythm; consistent inputs. **F11B:** primitives + spacing (F11B.1/B2); reduced-motion (A1).

## 11. Legal / About (`/about`, `/privacy`, `/terms`) — *code-grounded / partially live (F9C)*
- **First impression:** editorial ("Films That Know You", "Your privacy comes first", "Our rules of engagement").
- **Hierarchy:** clean prose. **Doctrine:** ✅ on-brand calm.
- **Mobile risk:** low. **Trust risk:** low (honest). **Preserve:** as-is. **Simplify:** none. **F11B:** none (leave alone).

## 12. Error states (ErrorBoundary, NotFound) — *code-grounded*
- **First impression:** `ErrorBoundary` (Sentry-wired) + live 404 `NotFound`.
- **Hierarchy:** functional. **Doctrine:** should feel cinematic-calm + honest, not a stark stack trace.
- **Mobile risk:** low. **Trust risk:** medium — an ugly/cold error breaks the premium feel.
- **Preserve:** Sentry wiring. **Simplify:** ensure error/404 use the brand voice + `EmptyState`-like calm. **F11B:** trustful error/empty states (F11B.4).

---

## Cross-route patterns

- **Strongest, preserve everywhere:** the honesty layer (WhyThisPick null-safe, ViewerNotes disclaimer, DnaConfidence honesty, honest match gloss); the editorial masthead + Eyebrow; the MovieCard hover LAW; the single-pick primacy.
- **Most common polish need:** radius/button/card consistency (B1/B2/B6), reduced-motion coverage (A1), and routing empties through `EmptyState` (B7).
- **Biggest doctrine watch:** the `/home` tail (anti-scroll) + Account (SaaS-dashboard drift).
- **Deliberately secondary (don't over-polish into prominence):** Browse, Watchlist, History, Discover-as-second-recommender.

All route changes are queued in the [F11B plan](ui-polish-implementation-plan-f11b.md); **nothing is
changed in F11A**, and an **authenticated live pass** should precede F11B.2+.
