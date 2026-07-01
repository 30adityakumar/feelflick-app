// "Featured by …" editorial section (IVORY, matching the prototype's .section.paper) — My Four
// (curated → labelled fallback), pinned review (real ★ + real like count/button), featured list
// (real film count + real save count/button), current exploration. No fabricated likes/saves.
import { Link } from 'react-router-dom'
import { tmdbImg } from '@/shared/api/tmdb'
import { starString } from './DnaPoster'

function MyFour({ myFour, firstName, isOwner }) {
  const films = myFour?.films || []
  if (!films.length) return null
  return (
    <article className="dna-myfour">
      <div className="dna-myfour__grid" aria-hidden="true">
        {films.slice(0, 4).map((m, i) => (
          <div className="dna-myfour__cell" key={m.id ?? i}>
            {m.posterPath ? <img src={tmdbImg(m.posterPath, 'w342')} alt="" loading="lazy" /> : <span className="dna-poster__fallback">{m.title}</span>}
          </div>
        ))}
      </div>
      <div className="dna-myfour__scrim" aria-hidden="true" />
      <span className="dna-myfour__label">My Four</span>
      <div className="dna-myfour__copy">
        <small>The films {isOwner ? 'I' : 'they'} lead with</small>
        <h3>Four films that introduce {isOwner ? 'you' : (firstName || 'this member')}.</h3>
        <p>{myFour.label}</p>
      </div>
    </article>
  )
}

export default function DnaFeatured({ featured, firstName, isOwner, social }) {
  const { myFour, pinnedReview, featuredList, currentExploration } = featured || {}
  const hasAny = (myFour?.films?.length) || pinnedReview || featuredList || currentExploration
  if (!hasAny) return null

  const like = pinnedReview ? social?.likeFor?.(pinnedReview.review.movieId) : null
  const save = featuredList ? social?.saveFor?.(featuredList.list.id) : null

  return (
    <section className="dna__section dna__section--paper" aria-label="Featured">
      <div className="dna__shell">
        <div className="dna__section-head">
          <div><p className="dna__eyebrow">Featured</p><h2>Start with what {isOwner ? 'you' : (firstName || 'they')} chose.</h2></div>
          <p>The films, words and lists deliberately placed at the front of this profile.</p>
        </div>
        <div className="dna-featured">
          <MyFour myFour={myFour} firstName={firstName} isOwner={isOwner} />
          <div className="dna-featured__side">
            {pinnedReview ? (
              <article className="dna-side-card dna-side-card--dark">
                <div>
                  <span className="type">{pinnedReview.curated ? 'Pinned review' : 'Recent review'}</span>
                  <blockquote>&ldquo;{pinnedReview.review.reviewText.slice(0, 120)}{pinnedReview.review.reviewText.length > 120 ? '…' : ''}&rdquo;</blockquote>
                </div>
                <div className="dna-side-card__meta">
                  <span>{pinnedReview.review.title || 'Film'}{pinnedReview.review.rating != null ? ` · ${starString(Math.round((pinnedReview.review.rating / 2) * 2) / 2)}` : ''}</span>
                  {like ? (social?.canAct
                    ? <button type="button" className={`dna-count-btn${like.mine ? ' is-on' : ''}`} aria-pressed={like.mine} onClick={() => social.toggleReviewLike(pinnedReview.review.movieId)}>♥ {like.count}</button>
                    : <span>♥ {like.count}</span>) : null}
                </div>
              </article>
            ) : null}
            {featuredList ? (
              <Link to={`/lists/${featuredList.list.id}`} className="dna-side-card">
                <div>
                  <span className="type">{featuredList.curated ? 'Featured list' : 'Recent list'}</span>
                  <h3>{featuredList.list.title}</h3>
                  {featuredList.list.description ? <p>{featuredList.list.description}</p> : null}
                </div>
                <div className="dna-side-card__meta">
                  <span>{featuredList.list.count} film{featuredList.list.count === 1 ? '' : 's'}{isOwner ? ` · ${featuredList.list.isPublic ? 'Public' : 'Private'}` : ''}</span>
                  {save ? (social?.canAct
                    ? <button type="button" className={`dna-count-btn${save.mine ? ' is-on' : ''}`} aria-pressed={save.mine} onClick={(e) => { e.preventDefault(); social.toggleListSave(featuredList.list.id) }}>{save.mine ? 'Saved' : 'Save'} · {save.count}</button>
                    : <span>{save.count} saved</span>) : null}
                </div>
              </Link>
            ) : null}
            {currentExploration ? (
              <article className="dna-side-card"><div><span className="type">Currently exploring</span><h3>{currentExploration}</h3></div></article>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
