// src/features/profile/dna/CinematicArtworkSlices.jsx
// Atmospheric hero artwork: up to three sliced posters drawn deterministically from the user's
// real top-rated films (the 5★ mixtape). Decorative + aria-hidden — NOT a ranked "favourite
// films" claim. Deduped, stable order, safe when art is missing (renders fewer / a flat field).

export default function CinematicArtworkSlices({ mixtape = [] }) {
  const seen = new Set()
  const posters = []
  for (const m of mixtape) {
    if (m?.poster && !seen.has(m.poster)) { seen.add(m.poster); posters.push(m.poster) }
    if (posters.length === 3) break
  }
  return (
    <div className="ff-dna-hero__art" aria-hidden="true">
      {posters.map((p, i) => (
        <div key={i} className="ff-dna-slice" style={{ backgroundImage: `url("${p}")` }} />
      ))}
    </div>
  )
}
