// src/features/discover/sections/DiscoverArtworkLayer.jsx
// The primary cinematic artwork plane — a large image field anchored to the right
// of the result stage, masked into the dark left side. The normalized Discover film
// exposes only a portrait `poster` (TMDB w500; no backdrop/wide-still field), so we
// adapt the poster: upgraded to a higher-resolution variant where the TMDB size
// segment is present, cropped with `cover` and an intentional centre position, never
// stretched. Decorative → aria-hidden. Renders nothing when no poster exists (honest
// missing-art: the scrim alone then carries the composition).

// Pure: portrait poster → highest usable artwork URL.
//   • real TMDB poster  → upgrade /w500/ (or w185/w342/w780) to /w1280/
//   • already-sized/other URL (fixtures, fallback) → use as-is
//   • no poster          → null (caller renders no art layer)
export function posterArtwork(film) {
  const p = film?.poster
  if (!p || typeof p !== 'string') return null
  return p.replace(/\/w(92|154|185|342|500|780)\//, '/w1280/')
}

export default function DiscoverArtworkLayer({ film }) {
  const url = posterArtwork(film)
  if (!url) return null
  return <div className="ff-disc-result__art" aria-hidden="true" style={{ backgroundImage: `url("${url}")` }} />
}
