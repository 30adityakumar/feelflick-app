// src/features/preferences/components/DisplayPreferences.jsx
// Saved display preferences. Honest framing: stored, and some screens may not use
// them yet. No "quiet boost" / ranking claims for languages.

import { usePreferencesData } from '../usePreferencesData'
import Segmented from './Segmented'
import ChipMultiSelect from './ChipMultiSelect'
import { MAX_LANGUAGES } from '../data'

export default function DisplayPreferences() {
  const { draft, setSubtitles, setSpoilerTier, addLanguage, removeLanguage, catalogs } = usePreferencesData()
  const languageItems = draft.languages.map((l) => ({ key: l, label: l }))
  const languageOptions = catalogs.LANGUAGES.map((l) => ({ key: l, label: l }))
  return (
    <div>
      <p className="ff-prefs-saved-note">Stored with your account. They don&rsquo;t change which films we recommend, and some screens may not use them yet.</p>
      <div className="ff-prefs-twocol">
        <div className="ff-prefs-field">
          <p className="ff-prefs-subhead" id="pf-subtitles-lab">Subtitles</p>
          <p className="ff-prefs-field__hint">How comfortable you are reading them. Stored only; not yet used.</p>
          <Segmented value={draft.subtitles} onChange={setSubtitles} options={catalogs.SUBTITLE_MODES} ariaLabelledBy="pf-subtitles-lab" />
        </div>
        <div className="ff-prefs-field">
          <p className="ff-prefs-subhead" id="pf-spoiler-lab">Spoiler detail</p>
          <p className="ff-prefs-field__hint">Your preferred level of synopsis detail. Stored only; not yet used.</p>
          <Segmented value={draft.spoilerTier} onChange={setSpoilerTier} options={catalogs.SPOILER_TIERS} ariaLabelledBy="pf-spoiler-lab" />
        </div>
      </div>
      <div className="ff-prefs-field" style={{ marginTop: 24 }}>
        <p className="ff-prefs-subhead">Languages you watch</p>
        <p className="ff-prefs-field__hint">Stored with your account. This list does not change recommendation ranking today.</p>
        <ChipMultiSelect label="Add a language" items={languageItems} options={languageOptions} onAdd={addLanguage} onRemove={removeLanguage} addLabel="+ Language" max={MAX_LANGUAGES} />
      </div>
    </div>
  )
}
