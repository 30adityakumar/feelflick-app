// FeelFlick — Home v2 (Briefing edition).
// Mounted at /home-v2 in parallel with /home.
//
// Drops the internal HPNav (AppShell owns TopNav). All data flows through
// the HomeDataProvider (live Supabase reads for user/films/recent/DNA/
// friends/lists). Action handlers write to real tables and navigate to v2
// surfaces (/movie/:tmdbId, /profile/:userId, /lists/curated/:slug).

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

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

function HomeV2Body() {
  usePageMeta({ title: 'Home — FeelFlick' })
  const navigate = useNavigate()
  const location = useLocation()
  const reduced = useReducedMotion()
  const { user: authUser } = useAuthSession()
  const { loading, moods: liveMoods } = useHomeData()
  const [currentMood, setMood] = useState(MOOD_META[0])
  const [userPickedMood, setUserPickedMood] = useState(false)
  const [shuffleSeed, setShuffleSeed] = useState(0)
  // Snapshot the fromOnboarding flag once on mount — we don't want the
  // black-handoff overlay to replay if the user later navigates back to /home
  // from somewhere else. Pairs with Onboarding's fade-out so the seam between
  // celebration and home reads as a single smooth crossfade.
  const fromOnboardingRef = useRef(location.state?.fromOnboarding === true)
  // After the overlay finishes its fade-out we unmount it so it isn't a stale
  // pointer-events-none div lingering at opacity 0 in the DOM tree.
  const [handoffOverlayVisible, setHandoffOverlayVisible] = useState(
    () => fromOnboardingRef.current && !reduced,
  )

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
    // Two writes, two purposes:
    //
    // 1. user_interactions ('dismiss') — product-analytics log of "user said no
    //    to this film." The interaction_type CHECK constraint allows
    //    {view,hover,click,search,filter,scroll,play_trailer,share,dismiss};
    //    'skip' isn't in the set, so we use 'dismiss' (closest semantic) and
    //    carry the concrete action in metadata.action.
    //
    // 2. recommendation_impressions.skipped = true — flips the most-recent
    //    impression row for (user, movie) so the engine's negative-signal
    //    model picks it up. computeNegativeSignals reads this column to
    //    populate skippedDirectors / skippedGenres / skippedFitProfiles /
    //    skippedMoodTags — which feed back into scoreMovieForUser the next
    //    time the user lands on /home. Without this write, briefing skips
    //    only hide-in-session and never teach the engine.
    //
    //    Order matters: the briefing's per-active-slide impression effect
    //    (sections-top.jsx) has already created a `placement: 'hero'` row
    //    for this film when the slide became active. updateImpression finds
    //    THAT row and flips the flag.
    trackInteraction('dismiss', {
      movieId: film.id,
      source: 'briefing',
      metadata: { action: 'skip', mood: currentMood?.id ?? null },
    }).catch(() => { /* non-fatal */ })
    if (authUser?.id) {
      updateImpression(authUser.id, film.id, 'skipped').catch(() => {})
    }
  }, [currentMood, authUser?.id])

  const onReshuffle = useCallback(() => {
    setShuffleSeed(s => s + 1)
  }, [])

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
    <div className="ff-home-v2" style={{ minHeight: '100vh', background: HP.bg, color: HP.text, position: 'relative', overflowX: 'hidden' }}>
      {/* Mood-tuned ambient gradient — reactive */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse 80% 50% at 15% 0%, ${currentMood.hex}1f 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 85% 100%, ${currentMood.hex}14 0%, transparent 50%)`,
        transition: 'background 0.6s ease',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <MoodReactor currentMood={currentMood} setMood={handleSetMood} onReshuffle={onReshuffle} />
        <TheBriefing
          currentMood={currentMood}
          shuffleSeed={shuffleSeed}
          user={authUser}
          onWatch={onWatch}
          onSkip={onSkip}
        />
        <ContinueWatching onResume={onWatch} />
        {/* Section order — descending actionability:
             1. Briefing (tonight's pick — primary recommendation)
             2. CuratedLists (more picks — alternatives, still actionable)
             3. TasteMatch → TasteTwinPulse (social cluster — people then their picks)
             4. CinematicDNA (reflective portrait — confidence reveal)
             5. QuickLog (utility, lowest priority) */}
        <CuratedLists onOpenList={onOpenList} />
        <TasteMatch onOpenFriend={onOpenFriend} />
        <TasteTwinPulse onWatch={onWatch} />
        <CinematicDNA />
        <QuickLog onLog={onLog} />
        <PageEndCard
          currentMood={currentMood}
          onDiscover={() => navigate('/discover')}
        />
      </div>

      {/* Black handoff overlay — only on the first arrival from onboarding.
         Pairs with Onboarding's celebration fade-out (the celebration content
         dims to 0 over 500ms while the black bg stays); this overlay then
         covers /home at mount and fades up over 900ms, revealing the page
         smoothly. delay:0.15s gives React time to commit the first paint
         before the fade starts, so the user never sees a flash of empty page.
         Skipped for prefers-reduced-motion. */}
      {handoffOverlayVisible && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[9998] bg-black"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          onAnimationComplete={() => setHandoffOverlayVisible(false)}
        />
      )}
    </div>
  )
}

export default function Home() {
  return (
    <HomeDataProvider>
      <HomeV2Body />
    </HomeDataProvider>
  )
}
