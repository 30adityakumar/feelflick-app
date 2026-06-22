// src/features/account/panes/DataDeletionPane.jsx
// Restart taste setup (scoped, honest, checks every op) + 7-day account deletion request/cancel.
// Deletion wording is generic — the out-of-repo finalizer's exact deleted-data scope is unverified.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import SettingGroup from '../components/SettingGroup'
import ResetTasteDialog from '../dialogs/ResetTasteDialog'
import DeleteAccountDialog from '../dialogs/DeleteAccountDialog'
import { useAccountData } from '../useAccountData'

function formatScheduled(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
  } catch { return iso }
}

export default function DataDeletionPane() {
  const { authUser, pendingDeletion, cancelDeletion } = useAccountData()
  const navigate = useNavigate()
  const [showReset, setShowReset] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [cancelBusy, setCancelBusy] = useState(false)
  const [cancelError, setCancelError] = useState('')

  // Scoped reset: each op is checked; we redirect to onboarding ONLY if every step succeeded.
  // (Backend atomicity limitation: these are sequential client deletes, not one transaction —
  // see implementation report. On partial failure we throw so the dialog shows an honest error.)
  async function runReset() {
    const uid = authUser?.id
    if (!uid) throw new Error('no_user')
    let r
    r = await supabase.from('user_ratings').delete().eq('user_id', uid).eq('source', 'onboarding'); if (r.error) throw r.error
    r = await supabase.from('user_history').delete().eq('user_id', uid).eq('source', 'onboarding'); if (r.error) throw r.error
    r = await supabase.from('user_preferences').delete().eq('user_id', uid); if (r.error) throw r.error
    r = await supabase.from('users').update({ onboarding_complete: false, onboarding_completed_at: null, taste_baseline_moods: null }).eq('id', uid); if (r.error) throw r.error
    const { error: metaErr } = await supabase.auth.updateUser({ data: { onboarding_complete: false, has_onboarded: false } }); if (metaErr) throw metaErr
    navigate('/onboarding', { replace: true })
  }

  async function onCancelDeletion() {
    if (cancelBusy) return
    setCancelError('')
    setCancelBusy(true)
    try {
      await cancelDeletion()
    } catch {
      setCancelError('We couldn’t cancel the deletion. Please try again.')
    } finally {
      setCancelBusy(false)
    }
  }

  const scheduled = formatScheduled(pendingDeletion?.scheduled_for)

  return (
    <>
      <SettingGroup title="Taste profile">
        <div className="ff-acct-row">
          <div>
            <div className="ff-acct-row__label">Restart taste setup</div>
            <p className="ff-acct-row__desc">Clears the genres, films and preferences created during onboarding, then starts onboarding again. Films, ratings, lists and Diary entries you added later remain.</p>
          </div>
          <div className="ff-acct-row__end">
            <button type="button" className="ff-acct-btn ff-acct-btn--secondary" onClick={() => setShowReset(true)}>Restart setup</button>
          </div>
        </div>
      </SettingGroup>

      <div className="ff-acct-group-title">Danger zone</div>
      {scheduled ? (
        <div className="ff-acct-pending">
          <strong>Account deletion scheduled</strong>
          <p>Your account is scheduled for permanent deletion on <span style={{ color: 'var(--text)', fontWeight: 600 }}>{scheduled}</span>. You can cancel anytime before then.</p>
          {cancelError && <div className="ff-acct-field__err" role="alert" style={{ marginBottom: 12 }}>{cancelError}</div>}
          <button type="button" className="ff-acct-btn ff-acct-btn--secondary" onClick={onCancelDeletion} disabled={cancelBusy}>{cancelBusy ? 'Cancelling…' : 'Cancel deletion'}</button>
        </div>
      ) : (
        <SettingGroup danger>
          <div className="ff-acct-row">
            <div>
              <div className="ff-acct-row__label">Delete account</div>
              <p className="ff-acct-row__desc">Schedule your account for permanent deletion. You’ll have seven days to cancel.</p>
            </div>
            <div className="ff-acct-row__end">
              <button type="button" className="ff-acct-btn ff-acct-btn--danger" onClick={() => setShowDelete(true)}>Delete account</button>
            </div>
          </div>
        </SettingGroup>
      )}

      {showReset && <ResetTasteDialog onConfirm={runReset} onClose={() => setShowReset(false)} />}
      {showDelete && <DeleteAccountDialog onClose={() => setShowDelete(false)} />}
    </>
  )
}
