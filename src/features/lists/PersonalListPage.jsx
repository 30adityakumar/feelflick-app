// FeelFlick — /lists/personal/:type
//
// Full-list view for the dynamically-generated personal lists surfaced on
// /home. Mirrors CuratedListV2's editorial layout (sticky meta left, poster
// grid right). Reads `:type` from the URL and resolves dynamic title/copy
// + a Supabase query from the search params:
//
//   /lists/personal/director?director=Frank+Darabont
//   /lists/personal/similar?seed=12345&title=Forrest+Gump
//   /lists/personal/genre?genre=Drama&display=Drama
//   /lists/personal/decade?decade=2010s
//
// Falls back to a "list not found" view if the type is unknown or the
// generated query yields zero films.

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { MOVIE_ENGINE_COLS } from '@/shared/services/movieFields'
import { computeUserProfile, rankSlotCandidates } from '@/shared/services/recommendations'
import { applyAllExclusions, applyExclusionsNoLanguage } from '@/shared/services/exclusions'
import './lists.css'

// Mirrors the home-card recency floor — pre-1990 stays hidden unless the
// user has logged a pre-1990 film (toleratesClassics).
const RECENCY_FLOOR = 1990
function recencyFloor(profile) {
  if (profile?.preferences?.toleratesClassics === false) return RECENCY_FLOOR
  return null
}

// PostgREST `.not('id', 'in', '(...)')` errors when the array is empty.
function applyExcludeIds(query, ids) {
  if (!ids || ids.length === 0) return query
  return query.not('id', 'in', `(${ids.join(',')})`)
}

const HP = {
  bgDeep: '#06060a',
  border: 'rgba(255,255,255,0.08)', borderStrong: 'rgba(255,255,255,0.14)',
  text: '#FAFAFA', textSoft: 'rgba(250,250,250,0.72)', textMuted: 'rgba(250,250,250,0.45)', textFaint: 'rgba(250,250,250,0.28)',
  purple: '#A78BFA', pink: '#EC4899',
}
const HP_GRAD = 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)'
const RESET_BTN = { background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }
const TMDB_IMG = (path, size = 'w342') => path ? `https://image.tmdb.org/t/p/${size}${path}` : null

// Candidate pool fetched before engine rerank. Wider than the final 30
// because we want the engine to have material to rank within.
const POOL_SIZE = 100
const ROW_LIMIT = 30

