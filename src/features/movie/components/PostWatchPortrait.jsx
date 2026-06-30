// src/features/movie/components/PostWatchPortrait.jsx
// The watched-only spoiler chapter (§8/§15/§16/§17). Rendered by MovieDetail ONLY
// when the relationship state is watched, so none of its content (or the lazy
// Parasite chunk) is mounted/fetched before Watched. Dispatches:
//   Parasite (496243) → lazy ParasitePostWatchPortrait (static curated data)
//   All others        → FilmPortrait fed from film_portraits table (LLM-generated)
//                       or null when no portrait exists yet

import { lazy, Suspense } from 'react'
import FilmPortrait from './FilmPortrait'
import { useFilmPortrait } from '../hooks/useFilmPortrait'
import ViewerNotes from '../ViewerNotes'
import SocialContext from './SocialContext'

// Lazy so the spoiler text + curated module never enter the pre-watch bundle.
const ParasitePostWatchPortrait = lazy(() => import('./ParasitePostWatchPortrait'))
// Inlined so this dispatcher chunk stays free of the curated spoiler data.
const PARASITE_TMDB_ID = 496243

export default function PostWatchPortrait({ mvId, viewerNotes = null, friends = [], twin = null }) {
  const isParasite = mvId === PARASITE_TMDB_ID
  const { portrait } = useFilmPortrait(isParasite ? null : mvId)

  return (
    <section
      className="ff-movie-section ff-movie-postwatch ff-movie-chapter-anchor"
      aria-labelledby="postwatch-h"
    >
      <h2 id="postwatch-h" className="sr-only">After watching</h2>

      {isParasite
        ? (
          <Suspense fallback={<div className="ff-movie-portrait__loading" aria-hidden="true" />}>
            <ParasitePostWatchPortrait />
          </Suspense>
          )
        : portrait
          ? <FilmPortrait portrait={portrait} />
          : null}

      {/* Watched-gated for every watched film: generated impressions (§19) and
          social notes (§18). Each self-hides when there is nothing to show. */}
      <ViewerNotes notes={viewerNotes} />
      <SocialContext friends={friends} twin={twin} />
    </section>
  )
}
