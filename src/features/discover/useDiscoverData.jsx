// src/features/discover/useDiscoverData.jsx
// FeelFlick — Discover data layer.
//
// Two live sources replace the prototype's hardcoded arrays:
//   • FILMS         → top-quality candidates from `movies` (capped at 60),
//                     shaped into the engine's fit-vector format. Mood fit
//                     for each axis (tense, slow, tender, cerebral, cozy,
//                     bittersweet, mythic, restless) is derived from the
//                     film's mood_tags via a many-to-many bridge.
//   • DIARY_QUOTES  → user's recent review_text from user_ratings, indexed
//                     by the dominant mood of the rated film. Falls back to
//                     a curated default per mood when the user has no diary
//                     yet for that axis.
//
// criticLine / twin / arcPoints stay as derived/synthesized fields because
// FeelFlick doesn't yet have a real critic-quote source or a per-film
// pre-computed emotional arc. These are clearly flagged below.

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { computeUserProfile, RECOMMENDATION_CONSTANTS } from '@/shared/services/recommendations'
import { filterExclusionsClientSide } from '@/shared/services/exclusions'

const DiscoverDataContext = createContext(null)

const TMDB_IMG = (path, size = 'w500') => path ? `https://image.tmdb.org/t/p/${size}${path}` : null

// How long a skipped film stays out of the /discover candidate pool. Mirrors
// the same floor /home applies via useHomeData (30 days). Skipping a film on
// /home and seeing it re-surface on /discover the next day would feel broken,
// so both surfaces honour the same window. The engine's negative-signal model
// keeps scoring against these skips afterward — this is just the hard "don't
// even show it" floor; it doesn't replace the softer skip-decay scoring.
const SKIP_EXCLUSION_DAYS = 30

// === Mood axis ↔ mood_tag bridge =========================================
//
// The page UI uses 8 mood axes (tender / tense / slow / cerebral / cozy /
// bittersweet / mythic / restless). The DB's mood_tags + tone_tags
// vocabulary is much richer (~25 distinct mood tags + 15 tone tags).
// This bridge maps each axis to the set of DB tags that contribute to it.
//
// Coverage was rebuilt 2026-05-24 after auditing actual DB tag distribution
// (see [[feedback-db-first-analysis]]). Before the rebuild, the mapping
// caught only 4-5 tags per axis — leaving 13+ high-frequency unmapped tags
// (heartwarming, playful, nostalgic, mysterious, etc.) and the mythic axis
// matching ZERO films. Cozy went from ~118 → 1,500+ candidate films;
// mythic from 0 → 600+; cerebral from 164 → ~1,000+.
//
// Per film, fit[axis] = max signal across mapped tags. Cross-axis tags
// (e.g., "haunting" in tense + slow + bittersweet) are intentional — a
// genuinely haunting film hits all three moods.
const MOOD_BRIDGE = {
  // tender: dropped `inspiring` after audit — Gladiator (inspiring sports/
  // war drama) was hitting 86% tender despite having zero tender feel,
  // because `inspiring` is the only tag mapping to tender that overlaps
  // with prestige epic films. Inspiring films can be tender via
  // heartwarming (covered) but not all inspiring films are tender.
  tender:      ['tender', 'romantic', 'heartwarming', 'uplifting', 'sentimental', 'warm', 'intimate'],
  tense:       ['tense', 'suspenseful', 'intense', 'thrilling', 'dark', 'unsettling', 'gritty', 'haunting', 'cold', 'urgent'],
  slow:        ['contemplative', 'meditative', 'melancholic', 'somber', 'nostalgic', 'poetic', 'wistful', 'restrained'],
  // cerebral: dropped `polished` and `cold` from initial pass — too generic
  // (every Tarantino film has cold tone, doesn't make them cerebral).
  cerebral:    ['contemplative', 'mind-bending', 'provocative', 'mysterious', 'complex', 'thought-provoking'],
  // cozy: dropped `playful`, `warm`, `sentimental`, `intimate` from initial
  // pass — those words ambiguously cover both "warm-feel-good" (Paddington)
  // and "intimate/witty-but-edgy" (Pulp Fiction has `playful` mood +
  // `warm` tone). With them, Pulp Fiction scored 86% cozy. Keeping the
  // cozy set narrow to truly low-stakes vocabulary; the warm-emotional
  // tags live on `tender` instead. Tradeoff: smaller cozy pool (~118 →
  // ~250 vs the over-broad ~1500) but no genre-bending false positives.
  cozy:        ['cozy', 'heartwarming', 'lighthearted', 'whimsical', 'comforting'],
  bittersweet: ['bittersweet', 'melancholic', 'somber', 'nostalgic', 'devastating', 'poignant', 'wistful', 'haunting', 'poetic'],
  // mythic: gained `inspiring` (moved from tender) — inspiring epics
  // (Gladiator, Braveheart-style hero's journey) belong on the mythic
  // axis. Still excluded `thrilling` from mythic — too broad.
  mythic:      ['exhilarating', 'grandiose', 'whimsical', 'absurdist', 'surreal', 'epic', 'dreamy', 'inspiring'],
  restless:    ['intense', 'suspenseful', 'exhilarating', 'gritty', 'thrilling', 'unsettling', 'urgent', 'raw', 'kinetic'],
}
const MOOD_AXES = Object.keys(MOOD_BRIDGE)

