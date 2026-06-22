// src/features/account/panes/SecurityPane.jsx
// Current session only — Supabase exposes no other sessions client-side, so there is no device
// list and no "active now". Sign out this device (local) + sign out everywhere (global, includes
// this device — stated plainly). Global sign-out is confirmed via dialog.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import SectionIcon from '../components/SectionIcon'
import SettingGroup from '../components/SettingGroup'
import SignOutEverywhereDialog from '../dialogs/SignOutEverywhereDialog'
import { describeDevice } from '../deviceInfo'
import { useAccountData } from '../useAccountData'

export default function SecurityPane() {
  const { authUser } = useAccountData()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [showGlobal, setShowGlobal] = useState(false)
  const dev = describeDevice(authUser)

  async function signOutHere() {
    if (busy) return
    setBusy(true)
    try {
      // scope:'local' ends ONLY this device's session — supabase-js defaults to 'global', which
      // would contradict this control's "this device only" copy.
      await supabase.auth.signOut({ scope: 'local' })
      navigate('/', { replace: true })
    } catch {
      setBusy(false)
    }
  }

  async function signOutEverywhere() {
    // Throws on failure so the dialog can surface a persistent error; navigate only on success.
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    if (error) throw error
    navigate('/', { replace: true })
  }

  return (
    <>
      <SettingGroup title="Current session">
        <div className="ff-acct-conn">
          <div className="ff-acct-device__icon"><SectionIcon name="device" size={18} /></div>
          <div className="ff-acct-device" style={{ display: 'block' }}>
            <strong>{dev.device}</strong>
            <p>{dev.line}</p>
          </div>
          <span className="ff-acct-conn__status ff-acct-conn__status--ok">Current</span>
        </div>
      </SettingGroup>

      <SettingGroup title="Sign out">
        <div className="ff-acct-row">
          <div>
            <div className="ff-acct-row__label">Sign out this device</div>
            <p className="ff-acct-row__desc">Ends your session on this device only.</p>
          </div>
          <div className="ff-acct-row__end">
            <button type="button" className="ff-acct-btn ff-acct-btn--secondary" onClick={signOutHere} disabled={busy}>{busy ? 'Signing out…' : 'Sign out'}</button>
          </div>
        </div>
        <div className="ff-acct-row">
          <div>
            <div className="ff-acct-row__label">Sign out everywhere</div>
            <p className="ff-acct-row__desc">Ends every FeelFlick session, including this device.</p>
          </div>
          <div className="ff-acct-row__end">
            <button type="button" className="ff-acct-btn ff-acct-btn--danger" onClick={() => setShowGlobal(true)} disabled={busy}>Sign out everywhere</button>
          </div>
        </div>
      </SettingGroup>

      {showGlobal && <SignOutEverywhereDialog onConfirm={signOutEverywhere} onClose={() => setShowGlobal(false)} />}
    </>
  )
}
