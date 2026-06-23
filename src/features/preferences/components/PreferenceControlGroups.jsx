// src/features/preferences/components/PreferenceControlGroups.jsx
// Progressive-disclosure groups for the remaining truthful controls.

import DirectorPreferences from './DirectorPreferences'
import BoundaryPreferences from './BoundaryPreferences'
import DisplayPreferences from './DisplayPreferences'
import StreamingComingSoon from './StreamingComingSoon'

function Group({ title, sub, badge, defaultOpen, children }) {
  return (
    <details className="ff-prefs-group" {...(defaultOpen ? { open: true } : {})}>
      <summary>
        <span>
          <span className="ff-prefs-group__title">{title}{badge ? <span className="ff-prefs-comingsoon__badge">{badge}</span> : null}</span>
          <span className="ff-prefs-group__sub">{sub}</span>
        </span>
        <span className="ff-prefs-group__chev" aria-hidden="true">⌄</span>
      </summary>
      <div className="ff-prefs-group__body">{children}</div>
    </details>
  )
}

export default function PreferenceControlGroups() {
  return (
    <section className="ff-prefs-card ff-prefs-card--tint" style={{ paddingLeft: 0, paddingRight: 0 }}>
      <div className="ff-prefs__inner">
        <div className="ff-prefs-section ff-prefs-h"><p className="ff-prefs-eyebrow"><span className="ff-prefs-h__rule" aria-hidden="true" />More controls</p><h2>Fine-tune only what matters.</h2></div>
        <Group title="Directors" sub="Voices you trust, and ones to push down.">
          <DirectorPreferences />
        </Group>
        <Group title="Content boundaries" sub="What we exclude or flag when our data identifies it.">
          <BoundaryPreferences />
        </Group>
        <Group title="Saved display preferences" sub="Subtitles, spoiler detail, languages.">
          <DisplayPreferences />
        </Group>
        <Group title="Where you can watch" sub="Streaming services." badge="Coming soon">
          <StreamingComingSoon />
        </Group>
      </div>
    </section>
  )
}
