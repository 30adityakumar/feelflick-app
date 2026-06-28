// useHeroTitleLogos — best-effort enrichment of the (≤3) Home hero standouts with
// their official transparent title logo (TMDb "title treatment"). Returns a
// Map<filmId, logoUrl>; films without a usable logo are simply absent, so the
// hero renders its text title for them.
//
// Design notes:
//   • Read-only + best-effort: any failure (no logo, network error, abort) is
//     swallowed and the film falls back to its text title. Never throws.
//   • Keyed by the hero films' stable (id:tmdbId) signature, so it fetches only
//     when the actual hero set changes — not on every parent re-render.
//   • In-flight requests are aborted on change/unmount (no stale state writes).

import { useEffect, useState } from 'react'
import { getTitleLogoUrl } from '@/shared/api/tmdb'

const tmdbIdOf = (f) => f?.tmdbId ?? f?.tmdb_id ?? null

export function useHeroTitleLogos(films) {
  const [logos, setLogos] = useState(() => new Map())

  // Stable dependency: only the hero identity matters, not object refs.
  const sig = (films || []).map(f => `${f?.id}:${tmdbIdOf(f) ?? ''}`).join('|')

  useEffect(() => {
    const list = (films || []).filter(f => f?.id != null && tmdbIdOf(f))
    if (!list.length) {
      // Avoid a needless ref change (and re-render churn) when already empty.
      setLogos(prev => (prev.size ? new Map() : prev))
      return
    }

    const ctrl = new AbortController()
    let active = true

    ;(async () => {
      const entries = await Promise.all(list.map(async (f) => {
        try {
          const url = await getTitleLogoUrl(tmdbIdOf(f), { signal: ctrl.signal })
          return url ? [f.id, url] : null
        } catch {
          return null // best-effort per film
        }
      }))
      if (!active) return
      setLogos(new Map(entries.filter(Boolean)))
    })()

    return () => { active = false; ctrl.abort() }
    // sig captures the meaningful inputs; films ref intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])

  return logos
}
