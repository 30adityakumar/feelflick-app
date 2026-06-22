// src/features/people/components/StrongMatchCard.jsx
// A Strongest-match card: avatar + qualitative band + films-in-common evidence + name + truthful bio.
// No percentage, no percentage-width bar, no generated handle. Hide (when not already following) +
// settled Follow. `following` is derived by the parent from the followingIds authority.

import PersonAvatar from './PersonAvatar'
import FollowButton from './FollowButton'
import HideButton from './HideButton'

export default function StrongMatchCard({ person: p, following, pending, errored, onFollow, onUnfollow, onHide }) {
  const mp = p.matchPresentation
  return (
    <article className="ff-people-card" role="listitem">
      <div className="ff-people-card__top">
        <PersonAvatar url={p.avatarUrl} initial={p.initial} bg={p.avatarBg} size={48} />
        <div className="ff-people-card__band">
          <span className="ff-people-card__band-label">{mp.band || mp.caption}</span>
          {mp.evidence ? <span className="ff-people-card__evidence">{mp.evidence}</span> : null}
        </div>
      </div>
      <h3 className="ff-people-card__name">{p.name}</h3>
      {p.bio ? <p className="ff-people-card__bio">{p.bio}</p> : null}
      <div className="ff-people-card__actions">
        {!following ? <HideButton onHide={() => onHide(p.id, p.name)} name={p.name} /> : <span />}
        <FollowButton id={p.id} following={following} pending={pending} errored={errored} name={p.name} onFollow={onFollow} onUnfollow={onUnfollow} />
      </div>
    </article>
  )
}
