// Loading placeholder for the Suggestions row — staggered animate-pulse cards.
export default function CardSkeletonRow() {
  return (
    <div className="flex gap-3 sm:gap-4 overflow-x-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="shrink-0 w-28 sm:w-32 md:w-36 flex flex-col gap-1.5">
          <div
            className="aspect-2/3 rounded-lg bg-white/4 animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          />
          <div className="h-2.5 w-3/4 bg-white/4 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}