// Accept both mood_tags AND tone_tags so the "earnest / warm / poetic /
// grandiose / urgent" tone vocabulary (~1500+ films tagged "earnest"
// alone) contributes to fit derivation. Previously tone_tags was fetched
// but never used.
function computeFit(movieTags, toneTags = []) {
  const all = [
    ...(Array.isArray(movieTags) ? movieTags : []),
    ...(Array.isArray(toneTags) ? toneTags : []),
  ]
  if (all.length === 0) {
    return Object.fromEntries(MOOD_AXES.map(a => [a, 0.15]))
  }
  const tagSet = new Set(all.map(t => String(t).toLowerCase()))
  const fit = {}
  for (const axis of MOOD_AXES) {
    let signal = 0
    for (const tag of MOOD_BRIDGE[axis]) {
      if (tagSet.has(tag)) signal = Math.max(signal, 0.86)
    }
    fit[axis] = signal || 0.15
  }
  return fit
}

// Pick the strongest axis for a film's tags — used to bucket user diary
// quotes back to the right axis when the user views that mood later.
function dominantAxisOf(movieTags) {
  const fit = computeFit(movieTags)
  let best = 'tender', bestN = 0
  for (const axis of MOOD_AXES) {
    if (fit[axis] > bestN) { best = axis; bestN = fit[axis] }
  }
  return best
}

// === Synthesized arc (placeholder until a real per-film arc source lands)
function arcPointsFrom(fit) {
  // Use the film's tense + tender + bittersweet vector to shape a 10-step
  // arc with a typical mid-climax curve. Visual only.
  const peak = Math.max(fit.tense, fit.bittersweet, fit.tender, 0.4)
  const start = Math.max(fit.cozy, 0.35)
  const end = Math.max(fit.bittersweet, fit.tender, 0.45)
  return [start, start + 0.04, start + 0.1, start + 0.18, peak * 0.85, peak, peak * 0.92, end + 0.08, end + 0.02, end]
    .map(v => Math.max(0.15, Math.min(0.98, v)))
}

function arcDescriptionFor(fit) {
  if (fit.tense > 0.7 && fit.bittersweet < 0.5) return 'Tense build → tighter still → release.'
  if (fit.bittersweet > 0.7) return 'Soft throughout. Heaviest in the final scene.'
  if (fit.slow > 0.7) return 'Patient → revelation → quiet ache.'
  if (fit.cozy > 0.7) return 'Warm → warmer → home.'
  if (fit.cerebral > 0.6) return 'Patient → big idea → quiet residue.'
  return 'Steady build → peak in act 3 → soft landing.'
}

