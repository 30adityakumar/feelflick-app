// src/features/watchlist/components/WatchlistHeader.jsx
// Watchlist masthead: "Your library" eyebrow, the editorial "Saved for later." title + subtitle,
// and the complete saved-film count (right-aligned on desktop, stacked on mobile). The single
// visible <h1> lives here. The Library section nav is rendered ABOVE this by the route shell.

import Eyebrow from '@/shared/ui/Eyebrow'

const TONE = {
  text: 'var(--ts-text-primary, #f3ecdf)',
  textSoft: 'var(--ts-text-secondary, #beb8ad)',
}

export default function WatchlistHeader({ total }) {
  return (
    <section className="ff-wl-section ff-wl-masthead">
      <div className="ff-wl-masthead__row">
        <div className="ff-wl-masthead__copy">
          <Eyebrow color={TONE.textSoft} spacing="0.32em" size={10}>Your library</Eyebrow>
          <h1 className="ff-wl-hero">
            Saved <em>for later.</em>
          </h1>
          <p className="ff-wl-masthead__sub">Films you saved for another moment.</p>
        </div>
        <p className="ff-wl-masthead__meta">{total} {total === 1 ? 'film' : 'films'} saved</p>
      </div>
    </section>
  )
}
