// src/features/account/components/AccountDetail.jsx
// Renders the active section's heading + pane. Wires each section id to its pane component
// (kept here, not in accountSections.js, so the registry stays import-cycle-free). The heading
// is focusable (tabIndex=-1) so the shell can move focus to it on navigation.

import AccountOverview from '../panes/AccountOverview'
import PersonalInformationPane from '../panes/PersonalInformationPane'
import PrivacyPane from '../panes/PrivacyPane'
import NotificationsPane from '../panes/NotificationsPane'
import ConnectionsPane from '../panes/ConnectionsPane'
import SecurityPane from '../panes/SecurityPane'
import DataDeletionPane from '../panes/DataDeletionPane'

const PANES = {
  overview: { Component: AccountOverview, title: 'Overview', sub: 'A quick read on your account, privacy, and access.' },
  personal: { Component: PersonalInformationPane, title: 'Personal Information', sub: 'Your name, email, and profile photo.' },
  privacy: { Component: PrivacyPane, title: 'Privacy', sub: 'Control what other members can see, and how we measure the product.' },
  notifications: { Component: NotificationsPane, title: 'Notifications', sub: 'Choose what FeelFlick emails you.' },
  connections: { Component: ConnectionsPane, title: 'Connections', sub: 'How you sign in, and the film services you can import from.' },
  security: { Component: SecurityPane, title: 'Sign-In & Security', sub: 'Your current session and sign-out controls.' },
  data: { Component: DataDeletionPane, title: 'Data & Deletion', sub: 'Restart your taste setup, or delete your account.' },
}

export default function AccountDetail({ sectionId, headingRef }) {
  const entry = PANES[sectionId] || PANES.overview
  const { Component, title, sub } = entry
  return (
    <div className="ff-acct-detail">
      <header className="ff-acct-detail__head">
        <h2 ref={headingRef} tabIndex={-1}>{title}</h2>
        <p>{sub}</p>
      </header>
      <Component />
    </div>
  )
}