// Resolve the slot config for a given list type + URL params. Returns
// the metadata the page renders (kicker / title / description) plus the
// engine-ranking inputs (`fetchPool`, `placement`, `boost`, `pickReasonFor`,
// `rowType`) that get forwarded to `rankSlotCandidates`. Returns null when
// params are incomplete (page shows "list not found").
//
// fetchPool returns `{ candidates, embeddingNeighbors? }`. The similar slot
// uses embeddingNeighbors so the engine helper's embedding-boost curve
// fires; other slots leave it empty and rely on the slot-specific boost.
function resolveList({ type, params, excludeIds, profile }) {
  const floor = recencyFloor(profile)

  if (type === 'director') {
    const name = params.get('director')
    if (!name) return null
    return {
      kicker: 'For you · Director',
      title: `More from ${name}`,
      description: `${name}'s filmography, ranked for your taste — films you haven't logged yet.`,
      placement: 'director_spotlight',
      diversity: false,
      boost: { director: name, directorAmount: 15 },
      pickReasonFor: (m) => ({ label: `${name} · ${m.primary_genre || 'Film'}`, type: 'personal_director' }),
      fetchPool: async () => {
        let q = supabase
          .from('movies')
          .select(MOVIE_ENGINE_COLS)
          .ilike('director_name', name)
          .eq('is_valid', true)
          .not('poster_path', 'is', null)
          .order('ff_audience_rating', { ascending: false, nullsFirst: false })
          .limit(POOL_SIZE)
        q = applyAllExclusions(q, profile)
        if (floor != null) q = q.gte('release_year', floor)
        q = applyExcludeIds(q, excludeIds)
        const { data } = await q
        return { candidates: data || [] }
      },
    }
  }

  if (type === 'similar') {
    const seedId = parseInt(params.get('seed'), 10)
    const seedTitle = params.get('title') || 'a film you loved'
    if (!Number.isFinite(seedId)) return null
    return {
      kicker: 'For you · Because you loved',
      title: `Because you loved ${seedTitle}`,
      description: `Films that share ${seedTitle}'s DNA — pulled from the embedding space and re-ranked for your taste.`,
      placement: 'because_you_loved',
      pickReasonFor: (_m, { embeddingReason }) => ({
        label: `Similar to ${embeddingReason?.seedTitle || seedTitle}`,
        type: 'personal_similar',
        seedTitle: embeddingReason?.seedTitle || seedTitle,
        seedId,
      }),
      fetchPool: async () => {
        const excl = excludeIds && excludeIds.length > 0 ? excludeIds : [seedId]
        const { data: neighbors, error } = await supabase.rpc('get_seed_neighbors', {
          seed_ids: [seedId],
          exclude_ids: excl,
          top_n: POOL_SIZE,
          min_ff_rating: 70,
        })
        if (error || !neighbors || neighbors.length === 0) return { candidates: [] }
        const ids = neighbors.map(n => n.id)
        // Allow cross-language for taste expansion via embeddings;
        // genre/era/community filters still apply via the engine helper.
        let pool = supabase
          .from('movies')
          .select(MOVIE_ENGINE_COLS)
          .in('id', ids)
        pool = applyExclusionsNoLanguage(pool, profile)
        const { data: rows } = await pool
        if (!rows) return { candidates: [] }
        // Hoist embedding-neighbor metadata onto each row so rankSlotCandidates
        // applies the full embedding-similarity boost curve when scoring.
        const simById = Object.fromEntries(neighbors.map(n => [n.id, n.similarity]))
        const enriched = rows
          .filter(m => floor == null || (m.release_year ?? 9999) >= floor)
          .map(m => ({
            ...m,
            _embeddingSimilarity: simById[m.id] ?? null,
            _matchedSeedId: seedId,
            _matchedSeedTitle: seedTitle,
          }))
        return { candidates: enriched }
      },
    }
  }

  if (type === 'genre') {
    const dbName = params.get('genre')
    const display = params.get('display') || dbName
    if (!dbName) return null
    return {
      kicker: `For you · ${display}`,
      title: `Your ${display} corner`,
      description: `${display} films ranked by what fits your taste — pulled from the genre you watch most.`,
      placement: 'favorite_genres',
      diversity: false,
      boost: { primaryGenre: dbName, primaryGenreAmount: 20 },
      pickReasonFor: () => ({ label: `Because you love ${display}`, type: 'personal_genre' }),
      fetchPool: async () => {
        let q = supabase
          .from('movies')
          .select(MOVIE_ENGINE_COLS)
          .eq('primary_genre', dbName)
          .gte('ff_audience_confidence', 60)
          .eq('is_valid', true)
          .not('poster_path', 'is', null)
          .order('ff_audience_rating', { ascending: false })
          .limit(POOL_SIZE)
        q = applyAllExclusions(q, profile)
        if (floor != null) q = q.gte('release_year', floor)
        q = applyExcludeIds(q, excludeIds)
        const { data } = await q
        return { candidates: data || [] }
      },
    }
  }

  if (type === 'fit') {
    const fitKey = params.get('fit')
    const label = params.get('label') || fitKey
    const titleLabel = params.get('title') || label
    if (!fitKey) return null
    return {
      kicker: `For you · ${titleLabel}`,
      title: `Your ${label} corner`,
      description: `${titleLabel} films — pulled from the engine's "${fitKey}" fit class, ranked for your taste.`,
      // TODO migrate placement enum: add 'fit_profile_match'. See personalLists.js.
      placement: 'favorite_genres',
      diversity: false,
      boost: { fitProfile: fitKey, fitProfileAmount: 15 },
      pickReasonFor: () => ({ label: `Matches your ${label} taste`, type: 'personal_fit' }),
      fetchPool: async () => {
        let q = supabase
          .from('movies')
          .select(MOVIE_ENGINE_COLS)
          .eq('fit_profile', fitKey)
          .gte('ff_audience_confidence', 60)
          .eq('is_valid', true)
          .not('poster_path', 'is', null)
          .order('ff_audience_rating', { ascending: false })
          .limit(POOL_SIZE)
        q = applyAllExclusions(q, profile)
        if (floor != null) q = q.gte('release_year', floor)
        q = applyExcludeIds(q, excludeIds)
        const { data } = await q
        return { candidates: data || [] }
      },
    }
  }

  if (type === 'actor') {
    const name = params.get('actor')
    if (!name) return null
    return {
      kicker: 'For you · Actor',
      title: `More with ${name}`,
      description: `Films starring ${name}, ranked by your taste — and excluding what you've already logged.`,
      // TODO migrate placement enum: add 'actor_spotlight'. See personalLists.js.
      placement: 'favorite_genres',
      diversity: false,
      pickReasonFor: (m) => ({ label: `${name} · ${m.primary_genre || 'Film'}`, type: 'personal_actor' }),
      fetchPool: async () => {
        let q = supabase
          .from('movies')
          .select(MOVIE_ENGINE_COLS)
          .ilike('lead_actor_name', name)
          .eq('is_valid', true)
          .not('poster_path', 'is', null)
          .order('ff_audience_rating', { ascending: false, nullsFirst: false })
          .limit(POOL_SIZE)
        q = applyAllExclusions(q, profile)
        if (floor != null) q = q.gte('release_year', floor)
        q = applyExcludeIds(q, excludeIds)
        const { data } = await q
        return { candidates: data || [] }
      },
    }
  }

  return null
}

