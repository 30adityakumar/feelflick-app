# Home — bounded personal discovery redesign

> **Status:** implemented. Replaces the single-pick **Briefing** Home with the
> bounded-personal-discovery composition. This is the migration the
> [Home/Briefing vNext (F5) note](../home-briefing-vnext-f5.md) anticipated
> ("the shipped single-pick Briefing remains current runtime, being migrated
> separately") and that [ADR 020](../decisions/020-personal-movie-discovery-and-bounded-choice.md)
> authorizes (Home is *not* restricted to one visible movie; bounded personalized
> groups alongside an optional hero are encouraged). Visual authority remains
> [Adaptive Editorial Cinema (ADR 021)](../ui/design-authority-adaptive-editorial-cinema.md).

## Composition

`/home` (authenticated) now renders, inside the scoped Thoughtful-Seatmate
foundation (`<ThoughtfulRoot>` + neutral `<PageDepth>` canvas):

1. **HomeHero** — full-bleed cinematic backdrop with a small (≤3) carousel of
   personally-grounded standouts. Desktop: clean artwork left, scrim + content
   right. Mobile: bottom-aligned content over a bottom-up scrim, swipe + dots.
2. **HomeShortcutStrip** — Match the moment (→ Discover) · Browse your way
   (→ Browse) · Log a movie (→ Browse). Connected 3-segment strip on desktop;
   peeking horizontal carousel on mobile. Placed entirely after the hero.
3. **HomeRecommendationSection[]** — bounded, poster-led groups (5-up grid →
   mobile snap carousel) with a grounded "how this was determined" info
   disclosure.
4. **HomeDnaStrip** — compact, honest Cinematic-DNA close (label, evolving
   one-liner, real motif/mood chips, an emerging signal, Open DNA → `/profile`).
   Not the former full-page DNA dashboard.

Components live in `src/features/home/components/`. One stable, sr-only page `<h1>`
("Home — your picks for tonight") anchors every state; the hero film title is an
`<h2>`.

## Data sources & dynamic row eligibility

Hero + rows come from the existing tier-aware engine
[`useHomepageRows`](../../src/shared/hooks/useHomepageRows.js) /
[`homepageRows.js`](../../src/shared/services/homepageRows.js) (no engine change).
The DNA strip + greeting come from the slimmed
[`HomeDataProvider`](../../src/features/home/useHomeData.jsx).

- **Hero** = the grounded standouts of the `topOfTaste` row: films whose engine
  reason type is **not** the generic "Picked for you" fallback, top 3. A hero
  film **never** shows a generic explanation; if no grounded candidate exists the
  hero is omitted and Home leads with the rows.
- **Row order is personal-first**, broad/editorial only as honest fallbacks:
  `top_of_taste` → `still_in_orbit` ("Because you loved …") → `mood_row`
  ("Films that feel …") → `signature_director` ("More from …") → `watchlist`
  ("Still on your watchlist") → then `critics_swooned` / `peoples_champions`
  (A/B rotated) → `under_90`.
- **Eligibility is dynamic**: each builder enforces a per-row minimum
  (`MIN_ROW_FILMS`); a row that can't be honestly populated returns no films and
  is not rendered (no empty placeholders, no popularity-filler). Tier gating
  (`cold` ≤4 / `warming` 5–19 / `engaged` ≥20 watches) hides personal rows for
  cold users, so the broad rows act as cold-start fallbacks.
- **No duplicate films**: the engine cross-dedupes across rows; Home additionally
  removes the hero films from the rows. Each rendered row is capped at 5.
- **Honesty**: reasons/subtitles/titles are dynamic and grounded; mood is framed
  as a *learned* signal ("Films that feel …"), never a claim about tonight.
  Recurring motifs are represented through the DNA strip, not a fabricated row.

## Preserved behavior (unchanged contracts)

- Save → `useUserMovieStatus.toggleWatchlist` (`user_watchlist`); Watched →
  `toggleWatched` (`user_history`); both keep optimistic update + revert.
- Not tonight → `updateImpression(…, 'skipped')` + `trackInteraction('dismiss')`,
  then advance (session-hidden).
- Open Film File → `recordRecommendationOutcome(… 'clicked')` then `/movie/:tmdbId`
  (hero); cards use `updateImpression(… 'clicked')` + `track('card_clicked')`.
- Surface impressions: `logSurfaceImpressions` per active hero film
  (`placement: 'hero'`) and per rendered row (`placement: 'carousel'`).
- AppShell still owns Header / SearchBar / BottomNav / mobile IA / account.

## HomeDataProvider scope change (before → after)

- **Before**: mood-scored candidate pool + `computeUserProfile` (v2) + friends /
  taste-twins + curated/personal lists + twin-pulse + seen-candidates + DNA — all
  consumed by the retired Briefing + supporting tail.
- **After**: DNA strip + greeting only (`user`, `dna`, `loading`, `error`) from a
  light history-count + recent-runtimes + taste-fingerprint read. The legacy
  recommendation pipeline no longer runs alongside `useHomepageRows`.
  `prefetchHomeData` now warms the v3 profile (the new pipeline). Asserted by
  `HomeDataProvider.test.jsx`.

## Intentional deviations from the locked prototype

- **Navigation/chrome reused, not rebuilt.** The canonical BottomNav IA
  (Browse · Discover · **Tonight** · DNA · Account) and the real `SearchBar` are
  kept; the prototype's bottom nav, profile bottom-sheet, and static search list
  are illustrative only. Mobile account is the `/account` route.
- **No fake AI assistant.** The shared header search placeholder dropped
  "…or ask M…".
- **Hero backdrop only** (TMDB `backdrop_path` + neutral scrim) — no
  poster-colour aura/extraction (deferred per P2C-D).
- **Honest dynamic row titles** ("Top of your taste", "Because you loved …",
  "Films that feel …", "More from …") rather than the prototype's fixed example
  labels; the *composition* matches the prototype, the row *identities* come from
  real signals.
- Decorative "Best fit" per-card badge omitted (avoids over-claiming).

## Validation

`npm run lint`, `npm run test` (full unit/integration suite), `npm run build`,
`npm run guard:foundations` all pass. Composition verified at 1440/1280/1024/768/
430/390/375 and a 320px overflow check (no horizontal overflow at any).

**Authenticated E2E + visual baselines** regenerate via the established
`visual-baselines/home-*` CI (Linux) flow — the dev test-user credentials are
access-restricted in local sessions, so the authed `visual-app` snapshots are
finalized in CI. Specs/fixture were updated to the new structure
(`e2e/visual-auth/home.visual.js`, `e2e/app/home-discovery.e2e.js`,
`e2e/fixtures/home.js`); the obsolete Briefing baselines were removed.
