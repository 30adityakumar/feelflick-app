// src/features/onboarding/components/TasteStrip.jsx
// Tiny "profile building" line that grows with each step's signal. Each tally
// carries an explicit category LABEL (Mood / Genre / Film / Rated) so the
// distinction is not conveyed by purple/pink color alone — a non-color
// affordance. (The fuller DNA-strip fusion is a later phase; this stays compact.)

export default function TasteStrip({ moods, genres, films, ratings }) {
  const counts = [
    { label: 'Mood',  n: moods.length },
    { label: 'Genre', n: genres.length },
    { label: 'Film',  n: films.length },
    { label: 'Rated', n: Object.keys(ratings || {}).length },
  ].filter(c => c.n > 0)

  if (counts.length === 0) return null

  return (
    <div className="flex-none px-5 pt-2 sm:px-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-white/40">
      <span>Profile building</span>
      <span className="flex-1 h-px bg-linear-to-r from-purple-500/30 to-transparent" />
      <span className="flex items-center gap-2.5">
        {counts.map(c => (
          <span key={c.label} className="flex items-center gap-1">
            <span className="text-white/45">{c.label}</span>
            <span className="text-white/75 tabular-nums">{c.n}</span>
          </span>
        ))}
      </span>
    </div>
  )
}
