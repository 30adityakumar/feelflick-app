# Browse — "Explicit Curiosity" redesign

Status: implemented on `feat/browse-locked-redesign` (PR open, unmerged).
Design system: Adaptive Editorial Cinema (ADR 021) — Inter-only, flat near-black
Ink canvas, paper-white text, neutral ivory primary actions, coral signature only.

## Product role

Browse is the **explicit-curiosity** surface. The user chooses the territory
(genre · era · language · runtime · filmmaker · qualities, or a text search) and
FeelFlick helps them **understand, order and navigate what exists inside it**. It
is deliberately distinct from:

- **Home** — "Made for you" (personalized rows).
- **Discover** — "Tuned to the moment" (mood/context).

Browse never claims a per-film personal match. Anti-scroll: a finite, ordered,
navigable result set — not an infinite feed.

## What shipped

- **Shortened cinematic masthead** (~340px desktop / ~300px mobile): eyebrow
  "Yours to explore", "Follow your curiosity.", a decorative real-artwork poster
  ribbon (aria-hidden, fallback-safe), the **scoped catalogue search**, and the
  **scoped surprise** action. Shared chrome (Header / global search / avatar /
  bottom nav) is reused from AppShell — Browse owns none of it.
- **"Start somewhere" curiosity paths** — meaningful entry points (NOT a feed).
  Personal paths (top genre / a non-English language the user returns to / a
  filmmaker their ratings reward) require real thresholds; editorial paths
  (Hidden gems / Cult classics / Short & sharp) are catalogue-wide and labelled
  neutrally. Each path opens a real Browse territory via the URL. Renders fewer
  than six rather than fabricate.
- **Sticky filter bar** — desktop: Genre / Era / Language / Runtime popovers + a
  "More filters" drawer trigger, with a separate **Sort** group (the four primary
  sorts as tabs). Mobile: only "Filters · N" + a compact Sort menu. A second row
  shows removable active-scope chips.
- **Advanced drawer / bottom sheet** — staged draft committed only on **Apply**
  (Reset clears, Cancel/Escape/outside-click/× discards). Full dialog a11y (focus
  moves in, trapped, restored; background scroll locked). Inferred-signal copy is
  honest ("leans"/"often", never absolutes).
- **Dense poster grid** (6 / 5 / 4 / 3 / 2 columns) + finite pagination.
- **Scoped surprise** — a confirmation dialog (NOT a direct navigation), weighted
  from the qualified pool inside the active scope, respecting Hide watched,
  excluding invalid records, avoiding an immediate repeat; explains the SCOPE the
  pick came from, opens the real Film File, supports "Another within these
  filters".
- Real save / watched writes (`user_history` / `user_watchlist`, optimistic +
  rollback + cache invalidation) preserved; TMDB text-search rows route their
  actions through `/movie/:tmdbId` (where the catalogue row is created first).

## Decisions called out (per approval)

1. **Default ordering is labelled honestly.** `sort=ff_rating.desc` is preserved
   for back-compat but is NOT personalized; it is labelled **"FeelFlick rating"**
   and explained as FeelFlick's overall catalogue rating within the chosen
   territory. No "For you", no match %, no "Best fit" for this sort. Genuine
   per-user ordering within a Browse territory remains a documented follow-up
   (needs server-side personalized browse scoring — an engine/API change).
   Browse personalization in this PR comes only from the personal curiosity
   paths, Hide watched, and Taste-twins-loved.

2. **Pagination.** Supabase catalogue pages by **18** (`PAGE_SIZE`, a Browse-only
   consumer; "18 films at a time" copy shows only in this mode). TMDB text-search
   keeps TMDB's **native page boundaries (~20)** and reports accurate totals — no
   result is dropped to force an 18-item page.

3. **Critics sort orders, never filters.** `ff_critic_rating.desc` orders the
   chosen territory (films with no/low critic evidence sort last via
   `nullsFirst:false`); it does NOT narrow genre/era/language/runtime scope.
   Critic **confidence (≥60)** only gates the visible critic number/badge, never
   the result set — counts stay honest.

