// Owner-only Edit profile sheet. Text + curation persist via updateDnaProfile (RMW merge — never
// clobbers unrelated settings); section toggles persist instantly via updatePrivacy. Selectors use
// the owner's REAL films / reviews / lists. Optimistic + rollback handled by useAccountData.
import { useState } from 'react'
import Modal from '@/shared/ui/Modal'
import { useAccountData } from '@/features/account/useAccountData'
import { trackEvent, EVENTS } from '@/shared/services/betaEvents'

const SECTION_FLAGS = [
  ['profilePublic', 'Public profile (visible to other members)'],
  ['filmsPublic', 'Show films'],
  ['diaryPublic', 'Show diary'],
  ['reviewsPublic', 'Show reviews'],
  ['listsPublic', 'Show public lists'],
  ['connectionsPublic', 'Show connections'],
  ['viewingRhythmPublic', 'Show viewing rhythm (time of day)'],
]

function Toggle({ label, checked, onChange, disabled }) {
  return (
    <div className="dna-toggle-row">
      <span>{label}</span>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
        onClick={() => onChange(!checked)}
        className="dna-btn dna-btn--secondary" style={{ minWidth: 64, background: checked ? 'var(--color-action-primary-fill,#f0ece4)' : undefined, color: checked ? 'var(--color-action-primary-text,#0f1010)' : undefined }}>
        {checked ? 'On' : 'Off'}
      </button>
    </div>
  )
}

export default function DnaEditSheet({ open, onClose, films = [], reviews = [], lists = [], onToast }) {
  const { serverSettings, updateDnaProfile, updatePrivacy, saveStatus } = useAccountData()
  const dp = serverSettings?.dnaProfile || {}
  const privacy = serverSettings?.privacy || {}

  const [handle, setHandle] = useState(dp.handle || '')
  const [bio, setBio] = useState(dp.bio || '')
  const [location, setLocation] = useState(dp.location || '')
  const [exploration, setExploration] = useState(dp.currentExploration || '')
  const [fourIds, setFourIds] = useState(Array.isArray(dp.featuredFilmIds) ? dp.featuredFilmIds : [])
  const [pinnedReview, setPinnedReview] = useState(dp.pinnedReviewMovieId ?? '')
  const [featuredList, setFeaturedList] = useState(dp.featuredListId ?? '')

  const toggleFour = (id) => {
    setFourIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 4 ? cur : [...cur, id])
  }

  const save = () => {
    updateDnaProfile({
      handle: handle.trim(), bio: bio.trim(), location: location.trim(),
      currentExploration: exploration.trim() || null,
      featuredFilmIds: fourIds,
      coverMovieIds: fourIds, // cover follows My Four unless separately curated (bounded scope)
      pinnedReviewMovieId: pinnedReview === '' ? null : Number(pinnedReview),
      featuredListId: featuredList === '' ? null : featuredList,
    })
    trackEvent(EVENTS.dna_profile_saved, { surface: 'edit_sheet' })
    onToast?.('Profile saved.')
  }

  const saving = saveStatus?.dnaProfile === 'saving'
  const errored = saveStatus?.dnaProfile === 'error'

  return (
    <Modal open={open} onClose={onClose} label="Edit profile" size="lg">
      <div className="dna-dialog">
        <div className="dna-dialog__head"><h3>Edit profile</h3><button type="button" className="dna-iconbtn" onClick={onClose} aria-label="Close">✕</button></div>

        <div className="dna-field"><label htmlFor="dna-handle">Display handle</label><input id="dna-handle" value={handle} maxLength={30} onChange={(e) => setHandle(e.target.value)} placeholder="how you appear (display only)" /></div>
        <div className="dna-field"><label htmlFor="dna-bio">Bio</label><textarea id="dna-bio" value={bio} maxLength={240} onChange={(e) => setBio(e.target.value)} placeholder="A line about how you watch." /></div>
        <div className="dna-field"><label htmlFor="dna-loc">Location</label><input id="dna-loc" value={location} maxLength={60} onChange={(e) => setLocation(e.target.value)} /></div>
        <div className="dna-field"><label htmlFor="dna-expl">Currently exploring</label><input id="dna-expl" value={exploration} maxLength={80} onChange={(e) => setExploration(e.target.value)} placeholder="e.g. Iranian moral dramas" /></div>

        <div className="dna-field">
          <label>My Four {fourIds.length ? `(${fourIds.length}/4)` : '(pick up to 4)'}</label>
          <div style={{ maxHeight: 180, overflow: 'auto', border: '1px solid var(--color-border-subtle,#3a3d41)', borderRadius: 10, padding: 8 }}>
            {films.length === 0 ? <p className="dna-empty">Log some films to choose.</p> : films.slice(0, 60).map((m) => (
              <label key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0', fontSize: '.8rem' }}>
                <input type="checkbox" checked={fourIds.includes(m.id)} onChange={() => toggleFour(m.id)} disabled={!fourIds.includes(m.id) && fourIds.length >= 4} />
                {m.title}{m.year ? ` (${m.year})` : ''}
              </label>
            ))}
          </div>
        </div>

        <div className="dna-field"><label htmlFor="dna-pin">Pinned review</label>
          <select id="dna-pin" value={pinnedReview} onChange={(e) => setPinnedReview(e.target.value)}>
            <option value="">Latest highly-rated (automatic)</option>
            {reviews.map((r) => <option key={r.movieId} value={r.movieId}>{r.title || `Film ${r.movieId}`}</option>)}
          </select>
        </div>
        <div className="dna-field"><label htmlFor="dna-flist">Featured list</label>
          <select id="dna-flist" value={featuredList} onChange={(e) => setFeaturedList(e.target.value)}>
            <option value="">Most recently updated (automatic)</option>
            {lists.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </div>

        <div style={{ margin: '18px 0 8px' }}>
          <p className="dna__eyebrow" style={{ marginBottom: 6 }}>Visibility</p>
          {SECTION_FLAGS.map(([key, label]) => (
            <Toggle key={key} label={label} checked={!!privacy[key]} disabled={saveStatus?.privacy === 'saving'}
              onChange={(v) => updatePrivacy({ [key]: v })} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button type="button" className="dna-btn dna-btn--primary" onClick={save} disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving…' : 'Save profile'}</button>
          <button type="button" className="dna-btn dna-btn--ghost" onClick={onClose}>Done</button>
        </div>
        {errored ? <p className="dna-empty" style={{ color: 'var(--color-brand-accent-text,#ed7a87)' }}>Couldn’t save just now — your previous profile is intact. Try again.</p> : null}
      </div>
    </Modal>
  )
}
