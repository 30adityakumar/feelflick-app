// src/features/account/dialogs/ResetTasteDialog.jsx
// Confirm "Restart taste setup". The actual reset (scoped deletes + onboarding reset + redirect)
// is supplied as `onConfirm`, which checks every operation and throws on partial failure — so
// here we only ever claim success once it resolves; on throw we show a persistent honest error
// and stay open (no silent continue, no redirect).

import { useId, useState } from 'react'
import AccountDialog from './AccountDialog'

export default function ResetTasteDialog({ onConfirm, onClose }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const titleId = useId()
  const descId = useId()

  async function run() {
    if (busy) return
    setError('')
    setBusy(true)
    try {
      await onConfirm()
      // onConfirm navigates to onboarding on full success; nothing more to do here.
    } catch {
      setError('We couldn’t finish restarting your setup. Nothing was lost — please try again.')
      setBusy(false)
    }
  }

  return (
    <AccountDialog titleId={titleId} describedById={descId} onClose={onClose} busy={busy}>
      <h2 id={titleId}>Restart taste setup?</h2>
      <p id={descId}>
        Clears the genres, films and preferences created during onboarding, then starts onboarding
        again. Films, ratings, lists and Diary entries you added later remain.
      </p>
      {error && <div className="ff-acct-field"><div className="ff-acct-field__err" role="alert">{error}</div></div>}
      <div className="ff-acct-dialog__actions">
        <button type="button" className="ff-acct-btn ff-acct-btn--secondary" onClick={onClose} disabled={busy}>Keep my setup</button>
        <button type="button" className="ff-acct-btn ff-acct-btn--danger" onClick={run} disabled={busy}>{busy ? 'Restarting…' : 'Restart setup'}</button>
      </div>
    </AccountDialog>
  )
}
