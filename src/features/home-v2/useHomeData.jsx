// src/features/home-v2/useHomeData.jsx
// FeelFlick — Home v2 ("The Briefing") data layer.
//
// Replaces the prototype's hardcoded FILMS / MOODS.pool / RECENT / DNA /
// FRIENDS / LISTS arrays with live Supabase reads:
//
//   USER.watched   → count of user_history rows
//   USER.name      → auth session
//   MOODS[].pool   → top 5 films from `movies` per mood axis (bridge from
//                    discover-v5: each mood ↔ multiple mood_tags)
//   RECENT         → last 4 user_ratings with movies join + review_text
//   DNA            → derived from history count + taste_fingerprint
//   FRIENDS        → user_similarity top 3 (bidirectional, like people-v2)
//   LISTS          → CURATED_LISTS config (matches lists-v2 Editorial tab)
//   CONTINUE       → null for now (no resume-progress source in DB yet)
//
// Rationale strings remain mood-keyed and static — generating per-film
// magazine prose is a follow-up.

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
// GENRES is canonical reference data (TMDB id → dbName), not feature-private.
// Used here to translate the user's user_preferences.genre_id rows into the
// dbName values our `movies.primary_genre` column stores.
import { GENRES } from '@/features/onboarding/data'
import { CURATED_LISTS } from '@/shared/lib/curatedLists'
import { computeUserProfile, scoreMovieForUser } from '@/shared/services/recommendations'
import { computeMatchPercent } from '@/shared/services/matchScore'
import { MOVIE_ENGINE_COLS } from '@/shared/services/movieFields'
import { getTasteFingerprint } from '@/shared/services/tasteCache'
import { buildPersonalLists, MIN_PERSONAL_LISTS, getSeenCandidates, getTasteTwinPulse } from './personalLists'

const HomeDataContext = createContext(null)

// === Mood axis ↔ mood_tag bridge (mirrors discover-v5) ===================
// Bridge expanded in 2026-05-21 audit so each Briefing row reaches all of
// its natural high-frequency tags. Previously gritty/mysterious/dreamy/
// haunting/inspiring/empowering/exhilarating/uplifting were unmapped (~6,000
// films invisible to the Briefing's mood-filter). Now folded into the
// closest semantic mood.
// Tags partitioned so each catalog tag belongs to EXACTLY ONE mood —
// previously `heartwarming` lived in both tender+cozy (80% pool overlap),
// `whimsical`+`lighthearted` lived in both cozy+witty. Result: same films
// surfaced across moods. Now: heartwarming→cozy, whimsical+lighthearted
// →witty, romantic→tender. Films can still appear in multiple moods if
// they have multiple distinct mood_tags, but no single tag double-counts.
const MOOD_BRIDGE = {
  tender:     ['tender', 'romantic'],
  thrilled:   ['tense', 'suspenseful', 'intense', 'thrilling', 'gritty'],
  curious:    ['contemplative', 'mind-bending', 'provocative', 'meditative', 'mysterious', 'dreamy'],
  cozy:       ['cozy', 'heartwarming'],
  melancholy: ['bittersweet', 'melancholic', 'somber', 'nostalgic', 'devastating', 'haunting'],
  witty:      ['playful', 'whimsical', 'lighthearted', 'uplifting', 'empowering', 'exhilarating', 'inspiring'],
}

// === Onboarding mood key → Briefing mood key bridge ======================
// The onboarding MoodStep uses a 6-key vocabulary (cozy/wired/tender/fun/
// tense/mythic) — see src/features/onboarding/data.js. The Briefing uses a
// different 6-key vocabulary above. This map translates the user's baseline
// picks so we can prioritise the matching Briefing rows on cold-start.
//
// 'mythic' has no clean Briefing counterpart yet; we fall back to 'curious'
// (the closest contemplative/epic register) until a dedicated row exists.
const ONBOARDING_MOOD_TO_BRIEFING = {
  cozy:   'cozy',
  wired:  'curious',
  tender: 'tender',
  fun:    'witty',
  tense:  'thrilled',
  mythic: 'curious',
}

