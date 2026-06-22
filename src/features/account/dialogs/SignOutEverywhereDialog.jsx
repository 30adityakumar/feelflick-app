// src/features/account/dialogs/SignOutEverywhereDialog.jsx
// Confirm global sign-out. The actual sign-out (resolve pending writes → signOut({scope:'global'})
// → navigate) is supplied as `onConfirm`, which throws on failure. Copy states plainly that this
// includes the current device (never "all other devices").

import { useId, useState } from 'react'
import AccountDialog from './AccountDialog'

export default function SignOutEverywhereDialog({ onConfirm, onClose }) {
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
      // onConfirm navigates away on success.
    } catch {
      setError('We couldn’t sign out everywhere. Please try again.')
      setBusy(false)
    }
  }

  return (
    <AccountDialog titleId={titleId} describedById={descId} onClose={onClose} busy={busy}>
      <h2 id={titleId}>Sign out everywhere?</h2>
      <p id={descId}>Ends every FeelFlick session, including this device. You’ll need to sign in again.</p>
      {error && <div className="ff-acct-field"><div className="ff-acct-field__err" role="alert">{error}</div></div>}
      <div className="ff-acct-dialog__actions">
        <button type="button" className="ff-acct-btn ff-acct-btn--secondary" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="button" className="ff-acct-btn ff-acct-btn--danger" onClick={run} disabled={busy}>{busy ? 'Signing out…' : 'Sign out everywhere'}</button>
      </div>
    </AccountDialog>
  )
}
