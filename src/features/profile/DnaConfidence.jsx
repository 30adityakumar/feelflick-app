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
import { HP, HP_GRAD, RADIUS, SPACE } from './data'

// Tier label from the confidence value — LABELING ONLY (mirrors QuickStats'
// low/medium/high thresholds). Never recomputes or reinterprets the number.
function tierFor(confidence) {
  if (confidence >= 80) return { key: 'high', label: 'Reading you well' }
  if (confidence >= 40) return { key: 'medium', label: 'Getting sharper' }
  return { key: 'low', label: 'Still learning' }
}

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
  const pct = Math.max(0, Math.min(100, Math.round(confidence)))
  const tier = tierFor(pct)
  const cold = tier.key === 'low'

  return (
    <section className="ff-profile-section" style={{ padding: `${SPACE.sectionMd}px ${SPACE.gutter}px`, borderTop: `1px solid ${HP.border}` }}>
      <div className="ff-profile-dnaconf-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 64, alignItems: 'flex-start' }}>
        {/* Left — the number, tier, bar, and the evidence it's built from */}
        <div>
          <Eyebrow rule color={HP.purple} style={{ marginBottom: 16 }}>DNA confidence</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Outfit', fontSize: 72, fontWeight: 200, color: HP.text, letterSpacing: '-0.05em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
            <span style={{ fontFamily: 'Outfit', fontSize: 14, fontWeight: 500, color: cold ? HP.textMuted : HP.purple, fontStyle: 'italic' }}>{tier.label}</span>
          </div>
          <div role="presentation" style={{ marginTop: 18, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.pill, overflow: 'hidden', maxWidth: 320 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: HP_GRAD, borderRadius: RADIUS.pill, transition: 'width 0.9s cubic-bezier(0.2,0.8,0.2,1)' }} />
          </div>
          <div style={{ marginTop: 18, fontSize: 12, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.02em' }}>
            Built from <span style={{ color: HP.textSoft, fontWeight: 600 }}>{filmsLogged}</span> logged ·{' '}
            <span style={{ color: HP.textSoft, fontWeight: 600 }}>{filmsRated}</span> rated ·{' '}
            <span style={{ color: HP.textSoft, fontWeight: 600 }}>{moodSignals}</span> mood signal{moodSignals === 1 ? '' : 's'}
          </div>
        </div>

        {/* Right — honest explanation, state-aware guidance, Tonight connection */}
        <div style={{ maxWidth: 520 }}>
          <p style={{ margin: 0, fontFamily: 'Outfit, Inter, sans-serif', fontSize: 16, lineHeight: 1.65, color: HP.textSoft, textWrap: 'pretty' }}>
            This is how much <strong style={{ color: HP.text, fontWeight: 600 }}>taste evidence</strong> FeelFlick has to
            work with — not a score of you, and not a measure of accuracy. It climbs as you log films, rate them, set
            preferences, and react to your nightly picks.
          </p>
          <p style={{ margin: '16px 0 0 0', fontSize: 14, lineHeight: 1.6, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif' }}>
            {cold
              ? 'A low number is completely normal when you’re new — the more you watch and react, the more personal your nightly pick gets.'
              : 'FeelFlick is reading you well — keep logging and rating, and it keeps sharpening.'}
          </p>
          <p style={{ margin: '20px 0 0 0', fontSize: 13, lineHeight: 1.5, color: HP.textFaint, fontFamily: 'Outfit', fontStyle: 'italic' }}>
            This profile is what FeelFlick weighs when it chooses your one film each night.
          </p>
          {cold && (
            <Link
              to="/home"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 24, padding: '11px 20px', borderRadius: RADIUS.sm, background: HP_GRAD, color: '#fff', fontFamily: 'Outfit', fontSize: 13, fontWeight: 600, letterSpacing: '0.02em', textDecoration: 'none', boxShadow: '0 10px 26px -10px rgba(167,139,250,0.5)' }}
            >
              See tonight’s pick →
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
