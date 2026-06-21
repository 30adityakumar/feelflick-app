// src/features/discover/sections/DiscoverCinematicScrim.jsx
// The left→right + bottom scrim that grounds the cinematic result: it darkens the
// left side enough for AA text contrast over the artwork and fades the art into the
// flat Ink canvas. Always rendered (it carries the composition even when no artwork
// exists). Decorative → aria-hidden.

export default function DiscoverCinematicScrim() {
  return <div className="ff-disc-result__scrim" aria-hidden="true" />
}
