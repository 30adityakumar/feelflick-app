// src/features/preferences/components/PreferencesHeader.jsx
// Masthead — the one visible <h1>. No "DNA recomputes nightly" claim.

export default function PreferencesHeader() {
  return (
    <section className="ff-prefs-masthead">
      <div className="ff-prefs__inner">
        <p className="ff-prefs-eyebrow">Preferences</p>
        <h1 className="ff-prefs-hero">Your taste, <em>clearly.</em></h1>
        <p className="ff-prefs-masthead__sub">See the direct choices that shape recommendations and adjust only what matters.</p>
        <div className="ff-prefs-chip"><i aria-hidden="true" /><span>Private to your account</span></div>
      </div>
    </section>
  )
}
