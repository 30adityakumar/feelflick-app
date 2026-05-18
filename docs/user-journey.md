# FeelFlick — User Journey (as it exists today)

A walk-through of every screen a real user touches, in the order they touch them. Each step lists the **route**, the **component** that renders it, the **data sources** it reads, and **what's wired vs. stubbed**.

Last updated to reflect the v2 migration (May 2026) — every authenticated surface listed here is the v2 editorial design at its canonical path. Legacy v1 routes are preserved at `/x-legacy` for emergency rollback.

---

## 0 · Entry point

| Route | Component | What renders |
|---|---|---|
| `/` (anonymous) | `RootEntry` → `Landing` | Landing page |
| `/` (authenticated) | `RootEntry` → `<Navigate to="/home">` | Redirect to Home v2 |
| `/auth/callback` | `OAuthCallback` | Google OAuth redirect target |

**Auth init runs in `main.jsx` *before* React mounts** — if the URL hash contains `access_token`, the Supabase session is established synchronously, then the hash is cleared. This prevents the flash-of-unauthenticated state.

After OAuth success, `PostAuthGate` (inside `RequireAuth`) inspects `user_metadata.onboarding_complete` (or matching flags) and either lets the user through or redirects to `/onboarding`.

---

## 1 · Landing (anonymous)

**Route:** `/`
**Source:** [src/features/landing/Landing.jsx](../src/features/landing/Landing.jsx) + [sections/](../src/features/landing/sections/)

Sequential sections rendered as a vertical scroll:

1. **HeroSection** — "Films that know you." + brand-gradient CTA "Get Started Free"
2. **HowItWorksSection** — 3-step explainer
3. **MoodShowcaseSection** — mood-tile carousel
4. **CinematicDNASection** — DNA portrait teaser
5. **ItLearnsYouSection** — feedback-loop explainer
6. **FindYourPeopleSection** — taste-twin teaser
7. **MoatProofSection** — competitive moat
8. **FAQSection**
9. **FinalCTASection** — "Stop scrolling. Start watching."

CTA opens Google OAuth via Supabase. No app data is fetched on the landing.

---

## 2 · Onboarding (first sign-in only)

**Route:** `/onboarding` (gated by `RequireAuth` + `OnboardingShell`)
**Source:** [src/features/onboarding/Onboarding.jsx](../src/features/onboarding/Onboarding.jsx) + [steps/](../src/features/onboarding/steps/)

A 4-step mood-reactive flow. Each step writes to Supabase as the user advances; on completion, `user_metadata.onboarding_complete` is set and the user is redirected to `/home`.

| Step | Component | Writes |
|---|---|---|
| 1. Genres | `GenresStep.jsx` | `user_preferences` (one row per selected genre, `excluded=false`) |
| 2. Mood | `MoodStep.jsx` | seed mood signal (used by initial briefing) |
| 3. Movies | `MoviesStep.jsx` | `user_history` + `user_ratings` for seed films |
| 4. Rating | `RatingStep.jsx` | `user_ratings` for the seed films |

After completion the user lands on Home v2 with a populated taste fingerprint.

---

## 3 · Home (canonical experience for returning users)

**Route:** `/home`
**Source:** [src/features/home-v2/HomeV2.jsx](../src/features/home-v2/HomeV2.jsx) + [useHomeData.jsx](../src/features/home-v2/useHomeData.jsx)
**The Briefing — editorial daily-edit homepage.**

Sections rendered top to bottom:

1. **Masthead** — "Tonight's edit." + Issue/Vol/For Name + live counts ("6 films logged")
2. **Mood Reactor** — 6 mood pills (Tender · Thrilled · Curious · Cozy · Melancholy · Witty). Selecting one re-scores the briefing locally.
3. **The Briefing** — 3 films per mood, asymmetric grid (1.05fr / 1fr / 1fr). Engine-ranked via `scoreMovieForUser` over a mood-tag-filtered candidate pool; the engine's `pickReason.label` ("Because you love {director}", "Hidden gem", etc.) replaces the per-mood template. Reshuffle button reseeds the order within the same pool.
4. **Continue Watching** — hidden (no resume-progress data source in DB yet)
5. **Cinematic DNA** — confidence %, top moods (from `taste_fingerprint`), motifs, median runtime
6. **Recently logged** — last 4 `user_ratings` joined to `movies`
7. **Taste match** — top 3 from `user_similarity` (bidirectional)
8. **Curated edits** — first 4 from `CURATED_LISTS` config
9. **Quick log** — search input → navigates to `/discover?q=`

