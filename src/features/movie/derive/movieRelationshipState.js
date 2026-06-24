// src/features/movie/derive/movieRelationshipState.js
// The single relationship-state authority for the Film File (§13). Derived purely
// from authentication + PERSISTED watched status + rating hydration status — never
// from a body class, a local prototype toggle, or an optimistic boolean.
//
//   anonymous                       — not signed in
//   signed_in_pre_watch             — signed in, not (yet) watched
//   signed_in_watched               — signed in, persisted watched, reflection loaded
//   watched_but_reflection_unavailable — watched, but the rating/reflection read failed

export const REL = {
  ANON: 'anonymous',
  PRE: 'signed_in_pre_watch',
  WATCHED: 'signed_in_watched',
  REFLECTION_ERR: 'watched_but_reflection_unavailable',
}

export function deriveRelationshipState({ signedIn, isWatched, ratingLoadError = false }) {
  if (!signedIn) return REL.ANON
  if (isWatched && ratingLoadError) return REL.REFLECTION_ERR
  if (isWatched) return REL.WATCHED
  return REL.PRE
}

// Spoiler material (narrative shape, interpretation, motifs, ending, friend/twin
// notes, generated impressions) unlocks ONLY when the current authenticated user's
// persisted watched status is true. The rating-read failure does not re-hide the
// spoiler chapter (the spoiler content is independent of the reflection form).
export function spoilerUnlocked(state) {
  return state === REL.WATCHED || state === REL.REFLECTION_ERR
}

export function isSignedIn(state) {
  return state !== REL.ANON
}
