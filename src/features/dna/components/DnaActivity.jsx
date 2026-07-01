// Recent activity — deterministic merged stream (watch/rate/review/list), rendered as the
// prototype's hero + 3-row sidebar. The hero is the most recent real activity (real backdrop when
// available). No invented events, comments, likes or friend outcomes.
import { Link } from 'react-router-dom'
import { backdropImg, tmdbImg } from '@/shared/api/tmdb'
import { starString } from './DnaPoster'

const KIND_LABEL = { watched: 'Watched', rated: 'Watched & rated', reviewed: 'Reviewed', list_updated: 'Updated a list' }
const KIND_ICON = { watched: '▶', rated: '★', reviewed: '✎', list_updated: 'L' }

function timeAgo(ts) {
  const days = Math.floor((Date.now() - ts) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) { const w = Math.round(days / 7); return `${w} week${w === 1 ? '' : 's'} ago` }
  const m = Math.round(days / 30); return `${m} month${m === 1 ? '' : 's'} ago`
}

function Row({ a }) {
  return (
    <article className="dna-activity__row">
      <div className="dna-activity__icon" aria-hidden="true">{KIND_ICON[a.kind] || '•'}</div>
      <div>
        <small>{KIND_LABEL[a.kind] || 'Activity'} · {timeAgo(a.at)}</small>
        {a.type === 'film'
          ? <h4>{a.movie.id != null ? <Link to={`/movie/${a.movie.id}`}>{a.movie.title}</Link> : a.movie.title}{a.movie.rating != null ? <span className="dna-stars"> · {starString(a.movie.rating)}</span> : null}</h4>
          : <h4>{a.list.id != null ? <Link to={`/lists/${a.list.id}`}>{a.list.title}</Link> : a.list.title}{a.list.count ? <span className="dna__muted"> · {a.list.count} films</span> : null}</h4>}
        {a.type === 'film' && a.movie.reviewExcerpt ? <p>&ldquo;{a.movie.reviewExcerpt}&rdquo;</p> : null}
      </div>
    </article>
  )
}

export default function DnaActivity({ activity = [], firstName, isOwner }) {
  if (!activity.length) return null
  const hero = activity[0]
  const rest = activity.slice(1, 4)
  const heroBg = hero.type === 'film' ? (hero.movie.backdropPath ? backdropImg(hero.movie.backdropPath, 'w1280') : (hero.movie.posterPath ? tmdbImg(hero.movie.posterPath, 'w500') : null)) : null
  const title = isOwner ? 'Your film life, now.' : `${firstName || 'Their'}’s film life, now.`
  return (
    <section className="dna__section" aria-label="Recent activity">
      <div className="dna__shell">
        <div className="dna__section-head"><div><p className="dna__eyebrow">Recent activity</p><h2>{title}</h2></div><p>Kept alive through watching, rating, writing and curating — not an endless generic feed.</p></div>
        <div className="dna-activity">
          <article className="dna-activity__hero">
            {heroBg ? <img src={heroBg} alt="" loading="lazy" /> : null}
            <div className="dna-activity__hero-scrim" aria-hidden="true" />
            <div className="dna-activity__hero-copy">
              <span className="dna-activity__type">{KIND_LABEL[hero.kind] || 'Activity'} · {timeAgo(hero.at)}</span>
              {hero.type === 'film'
                ? <><h3>{hero.movie.id != null ? <Link to={`/movie/${hero.movie.id}`}>{hero.movie.title}</Link> : hero.movie.title}</h3><p>{hero.movie.rating != null ? starString(hero.movie.rating) : ''}{hero.movie.reviewExcerpt ? ` · “${hero.movie.reviewExcerpt}”` : ''}</p></>
                : <><h3>{hero.list.id != null ? <Link to={`/lists/${hero.list.id}`}>{hero.list.title}</Link> : hero.list.title}</h3><p>{hero.list.count} films</p></>}
            </div>
          </article>
          <div className="dna-activity__side">
            {rest.map((a) => <Row key={a.id} a={a} />)}
          </div>
        </div>
      </div>
    </section>
  )
}
