// src/shared/components/ActionButton.jsx
import { Loader2 } from 'lucide-react'
import { HP, HP_GRAD } from '@/shared/lib/tokens'

/**
 * Canonical in-card action buttons (rounded-8, Outfit) — the family used on the
 * /home Briefing and the /movie Film File, previously reimplemented inline on
 * each. Distinct from the shared <Button> (rounded-full CTA pill) by design:
 * this is the "act on this card" family, not the marketing CTA.
 *
 * <ActionButton>          — the gradient primary ("See More" / "Play trailer").
 * <SecondaryActionButton> — the equal-weight outline taps (Watched / Save / Skip)
 *                           that tint when `active`, show a spinner when `loading`,
 *                           and collapse to a 44×44 icon-only target on mobile.
 */

// Secondary: 44×44 round icon-only on mobile → labeled rounded-8 pill on lg+.
const SECONDARY_CLS =
  'inline-flex h-11 w-11 flex-none items-center justify-center rounded-full transition-all duration-200 active:scale-[0.98] lg:h-auto lg:w-auto lg:flex-initial lg:gap-2.5 lg:whitespace-nowrap lg:rounded-lg lg:px-[22px] lg:py-[14px]'

export function ActionButton({ children, style, ...props }) {
  return (
    <button
      type="button"
      className="inline-flex h-11 flex-1 items-center justify-center gap-2.5 whitespace-nowrap rounded-lg px-4 transition-transform duration-200 active:scale-[0.98] lg:h-auto lg:flex-none lg:px-[22px] lg:py-[14px]"
      style={{
        background: HP_GRAD, border: 'none', color: '#fff',
        fontFamily: 'Outfit', fontSize: 13, fontWeight: 600, letterSpacing: '0.02em',
        cursor: 'pointer', boxShadow: '0 12px 28px -8px rgba(236,72,153,0.5)',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export function SecondaryActionButton({ active, loading = false, icon, label, style, ...props }) {
  const isActive = Boolean(active)
  return (
    <button
      type="button"
      disabled={loading}
      // Only a toggle (Watched/Save pass `active`); Skip omits it, so no aria-pressed.
      aria-pressed={active === undefined ? undefined : isActive}
      className={SECONDARY_CLS}
      style={{
        background: isActive ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${isActive ? HP.purple + '66' : HP.border}`,
        color: HP.textSoft, fontFamily: 'Outfit', fontSize: 13, fontWeight: 500,
        cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.65 : 1,
        ...style,
      }}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin lg:h-3.5 lg:w-3.5" /> : icon}
      {label && <span className="hidden lg:inline">{label}</span>}
    </button>
  )
}
