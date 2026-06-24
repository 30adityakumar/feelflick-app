// src/features/movie/components/PostWatchPortrait.jsx
// The watched-only spoiler chapter (§8/§15/§16/§17). Rendered by MovieDetail ONLY
// when the relationship state is watched, so none of its content (or the lazy
// Parasite chunk) is mounted/fetched before Watched. Dispatches the Parasite
// curated portrait vs the honest generic state, then renders the watched-gated
// generated impressions and social notes for ALL watched films.

import { lazy, Suspense } from 'react'
import GenericPostWatchState from './GenericPostWatchState'
import ViewerNotes from '../ViewerNotes'
import SocialContext from './SocialContext'

// Lazy so the spoiler text + curated module never enter the pre-watch bundle.
const ParasitePostWatchPortrait = lazy(() => import('./ParasitePostWatchPortrait'))
// Inlined (not imported from the curated module) so the dispatcher's chunk stays
// free of the spoiler data.
const PARASITE_TMDB_ID = 496243

export default function PostWatchPortrait({ mvId, viewerNotes = null, friends = [], twin = null }) {
  const isParasite = mvId === PARASITE_TMDB_ID
  return (
    <section
      id="after-watching"
      className="ff-movie-section ff-movie-postwatch ff-movie-chapter-anchor"
      aria-labelledby="postwatch-h"
      tabIndex={-1}
    >
      <h2 id="postwatch-h" className="sr-only">After watching</h2>
      {isParasite
        ? (
          <Suspense fallback={<div className="ff-movie-portrait__loading" aria-hidden="true" />}>
            <ParasitePostWatchPortrait />
          </Suspense>
          )
        : <GenericPostWatchState />}

      {/* Watched-gated, for every watched film: generated impressions (§19) and
          social notes (§18). Each self-hides when there is nothing to show. */}
      <ViewerNotes notes={viewerNotes} />
      <SocialContext friends={friends} twin={twin} />
    </section>
  )
}
