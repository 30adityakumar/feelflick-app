// src/features/discover/hooks/useDiscoverResultActions.js
// F3.4 — result-stage write/action handlers extracted VERBATIM from StagePick. Owns
// savedState/watchedState + the mark-watched timer; queue setters, navigate, user, and
// Stage-2 context arrive as params. Table names, event names, source values, metadata
// keys, 23505 idempotency, and optimistic transitions unchanged. handleNotTonight is
// exposed as handleSkip (rename only).

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { updateImpression } from '@/shared/services/recommendations'
import { trackInteraction } from '@/shared/services/interactions'

export function useDiscoverResultActions({ top, user, selected, intention, energy, who, setHiddenTopIds, setSelectedTopId, navigate }) {
  const [savedState, setSavedState] = useState('idle'); // idle | saving | saved | error
  const [watchedState, setWatchedState] = useState('idle'); // idle | watched
  // Per-film Saved + Watched state — when the user clicks Save or Mark
  // Watched, the button confirms success ("Saved", "Watched"). On
  // auto-advance to a new film, both reset to idle so the new top can be
  // saved/marked too.
  useEffect(() => { setSavedState('idle'); setWatchedState('idle'); }, [top?.id]);

  // === Action handlers ===
  // Stage 2 context shared across all interaction logs so the engine can
  // learn from POSITIVE actions (save, watch, click), not just negative
  // ones (skip). Previously Skip was the only handler writing
  // user_interactions with mood/intention/energy/who — the engine had a
  // negative bias because positive signals lost their full context.
  const interactionContext = (action) => ({
    movieId: top?.id,
    source: 'discover',
    metadata: { action, moods: selected, intention, energy, who },
  });

  // "See more" navigates to the deep film page (/movie/:tmdbId) where the
  // user finds extended synopsis, providers, similar films, etc. Fires
  // updateImpression('clicked') so the engine learns conversion AND
  // trackInteraction('click', …) so the engine sees the full Stage 2
  // context that drove the click — same metadata shape as Skip uses.
  const handleSeeMore = () => {
    if (!top?.tmdbId) return;
    if (user?.id && top?.id) {
      updateImpression(user.id, top.id, 'clicked').catch(() => {})
      trackInteraction('click', interactionContext('see_more')).catch(() => {})
    }
    navigate(`/movie/${top.tmdbId}`);
  };
  const handleSaveForLater = async () => {
    if (!user?.id || !top?.id || savedState !== 'idle') return;
    const filmId = top.id;
    setSavedState('saving');
    try {
      const { error } = await supabase
        .from('user_watchlist')
        .insert({ user_id: user.id, movie_id: filmId });
      if (error && error.code !== '23505') throw error; // 23505 = unique violation (already in list)
      setSavedState('saved');
      // Engine learning: flip the impression's added_to_watchlist flag
      // AND log the interaction with Stage 2 context. Both fire after
      // the watchlist write succeeds so we don't credit a failed save.
      updateImpression(user.id, filmId, 'saved').catch(() => {})
      trackInteraction('save', interactionContext('save_for_later')).catch(() => {})
    } catch (e) {
      console.error('[Discover.saveForLater]', e);
      setSavedState('error');
    }
  };
  // Skip Tonight — auto-advances to the next pick instead of bouncing home.
  // The page now behaves as a 3-pick swiper: skip the top → alternate #1
  // becomes top → alternate #2 becomes top → exhausted state. Each skip
  // still fires:
  //   1. user_interactions ('dismiss', source 'discover') — analytics log
  //   2. recommendation_impressions.skipped = true → engine's negative-
  //      signal model penalises matching directors/genres next /discover run
  // The skipped film also lands in hiddenTopIds for the rest of this
  // session AND gets a 30-day hard exclusion via useDiscoverData's
  // recent-skip query.
  const handleSkip = () => {
    if (!top?.id) return;
    trackInteraction('dismiss', {
      movieId: top.id,
      source: 'discover',
      metadata: {
        action: 'not_tonight',
        moods: selected,
        intention,
        energy,
        who,
      },
    }).catch(() => {})
    if (user?.id) {
      updateImpression(user.id, top.id, 'skipped').catch(() => {})
    }
    setHiddenTopIds(prev => new Set([...prev, top.id]));
    setSelectedTopId(null);
  };
  // Mark Watched — user has already seen this film. Closes the loop both
  // for the recommendation engine (don't surface this again) and the
  // user's own library. The button flips to "Watched" for a beat of
  // confirmation, then auto-advances to the next pick. Capture top.id in
  // a closure so the setTimeout still fires against the right film even
  // after the state change starts swapping in the next pick.
  const markWatchedTimeoutRef = useRef(null);
  useEffect(() => () => {
    if (markWatchedTimeoutRef.current) clearTimeout(markWatchedTimeoutRef.current);
  }, []);
  const handleMarkWatched = async () => {
    if (!top?.id || !user?.id || watchedState !== 'idle') return;
    const filmId = top.id;
    setWatchedState('watched');
    try {
      // 23505 (unique violation) = already in history; treat as success
      const { error } = await supabase
        .from('user_history')
        .insert({ user_id: user.id, movie_id: filmId, source: 'discover_marked' });
      if (error && error.code !== '23505') throw error;
    } catch (e) {
      console.error('[Discover.markWatched]', e);
      // Even on insert failure, hide locally so the user can move on
    }
    updateImpression(user.id, filmId, 'watched').catch(() => {});
    trackInteraction('watch', interactionContext('mark_watched')).catch(() => {});
    // 600ms holds "Watched ✓" long enough to register as confirmation
    // before the crossfade swap (180ms) carries the next pick in. Cleared
    // on unmount so a quick Tweak inputs / Start over click during the
    // hold doesn't fire a setState on an unmounted component.
    markWatchedTimeoutRef.current = setTimeout(() => {
      setHiddenTopIds(prev => new Set([...prev, filmId]));
      setSelectedTopId(null);
      markWatchedTimeoutRef.current = null;
    }, 600);
  };

  return { savedState, watchedState, handleSeeMore, handleSaveForLater, handleMarkWatched, handleSkip };
}
