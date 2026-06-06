import { ChevronRight } from 'lucide-react'

import Button from '@/shared/ui/Button'

/**
 * Shared onboarding step footer: a status/help line above a primary action.
 * The wrapper + inner column + Button usage are identical across the adopting
 * steps (MoodStep / GenresStep / MoviesStep); the gate value, copy, label,
 * disabled expression, and the trailing chevron vary per step and are props.
 *
 * RatingStep does NOT use this — its footer is a SentimentRow + Skip with
 * auto-finish (no primary Continue button), so it stays custom (see F2.4 notes).
 *
 * @param {object}   props
 * @param {string}   props.statusClassName    — full class for the status <p> (keeps the
 *                                               per-step color logic + Movies' duration-200)
 * @param {React.ReactNode} props.status       — status/help text
 * @param {function} props.onContinue          — primary action handler
 * @param {boolean}  props.disabled            — disabled expression (each step's exact gate)
 * @param {React.ReactNode} [props.label='Continue'] — button label (Movies passes 'Saving…'/'Continue')
 * @param {boolean}  [props.showChevron=true]  — trailing ChevronRight (Movies omits it)
 */
export default function StepFooter({ statusClassName, status, onContinue, disabled, label = 'Continue', showChevron = true }) {
  return (
    <div className="flex-none px-5 pb-6 pt-3 sm:px-6 sm:pb-8 sm:pt-4 border-t border-white/6">
      <div className="max-w-sm mx-auto flex flex-col items-center gap-3">
        <p className={statusClassName}>{status}</p>
        <Button variant="primary" size="lg" onClick={onContinue} disabled={disabled} fullWidth>
          {label}
          {showChevron && <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
