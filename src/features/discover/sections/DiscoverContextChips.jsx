// src/features/discover/sections/DiscoverContextChips.jsx
// Descriptive chips of the currently explicit choices (mood / intention / time /
// company / energy). They describe the moment — they are NOT filters that open a
// catalogue. "Adjust" returns to the context stage. On narrow screens the row
// scrolls horizontally rather than hiding important context.

export default function DiscoverContextChips({ chips, onAdjust }) {
  if (!chips || chips.length === 0) return null
  return (
    <div className="ff-disc-chips" aria-label="Tonight’s details">
      <div className="ff-disc-chips__scroll">
        {chips.map((c) => (
          <span key={c.key} className="ff-disc-chip">
            <span className="ff-disc-chip__k">{c.label}</span>
            <span className="ff-disc-chip__v">{c.value}</span>
          </span>
        ))}
      </div>
      <button type="button" className="ff-disc-chips__adjust" onClick={onAdjust}>Adjust</button>
    </div>
  )
}
