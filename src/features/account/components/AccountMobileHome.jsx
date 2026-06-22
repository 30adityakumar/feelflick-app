// src/features/account/components/AccountMobileHome.jsx
// Mobile settings index: grouped rows that open a push-in detail via ?section=, plus a
// Recommendations link to the canonical /preferences route ("The dials").

import { Link } from 'react-router-dom'
import { SECTION_GROUPS, sectionsByGroup } from '../accountSections'
import SectionIcon from './SectionIcon'

function Row({ to, icon, title, blurb }) {
  return (
    <Link to={to}>
      <span className="ff-acct-navicon"><SectionIcon name={icon} size={16} /></span>
      <span style={{ minWidth: 0 }}>
        <strong>{title}</strong>
        <em>{blurb}</em>
      </span>
      <span className="ff-acct-chevron" aria-hidden="true">›</span>
    </Link>
  )
}

export default function AccountMobileHome() {
  return (
    <div className="ff-acct-mobilehome">
      {SECTION_GROUPS.map((group) => (
        <div key={group}>
          <div className="ff-acct-mobilehome__group">{group}</div>
          <div className="ff-acct-mobilelist">
            {sectionsByGroup(group).map((s) => (
              <Row key={s.id} to={`/account?section=${s.id}`} icon={s.icon} title={s.label} blurb={s.mobileBlurb} />
            ))}
          </div>
        </div>
      ))}
      <div className="ff-acct-mobilehome__group">Recommendations</div>
      <div className="ff-acct-mobilelist">
        <Row to="/preferences" icon="overview" title="Recommendation settings" blurb="The dials" />
      </div>
    </div>
  )
}
