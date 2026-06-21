// src/features/discover/sections/DiscoverResultBackdrop.jsx
// The blurred, desaturated full-stage backdrop behind the cinematic result — the
// same adapted poster artwork as the foreground art plane, heavily blurred so the
// film's colour fills the whole field without competing with the title. Decorative →
// aria-hidden. Renders nothing when no poster exists (honest missing-art).

import { posterArtwork } from './DiscoverArtworkLayer'

export default function DiscoverResultBackdrop({ film }) {
  const url = posterArtwork(film)
  if (!url) return null
  return <div className="ff-disc-result__backdrop" aria-hidden="true" style={{ backgroundImage: `url("${url}")` }} />
}
