// src/features/people/components/SuggestedPeople.jsx
// "Suggested — People you might know." Friend-of-follows ONLY; every card has a genuine via-friend
// (the derivation guarantees it). Similarity-only candidates never appear here. Hidden when empty.

import Eyebrow from '@/shared/ui/Eyebrow'
import { usePeopleData } from '../usePeopleData'
import { useRailHide } from './useRailHide'
import SuggestedPersonCard from './SuggestedPersonCard'

export default function SuggestedPeople() {
  const { suggested, followingIds, follow, unfollow, isPending, isErrored, isHidden, hide } = usePeopleData()
  const visible = suggested.filter((p) => !isHidden(p.id))
  const { containerRef, onHide } = useRailHide(hide, visible.map((c) => c.id))
  if (!visible.length) return null
  return (
    <section className="ff-people-section ff-people-rail ff-people-rail--suggested" aria-labelledby="ff-people-suggested-h">
      <div className="ff-people-rail__head">
        <div>
          <Eyebrow color="var(--ts-text-secondary, #beb8ad)" size={10}>Suggested</Eyebrow>
          <h2 id="ff-people-suggested-h" className="ff-people-rail__title ff-people-rail__title--sm">People you might know.</h2>
          <p className="ff-people-rail__sub">Friend-of-friend context is shown when available.</p>
        </div>
      </div>
      <div ref={containerRef} tabIndex={-1} role="list" className="ff-people-grid-3">
        {visible.map((p) => (
          <SuggestedPersonCard
            key={p.id}
            person={p}
            following={followingIds.has(p.id)}
            pending={isPending(p.id)}
            errored={isErrored(p.id)}
            onFollow={() => follow(p.id, p.name)}
            onUnfollow={() => unfollow(p.id, p.name)}
            onHide={onHide}
          />
        ))}
      </div>
    </section>
  )
}
