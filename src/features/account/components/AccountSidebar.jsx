// src/features/account/components/AccountSidebar.jsx
// Desktop master nav. Semantic <nav> + grouped links; the active item carries aria-current
// plus a rose rule + weight (never colour alone). Each link updates the ?section= URL.

import { Link } from 'react-router-dom'
import { SECTION_GROUPS, sectionsByGroup } from '../accountSections'
import SectionIcon from './SectionIcon'

export default function AccountSidebar({ active }) {
  return (
    <nav className="ff-acct-sidebar" aria-label="Account settings">
      {SECTION_GROUPS.map((group) => (
        <div key={group}>
          <div className="ff-acct-sidebar__group">{group}</div>
          {sectionsByGroup(group).map((s) => (
            <Link
              key={s.id}
              to={`/account?section=${s.id}`}
              aria-current={active === s.id ? 'true' : undefined}
            >
              <span className="ff-acct-navicon"><SectionIcon name={s.icon} size={16} /></span>
              {s.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  )
}
