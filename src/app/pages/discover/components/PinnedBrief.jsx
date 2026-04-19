// src/app/pages/discover/components/PinnedBrief.jsx
import { QUESTION_SET } from '@/app/pages/discover/questions'

/**
 * Renders the stacked list of answered brief items.
 * Each row is tappable to re-activate that question and clear subsequent answers.
 *
 * @param {{ answers: Record<string, any>, notes: string[], anchor: object|null,
 *           onEdit: (questionId: string) => void, onRemoveNote: (index: number) => void,
 *           onClearAnchor: () => void }} props
 */
export default function PinnedBrief({ answers, notes, anchor, onEdit, onRemoveNote, onClearAnchor }) {
  // Only show questions that have been answered
  const answeredQuestions = QUESTION_SET.filter((q) => answers[q.id] !== undefined)

  if (answeredQuestions.length === 0 && notes.length === 0 && !anchor) return null

  /** Find the display label for a question's selected value. */
  function getDisplayLabel(question, value) {
    const opt = question.options.find((o) => o.value === value)
    return opt?.label ?? String(value)
  }

  return (
    <div className="mb-2">
      {answeredQuestions.map((question, i) => (
        <button
          key={question.id}
          type="button"
          onClick={() => onEdit(question.id)}
          className="group w-full grid grid-cols-[2rem_8rem_1fr_auto] items-center gap-4 py-3 border-b border-white/10 text-left hover:bg-white/[0.02] transition-colors"
          aria-label={`Edit ${question.label}: ${getDisplayLabel(question, answers[question.id])}`}
        >
          <span className="text-xs font-light italic text-purple-400/60" style={{ fontFamily: 'var(--font-display, serif)' }}>
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
            {question.label}
          </span>
          <span className="text-sm text-white/90">
            {getDisplayLabel(question, answers[question.id])}
          </span>
          <span className="text-[10px] text-white/40 group-hover:text-white/60 transition-colors">
            edit
          </span>
        </button>
      ))}

      {/* Anchor row */}
      {anchor && (
        <div className="grid grid-cols-[2rem_8rem_1fr_auto] items-center gap-4 py-3 border-b border-white/10">
          <span className="text-xs font-light italic text-purple-400/60" style={{ fontFamily: 'var(--font-display, serif)' }}>
            --
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
            ANCHOR
          </span>
          <span className="text-sm text-white/90">
            {anchor.title} {anchor.year && `(${anchor.year})`}
          </span>
          <button
            type="button"
            onClick={onClearAnchor}
            className="text-[10px] text-white/40 hover:text-white/60 transition-colors"
            aria-label="Remove anchor film"
          >
            x
          </button>
        </div>
      )}

      {/* Notes section */}
      {notes.length > 0 && (
        <>
          <div className="grid grid-cols-[2rem_8rem_1fr_auto] items-center gap-4 py-3 border-b border-white/10">
            <span />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
              NOTES
            </span>
            <span className="text-[10px] text-white/30">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </span>
            <span />
          </div>
          {notes.map((note, i) => (
            <div
              key={i}
              className="grid grid-cols-[2rem_8rem_1fr_auto] items-center gap-4 py-2 border-b border-white/[0.05]"
            >
              <span />
              <span />
              <span className="text-xs text-white/60 italic truncate">{note}</span>
              <button
                type="button"
                onClick={() => onRemoveNote(i)}
                className="text-[10px] text-white/40 hover:text-white/60 transition-colors"
                aria-label={`Remove note: ${note}`}
              >
                x
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