4. **`avTonight` is normalized out of the URL.** There is no trustworthy
   region-aware availability data and the old adapter's `available: true` fallback
   is not real evidence, so a legacy `avTonight` param is stripped from the
   canonical URL on load (no chip, no filter, no claim). **No provider/availability
   UI is shown anywhere.** `view=list` is likewise normalized away (the redesign is
   a single dense grid). Other params (`mood`, `preset`, all advanced filters) are
   preserved/honored; `mood` and legacy quality params surface as removable chips.

5. **Scoped search is honest about scope.** TMDB's text query is title-oriented,
   so the placeholder is "Search films in this catalogue" (not "title or
   director"); filmmaker exploration stays in the Filmmaker-trail path + the
   director filter. When a text query is active, only TMDB-supported filters
   (genre / era / language / runtime / rating) keep applying; engine filters
   (mood, pacing, intensity, quality lenses, filmmaker, twins, hide-watched) are
   shown as **paused** chips and disclosed in the ranking note — never silently
   applied as truth.

6. **Curiosity-path performance.** Paths are derived from a single (engine-cached)
   `computeUserProfileV3` read; min result count + representative artwork are
   validated by at most **one bounded, batched `peekTerritory` probe per
   candidate** (3 columns, count-only, limit 5), run once per user and memoized —
   never a catalogue page request per candidate, never on ordinary re-renders.
   Order is deterministic (personal first, fixed editorial order) so paths + visual
   baselines stay stable. Stale derivations are ignored on user change.

## Deviations from the locked prototype

- The prototype's default "For you" sort + its "uses your watches/ratings/DNA to
  order" copy is replaced with the honest "FeelFlick rating" label + explanation
  (decision 1) — the existing default ordering is not genuinely personalized.
- No streaming/availability UI (the prototype implied "Streaming I have") —
  decision 4; no reliable data.
- The prototype's personal "era" path is replaced by an editorial **Cult
  classics** path: an "underexplored era" cannot be honestly + deterministically
  derived from current signals, so it is omitted (a documented follow-up) rather
  than fabricated.
- Scoped-search copy is title-scoped, not "title or director" (decision 5).

## Files

- Container: `src/features/browse/Browse.jsx` (URL state, fetch, real writes,
  surprise, legacy migration).
- Hook: `src/features/browse/useCuriosityPaths.js`. Pure helpers:
  `src/features/browse/browsePresentation.js` (evidence/badge/ranking copy).
- Components: `src/features/browse/components/Browse*`.
- API: `src/shared/api/browse.js` (`PAGE_SIZE=18`, `ff_critic_rating` sort,
  `peekTerritory`).
- Styles: `src/features/browse/browse.css` (scoped to `.ff-browse`, flat Ink).
- Removed: `components.jsx`, `immersive.jsx` (orphaned QuickLook/Toolbar/Refine),
  dead `FILMS`/`INITIAL_*` mocks in `data.js`.
- Foundation adoption: Browse added to the authorized-adopter allow-lists
  (3 governance tests + `legacy-gradient-guard.mjs`).

## Tests & validation

- Unit: `browsePresentation.test.js` (card-evidence/badge/ranking honesty),
  `useCuriosityPaths.test.js` (bounded peeks ≤6, deterministic order, min-count
  drop, memoization). Full suite green (1612).
- e2e: `e2e/app/browse.e2e.js` (sort URL, paths, drawer Apply, surprise dialog,
  `avTonight`/`view` normalization, empty state) + a11y audit in `a11y.e2e.js`.
  `e2e/public/browse-states.e2e.js` (error/empty/recovery copy) preserved.
- Visual: `e2e/visual-auth/browse.visual.js` + `e2e/fixtures/browse.js`
  (deterministic, offline; cold profile → editorial paths). Linux baselines via
  the `visual-baselines/browse-*` CI flow; the masthead ribbon + personal paths
  depend on live data and are covered by unit tests, not the offline baseline.
- lint / build / `guard:foundations` green.
