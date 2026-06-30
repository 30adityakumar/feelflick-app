// src/features/people/components/PersonRow.jsx
// Denser secondary person row (More matches). Avatar + name + truthful bio + a cautious evidence
// caption (band/evidence when qualified, else "Taste still forming" / "Not enough shared evidence
// yet"). No handle, no percentage bar. Settled Follow.
// The avatar links to /people/:id (the public profile page).

import { Link } from 'react-router-dom'
import PersonAvatar from './PersonAvatar'
import FollowButton from './FollowButton'

export default function PersonRow({ person: p, following, pending, errored, onFollow, onUnfollow }) {
  const mp = p.matchPresentation
  const caption = mp.qualified ? (mp.evidence || mp.band) : mp.caption
  return (
    <div className="ff-people-row" role="listitem">
      <Link to={`/people/${p.id}`} className="ff-people-row__identity-link" aria-label={`View ${p.name}'s profile`}>
        <PersonAvatar url={p.avatarUrl} initial={p.initial} bg={p.avatarBg} size={42} />
      </Link>
      <div className="ff-people-row__copy">
        <Link to={`/people/${p.id}`} className="ff-people-row__name-link" tabIndex={-1} aria-hidden="true">
          <div className="ff-people-row__name">{p.name}</div>
        </Link>
        {p.bio ? <div className="ff-people-row__bio">{p.bio}</div> : null}
        <div className="ff-people-row__caption">{caption}</div>
      </div>
      <FollowButton id={p.id} following={following} pending={pending} errored={errored} name={p.name} onFollow={onFollow} onUnfollow={onUnfollow} />
    </div>
  )
}
