// src/features/movie/components/MovieActionBar.jsx
// One compact, mobile-only Film action bar (§28). It is the SAME action authority as
// the Hero / desktop sticky rail (derives from isInWatchlist / isWatched / loading /
// canAct passed by MovieDetail) — not a second navigation system. It is positioned
// ABOVE the canonical AppShell BottomNav via CSS (clearance verified in screenshots),
// never via z-index. Mobile-only: hidden at the desktop breakpoint by CSS.

const IconTrailer = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
)
const IconSave = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)
const IconWatched = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {filled
      ? <path d="M20 6L9 17l-5-5" />
      : <><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></>}
  </svg>
)

export default function MovieActionBar({
  onPlayTrailer, isInWatchlist, isWatched,
  onToggleWatchlist, onToggleWatched, loading = {}, canAct,
}) {
  return (
    <div className="ff-movie-action-bar" role="toolbar" aria-label="Film actions">
      {/* Each button keeps a stable aria-label so the visible label can collapse to
          icon-only at extreme-narrow widths (≤280px, e.g. 320px @ 200% zoom) without
          losing its accessible name. Visible labels stay within WCAG label-in-name. */}
      <button
        type="button"
        className="ff-movie-action-bar__btn"
        onClick={onPlayTrailer}
        aria-label="Trailer"
      >
        <IconTrailer />
        <span className="ff-movie-action-bar__label">Trailer</span>
      </button>

      <button
        type="button"
        className="ff-movie-action-bar__btn"
        onClick={onToggleWatchlist}
        disabled={!canAct || loading.watchlist}
        aria-pressed={isInWatchlist}
        aria-label={isInWatchlist ? 'Saved' : 'Save'}
        title={!canAct ? 'Sign in to save films' : undefined}
      >
        <IconSave filled={isInWatchlist} />
        <span className="ff-movie-action-bar__label">{isInWatchlist ? 'Saved' : 'Save'}</span>
      </button>

      <button
        type="button"
        className={`ff-movie-action-bar__btn${isWatched ? ' is-on' : ''}`}
        onClick={onToggleWatched}
        disabled={!canAct || loading.watched}
        aria-pressed={isWatched}
        aria-label={isWatched ? 'Watched' : 'Mark watched'}
        title={!canAct ? 'Sign in to track what you watch' : undefined}
      >
        <IconWatched filled={isWatched} />
        <span className="ff-movie-action-bar__label">{isWatched ? 'Watched' : 'Watch'}</span>
      </button>
    </div>
  )
}
