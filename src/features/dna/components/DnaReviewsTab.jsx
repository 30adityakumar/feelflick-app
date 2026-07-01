// Reviews tab — real reviews (rating rows with a non-empty body). Gated by reviewsPublic.
// Shows real like counts + a like button (visitor). No fabricated likes/comments.
import { Link } from 'react-router-dom'
import { starString } from './DnaPoster'

export default function DnaReviewsTab({ reviews = [], visible = true, isOwner, social }) {
  if (!visible && !isOwner) return <div className="dna__shell dna__section"><p className="dna-empty">This member’s reviews are private.</p></div>
  return (
    <section className="dna__section">
      <div className="dna__shell">
        <div className="dna__section-head"><div><p className="dna__eyebrow">{reviews.length} review{reviews.length === 1 ? '' : 's'}</p><h2>In their own words.</h2></div><p>The written voice behind the taste.</p></div>
        {reviews.length === 0 ? <p className="dna-empty">No reviews written yet.</p> : (
          <div className="dna-review-grid">
            {reviews.map((r) => {
              const like = social?.likeFor?.(r.movieId) || { count: 0, mine: false }
              return (
                <article className="dna-review-card" key={`${r.movieId}-${r.ratedAt}`}>
                  <h3>{r.movieId != null ? <Link to={`/movie/${r.movieId}`}>{r.title || 'Film'}</Link> : (r.title || 'Film')}{r.rating != null ? <span className="dna-stars"> · {starString(Math.round((r.rating / 2) * 2) / 2)}</span> : null}</h3>
                  <blockquote>{r.reviewText}</blockquote>
                  <div className="dna-review-card__meta">
                    {social?.canAct
                      ? <button type="button" className={`dna-count-btn${like.mine ? ' is-on' : ''}`} aria-pressed={like.mine} onClick={() => social.toggleReviewLike(r.movieId)}>♥ {like.count}</button>
                      : <span>♥ {like.count}</span>}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
