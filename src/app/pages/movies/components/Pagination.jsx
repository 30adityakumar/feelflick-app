/**
 * Pagination
 * - Dumb pager with Prev/Next + clamped bounds
 * - Props: page (number), totalPages (number), onChange(nextPage), className?
 */
export default function Pagination({ page = 1, totalPages = 1, onChange, className = '' }) {
  const prev = () => onChange?.(Math.max(1, page - 1))
  const next = () => onChange?.(Math.min(totalPages, page + 1))

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <button
        onClick={prev}
        disabled={page <= 1}
        className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-white/90 disabled:opacity-40"
      >
        Prev
      </button>
      <div className="text-xs text-white/70">
        Page {page} / {totalPages}
      </div>
      <button
        onClick={next}
        disabled={page >= totalPages}
        className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-white/90 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}