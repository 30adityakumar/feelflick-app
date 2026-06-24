// src/features/movie/components/MovieChapterNav.jsx
// Route-owned chapter navigation (§27). Sticky below the AppShell header, single
// aria-current, scrollspy, keyboard-accessible anchors, reduced-motion-safe scroll.
// The "After watching" chapter is only PASSED IN once the spoiler chapter is
// unlocked, so its link never exists in the accessibility tree before Watched.

import { useMovieChapterNav } from '../hooks/useMovieChapterNav'

export default function MovieChapterNav({ chapters = [] }) {
  const ids = chapters.map((c) => c.id)
  const activeId = useMovieChapterNav(ids)

  if (chapters.length < 2) return null

  const onClick = (e, id) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    const reduce = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    // Move focus to the anchored region for keyboard users (preventScroll so the
    // smooth scroll above isn't overridden).
    el.focus?.({ preventScroll: true })
  }

  return (
    <nav className="ff-movie-chapternav" aria-label="Film File chapters">
      <ul className="ff-movie-chapternav__list">
        {chapters.map((c) => (
          <li key={c.id}>
            <a
              href={`#${c.id}`}
              className="ff-movie-chapternav__link"
              aria-current={activeId === c.id ? 'true' : undefined}
              onClick={(e) => onClick(e, c.id)}
            >
              {c.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
