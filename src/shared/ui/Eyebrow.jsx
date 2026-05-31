// src/shared/ui/Eyebrow.jsx
import { HP } from '@/shared/lib/tokens'

/**
 * Canonical eyebrow / kicker — the small uppercase, wide-tracked label that sits
 * above a section header or tags a meta line. ONE source of truth for what was
 * hand-rolled ~210× inline across every surface (plus the landing's `.ff-eyebrow`),
 * including the 22px brand-rule "section kicker" that 9 surfaces each re-implemented.
 *
 * Codifies CLAUDE.md's documented Kicker pattern: Outfit 700, ~11px, 0.28em tracking,
 * uppercase, with an optional leading 22px rule.
 *
 * @param {object}  props
 * @param {React.ReactNode} props.children  The label text.
 * @param {string}  [props.color=HP.purple]  Accent — purple for section kickers,
 *   a muted token (HP.textMuted / HP.textFaint) for quiet meta labels.
 * @param {boolean} [props.rule=false]       Prepend the 22px accent rule (kicker form).
 * @param {number}  [props.size=11]          Font size in px (10–11 in practice).
 * @param {string}  [props.spacing='0.28em'] Letter-spacing — 0.28–0.32em for section
 *   kickers, the tighter 0.18em for quiet field / meta labels.
 * @param {string}  [props.className]
 * @param {object}  [props.style]            Merged onto the root (margins / positioning).
 * @returns {JSX.Element}
 */
export default function Eyebrow({ children, color = HP.purple, rule = false, size = 11, spacing = '0.28em', className = '', style, ...props }) {
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        fontFamily: 'Outfit', fontSize: size, fontWeight: 700,
        letterSpacing: spacing, textTransform: 'uppercase', color,
        ...style,
      }}
      {...props}
    >
      {rule && <span style={{ height: 1, width: 22, background: color, opacity: 0.6, flex: 'none' }} />}
      {children}
    </div>
  )
}
