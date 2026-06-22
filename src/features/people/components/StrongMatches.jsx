// src/features/people/components/StrongMatches.jsx
// "Strongest matches" rail — ONLY evidence-qualified candidates (≤4), per the locked copy
// "shown only when there is enough shared evidence." Renders nothing when empty (the shell shows the
// cold/empty state). Mobile = horizontal snap carousel (see people.css).

import Eyebrow from '@/shared/ui/Eyebrow'
import { usePeopleData } from '../usePeopleData'
import { useRailHide } from './useRailHide'
import StrongMatchCard from './StrongMatchCard'

export default function StrongMatches({ onExplain }) {
  const { strongest, followingIds, follow, unfollow, isPending, isErrored, isHidden, hide } = usePeopleData()
  const visible = strongest.filter((p) => !isHidden(p.id))
  const { containerRef, onHide } = useRailHide(hide, visible.map((c) => c.id))
  if (!visible.length) return null
  return (
    <section className="ff-people-section ff-people-rail" aria-labelledby="ff-people-twins-h">
      <div className="ff-people-rail__head">
        <div>
          <Eyebrow color="var(--ts-text-secondary, #beb8ad)" size={10}>Strongest matches</Eyebrow>
          <h2 id="ff-people-twins-h" className="ff-people-rail__title">People who get it.</h2>
          <p className="ff-people-rail__sub">Your clearest overlaps, shown only when there is enough shared evidence.</p>
        </div>
        {onExplain ? (
          <button type="button" className="ff-people-chip" aria-haspopup="dialog" onClick={onExplain}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
            No exact percentages
          </button>
        ) : null}
      </div>
      <div ref={containerRef} tabIndex={-1} role="list" className="ff-people-grid-4">
        {visible.map((p) => (
          <StrongMatchCard
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
