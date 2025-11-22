// src/app/pages/browse/Pagination.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const canGoPrev = currentPage > 1
  const canGoNext = currentPage < totalPages

  return (
    <div className="flex items-center justify-center gap-4 mt-12">
      <button
        disabled={!canGoPrev}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold transition-all active:scale-95"
      >
        <ChevronLeft className="h-5 w-5" />
        Previous
      </button>

      <span className="text-white/70 text-sm font-medium">
        Page {currentPage} of {totalPages}
      </span>

      <button
        disabled={!canGoNext}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold transition-all active:scale-95"
      >
        Next
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}
