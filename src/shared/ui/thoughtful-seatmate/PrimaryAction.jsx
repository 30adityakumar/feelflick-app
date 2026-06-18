import { forwardRef } from 'react'
import Button from '@/shared/ui/Button'
import './PrimaryAction.css'

const SIZE_CLASS = {
  sm: 'ts-action-primary--sm',
  md: 'ts-action-primary--md',
  lg: 'ts-action-primary--lg',
}

/**
 * PrimaryAction — COMPATIBILITY WRAPPER over the canonical `<Button variant="primary">`.
 *
 * Status: COMPATIBILITY (Slice B). PrimaryAction no longer maintains its own button
 * semantics or loading implementation — it delegates everything to the canonical
 * Button, which owns: native button + default `type="button"` (callers may pass
 * `type="submit"`), the `disabled`/`loading` precedence, `aria-busy`, `data-loading`,
 * the loading DOM (`.ff-btn__label` / `.ff-btn__spinner`), accessible-name preservation
 * and loading width-stability, the 2px offset `--color-focus` focus-visible outline,
 * forced-colours support, the reduced-motion-safe spinner, and invalid-size fallback.
 *
 * This wrapper exists only so the current import path keeps working and the existing
 * home / movie visuals stay byte-identical until those consumers migrate to
 * `<Button variant="primary">`. (Watchlist has already migrated: it renders the
 * canonical Button directly and imports `./PrimaryAction.css` itself for the same legacy
 * recipe, so this wrapper's remaining *component* consumers are home + movie.) It adds
 * the legacy `ts-action-primary*` compatibility classes; the legacy *visual recipe*
 * (flat ivory, legacy size metrics, darken-on-hover, 1px press translate) is preserved by
 * `./PrimaryAction.css`. Do NOT add new adopters — use `<Button variant="primary">`.
 * Retirement: when production imports reach zero AND no consumer carries the
 * `ts-action-primary*` compat classes, this file + PrimaryAction.css are removed in a
 * dedicated PR.
 *
 * @param {object} props
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.fullWidth=false]
 * @param {boolean} [props.loading=false]
 * @param {boolean} [props.disabled=false]
 * @param {'button'|'submit'|'reset'} [props.type='button']
 * @param {string} [props.className]
 */
const PrimaryAction = forwardRef(function PrimaryAction({
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  children,
  ...props
}, ref) {
  // Invalid size → md compat class (mirrors Button's own md size fallback).
  const compatClass = [
    'ts-action-primary',
    SIZE_CLASS[size] || SIZE_CLASS.md,
    fullWidth ? 'ts-action-primary--full' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <Button
      ref={ref}
      variant="primary"
      size={size}
      fullWidth={fullWidth}
      loading={loading}
      disabled={disabled}
      type={type}
      className={compatClass}
      {...props}
    >
      {/* Legacy structural grouping: the old PrimaryAction always wrapped children in a
          single inline span, so multi-child content (icon + text) flowed inline WITHOUT
          Button's flex `gap` and with the legacy box metrics. Reproducing that single
          wrapper keeps home/movie icon+label buttons byte-identical (Button would
          otherwise lay the children out as gap-separated flex items). It is a plain
          span — NOT the retired `ts-action-primary__label` class (it carries no class). */}
      <span>{children}</span>
    </Button>
  )
})

export default PrimaryAction