// === Fallback diary quotes (used per axis when user has no review yet) ===
const FALLBACK_DIARY = {
  tense:       { quote: 'I held my breath the whole final scene.',         after: 'a tense film, weeks ago' },
  slow:        { quote: 'Wrote nothing for an hour after the credits.',    after: 'a slow film, weeks ago' },
  tender:      { quote: 'Soft. Devastating. I sat there.',                 after: 'a tender film, weeks ago' },
  cerebral:    { quote: 'Stayed in my chest for days.',                    after: 'a cerebral film, weeks ago' },
  cozy:        { quote: 'It healed something I didn’t know was hurting.', after: 'a cozy film, weeks ago' },
  bittersweet: { quote: 'Still thinking about the final shot.',            after: 'a bittersweet film, weeks ago' },
  mythic:      { quote: 'Like seeing the world the first time.',           after: 'a mythic film, weeks ago' },
  restless:    { quote: 'Couldn’t sit. Got up. Sat down again.',      after: 'a restless film, weeks ago' },
}

function timeAgo(iso) {
  if (!iso) return 'recently'
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.round(ms / 86400000)
  if (days < 1) return 'today'
  if (days < 2) return 'yesterday'
  if (days < 7) return `${days} days ago`
  const weeks = Math.round(days / 7)
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  const months = Math.round(days / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}

// === Shape one DB movie row into the engine's film format ================
function shapeFilm(m) {
  const fit = computeFit(m.mood_tags, m.tone_tags)
  const ff = Math.round(m.ff_final_rating ?? m.ff_audience_rating ?? 75)
  const critic = Math.round(m.ff_critic_rating ?? m.ff_audience_rating ?? 80)
  const audience = Math.round(m.ff_audience_rating ?? 75)
  return {
    id: m.id,
    tmdbId: m.tmdb_id,
    title: m.title || 'Untitled',
    year: m.release_date ? new Date(m.release_date).getFullYear() : (m.release_year || ''),
    runtime: m.runtime || 110,
    dir: m.director_name || 'Unknown',
    genre: m.primary_genre || 'Drama',
    poster: TMDB_IMG(m.poster_path),
    // Real TMDB synopsis. Stage 3 used to render a templated "ffTake" prose
    // blob with the same wording for every film (just director name swapped) —
    // which read as curator voice but was a Mad Lib. Pulling the real
    // overview restores honesty even if the prose is less ornate.
    overview: m.overview || null,
    // Trailer YouTube key for the inline TrailerModal on /discover Stage 3.
    // Null when TMDB has no trailer for this title — the Trailer button hides.
    trailerKey: m.trailer_youtube_key || null,
    ff,
    critic,
    audience,
    fit,
    arc: arcDescriptionFor(fit),
    arcPoints: arcPointsFrom(fit),
    twin: null, // populated below if we find a follow who rated this film
    criticLine: null, // no real critic source yet — page hides this section when null
    // Raw Supabase row preserved for scoreMovieForUser — Discover does the
    // engine call inline because the magazine flow applies UI-driven
    // intention/energy modifiers on top of the engine score.
    _raw: m,
  }
}

// === Provider ============================================================

const INITIAL = {
  films: [],
  diaryQuotes: {},
  profile: null, // computeUserProfile(userId) result — Discover calls scoreMovieForUser inline
  baselineMoods: [], // users.taste_baseline_moods (onboarding mood keys)
  // Learned Stage 2 filter counts (intention/time/who/energy) from
  // user_discover_preferences. Used by predictDiscoverDefaults to blend
  // heuristic + learned modes after the user has 3+ commits. Null when
  // the row doesn't exist yet (cold-start user).
  learnedPrefs: null,
  // Recent user_watchlist saves (last 90d) with director + genre metadata.
  // Used by Discover allResults to add a saveBoost — films sharing a
  // director or genre with the user's saved films get a small score
  // bonus, so the engine actually rewards positive signals not just
  // demotes negative ones. {director, genre, moodTags}[].
  recentSaves: [],
  loading: true,
  error: null,
}

export function DiscoverDataProvider({ children }) {
  const { user } = useAuthSession()
  const userId = user?.id
  const [state, setState] = useState(INITIAL)

  useEffect(() => {
    let abort = false
    setState(s => ({ ...s, loading: true, error: null }))
    ;(async () => {
      try {
        // === Phase 1: watch history + recent skips (both fuel exclusion) ===
        // The candidate query needs the exclude-id list before it can run, so
        // we resolve both sources here before building the query. Watched
        // comes from user_history; recent skips come from
        // recommendation_impressions.skipped=true within the last
        // SKIP_EXCLUSION_DAYS window. Skipped films stay out of /discover
        // candidate pool for 30 days — same hard floor /home applies — so a
        // film the user rejected here or on /home doesn't re-surface in the
        // next reveal. After 30d the engine gets another chance.
        const recentCutoff = new Date(Date.now() - 30 * 86400000).toISOString()
        let watchedIds = []
        let skippedIds = []
        // historyMeta: parallel-derived signals for the augmentedProfile
        // filters — era_floor (5th percentile of watched release_years),
        // runtime_band ([p10, p90] of watched runtimes), and the modal
        // language. The v2 profile shape doesn't surface these fields,
        // so we synthesize them here from the same user_history we're
        // already querying (one extra join, ~zero cost vs. another query).
        let historyMeta = { eraFloor: null, runtimeBand: null, languagePrimary: null }
        if (userId) {
          const skipCutoffISO = new Date(Date.now() - SKIP_EXCLUSION_DAYS * 86400000).toISOString()
          const [{ data: hist }, { data: skips }] = await Promise.all([
            supabase.from('user_history')
              .select('movie_id, movies!inner(release_year, runtime, original_language)')
              .eq('user_id', userId),
            supabase.from('recommendation_impressions').select('movie_id')
              .eq('user_id', userId).eq('skipped', true).gte('shown_at', skipCutoffISO),
          ])
          watchedIds = (hist || []).map(r => r.movie_id)
          skippedIds = Array.from(new Set((skips || []).map(r => r.movie_id)))

          // Same gating as filterExclusionsClientSide: needs >= 10 watches
          // before the inferred floors are statistically meaningful.
          if ((hist || []).length >= 10) {
            const years = (hist || []).map(r => r.movies?.release_year).filter(Number.isFinite).sort((a, b) => a - b)
            const runtimes = (hist || []).map(r => r.movies?.runtime).filter(Number.isFinite).sort((a, b) => a - b)
            const langCounts = {}
            for (const r of (hist || [])) {
              const lang = r.movies?.original_language
              if (lang) langCounts[lang] = (langCounts[lang] || 0) + 1
            }
            const pctile = (arr, p) => arr.length === 0 ? null : arr[Math.min(arr.length - 1, Math.floor(arr.length * p / 100))]
            if (years.length >= 10) historyMeta.eraFloor = pctile(years, 5)
            if (runtimes.length >= 10) historyMeta.runtimeBand = [pctile(runtimes, 10), pctile(runtimes, 90)]
            // Pick the dominant language only when it's >= 60% of watches —
            // bilingual viewers shouldn't get filtered down to one language.
            const totalLang = Object.values(langCounts).reduce((a, b) => a + b, 0)
            const sorted = Object.entries(langCounts).sort((a, b) => b[1] - a[1])
            if (sorted[0] && totalLang > 0 && sorted[0][1] / totalLang >= 0.6) {
              historyMeta.languagePrimary = sorted[0][0]
            }
          }
        }
        const excludedIds = Array.from(new Set([...watchedIds, ...skippedIds]))

        // === Candidate pool — prestige core + per-axis supplements ========
        // The old "top 120 by ff_audience_rating" approach skewed heavily
        // toward prestige tense/drama films (Schindler's List, Fight Club,
        // The Godfather …) — leaving cozy/mythic/cerebral mood scenarios
        // under-served. Even with a fully-corrected MOOD_BRIDGE mapping,
        // cozy films don't make the prestige top-120 cut at rating ≥ 72.
        //
        // New union approach:
        //   • Phase A: top 90 by rating ≥ 72  (prestige core; never leaves)
        //   • Phase B: top 12 per mood axis at rating ≥ 68, ordered by
        //              rating, mood_tags overlapping the axis's bridge tags
        //              (8 axes × 12 = 96 supplement films)
        //
        // Dedup by id → net pool ~150-180 films, balanced across moods.
        // Cost: 9 parallel queries instead of 1, all indexed scans, each
        // returning ≤96 rows. Total latency increase ~150-250ms — fully
        // hidden behind Stage 1 + Stage 2 user interaction time.
        const SELECT_COLS = `
          id, tmdb_id, title, overview, release_date, release_year, runtime,
          director_name, primary_genre, genres, poster_path, original_language,
          trailer_youtube_key,
          mood_tags, tone_tags, fit_profile,
          ff_audience_rating, ff_audience_confidence, ff_critic_rating,
          ff_final_rating, ff_rating, ff_rating_genre_normalized,
          discovery_potential, polarization_score,
          llm_pacing, llm_intensity, llm_emotional_depth,
          llm_dialogue_density, llm_attention_demand
        `
        const baseFilters = (q) => {
          q = q.eq('is_valid', true)
            .not('poster_path', 'is', null)
            .not('mood_tags', 'is', null)
            .gte('ff_audience_confidence', 60)
          if (excludedIds.length > 0) {
            q = q.not('id', 'in', `(${excludedIds.join(',')})`)
          }
          return q
        }
        // Phase A: prestige core — rating ≥ 70 (was 72), limit 120 (was 90).
        // Lowered floor pulls in films like Drive (1992), Children of Men
        // (2006), Lost in Translation (2003) that are mid-prestige but
        // exclusion-aggressively filtered. Higher limit gives more
        // post-exclusion survivors. Two bumps multiply: more eligible
        // films AND more of them surface.
        const prestigeQuery = baseFilters(supabase.from('movies').select(SELECT_COLS))
          .gte('ff_audience_rating', 70)
          .order('ff_audience_rating', { ascending: false })
          .limit(120)
        // Phase B: per-axis mood supplements — rating 62 ≤ x < 70, limit 35.
        // Lowered upper bound (now matches new prestige floor) and lower
        // bound (62 vs 65) so genuinely mood-rich films like indie cozy
        // comedies, family animation, slow-burn arthouse get representation
        // even when they don't carry prestige ratings. Bumped per-axis
        // sample 25 → 35 to reduce the same-films-everywhere effect across
        // mood scenarios; with 8 axes × 35 = 280 potential supplement
        // rows (deduped), the post-exclusion pool roughly doubles.
        const axisQueries = Object.entries(MOOD_BRIDGE).map(([, tags]) =>
          baseFilters(supabase.from('movies').select(SELECT_COLS))
            .gte('ff_audience_rating', 62)
            .lt('ff_audience_rating', 70)
            .overlaps('mood_tags', tags)
            .order('ff_audience_rating', { ascending: false })
            .limit(35)
        )

        const [prestigeRes, ratingsRes, followsRes, profile, userRowRes, learnedPrefsRes, userSettingsRes, savedRes, ...axisResults] = await Promise.all([
          prestigeQuery,
          userId
            ? supabase
                .from('user_ratings')
                .select('movie_id, rating, review_text, rated_at, movies!inner(title, mood_tags)')
                .eq('user_id', userId)
                .not('review_text', 'is', null)
                .gte('rated_at', recentCutoff)
                .order('rated_at', { ascending: false })
                .limit(40)
            : Promise.resolve({ data: [] }),
          userId
            ? supabase
                .from('user_follows')
                .select('following_id')
                .eq('follower_id', userId)
            : Promise.resolve({ data: [] }),
          userId ? computeUserProfile(userId).catch(() => null) : Promise.resolve(null),
          // Onboarding Step 1 baseline moods — the user's stable taste
          // signal, not a session signal. Used to soft-pre-select the
          // mood orb on the first /discover visit (audit #7) so we don't
          // re-ask the same question 30 seconds after the user told us in
          // onboarding. Subsequent visits start from empty so the user
          // can express their right-now mood without our nudge.
          userId
            ? supabase.from('users').select('taste_baseline_moods').eq('id', userId).maybeSingle()
            : Promise.resolve({ data: null }),
          // Learned Stage 2 filter counts from user_discover_preferences.
          // maybeSingle so cold-start users (no row yet) get null without
          // an error — predictDiscoverDefaults handles the null fallback.
          userId
            ? supabase
                .from('user_discover_preferences')
                .select('intention_counts, time_counts, who_counts, energy_counts, total_commits')
                .eq('user_id', userId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          // user_settings.settings.prefs.avoidGenres — the user's EXPLICIT
          // "block these unless I ask" list from /preferences and /account.
          // Merged into profile.exclusions before filterExclusionsClientSide
          // runs so the engine honors both inferred AND explicit avoidances.
          userId
            ? supabase
                .from('user_settings')
                .select('settings')
                .eq('user_id', userId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          // Recent watchlist saves (last 90d) — used as a POSITIVE signal
          // by Discover allResults. Films matching the director or
          // primary_genre of these saves get a saveBoost in scoring.
          // Joined to movies for the metadata we need without extra
          // round-trips. Limited to 50 most recent saves so the .map()
          // / Set construction in Discover stays O(50) per render.
          userId
            ? supabase
                .from('user_watchlist')
                .select('movie_id, added_at, movies!inner(director_name, primary_genre, mood_tags)')
                .eq('user_id', userId)
                .gte('added_at', new Date(Date.now() - 90 * 86400000).toISOString())
                .order('added_at', { ascending: false })
                .limit(50)
            : Promise.resolve({ data: [] }),
          ...axisQueries,
        ])
        if (abort) return

        // Union: prestige core first (preserves rating order for the
        // top of the deck), then per-axis supplements deduped by id.
        const candidateMap = new Map()
        for (const f of (prestigeRes.data || [])) candidateMap.set(f.id, f)
        for (const axisRes of axisResults) {
          for (const f of (axisRes?.data || [])) if (!candidateMap.has(f.id)) candidateMap.set(f.id, f)
        }
        const rawMovieRows = Array.from(candidateMap.values())
        const ratingRows = ratingsRes.data || []
        const followsArr = (followsRes.data || []).map(r => r.following_id)

        // === Apply unified exclusions (closes the /discover gap) ===========
        // The candidate query only filters by quality + watched/skipped. The
        // engine's `filterExclusionsClientSide` adds the rest of the user-
        // shaped filters that every other surface (/home, /lists) already
        // honors: GATED_GENRES the user hasn't watched enough of (Horror,
        // Animation, Family, Documentary), era_floor (when totalWatches ≥
        // 10), runtime minimum, allowed languages, community high-skip,
        // and personal skipped. We also merge in the user's EXPLICIT
        // avoid-genres from user_settings.prefs (set via /preferences and
        // /account) so the engine respects both INFERRED and EXPLICIT
        // avoidance signals.
        const augmentedProfile = (() => {
          if (!profile) return null

          // Inputs to merge:
          //   1. profile.exclusions.genreNames — engine's inferred GATED_GENRES the
          //      user hasn't watched enough (Horror/Animation/Family/Documentary).
          //      Populated by computeExclusions but only as NAMES; we resolve
          //      back to IDs here because filterExclusionsClientSide reads IDs.
          //   2. user_settings.prefs.avoidGenres — the user's EXPLICIT
          //      avoid list from /preferences and /account. Names too.
          //   3. historyMeta.{eraFloor, runtimeBand, languagePrimary} —
          //      synthesized from this query since the v2 profile shape
          //      doesn't surface a `filters` object.
          const NAME_TO_ID = RECOMMENDATION_CONSTANTS.GENRE_NAME_TO_ID || {}
          const nameToId = (n) => NAME_TO_ID[String(n).toLowerCase()]

          const inferredNames = Array.isArray(profile.exclusions?.genreNames)
            ? profile.exclusions.genreNames
            : []
          const explicitNames = Array.isArray(userSettingsRes?.data?.settings?.prefs?.avoidGenres)
            ? userSettingsRes.data.settings.prefs.avoidGenres
            : []

          const allNames = Array.from(new Set([...inferredNames, ...explicitNames]))
          const allIds = new Set()
          // Seed with any IDs the profile already had (engine v3 path),
          // then union the resolved name → ID lookups.
          const existingIds = profile.exclusions?.genreIds instanceof Set
            ? profile.exclusions.genreIds
            : new Set(profile.exclusions?.genreIds || [])
          for (const id of existingIds) allIds.add(id)
          for (const n of allNames) {
            const id = nameToId(n)
            if (Number.isFinite(id)) allIds.add(id)
          }

          return {
            ...profile,
            exclusions: {
              ...profile.exclusions,
              genreIds: allIds,
              genreNames: allNames,
            },
            // Mirror into v3-shape filters.* so filterExclusionsClientSide
            // sees the full picture regardless of which path resolved the
            // profile. era_floor, runtime_band, language_primary come from
            // historyMeta when this user has 10+ watches (engine's same
            // threshold), null otherwise.
            filters: {
              ...profile.filters,
              excluded_genre_ids: allIds,
              era_floor: profile?.filters?.era_floor ?? historyMeta.eraFloor,
              runtime_band: profile?.filters?.runtime_band ?? historyMeta.runtimeBand,
              language_primary: profile?.filters?.language_primary ?? historyMeta.languagePrimary,
            },
            // Mirror totalWatches into meta.total_watches because
            // filterExclusionsClientSide reads it as the gate for
            // applying era_floor / runtime_band. The v2 profile uses
            // qualityProfile.totalMoviesWatched; bridge them.
            meta: {
              ...profile.meta,
              total_watches: profile?.meta?.total_watches
                ?? profile?.qualityProfile?.totalMoviesWatched
                ?? 0,
            },
          }
        })()

        const movieRows = filterExclusionsClientSide(rawMovieRows, augmentedProfile)

        // === Phase 2: friend ratings + editorial overlays (parallel) ======
        const movieIds = movieRows.map(m => m.id)
        const [friendRes, overlayRes] = await Promise.all([
          followsArr.length && movieIds.length
            ? supabase
                .from('user_ratings')
                .select('user_id, movie_id, rating, review_text, users!inner(name)')
                .in('user_id', followsArr)
                .in('movie_id', movieIds)
                .gte('rating', 8)
            : Promise.resolve({ data: [] }),
          movieIds.length
            ? supabase
                .from('movies_editorial_overlay')
                .select('movie_id, critic_quotes, arc_points')
                .in('movie_id', movieIds)
            : Promise.resolve({ data: [] }),
        ])
        const friendRatings = friendRes.data || []
        const overlayByMovie = new Map((overlayRes.data || []).map(o => [o.movie_id, o]))
        if (abort) return

        // Best (highest-rated, first reviewer wins on tie) friend per movie
        const friendByMovie = new Map()
        for (const r of friendRatings) {
          const existing = friendByMovie.get(r.movie_id)
          if (!existing || (r.rating ?? 0) > (existing.rating ?? 0)) friendByMovie.set(r.movie_id, r)
        }

        const films = movieRows.map(m => {
          const shaped = shapeFilm(m)
          const fr = friendByMovie.get(m.id)
          if (fr) {
            shaped.twin = {
              who: fr.users?.name || 'A friend',
              rating: Math.round((fr.rating || 10) / 2), // 0–10 → 0–5
              note: fr.review_text || null,
            }
          }
          // Lift first curated critic quote into criticLine if the film has
          // an editorial overlay row. Page hides this section when null.
          const overlay = overlayByMovie.get(m.id)
          const firstQuote = Array.isArray(overlay?.critic_quotes) ? overlay.critic_quotes[0] : null
          if (firstQuote?.quote) {
            const src = [firstQuote.author, firstQuote.outlet].filter(Boolean).join(', ')
            shaped.criticLine = { q: firstQuote.quote, src: src ? `— ${src}` : '' }
          }
          // Hand-curated emotional arc beats the synthesized one. Falls back
          // to shapeFilm's fit_profile-derived curve when no overlay exists.
          if (Array.isArray(overlay?.arc_points) && overlay.arc_points.length >= 4) {
            const cleaned = overlay.arc_points
              .map((n) => (typeof n === 'number' ? Math.max(0, Math.min(1, n)) : null))
              .filter((n) => n !== null)
            if (cleaned.length >= 4) shaped.arcPoints = cleaned
          }
          return shaped
        })

        // === Diary quotes by dominant mood ================================
        const diaryByAxis = {}
        for (const r of ratingRows) {
          if (!r.review_text) continue
          const axis = dominantAxisOf(r.movies?.mood_tags)
          if (diaryByAxis[axis]) continue // keep most recent only (already DESC)
          diaryByAxis[axis] = {
            quote: r.review_text.slice(0, 140),
            after: `${r.movies?.title || 'a film'}, ${timeAgo(r.rated_at)}`,
          }
        }
        const diaryQuotes = { ...FALLBACK_DIARY, ...diaryByAxis }

        // baselineMoods: array of onboarding mood keys (cozy/wired/tender/
        // fun/tense/mythic). DiscoverBody maps these into Discover's
        // 8-axis vocabulary for first-visit pre-selection. Null when the
        // user hasn't completed Onboarding Step 1 (legacy account).
        const baselineMoods = Array.isArray(userRowRes?.data?.taste_baseline_moods)
          ? userRowRes.data.taste_baseline_moods
          : []

        const learnedPrefs = learnedPrefsRes?.data || null

        // Shape recentSaves for fast lookup in scoring: just the metadata
        // we need (director, genre, mood_tags), filtered for nulls.
        const recentSaves = (savedRes?.data || [])
          .map(r => r.movies ? {
            director: r.movies.director_name || null,
            genre: r.movies.primary_genre || null,
            moodTags: r.movies.mood_tags || [],
          } : null)
          .filter(Boolean)

        setState({ films, diaryQuotes, profile, baselineMoods, learnedPrefs, recentSaves, loading: false, error: null })
      } catch (e) {
        if (abort) return
        console.error('[useDiscoverData]', e)
        setState(s => ({ ...s, loading: false, error: e?.message || 'Failed to load' }))
      }
    })()
    return () => { abort = true }
  }, [userId])

  const value = useMemo(() => state, [state])
  return <DiscoverDataContext.Provider value={value}>{children}</DiscoverDataContext.Provider>
}

export function useDiscoverData() {
  const ctx = useContext(DiscoverDataContext)
  if (!ctx) throw new Error('useDiscoverData must be inside DiscoverDataProvider')
  return ctx
}
