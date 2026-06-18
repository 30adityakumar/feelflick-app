import * as RadixTooltip from '@radix-ui/react-tooltip'

/**
 * Accessible tooltip built on Radix — keyboard, focus, ARIA, and hover/focus
 * intent are handled for you. Styled to the editorial language (dark, subtle
 * border, Inter micro-label). Wrap any focusable trigger element.
 *
 * Pattern primitive: this is the canonical way to add accessible overlays
 * (tooltip/popover/dropdown/dialog) — add more @radix-ui/react-* wrappers here
 * rather than hand-rolling focus/keyboard logic. For many tooltips, hoist a
 * single <RadixTooltip.Provider> to the app root instead of per-instance.
 *
 * @param {object} props
 * @param {React.ReactNode} props.content - Tooltip body. Falsy => renders the child bare.
 * @param {React.ReactNode} props.children - The trigger element.
 * @param {'top'|'right'|'bottom'|'left'} [props.side='top'] - Preferred side.
 * @param {number} [props.delayDuration=200] - Open delay (ms).
 * @returns {JSX.Element}
 */
export default function Tooltip({ content, children, side = 'top', delayDuration = 200 }) {
  if (!content) return children
  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={6}
            className="z-50 max-w-xs select-none rounded-lg border border-white/10 bg-[var(--color-surface-2,#241e19)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary,#f3ecdf)] shadow-xl shadow-black/40 backdrop-blur-md"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {content}
            <RadixTooltip.Arrow className="fill-[var(--color-surface-2,#241e19)]" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}
