// src/shared/ui/Eyebrow.jsx
import { HP } from '@/shared/lib/tokens'

/**
 * Canonical eyebrow / kicker — the small uppercase, wide-tracked label that sits
 * above a section header or tags a meta line. ONE source of truth for what was
 * hand-rolled ~210× inline across every surface (plus the landing's `.ff-eyebrow`),
 * including the 22px brand-rule "section kicker" that 9 surfaces each re-implemented.
 *
 * Codifies CLAUDE.md's documented Kicker pattern: Outfit 700, ~11px, uppercase,
 * with an optional leading 22px rule.
 *
 * `tone` encodes the two roles (so call-sites read by intent, not raw values):
 *   • 'section' (default) — the purple section kicker, 0.28em tracking.
 *   • 'meta'              — a quiet muted field / meta label, tighter 0.18em.
 * `color` / `spacing` still override the tone for edge cases (e.g. the 0.32em
 * masthead kicker, or a textFaint label).
 *
 * @param {object}  props
 * @param {React.ReactNode} props.children  The label text.
 * @param {'section'|'meta'} [props.tone='section']
 * @param {string}  [props.color]           Accent override (defaults from `tone`).
 * @param {boolean} [props.rule=false]      Prepend the 22px accent rule (kicker form).
 * @param {number}  [props.size=11]         Font size in px (10–11 in practice).
 * @param {string}  [props.spacing]         Letter-spacing override (defaults from `tone`).
 * @param {number}  [props.weight=700]      Font weight (500 for soft masthead sublabels).
 * @param {string}  [props.className]
 * @param {object}  [props.style]           Merged onto the root (margins / positioning).
 * @returns {JSX.Element}
 */
const TONES = {
  section: { color: HP.purple, spacing: '0.28em' },
  meta: { color: HP.textMuted, spacing: '0.18em' },
}

export default function Eyebrow({ children, tone = 'section', color, rule = false, size = 11, spacing, weight = 700, className = '', style, ...props }) {
  const t = TONES[tone] || TONES.section
  const accent = color ?? t.color
  const ls = spacing ?? t.spacing
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        fontFamily: 'Outfit', fontSize: size, fontWeight: weight,
        letterSpacing: ls, textTransform: 'uppercase', color: accent,
        ...style,
      }}
      {...props}
    >
      {rule && <span aria-hidden style={{ height: 1, width: 22, background: accent, opacity: 0.6, flex: 'none' }} />}
      {children}
    </div>
  )
}
