import { ChevronRight } from 'lucide-react'

import Button from '@/shared/ui/Button'

export default function StepFooter({ statusClassName = '', status, onContinue, disabled, label = 'Continue', showChevron = true }) {
  return (
    <footer className="ob-step-footer">
      <p className={`ob-step-status ${statusClassName}`} aria-live="polite">
        {status}
      </p>
      <Button variant="primary" size="lg" onClick={onContinue} disabled={disabled}>
        {label}
        {showChevron && <ChevronRight className="h-4 w-4" />}
      </Button>
    </footer>
  )
}