export default function PersonalListPage() {
  const { type } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuthSession()
  const [excludeIds, setExcludeIds] = useState([])
  const [profile, setProfile] = useState(null)
  // auxLoaded flips true once watch-history + profile have both settled.
  // The resolver depends on profile to apply the engine's exclusion stack,
  // so we wait until both are ready before computing the query.
  const [auxLoaded, setAuxLoaded] = useState(false)
  const resolved = useMemo(
    () => (!auxLoaded ? null : resolveList({ type, params, excludeIds, profile })),
    [type, params, excludeIds, profile, auxLoaded],
  )
  usePageMeta({ title: resolved?.title ? `${resolved.title} — FeelFlick` : 'Personal list — FeelFlick' })

  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error

  // Load (a) watched ids for exclusion, (b) full taste profile for the
  // engine rerank + exclusions. Both run in parallel.
  useEffect(() => {
    let abort = false
    if (!user?.id) { setExcludeIds([]); setProfile(null); setAuxLoaded(true); return }
    Promise.all([
      supabase.from('user_history').select('movie_id').eq('user_id', user.id),
      computeUserProfile(user.id).catch(() => null),
    ]).then(([hist, prof]) => {
      if (abort) return
      setExcludeIds(((hist?.data) || []).map(r => r.movie_id))
      setProfile(prof)
      setAuxLoaded(true)
    })
    return () => { abort = true }
  }, [user?.id])

  useEffect(() => {
    if (!auxLoaded) return
    if (!resolved) { setLoading(false); return }
    let abort = false
    setLoading(true)
    ;(async () => {
      const { candidates = [], embeddingNeighbors = [] } = await resolved.fetchPool()
      if (abort) return
      // Cold-start (no profile): the engine helper short-circuits, so
      // just slice the rating-ordered pool. With profile: full engine
      // pipeline — scoreMovieForUser w/ row weights + embedding boost +
      // slot boost + diversity filter + impression logging.
      if (!profile) {
        setMovies(candidates.slice(0, ROW_LIMIT))
        setLoading(false)
        return
      }
      const ranked = await rankSlotCandidates({
        userId: user?.id,
        profile,
        candidates,
        embeddingNeighbors,
        rowType: 'favorite_genres',
        placement: resolved.placement,
        limit: ROW_LIMIT,
        boost: resolved.boost,
        pickReasonFor: resolved.pickReasonFor,
        // Single-dimension slots (director/genre/actor/fit) opt out so the
        // 3-per-director / 5-per-genre caps don't decimate the row. Similar
        // slot leaves it on (embedding neighbors naturally span dimensions).
        diversity: resolved.diversity !== false,
      })
      if (abort) return
      // rankSlotCandidates returns rows with _score etc.; the grid only
      // reads movie fields so the spread shape passes through unchanged.
      setMovies(ranked.length > 0 ? ranked : candidates.slice(0, ROW_LIMIT))
      setLoading(false)
    })().catch(err => {
      if (abort) return
      console.error('[PersonalListPage] load error:', err)
      setLoading(false)
    })
    return () => { abort = true }
  }, [resolved, auxLoaded, profile, user?.id])

  // Snapshot this personal list as a permanent user-owned `lists` row +
  // batch insert `list_movies` rows. After insert, navigate to the saved
  // list page (`/lists/:listId`) where the existing share + edit UI
  // takes over. Default `is_public: true` (matches the lists table
  // default) so the share URL works for anyone.
  const handleSaveList = async () => {
    if (!user?.id || !resolved || movies.length === 0) return
    setSaveState('saving')
    try {
      // Prepend the author's first name to the snapshot title so the saved
      // list reads as personal curation rather than editorial. e.g.
      // "More from Christopher Nolan" → "Aditya's More from Christopher Nolan".
      // When shared, other users see whose taste shaped the picks.
      const authorName = user.user_metadata?.full_name
        || user.user_metadata?.name
        || user.email?.split('@')[0]
        || null
      const firstName = authorName ? authorName.split(' ')[0] : null
      const savedTitle = firstName ? `${firstName}'s ${resolved.title}` : resolved.title

      const { data: list, error: listErr } = await supabase
        .from('lists')
        .insert({
          user_id: user.id,
          title: savedTitle,
          description: resolved.description || null,
          is_public: true,
        })
        .select('id')
        .single()
      if (listErr) throw listErr

      const rows = movies.map((m, i) => ({
        list_id: list.id,
        movie_id: m.id,
        position: i + 1,
      }))
      const { error: itemsErr } = await supabase.from('list_movies').insert(rows)
      if (itemsErr) throw itemsErr

      setSaveState('saved')
      navigate(`/lists/${list.id}`)
    } catch (err) {
      console.error('[PersonalListPage] save error:', err)
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 2200)
    }
  }

  // Wait for the aux fetch (watch history + profile) before deciding
  // "not found" — when aux isn't loaded we can't yet build the resolved
  // query, and we don't want to flash the 404 view.
  if (!auxLoaded) return <LoadingShell />
  if (!resolved) return <NotFound onBack={() => navigate('/lists')} />

  return (
    <div className="ff-lists-v2" style={{ minHeight: '100vh', background: HP.bgDeep, color: HP.text, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <section className="ff-lists-section" style={{ padding: '56px 88px 24px' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{ ...RESET_BTN, fontSize: 11, color: HP.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Outfit', marginBottom: 24 }}
          >
            ← Back
          </button>
        </section>

        <section className="ff-lists-section" style={{ padding: '0 88px 80px' }}>
          <div className="ff-lists-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 64, alignItems: 'flex-start' }}>
            {/* LEFT — sticky meta */}
            <div className="ff-lists-detail-meta" style={{ position: 'sticky', top: 32 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 14 }}>{resolved.kicker}</div>
              <h1 className="ff-lists-detail-h1" style={{ fontFamily: 'Outfit', fontSize: 52, lineHeight: 1, fontWeight: 400, letterSpacing: '-0.04em', color: HP.text, margin: 0, textWrap: 'balance' }}>
                {resolved.title}
              </h1>
              {resolved.description && (
                <p style={{ marginTop: 20, fontSize: 15, color: HP.textSoft, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic', lineHeight: 1.6, textWrap: 'pretty' }}>
                  &ldquo;{resolved.description}&rdquo;
                </p>
              )}
              <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.06em' }}>
                <span>{loading ? 'Loading…' : `${movies.length} film${movies.length === 1 ? '' : 's'}`}</span>
                <span>·</span>
                <span>Built from your taste profile</span>
              </div>

              {/* Save → /lists/:id, where the existing share + edit UI
                  takes over. Defaults the new list to is_public so the
                  URL is shareable. Disabled while loading, when the
                  pool is empty, or for unauthenticated viewers (the
                  Save action requires a user_id). */}
              {user?.id && !loading && movies.length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveList}
                  disabled={saveState === 'saving' || saveState === 'saved'}
                  style={{
                    marginTop: 28,
                    padding: '12px 22px', borderRadius: 8,
                    background: saveState === 'error' ? 'rgba(239,68,68,0.18)' : HP_GRAD,
                    border: 'none', color: '#fff',
                    fontFamily: 'Outfit', fontSize: 13, fontWeight: 600, letterSpacing: '0.02em',
                    cursor: saveState === 'saving' ? 'default' : 'pointer',
                    boxShadow: '0 12px 28px -8px rgba(236,72,153,0.45)',
                    opacity: saveState === 'saving' ? 0.85 : 1,
                    transition: 'all 0.25s ease',
                  }}
                >
                  {saveState === 'saving' && 'Saving…'}
                  {saveState === 'saved' && 'Saved →'}
                  {saveState === 'error' && 'Couldn’t save — try again'}
                  {saveState === 'idle' && 'Save & share this list →'}
                </button>
              )}
              <p style={{ marginTop: 10, fontSize: 11, color: HP.textFaint, fontFamily: 'Outfit', maxWidth: 280, lineHeight: 1.4 }}>
                Snapshots the current films into a list you own. Shareable link, editable later.
              </p>
            </div>

            {/* RIGHT — poster grid */}
            <div>
              {loading ? (
                <div className="ff-lists-poster-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse" style={{ aspectRatio: '2/3', borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
                  ))}
                </div>
              ) : movies.length === 0 ? (
                <div style={{ padding: '64px 0', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 500, color: HP.text }}>No films match yet</div>
                  <div style={{ fontSize: 13, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif', marginTop: 8 }}>
                    The signal that built this list didn&rsquo;t turn up films you haven&rsquo;t already seen.
                  </div>
                </div>
              ) : (
                <div className="ff-lists-poster-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                  {movies.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => m.tmdb_id && navigate(`/movie/${m.tmdb_id}`)}
                      style={{ ...RESET_BTN, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}` }}
                    >
                      <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}>
                        {m.poster_path ? (
                          <img src={TMDB_IMG(m.poster_path)} alt={m.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.04)' }} />
                        )}
                      </div>
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{ fontFamily: 'Outfit', fontSize: 13, fontWeight: 500, color: HP.text, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
                        <div style={{ fontSize: 10, color: HP.textMuted, fontFamily: 'Outfit', marginTop: 2, letterSpacing: '0.04em' }}>
                          {m.release_year || ''}{m.primary_genre ? ` · ${m.primary_genre}` : ''}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function LoadingShell() {
  return (
    <div style={{ minHeight: '100vh', background: HP.bgDeep, color: HP.text, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '80px 88px' }}>
        <div className="animate-pulse" style={{ height: 12, width: 140, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 20 }} />
        <div className="animate-pulse" style={{ height: 48, width: 360, background: 'rgba(255,255,255,0.06)', borderRadius: 6, marginBottom: 40 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{ aspectRatio: '2/3', borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function NotFound({ onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: HP.bgDeep, color: HP.text, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 18 }}>For you · 404</div>
        <h1 style={{ fontFamily: 'Outfit', fontSize: 40, fontWeight: 500, color: HP.text, margin: '0 0 18px 0', letterSpacing: '-0.025em' }}>This list isn&rsquo;t available.</h1>
        <button
          type="button"
          onClick={onBack}
          style={{ padding: '10px 18px', borderRadius: 6, background: HP_GRAD, border: 'none', color: '#fff', fontFamily: 'Outfit', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          Back to lists →
        </button>
      </div>
    </div>
  )
}
