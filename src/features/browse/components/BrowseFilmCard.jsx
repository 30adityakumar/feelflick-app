// src/features/browse/components/BrowseFilmCard.jsx
// Presentational poster card for the /browse grid.
//
// Wiring (save/watched writes, TMDB-only handling, watched/watchlist sets) stays
// in the Browse container — this card just renders and calls the handlers it's
// given. DOM mirrors the Home card's accessible pattern: a full 2:3 poster, a
// transparent SIBLING overlay button as the Film File target (never a button
// nested inside a button), and Save/Watched controls layered above it.
//
// Honesty: cards carry objective catalogue facts only. Any `evidence`/`badge` is
// passed in by the container, already gated to the active sort + trustworthy
// fields (no match %, no "Best fit", no synthesized personal reason, no fake
// availability). Missing artwork falls back to a neutral title plate.

import { Bookmark, Check, Eye } from 'lucide-react'

export default function BrowseFilmCard({
  film,
  evidence = null,      // { lead, detail } | null — objective, sort-appropriate
  badge = null,         // string | null — rare, threshold-backed
  watched = false,
  inWatchlist = false,
  showActions = true,
  onOpen,
  onToggleWatched,
  onToggleWatchlist,
}) {
  if (!film) return null
  const meta = [film.dir && film.dir !== '—' ? film.dir : null, film.runtime ? `${film.runtime} min` : (film.genre || null)]
    .filter(Boolean).join(' · ')

  return (
    <article className="ff-bcard">
      <div className="ff-bcard__poster">
        {film.poster
          ? <img src={film.poster} alt={`${film.title} poster`} loading="lazy" className="ff-bcard__img" />
          : <div className="ff-bcard__fallback" aria-hidden="true"><span>{film.title}</span></div>}
        <div className="ff-bcard__scrim" aria-hidden="true" />

        {badge ? <div className="ff-bcard__badge">{badge}</div> : null}

        {/* Whole-poster navigation target — sibling overlay, not a nested button. */}
        <button type="button" className="ff-bcard__open" aria-label={`Open Film File for ${film.title}`} onClick={() => onOpen?.(film)} />

        {showActions ? (
          <div className="ff-bcard__actions">
            <button
              type="button"
              className={`ff-bcard__action${inWatchlist ? ' is-active' : ''}`}
              aria-label={inWatchlist ? `Remove ${film.title} from watchlist` : `Add ${film.title} to watchlist`}
              aria-pressed={inWatchlist}
              onClick={(e) => { e.stopPropagation(); onToggleWatchlist?.(film) }}
            >
              <Bookmark className="h-[17px] w-[17px]" fill={inWatchlist ? 'currentColor' : 'none'} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`ff-bcard__action${watched ? ' is-active' : ''}`}
              aria-label={watched ? `Mark ${film.title} as not watched` : `Mark ${film.title} as already watched`}
              aria-pressed={watched}
              onClick={(e) => { e.stopPropagation(); onToggleWatched?.(film) }}
            >
              {watched ? <Check className="h-[17px] w-[17px]" aria-hidden="true" /> : <Eye className="h-[17px] w-[17px]" aria-hidden="true" />}
            </button>
          </div>
        ) : null}

        {evidence ? (
          <div className="ff-bcard__evidence">
            <strong>{evidence.lead}</strong>
            {evidence.detail ? <span>{evidence.detail}</span> : null}
          </div>
        ) : null}
      </div>

      <div className="ff-bcard__copy">
        <div className="ff-bcard__titleline">
          <h3 className="ff-bcard__title">{film.title}</h3>
          {film.year ? <span className="ff-bcard__year">{film.year}</span> : null}
        </div>
        {meta ? <div className="ff-bcard__meta">{meta}</div> : null}
      </div>
    </article>
  )
}
