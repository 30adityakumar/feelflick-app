import { useState, useEffect } from 'react'
import { getMovieWatchProviders } from '@/shared/api/tmdb'

// ── Streaming provider (single best provider) + honest fetch status ──────────
// Returns { provider, status } where status is one of:
//   'idle'    — no tmdbId yet
//   'loading' — fetch in flight
//   'found'   — a provider was returned
//   'empty'   — fetch succeeded but TMDB has no provider for this title/region
//   'error'   — fetch failed
// Provider priority is whatever getMovieWatchProviders already returns
// (flatrate → rent → buy); we take providers[0] and do NOT re-order it.
export function useStreamingProvider(tmdbId) {
  const [state, setState] = useState({ provider: null, status: 'idle' });
  useEffect(() => {
    if (!tmdbId) { setState({ provider: null, status: 'idle' }); return; }
    const controller = new AbortController();
    let cancelled = false;
    setState({ provider: null, status: 'loading' });
    getMovieWatchProviders(tmdbId, { region: 'CA', fallbackRegion: 'US', signal: controller.signal })
      .then(data => {
        if (cancelled) return;
        const p = data?.providers?.[0];
        setState(p ? { provider: p, status: 'found' } : { provider: null, status: 'empty' });
      })
      .catch(() => { if (!cancelled) setState({ provider: null, status: 'error' }); });
    return () => { cancelled = true; controller.abort(); };
  }, [tmdbId]);
  return state;
}
