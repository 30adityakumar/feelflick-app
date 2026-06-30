// src/features/movie/components/SocialContext.jsx
// F5.6 — consolidates social proof (Friends Loved + Taste Twin) into ONE restrained,
// collapsed-by-default disclosure so the Film File supports the decision dossier
// without becoming a social feed.
//
// PRIVACY (see docs/movie/social-content-policy-f56.md):
//  • Friends remain IDENTIFIED — the current user explicitly follows them, so names,
//    avatars, real ratings, and real review text may show.
//  • Taste Twin is ANONYMISED on the Film File: the rating, review text, watched
//    date, and exact overall-similarity value are REAL and kept verbatim, but the
//    twin's name / avatar / identity-derived initials & colour are hidden. There is
//    no explicit public-profile / taste-twin-consent field in the schema or hooks,
//    and cross-user-readable RLS is NOT treated as consent. Re-identification needs
//    an explicit, enforceable consent model. This is presentation-only — the hook's
//    returned identity data is not altered or overwritten.

import FilmFileDisclosure from './FilmFileDisclosure'
import { HP as HP_BASE, RADIUS } from '../data'

const HP = {
  ...HP_BASE,
  panel: 'var(--ts-surface-1, #1d1814)',
  border: 'var(--ts-border-subtle, #302c28)',
  borderStrong: 'var(--ts-border-strong, #46423d)',
  text: 'var(--ts-text-primary, #f3ecdf)',
  textSoft: 'var(--ts-text-secondary, #beb8ad)',
  textMuted: 'var(--ts-text-muted, #8d887f)',
  textFaint: 'var(--ts-text-muted, #8d887f)',
  purple: 'var(--ts-text-secondary, #beb8ad)',
  purpleDeep: 'var(--ts-text-muted, #8d887f)',
  pink: 'var(--ts-text-secondary, #beb8ad)',
}

const starText = (rating10) => `${(rating10 / 2).toFixed(1)} out of 5 stars`

function FriendsSummary({ friends }) {
  const avg = friends.reduce((s, f) => s + (f.rating || 0), 0) / friends.length
  const avgDisplay = (avg / 2).toFixed(1)
  const summaryNames = friends.slice(0, 3).map((f) => f.name).join(', ')
  const noted = friends.filter((f) => f.reviewText)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex' }}>
          {friends.slice(0, 5).map((f, i) => (
            <div key={f.id} style={{ width: 36, height: 36, borderRadius: RADIUS.pill, background: f.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontWeight: 700, color: '#0A0510', fontSize: 14, border: '2px solid #06060a', marginLeft: i > 0 ? -10 : 0, overflow: 'hidden' }}>
              {f.avatarUrl
                ? <img src={f.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (f.name || '?').charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 500, color: HP.text, letterSpacing: '-0.01em' }}>
            {friends.length} {friends.length === 1 ? 'person' : 'people'} you follow loved this
          </div>
          <div style={{ fontSize: 12, color: HP.textMuted, fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
            {summaryNames} · avg <span style={{ color: HP.amber, fontWeight: 600 }}>{avgDisplay}★</span>
          </div>
        </div>
      </div>

      {/* Real friend notes, flattened (no nested disclosure — the outer one is the
          single toggle). Friends without notes still count toward the summary. */}
      {noted.length > 0 && (
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {noted.map((f) => (
            <div key={f.id} style={{ padding: '14px 16px', borderRadius: RADIUS.sm, background: 'rgba(255,255,255,0.03)', border: `1px solid ${HP.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: RADIUS.pill, background: f.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontWeight: 700, color: '#0A0510', fontSize: 12, overflow: 'hidden' }}>
                  {f.avatarUrl ? <img src={f.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (f.name || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: HP.text }}>{f.name}</div>
                <div style={{ marginLeft: 'auto', fontSize: 11, color: HP.amber, fontFamily: 'Inter, sans-serif', fontWeight: 700 }} aria-label={starText(f.rating)}>{(f.rating / 2).toFixed(1)}★</div>
              </div>
              <div style={{ fontSize: 12, color: HP.textMuted, fontFamily: 'Inter, system-ui, sans-serif', fontStyle: 'italic' }}>
                {f.reviewText}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TwinSpotlight({ twin }) {
  // rating + review text + watched date + similarity are REAL user-authored data and
  // are kept verbatim. Identity (name / avatar / initials / UUID-colour) is hidden —
  // there is no consent field for surfacing it here.
  const starsFilled = Math.round(twin.rating / 2)
  return (
    <div className="ff-movie-twin-anon" style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
      {/* generic, identity-free glyph */}
      <div aria-hidden="true" style={{ flexShrink: 0, width: 44, height: 44, borderRadius: RADIUS.pill, background: 'var(--ts-surface-1, #1d1814)', border: '1px solid var(--ts-border-subtle, #302c28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ts-text-primary, #f3ecdf)" strokeWidth="1.6"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" /></svg>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: HP.text }}>A taste twin rated this film</div>
        <div style={{ fontSize: 11.5, color: HP.textMuted, fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
          Someone with broadly similar viewing patterns · rated {twin.watchedDate}
        </div>
        <div style={{ marginTop: 10, display: 'inline-flex', gap: 3 }} aria-label={starText(twin.rating)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <svg key={i} aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill={i <= starsFilled ? HP.amber : 'transparent'} stroke={i <= starsFilled ? HP.amber : HP.textFaint} strokeWidth="2"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" /></svg>
          ))}
        </div>
        {twin.note
          ? (
            <p style={{ margin: '12px 0 0 0', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 16, lineHeight: 1.5, color: HP.text, fontStyle: 'italic', letterSpacing: '-0.012em', textWrap: 'pretty' }}>
              “{twin.note}”
            </p>
            )
          : (
            <p style={{ margin: '12px 0 0 0', fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: 1.5, color: HP.textSoft, fontStyle: 'italic' }}>
              No note yet — just the rating.
            </p>
            )}
      </div>
    </div>
  )
}

/**
 * @param {object} props
 * @param {Array} [props.friends]  identified followed-user entries (or [])
 * @param {object|null} [props.twin]  the anonymised taste-twin entry (or null)
 */
export default function SocialContext({ friends = [], twin = null }) {
  const hasFriends = Array.isArray(friends) && friends.length > 0
  const hasTwin = Boolean(twin)
  if (!hasFriends && !hasTwin) return null

  return (
    <FilmFileDisclosure
      className="ff-movie-social-context"
      heading="What others thought"
      copy="Real ratings and notes from people connected to your taste."
      defaultOpen={false}
    >
      {hasFriends && <FriendsSummary friends={friends} />}
      {hasFriends && hasTwin && <div style={{ height: 1, background: HP.border, margin: '28px 0' }} aria-hidden="true" />}
      {hasTwin && <TwinSpotlight twin={twin} />}
    </FilmFileDisclosure>
  )
}
