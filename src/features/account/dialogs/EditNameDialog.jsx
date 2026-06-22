// src/features/account/dialogs/EditNameDialog.jsx
// Edit display name. Validates (trim, non-empty, ≤80 code points, Unicode preserved), prevents
// duplicate submission, checks BOTH the users.name write and the auth-metadata write, refreshes
// context on success, and on failure keeps the previous name + shows a persistent inline error.

import { useId, useRef, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAccountData } from '../useAccountData'
import AccountDialog from './AccountDialog'

const MAX_NAME = 80

export default function EditNameDialog({ onClose }) {
  const { authUser, profile, refresh } = useAccountData()
  const currentName = profile?.name || authUser?.user_metadata?.name || ''
  const [value, setValue] = useState(currentName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const titleId = useId()
  const inputRef = useRef(null)

  async function save() {
    if (busy) return
    const trimmed = value.trim()
    if (!trimmed) { setError('Please enter a name.'); return }
    if ([...trimmed].length > MAX_NAME) { setError(`Keep your name to ${MAX_NAME} characters or fewer.`); return }
    if (trimmed === currentName) { onClose(); return }
    setError('')
    setBusy(true)
    try {
      const uid = authUser?.id
      const { error: rowErr } = await supabase.from('users').update({ name: trimmed }).eq('id', uid)
      if (rowErr) throw rowErr
      const { error: metaErr } = await supabase.auth.updateUser({ data: { name: trimmed } })
      if (metaErr) throw metaErr
      refresh()
      onClose()
    } catch {
      // Keep the previously displayed name (context untouched) + surface a persistent error.
      setError('We couldn’t save your name. Check your connection and try again.')
      setBusy(false)
    }
  }

  return (
    <AccountDialog titleId={titleId} onClose={onClose} busy={busy} initialFocus={inputRef}>
      <h2 id={titleId}>Edit your name</h2>
      <p>This is the name shown across FeelFlick.</p>
      <div className="ff-acct-field">
        <label htmlFor={`${titleId}-name`}>Display name</label>
        <input
          ref={inputRef}
          id={`${titleId}-name`}
          type="text"
          value={value}
          maxLength={200}
          disabled={busy}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save() } }}
          autoComplete="name"
        />
        {error && <div className="ff-acct-field__err" role="alert">{error}</div>}
      </div>
      <div className="ff-acct-dialog__actions">
        <button type="button" className="ff-acct-btn ff-acct-btn--secondary" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="button" className="ff-acct-btn ff-acct-btn--primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save name'}</button>
      </div>
    </AccountDialog>
  )
}
