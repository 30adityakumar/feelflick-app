// src/features/people/components/PeopleHeader.jsx
// People masthead on the Adaptive Editorial Cinema foundation: eyebrow + the single <h1> + truthful
// subtitle + the social summary + two actions (How matching works, Invite a friend). Invite +
// explainer behaviour are owned by the route shell (passed in). One visible <h1>.

import Eyebrow from '@/shared/ui/Eyebrow'
import PeopleSummary from './PeopleSummary'

export default function PeopleHeader({ user, onInvite, onExplain, inviteStatus }) {
  return (
    <section className="ff-people-section ff-people-masthead">
      <div className="ff-people-masthead__head">
        <div className="ff-people-masthead__title">
          <Eyebrow color="var(--ts-text-secondary, #beb8ad)" spacing="0.32em" size={10}>People</Eyebrow>
          <h1 className="ff-people-hero">Your taste matches.</h1>
          <p className="ff-people-masthead__sub">
            People whose film taste overlaps with yours — an estimate from shared film activity, not a relationship.
          </p>
        </div>
        <div className="ff-people-masthead__aside">
          <PeopleSummary {...user} />
          <div className="ff-people-actions">
            <button type="button" className="ff-people-action" aria-haspopup="dialog" onClick={onExplain}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
              How matching works
            </button>
            <button type="button" className="ff-people-action ff-people-action--primary ff-people-invite-btn" onClick={onInvite}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              Invite a friend
            </button>
          </div>
          {/* Visual-only chip; the SR announcement is emitted once through the page's single
              relationship live region (no duplicate live region, no double announcement). */}
          {inviteStatus ? <span className="ff-people-invite-status" aria-hidden="true">{inviteStatus}</span> : null}
        </div>
      </div>
    </section>
  )
}
