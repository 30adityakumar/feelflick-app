// src/features/history/components/RemoveDiaryEntryDialog.jsx
// F6.5 — accessible confirmation for removing a watched entry from the Diary. The copy
// is honest about what removal does (and does NOT do): it removes only the chronological
// watched entry; the user's rating and review stay with the film. "Keep entry" is the
// safe default and takes initial focus; "Remove from Diary" carries no destructive red
// styling that would imply the rating/review is also erased.
//
// Self-contained a11y: role="dialog" + aria-modal, labelled heading + described body,
// Escape cancels, Tab is trapped between the two actions (document-level capture so the
// trap holds without keyboard handlers on non-interactive nodes). Focus restoration to
// the original trigger (on cancel/failure) and focus-next (on success) are handled by the
// page via onCancel / onConfirm, matching the F6.3 focus model.

import { useEffect, useRef } from 'react'
import { HP, HP_GRAD } from '../data'

export default function RemoveDiaryEntryDialog({ title, onConfirm, onCancel }) {
  const keepRef = useRef(null)
  const removeRef = useRef(null)
  const headingId = 'ff-diary-remove-heading'
  const bodyId = 'ff-diary-remove-body'

  useEffect(() => {
    keepRef.current?.focus()
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); return }
      if (e.key !== 'Tab') return
      const els = [keepRef.current, removeRef.current].filter(Boolean)
      if (els.length === 0) return
      const first = els[0]
      const last = els[els.length - 1]
      const active = document.activeElement
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus() }
      else if (active !== first && active !== last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [onCancel])

  return (
    <div className="ff-hist-dialog-backdrop" style={{ position:'fixed', inset:0, zIndex:120, display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'rgba(0,0,0,0.6)' }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={bodyId}
        className="ff-hist-dialog"
        style={{ width:'100%', maxWidth:440, background:HP.bgDeep, border:`1px solid ${HP.borderStrong}`, borderRadius:12, padding:'28px 26px', boxShadow:'0 28px 70px -20px rgba(0,0,0,0.75)' }}
      >
        <h2 id={headingId} style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize:22, fontWeight:600, color:HP.text, margin:'0 0 12px 0', letterSpacing:'-0.02em' }}>
          Remove from Diary?
        </h2>
        <p id={bodyId} style={{ margin:'0 0 24px 0', fontSize:14, lineHeight:1.55, color:HP.textSoft, fontFamily:'Outfit, Inter, sans-serif' }}>
          This removes the watched entry for &ldquo;{title}&rdquo;. Your rating and review will stay with the film.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'flex-end', flexWrap:'wrap' }}>
          <button
            ref={keepRef}
            type="button"
            onClick={onCancel}
            className="ff-hist-dialog-btn"
            style={{ minHeight:44, padding:'11px 20px', borderRadius:999, background:HP_GRAD, border:'none', color:'#fff', fontFamily:'Outfit', fontSize:13, fontWeight:600, cursor:'pointer' }}
          >Keep entry</button>
          <button
            ref={removeRef}
            type="button"
            onClick={onConfirm}
            className="ff-hist-dialog-btn"
            style={{ minHeight:44, padding:'11px 20px', borderRadius:999, background:'transparent', border:`1px solid ${HP.border}`, color:HP.textSoft, fontFamily:'Outfit', fontSize:13, fontWeight:600, cursor:'pointer' }}
          >Remove from Diary</button>
        </div>
      </div>
    </div>
  )
}
