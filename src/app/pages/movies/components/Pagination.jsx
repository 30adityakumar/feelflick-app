// src/app/pages/movies/components/Pagination.jsx

/**
 * Pagination
 * - Simple Previous / Next control with clamped bounds
 * - Props: page, totalPages, onChange(nextPage), className?
 */
export default function Pagination({
  page = 1,
  totalPages = 1,
  onChange,
  className = '',
}) {
  const prevDisabled = page <= 1
  const nextDisabled = page >= totalPages

  const prev = () => {
    if (!prevDisabled) onChange?.(page - 1)
  }

  const next = () => {
    if (!nextDisabled) onChange?.(page + 1)
  }

  if (totalPages <= 1) return null

  return (
    <nav
      className={`inline-flex items-center gap-3 text-sm text-white/80 ${className}`}
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={prev}
        disabled={prevDisabled}
        className="px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs font-semibold hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>

      <span className="text-xs sm:text-sm text-white/60">
        Page <span className="font-semibold text-white/90">{page}</span> of{' '}
        <span className="font-semibold text-white/90">{totalPages}</span>
      </span>

      <button
        type="button"
        onClick={next}
        disabled={nextDisabled}
        className="px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs font-semibold hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </nav>
  )
}
