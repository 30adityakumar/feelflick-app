// src/features/movie/hooks/useMovieChapterNav.js
// Route-owned chapter scrollspy (§27). Observes the section elements named by `ids`
// (filtered to those actually present, so the spoiler chapter is only tracked once
// it is mounted/unlocked) and returns the id of the most-visible one for aria-current.

import { useEffect, useState } from 'react'

export function useMovieChapterNav(ids) {
  const [activeId, setActiveId] = useState(ids[0] || null)
  const key = ids.join(',')

  useEffect(() => {
    // No-op where IntersectionObserver is unavailable (jsdom/SSR) — the nav still
    // renders and its anchors still work; only the active-chapter highlight is idle.
    if (typeof IntersectionObserver === 'undefined') return undefined
    const targets = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!targets.length) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActiveId(visible.target.id)
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: [0, 0.12, 0.3] },
    )
    targets.forEach((t) => observer.observe(t))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return activeId
}
