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
import { CURATED_LISTS } from '@/app/pages/browse/curatedListsConfig'
import { computeUserProfile, scoreMovieForUser } from '@/shared/services/recommendations'

const HomeDataContext = createContext(null)

// === Mood axis ↔ mood_tag bridge (mirrors discover-v5) ===================
const MOOD_BRIDGE = {
  tender:     ['tender', 'romantic', 'heartwarming'],
  thrilled:   ['tense', 'suspenseful', 'intense', 'thrilling'],
  curious:    ['contemplative', 'mind-bending', 'provocative', 'meditative'],
  cozy:       ['cozy', 'heartwarming', 'lighthearted', 'whimsical'],
  melancholy: ['bittersweet', 'melancholic', 'somber', 'nostalgic', 'devastating'],
  witty:      ['playful', 'whimsical', 'lighthearted'],
}

// Generic rationale templates keyed by mood — used until per-film prose ships
const MOOD_RATIONALES = {
  tender:     'Two-handers and slow-burning, often bittersweet — fits your tender register.',
  thrilled:   'Tense, surprising, beautifully built — your highest-signal thriller territory.',
  curious:    'Patient cinema with a real idea at the centre — slow-thinking pick.',
  cozy:       'Soft, kind, no surprises you don’t want — comfort cinema.',
  melancholy: 'A film that earns its silence — sun-drenched ache, lingering ending.',
  witty:      'Sharp, quick, lands without sentimentality.',
}

const AVATAR_PALETTE = ['#A78BFA', '#F472B6', '#7DD3FC', '#FBBF24', '#34D399', '#C084FC']
function avatarBg(id) {
  if (!id) return AVATAR_PALETTE[0]
  let h = 0
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

function timeAgo(iso) {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const hours = Math.round(ms / 3600000)
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  const weeks = Math.round(days / 7)
  if (weeks < 5) return `${weeks}w`
  const months = Math.round(days / 30)
  return `${months}mo`
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
    mood_tags: m.mood_tags || [],
  }
}

