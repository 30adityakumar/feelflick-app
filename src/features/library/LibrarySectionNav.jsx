// src/features/library/LibrarySectionNav.jsx
// F6.6 — restrained cross-navigation between the two Library sections (Watchlist + Diary).
// Direction A: TWO focused routes under one shared "Your library" identity — NOT tabs, NOT
// a merged dataset, NOT a /library route. These are real links (route navigation), so this
// is a <nav> with native <Link>s, never role="tablist"/"tab" and never arrow-key behavior.
//
// Active state is driven by an explicit `current` prop (not NavLink path-matching) so the
// /watched compatibility alias — which renders the Diary surface — correctly marks Diary
// active. Presentation-only: no data fetch, no context, no Supabase/auth, no side effects.

import { Link } from 'react-router-dom'
import './library.css'

const SECTIONS = [
  { key: 'watchlist', to: '/watchlist', label: 'Watchlist' },
  { key: 'diary',     to: '/history',   label: 'Diary' },
]

export default function LibrarySectionNav({ current }) {
  return (
    <nav aria-label="Library sections" className="ff-library-nav">
      {SECTIONS.map(s => {
        const active = current === s.key
        return (
          <Link
            key={s.key}
            to={s.to}
            aria-current={active ? 'page' : undefined}
            className={active ? 'ff-library-nav__link ff-library-nav__link--active' : 'ff-library-nav__link'}
          >
            {s.label}
          </Link>
        )
      })}
    </nav>
  )
}
