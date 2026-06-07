// Loading placeholder for the Suggestions grid — staggered animate-pulse cards
// laid out on the SAME grid recipe as the real cards (no CLS when they swap).
// Announced to assistive tech (role=status + aria-busy + sr-only label); the
// decorative boxes are aria-hidden and reduced-motion-safe.
export default function CardSkeletonRow() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading suggestions</span>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div
              className="aspect-2/3 rounded-lg bg-white/4 animate-pulse motion-reduce:animate-none"
              style={{ animationDelay: `${i * 60}ms` }}
            />
            <div className="h-2.5 w-3/4 bg-white/4 rounded animate-pulse motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    </div>
  )
}