// === Engine consistency with onboarding (2026-05-21 audit) ===============
// Mirrors src/features/onboarding/steps/MoviesStep.jsx — /home applies the
// same recency floor + gated-genre rules so the user's onboarding contract
// holds across the seam. Previously /home would surface pre-1990 films
// (Raiders of the Lost Ark 1981) and ungated Animation films (Spider-Verse)
// to users who hadn't picked those genres.
const RECENCY_FLOOR_YEAR = 1990
const GATED_PRIMARY_GENRES = new Set(['Animation', 'Family', 'Documentary', 'Horror'])

const AVATAR_PALETTE = ['#A78BFA', '#F472B6', '#7DD3FC', '#FBBF24', '#34D399', '#C084FC']
function avatarBg(id) {
  if (!id) return AVATAR_PALETTE[0]
  let h = 0
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

// === Prefetch + cache ====================================================
// Lets the onboarding completion screen warm the heaviest /home query (the
// candidate movie pool) so /home paints fast on first visit. The cache is
// keyed by userId, has a short TTL, and is consumed on read.
// Pull every column the engine + match % depend on. Source of truth in
// shared/services/movieFields.js so /home, /movie/:id, /watchlist, etc.
// all feed scoreMovieForUser the same fields and get the same score.
const CANDIDATE_SELECT = MOVIE_ENGINE_COLS
const PREFETCH_TTL_MS = 60_000
const homeCandidateCache = new Map() // userId → { candidates, watchedIds, skippedIds, fetchedAt }

// How long a skipped film stays out of the briefing's candidate pool.
// The engine's scoreMovieForUser already applies a soft skip-decay (penalty
// fades over ~7d) via negativeSignals; this is the harder "don't even show
// it" floor. 30 days feels right for the hero surface — the brand promise
// is "Films that know you," so re-pitching a rejection within 2 weeks
// undermines the promise. After 30d the engine gets another chance.
const SKIP_EXCLUSION_DAYS = 30

/**
 * Pre-fetch the candidate movie pool for /home. Safe to call from anywhere
 * (e.g. the onboarding completion screen) — failures are swallowed by callers
 * since this is a perf hint, not a correctness requirement.
 */
export async function prefetchHomeData(userId) {
  if (!userId) return
  const allMoodTags = Array.from(new Set(Object.values(MOOD_BRIDGE).flat()))
  const skipCutoffISO = new Date(Date.now() - SKIP_EXCLUSION_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const [{ data: hist }, { data: skips }] = await Promise.all([
    supabase.from('user_history').select('movie_id').eq('user_id', userId),
    supabase.from('recommendation_impressions').select('movie_id')
      .eq('user_id', userId).eq('skipped', true).gte('shown_at', skipCutoffISO),
  ])
  const watchedIds = (hist || []).map(r => r.movie_id)
  const skippedIds = Array.from(new Set((skips || []).map(r => r.movie_id)))
  const excludedIds = Array.from(new Set([...watchedIds, ...skippedIds]))

  let q = supabase
    .from('movies')
    .select(CANDIDATE_SELECT)
    .eq('is_valid', true)
    .not('poster_path', 'is', null)
    .overlaps('mood_tags', allMoodTags)
    .gte('ff_audience_confidence', 60)
    .gte('ff_audience_rating', 75)
    .order('ff_audience_rating', { ascending: false })
    .limit(150)
  if (excludedIds.length > 0) {
    q = q.not('id', 'in', `(${excludedIds.join(',')})`)
  }
  const { data } = await q
  homeCandidateCache.set(userId, {
    candidates: data || [],
    watchedIds,
    skippedIds,
    fetchedAt: Date.now(),
  })
}

// === Shape one DB movie row into the engine's film format ================
function shapeFilm(m) {
  return {
    key: `m${m.id}`,                                         // stable string key for React maps
    id: m.id,
    tmdbId: m.tmdb_id,
    title: m.title || 'Untitled',
    year: m.release_date ? new Date(m.release_date).getFullYear() : (m.release_year || ''),
    runtime: m.runtime || 110,
    director: m.director_name || 'Unknown',
    poster: m.poster_path,                                   // raw path (NOT a URL); SmartImg builds full URL
    backdrop: m.backdrop_path,                               // landscape art for hero slider bg
    synopsis: m.overview || null,                            // 2-3 line teaser for hero
    tagline: m.tagline || null,                              // short editorial tagline
    voteAverage: m.vote_average ?? null,                     // 0-10 rating (TMDB)
    language: m.original_language || null,                   // ISO 639-1 code, e.g. 'en', 'hi'
    genres: Array.isArray(m.genres) ? m.genres : [],         // [{id, name}] or [name] from TMDB sync
    mood_tags: m.mood_tags || [],
  }
}

const INITIAL = {
  user: { name: 'You', watched: 0 },
  moods: [],
  dna: null,
  friends: [],
  lists: [],
  seenCandidates: [],
  twinPulse: [],
  continueItem: null,
  loading: true,
  error: null,
}

// === Provider ============================================================

export function HomeDataProvider({ children }) {
  const { user, session } = useAuthSession()
  const userId = user?.id
  const [state, setState] = useState(INITIAL)

  useEffect(() => {
    if (!userId) {
      setState({ ...INITIAL, loading: false })
      return
    }
    let abort = false
    setState(s => ({ ...s, loading: true, error: null }))
    ;(async () => {
      try {
        // === Phase 0: consume prefetch cache if fresh ===
        // The onboarding completion screen primes this cache so the first
        // /home paint after sign-up doesn't have to wait for the heavy
        // candidate query. Always consume-and-clear so stale data can't bleed
        // across sessions.
        const cached = homeCandidateCache.get(userId)
        const cacheFresh = cached && (Date.now() - cached.fetchedAt) < PREFETCH_TTL_MS
        if (cached) homeCandidateCache.delete(userId)

        // === Phase 1: my watch history + recent skips (for exclusion) ===
        // Skips persist for SKIP_EXCLUSION_DAYS so a skipped film doesn't
        // reappear in the briefing tomorrow. The engine's negative-signal
        // model still feeds into scoreMovieForUser long-term; this exclusion
        // is the hard "don't show me this again" layer the user expects.
        // Fetched alongside history so both arrive in one round-trip phase.
        const [watchedIds, skippedIds] = cacheFresh
          ? [cached.watchedIds, cached.skippedIds || []]
          : await Promise.all([
              supabase.from('user_history').select('movie_id').eq('user_id', userId)
                .then(r => (r.data || []).map(x => x.movie_id)),
              supabase.from('recommendation_impressions').select('movie_id')
                .eq('user_id', userId).eq('skipped', true)
                .gte('shown_at', new Date(Date.now() - SKIP_EXCLUSION_DAYS * 24 * 60 * 60 * 1000).toISOString())
                .then(r => Array.from(new Set((r.data || []).map(x => x.movie_id)))),
            ])
        // Union of watched + recently-skipped — used by every downstream
        // candidate query so personal lists, twin pulse, seen candidates,
        // etc. also stop re-surfacing recent skips.
        const excludedIds = Array.from(new Set([...watchedIds, ...skippedIds]))

        // === Phase 2: candidate films + user signals (parallel) ===
        const allMoodTags = Array.from(new Set(Object.values(MOOD_BRIDGE).flat()))
        // Wider SELECT — every field scoreMovieForUser reads. The engine
        // touches ff ratings, mood/tone/fit, discovery_potential, polarization,
        // llm_* numerics, language, runtime, etc. Without these the score
        // collapses to base quality and the engine adds no value.
        let candidateQuery = supabase
          .from('movies')
          .select(CANDIDATE_SELECT)
          .eq('is_valid', true)
          .not('poster_path', 'is', null)
          .overlaps('mood_tags', allMoodTags)
          .gte('ff_audience_confidence', 60)
          .gte('ff_audience_rating', 75)
          // Audience is millennial + Gen Z — match the recency floor onboarding
          // applies so pre-1990 films don't surface in the Briefing either.
          .gte('release_year', RECENCY_FLOOR_YEAR)
          .order('ff_audience_rating', { ascending: false })
          .limit(150)
        if (excludedIds.length > 0) {
          candidateQuery = candidateQuery.not('id', 'in', `(${excludedIds.join(',')})`)
        }

        const [moviesRes, ratingsRes, fingerprint, simARes, simBRes, userRowRes, prefsRes] = await Promise.all([
          cacheFresh ? Promise.resolve({ data: cached.candidates }) : candidateQuery,
          // Only fetch what computeRuntimeMedian needs — previously this also
          // powered a "diary cards" row that was removed; the heavier payload
          // (title/poster_path/director_name/mood_tags/review_text) was dead
          // weight on every /home mount.
          supabase
            .from('user_ratings')
            .select('movies!inner(runtime)')
            .eq('user_id', userId)
            .order('rated_at', { ascending: false })
            .limit(4),
          // getTasteFingerprint returns the cached fingerprint when fresh
          // (24h TTL), otherwise aggregates mood_tags / tone_tags /
          // fit_profile from the user's watch history, writes the result
          // back, and returns it. Null until the user has ≥5 logged films.
          getTasteFingerprint(userId),
          supabase
            .from('user_similarity')
            .select('user_b_id, overall_similarity, movies_in_common, users!user_similarity_user_b_fkey(id, name)')
            .eq('user_a_id', userId)
            .order('overall_similarity', { ascending: false })
            .limit(3),
          supabase
            .from('user_similarity')
            .select('user_a_id, overall_similarity, movies_in_common, users!user_similarity_user_a_fkey(id, name)')
            .eq('user_b_id', userId)
            .order('overall_similarity', { ascending: false })
            .limit(3),
          // taste_baseline_moods is the cold-start mood signal from Onboarding
          // Step 1. We use it to re-order the per-mood Briefing rows so the
          // user's selected moods come first until they have enough history to
          // be predictive.
          supabase
            .from('users')
            .select('taste_baseline_moods')
            .eq('id', userId)
            .maybeSingle(),
          // user_preferences drives the gated-genre filter — if the user didn't
          // pick Animation/Family/Documentary/Horror in onboarding, films with
          // that primary_genre are excluded client-side after the candidate fetch.
          // .eq('excluded', false) skips legacy avoid rows (would otherwise
          // UNLOCK the gate for an avoided gated genre).
          supabase
            .from('user_preferences')
            .select('genre_id')
            .eq('user_id', userId)
            .eq('excluded', false),
        ])
        if (abort) return

        // Raw movie rows (engine reads from these — don't lose fields by
        // running them through shapeFilm before scoring).
        const rawCandidatesUnfiltered = moviesRes.data || []

        // === Gated-genre client-side filter ============================
        // Mirrors onboarding's MoviesStep: films whose primary_genre is in the
        // niche set (Animation/Family/Documentary/Horror) are excluded unless
        // the user explicitly picked that genre in onboarding Step 2.
        const userGenreNames = new Set(
          (prefsRes.data || [])
            .map(p => GENRES.find(g => g.id === p.genre_id)?.dbName)
            .filter(Boolean)
        )
        const blockedGenres = new Set(
          [...GATED_PRIMARY_GENRES].filter(g => !userGenreNames.has(g))
        )
        const rawCandidates = blockedGenres.size > 0
          ? rawCandidatesUnfiltered.filter(m => !m.primary_genre || !blockedGenres.has(m.primary_genre))
          : rawCandidatesUnfiltered

        // === Build per-mood pools via the recommendation engine =========
        // Filter by mood_tag overlap (cheap, in-memory), then score each
        // candidate via scoreMovieForUser against the user's profile. The
        // engine reads taste fingerprint, skip decay, runtime band, fit
        // profile, language, llm_* numerics — 19 dimensions total.
        const profile = await computeUserProfile(userId).catch(e => {
          console.warn('[useHomeData] computeUserProfile failed, using empty profile:', e?.message)
          return null
        })
        if (abort) return

        // Re-order MOOD_BRIDGE so the user's baseline moods (from Onboarding
         //  Step 1) appear first. Falls back to the original order if the user
         //  hasn't picked moods (legacy onboarding, or column null).
        const baselineKeys = Array.isArray(userRowRes.data?.taste_baseline_moods)
          ? userRowRes.data.taste_baseline_moods
          : []
        const baselineBriefingKeys = baselineKeys
          .map(k => ONBOARDING_MOOD_TO_BRIEFING[k])
          .filter(Boolean)
        const orderedMoodKeys = [
          ...baselineBriefingKeys.filter(k => k in MOOD_BRIDGE),
          ...Object.keys(MOOD_BRIDGE).filter(k => !baselineBriefingKeys.includes(k)),
        ]

        // Pre-compute the union of tags belonging to OTHER moods — used by
        // the mood-coherence bonus to favor films that fit THIS mood and
        // few others. Stronger mood differentiation across the row picks.
        const allOtherMoodTagsByMood = {}
        for (const moodId of orderedMoodKeys) {
          const others = new Set()
          for (const [k, tags] of Object.entries(MOOD_BRIDGE)) {
            if (k === moodId) continue
            for (const t of tags) others.add(t)
          }
          allOtherMoodTagsByMood[moodId] = others
        }

        // Pass 1: score each mood's pool → top 30 with engineScore + reason.
        const moodsScored = orderedMoodKeys.map(moodId => {
          const bridgeTags = new Set(MOOD_BRIDGE[moodId])
          const otherTags = allOtherMoodTagsByMood[moodId]
          // Only score candidates that match the mood's bridge tags. Keeps
          // per-mood pools coherent; the engine doesn't know about home-v2's
          // editorial mood vocabulary.
          const moodPool = rawCandidates.filter(m =>
            Array.isArray(m.mood_tags) && m.mood_tags.some(t => bridgeTags.has(t))
          )
          // Mood-coherence bonus: reward films whose mood_tags strongly hit
          // THIS mood and rarely hit other moods. Without this, top-tier
          // films (e.g., Forrest Gump tagged ['heartwarming','tender',
          // 'bittersweet','uplifting']) would surface in every mood because
          // their base engine score dominates. The bonus tilts the ranking
          // toward films that ARE this mood.
          const coherenceBonus = (m) => {
            if (!Array.isArray(m.mood_tags) || m.mood_tags.length === 0) return 0
            const hitsThis = m.mood_tags.filter(t => bridgeTags.has(t)).length
            const hitsOther = m.mood_tags.filter(t => otherTags.has(t)).length
            if (hitsThis === 0) return 0
            const ratio = hitsThis / (hitsThis + hitsOther)
            // 0..1 ratio → 0..30 points. Films purely in this mood get +30;
            // films spanning many moods get +5-15.
            return Math.round(ratio * 30)
          }
          // Two scores per film:
          //   • engineScore — base scoreMovieForUser output (mood-agnostic).
          //     Used for the display match % via computeMatchPercent.
          //     The SAME film–user pair gets the same engineScore in any mood.
          //   • rankingScore = engineScore + coherenceBonus. Used for sort
          //     order so mood-coherent films float to the top of each mood,
          //     WITHOUT inflating the displayed match %.
          const scored = profile
            ? moodPool.map(m => {
                const result = scoreMovieForUser(m, profile, 'default')
                if (!result) return null  // boundary filter dropped this film
                const { score, pickReason } = result
                return {
                  raw: m,
                  engineScore: score,
                  rankingScore: score + coherenceBonus(m),
                  reason: pickReason?.label || null,
                }
              }).filter(Boolean)
            // Cold-start: no user profile. Use mood-tag-overlap × 10 +
            // ff_audience_rating as a stand-in engineScore (typical 60-110
            // range), plus coherence bonus for ranking.
            : moodPool.map(m => {
                const hit = m.mood_tags.filter(t => bridgeTags.has(t)).length
                const baseScore = hit * 10 + (m.ff_audience_rating || 0)
                return {
                  raw: m,
                  engineScore: baseScore,
                  rankingScore: baseScore + coherenceBonus(m),
                  reason: null,
                }
              })
          const top = scored
            .sort((a, b) => b.rankingScore - a.rankingScore)
            .slice(0, 30) // 30-deep pool → ~27 hides of headroom per mood
            .map(s => ({ ...shapeFilm(s.raw), engineReason: s.reason, engineScore: s.engineScore }))
          return { moodId, top }
        })

        // Pass 2: attach matchPct via the shared computeMatchPercent helper.
        // The % comes from the BASE engineScore (mood-agnostic) so the same
        // film–user pair shows the SAME % everywhere it appears (cross-mood
        // on /home, plus /watchlist, /movie/:id, /history etc. which use
        // the same helper). Mood coherence already shaped the ranking via
        // rankingScore in Pass 1; it intentionally doesn't influence the
        // displayed %.
        const moods = moodsScored.map(({ moodId, top }) => {
          const topWithMatch = top.map(t => ({
            ...t,
            matchPct: computeMatchPercent({ engineScore: t.engineScore, profile }),
          }))
          const rationale = Object.fromEntries(
            topWithMatch.map(f => [f.key, f.engineReason])  // may be null
          )
          return { id: moodId, pool: topWithMatch.map(f => f.key), rationale, films: topWithMatch }
        })

        // === DNA from fingerprint + history count ====================
        // `fingerprint` is now the result of getTasteFingerprint above —
        // either the cached value, the freshly computed one, or null when
        // the user has fewer than 5 logged films.
        const filmsLogged = watchedIds.length
        // DNA confidence ramps 0→100% over the first 30 logged films.
        const progress = Math.min(1, filmsLogged / 30)
        const filmsToNext = Math.max(0, 10 - filmsLogged) // next confidence milestone
        const topMoods = (fingerprint?.topMoodTags || [])
          .slice(0, 6)
          .map(t => ({ label: capitalize(t.key), weight: t.share }))
        const motifs = (fingerprint?.topToneTags || []).slice(0, 3).map(t => capitalize(t.key))
        const topFit = fingerprint?.topFitProfiles?.[0]?.key || null
        const runtimeMedian = computeRuntimeMedian(ratingsRes.data) || null
        const dna = {
          progress,
          filmsLogged,
          filmsToNext,
          topMoods: topMoods.length > 0 ? topMoods : null,
          motifs: motifs.length > 0 ? motifs : ['Patterns forming…'],
          // Lower-cased fit_profile (e.g., 'crowd_pleaser') — surfaced for
          // the continuity ribbon. Same data the personal-lists fit slot
          // uses; null when the fingerprint hasn't surfaced one yet.
          topFit,
          runtime: runtimeMedian
            ? { value: String(runtimeMedian), unit: 'min', note: runtimeMedian < 120 ? 'shorter than average' : 'patient runtimes' }
            : { value: '—', unit: '', note: 'rate more films' },
        }

        // === Friends from bidirectional similarity (with fallback) =====
        // Primary: user_similarity (precomputed fingerprint similarity).
        // Fallback: co-watch overlap — users who logged ≥2 of the same
        // films we have. Lets the Twins surface earn its space even for
        // users the precompute job hasn't reached yet.
        // Twin signal floor: keep a candidate only if their similarity is
        // ≥ 10% OR they share ≥ 3 films with the user. Filters the long
        // tail of "we both watched 2 of the same films" noise that the
        // co-watch fallback otherwise lets through.
        const isMeaningfulTwin = f => (f.match ?? 0) >= 0.10 || (f.common ?? 0) >= 3
        let baseFriends = [
          ...(simARes.data || []).map(r => ({ userId: r.user_b_id, name: r.users?.name, match: r.overall_similarity, common: r.movies_in_common })),
          ...(simBRes.data || []).map(r => ({ userId: r.user_a_id, name: r.users?.name, match: r.overall_similarity, common: r.movies_in_common })),
        ]
          .filter(f => f.userId && f.name)
          .filter(isMeaningfulTwin)
          .sort((a, b) => (b.match ?? 0) - (a.match ?? 0))
          .slice(0, 3)

        if (baseFriends.length === 0 && watchedIds && watchedIds.length >= 2) {
          // Co-watch fallback
          const { data: cohabit } = await supabase
            .from('user_history')
            .select('user_id, movie_id')
            .in('movie_id', watchedIds)
            .neq('user_id', userId)
          const overlap = new Map()
          for (const r of (cohabit || [])) {
            overlap.set(r.user_id, (overlap.get(r.user_id) || 0) + 1)
          }
          const fallbackIds = [...overlap.entries()]
            .filter(([, c]) => c >= 2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([id, c]) => ({ id, common: c }))
          if (fallbackIds.length > 0) {
            const { data: fallbackUsers } = await supabase
              .from('users')
              .select('id, name')
              .in('id', fallbackIds.map(f => f.id))
            const nameById = Object.fromEntries((fallbackUsers || []).map(u => [u.id, u.name]))
            // Estimated match % via Jaccard-ish: overlap / max(watchedIds.length, twin_count)
            // Twin's full count would need another query; we approximate with
            // the user's own count as the denominator.
            baseFriends = fallbackIds
              .filter(f => nameById[f.id])
              .map(f => ({
                userId: f.id,
                name: nameById[f.id],
                match: Math.min(1, f.common / Math.max(watchedIds.length, 1)),
                common: f.common,
              }))
              // Same floor as the precomputed path — surface twins only
              // when there's real overlap, not noise.
              .filter(isMeaningfulTwin)
          }
        }

        // Pull each friend's most-recent rated film for the "Last · <title> · <ago>"
        // caption. One query for all friends, then reduce to first-per-user.
        let lastByFriend = new Map()
        if (baseFriends.length > 0) {
          const { data: friendRecents } = await supabase
            .from('user_ratings')
            .select('user_id, rated_at, movies!inner(title)')
            .in('user_id', baseFriends.map(f => f.userId))
            .order('rated_at', { ascending: false })
            .limit(baseFriends.length * 5)
          for (const r of friendRecents || []) {
            if (!lastByFriend.has(r.user_id)) {
              lastByFriend.set(r.user_id, { title: r.movies?.title || null, ratedAt: r.rated_at })
            }
          }
        }

        const friends = baseFriends.map(f => {
          const recent = lastByFriend.get(f.userId)
          return {
            userId: f.userId,
            name: f.name,
            match: Math.round((f.match ?? 0) * 100),
            avatarBg: avatarBg(f.userId),
            last: recent?.title || '—',
            lastWhen: recent?.ratedAt ? formatRelativeShort(recent.ratedAt) : '',
            overlap: `${f.common ?? 0} film${f.common === 1 ? '' : 's'} in common`,
          }
        })

        // === Lists row — personal first, curated fallback ===============
        // Try dynamically-generated personal lists (director affinity,
        // semantic neighbors, top genre, preferred decade). When the user
        // is cold-start (no fingerprint) or no slot can be filled, fall
        // back to the static CURATED_LISTS row sorted by fit_profile.
        // `watchedIds` here is actually the union of watched + recently-
        // skipped — the slot builders use it solely for the `.not('id','in')`
        // exclusion, so passing skips in propagates the "don't re-show me
        // this" promise across every personal list slot too.
        const personalLists = await buildPersonalLists({
          supabase, userId, profile, fingerprint, watchedIds: excludedIds, paletteForSlug,
        }).catch(e => {
          console.warn('[useHomeData] buildPersonalLists failed:', e?.message)
          return []
        })

        let lists
        if (personalLists.length >= MIN_PERSONAL_LISTS) {
          lists = personalLists
        } else {
          // Cold-start fallback: original curated-lists logic. Sorts the
          // 4 visible lists by the user's top fit_profile (which is 0 for
          // brand-new users, preserving config order).
          const SLUG_FIT = {
            'prestige-drama-2020s':  'prestige_drama',
            'challenging-art':       'challenging_art',
            'festival-discoveries':  'festival_discovery',
            'cult-classics':         'cult_classic',
            'comfort-watches':       'comfort_watch',
            'crowd-pleasers':        'crowd_pleaser',
          }
          const fitShareByKey = Object.fromEntries(
            (fingerprint?.topFitProfiles || []).map(p => [p.key, p.share])
          )
          const scored = CURATED_LISTS.map((c, i) => ({
            config: c,
            origIndex: i,
            score: fitShareByKey[SLUG_FIT[c.slug]] ?? 0,
          }))
          scored.sort((a, b) => (b.score - a.score) || (a.origIndex - b.origIndex))
          const curatedSlice = scored.slice(0, 4).map(s => s.config)
          const listResults = await Promise.all(
            curatedSlice.map(c => c.query(supabase).limit(3))
          )
          lists = curatedSlice.map((c, i) => {
            const rows = listResults[i]?.data || []
            return {
              id: c.slug,
              slug: c.slug,
              title: c.title,
              blurb: c.description,
              palette: paletteForSlug(c.slug),
              posters: rows.map(r => r.poster_path).filter(Boolean),
              kind: 'curated',
            }
          })
        }

        // === Seen-candidates for the quick-log surface =================
        // Films the engine guesses the user has probably watched (popular
        // in their fit_profile/genre, well-rated, not yet logged) — surfaced
        // on /home so users can confirm with one tap.
        // Horizontal row holds more depth than the previous grid, so we
        // ask for ~16 candidates — scrollable but not exhaustive.
        // Run in parallel with the taste-twin pulse fetch (both hit
        // independent tables, no shared dependencies).
        const [seenCandidates, twinPulse] = await Promise.all([
          // Quick-log surface should also stop re-asking about films the
          // user has skipped — same UX promise as the briefing.
          getSeenCandidates({
            supabase, profile, fingerprint, watchedIds: excludedIds, limit: 16,
          }).catch(e => {
            console.warn('[useHomeData] getSeenCandidates failed:', e?.message)
            return []
          }),
          // Twin pulse: pass the union for the displayed-film filter, but
          // pass real watch history as `historyIds` for the co-watch lookup
          // (finding twins). Treating skipped films as "watched" would
          // pollute the twin signature — a user who watched a film I
          // skipped isn't necessarily a taste twin.
          getTasteTwinPulse({
            supabase, userId, profile,
            watchedIds: excludedIds,    // displayed-film filter (was watchedIds)
            historyIds: watchedIds,     // co-watch lookup (kept narrow)
            windowDays: 21, limit: 12,
          }).catch(e => {
            console.warn('[useHomeData] getTasteTwinPulse failed:', e?.message)
            return []
          }),
        ])

        // === User block ============================================
        const name = session?.user?.user_metadata?.full_name?.split(' ')[0]
          || session?.user?.user_metadata?.name?.split(' ')[0]
          || session?.user?.email?.split('@')[0]
          || 'You'

        setState({
          user: { name, watched: filmsLogged },
          moods,
          dna,
          friends,
          lists,
          seenCandidates,
          twinPulse,
          continueItem: null, // no resume-progress source yet
          loading: false,
          error: null,
        })
      } catch (e) {
        if (abort) return
        console.error('[useHomeData]', e)
        setState(s => ({ ...s, loading: false, error: e?.message || 'Failed to load' }))
      }
    })()
    return () => { abort = true }
  }, [userId, session])

  const value = useMemo(() => state, [state])
  return <HomeDataContext.Provider value={value}>{children}</HomeDataContext.Provider>
}

export function useHomeData() {
  const ctx = useContext(HomeDataContext)
  if (!ctx) throw new Error('useHomeData must be inside HomeDataProvider')
  return ctx
}

// === Helpers =============================================================

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ').replace(/-/g, ' ') : ''
}

function computeRuntimeMedian(rows) {
  const runtimes = (rows || []).map(r => r.movies?.runtime).filter(Boolean).sort((a, b) => a - b)
  if (runtimes.length === 0) return null
  const mid = Math.floor(runtimes.length / 2)
  return runtimes.length % 2 === 0 ? Math.round((runtimes[mid - 1] + runtimes[mid]) / 2) : runtimes[mid]
}

// Short, editorial relative timestamps (e.g. "2d", "5h", "just now") for the
// friend rail's "Last · <title> · <ago>" caption.
function formatRelativeShort(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ''
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000))
  if (mins < 1)        return 'just now'
  if (mins < 60)       return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24)      return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7)        return `${days}d`
  const weeks = Math.floor(days / 7)
  if (weeks < 5)       return `${weeks}w`
  const months = Math.floor(days / 30)
  if (months < 12)     return `${months}mo`
  return `${Math.floor(days / 365)}y`
}

// Deterministic palette per slug — gives editorial list cards visual rhythm
const PALETTE_POOL = [
  ['#7C3AED', '#1e1b4b'],
  ['#F59E0B', '#451a03'],
  ['#EC4899', '#831843'],
  ['#06B6D4', '#164e63'],
  ['#34D399', '#064e3b'],
  ['#A78BFA', '#312e81'],
]
function paletteForSlug(slug) {
  if (!slug) return PALETTE_POOL[0]
  let h = 0
  for (let i = 0; i < slug.length; i++) h = ((h << 5) - h + slug.charCodeAt(i)) | 0
  return PALETTE_POOL[Math.abs(h) % PALETTE_POOL.length]
}
