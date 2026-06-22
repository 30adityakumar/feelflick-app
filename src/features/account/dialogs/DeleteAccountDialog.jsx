// src/features/account/dialogs/DeleteAccountDialog.jsx
// Schedule 7-day account deletion. Email-match confirmation + optional reason (treated as
// sensitive — never sent to analytics). Busy/error/retry; the RPC throws on failure so we
// surface a persistent inline error and stay open. Wording is generic (the out-of-repo
// finalizer's exact deleted-data scope is unverified — see implementation report).

import { useId, useRef, useState } from 'react'
import { useAccountData } from '../useAccountData'
import AccountDialog from './AccountDialog'

export default function DeleteAccountDialog({ onClose }) {
  const { authUser, requestDeletion } = useAccountData()
  const email = authUser?.email || ''
  const [typed, setTyped] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const titleId = useId()
  const descId = useId()
  const inputRef = useRef(null)
  const matches = typed.trim().toLowerCase() === email.trim().toLowerCase() && !!email

  async function confirm() {
    if (busy || !matches) return
    setError('')
    setBusy(true)
    try {
      // reason is sensitive free text — passed only to the deletion RPC, never to analytics.
      await requestDeletion(reason.trim() || null)
      onClose()
    } catch {
      setError('We couldn’t schedule deletion. Please try again.')
      setBusy(false)
    }
  }

  return (
    <AccountDialog titleId={titleId} describedById={descId} onClose={onClose} busy={busy} initialFocus={inputRef}>
      <h2 id={titleId}>Schedule account deletion</h2>
      <p id={descId}>Your account will be scheduled for permanent deletion. You have seven days to cancel — just sign back in.</p>
      <div className="ff-acct-field">
        <label htmlFor={`${titleId}-email`}>Type your email to confirm</label>
        <input
          ref={inputRef}
          id={`${titleId}-email`}
          type="email"
          value={typed}
          disabled={busy}
          placeholder={email || 'you@example.com'}
          autoComplete="off"
          onChange={(e) => setTyped(e.target.value)}
        />
      </div>
      <div className="ff-acct-field">
        <label htmlFor={`${titleId}-reason`}>Reason (optional)</label>
        <textarea
          id={`${titleId}-reason`}
          value={reason}
          disabled={busy}
          rows={3}
          placeholder="What pushed you away?"
          onChange={(e) => setReason(e.target.value)}
        />
        {error && <div className="ff-acct-field__err" role="alert">{error}</div>}
      </div>
      <div className="ff-acct-dialog__actions">
        <button type="button" className="ff-acct-btn ff-acct-btn--secondary" onClick={onClose} disabled={busy}>Keep my account</button>
        <button type="button" className="ff-acct-btn ff-acct-btn--danger" onClick={confirm} disabled={!matches || busy}>{busy ? 'Scheduling…' : 'Schedule deletion'}</button>
      </div>
    </AccountDialog>
  )
}
