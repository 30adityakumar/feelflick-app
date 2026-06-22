// src/features/people/components/MoreMatches.jsx
// "More matches" rail — remaining opted-in qualified candidates, then cautious forming/insufficient
// ones (the discovery derivation orders them). Renders nothing when empty.

import Eyebrow from '@/shared/ui/Eyebrow'
import { usePeopleData } from '../usePeopleData'
import PersonRow from './PersonRow'

export default function MoreMatches() {
  const { more, followingIds, follow, unfollow, isPending, isErrored, isHidden } = usePeopleData()
  const visible = more.filter((p) => !isHidden(p.id))
  if (!visible.length) return null
  return (
    <section className="ff-people-section ff-people-rail ff-people-rail--more" aria-labelledby="ff-people-rising-h">
      <div className="ff-people-rail__head">
        <div>
          <Eyebrow color="var(--ts-text-secondary, #beb8ad)" size={10}>More matches</Eyebrow>
          <h2 id="ff-people-rising-h" className="ff-people-rail__title ff-people-rail__title--sm">More people to discover.</h2>
        </div>
      </div>
      <div role="list" className="ff-people-grid-3">
        {visible.map((p) => (
          <PersonRow
            key={p.id}
            person={p}
            following={followingIds.has(p.id)}
            pending={isPending(p.id)}
            errored={isErrored(p.id)}
            onFollow={() => follow(p.id, p.name)}
            onUnfollow={() => unfollow(p.id, p.name)}
          />
        ))}
      </div>
    </section>
  )
}
