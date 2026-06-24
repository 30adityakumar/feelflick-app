// src/features/movie/components/GenericPostWatchState.jsx
// Honest reduced post-watch state for every non-Parasite watched film (§17). A
// polished note — NOT an empty shell, and NOT client-generated interpretation. The
// user's private rating/reflection (Your Take), any labelled generated impressions,
// social notes, and continuation render elsewhere in the watched flow.

export default function GenericPostWatchState() {
  return (
    <div className="ff-movie-portrait ff-movie-portrait--generic">
      <header className="ff-movie-portrait__head">
        <p className="ff-movie-eyebrow ff-movie-portrait__shield">After watching</p>
        <h3 className="ff-movie-portrait__title">Your reflection is ready.</h3>
        <p className="ff-movie-portrait__intro">
          This film does not yet have a curated post-watch portrait. Your rating, note,
          and viewing response are still saved privately.
        </p>
      </header>
    </div>
  )
}
