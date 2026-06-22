// src/features/people/components/PeopleSearchResults.jsx
// Replaces discovery while a name search is active. Results show avatar + name + settled Follow only
// (no handle, no taste bio, no match band, no profile link, no Hide). Distinguishes empty from a
// search error (an RPC failure must never read as "No people found").

import { usePeopleData } from '../usePeopleData'
import PersonAvatar from './PersonAvatar'
import FollowButton from './FollowButton'

export default function PeopleSearchResults({ phase, results, onClear }) {
  const { followingIds, follow, unfollow, isPending, isErrored } = usePeopleData()
  const count = results.length
  return (
    <section className="ff-people-section ff-people-rail ff-people-searchresults" aria-labelledby="ff-people-search-h">
      <div className="ff-people-rail__head">
        <h2 id="ff-people-search-h" className="ff-people-rail__title ff-people-rail__title--sm">
          {phase === 'results' ? `${count} ${count === 1 ? 'result' : 'results'}` : 'Search results'}
        </h2>
        <button type="button" className="ff-people-clear-btn" style={{ minHeight: 44 }} aria-label="Clear search results" onClick={onClear}>Clear</button>
      </div>
      {phase === 'searching' ? (
        <p className="ff-people-state-note" role="status">Searching…</p>
      ) : phase === 'error' ? (
        <div className="ff-people-empty">
          <p className="ff-people-empty__title">Search is unavailable right now.</p>
          <p className="ff-people-empty__body">Try again in a moment.</p>
        </div>
      ) : phase === 'empty' ? (
        <div className="ff-people-empty">
          <p className="ff-people-empty__title">No people found.</p>
          <p className="ff-people-empty__body">Try another name. Search never looks through private film activity or reviews.</p>
        </div>
      ) : (
        <div role="list" className="ff-people-grid-3">
          {results.map((u) => (
            <div key={u.id} className="ff-people-row ff-people-row--search" role="listitem">
              <PersonAvatar url={u.avatarUrl} initial={u.initial} bg={u.avatarBg} size={42} />
              <div className="ff-people-row__copy"><div className="ff-people-row__name">{u.name}</div></div>
              <FollowButton id={u.id} following={followingIds.has(u.id)} pending={isPending(u.id)} errored={isErrored(u.id)} name={u.name} onFollow={() => follow(u.id, u.name)} onUnfollow={() => unfollow(u.id, u.name)} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
