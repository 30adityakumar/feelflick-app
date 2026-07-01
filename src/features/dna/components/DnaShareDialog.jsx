// Share dialog — exports a public-safe share card (html-to-image), Web Share API, clipboard link.
// A PRIVATE profile can still export an image but gets NO misleading public link.
import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import Modal from '@/shared/ui/Modal'
import { trackEvent, EVENTS } from '@/shared/services/betaEvents'

export default function DnaShareDialog({ open, onClose, identity, dna, isOwner, targetUserId, onToast }) {
  const cardRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const isPublic = identity.publicProfile
  const shareUrl = targetUserId ? `${(typeof window !== 'undefined' && window.location?.origin) || 'https://app.feelflick.com'}/profile/${targetUserId}` : null
  const archetype = dna.forming ? 'Cinematic DNA' : [dna.archetype?.[0], dna.archetype?.[1]].filter(Boolean).join(' · ')

  const saveImage = async () => {
    if (!cardRef.current || busy) return
    setBusy(true)
    try {
      const url = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true, backgroundColor: '#0f1010' })
      const a = document.createElement('a')
      a.download = `${(identity.name || 'cinematic').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-dna.png`
      a.href = url; a.click()
      trackEvent(EVENTS.dna_profile_shared, { surface: 'image', is_owner: !!isOwner })
      onToast?.('DNA card image created.')
    } catch { onToast?.('Could not create the image. Try again.') }
    finally { setBusy(false) }
  }

  const shareLink = async () => {
    if (!shareUrl) return
    trackEvent(EVENTS.dna_profile_shared, { surface: 'link', is_owner: !!isOwner })
    try {
      if (navigator.share) { await navigator.share({ title: `${identity.name} on FeelFlick`, url: shareUrl }); return }
      await navigator.clipboard.writeText(shareUrl); onToast?.('Profile link copied.')
    } catch { onToast?.('Profile link ready to copy.') }
  }

  return (
    <Modal open={open} onClose={onClose} label="Share DNA profile" size="md">
      <div className="dna-dialog">
        <div className="dna-dialog__head"><h3>Share {isOwner ? 'your' : `${identity.name.split(' ')[0]}’s`} DNA</h3><button type="button" className="dna-iconbtn" onClick={onClose} aria-label="Close">✕</button></div>
        <div ref={cardRef} className="dna-story" style={{ borderRadius: 16, minHeight: 'auto', padding: 24 }}>
          <p className="dna__eyebrow">{identity.name}’s Cinematic DNA</p>
          <h4 style={{ margin: '12px 0' }}>{archetype}</h4>
          {!dna.forming && dna.tags?.length ? <div className="dna-strip__tags">{dna.tags.slice(0, 4).map((t) => <span key={t} className="dna-tag">{t}</span>)}</div> : null}
          <p className="dna__muted" style={{ marginTop: 14, fontSize: '.7rem' }}>via FeelFlick</p>
        </div>
        <div className="dna-story__bars" style={{ marginTop: 16, gap: 8, display: 'flex' }}>
          <button type="button" className="dna-btn dna-btn--primary" onClick={saveImage} disabled={busy} style={{ flex: 1 }}>{busy ? 'Creating…' : 'Save card image'}</button>
          {isPublic && shareUrl
            ? <button type="button" className="dna-btn dna-btn--secondary" onClick={shareLink} style={{ flex: 1 }}>Copy profile link</button>
            : null}
        </div>
        {!isPublic ? <p className="dna__muted" style={{ marginTop: 12, fontSize: '.7rem' }}>Your profile is private, so there’s no public link yet. Make it public in Edit profile to share a link.</p> : null}
      </div>
    </Modal>
  )
}
