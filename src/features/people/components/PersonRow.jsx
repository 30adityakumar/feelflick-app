// src/features/people/components/PersonRow.jsx
// Denser secondary person row (More matches). Avatar + name + truthful bio + a cautious evidence
// caption (band/evidence when qualified, else "Taste still forming" / "Not enough shared evidence
// yet"). No handle, no percentage bar. Settled Follow.

import PersonAvatar from './PersonAvatar'
import FollowButton from './FollowButton'

export default function PersonRow({ person: p, following, pending, errored, onFollow, onUnfollow }) {
  const mp = p.matchPresentation
  const caption = mp.qualified ? (mp.evidence || mp.band) : mp.caption
  return (
    <div className="ff-people-row" role="listitem">
      <PersonAvatar url={p.avatarUrl} initial={p.initial} bg={p.avatarBg} size={42} />
      <div className="ff-people-row__copy">
        <div className="ff-people-row__name">{p.name}</div>
        {p.bio ? <div className="ff-people-row__bio">{p.bio}</div> : null}
        <div className="ff-people-row__caption">{caption}</div>
      </div>
      <FollowButton id={p.id} following={following} pending={pending} errored={errored} name={p.name} onFollow={onFollow} onUnfollow={onUnfollow} />
    </div>
  )
}
