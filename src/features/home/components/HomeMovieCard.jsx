// src/features/home/components/HomeMovieCard.jsx
// Poster-led recommendation card for the redesigned Home rows.
//
// This is a Home-specific COMPOSITION, not a fork of behaviour: it reuses the
// exact same action + analytics contract as the shared carousel MovieCard
// (useWatchlistContext + useUserMovieStatus, updateImpression('clicked'),
// track('card_clicked' | 'card_watchlisted'), navigate to /movie/:tmdbId). It
// exists because the shared MovieCard is hard-bound to the fixed-size carousel
// <Card> primitive (220×330) and a parent-driven hover model, whereas Home needs
// a poster that FILLS a responsive 5-column grid cell (desktop) or a snap
// carousel cell (mobile), plus an on-hover grounded reason.
//
// Layout = the locked prototype's `.card`: full 2:3 poster, lower scrim, title +
// concise meta, Save/Watched controls and the per-film reason revealed on
// hover/focus. The whole poster is one navigation target (a transparent sibling
// overlay button — NOT a button nested inside a button), with the Save/Watched
// controls layered above it so they take their own clicks.

import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, Check, Eye } from 'lucide-react'

import { useWatchlistContext } from '@/app/providers/WatchlistContext'
import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'
import { updateImpression } from '@/shared/services/recommendations'
import { track } from '@/shared/services/analytics'
import { SmartImg } from '../atoms'

const POSTER_SIZES = '(min-width: 1024px) 250px, (min-width: 768px) 30vw, 46vw'

function yearOf(film) {
  if (film?.release_year) return film.release_year
  if (film?.release_date) return new Date(film.release_date).getFullYear()
  return ''
}

// A grounded reason is the engine's per-film reason whose type is NOT the generic
// "Picked for you" fallback. Generic / missing → no reason shown (never fabricate).
function groundedReason(film) {
  const r = film?._reason
  if (r && r.type && r.type !== 'generic' && typeof r.text === 'string' && r.text.trim()) return r.text.trim()
  return null
}

export default function HomeMovieCard({ film, index = 0, placement = 'carousel', rowTitle = null }) {
  const navigate = useNavigate()
  const { user, ready } = useWatchlistContext()
  const tmdbId = film?.tmdb_id ?? film?.tmdbId ?? film?.id

  const {
    isInWatchlist,
    isWatched,
    loading: actionLoading,
    toggleWatchlist,
    toggleWatched,
  } = useUserMovieStatus({
    user: ready ? user : null,
    movie: ready ? film : null,
    source: 'carousel_row',
  })

  const open = useCallback(() => {
    // Outcome capture — same path the shared carousel card uses (placement-gated
    // shown→clicked attribution). Best-effort; never blocks navigation.
    if (placement && user?.id && film?.id) {
      updateImpression(user.id, film.id, 'clicked').catch(() => { /* non-fatal */ })
    }
    track('card_clicked', { movie_id: tmdbId, movie_title: film?.title, row_title: rowTitle, index })
    navigate(`/movie/${tmdbId}`)
  }, [placement, user?.id, film?.id, tmdbId, film?.title, rowTitle, index, navigate])

  const onSave = useCallback((e) => {
    e.stopPropagation()
    if (actionLoading.watchlist) return
    if (!isInWatchlist) {
      track('card_watchlisted', { movie_id: tmdbId, movie_title: film?.title, row_title: rowTitle })
    }
    toggleWatchlist()
  }, [actionLoading.watchlist, isInWatchlist, tmdbId, film?.title, rowTitle, toggleWatchlist])

  const onWatched = useCallback((e) => {
    e.stopPropagation()
    if (actionLoading.watched) return
    toggleWatched()
  }, [actionLoading.watched, toggleWatched])

  if (!film) return null
  const reason = groundedReason(film)
  const year = yearOf(film)
  const metaBits = [year, film.director_name && film.director_name !== 'Unknown' ? film.director_name : (film.primary_genre || null)]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="ff-hcard">
      <SmartImg
        film={{ id: film.id, title: film.title, poster: film.poster_path, year }}
        sizes={POSTER_SIZES}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div className="ff-hcard__scrim" aria-hidden="true" />

      {/* Whole-poster navigation target — a sibling overlay, never a nested button. */}
      <button type="button" className="ff-hcard__link" aria-label={`Open Film File for ${film.title}`} onClick={open} />

      {/* Save / Watched — layered above the link; revealed on hover/focus (always
          visible on touch via CSS). Real buttons → keyboard reachable; aria-pressed
          exposes state non-visually. */}
      {ready && user ? (
        <div className="ff-hcard__actions">
          <button
            type="button"
            className={`ff-hcard__icon${isInWatchlist ? ' is-active' : ''}`}
            aria-label={isInWatchlist ? `Remove ${film.title} from watchlist` : `Add ${film.title} to watchlist`}
            aria-pressed={isInWatchlist}
            disabled={actionLoading.watchlist}
            onClick={onSave}
          >
            <Bookmark className="h-[18px] w-[18px]" fill={isInWatchlist ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`ff-hcard__icon${isWatched ? ' is-active' : ''}`}
            aria-label={isWatched ? `Mark ${film.title} as not watched` : `Mark ${film.title} as watched`}
            aria-pressed={isWatched}
            disabled={actionLoading.watched}
            onClick={onWatched}
          >
            {isWatched ? <Check className="h-[18px] w-[18px]" aria-hidden="true" /> : <Eye className="h-[18px] w-[18px]" aria-hidden="true" />}
          </button>
        </div>
      ) : null}

      <div className="ff-hcard__info">
        <h3 className="ff-hcard__title">{film.title}</h3>
        {metaBits ? <div className="ff-hcard__meta">{metaBits}</div> : null}
        {reason ? <p className="ff-hcard__reason">{reason}</p> : null}
      </div>
    </article>
  )
}
