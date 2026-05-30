import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

/**
 * Canonical section header for carousel rows and grouped content.
 * Pattern: purple bar + title + optional "See all" link.
 *
 * @param {string} title
 * @param {string} [subtitle]
 * @param {string} [seeAllTo] - If provided, renders a "See all" link
 * @param {string} [eyebrow] - Optional uppercase label above title
 */
export default function SectionHeader({ title, subtitle, seeAllTo, eyebrow, className = '' }) {
  return (
    <div className={`flex items-end justify-between gap-4 mb-3 ${className}`}>
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-widest text-purple-400/60 mb-1">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-2.5">
          <div className="w-[3px] h-5 rounded-full bg-linear-to-b from-purple-400 to-pink-500 shrink-0" />
          <h2 className="text-[1.05rem] sm:text-[1.15rem] font-bold text-white tracking-tight truncate">{title}</h2>
        </div>
        {subtitle && (
          <p className="text-xs text-white/60 mt-1 ml-3">{subtitle}</p>
        )}
      </div>
      {seeAllTo && (
        <Link
          to={seeAllTo}
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-white/60 hover:text-white transition-colors shrink-0"
        >
          See all <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  )
}
