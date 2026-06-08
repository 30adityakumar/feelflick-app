// FeelFlick — Home (the Briefing edition). Mounted at /home.
//
// AppShell owns the global TopNav. All data flows through the HomeDataProvider
// (live Supabase reads for user/films/recent/DNA/friends/lists). Action handlers
// write to real tables and navigate to /movie/:tmdbId, /profile/:userId,
// /lists/curated/:slug.

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { trackInteraction } from '@/shared/services/interactions'
import { updateImpression } from '@/shared/services/recommendations'

import { HP, MOOD_META } from './data'
import { MoodReactor, TheBriefing } from './sections-top'
import {
  ContinueWatching, CinematicDNA, TasteTwinPulse,
  TasteMatch, CuratedLists, QuickLog, PageEndCard,
} from './sections-bottom'
import { HomeDataProvider, useHomeData } from './useHomeData'
import './home.css'

// Calm, honest top-level error when the home briefing data fails to load. No raw
// Supabase error, no stack trace, no auto-reload — just a clear message and a
// gentle suggestion to refresh.
function HomeLoadError() {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 px-6 py-24 text-center">
      <p style={{ fontSize: 16, fontWeight: 600, color: HP.text, fontFamily: 'Outfit, Inter, sans-serif', margin: 0 }}>
        We couldn&rsquo;t load your home briefing.
      </p>
      <p style={{ fontSize: 14, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif', margin: 0 }}>
        Try refreshing in a moment.
      </p>
    </div>
  )
}

function HomeBody() {
  usePageMeta({ title: 'Home — FeelFlick' })
  const navigate = useNavigate()
  const { user: authUser } = useAuthSession()
  const { loading, error, moods: liveMoods } = useHomeData()
  const [currentMood, setMood] = useState(MOOD_META[0])
  const [userPickedMood, setUserPickedMood] = useState(false)

  // When the data hook finishes, snap the initial mood tab to the user's first
  // baseline pick from Onboarding Step 1 (useHomeData reorders `moods` so the
  // baseline mood sits at index 0). Skipped once the user manually picks a tab.
  useEffect(() => {
    if (loading || userPickedMood) return
    const firstMoodId = liveMoods?.[0]?.id
    if (!firstMoodId || firstMoodId === currentMood.id) return
    const next = MOOD_META.find(m => m.id === firstMoodId)
    if (next) setMood(next)
  }, [loading, liveMoods, userPickedMood, currentMood.id])

  const handleSetMood = useCallback((m) => {
    setUserPickedMood(true)
    setMood(m)
  }, [])

  // === Handlers ============================================================
  const onWatch = useCallback((film) => {
    if (film?.tmdbId) navigate(`/movie/${film.tmdbId}`)
  }, [navigate])

  // Watchlist + watched are handled per-card by useUserMovieStatus (icon
  // state change is the feedback). Skip writes a dismiss row + the card
  // disappears via TheBriefing's hiddenIds — that's also the feedback.
  // No toasts: the card-level state changes are the strongest possible
  // acknowledgement, and the previous toast copy ("we'll learn from this
  // for tomorrow") overstated what the engine actually does with skips.
  const onSkip = useCallback((film) => {
    if (!film?.id) return
    // Skip is a LEARNING SIGNAL, not just analytics — so both writes matter, but
    // neither blocks the user moving on (the visible pick advances in
    // TheBriefing.handleSkip right after this returns). Explicit F4.3 sequence,
    // each write failure-contained (consistent with Discover's non-blocking skip):
    //
    //   1. recommendation_impressions.skipped = true — flips the most-recent
    //      impression row for (user, movie) so the engine's negative-signal model
    //      picks it up (computeNegativeSignals → skippedDirectors / skippedGenres /
    //      skippedFitProfiles / skippedMoodTags → scoreMovieForUser next visit).
    //      The briefing's per-active-slide impression effect already logged the
    //      `placement: 'hero'` row for this film, so updateImpression finds + flips
    //      THAT row. Without this write, skips only hide-in-session.
    //   2. user_interactions ('dismiss') — product-analytics log. The
    //      interaction_type CHECK allows {view,hover,click,search,filter,scroll,
    //      play_trailer,share,dismiss}; 'skip' isn't in the set, so 'dismiss' is
    //      the closest semantic, with the concrete action in metadata.action.
    //   3. advance — handled by the caller (hide the slide → next pick).
    //
    // Payloads/tables/events are unchanged; both are best-effort (.catch) so a
    // failed tracking write never leaves an unhandled promise or blocks the user.
    if (authUser?.id) {
      updateImpression(authUser.id, film.id, 'skipped').catch(() => { /* non-fatal */ })
    }
    trackInteraction('dismiss', {
      movieId: film.id,
      source: 'briefing',
      metadata: { action: 'skip', mood: currentMood?.id ?? null },
    }).catch(() => { /* non-fatal */ })
  }, [currentMood, authUser?.id])

  // QuickLog's "Open Browse" pill routes to /browse (the catalog).
  // Distinct from the page-end card's "Discover by mood" CTA — that
  // goes to /discover (the mood-driven engine). Two different exits
  // serving different intents.
  const onLog = useCallback(() => {
    navigate('/browse')
  }, [navigate])

  // Routes both curated and personal lists. The personal lists carry a
  // `kind` + `meta` payload that becomes URL params on the destination
  // route; curated lists keep using the existing slug-based path.
  const onOpenList = useCallback((slug, list) => {
    if (list?.kind && list.kind !== 'curated') {
      const params = new URLSearchParams()
      const m = list.meta || {}
      if (list.kind === 'director' && m.directorName) params.set('director', m.directorName)
      if (list.kind === 'similar' && m.seedId != null) {
        params.set('seed', String(m.seedId))
        if (m.seedTitle) params.set('title', m.seedTitle)
      }
      if (list.kind === 'genre' && m.dbName) {
        params.set('genre', m.dbName)
        if (m.displayName) params.set('display', m.displayName)
      }
      if (list.kind === 'fit' && m.fitKey) {
        params.set('fit', m.fitKey)
        if (m.label) params.set('label', m.label)
        if (m.title) params.set('title', m.title)
      }
      if (list.kind === 'actor' && m.actorName) params.set('actor', m.actorName)
      const qs = params.toString()
      navigate(`/lists/personal/${list.kind}${qs ? `?${qs}` : ''}`)
      return
    }
    navigate(slug ? `/lists/curated/${slug}` : '/lists')
  }, [navigate])

  const onOpenFriend = useCallback((userId) => {
    navigate(userId ? `/profile/${userId}` : '/people')
  }, [navigate])

  return (
    <div className="ff-home" style={{ minHeight: '100vh', background: HP.bg, color: HP.text, position: 'relative', overflowX: 'hidden' }}>
      {/* Mood-tuned ambient gradient — reactive */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse 80% 50% at 15% 0%, ${currentMood.hex}1f 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 85% 100%, ${currentMood.hex}14 0%, transparent 50%)`,
        transition: 'background 0.6s ease',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* a11y landmark (F12B): the visual masthead is the Briefing hero; an sr-only h1 gives the page its heading without competing with the pick. */}
        <h1 className="sr-only">Tonight — your nightly pick</h1>
        {error ? (
          // F4.3 — honest top-level load failure. Without this, a data error left
          // `loading` false with empty moods, so the Briefing showed a misleading
          // "no picks for this mood" state forever. Calm message, no raw error, no
          // auto-reload; rendering this (not the Briefing) also means no impression
          // is logged on an errored load.
          <HomeLoadError />
        ) : (
          <>
            {/* F4.4 — pick-first. Home leads with tonight's one pick; the mood
                control strip sits BELOW it as an optional "adjust mood", not the
                route's front door (that's Discover's deliberate session). */}
            <TheBriefing
              currentMood={currentMood}
              user={authUser}
              onWatch={onWatch}
              onSkip={onSkip}
            />
            <MoodReactor currentMood={currentMood} setMood={handleSetMood} />
            <ContinueWatching onResume={onWatch} />
            {/* Section order — descending actionability:
                 1. Briefing (tonight's pick — primary recommendation)
                 2. Adjust-mood strip (secondary control for the pick above)
                 3. CuratedLists (more picks — alternatives, still actionable)
                 4. TasteMatch → TasteTwinPulse (social cluster — people then their picks)
                 5. CinematicDNA (reflective portrait — confidence reveal)
                 6. QuickLog (utility, lowest priority) */}
            <CuratedLists onOpenList={onOpenList} />
            <TasteMatch onOpenFriend={onOpenFriend} />
            <TasteTwinPulse onWatch={onWatch} />
            <CinematicDNA />
            <QuickLog onLog={onLog} />
            <PageEndCard
              currentMood={currentMood}
              onDiscover={() => navigate('/discover')}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <HomeDataProvider>
      <HomeBody />
    </HomeDataProvider>
  )
}
