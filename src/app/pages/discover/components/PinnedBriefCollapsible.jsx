// src/app/pages/discover/components/PinnedBriefCollapsible.jsx
import { AnimatePresence, motion } from 'framer-motion'

import Button from '@/shared/ui/Button'

import PinnedBrief from './PinnedBrief'

/**
 * Collapsible version of PinnedBrief used on the results screen.
 * Collapsed: shows a single-line "Your brief · N criteria" with Refine toggle.
 * Expanded: full PinnedBrief + "Done refining" button.
 *
 * @param {{ answers: Record<string, any>, notes: string[], anchor: object|null,
 *           expanded: boolean, onToggle: () => void,
 *           onEdit: (questionId: string) => void,
 *           onRemoveNote: (index: number) => void,
 *           onClearAnchor: () => void }} props
 */
export default function PinnedBriefCollapsible({
  answers,
  notes,
  anchor,
  expanded,
  onToggle,
  onEdit,
  onRemoveNote,
  onClearAnchor,
}) {
  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== undefined,
  ).length

  return (
    <div>
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 border-b border-white/10"
        aria-expanded={expanded}
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
          Your brief · {answeredCount} criteria
        </span>
        <span className="text-xs text-purple-300">
          {expanded ? 'Collapse' : 'Refine'}
        </span>
      </button>

      {/* Expanded: full PinnedBrief */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-2 pb-4">
              <PinnedBrief
                answers={answers}
                notes={notes}
                anchor={anchor}
                onEdit={onEdit}
                onRemoveNote={onRemoveNote}
                onClearAnchor={onClearAnchor}
              />
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={onToggle}>
                  Done refining
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
