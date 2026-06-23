// src/features/preferences/components/RecommendationDataDialog.jsx
// Read-only "What shapes your recommendations". No per-signal Correct / Reduce /
// Stop / Remove / Reset — there is no durable signal ledger to back them.

import { useRef } from 'react'
import { usePreferencesData } from '../usePreferencesData'
import { deriveToldUs, LEARNING_SOURCES } from '../derive/preferenceSummary'
import { useDialogA11y } from './useDialogA11y'

export default function RecommendationDataDialog({ open, onClose, returnFocusRef }) {
  const panelRef = useRef(null)
  const { draft } = usePreferencesData()
  useDialogA11y(panelRef, { open, onClose, returnFocusRef })
  if (!open) return null
  const told = deriveToldUs(draft)
  return (
    <div className="ff-prefs-dialog-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ff-prefs-dialog" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="pf-data-title" aria-describedby="pf-data-intro" tabIndex={-1}>
        <div className="ff-prefs-dialog__head">
          <div>
            <p className="ff-prefs-eyebrow">Recommendation data</p>
            <h2 id="pf-data-title">What shapes your recommendations</h2>
          </div>
          <button type="button" className="ff-prefs-dialog__close" aria-label="Close recommendation data" onClick={onClose}>×</button>
        </div>
        <p className="ff-prefs-dialog__intro" id="pf-data-intro">A read-only view of the direct settings you chose and the behaviour FeelFlick learns from.</p>

        <div className="ff-prefs-dialog__section">
          <h3>You told us</h3>
          {told.length === 0 ? (
            <p className="ff-prefs-field__hint">You haven&rsquo;t set any direct preferences yet.</p>
          ) : (
            <div className="ff-prefs-told">
              {told.map((t) => (
                <div key={t.key} className="ff-prefs-told__item" style={{ cursor: 'default' }}>
                  <span>{t.label}</span><span>{t.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ff-prefs-dialog__section">
          <h3>FeelFlick learns from</h3>
          <div className="ff-prefs-told">
            {LEARNING_SOURCES.map((s) => (
              <div key={s} className="ff-prefs-told__item" style={{ cursor: 'default' }}><span>Behaviour</span><span>{s}</span></div>
            ))}
          </div>
          <p className="ff-prefs-disclosure">These learning sources cannot yet be disabled individually.</p>
        </div>

        <p className="ff-prefs-disclosure">
          FeelFlick is still aligning every recommendation surface to the same preference model, so some controls may affect Discover and Film File more than every Home row.
        </p>
      </div>
    </div>
  )
}
