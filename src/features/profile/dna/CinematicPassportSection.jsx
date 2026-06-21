// src/features/profile/dna/CinematicPassportSection.jsx
// Passport — the privacy-safe, explicit-export share section. The passport face is CORS-safe by
// construction (abstract barcode, no remote artwork), so the PNG export never taints. Copy
// summary is a whitelisted text string (no email / UUID / counts / history). This is an explicit
// export action only — never public-profile enablement.

import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import CinematicPassport from './CinematicPassport'

export default function CinematicPassport_Section({ identity, evidenceVersion, onEvidence, onToast }) {
  const cardRef = useRef(null)
  const [busy, setBusy] = useState(false)

  const saveImage = async () => {
    if (!cardRef.current || busy) return
    setBusy(true)
    try {
      const url = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true, backgroundColor: '#0e0f0f' })
      const a = document.createElement('a')
      a.download = `${(identity.displayName || 'cinematic').toLowerCase()}-cinematic-passport.png`
      a.href = url; a.click()
      onToast?.('Passport image created.')
    } catch { onToast?.('Could not create the image. Try again.') }
    finally { setBusy(false) }
  }

  const copySummary = async () => {
    const title = identity.hasArchetype ? identity.archetype.slice(0, 2).join(' · ') : 'Cinematic DNA'
    const text = `My Cinematic DNA — ${title}${identity.passportLine ? `. ${identity.passportLine}` : ''} · via FeelFlick`
    try { await navigator.clipboard.writeText(text); onToast?.('Passport summary copied.') }
    catch { onToast?.('Passport summary ready to copy.') }
  }

  return (
    <section className="ff-dna-share" id="dna-passport" aria-labelledby="ff-dna-passport-h2">
      <div className="ff-dna__shell">
        <div className="ff-dna-section__head">
          <div>
            <p className="ff-dna-eyebrow">Cinematic Passport</p>
            <h2 id="ff-dna-passport-h2">Made to be shared.</h2>
          </div>
          <p>Personal enough to start a conversation. Private enough to post.</p>
        </div>
        <div className="ff-dna-share__layout">
          <CinematicPassport identity={identity} evidenceVersion={evidenceVersion} innerRef={cardRef} />
          <div className="ff-dna-share__copy">
            <p className="ff-dna-eyebrow">Ready for friends</p>
            <h3>A cinematic identity, not a data dump.</h3>
            <p>The passport carries your archetype, visual signature, and a few grounded tags. It excludes your watched titles, ratings, dates, email, and private behavioural evidence.</p>
            <div className="ff-dna-share__actions">
              <button type="button" className="ff-dna-btn ff-dna-btn--primary" onClick={saveImage} disabled={busy}>{busy ? 'Creating…' : 'Save passport image'}</button>
              <button type="button" className="ff-dna-btn ff-dna-btn--secondary" onClick={copySummary}>Copy summary</button>
              <button type="button" className="ff-dna-btn ff-dna-btn--ghost" onClick={onEvidence}>Inspect evidence</button>
            </div>
            <p className="ff-dna-share__note">Private by default. Sharing is an explicit export — your profile stays owner-only.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
