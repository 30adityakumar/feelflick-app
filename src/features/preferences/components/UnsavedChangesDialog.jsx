// src/features/preferences/components/UnsavedChangesDialog.jsx
// Custom internal-navigation confirmation (no browser confirm()). Focus-trapped.

import { useRef } from 'react'
import { useDialogA11y } from './useDialogA11y'

export default function UnsavedChangesDialog({ open, onKeepEditing, onLeave }) {
  const panelRef = useRef(null)
  useDialogA11y(panelRef, { open, onClose: onKeepEditing })
  if (!open) return null
  return (
    <div className="ff-prefs-dialog-backdrop" role="presentation" style={{ alignItems: 'center' }} onMouseDown={(e) => { if (e.target === e.currentTarget) onKeepEditing() }}>
      <div className="ff-prefs-dialog" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="pf-leave-title" aria-describedby="pf-leave-desc" style={{ maxWidth: 440 }} tabIndex={-1}>
        <h2 id="pf-leave-title" style={{ fontFamily: 'var(--font-editorial, Georgia, serif)', fontWeight: 400, margin: '4px 0 0', fontSize: 24 }}>Leave without saving?</h2>
        <p className="ff-prefs-dialog__intro" id="pf-leave-desc">Your unsaved preference changes will be discarded.</p>
        <div className="ff-prefs-conflict__actions" style={{ marginTop: 18 }}>
          <button type="button" className="ff-prefs-btn ff-prefs-btn--ghost" onClick={onKeepEditing}>Keep editing</button>
          <button type="button" className="ff-prefs-btn ff-prefs-btn--primary" onClick={onLeave}>Discard and leave</button>
        </div>
      </div>
    </div>
  )
}
