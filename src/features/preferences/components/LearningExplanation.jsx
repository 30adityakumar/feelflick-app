// src/features/preferences/components/LearningExplanation.jsx
// Read-only "what shapes your recommendations" entry point + a short, honest
// statement of learning sources (which cannot be toggled off individually yet).

import { LEARNING_SOURCES } from '../derive/preferenceSummary'

const DESC = {
  Watched: 'Films you complete and revisit.',
  Ratings: 'Your ratings and reviews.',
  Saves: 'Watchlist and saves (lighter intent).',
  Skips: 'Skips and dismissals (used cautiously).',
}

export default function LearningExplanation({ onOpenData }) {
  return (
    <section className="ff-prefs-card">
      <div className="ff-prefs__inner">
        <div className="ff-prefs-h"><p className="ff-prefs-eyebrow"><span className="ff-prefs-h__rule" aria-hidden="true" />Learning</p><h2>What FeelFlick learns from.</h2></div>
        <div className="ff-prefs-learn-list">
          {LEARNING_SOURCES.map((s) => (
            <div key={s} className="ff-prefs-learn-item"><strong>{s}</strong><span>{DESC[s]}</span></div>
          ))}
        </div>
        <p className="ff-prefs-disclosure">These learning sources cannot yet be disabled individually.</p>
      </div>
      <div className="ff-prefs-datarow" style={{ marginTop: 24 }}>
        <div><strong>What shapes your recommendations</strong><span>Review the direct settings and learning sources FeelFlick uses.</span></div>
        <button type="button" className="ff-prefs-btn ff-prefs-btn--ghost" onClick={onOpenData}>Review</button>
      </div>
    </section>
  )
}