**Action wiring:**
- Watch → `/movie/:tmdbId` (v2 detail)
- Save → `user_watchlist` insert + toast
- Skip → toast only (no impression writer here yet)
- Reshuffle → reorders the same mood pool with a seeded shuffle
- Friend card → `/profile/:userId`
- List card → `/lists/curated/:slug`

---

## 4 · Discover (mood → film flow)

**Route:** `/discover`
**Source:** [src/features/discover-v5/DiscoverV5.jsx](../src/features/discover-v5/DiscoverV5.jsx) + [useDiscoverData.jsx](../src/features/discover-v5/useDiscoverData.jsx)
**Magazine pivot — a 5-stage cinematic flow ending in one curated film.**

Stage progression:

| Stage | Duration | Source |
|---|---|---|
| 0 · Hero | until click | Rotating epigraph + greeting |
| 1 · Mood Constellation | until ≥1 mood tapped | 8-orb constellation, name + line draw |
| 2 · Night | until "Compose" | Intention / time / who / energy tiles |
| 2.3 · Breath | 2.2 s | Pulsing circle, *"The room is yours."* |
| 2.5 · Reveal | 2.6 s | Constellation collapse + particle burst |
| 2.7 · Title Card | 1.4 s | Black screen, film title, C-G-C-E chord |
| 3 · Magazine Spread | persistent | Editorial layout — see below |

**Magazine spread** (stage 3):

- Left page: poster + film-strip ribbon + match ring + pairing notes + TOC
- Right page: kicker + animated title + byline + drop-cap article + critic blockquote (when `movies_editorial_overlay.critic_quotes` is set) + "M. remembers" diary callback (real `user_ratings.review_text` from last 30 days) + Why-now chip + emotional arc graph + taste-twin (real friend rating ≥8) + confidence badge + **Watch now / Save for later / Not tonight** actions
- "Almost got" alternates · "Skip tonight" anti-rec

**Data:**
- Candidate films: top 60 from `movies` excluding `user_history`. Engine-ranked via `scoreMovieForUser`; intention/energy/who/time selections from the Night stage layer UI modifiers on top of the engine score.
- Diary quotes: real `user_ratings.review_text`, bucketed by dominant mood, falls back to curated default
- Twin: real follow + rating ≥8 on the candidate film
- Critic quote: `movies_editorial_overlay.critic_quotes` (only Parasite seeded)

**Actions:**
- Watch now → 6 s end-credits scroll → `/movie/:tmdbId`
- Save for later → `user_watchlist` insert
- Not tonight → `/home`

Audio cues (mood plucks, stage-advance whoom, title-card chord) are synthesized via Web Audio. Mute toggle bottom-left.

---

## 5 · Movie Detail (editorial)

**Route:** `/movie/:id` (TMDB id)
**Source:** [src/features/movie-v2/MovieDetailV2.jsx](../src/features/movie-v2/MovieDetailV2.jsx) + [useMovieData.jsx](../src/features/movie-v2/useMovieData.jsx)

Sections:

