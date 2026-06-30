// src/features/movie/components/SpoilerBoundary.jsx
// The visible boundary card shown BEFORE the post-watch chapter unlocks (§15).
// It is rendered only when spoiler content is locked; the spoiler chapter itself
// is not mounted, so this card explains the boundary without leaking anything.

export default function SpoilerBoundary({ signedIn }) {
  return (
    <section className="ff-movie-section ff-movie-spoiler-boundary" aria-labelledby="spoiler-boundary-h">
      <div className="ff-movie-spoiler-boundary__inner">
        <div className="ff-movie-spoiler-boundary__icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div className="ff-movie-spoiler-boundary__body">
          <p className="ff-movie-eyebrow ff-movie-spoiler-boundary__eyebrow">Interpretation locked</p>
          <h2 id="spoiler-boundary-h" className="ff-movie-spoiler-boundary__h">
            The page stops before interpretation.
          </h2>
          <p className="ff-movie-spoiler-boundary__copy">
            {signedIn
              ? 'Mark this film watched and the narrative shape, motifs, ending reflection, and spoiler-aware notes appear here automatically.'
              : 'Sign in and mark this film watched to unlock the narrative shape, motifs, ending reflection, and spoiler-aware notes.'}
          </p>
        </div>
      </div>
    </section>
  )
}
