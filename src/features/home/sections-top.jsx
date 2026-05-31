// Home — top sections (Masthead, Mood Reactor, The Briefing 3-up).
// All film data comes from useHomeData (no more imports from data.js for FILMS).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, SkipForward, RefreshCw } from 'lucide-react'
import MatchBadge from '@/shared/components/MatchBadge'
import { ActionButton, SecondaryActionButton } from '@/shared/components/ActionButton'
import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'
import { getMovieWatchProviders } from '@/shared/api/tmdb'
import { logSurfaceImpressions } from '@/shared/services/recommendations'
import Eyebrow from '@/shared/ui/Eyebrow'
import { HP, HP_GRAD, MOOD_META } from './data'
import { SmartImg } from './atoms'
import { useHomeData } from './useHomeData'

// Static slot labels — one per position in the 3-card briefing row.
// Same across moods (functional, not flavor): position 0 is the engine's
// top pick, position 1 is the next-best mood match, position 2 is the
// taste-profile pull. Stays small + editorial above each card title.
const SLOT_LABELS = ["Tonight's pick", 'Mood match', 'From your DNA']

// MoodReactor — pill picker with a "TONIGHT I FEEL" kicker on the left.
// The active pill already carries the mood color + glow, so the kicker
// doesn't echo the selected label (would be redundant + cause width jitter
// on selection). Auto-scrolls the active pill into view on mobile so the
// user can always see their current pick even when their baseline mood
// sits at the end of MOOD_META and the row overflows the viewport.
export function MoodReactor({ currentMood, setMood, onReshuffle }) {
  const pillsRef = useRef(null)
  useEffect(() => {
    const el = pillsRef.current
    if (!el) return
    // Only scroll when there's actual horizontal overflow (mobile). On
    // desktop the row wraps, so this no-ops.
    if (el.scrollWidth <= el.clientWidth) return
    const active = el.querySelector(`[data-mood-id="${currentMood.id}"]`)
    if (active) active.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
  }, [currentMood.id])
  return (
    <section className="px-5 pt-5 pb-2 sm:px-8 sm:pt-6 sm:pb-4 lg:px-[88px] lg:pt-[12px] lg:pb-5">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex flex-none items-baseline gap-2.5">
          <span aria-hidden style={{ height: 1, width: 18, background: HP.purple, opacity: 0.6, alignSelf: 'center' }} />
          <Eyebrow color={HP.textMuted} size={10} style={{ whiteSpace: 'nowrap' }}>Tonight I feel</Eyebrow>
        </div>
        <div
          ref={pillsRef}
          className="-mx-1 flex w-full min-w-0 gap-2 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden sm:mx-0 sm:w-auto sm:flex-1 sm:flex-wrap sm:justify-end sm:gap-2.5 sm:overflow-visible sm:pb-0"
        >
        {MOOD_META.map(m => {
          const active = m.id === currentMood.id
          return (
            <button
              key={m.id}
              type="button"
              data-mood-id={m.id}
              onClick={() => setMood(m)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 999,
                background: active ? `${m.hex}22` : 'transparent',
                border: `1px solid ${active ? m.hex : HP.border}`,
                color: active ? HP.text : HP.textSoft,
                fontFamily: 'Outfit', fontSize: 12, fontWeight: 500,
                letterSpacing: '-0.005em', cursor: 'pointer', transition: 'all 0.25s ease',
                flex: 'none',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 999, background: m.hex, boxShadow: active ? `0 0 10px ${m.hex}` : 'none', transition: 'box-shadow 0.25s ease' }} />
              {m.label}
            </button>
          )
        })}
        {/* Reshuffle — small icon-only pill at the right end of the row.
            Took the place of the deleted bottom strip in audit pass-15.
            On mobile it sits inline with the pills (still tap-accessible). */}
        {onReshuffle && (
          <button
            type="button"
            onClick={onReshuffle}
            aria-label="Reshuffle picks"
            title="Reshuffle"
            className="flex flex-none items-center justify-center rounded-full border border-white/10 transition-all duration-200 hover:border-white/25 hover:bg-white/6 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            style={{ width: 32, height: 32, color: HP.textMuted, marginLeft: 4 }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
        </div>
      </div>
    </section>
  )
}

// In-card action buttons are the canonical family in shared/components/ActionButton
// (rounded-8, Outfit — shared with /movie so the briefing actions don't feel like a
// different system). The three below are thin wrappers that add the icon, label, and
// active state on top of <SecondaryActionButton>; the gradient "See More" primary
// uses <ActionButton> directly.
function WatchedButton({ isWatched, loading, onClick }) {
  return (
    <SecondaryActionButton
      collapse
      active={isWatched}
      loading={loading}
      onClick={onClick}
      title={isWatched ? 'Watched' : 'Mark as watched'}
      label={isWatched ? 'Watched' : 'Mark Watched'}
      icon={<svg className="h-4 w-4 lg:h-[13px] lg:w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
    />
  )
}

function SaveButton({ isInWatchlist, loading, onClick }) {
  return (
    <SecondaryActionButton
      collapse
      active={isInWatchlist}
      loading={loading}
      onClick={onClick}
      title={isInWatchlist ? 'Saved to watchlist' : 'Save to watchlist'}
      label={isInWatchlist ? 'Saved' : 'Save'}
      icon={isInWatchlist
        ? <svg className="h-4 w-4 lg:h-[13px] lg:w-[13px]" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
        : <svg className="h-4 w-4 lg:h-[13px] lg:w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>}
    />
  )
}

function SkipButton({ onClick }) {
  return (
    <SecondaryActionButton
      collapse
      onClick={onClick}
      title="Skip — not tonight"
      label="Skip Tonight"
      icon={<SkipForward className="h-4 w-4 lg:h-3.5 lg:w-3.5" />}
    />
  )
}

// Streaming chip — mirrors HeroTopPick's StreamingBadge. Loads providers
// via the shared getMovieWatchProviders helper (CA → US fallback), shows
// the top one as a compact pill (logo + 'Streaming on' / 'Rent on' + name).
// Returns null when TMDB has no provider data for the title.
function useStreamingProvider(tmdbId) {
  const [provider, setProvider] = useState(null)
  useEffect(() => {
    if (!tmdbId) { setProvider(null); return }
    const controller = new AbortController()
    let cancelled = false
    setProvider(null)
    getMovieWatchProviders(tmdbId, { region: 'CA', fallbackRegion: 'US', signal: controller.signal })
      .then(data => {
        if (cancelled) return
        const p = data?.providers?.[0]
        if (p) setProvider(p)
      })
      .catch(() => { /* non-fatal */ })
    return () => { cancelled = true; controller.abort() }
  }, [tmdbId])
  return provider
}

function StreamingChip({ provider }) {
  if (!provider) return null
  const label = provider.type === 'flatrate' ? 'Streaming on'
    : provider.type === 'rent' ? 'Rent on'
    : 'Buy on'
  return (
    <div
      className="inline-flex items-center gap-2.5 rounded-lg border border-white/[0.07] bg-white/4 px-2.5 py-1.5"
      style={{ maxWidth: '100%' }}
    >
      <img
        src={`https://image.tmdb.org/t/p/w92${provider.logoPath}`}
        alt={provider.name}
        className="h-7 w-7 flex-none rounded object-cover"
        loading="lazy"
      />
      <div className="min-w-0">
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: HP.textFaint, lineHeight: 1, margin: 0 }}>{label}</p>
        <p style={{ fontSize: 12, fontWeight: 600, color: HP.text, lineHeight: 1, marginTop: 4 }} className="truncate">{provider.name}</p>
      </div>
    </div>
  )
}

// BriefingSlide — single-pick hero used inside a Netflix-style slider
// (audit pass-16). One pick visible at a time; nav lives in TheBriefing
// (arrows on desktop, swipe + dots on mobile). Layout:
//   • mobile: vertical — poster centered, copy stacked below
//   • desktop: horizontal — poster left (360×540), copy right column.
// No background backdrop image — keeps the page surface clean.
function BriefingSlide({ film, idx, matchPct, user, onWatch, onSkip, onMarkedWatched }) {
  // source must match the user_watchlist_source_check CHECK constraint —
  // 'mood_recommendation' is the closest of the allowed values.
  const { isInWatchlist, isWatched, loading: statusLoading, toggleWatchlist, toggleWatched } =
    useUserMovieStatus({ user, movie: film, internalMovieId: film?.id, source: 'mood_recommendation' })

  // Fetch streaming providers for this slide (TMDB, region CA→US).
  // Hook handles abort/cancel so switching slides cancels stale fetches.
  const provider = useStreamingProvider(film?.tmdbId)

  // Fire onMarkedWatched optimistically on the user's click (before the
  // async DB write resolves) so TheBriefing hides this slide immediately
  // and the next pick slides in.
  const handleMarkWatched = useCallback(() => {
    const wasWatched = isWatched
    toggleWatched()
    if (!wasWatched && film?.id) onMarkedWatched?.(film.id)
  }, [isWatched, toggleWatched, onMarkedWatched, film?.id])

  if (!film) return null

  const slotLabel = SLOT_LABELS[idx] || SLOT_LABELS[SLOT_LABELS.length - 1]

  return (
    <div className="flex flex-col items-center gap-5 lg:flex-row lg:items-end lg:gap-14">
      {/* Poster column — clickable */}
      <button
        type="button"
        onClick={() => onWatch?.(film)}
        aria-label={`See more about ${film.title}`}
        className="relative block w-full max-w-[210px] flex-none sm:max-w-[260px] lg:w-[340px] lg:max-w-none"
        style={{
          borderRadius: 10, overflow: 'hidden',
          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
          boxShadow: '0 24px 60px -16px rgba(0,0,0,0.75), 0 0 0 1px rgba(167,139,250,0.18)',
        }}
      >
        <SmartImg film={film} big style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
        {/* Position badge top-right */}
        <div style={{ position: 'absolute', top: 14, right: 14, padding: '4px 9px', borderRadius: 4, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', fontSize: 10, fontWeight: 600, color: HP.textSoft, letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'Outfit' }}>
          0{idx + 1}
        </div>
        {/* Animated match ring — sized to feel proportionate against the
            smallest poster width (200px mobile); still reads at lg (340px). */}
        {Number.isFinite(matchPct) && matchPct > 0 && (
          <MatchBadge variant="ring" pct={matchPct} size={60} style={{ bottom: 14, right: 14 }} />
        )}
      </button>

      {/* Content column */}
      <div className="flex w-full flex-col text-center lg:flex-1 lg:text-left lg:max-w-[680px]">
        {/* Slot label kicker — bigger on desktop where it's the marquee header.
            self-center on mobile so it centers like the title/meta/synopsis
            below it; self-start on desktop matches the left-aligned column. */}
        <Eyebrow rule className="self-center lg:self-start" style={{ marginBottom: 12 }}>{slotLabel}</Eyebrow>
        {/* Title — matches the /movie/:id hero typography: Outfit 600 with a
            tight negative letter-spacing and lineHeight 0.94. Sized down
            from 92px to fit this two-column row, then scaled responsively
            so it lines up with the movie-page treatment at every width. */}
        <h2 style={{
          fontFamily: 'Outfit, Inter, sans-serif',
          fontSize: 'clamp(40px, 6vw, 84px)',
          lineHeight: 0.94,
          fontWeight: 600,
          letterSpacing: '-0.05em',
          color: HP.text,
          margin: '0 0 14px 0',
          textWrap: 'balance',
        }}>
          {film.title}
        </h2>
        {/* Meta: year · runtime · director */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 lg:justify-start" style={{ fontSize: 12, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
          {film.year && <span>{film.year}</span>}
          {film.runtime && (
            <>
              <span style={{ color: HP.textFaint }}>·</span>
              <span>{film.runtime} min</span>
            </>
          )}
          {film.director && film.director !== 'Unknown' && (
            <>
              <span style={{ color: HP.textFaint }}>·</span>
              <span>{film.director}</span>
            </>
          )}
        </div>
        {/* Synopsis — TMDB overview, clamped to 2 lines on mobile, 3 on
            desktop. Hidden when null (some films lack overview). */}
        {film.synopsis && (
          <p
            className="line-clamp-2 lg:line-clamp-3"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(13px, 1vw, 15px)',
              lineHeight: 1.55,
              color: 'rgba(255,255,255,0.62)',
              margin: '0 0 12px 0',
              maxWidth: 580,
            }}
          >
            {film.synopsis}
          </p>
        )}
        {/* Streaming chip — desktop only. Mobile drops it to keep the
            slide tight (where-to-watch info is one tap away on /movie/:id). */}
        {provider && (
          <div className="hidden lg:mb-5 lg:flex lg:justify-start">
            <StreamingChip provider={provider} />
          </div>
        )}
        {/* Actions — gradient primary + secondary buttons.
            • mobile: single row — gradient "See more" grows (flex-1)
              next to three compact 44×44 round icon buttons (label
              hidden, icon only).
            • lg+: wrap row of four labeled pills (movie-detail style). */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4 lg:justify-start" style={{ borderTop: `1px solid ${HP.border}` }}>
          <ActionButton className="h-11 flex-1 lg:h-auto lg:flex-none" onClick={() => onWatch?.(film)}>
            <span>See More</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </ActionButton>
          <WatchedButton isWatched={isWatched} loading={statusLoading.watched} onClick={handleMarkWatched} />
          <SaveButton isInWatchlist={isInWatchlist} loading={statusLoading.watchlist} onClick={toggleWatchlist} />
          <SkipButton onClick={() => onSkip?.(film)} />
        </div>
      </div>
    </div>
  )
}

// Slide enter/exit animation. Direction-aware — when advancing the new
// slide enters from the right and the old exits left; reverse for prev.
const SLIDE_VARIANTS = {
  enter: (dir) => ({ x: dir > 0 ? 56 : -56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -56 : 56, opacity: 0 }),
}


// Tiny seeded shuffle so each Reshuffle click reorders deterministically.
function shuffleBySeed(arr, seed) {
  if (!seed) return arr
  const out = arr.slice()
  let s = seed * 9301 + 49297
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// Daily seed: current UTC date as YYYYMMDD integer. Stays stable for a
// whole UTC day, changes at midnight UTC. Combined with the user's
// shuffleSeed (Reshuffle clicks) and the mood id, this gives the briefing
// a natural rotation through the top-30 pool — same user, same mood,
// different picks each day — so /home doesn't feel "static" day-over-day.
function todaySeed() {
  const d = new Date()
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate()
}
// Tiny non-cryptographic string-to-int hash. Used to fold the active mood
// id into the rotation seed so different moods on the same day produce
// different picks (otherwise switching mood would just refilter the same
// underlying order).
function strHash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function TheBriefing({ currentMood, shuffleSeed = 0, user, onWatch, onSkip }) {
  const { moods, loading } = useHomeData()
  const moodEntry = moods.find(m => m.id === currentMood.id)

  // Effective seed for picking which 3 of the top 30 are visible today.
  // Recomputes when the day changes (midnight UTC) or when the user clicks
  // Reshuffle. Mood id folded in so moods don't share the same rotation.
  const effectiveSeed = useMemo(
    () => todaySeed() + shuffleSeed * 7919 + strHash(currentMood.id || ''),
    [shuffleSeed, currentMood.id],
  )

  // Session-only hide list: when a slide is marked watched OR skipped, its
  // film.id lands here and the picks filter drops it. The engine returns
  // a deeper pool (15 per mood in useHomeData), so the next-best film
  // slides into the freed slot — user sees "slide replaced by next
  // suggestion" instead of an empty hole.
  //
  // Resets ONLY on mood change. Previously also reset on shuffleSeed,
  // which made reshuffle bring back films the user had just skipped —
  // counter-intuitive ("I skipped this, give me different films").
  // Reshuffle now re-orders the *remaining* pool; switching moods is the
  // way to start with a clean slate.
  const [hiddenIds, setHiddenIds] = useState(() => new Set())
  const [activeIdx, setActiveIdx] = useState(0)
  const [direction, setDirection] = useState(1)
  useEffect(() => {
    setHiddenIds(new Set())
    setActiveIdx(0)
    setDirection(1)
  }, [currentMood.id])
  useEffect(() => {
    setActiveIdx(0)
    setDirection(1)
  }, [shuffleSeed])

  const picks = useMemo(() => {
    if (!moodEntry) return []
    const shuffled = shuffleBySeed(moodEntry.films || [], effectiveSeed)
    return shuffled.filter(f => !hiddenIds.has(f.id)).slice(0, 3)
  }, [moodEntry, effectiveSeed, hiddenIds])

  // Clamp activeIdx if picks just shrunk (skip/watched on the last slide).
  const safeIdx = picks.length === 0 ? 0 : Math.min(activeIdx, picks.length - 1)
  useEffect(() => {
    if (activeIdx !== safeIdx) setActiveIdx(safeIdx)
  }, [activeIdx, safeIdx])

  const hide = useCallback((id) => {
    setHiddenIds(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const handleSkip = useCallback((film) => {
    onSkip?.(film)
    if (film?.id) hide(film.id)
  }, [onSkip, hide])

  const handleMarkedWatched = useCallback((id) => {
    if (id != null) hide(id)
  }, [hide])

  const clearHidden = useCallback(() => setHiddenIds(new Set()), [])

  const goPrev = useCallback(() => {
    setDirection(-1)
    setActiveIdx(i => Math.max(0, i - 1))
  }, [])
  const goNext = useCallback(() => {
    setDirection(1)
    setActiveIdx(i => Math.min(picks.length - 1, i + 1))
  }, [picks.length])
  const goTo = useCallback((i) => {
    setDirection(i > safeIdx ? 1 : -1)
    setActiveIdx(i)
  }, [safeIdx])

  // Keyboard nav (← / →) when the briefing has focus or anywhere on /home.
  // Scoped to the document so arrow keys work without explicit focus.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goPrev, goNext])

  // Three distinct "no cards visible" states:
  //   loading — initial fetch in flight
  //   noFilms — engine returned 0 for this mood (cold start / niche genre)
  //   exhausted — engine returned films but the user has skipped/watched
  //     enough that the visible pool is now empty
  const filmsCount = moodEntry?.films?.length ?? 0
  const isExhausted = !loading && filmsCount > 0 && picks.length === 0
  const isNoFilms = !loading && filmsCount === 0

  const activeFilm = picks[safeIdx]
  const canGoPrev = safeIdx > 0
  const canGoNext = safeIdx < picks.length - 1

  // Briefing impression — log the visible film each time the active slide
  // changes (per-day-deduped by recommendation_impressions' unique key, so
  // bouncing between slides only writes one row per film per day). Logs
  // only the visible slide, not all 3 picks, so per-film impression counts
  // reflect actual viewing rather than what was rendered offscreen.
  const activeFilmId = activeFilm?.id
  const activeFilmReason = activeFilm?.engineReason
  useEffect(() => {
    if (!user?.id || activeFilmId == null) return
    logSurfaceImpressions({
      userId: user.id,
      films: [{ id: activeFilmId }],
      placement: 'hero',
      pickReasonType: 'briefing_active',
      pickReasonLabel: activeFilmReason || `${currentMood.id} · slide ${safeIdx + 1}`,
    })
  }, [user?.id, activeFilmId, activeFilmReason, currentMood.id, safeIdx])

  return (
    <section className="relative px-5 pt-4 pb-10 sm:px-8 sm:pt-6 sm:pb-12 lg:px-[88px] lg:pt-6 lg:pb-6">
      {isExhausted ? (
        <div className="flex flex-col items-center gap-5 py-12 text-center">
          <p style={{ fontSize: 15, lineHeight: 1.6, color: HP.textSoft, fontFamily: 'Outfit, Inter, sans-serif', margin: 0, maxWidth: 480 }}>
            You&rsquo;ve reviewed all of tonight&rsquo;s{' '}
            <em style={{ fontStyle: 'italic', color: currentMood.hex, fontWeight: 500 }}>{currentMood.label.toLowerCase()}</em>{' '}
            picks. Switch moods above, or
          </p>
          <button
            type="button"
            onClick={clearHidden}
            className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-white/25 hover:bg-white/12 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            style={{ fontFamily: 'Outfit', letterSpacing: '0.02em' }}
          >
            Show all again
          </button>
        </div>
      ) : isNoFilms ? (
        <div style={{ padding: '60px 0', textAlign: 'center', fontFamily: 'Outfit, Inter, sans-serif', color: HP.textMuted, fontSize: 14, fontStyle: 'italic' }}>
          No <span style={{ color: currentMood.hex, fontStyle: 'italic' }}>{currentMood.label.toLowerCase()}</span> picks just yet — try a different mood above.
        </div>
      ) : picks.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', fontFamily: 'Outfit, Inter, sans-serif', color: HP.textMuted, fontSize: 14, fontStyle: 'italic' }}>
          Finding films for this mood&hellip;
        </div>
      ) : (
        <div className="relative">
          {/* Slider viewport — overflow-hidden contains the swipe gesture
              animation; drag on the inner motion.div handles touch swipes. */}
          <div className="relative overflow-hidden">
            <AnimatePresence initial={false} mode="wait" custom={direction}>
              <motion.div
                key={`${currentMood.id}-${activeFilm?.id ?? safeIdx}-${shuffleSeed}`}
                custom={direction}
                variants={SLIDE_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={(_, info) => {
                  const threshold = 60
                  if (info.offset.x > threshold && canGoPrev) goPrev()
                  else if (info.offset.x < -threshold && canGoNext) goNext()
                }}
                style={{ cursor: 'grab' }}
              >
                <BriefingSlide
                  film={activeFilm}
                  idx={safeIdx}
                  matchPct={activeFilm?.matchPct}
                  user={user}
                  onWatch={onWatch}
                  onSkip={handleSkip}
                  onMarkedWatched={handleMarkedWatched}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Desktop arrows — hidden below lg. Disabled state dims to 30%. */}
          <button
            type="button" onClick={goPrev} disabled={!canGoPrev}
            aria-label="Previous pick"
            className="absolute -left-2 top-[28%] hidden h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/85 backdrop-blur-md transition-all duration-200 hover:border-white/30 hover:bg-black/70 hover:text-white disabled:cursor-default disabled:opacity-25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 lg:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button" onClick={goNext} disabled={!canGoNext}
            aria-label="Next pick"
            className="absolute -right-2 top-[28%] hidden h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/85 backdrop-blur-md transition-all duration-200 hover:border-white/30 hover:bg-black/70 hover:text-white disabled:cursor-default disabled:opacity-25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 lg:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dot indicator — active dot stretches to a gradient capsule.
              On desktop the dots double as labeled "Tonight's pick / Mood
              match / From your DNA" buttons; on mobile they're compact. */}
          <div className="mt-5 flex items-center justify-center gap-3 lg:mt-7">
            {picks.map((_, i) => {
              const active = i === safeIdx
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Slide ${i + 1}: ${SLOT_LABELS[i] || ''}`}
                  aria-current={active}
                  className="group inline-flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  <span
                    aria-hidden
                    style={{
                      display: 'inline-block',
                      width: active ? 30 : 8,
                      height: 8,
                      borderRadius: 999,
                      background: active ? HP_GRAD : 'rgba(255,255,255,0.18)',
                      boxShadow: active ? '0 0 12px rgba(236,72,153,0.4)' : 'none',
                      transition: 'all 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
                    }}
                  />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
