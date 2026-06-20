// src/features/home/components/HomeShortcutStrip.jsx
// The three quick-action shortcuts that sit AFTER the hero (never overlapping it):
//   • Match the moment → Discover (mood / company / time)
//   • Browse your way   → Browse (genre / year / language)
//   • Log a movie       → Browse catalog (feed the engine)
//
// Desktop: one visually-connected strip of three equal segments.
// Mobile/tablet: a compact horizontal snap carousel that reveals part of the
// next item (a "swipe me" affordance) rather than a tall vertical stack.

import { Link } from 'react-router-dom'
import { Clock3, LayoutGrid, Plus } from 'lucide-react'

const SHORTCUTS = [
  { to: '/discover', Icon: Clock3, title: 'Match the moment', sub: 'Mood, company, and time' },
  { to: '/browse', Icon: LayoutGrid, title: 'Browse your way', sub: 'Genre, year, language' },
  { to: '/browse', Icon: Plus, title: 'Log a movie', sub: 'Make future picks sharper' },
]

export default function HomeShortcutStrip() {
  return (
    <nav className="ff-shortcuts" aria-label="Quick actions">
      {SHORTCUTS.map(({ to, Icon, title, sub }, i) => (
        <Link key={`${to}-${i}`} to={to} className="ff-shortcut">
          <span className="ff-shortcut__icon" aria-hidden="true"><Icon className="h-[18px] w-[18px]" /></span>
          <span className="ff-shortcut__copy">
            <span className="ff-shortcut__title">{title}</span>
            <span className="ff-shortcut__sub">{sub}</span>
          </span>
        </Link>
      ))}
    </nav>
  )
}
