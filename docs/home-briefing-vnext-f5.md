# FeelFlick — Home / Briefing vNext (F5 Decision Note)

> Phase F5 of the rebuild. Makes the authenticated **Home / Tonight / Briefing**
> feel like the core nightly ritual — one considered, *justified* pick — **without
> touching the recommendation engine**. Read alongside
> [product-doctrine.md](product-doctrine.md) and
> [ia-v2-decision-record.md](ia-v2-decision-record.md).
>
> **Date:** 2026-06-03 · **Status:** implemented in F5.

---

## 1. Current Home problem

Home was already strong (mood-reactive Briefing slider, self-hiding supporting
sections), but the **wedge's third clause — "makes its case" — was invisible**:

- Each Briefing pick carries an engine-generated reason (`film.engineReason`, the
  `scoreMovieForUser → pickReason.label`, e.g. *"Because you loved Parasite"*). It
  was computed and **logged for impressions, but never shown to the user.** The
  slide displayed only the generic TMDB synopsis — so the pick read as "a movie"
  rather than "the film FeelFlick chose for *you*, and here's why."
- The Briefing **loading state** was an italic line ("Finding films for this
  mood…"), not a content-shaped skeleton (against the no-spinner rule).

## 2. Product-doctrine constraint

The wedge: *Mood-first, taste-deep — one justified nightly pick that **makes its
case**. Anti-scroll.* F5 strengthens the **justified** + **case** clauses using
only existing data, and keeps the supporting tail subordinate to the single pick.

## 3. What F5 changes

1. **Surfaces the "why this is the one"** — a new presentational component
   [`WhyThisPick`](../src/features/home/WhyThisPick.jsx) renders `film.engineReason`
   in the Briefing slide, between the title/meta and the synopsis, as the
   case-making layer (a "Why this pick" kicker + the reason). It is **null-safe**:
   when no reason exists (cold-start, no profile) it renders **nothing** — no
   fabricated explanation.
2. **Briefing loading skeleton** — the transient "Finding films…" text is replaced
   with a content-shaped, `animate-pulse` skeleton mirroring the slide layout
   (poster + title/lines), so a briefing reads as *being prepared*.
3. Small, safe component extraction (`WhyThisPick`) for clarity + unit-testability.

## 4. What F5 intentionally does NOT change

- **No engine work:** no scoring, thresholds, ranking, `ENGINE_VERSION`,
  `useHomeData` query logic, mood bridge, or candidate selection. `engineReason`
  is *displayed*, not computed differently.
- **No schema / RLS / migrations / edge functions / auth / routes / packages.**
- **No fabricated certainty or personalization.** `matchPct` + `engineReason` are
  shown only when the data provides them; cold-start shows neither rather than
  inventing.
- **Skip microcopy preserved as-is** ("Skip — not tonight"). F4's `Home.jsx`
  `onSkip` comment records that "we'll learn from this" copy was *deliberately
  removed* for overstating what skips do — so F5 does **not** re-add skip-teaching
  microcopy. The teaching happens (impression + interaction writes); we don't
  overstate it in copy.
- **No streaming-availability claims** beyond the existing TMDB provider chip
  (which only renders real provider data).

## 5. Briefing hierarchy

The Briefing remains the page's visual hero (large poster + display title), now
with its **case** attached:
`slot kicker → title → meta → WhyThisPick (why this is the one) → synopsis →
streaming → actions`. Slot kickers ("Tonight's pick / Mood match / From your DNA")
distinguish the three picks; `WhyThisPick` adds per-film specificity; `matchPct`
(ring) is the quality/trust number. Three complementary signals, none fabricated.

## 6. Supporting-section hierarchy — decision: **Option A (keep, already subordinate)**

The tail (`ContinueWatching`, `CuratedLists`, `TasteMatch`, `TasteTwinPulse`,
`CinematicDNA`, `QuickLog`, `PageEndCard`) is **kept as-is**:
- Every social/utility section **self-hides when empty** (`return null`) — no
  fabricated content, no fixed feed.
- Each is a distinct, editorially-headed section (not a generic carousel wall),
  and all are visually subordinate to the Briefing hero.
- They serve the engine/taste-building (QuickLog feeds history; TwinPulse/TasteMatch
  are the future social moat) — deleting them would lose signal, which the task
  forbids without strong justification.
- `PageEndCard` offers Discover only as a *closing* "keep exploring" CTA, not a
  competing primary answer.

No sections were deleted, reordered, or collapsed in F5 — the hierarchy is already
correct; F5 reinforces it by making the Briefing's *case* louder rather than the
tail quieter. (A future trim, if ever needed, is documented as a deferral, not done
here.)

## 7. Trust / case-making choices

- The reason text is the engine's own `pickReason.label` — **grounded, not
  invented.** No "perfect pick" / "guaranteed match" language.
- `WhyThisPick` degrades gracefully: rich reason → shown; no reason → omitted.
  This mirrors the doctrine's "a pick shown without its case betrays *makes its
  case*" — but only when a true case exists.

## 8. Data contracts preserved

- `useHomeData` shape unchanged (`moods[].films[].{engineReason, matchPct, …}`).
- `film.engineReason` is read-only display; `logSurfaceImpressions` still logs
  `pickReasonLabel: activeFilmReason` exactly as before.
- TMDB poster `<img src="image.tmdb.org/…">` + poster click → `/movie/:tmdbId`
  preserved (the recommendations e2e depends on it).

## 9. Skip / save / watch contracts preserved

Unchanged handlers + writes:
- **Skip** → `onSkip` (`Home.jsx`): `trackInteraction('dismiss', …)` +
  `updateImpression(user, movie, 'skipped')` (→ `recommendation_impressions.skipped`)
  + `TheBriefing` session-hide. Still both signal-writes, not a UI-only dismissal.
- **Save** → `useUserMovieStatus.toggleWatchlist` (`user_watchlist`).
- **Mark Watched** → `useUserMovieStatus.toggleWatched` (`user_history`) +
  optimistic slide-hide.
- **See More** → navigate `/movie/:tmdbId`.
- Impression logging (`logSurfaceImpressions`) unchanged on hero + tail rows.

## 10. Validation checklist

- [x] Briefing shows `engineReason` when present; nothing when absent (no fabrication).
- [x] Loading is a skeleton, not a spinner/text.
- [x] Skip/save/watch handlers + writes unchanged.
- [x] Poster `<img>` + click→`/movie/:id` preserved (recommendations e2e).
- [x] Supporting sections still self-hide; none promoted over the Briefing.
- [x] `/home` a11y clean (no serious/critical non-contrast axe violations).
- [x] BottomNav IA contract (F2) still green.
- [x] `lint → test → build` green.

## 11. Known follow-ups (F6 / F8)

- **F6 (Film File):** the richest "why" — the editorial overlay (`why_for_you`,
  `ff_take`) — is seeded for one film (Parasite). Scaling that generation is F6; the
  Briefing's `WhyThisPick` will deepen automatically as overlay coverage grows.
- **F8 (Recommendation trust + eval):** the *quality* of `pickReason.label` (how
  specific/true it is) is an engine concern — measuring + improving reason quality
  is F8, gated by the recommendation-engine skill + DB-first analysis. F5 only
  surfaces what the engine already produces.
</content>
