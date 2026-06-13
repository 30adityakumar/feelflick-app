// src/features/profile/DnaConfidence.jsx
// F7 — the honest framing for "DNA confidence". The bare "78% · high" stat in
// QuickStats read like an accuracy score or a grade on the user; this section
// explains what the number actually is (how much taste EVIDENCE FeelFlick has),
// how it grows, that low is normal when new, and what it does for Tonight.
//
// IMPORTANT: the number is the SHARED computeDnaConfidence value (unchanged in
// F7) — this component only frames it (tier labels are labeling-only). It is
// rendered self-only (a viewer can't improve someone else's profile), so the copy
// is first-person.

import { Link } from 'react-router-dom'
import Eyebrow from '@/shared/ui/Eyebrow'
import { HP, ROSE, RADIUS, SPACE } from './data'
import { deriveConfidenceBand, INK_LABEL } from './derive/profilePresentation'

// F7.4: the confidence value is the SHARED computeDnaConfidence number (unchanged), but it is
// now presented as a qualitative evidence-maturity BAND — never an exact percentage and never a
// completion meter. deriveConfidenceBand owns the label; this component only frames it.

/**
 * @param {object} props
 * @param {number} props.confidence    0–100 (the shared DNA-confidence value)
 * @param {number} [props.filmsLogged]
 * @param {number} [props.filmsRated]
 * @param {number} [props.moodSignals] distinct mood signals in the fingerprint
 * @returns {JSX.Element|null}
 */
export default function DnaConfidence({ confidence, filmsLogged = 0, filmsRated = 0, moodSignals = 0 }) {
  if (!Number.isFinite(confidence)) return null
  const band = deriveConfidenceBand(confidence)
  const cold = band.key === 'forming'

  return (
    <section className="ff-profile-section" style={{ padding: `${SPACE.sectionMd}px ${SPACE.gutter}px`, borderTop: `1px solid ${HP.border}` }}>
      <div className="ff-profile-dnaconf-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 64, alignItems: 'flex-start' }}>
        {/* Left — the maturity band (no % / no completion meter) + the evidence it's built from */}
        <div>
          <Eyebrow rule color={ROSE} style={{ marginBottom: 16 }}>DNA confidence</Eyebrow>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 48, fontWeight: 300, color: HP.text, letterSpacing: '-0.04em', lineHeight: 1.05 }}>{band.label}</div>
          <div style={{ marginTop: 22, fontSize: 12, color: INK_LABEL, fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em' }}>
            Built from <span style={{ color: HP.textSoft, fontWeight: 600 }}>{filmsLogged}</span> logged ·{' '}
            <span style={{ color: HP.textSoft, fontWeight: 600 }}>{filmsRated}</span> rated ·{' '}
            <span style={{ color: HP.textSoft, fontWeight: 600 }}>{moodSignals}</span> mood signal{moodSignals === 1 ? '' : 's'}
          </div>
        </div>

        {/* Right — honest explanation, state-aware guidance, Tonight connection */}
        <div style={{ maxWidth: 520 }}>
          <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontSize: 16, lineHeight: 1.65, color: HP.textSoft, textWrap: 'pretty' }}>
            This is how much <strong style={{ color: HP.text, fontWeight: 600 }}>taste evidence</strong> FeelFlick has to
            work with — not a score of you, and not a measure of accuracy. It climbs as you log films, rate them, set
            preferences, and react to your nightly picks.
          </p>
          <p style={{ margin: '16px 0 0 0', fontSize: 14, lineHeight: 1.6, color: INK_LABEL, fontFamily: 'Inter, sans-serif' }}>
            {cold
              ? 'A low number is completely normal when you’re new — the more you watch and react, the more personal your nightly pick gets.'
              : 'FeelFlick is reading you well — keep logging and rating, and it keeps sharpening.'}
          </p>
          <p style={{ margin: '20px 0 0 0', fontSize: 13, lineHeight: 1.5, color: INK_LABEL, fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>
            This profile is what FeelFlick weighs when it chooses your one film each night.
          </p>
          {cold && (
            <Link
              to="/home"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 24, padding: '11px 20px', borderRadius: RADIUS.sm, background: ROSE, color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, letterSpacing: '0.02em', textDecoration: 'none', boxShadow: '0 10px 26px -10px rgba(221,78,131,0.35)' }}
            >
              See tonight’s pick →
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
