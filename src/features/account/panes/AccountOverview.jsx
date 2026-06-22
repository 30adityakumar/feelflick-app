// src/features/account/panes/AccountOverview.jsx
// Overview is LIVE navigation, not a second settings implementation — each row reflects current
// state and links to the section that owns it (and to /preferences for recommendation settings).

import { Link } from 'react-router-dom'
import SettingGroup from '../components/SettingGroup'
import SettingRow from '../components/SettingRow'
import { describeDevice } from '../deviceInfo'
import { useAccountData } from '../useAccountData'

const action = (to, label) => <Link className="ff-acct-text-action" to={to}>{label}</Link>

export default function AccountOverview() {
  const { authUser, profile, provider, serverSettings } = useAccountData()
  const name = profile?.name || authUser?.user_metadata?.name || 'Your name'
  const providerLabel = provider === 'google' ? 'Google' : 'email'
  const privacy = serverSettings?.privacy || {}
  const discovery = privacy.showOnLeaderboards ? 'on' : 'off'
  const analytics = privacy.analytics === false ? 'off' : 'on'
  const daily = serverSettings?.notifications?.find((n) => n.id === 'daily')?.enabled
  const dev = describeDevice(authUser)

  return (
    <>
      <SettingGroup title="Your account">
        <SettingRow label="Profile" desc={`${name} · signed in with ${providerLabel}`} end={action('/account?section=personal', 'Manage')} />
        <SettingRow
          label="Privacy"
          desc={`Your Cinematic DNA, Diary, ratings, reviews and watched films stay private. Taste-match discovery is ${discovery}; product analytics is ${analytics}.`}
          end={action('/account?section=privacy', 'Review')}
        />
        <SettingRow label="Daily Briefing" desc={daily ? 'On — a daily email with tonight’s picks.' : 'Off — you won’t receive the daily email.'} end={action('/account?section=notifications', 'Change')} />
      </SettingGroup>

      <SettingGroup title="Access">
        <SettingRow label="Current session" desc={`${dev.device} · ${dev.line}`} end={action('/account?section=security', 'View')} />
      </SettingGroup>

      <div className="ff-acct-prefs-tile">
        <div>
          <h3>Recommendation settings</h3>
          <p>The dials — mood, genres, eras and other preferences that shape your picks.</p>
        </div>
        <Link className="ff-acct-btn ff-acct-btn--secondary" to="/preferences">Open The dials</Link>
      </div>
    </>
  )
}
