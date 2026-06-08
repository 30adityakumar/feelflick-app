import { useState, useEffect } from 'react'
import { getMovieWatchProviders } from '@/shared/api/tmdb'

// ── Streaming provider chip (single best provider) ──────────────────────────
// Borrowed from home-v2/sections-top.jsx — same compact chip with logo +
// "Streaming on Netflix" / "Rent on Apple TV+" label. Returns null when TMDB
// has no provider for the title; the chip then doesn't render.
export function useStreamingProvider(tmdbId) {
  const [provider, setProvider] = useState(null);
  useEffect(() => {
    if (!tmdbId) { setProvider(null); return; }
    const controller = new AbortController();
    let cancelled = false;
    setProvider(null);
    getMovieWatchProviders(tmdbId, { region: 'CA', fallbackRegion: 'US', signal: controller.signal })
      .then(data => {
        if (cancelled) return;
        const p = data?.providers?.[0];
        if (p) setProvider(p);
      })
      .catch(() => { /* non-fatal */ });
    return () => { cancelled = true; controller.abort(); };
  }, [tmdbId]);
  return provider;
}
