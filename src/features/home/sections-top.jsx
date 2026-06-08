// Home — top sections (Masthead, Mood Reactor, The Briefing 3-up).
// All film data comes from useHomeData (no more imports from data.js for FILMS).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, SkipForward, RefreshCw } from 'lucide-react'
import MatchBadge from '@/shared/components/MatchBadge'
import { ActionButton, SecondaryActionButton } from '@/shared/components/ActionButton'
import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'
import { getMovieWatchProviders } from '@/shared/api/tmdb'
import { logSurfaceImpressions } from '@/shared/services/recommendations'
import { recordRecommendationOutcome } from '@/shared/services/recommendationOutcomes'
import Eyebrow from '@/shared/ui/Eyebrow'
import { HP, MOOD_META } from './data'
import { SmartImg } from './atoms'
import WhyThisPick from './WhyThisPick'
import { todaySeed, buildBriefingQueue } from './homeDerive'
import { useHomeData } from './useHomeData'

// The Briefing presents ONE confident pick. Its eyebrow is a constant —
// "Tonight's pick" — never a positional label. (The old 3-slot slider used
// "Mood match" / "From your DNA" for ranks 2/3; those positional labels
// implied a curated ranking that wasn't real, so we collapsed to the single
// head pick with a skip-to-next queue underneath.)
const TONIGHT_LABEL = "Tonight's pick"

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
              className="ff-tap"
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
            className="ff-tap-hit flex flex-none items-center justify-center rounded-full border border-white/10 transition-all duration-200 hover:border-white/25 hover:bg-white/6 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
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
function WatchedButton({ isWatched, loading, error, onClick }) {
  return (
    <SecondaryActionButton
      collapse
      active={isWatched}
      loading={loading}
      onClick={onClick}
      title={error ? 'Couldn’t mark watched — tap to retry' : isWatched ? 'Watched' : 'Mark as watched'}
      label={isWatched ? 'Watched' : 'Mark Watched'}
      icon={<svg className="h-4 w-4 lg:h-[13px] lg:w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
    />
  )
}

function SaveButton({ isInWatchlist, loading, error, onClick }) {
  return (
    <SecondaryActionButton
      collapse
      active={isInWatchlist}
      loading={loading}
      onClick={onClick}
      title={error ? 'Couldn’t save — tap to retry' : isInWatchlist ? 'Saved to watchlist' : 'Save to watchlist'}
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
function BriefingSlide({ film, matchPct, user, onWatch, onSkip, onMarkedWatched, announce }) {
  // source must match the user_watchlist_source_check CHECK constraint —
  // 'mood_recommendation' is the closest of the allowed values.
  const { isInWatchlist, isWatched, loading: statusLoading, toggleWatchlist, toggleWatched, internalId } =
    useUserMovieStatus({ user, movie: film, internalMovieId: film?.id, source: 'mood_recommendation' })

  // Fetch streaming providers for this slide (TMDB, region CA→US).
  // Hook handles abort/cancel so switching slides cancels stale fetches.
  const provider = useStreamingProvider(film?.tmdbId)

  // F4.3 — Mark Watched / Save reliability. useUserMovieStatus owns the writes
  // (unchanged payloads) and optimistically flips isWatched / isInWatchlist, then
  // REVERTS on failure while loading.{watched,watchlist} runs true → false. We
  // observe that settle to gate the advance (watched) and surface honest success /
  // failure feedback — instead of advancing optimistically before the write lands.
  const [watchedState, setWatchedState] = useState('idle') // idle | saving | watched | error
  const [saveState, setSaveState] = useState('idle')       // idle | saving | error
  const watchPendingRef = useRef(false)
  const savePendingRef = useRef(null)                      // null | 'add' | 'remove'
  const advanceTimerRef = useRef(null)
  useEffect(() => () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current) }, [])

  // Mark Watched — do NOT hide/advance until the user_history write succeeds
  // (mirrors Discover F3.9). internalId must be resolved for the write to run.
  const handleMarkWatched = useCallback(() => {
    if (!film?.id || !internalId || statusLoading.watched || watchedState === 'saving' || isWatched) return
    watchPendingRef.current = true
    setWatchedState('saving')
    toggleWatched()
  }, [film?.id, internalId, statusLoading.watched, watchedState, isWatched, toggleWatched])

  // Resolve the pending mark-watched once the hook write settles: isWatched stays
  // true on success → advance after a confirmation hold; reverts to false on
  // failure → keep the pick, show a retryable error and announce it.
  useEffect(() => {
    if (!watchPendingRef.current || statusLoading.watched) return
    watchPendingRef.current = false
    const filmId = film?.id
    if (isWatched) {
      setWatchedState('watched')
      advanceTimerRef.current = setTimeout(() => {
        onMarkedWatched?.(filmId)
        advanceTimerRef.current = null
      }, 600)
    } else {
      setWatchedState('error')
      announce?.('Could not mark watched. Try again.')
    }
  }, [statusLoading.watched, isWatched, film?.id, onMarkedWatched, announce])

  // Save — keep the optimistic toggle (reversible) but surface success / failure
  // once the write settles. Saving shows a spinner; a real save announces
  // confirmation; a failed save reverts and announces a retry.
  const handleSave = useCallback(() => {
    if (!film?.id || !internalId || statusLoading.watchlist || saveState === 'saving') return
    savePendingRef.current = isInWatchlist ? 'remove' : 'add'
    setSaveState('saving')
    toggleWatchlist()
  }, [film?.id, internalId, statusLoading.watchlist, saveState, isInWatchlist, toggleWatchlist])

  useEffect(() => {
    if (savePendingRef.current == null || statusLoading.watchlist) return
    const intent = savePendingRef.current
    savePendingRef.current = null
    if (intent === 'add') {
      if (isInWatchlist) { setSaveState('idle'); announce?.('Saved for later.') }
      else { setSaveState('error'); announce?.('Could not save. Try again.') }
    } else if (isInWatchlist) {
      setSaveState('error'); announce?.('Could not save. Try again.')
    } else {
      setSaveState('idle')
    }
  }, [statusLoading.watchlist, isInWatchlist, announce])

  // Opening the pick (poster or "See More") is the Briefing's 'clicked' outcome.
  // F8B: record it against the fresh hero impression (logged when this slide
  // became active) so shown→clicked is captured, then hand off to onWatch
  // (navigation). Fire-and-forget; recordRecommendationOutcome no-ops if no
  // recent impression exists, so this never blocks the open.
  const handleOpen = useCallback(() => {
    if (user?.id && film?.id) {
      recordRecommendationOutcome({ userId: user.id, movieId: film.id, action: 'clicked' })
        .catch(() => { /* best-effort instrumentation */ })
    }
    onWatch?.(film)
  }, [user?.id, film, onWatch])

  if (!film) return null

  return (
    <div className="flex flex-col items-center gap-5 lg:flex-row lg:items-end lg:gap-14">
      {/* Poster column — clickable. Mobile max-width is the tightest of the
          three (180px, was 210px) so the single pick + its primary CTA clear
          the ~844px mobile fold without scrolling; sm/lg posters unchanged. */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`See more about ${film.title}`}
        className="relative block w-full max-w-[180px] flex-none sm:max-w-[260px] lg:w-[340px] lg:max-w-none"
        style={{
          borderRadius: 10, overflow: 'hidden',
          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
          boxShadow: '0 24px 60px -16px rgba(0,0,0,0.75), 0 0 0 1px rgba(167,139,250,0.18)',
        }}
      >
        <SmartImg film={film} big style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
        {/* Animated match ring — sized to feel proportionate against the
            smallest poster width (200px mobile); still reads at lg (340px). */}
        {Number.isFinite(matchPct) && matchPct > 0 && (
          <MatchBadge variant="ring" pct={matchPct} size={60} style={{ bottom: 14, right: 14 }} />
        )}
      </button>

      {/* Content column */}
      <div className="flex w-full flex-col text-center lg:flex-1 lg:text-left lg:max-w-[680px]">
        {/* Eyebrow — constant "Tonight's pick" (single confident pick, never a
            positional label). self-center on mobile so it centers like the
            title/meta below it; self-start on desktop matches the left column. */}
        <Eyebrow rule className="self-center lg:self-start" style={{ marginBottom: 12 }}>{TONIGHT_LABEL}</Eyebrow>
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
        {/* Why this pick — the engine's grounded reason ("Because you loved …").
            The case-making layer (F5). Null-safe: renders nothing on cold-start
            (no reason) rather than fabricating one. */}
        <WhyThisPick reason={film.engineReason} className="self-stretch lg:max-w-[580px]" />
        {/* Synopsis — TMDB overview. HIDDEN on mobile (a truncated fragment
            adds little and pushes the primary CTA below the fold); shown at
            sm+ clamped to 2 lines, 3 on desktop. The full overview is one tap
            away on /movie/:id. Hidden when null (some films lack overview). */}
        {film.synopsis && (
          <p
            className="hidden sm:line-clamp-2 lg:line-clamp-3"
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
          <ActionButton className="h-11 flex-1 lg:h-auto lg:flex-none" onClick={handleOpen}>
            <span>See More</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </ActionButton>
          <WatchedButton isWatched={isWatched} loading={watchedState === 'saving'} error={watchedState === 'error'} onClick={handleMarkWatched} />
          <SaveButton isInWatchlist={isInWatchlist} loading={saveState === 'saving'} error={saveState === 'error'} onClick={handleSave} />
          <SkipButton onClick={() => onSkip?.(film)} />
        </div>
      </div>
    </div>
  )
}

// Slide-in reveal for the single pick: when the head advances (skip / mark
// watched / reshuffle / mood change) the new pick enters from the right and
// the old exits left. Forward-only now — there is no backward browse.
const SLIDE_VARIANTS = {
  enter: { x: 56, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -56, opacity: 0 },
}

// Briefing loading state — a content-shaped skeleton that mirrors BriefingSlide
// (poster + title/meta/why/synopsis/actions) so the wait reads as "a briefing is
// being prepared," per the no-spinner rule. role=status announces it politely;
// the visual blocks are aria-hidden.
function BriefingSkeleton() {
  return (
    <div role="status" aria-label="Preparing tonight's briefing">
      <div aria-hidden="true" className="flex flex-col items-center gap-5 lg:flex-row lg:items-end lg:gap-14">
        {/* Poster */}
        <div className="w-full max-w-[210px] flex-none sm:max-w-[260px] lg:w-[340px] lg:max-w-none">
          <div className="aspect-2/3 w-full animate-pulse rounded-[10px] bg-white/[0.05]" />
        </div>
        {/* Content column */}
        <div className="flex w-full flex-col items-center gap-4 lg:flex-1 lg:items-start lg:max-w-[680px]">
          <div className="h-3.5 w-32 animate-pulse rounded-full bg-purple-500/15" />
          <div className="h-12 w-3/4 animate-pulse rounded-lg bg-white/[0.06] lg:h-16" />
          <div className="h-3 w-44 animate-pulse rounded-full bg-white/[0.04]" />
          <div className="mt-1 h-14 w-full max-w-[520px] animate-pulse rounded-lg bg-purple-500/[0.06]" />
          <div className="h-3 w-full max-w-[480px] animate-pulse rounded-full bg-white/[0.04]" />
          <div className="h-3 w-2/3 max-w-[360px] animate-pulse rounded-full bg-white/[0.04]" />
          <div className="mt-3 flex w-full flex-wrap items-center justify-center gap-2.5 lg:justify-start">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-10 w-24 animate-pulse rounded-lg bg-white/[0.05]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


// shuffleBySeed (deterministic reshuffle) + todaySeed (UTC daily rotation) moved
// to homeDerive.js in F4.2 (behavior-preserved); imported above. todaySeed still
// combines with the user's shuffleSeed (Reshuffle) + the mood id (strHash) below
// to rotate the top-30 pool — same user, same mood, different picks each day.

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

  // F4.3 — one polite, atomic, screen-reader-only live region owned by the
  // Briefing. It narrates pick progression + action outcomes (never the queue
  // length or match %). pickActionRef records WHY the head last advanced so the
  // pick-change effect can word the announcement (initial/mood/reshuffle vs skip
  // vs mark-watched).
  const [statusMsg, setStatusMsg] = useState('')
  const announce = useCallback((msg) => setStatusMsg(msg), [])
  const pickActionRef = useRef('initial') // 'initial' | 'skip' | 'watched'

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
  // Resets ONLY on mood change. Reshuffle re-orders the *remaining* pool;
  // switching moods is the way to start with a clean slate.
  useEffect(() => {
    setHiddenIds(new Set())
    // A fresh mood starts a fresh "Tonight's briefing pick" (not skip/watched).
    pickActionRef.current = 'initial'
  }, [currentMood.id])

  // The remaining queue for this mood — daily-seeded + reshuffle-seeded, with
  // skipped/watched films removed. We render only the HEAD; the rest is the
  // depth that skip-to-next draws from (the single-pick equivalent of the old
  // "next slides into the freed slot").
  const queue = useMemo(() => {
    if (!moodEntry) return []
    return buildBriefingQueue(moodEntry.films, effectiveSeed, hiddenIds)
  }, [moodEntry, effectiveSeed, hiddenIds])

  const hide = useCallback((id) => {
    setHiddenIds(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const handleSkip = useCallback((film) => {
    pickActionRef.current = 'skip'
    onSkip?.(film)
    if (film?.id) hide(film.id)
  }, [onSkip, hide])

  const handleMarkedWatched = useCallback((id) => {
    if (id == null) return
    pickActionRef.current = 'watched'
    hide(id)
  }, [hide])

  const clearHidden = useCallback(() => setHiddenIds(new Set()), [])

  // Three distinct "no pick visible" states:
  //   loading — initial fetch in flight
  //   noFilms — engine returned 0 for this mood (cold start / niche genre)
  //   exhausted — engine returned films but the user has skipped/watched
  //     through the whole queue
  const filmsCount = moodEntry?.films?.length ?? 0
  const isExhausted = !loading && filmsCount > 0 && queue.length === 0
  const isNoFilms = !loading && filmsCount === 0

  // The single confident pick = head of the queue.
  const pick = queue[0]

  // Briefing impression — log the one visible pick. Per-day-deduped by
  // recommendation_impressions' unique key, so re-renders write one row per
  // film per day. Fires whenever the head advances (skip / watched / reshuffle
  // / mood change).
  const pickId = pick?.id
  const pickReason = pick?.engineReason
  useEffect(() => {
    if (!user?.id || pickId == null) return
    // Exposure log of the visible head pick. Timing/placement/payload unchanged
    // (F4.3 only adds failure containment so a rejected write isn't unhandled).
    logSurfaceImpressions({
      userId: user.id,
      films: [{ id: pickId }],
      placement: 'hero',
      pickReasonType: 'briefing_active',
      pickReasonLabel: pickReason || currentMood.id,
    }).catch(() => { /* non-fatal — exposure logging is best-effort */ })
  }, [user?.id, pickId, pickReason, currentMood.id])

  // Announce the visible pick whenever the head advances. The reason recorded by
  // the last action shapes the wording. Fires only when the head id changes, so
  // routine re-renders don't re-announce.
  const pickTitle = pick?.title
  useEffect(() => {
    if (pickId == null || !pickTitle) {
      // No visible pick (loading / no films / exhausted) — clear the action so a
      // later fresh pick announces as "Tonight's", not a stale skip/watched.
      pickActionRef.current = 'initial'
      return
    }
    const reason = pickActionRef.current
    pickActionRef.current = 'initial'
    if (reason === 'skip') announce(`New briefing pick: ${pickTitle}.`)
    else if (reason === 'watched') announce(`Marked watched. New briefing pick: ${pickTitle}.`)
    else announce(`Tonight’s briefing pick: ${pickTitle}.`)
  }, [pickId, pickTitle, announce])

  // Exhausted — the user has worked through the whole mood queue.
  useEffect(() => {
    if (isExhausted) announce('No more picks for this mood.')
  }, [isExhausted, announce])

  return (
    <section className="relative px-5 pt-4 pb-10 sm:px-8 sm:pt-6 sm:pb-12 lg:px-[88px] lg:pt-6 lg:pb-6">
      {/* Single polite live region for Briefing pick progression + action feedback. */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{statusMsg}</div>
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
      ) : !pick ? (
        <BriefingSkeleton />
      ) : (
        // Single confident pick. overflow-hidden contains the slide-in reveal
        // (x-translate) when the head advances on skip / watched / reshuffle.
        <div className="relative overflow-hidden">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={`${currentMood.id}-${pick.id}-${shuffleSeed}`}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
            >
              <BriefingSlide
                film={pick}
                matchPct={pick.matchPct}
                user={user}
                onWatch={onWatch}
                onSkip={handleSkip}
                onMarkedWatched={handleMarkedWatched}
                announce={announce}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </section>
  )
}
