// src/features/movie/PrimaryCaseCard.jsx
// The Film File's leading "case" card (F6B). Consolidates the strongest available
// reason a film was surfaced into ONE statement at the top of the page, so the
// case is clear before the user scrolls — instead of being assembled from the
// hero pills + Why-for-you cards + the (previously buried) FF Take.
//
// EXISTING DATA ONLY · NEVER FABRICATES. Tier-aware, graceful degradation:
//   Tier 1 — curated/auto `ff_take` present → lead with that editorial hook.
//   Tier 2 — warm taste signals → lead with the adaptive "why this fits you" line.
//   Tier 3 — anon / cold-start → lead with the honest standalone-profile line
//            (deriveWhyHeader already produces "sign in" / "rate 5+" copy).
// The match % is shown ONLY when the engine actually produced one, always with a
// plain-language gloss. Caveats (daypart / content boundaries) live in the hero —
// not repeated here. Self-hides only if there is genuinely no useful case.

import AccentPanel from '@/shared/ui/AccentPanel'
import Eyebrow from '@/shared/ui/Eyebrow'
import { HP, RADIUS, SPACE } from './data'
import { derivePrimaryCase } from './derive/primaryCase'

/**
 * @param {object}  props
 * @param {object|null} props.ffTake     overlay.ff_take ({ body, byline, meta }) or null
 * @param {object}  props.whyHeader      { eyebrow, headline, rationale } (always tier-adaptive)
 * @param {number|null} props.matchPct   engine match % (0–100) or null when unavailable
 * @param {string[]} [props.moodTags]    film mood_tags (descriptive chips)
 * @param {string|null} [props.fitProfile] film fit_profile (descriptive chip)
 * @param {boolean} [props.signedIn]
 * @returns {JSX.Element|null}
 */
export default function PrimaryCaseCard({
  ffTake, whyHeader, matchPct, moodTags = [], fitProfile, signedIn = false,
}) {
  // Pure tier-selection decision (extracted F5.2 — same values as before).
  const { label, lead, hasMatch, chips, showNudge, shouldRender, isTake } =
    derivePrimaryCase({ ffTake, whyHeader, matchPct, moodTags, fitProfile, signedIn })

  // Self-hide only when there is truly no useful case to make.
  if (!shouldRender) return null

  return (
    <section
      aria-label="The case for this film"
      className="ff-movie-section ff-movie-primary-case"
      style={{ padding: `${SPACE.sectionSm}px ${SPACE.gutter}px 8px`, borderTop: `1px solid ${HP.border}` }}
    >
      <AccentPanel
        variant="gradient"
        tone="purple"
        radius="lg"
        style={{ maxWidth: 880, padding: '26px 30px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: lead ? 12 : 0 }}>
          <Eyebrow color={HP.purple}>{label}</Eyebrow>
          {hasMatch && (
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 7 }}>
              <span style={{ fontFamily: 'Outfit', fontSize: 17, fontWeight: 700, color: HP.text, fontVariantNumeric: 'tabular-nums' }}>{matchPct}%</span>
              <span style={{ fontFamily: 'Outfit', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: HP.textMuted }}>
                match · how it fits your taste so far
              </span>
            </span>
          )}
        </div>

        {lead && (
          <p
            style={{
              margin: 0,
              fontFamily: 'Outfit, Inter, sans-serif',
              fontSize: 'clamp(17px, 1.5vw, 21px)',
              lineHeight: 1.5,
              color: HP.text,
              letterSpacing: '-0.01em',
              fontStyle: isTake ? 'italic' : 'normal',
              textWrap: 'pretty',
            }}
          >
            {lead}
          </p>
        )}

        {chips.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
            {chips.map(c => (
              <span key={c} style={{ padding: '4px 10px', borderRadius: RADIUS.pill, background: 'rgba(255,255,255,0.05)', border: `1px solid ${HP.border}`, fontFamily: 'Outfit', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: HP.textSoft }}>{c}</span>
            ))}
          </div>
        )}

        {showNudge && (
          <p style={{ margin: '16px 0 0 0', fontSize: 12.5, lineHeight: 1.5, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif' }}>
            Sign in and rate a few films to make this fit personal.
          </p>
        )}
      </AccentPanel>
    </section>
  )
}