const INITIAL = {
  user: { name: 'You', watched: 0 },
  filmsByKey: {},
  moods: [],
  recent: [],
  dna: null,
  friends: [],
  lists: [],
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
        // === Phase 1: my watch history (for "watched" count + exclude) ===
        const { data: hist } = await supabase
          .from('user_history')
          .select('movie_id')
          .eq('user_id', userId)
        const watchedIds = (hist || []).map(r => r.movie_id)

        // === Phase 2: candidate films + user signals (parallel) ===
        const allMoodTags = Array.from(new Set(Object.values(MOOD_BRIDGE).flat()))
        // Wider SELECT — every field scoreMovieForUser reads. The engine
        // touches ff ratings, mood/tone/fit, discovery_potential, polarization,
        // llm_* numerics, language, runtime, etc. Without these the score
        // collapses to base quality and the engine adds no value.
        let candidateQuery = supabase
          .from('movies')
          .select(`
            id, tmdb_id, title, release_date, release_year, runtime,
            director_name, primary_genre, poster_path, original_language,
            mood_tags, tone_tags, fit_profile,
            ff_audience_rating, ff_audience_confidence, ff_critic_rating,
            ff_final_rating, ff_rating, ff_rating_genre_normalized,
            discovery_potential, polarization_score,
            llm_pacing, llm_intensity, llm_emotional_depth,
            llm_dialogue_density, llm_attention_demand
          `)
          .eq('is_valid', true)
          .not('poster_path', 'is', null)
          .overlaps('mood_tags', allMoodTags)
          .gte('ff_audience_confidence', 60)
          .gte('ff_audience_rating', 75)
          .order('ff_audience_rating', { ascending: false })
          .limit(150)
        if (watchedIds.length > 0) {
          candidateQuery = candidateQuery.not('id', 'in', `(${watchedIds.join(',')})`)
        }

        const [moviesRes, ratingsRes, fingerprintRes, simARes, simBRes] = await Promise.all([
          candidateQuery,
          supabase
            .from('user_ratings')
            .select('movie_id, rating, review_text, rated_at, movies!inner(id, tmdb_id, title, release_date, runtime, director_name, poster_path, mood_tags)')
            .eq('user_id', userId)
            .order('rated_at', { ascending: false })
            .limit(4),
          supabase
            .from('user_profiles_computed')
            .select('taste_fingerprint')
            .eq('user_id', userId)
            .maybeSingle(),
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
        ])
        if (abort) return

        // Raw movie rows (engine reads from these — don't lose fields by
        // running them through shapeFilm before scoring).
        const rawCandidates = moviesRes.data || []

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

        const moods = Object.keys(MOOD_BRIDGE).map(moodId => {
          const bridgeTags = new Set(MOOD_BRIDGE[moodId])
          // Only score candidates that match the mood's bridge tags. Keeps
          // per-mood pools coherent; the engine doesn't know about home-v2's
          // editorial mood vocabulary.
          const moodPool = rawCandidates.filter(m =>
            Array.isArray(m.mood_tags) && m.mood_tags.some(t => bridgeTags.has(t))
          )
          const scored = profile
            ? moodPool.map(m => {
                const result = scoreMovieForUser(m, profile, 'default')
                if (!result) return null  // boundary filter dropped this film
                const { score, pickReason } = result
                // pickReason is { label, type, ... } — unwrap to the
                // user-facing string the briefing card renders.
                return { raw: m, score, reason: pickReason?.label || null }
              }).filter(Boolean)
            // Cold-start: no user profile yet. Fall back to mood-tag overlap
            // count + ff_audience_rating tiebreak.
            : moodPool.map(m => {
                const hit = m.mood_tags.filter(t => bridgeTags.has(t)).length
                return { raw: m, score: hit * 10 + (m.ff_audience_rating || 0), reason: null }
              })
          const top = scored
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(s => ({ ...shapeFilm(s.raw), engineReason: s.reason }))
          // Use the engine's pickReason when available; otherwise fall back to
          // the curated per-mood template.
          const rationale = Object.fromEntries(
            top.map(f => [f.key, f.engineReason || MOOD_RATIONALES[moodId]])
          )
          return { id: moodId, pool: top.map(f => f.key), rationale, films: top }
        })

        // === Recent ratings → diary cards ==============================
        const recent = (ratingsRes.data || []).map(r => {
          const m = r.movies || {}
          const film = shapeFilm(m)
          return {
            key: film.key,
            film,
            rating: r.rating ? Math.round(r.rating / 2) : 0, // 0-10 → 0-5
            when: timeAgo(r.rated_at),
            note: r.review_text || null,
          }
        })

        // === Films-by-key map (for sections that read filmsByKey[key]) ===
        const filmsByKey = {}
        for (const m of moods) for (const f of m.films) filmsByKey[f.key] = f
        for (const r of recent) filmsByKey[r.key] = r.film

        // === DNA from fingerprint + history count ====================
        const fingerprint = fingerprintRes.data?.taste_fingerprint || null
        const filmsLogged = watchedIds.length
        // DNA confidence ramps 0→100% over the first 30 logged films.
        const progress = Math.min(1, filmsLogged / 30)
        const filmsToNext = Math.max(0, 10 - filmsLogged) // next confidence milestone
        const topMoods = (fingerprint?.topMoodTags || [])
          .slice(0, 3)
          .map(t => ({ label: capitalize(t.key), weight: t.share }))
        const motifs = (fingerprint?.topToneTags || []).slice(0, 3).map(t => capitalize(t.key))
        const runtimeMedian = computeRuntimeMedian(ratingsRes.data) || null
        const dna = {
          progress,
          filmsLogged,
          filmsToNext,
          topMoods: topMoods.length > 0 ? topMoods : null,
          motifs: motifs.length > 0 ? motifs : ['Patterns forming…'],
          runtime: runtimeMedian
            ? { value: String(runtimeMedian), unit: 'min', note: runtimeMedian < 120 ? 'shorter than average' : 'patient runtimes' }
            : { value: '—', unit: '', note: 'rate more films' },
        }

        // === Friends from bidirectional similarity ===================
        const baseFriends = [
          ...(simARes.data || []).map(r => ({ userId: r.user_b_id, name: r.users?.name, match: r.overall_similarity, common: r.movies_in_common })),
          ...(simBRes.data || []).map(r => ({ userId: r.user_a_id, name: r.users?.name, match: r.overall_similarity, common: r.movies_in_common })),
        ]
          .filter(f => f.userId && f.name)
          .sort((a, b) => (b.match ?? 0) - (a.match ?? 0))
          .slice(0, 3)

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

        // === Curated lists (matches lists-v2 Editorial tab) ==========
        const lists = CURATED_LISTS.slice(0, 4).map(c => ({
          id: c.slug,
          slug: c.slug,
          title: c.title,
          count: 40, // CURATED_LISTS queries cap at 40
          blurb: c.description,
          palette: paletteForSlug(c.slug),
        }))

        // === User block ============================================
        const name = session?.user?.user_metadata?.full_name?.split(' ')[0]
          || session?.user?.user_metadata?.name?.split(' ')[0]
          || session?.user?.email?.split('@')[0]
          || 'You'

        setState({
          user: { name, watched: filmsLogged },
          filmsByKey,
          moods,
          recent,
          dna,
          friends,
          lists,
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
