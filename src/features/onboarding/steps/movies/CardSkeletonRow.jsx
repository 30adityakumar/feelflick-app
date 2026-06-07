// Loading placeholder for the Suggestions row — staggered animate-pulse cards.
// Announced to assistive tech (role=status + aria-busy + sr-only label); the
// decorative boxes are aria-hidden and reduced-motion-safe.
export default function CardSkeletonRow() {
  return (
    <div className="flex gap-3 sm:gap-4 overflow-x-hidden" role="status" aria-busy="true">
      <span className="sr-only">Loading suggestions</span>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="shrink-0 w-28 sm:w-32 md:w-36 flex flex-col gap-1.5" aria-hidden="true">
          <div
            className="aspect-2/3 rounded-lg bg-white/4 animate-pulse motion-reduce:animate-none"
            style={{ animationDelay: `${i * 60}ms` }}
          />
          <div className="h-2.5 w-3/4 bg-white/4 rounded animate-pulse motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  )
}
