// src/shared/components/ActionButton.jsx
import { Loader2 } from 'lucide-react'
import { HP, ROSE } from '@/shared/lib/tokens'

/**
 * Canonical in-card action buttons (rounded-8, Inter 14) — the "act on this card"
 * family shared by the /home Briefing and the /movie Film File. Distinct from the
 * shared <Button> (rounded-full CTA pill) by design.
 *
 * The component owns the LOOK (shape, font, colors, the active tint, states); each
 * surface owns its LAYOUT (flex / width / mobile arrangement) via `className`, since
 * the Briefing's 4-in-a-row and the Film File's 3-stack are legitimately different.
 *
 * <ActionButton>          — solid rose primary ("See More" / "Play Trailer").
 * <SecondaryActionButton> — outline Watched/Save/Skip taps. `active` tints to
 *   `accent` (purple by default; migrated surfaces pass rose / a film-palette colour);
 *   `collapse` makes it a 44×44 icon-only target on mobile (tight rows) → labeled on lg+.
 */

const BASE = 'inline-flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed'

export function ActionButton({ className = '', style, children, ...props }) {
  return (
    <button
      type="button"
      className={`${BASE} rounded-lg ${className}`.trim()}
      style={{
        background: ROSE, border: 'none', color: '#fff',
        fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, letterSpacing: '0.02em',
        padding: '14px 22px', cursor: 'pointer',
        boxShadow: '0 12px 28px -8px rgba(221,78,131,0.5)',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Canonical rose micro-CTA chip — the small uppercase "Open shelf →" /
 * "Back to shelves →" pill used across the lists surfaces. Solid rose, Inter 11,
 * radius-6, uppercase with wide tracking. The compact sibling of <ActionButton>
 * (full-size primary) — same brand DNA, chip scale.
 *
 * @param {object} props  Standard <button> props; `style` merges over the look.
 */
export function ChipButton({ className = '', style, children, ...props }) {
  return (
    <button
      type="button"
      className={`${BASE} rounded-md ${className}`.trim()}
      style={{
        background: ROSE, border: 'none', color: '#fff',
        fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
        textTransform: 'uppercase', padding: '10px 18px', cursor: 'pointer',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export function SecondaryActionButton({
  active,
  loading = false,
  icon,
  label,
  accent = HP.purple,
  collapse = false,
  className = '',
  style,
  ...props
}) {
  const isActive = Boolean(active)
  const layout = collapse
    ? 'h-11 w-11 flex-none rounded-full lg:h-auto lg:w-auto lg:flex-initial lg:rounded-lg lg:px-[22px] lg:py-[14px]'
    : 'rounded-lg px-[22px] py-[14px]'
  return (
    <button
      type="button"
      disabled={loading}
      // Only a toggle (Watched/Save pass `active`); Skip omits it → no aria-pressed.
      aria-pressed={active === undefined ? undefined : isActive}
      className={`${BASE} ${layout} ${className}`.trim()}
      style={{
        fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: HP.textSoft,
        background: isActive ? `${accent}2e` : 'rgba(255,255,255,0.06)',
        // Longhand border props (not the `border` shorthand) so a caller's `style`
        // can override `borderColor` alone (e.g. /home's warm keyline) without
        // mixing shorthand + longhand — which makes React warn on rerender.
        borderWidth: 1, borderStyle: 'solid', borderColor: isActive ? `${accent}66` : HP.border,
        cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.65 : 1,
        ...style,
      }}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin lg:h-3.5 lg:w-3.5" /> : icon}
      {label && <span className={collapse ? 'hidden lg:inline' : undefined}>{label}</span>}
    </button>
  )
}
