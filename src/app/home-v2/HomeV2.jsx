// FeelFlick — Home v2 (Briefing edition).
// Mounted at /home-v2 for parallel comparison against /home.
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { useAuthSession } from '@/shared/hooks/useAuthSession';
import ToastNotification from '@/components/ToastNotification';

import { FILMS, HP, MOODS, USER as USER_FALLBACK } from './data';
import { HPNav } from './atoms';
import { BriefMasthead, MoodReactor, TheBriefing } from './sections-top';
import {
  ContinueWatching, CinematicDNA, RecentlyLogged,
  TasteMatch, CuratedLists, QuickLog,
} from './sections-bottom';
import './home-v2.css';

const TOAST_TIMEOUT_MS = 4500;

export default function HomeV2() {
  const navigate = useNavigate();
  const { user: authUser } = useAuthSession();
  const [currentMood, setMood] = useState(MOODS[0]);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [toast, setToast] = useState(null);

  // Derive a USER object from the live auth session, falling back to the
  // prototype default if the session hasn't loaded yet.
  const user = useMemo(() => {
    if (!authUser) return USER_FALLBACK;
    const meta = authUser.user_metadata || {};
    const name = meta.name?.split(' ')[0] || meta.first_name || authUser.email?.split('@')[0] || USER_FALLBACK.name;
    return { name, watched: USER_FALLBACK.watched };
  }, [authUser]);

  const showToast = useCallback((message, subtext, opts = {}) => {
    setToast({ message, subtext, ...opts });
  }, []);

  // === Handlers wired through the page ===
  const goToFilm = useCallback((filmKey) => {
    const film = FILMS[filmKey];
    if (film?.tmdbId) navigate(`/movie/${film.tmdbId}`);
  }, [navigate]);

  const onWatch = useCallback((filmKey) => goToFilm(filmKey), [goToFilm]);
  const onResume = useCallback((filmKey) => goToFilm(filmKey), [goToFilm]);
  const onCardClick = useCallback((filmKey) => goToFilm(filmKey), [goToFilm]);

  const onSave = useCallback((filmKey) => {
    const film = FILMS[filmKey];
    showToast(`Saved ${film?.title ?? 'film'} to your watchlist.`, 'Open watchlist', {
      ctaLabel: 'View watchlist',
      ctaHref: '/watchlist',
    });
  }, [showToast]);

  const onSkip = useCallback((filmKey) => {
    const film = FILMS[filmKey];
    showToast(`Skipped ${film?.title ?? 'film'}.`, "We'll learn from this for tomorrow.");
  }, [showToast]);

  const onReshuffle = useCallback(() => {
    setShuffleSeed((s) => s + 1);
    showToast('Briefing reshuffled.', 'Same mood, new order.');
  }, [showToast]);

  const onLog = useCallback((query) => {
    const trimmed = (query || '').trim();
    navigate(trimmed ? `/discover?q=${encodeURIComponent(trimmed)}` : '/discover');
  }, [navigate]);

  const onOpenList = useCallback((slug) => {
    navigate(slug ? `/lists/curated/${slug}` : '/lists/curated');
  }, [navigate]);

  const onOpenFriends = useCallback(() => navigate('/people'), [navigate]);
  const onOpenAccount = useCallback(() => navigate('/account'), [navigate]);

  return (
    <div className="ff-home-v2" style={{ minHeight: '100vh', background: HP.bg, color: HP.text, position: 'relative', overflowX: 'hidden' }}>
      {/* Mood-tuned ambient gradient — reactive */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse 80% 50% at 15% 0%, ${currentMood.hex}1f 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 85% 100%, ${currentMood.hex}14 0%, transparent 50%)`,
        transition: 'background 0.6s ease',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HPNav user={user} onAvatarClick={onOpenAccount} />
        <BriefMasthead user={user} currentMood={currentMood} />
        <MoodReactor currentMood={currentMood} setMood={setMood} />
        <TheBriefing
          currentMood={currentMood}
          shuffleSeed={shuffleSeed}
          onWatch={onWatch}
          onSave={onSave}
          onSkip={onSkip}
          onReshuffle={onReshuffle}
        />
        <ContinueWatching onResume={onResume} />
        <CinematicDNA />
        <RecentlyLogged onCardClick={onCardClick} />
        <TasteMatch onOpenFriends={onOpenFriends} />
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
  );
}
