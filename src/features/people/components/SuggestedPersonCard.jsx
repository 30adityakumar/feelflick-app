// src/features/people/components/SuggestedPersonCard.jsx
// A friend-of-follows suggestion. ALWAYS carries a genuine "via {friend}" (the derivation never
// emits a card without one). No similarity band/percentage here — the only context is the real
// social path. Settled Follow + session Hide.
// The avatar links to /people/:id (the public profile page).

import { Link } from 'react-router-dom'
import PersonAvatar from './PersonAvatar'
import FollowButton from './FollowButton'
import HideButton from './HideButton'

export default function SuggestedPersonCard({ person: p, following, pending, errored, onFollow, onUnfollow, onHide }) {
  return (
    <div className="ff-people-row ff-people-row--suggested" role="listitem">
      <Link to={`/dna/${p.id}`} className="ff-people-row__identity-link" aria-label={`View ${p.name}'s profile`}>
        <PersonAvatar url={p.avatarUrl} initial={p.initial} bg={p.avatarBg} size={42} />
      </Link>
      <div className="ff-people-row__copy">
        <Link to={`/dna/${p.id}`} className="ff-people-row__name-link" tabIndex={-1} aria-hidden="true">
          <div className="ff-people-row__name">{p.name}</div>
        </Link>
        <div className="ff-people-row__via">via <span>{p.viaFriend}</span></div>
        {p.bio ? <div className="ff-people-row__bio">{p.bio}</div> : null}
      </div>
      <div className="ff-people-row__stack">
        <FollowButton id={p.id} following={following} pending={pending} errored={errored} name={p.name} onFollow={onFollow} onUnfollow={onUnfollow} />
        <HideButton onHide={() => onHide(p.id, p.name)} name={p.name} />
      </div>
    </div>
  )
}
