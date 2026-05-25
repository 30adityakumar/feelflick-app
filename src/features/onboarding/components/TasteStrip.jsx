// src/features/onboarding/components/TasteStrip.jsx
// Tiny "profile building" line that grows with each step's signal.

export default function TasteStrip({ moods, genres, films, ratings }) {
  const m = moods.length
  const g = genres.length
  const f = films.length
  const r = Object.keys(ratings || {}).length

  if (m + g + f + r === 0) return null

  return (
    <div className="flex-none px-5 pt-2 sm:px-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-white/40">
      <span>Profile building</span>
      <span className="flex-1 h-px bg-gradient-to-r from-purple-500/30 to-transparent" />
      {m > 0 && <span className="text-purple-300/85">{m} mood{m === 1 ? '' : 's'}</span>}
      {g > 0 && <span className="text-purple-300/85">· {g} genre{g === 1 ? '' : 's'}</span>}
      {f > 0 && <span className="text-pink-300/85">· {f} film{f === 1 ? '' : 's'}</span>}
      {r > 0 && <span className="text-pink-300/85">· {r} rated</span>}
    </div>
  )
}
