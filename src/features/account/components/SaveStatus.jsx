// src/features/account/components/SaveStatus.jsx
// Per-section save indicator: idle → saving → saved → error. Announced politely; on error it
// offers an inline retry. Errors are never toast-only — this stays inline next to the control.

import SectionIcon from './SectionIcon'

export default function SaveStatus({ status, onRetry, idleLabel = '' }) {
  if (!status || status === 'idle') {
    return <span className="ff-acct-save" aria-live="polite">{idleLabel}</span>
  }
  if (status === 'saving') {
    return <span className="ff-acct-save ff-acct-save--saving" aria-live="polite">Saving…</span>
  }
  if (status === 'saved') {
    return (
      <span className="ff-acct-save ff-acct-save--saved" aria-live="polite">
        <SectionIcon name="check" size={13} /> Saved
      </span>
    )
  }
  return (
    <span className="ff-acct-save ff-acct-save--error" role="alert">
      Couldn’t save
      {onRetry && <button type="button" className="ff-acct-save__retry" onClick={onRetry}>· Retry</button>}
    </span>
  )
}
