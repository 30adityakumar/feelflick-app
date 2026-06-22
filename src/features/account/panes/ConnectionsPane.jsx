// src/features/account/panes/ConnectionsPane.jsx
// Truthful provider status only. The real primary sign-in is derived from auth metadata (Google
// or email). Letterboxd/Netflix/Plex have no integration — one non-interactive info row, never a
// fake Connect button or OAuth.

import SectionIcon from '../components/SectionIcon'
import SettingGroup from '../components/SettingGroup'
import { useAccountData } from '../useAccountData'

export default function ConnectionsPane() {
  const { provider, authUser } = useAccountData()
  const isGoogle = provider === 'google'
  const name = isGoogle ? 'Google' : 'Email'
  const detail = isGoogle ? (authUser?.email || 'Connected via Google sign-in') : (authUser?.email || 'Connected via email')

  return (
    <>
      <SettingGroup title="Sign-in">
        <div className="ff-acct-conn">
          <div className="ff-acct-conn__logo">{name.charAt(0)}</div>
          <div>
            <strong>{name}</strong>
            <p>Primary sign-in · {detail}</p>
          </div>
          <span className="ff-acct-conn__status ff-acct-conn__status--ok">Connected</span>
        </div>
      </SettingGroup>

      <SettingGroup title="Film services">
        <div className="ff-acct-conn">
          <div className="ff-acct-conn__logo"><SectionIcon name="connections" size={18} /></div>
          <div>
            <strong>Film-service imports</strong>
            <p>Letterboxd, Netflix and Plex imports are not available yet.</p>
          </div>
          <span className="ff-acct-conn__status">Coming later</span>
        </div>
      </SettingGroup>
    </>
  )
}
