// src/features/preferences/components/PreferencesLoading.jsx
// Loading skeleton. Keeps one h1 authority; aria-busy; no fabricated summary.

export default function PreferencesLoading() {
  return (
    <div className="ff-prefs" aria-busy="true">
      <div className="ff-prefs__inner">
        <section className="ff-prefs-masthead">
          <p className="ff-prefs-eyebrow">Preferences</p>
          <h1 className="ff-prefs-hero">Your taste, <em>clearly.</em></h1>
        </section>
        <div className="ff-prefs-skeleton" aria-hidden="true">
          <div className="ff-prefs-skeleton__bar" style={{ height: 64, width: '42%', marginBottom: 28 }} />
          <div className="ff-prefs-skeleton__bar" style={{ height: 110, width: '100%', marginBottom: 16 }} />
          <div className="ff-prefs-skeleton__bar" style={{ height: 220, width: '100%' }} />
        </div>
      </div>
    </div>
  )
}
