// src/features/people/components/FollowingSection.jsx
// "People you follow" section — shows all users the viewer follows, even if they
// are not in the discovery pool (e.g. followed via search). Returns null until the
// viewer has at least one follow so it never crowds the cold-start experience.

import { Link } from 'react-router-dom'
import Eyebrow from '@/shared/ui/Eyebrow'
import PersonAvatar from './PersonAvatar'
import FollowButton from './FollowButton'
import { usePeopleData } from '../usePeopleData'

export default function FollowingSection() {
  const { followingList = [], followingIds, follow, unfollow, isPending, isErrored } = usePeopleData()
  if (!followingList.length) return null

  return (
    <section className="ff-people-section ff-people-rail" aria-labelledby="ff-people-following-h">
      <div className="ff-people-rail__head">
        <div>
          <Eyebrow color="var(--ts-text-secondary, #beb8ad)" size={10}>Following</Eyebrow>
          <h2 id="ff-people-following-h" className="ff-people-rail__title ff-people-rail__title--sm">
            People you follow.
          </h2>
        </div>
      </div>
      <div role="list">
        {followingList.map((p) => (
          <div key={p.id} className="ff-people-row" role="listitem">
            <Link
              to={`/profile/${p.id}`}
              className="ff-people-row__identity-link"
              aria-label={`View ${p.name}'s profile`}
            >
              <PersonAvatar url={p.avatarUrl} initial={p.initial} bg={p.avatarBg} size={42} />
            </Link>
            <div className="ff-people-row__copy">
              <Link
                to={`/profile/${p.id}`}
                className="ff-people-row__name-link"
                tabIndex={-1}
                aria-hidden="true"
              >
                <div className="ff-people-row__name">{p.name}</div>
              </Link>
            </div>
            <FollowButton
              id={p.id}
              following={followingIds.has(p.id)}
              pending={isPending(p.id)}
              errored={isErrored(p.id)}
              name={p.name}
              onFollow={() => follow(p.id, p.name)}
              onUnfollow={() => unfollow(p.id, p.name)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
