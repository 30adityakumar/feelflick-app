// FeelFlick — Home v2 (Briefing edition).
// Mounted at /home-v2 in parallel with /home.
//
// Drops the internal HPNav (AppShell owns TopNav). All data flows through
// the HomeDataProvider (live Supabase reads for user/films/recent/DNA/
// friends/lists). Action handlers write to real tables and navigate to v2
// surfaces (/movie/:tmdbId, /profile/:userId, /lists/curated/:slug).

import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import ToastNotification from '@/components/ToastNotification'

import { HP, MOOD_META } from './data'
import { BriefMasthead, MoodReactor, TheBriefing } from './sections-top'
import {
  ContinueWatching, CinematicDNA, RecentlyLogged,
  TasteMatch, CuratedLists, QuickLog,
} from './sections-bottom'
import { HomeDataProvider, useHomeData } from './useHomeData'
import './home-v2.css'

const TOAST_TIMEOUT_MS = 4500

function HomeV2Body() {
  const navigate = useNavigate()
  const { user: authUser } = useAuthSession()
  const { user: liveUser, loading } = useHomeData()
  const [currentMood, setMood] = useState(MOOD_META[0])
  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [toast, setToast] = useState(null)
  const [savedIds, setSavedIds] = useState(() => new Set())

  // Use live user from hook when available; show a fallback name during the
  // initial loading flash so the masthead doesn't blank-flicker.
  const user = useMemo(() => {
    if (!loading) return liveUser
    const meta = authUser?.user_metadata || {}
    const name = meta.name?.split(' ')[0] || meta.first_name || authUser?.email?.split('@')[0] || 'You'
    return { name, watched: liveUser.watched ?? 0 }
  }, [loading, liveUser, authUser])

  const showToast = useCallback((message, subtext, opts = {}) => {
    setToast({ message, subtext, ...opts })
  }, [])

  // === Handlers ============================================================
  const onWatch = useCallback((film) => {
    if (film?.tmdbId) navigate(`/movie/${film.tmdbId}`)
  }, [navigate])

  const onCardClick = onWatch

  const onSave = useCallback(async (film) => {
    if (!authUser?.id || !film?.id || savedIds.has(film.id)) return
    // Optimistic UI
    setSavedIds(prev => new Set(prev).add(film.id))
    try {
      const { error } = await supabase
        .from('user_watchlist')
        .insert({ user_id: authUser.id, movie_id: film.id })
      // 23505 = unique-violation (already in watchlist) — treat as success
      if (error && error.code !== '23505') throw error
      showToast(`Saved ${film.title} to your watchlist.`, 'Open watchlist', {
        ctaLabel: 'View watchlist', ctaHref: '/watchlist',
      })
    } catch (e) {
      console.error('[HomeV2.onSave]', e)
      setSavedIds(prev => {
        const next = new Set(prev)
        next.delete(film.id)
        return next
      })
      showToast('Could not save right now.', 'Try again in a moment.')
    }
  }, [authUser, savedIds, showToast])

  const onSkip = useCallback((film) => {
    // Skip is purely a UI dismiss for now — there's no impression-writer in
    // home-v2's context yet. Toast acknowledges the input.
    showToast(`Skipped ${film?.title ?? 'film'}.`, 'We’ll learn from this for tomorrow.')
  }, [showToast])

  const onReshuffle = useCallback(() => {
    setShuffleSeed(s => s + 1)
    showToast('Briefing reshuffled.', 'Same mood, new order.')
  }, [showToast])

  const onLog = useCallback((query) => {
    const trimmed = (query || '').trim()
    navigate(trimmed ? `/discover?q=${encodeURIComponent(trimmed)}` : '/discover')
  }, [navigate])

  const onOpenList = useCallback((slug) => {
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
        <BriefMasthead user={user} />
        <MoodReactor currentMood={currentMood} setMood={setMood} />
        <TheBriefing
          currentMood={currentMood}
          shuffleSeed={shuffleSeed}
          onWatch={onWatch}
          onSave={onSave}
          onSkip={onSkip}
          onReshuffle={onReshuffle}
          savedIds={savedIds}
        />
        <ContinueWatching onResume={onWatch} />
        <CinematicDNA />
        <RecentlyLogged onCardClick={onCardClick} />
        <TasteMatch onOpenFriend={onOpenFriend} />
        <CuratedLists onOpenList={onOpenList} />
        <QuickLog onLog={onLog} />
      </div>

      <AnimatePresence>
        {toast && (
          <ToastNotification
            key={`${toast.message}-${toast.subtext ?? ''}`}
            message={toast.message}
            subtext={toast.subtext}
            ctaLabel={toast.ctaLabel}
            ctaHref={toast.ctaHref}
            duration={TOAST_TIMEOUT_MS}
            onDismiss={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function HomeV2() {
  return (
    <HomeDataProvider>
      <HomeV2Body />
    </HomeDataProvider>
  )
}