1. **Hero** — backdrop + poster + title + tagline + match ring (engine-derived via `scoreMovieForUser` against the user's profile) + action bar (Watch Trailer / Mark Watched / Save)
2. **WhyForYou** — 4 rationale cards from the user's taste fingerprint (mood overlap, fit-profile match, director count, runtime fit). Curated overlay wins when set.
3. **Synopsis**
4. **CriticQuotes** — `movies_editorial_overlay.critic_quotes` (only Parasite seeded; section hides otherwise)
5. **MoodRadar** — 6-axis radar from `llm_pacing / llm_intensity / llm_emotional_depth / llm_dialogue_density / llm_attention_demand` + mood_tags spread. Two-way highlight with WhyForYou.
6. **TheTake** — `movies_editorial_overlay.ff_take` (Parasite-only)
7. **Cast** — from TMDB
8. **Videos** — trailer modal
9. **FriendsLoved** — `user_follows` × `user_ratings`
10. **TasteTwinReview** — top user_similarity match's rating on this film
11. **Providers** — TMDB watch_providers
12. **PairsWith** — movie_similarity rows (pgvector cosine)
13. **YourTake** — visible only when `isWatched`; user note + rating
14. **DirectorShelf** — `person/{id}/movie_credits` from TMDB
15. **TimelineSection** — release context
16. **DetailsSection** — runtime, budget, languages
17. **MovieFooter** — "Back to Briefing" → `/home`

Sticky action bar at bottom on long scroll.

---

## 6 · Watchlist · "The queue"

**Route:** `/watchlist`
**Source:** [src/features/watchlist-v2/WatchlistV2.jsx](../src/features/watchlist-v2/WatchlistV2.jsx)

Stats trio (Perfect for tonight / Getting stale / Total queue). Tab filter (All / Perfect tonight / Tender / Tense / Slow-burn / Getting stale). Grid/List toggle. Each card has match % from `scoreMovieForUser` (clamped 50–96; saved films cluster at the top because the user picked them), stale-flag (>60 days), remove button. Click → `/movie/:tmdbId`.

Reads `user_watchlist` + `movies`. Optimistic delete via `removeFromWatchlist`.

---

## 7 · History · "The diary"

**Route:** `/history` (also `/watched` alias)
**Source:** [src/features/history-v2/HistoryV2.jsx](../src/features/history-v2/HistoryV2.jsx)

Derives all panels from a single `user_history × user_ratings` fetch:
- Stats: total logged, total hours, avg rating, this-month count, streak days
- Streak heatmap (12 weeks × 7 days)
- Monthly timeline (12 months)
- Mood share (top 8 moods this year)
- Diary entries: full ratings list with mood, daypart, weekday, optional review note

Click any entry → `/movie/:tmdbId`.

---

## 8 · Account · "The settings drawer"

**Route:** `/account`
**Source:** [src/features/account-v2/AccountV2.jsx](../src/features/account-v2/AccountV2.jsx) + [useAccountData.jsx](../src/features/account-v2/useAccountData.jsx)

Sections:
- **Identity** — name + email + avatar upload + member-since
- **Notifications** — 5 toggles (Daily Briefing / Mood reminders / Friend activity / Year in review / Product news)
- **Engine prefs** — runtime band, languages, subtitle preference, spoiler tier, genre exclusions
- **Privacy** — profile public, diary public, leaderboards, shareable cards, analytics
- **Connections** — Sign out everywhere · Re-run onboarding · Request account deletion

All settings persist into `user_settings.settings` (JSONB) with 350 ms debounced upserts.

---

## 9 · Preferences · "The dials"

**Route:** `/preferences`
**Source:** [src/features/preferences-v2/PreferencesV2.jsx](../src/features/preferences-v2/PreferencesV2.jsx) + [usePreferencesData.jsx](../src/features/preferences-v2/usePreferencesData.jsx)

Eight dial groups, all written on Save (not auto-saved):
1. Mood weights (9 sliders 0–100)
2. Genres drawn-to + Avoid (chip picker from TMDB 16-genre catalog)
3. Directors trusted + Muted (free-text chips, autocomplete from your history)
4. Runtime floor/cap (clamped sliders)
5. Daypart fit (4 toggles)
6. Subscriptions (8 streamer toggles)
7. Content boundaries (4 toggles)
8. Save & retune panel

Persistence: genres → `user_preferences` (delete-then-upsert with `excluded` flag); everything else → `user_settings.settings.prefs` JSONB, merged not replaced.

---

## 10 · Lists · "The shelves"

**Route:** `/lists`
**Source:** [src/features/lists-v2/ListsV2.jsx](../src/features/lists-v2/ListsV2.jsx) + [useListsData.jsx](../src/features/lists-v2/useListsData.jsx)

3 tabs:
- **Yours** — your `lists` (RLS owner-only)
- **Followed** — public lists by users you follow (via `user_follows`)
- **Editorial** — the 10 entries in `CURATED_LISTS` config (query-driven, not table-stored)

Card click → `/lists/:id` (mine/followed) or `/lists/curated/:slug` (editorial).

Featured shelf below the grid shows the first owned list with films expanded inline.

### 10a · List detail

**Route:** `/lists/:listId`
**Source:** [ListDetailV2.jsx](../src/features/lists-v2/ListDetailV2.jsx)

Editorial layout (sticky-left meta + actions; right-side numbered film rows with mood chips and italic notes). Owner sees Copy link / Edit details / Reorder · Remove / Delete. Non-owner sees the read-only spread.

### 10b · Curated list detail

**Route:** `/lists/curated/:slug`
**Source:** [CuratedListV2.jsx](../src/features/lists-v2/CuratedListV2.jsx)

Sticky-left meta + 4-col poster grid. Reuses the query builders in [curatedListsConfig.js](../src/app/pages/browse/curatedListsConfig.js).

---

## 11 · People · "Taste twins"

**Route:** `/people`
**Source:** [src/features/people-v2/PeopleV2.jsx](../src/features/people-v2/PeopleV2.jsx) + [usePeopleData.jsx](../src/features/people-v2/usePeopleData.jsx)

Sections:
- **Masthead** — "Your taste twins." with live follow/follower counts + name-search input + (disabled) Invite a friend
- **Twins** — top 4 by `user_similarity.overall_similarity` (bidirectional)
- **Rising** — next 3 (rank 5–7)
- **Activity** — recent ratings + watches from people you follow
- **Crew overlap** — directors shared between you and your follows
- **Suggested** — rank 8+ similarity not yet followed

Follow button writes to `user_follows` with optimistic UI. Card click → `/profile/:userId`.

---

## 12 · Profile · Cinematic DNA

**Route:** `/profile` (own) · `/profile/:userId` (someone else's)
**Source:** [src/features/profile-v2/TasteProfileV2.jsx](../src/features/profile-v2/TasteProfileV2.jsx) + [useProfileData.jsx](../src/features/profile-v2/useProfileData.jsx)

`isSelf` derives from route param; sections gate accordingly:

- **Masthead** — name, archetype card, summary line, films/hours stats. Actions: Edit profile + Share my DNA (self only) / Back + Follow (others).
- **QuickStats** — films logged, hours, this month, DNA confidence
- **MoodRadar** — from `taste_fingerprint`
- **SignatureDirectors** — voices you trust (avg rating × count)
- **MotifCloud** — top mood/tone tags
- **Trajectory** — last 12 months bar chart
- **PatternPanel** — text patterns
- **Mixtape** — top-rated films
- **Skew** — bars vs. FF median (placeholder)
- **FriendsRanked** — taste-twin rail
- **YIRBanner** — Year-in-Review draft (self only)
- **ShareCard** — story-format share preview (self only)
- **ProfileFooter**

Watch-history of other users now readable (RLS relaxed in migration `20260518000000_user_history_public_to_authenticated.sql`).

---

## 13 · Sign-out / orphan routes

| Route | Component | Behavior |
|---|---|---|
| `/logout` | `SignOutRoute` | Calls `supabase.auth.signOut()` then redirects to `/` |
| `/about`, `/privacy`, `/terms` | legal pages | Static markdown-rendered content |
| `/app`, `/app/*` | `AppPrefixAlias` | Strips `/app` prefix, redirects |
| `*` | `NotFound` | 404 |

---

## What the user touches but isn't yet hooked up

| Surface | Element | Current state |
|---|---|---|
| Home Briefing | Skip button | Toast only — no impression writer |
| Home Briefing | "Continue watching" | Hidden — no resume-progress data source |
| Movie Detail | `ff_take` (LLM-generated FF Take) | Hardcoded for Parasite only |
| Movie Detail | `critic_quotes` | Seeded for Parasite only (1 of 1 in overlay table) |
| Movie Detail | DNA Delta | Synthesized from fit vector, not real before/after snapshots |
| Discover (Stage 3) | Watch now | 6 s cinematic exit, no impression recorded |
| Preferences | Mood weights | Persisted to `user_settings.prefs.moodWeights`. Engine now scores v2 surfaces — next step is making it read `moodWeights` from `user_settings` to bias scoring per user. |
| Preferences | Subscriptions | Stored, not yet biasing recommendations (engine doesn't yet filter by accessible providers) |
| Preferences | Content boundaries | Stored, not yet filtering (graphic/sexual/animals/noise taxonomy needs movie-side tagging first) |
| People | Invite a friend | Disabled (no endpoint) |
| Lists | + New list (from /lists v2) | Opens `/lists-legacy?new=1` for the v1 modal — v2 lacks its own create-list flow |
| Account | Request account deletion | Mails support; no automated tombstone |

---

## Auth-gated vs public surface map

```
Public (no auth required):
  / · /about · /privacy · /terms · /auth/callback · 404

RequireAuth + PostAuthGate (onboarding-complete users only):
  /home · /discover · /movie/:id · /watchlist · /history · /watched
  /account · /preferences · /lists · /lists/:id · /lists/curated/:slug
  /people · /profile · /profile/:userId

RequireAuth (any authenticated user):
  /onboarding · /logout

Admin email allowlist (VITE_ADMIN_EMAILS):
  /admin/cache-monitoring

Legacy escape hatches (v1 source preserved for emergency rollback):
  /home-legacy · /discover-legacy · /movie-legacy/:id · /watchlist-legacy
  /history-legacy · /account-legacy · /preferences-legacy
  /lists-legacy · /lists-legacy/:listId · /lists-legacy/curated · /lists-legacy/curated/:slug
  /people-legacy · /profile-legacy · /profile-legacy/:userId
```
