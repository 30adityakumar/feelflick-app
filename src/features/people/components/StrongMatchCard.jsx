// src/features/people/components/StrongMatchCard.jsx
// A Strongest-match card: avatar + qualitative band + films-in-common evidence + name + truthful bio.
// No percentage, no percentage-width bar, no generated handle. Hide (when not already following) +
// settled Follow. `following` is derived by the parent from the followingIds authority.
// The name/avatar area links to /people/:id (the public profile page).

import { Link } from 'react-router-dom'
import PersonAvatar from './PersonAvatar'
import FollowButton from './FollowButton'
import HideButton from './HideButton'

export default function StrongMatchCard({ person: p, following, pending, errored, onFollow, onUnfollow, onHide }) {
  const mp = p.matchPresentation
  return (
    <article className="ff-people-card" role="listitem">
      <div className="ff-people-card__top">
        <Link to={`/dna/${p.id}`} className="ff-people-card__avatar-link" aria-label={`View ${p.name}'s profile`}>
          <PersonAvatar url={p.avatarUrl} initial={p.initial} bg={p.avatarBg} size={48} />
        </Link>
        <div className="ff-people-card__band">
          <span className="ff-people-card__band-label">{mp.band || mp.caption}</span>
          {mp.evidence ? <span className="ff-people-card__evidence">{mp.evidence}</span> : null}
        </div>
      </div>
      <Link to={`/dna/${p.id}`} className="ff-people-card__name-link" tabIndex={-1} aria-hidden="true">
        <h3 className="ff-people-card__name">{p.name}</h3>
      </Link>
      {p.bio ? <p className="ff-people-card__bio">{p.bio}</p> : null}
      <div className="ff-people-card__actions">
        {!following ? <HideButton onHide={() => onHide(p.id, p.name)} name={p.name} /> : <span />}
        <FollowButton id={p.id} following={following} pending={pending} errored={errored} name={p.name} onFollow={onFollow} onUnfollow={onUnfollow} />
      </div>
    </article>
  )
}
