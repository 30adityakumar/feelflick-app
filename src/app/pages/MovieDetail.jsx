// src/app/pages/MovieDetail.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import {
  Play, Bookmark, CheckCheck, Check, Star, Clock, Calendar, ChevronRight, Tv2
} from 'lucide-react'

const IMG = {
  backdrop: (p) => (p ? `https://image.tmdb.org/t/p/w1280${p}` : ''),
  poster:   (p) => (p ? `https://image.tmdb.org/t/p/w342${p}`  : ''),
  profile:  (p) => (p ? `https://image.tmdb.org/t/p/w185${p}`  : ''),
  logo:     (p) => (p ? `https://image.tmdb.org/t/p/w92${p}`   : ''),
}

const TMDB = {
  base: 'https://api.themoviedb.org/3',
  key:  import.meta.env.VITE_TMDB_API_KEY,
}

function formatRuntime(mins) {
  if (!mins) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${m}m` : `${m}m`
}
const yearOf = (d) => d?.slice?.(0, 4) || ''

export default function MovieDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [movie, setMovie] = useState(null)
  const [cast, setCast] = useState([])
  const [videos, setVideos] = useState([])
  const [similar, setSimilar] = useState([])
  const [recs, setRecs] = useState([])

  const [providers, setProviders] = useState({ flatrate: [], rent: [], buy: [], link: '' })

  // auth + watchlist status: null | 'want_to_watch' | 'watched'
  const [user, setUser] = useState(null)
  const [wlStatus, setWlStatus] = useState(null)
  const [mutating, setMutating] = useState(false)

  useEffect(() => {
    let unsub
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null))
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
    })
    unsub = data?.subscription?.unsubscribe
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  // TMDB data
  useEffect(() => {
    let abort = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (!TMDB.key) throw new Error('TMDB key missing')
        const [d, c, v, s, r] = await Promise.all([
          fetch(`${TMDB.base}/movie/${id}?api_key=${TMDB.key}&language=en-US`).then(r => r.json()),
          fetch(`${TMDB.base}/movie/${id}/credits?api_key=${TMDB.key}&language=en-US`).then(r => r.json()),
          fetch(`${TMDB.base}/movie/${id}/videos?api_key=${TMDB.key}&language=en-US`).then(r => r.json()),
          fetch(`${TMDB.base}/movie/${id}/similar?api_key=${TMDB.key}&language=en-US&page=1`).then(r => r.json()),
          fetch(`${TMDB.base}/movie/${id}/recommendations?api_key=${TMDB.key}&language=en-US&page=1`).then(r => r.json()),
        ])
        if (abort) return
        if (d?.success === false || d?.status_code) throw new Error(d?.status_message || 'Failed to load')

        setMovie(d)
        setCast((c?.cast || []).slice(0, 12))
        setVideos(v?.results || [])
        setSimilar((s?.results || []).slice(0, 18))
        setRecs((r?.results || []).slice(0, 18))
      } catch (e) {
        if (!abort) setError(e?.message || 'Could not load movie.')
      } finally {
        if (!abort) setLoading(false)
      }
    }
    load()
    return () => { abort = true }
  }, [id])

  // Providers (TMDB ↔︎ JustWatch)
  useEffect(() => {
    let active = true
    async function loadProviders() {
      try {
        if (!TMDB.key) return
        const res = await fetch(`${TMDB.base}/movie/${id}/watch/providers?api_key=${TMDB.key}`)
        const json = await res.json()
        const region = (navigator?.language || 'en-US').split('-')[1]?.toUpperCase() || 'US'
        const area = json?.results?.[region] || json?.results?.US || null
        if (!active) return

        if (area) {
          const pick = (k) => (area[k] || []).slice(0, 16)
          setProviders({
            flatrate: pick('flatrate'),
            rent:     pick('rent'),
            buy:      pick('buy'),
            link:     area.link || '',
          })
        } else {
          setProviders({ flatrate: [], rent: [], buy: [], link: '' })
        }
      } catch {
        if (!active) return
        setProviders({ flatrate: [], rent: [], buy: [], link: '' })
      }
    }
    loadProviders()
    return () => { active = false }
  }, [id])

  // Watchlist status
  useEffect(() => {
    let active = true
    async function readWL() {
      if (!user?.id) { setWlStatus(null); return }
      const { data, error } = await supabase
        .from('user_watchlist')
        .select('status')
        .eq('user_id', user.id)
        .eq('movie_id', Number(id))
        .maybeSingle()
      if (!active) return
      if (error) setWlStatus(null)
      else setWlStatus(data?.status || null)
    }
    readWL()
    return () => { active = false }
  }, [user, id])

  const ytTrailer = useMemo(() => {
    const t = (videos || []).find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
    return t ? `https://www.youtube.com/watch?v=${t.key}` : (movie?.title ? `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' trailer official')}` : null)
  }, [videos, movie])

  async function ensureAuthed() {
    if (user?.id) return true
    navigate('/auth', { replace: true, state: { from: `/movie/${id}` } })
    return false
  }

  // ---------------- Safe write helpers (never 409) ----------------
  async function writeStatus(nextStatus) {
    // 1) Try UPDATE
    const { error: updErr, count } = await supabase
      .from('user_watchlist')
      .update({ status: nextStatus })
      .eq('user_id', user.id)
      .eq('movie_id', Number(id))
      .select('user_id', { count: 'exact' })

    if (!updErr && (count ?? 0) > 0) return true

    // 2) If nothing updated, try INSERT
    const { error: insErr } = await supabase
      .from('user_watchlist')
      .insert({ user_id: user.id, movie_id: Number(id), status: nextStatus })

    // If a race caused a duplicate, do a final UPDATE
    if (insErr) {
      const msg = `${insErr.message || ''}`.toLowerCase()
      const dup = insErr.code === '23505' || msg.includes('duplicate') || msg.includes('conflict')
      if (dup) {
        await supabase
          .from('user_watchlist')
          .update({ status: nextStatus })
          .eq('user_id', user.id)
          .eq('movie_id', Number(id))
        return true
      }
      throw insErr
    }
    return true
  }

  async function deleteRow() {
    await supabase.from('user_watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('movie_id', Number(id))
  }

  // Explicit toggles so both buttons are always visible
  async function toggleWatchlist() {
    if (!(await ensureAuthed())) return
    setMutating(true)
    try {
      if (wlStatus === 'want_to_watch') {
        await deleteRow()
        setWlStatus(null)
      } else if (wlStatus === 'watched') {
        await writeStatus('want_to_watch') // move from watched → want_to_watch
        setWlStatus('want_to_watch')
      } else {
        await writeStatus('want_to_watch') // add
        setWlStatus('want_to_watch')
      }
    } finally {
      setMutating(false)
    }
  }

  async function toggleWatched() {
    if (!(await ensureAuthed())) return
    setMutating(true)
    try {
      if (wlStatus === 'watched') {
        await deleteRow() // undo watched
        setWlStatus(null)
      } else {
        await writeStatus('watched') // mark watched (even if not on watchlist)
        setWlStatus('watched')
      }
    } finally {
      setMutating(false)
    }
  }
  // -----------------------------------------------------------------

  const rating  = movie?.vote_average ? Math.round(movie.vote_average * 10) / 10 : null
  const year    = yearOf(movie?.release_date)
  const runtime = formatRuntime(movie?.runtime)

  return (
    <div className="relative">
      {/* Hero */}
      <div className="relative min-h-[420px] md:min-h-[520px]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: movie?.backdrop_path ? `url(${IMG.backdrop(movie.backdrop_path)})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(.9)',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_40%_0%,rgba(0,0,0,.55),rgba(0,0,0,.9))]" />

        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[auto,1fr] md:gap-8 md:px-6 md:py-10">
          <div className="mx-auto md:mx-0">
            <div className="overflow-hidden rounded-2xl ring-1 ring-white/10 bg-white/5">
              {movie?.poster_path ? (
                <img
                  src={IMG.poster(movie.poster_path)}
                  alt={movie?.title || 'Poster'}
                  className="h-[340px] w-[226px] object-cover md:h-[420px] md:w-[280px]"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <div className="grid h-[340px] w-[226px] place-items-center text-white/60 md:h-[420px] md:w-[280px]">
                  No poster
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-end">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 w-2/3 rounded bg-white/20" />
                <div className="mt-3 h-4 w-1/2 rounded bg-white/15" />
                <div className="mt-6 h-10 w-3/4 rounded bg-white/15" />
              </div>
            ) : error ? (
              <div className="rounded-lg bg-red-500/10 p-4 text-red-300 ring-1 ring-red-500/30">{error}</div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-balance text-[clamp(1.4rem,4.2vw,2.6rem)] font-extrabold leading-tight tracking-tight text-white">
                    {movie?.title}
                  </h1>
                  {wlStatus === 'want_to_watch' && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 ring-1 ring-white/15">
                      Watchlisted
                    </span>
                  )}
                  {wlStatus === 'watched' && (
                    <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-200 ring-1 ring-green-400/30">
                      Watched
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-white/80">
                  {year && <span className="inline-flex items-center gap-1.5 text-sm"><Calendar className="h-4 w-4 opacity-80" />{year}</span>}
                  {runtime && <span className="inline-flex items-center gap-1.5 text-sm"><Clock className="h-4 w-4 opacity-80" />{runtime}</span>}
                  {rating &&  <span className="inline-flex items-center gap-1.5 text-sm"><Star className="h-4 w-4 text-yellow-300" />{rating}</span>}
                  {!!(movie?.genres?.length) && (
                    <span className="text-sm text-white/70">• {movie.genres.map(g => g.name).slice(0, 3).join(', ')}</span>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {ytTrailer && (
                    <a
                      href={ytTrailer}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[0.95rem] font-semibold text-white hover:bg-white/15 focus:outline-none"
                    >
                      <Play className="h-4 w-4" />
                      Watch trailer
                    </a>
                  )}

                  {/* Always show both actions */}
                  <button
                    disabled={mutating}
                    onClick={toggleWatchlist}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[0.95rem] font-semibold text-white hover:bg-white/10 disabled:opacity-60"
                    title={wlStatus === 'want_to_watch' ? 'Remove from Watchlist' : wlStatus === 'watched' ? 'Move to Watchlist' : 'Add to Watchlist'}
                  >
                    <Bookmark className="h-4 w-4" />
                    {wlStatus === 'want_to_watch' ? 'Remove from Watchlist'
                      : wlStatus === 'watched' ? 'Move to Watchlist'
                      : 'Add to Watchlist'}
                  </button>

                  <button
                    disabled={mutating}
                    onClick={toggleWatched}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.95rem] font-semibold disabled:opacity-60 ${
                      wlStatus === 'watched'
                        ? 'border border-white/15 bg-white/5 hover:bg-white/10'
                        : 'bg-gradient-to-r from-[#fe9245] to-[#eb423b] text-white'
                    }`}
                    title={wlStatus === 'watched' ? 'Undo Watched' : 'Mark as Watched'}
                  >
                    <Check className="h-4 w-4" />
                    {wlStatus === 'watched' ? 'Undo Watched' : 'Mark as Watched'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        {movie?.overview && <CollapsibleText text={movie.overview} />}

        <WhereToWatch providers={providers} />

        {cast?.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold tracking-tight text-white/95">Top cast</h2>
            <div className="flex snap-x gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {cast.map(p => (
                <div key={p.id} className="w-[96px] shrink-0 snap-start">
                  <div className="overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
                    {p.profile_path ? (
                      <img
                        src={IMG.profile(p.profile_path)}
                        alt={p.name}
                        className="h-[120px] w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="grid h-[120px] place-items-center text-xs text-white/60">No photo</div>
                    )}
                  </div>
                  <div className="mt-1.5 text-[12.5px] font-semibold text-white/90 line-clamp-2">{p.name}</div>
                  <div className="text-[11.5px] text-white/60 line-clamp-2">{p.character}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {similar?.length > 0 && <Rail title="Similar" items={similar} />}
        {recs?.length > 0 && <Rail title="Recommended" items={recs} />}
      </div>
    </div>
  )
}

/* ----------------------------- Helpers ---------------------------------- */

function CollapsibleText({ text }) {
  const [open, setOpen] = useState(false)
  if (!text) return null
  return (
    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <p className={`text-[0.98rem] leading-relaxed text-white/85 ${open ? '' : 'line-clamp-5'}`}>
        {text}
      </p>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-white/80 hover:text-white focus:outline-none"
      >
        {open ? 'Show less' : 'Read more'}
        <ChevronRight className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
    </div>
  )
}

function WhereToWatch({ providers }) {
  const hasAny = (providers.flatrate?.length || providers.rent?.length || providers.buy?.length)
  if (!hasAny) return null

  const Row = ({ label, list }) => {
    if (!list?.length) return null
    return (
      <div className="mt-2">
        <div className="mb-2 text-sm font-semibold text-white/80">{label}</div>
        <div className="flex snap-x items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {list.map(p => (
            <div key={`${label}-${p.provider_id}`} className="shrink-0 snap-start">
              <div className="grid w-[64px] place-items-center rounded-xl bg-white/5 p-2 ring-1 ring-white/10">
                {p.logo_path
                  ? <img src={IMG.logo(p.logo_path)} alt={p.provider_name} className="h-10 w-10 object-contain" loading="lazy" />
                  : <div className="text-[10px] text-white/70 text-center px-1 py-3">{p.provider_name}</div>
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className="mt-8 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="mb-1 flex items-center gap-2">
        <Tv2 className="h-5 w-5 text-white/90" />
        <h2 className="text-base font-bold tracking-tight text-white/95">Where to watch</h2>
        <span className="ml-auto text-[11px] text-white/50">Data via JustWatch</span>
      </div>
      <Row label="Stream" list={providers.flatrate} />
      <Row label="Rent"   list={providers.rent} />
      <Row label="Buy"    list={providers.buy} />
      {providers.link && (
        <a
          href={providers.link}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-[12.5px] font-semibold text-white/80 underline underline-offset-4 hover:text-white"
        >
          See providers for your region →
        </a>
      )}
    </section>
  )
}

function Rail({ title, items }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold tracking-tight text-white/95">{title}</h2>
      <div className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {items.map(m => (
          <Link key={m.id} to={`/movie/${m.id}`} className="group w-[116px] shrink-0 snap-start" title={m.title}>
            <div className="overflow-hidden rounded-xl ring-1 ring-white/10 bg-white/5">
              {m.poster_path
                ? <img src={`https://image.tmdb.org/t/p/w185${m.poster_path}`} alt={m.title} className="h-[174px] w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" loading="lazy" />
                : <div className="grid h-[174px] place-items-center text-xs text-white/60">No poster</div>
              }
            </div>
            <div className="mt-2 line-clamp-2 text-[12.5px] font-semibold text-white/90">{m.title}</div>
            {m.vote_average ? <div className="text-[11.5px] text-white/60">{Math.round(m.vote_average * 10) / 10} ★</div> : null}
          </Link>
        ))}
      </div>
    </section>
  )
}