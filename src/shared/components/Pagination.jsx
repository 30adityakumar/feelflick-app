// src/shared/components/Pagination.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react'

function pageRange(current, total) {
  const pages = []
  const delta = 2 // pages on each side of current

  const left  = Math.max(2, current - delta)
  const right = Math.min(total - 1, current + delta)

  pages.push(1)
  if (left > 2)       pages.push('...')
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < total - 1) pages.push('...')
  if (total > 1)      pages.push(total)

  return pages
}

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = pageRange(currentPage, totalPages)

  return (
    <div className="mt-12 flex items-center justify-center gap-1">
      {/* Prev */}
      <button
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/6 text-white/70 transition-all hover:bg-white/12 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center text-[0.8rem] text-white/40">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => p !== currentPage && onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === currentPage ? 'page' : undefined}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-[0.82rem] font-medium transition-all ${
                p === currentPage
                  ? 'font-bold'
                  : 'border border-white/12 bg-white/6 text-white/60 hover:bg-white/12 hover:text-white'
              }`}
              style={
                p === currentPage
                  ? {
                      background: 'var(--color-action-primary-fill, #efe7d7)',
                      color: 'var(--color-action-primary-text, #221b13)',
                    }
                  : undefined
              }
            >
              {p}
            </button>
          )
        )}
      </div>

      {/* Next */}
      <button
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/6 text-white/70 transition-all hover:bg-white/12 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
