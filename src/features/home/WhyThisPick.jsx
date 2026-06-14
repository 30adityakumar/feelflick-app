// src/features/home/WhyThisPick.jsx
// The Briefing's "makes its case" layer (F5 · restyled F1). Renders the engine's
// grounded reason for a pick (`film.engineReason` = scoreMovieForUser →
// pickReason.label, e.g. "Because you loved Parasite") as the editorial heart of
// the case — a hairline-ruled rung in the curator (Newsreader) voice, rose ink.
//
// NULL-SAFE BY DESIGN: when no reason exists (cold-start / no profile) it renders
// NOTHING — we never fabricate a "why". A pick without a real case simply shows
// its other rungs (synopsis) instead.
//
// F1 (Midnight Film Journal direction): the brand-purple AccentPanel card was
// replaced by a hairline-ruled "case rung" — fewer boxed surfaces, editorial
// typography, restrained rose accent. `CaseRung` is exported so the Briefing can
// compose sibling rungs (e.g. the synopsis) in the same visual language.

import Eyebrow from '@/shared/ui/Eyebrow'

// Brand rose — the design-system signature accent (--brand-rose). 5.5:1 on the
// near-black canvas → AA for the small tracked labels.
export const ROSE = '#DD4E83'
const IVORY = '#F2ECE1'

/**
 * One rung of the recommendation case. A small rose label (optionally prefixed
 * with a roman numeral when the case has more than one rung) over the rung body.
 * @param {object} props
 * @param {string} [props.numeral]  Roman marker ('I' / 'II') — omitted for a lone rung.
 * @param {string} props.label      The rung's rose eyebrow label.
 * @param {string} [props.accent]   Accent hue (defaults to brand rose).
 * @param {React.ReactNode} props.children
 */
export function CaseRung({ numeral, label, accent = ROSE, children, className = '', style }) {
  return (
    <div className={className} style={{ ...style }}>
      <Eyebrow color={accent} size={10} spacing="0.22em" style={{ marginBottom: 8 }}>
        {/* The roman marker only appears where a sibling rung is also visible
            (sm+). On mobile a single rung shows, so the numeral is suppressed to
            avoid a "I" with no visible "II". */}
        {numeral && <span className="hidden sm:inline" aria-hidden="true">{numeral} · </span>}
        {label}
      </Eyebrow>
      {children}
    </div>
  )
}

/**
 * @param {object} props
 * @param {string|null} props.reason  The engine's pick reason (may be null/empty).
 * @param {string} [props.numeral]    Roman marker when the case has sibling rungs.
 * @param {string} [props.accent]     Accent hue (defaults to brand rose).
 * @param {string} [props.className]
 * @param {object} [props.style]      Merged onto the root (margins/positioning).
 * @returns {JSX.Element|null}
 */
export default function WhyThisPick({ reason, numeral, accent = ROSE, className = '', style }) {
  const text = typeof reason === 'string' ? reason.trim() : ''
  if (!text) return null
  return (
    <CaseRung numeral={numeral} label="Why this pick" accent={accent} className={className} style={style}>
      <p
        style={{
          fontFamily: 'var(--font-editorial)',
          fontStyle: 'italic',
          fontSize: 'clamp(19px, 1.7vw, 25px)',
          lineHeight: 1.4,
          fontWeight: 400,
          color: IVORY,
          margin: 0,
          textWrap: 'pretty',
        }}
      >
        {text}
      </p>
    </CaseRung>
  )
}
