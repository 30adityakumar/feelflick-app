import './DecisionState.css'

/**
 * DecisionMarker — the ivory-only selected/committed supplementary marker (Stage 1).
 *
 * A 7px projection-ivory (`--ts-focus` #f3ecdf) dot inside a permanently reserved
 * 14px slot, so toggling `active` causes ZERO layout shift. No rose, purple, pink,
 * gradient, glow, shadow, pulse, animation, or contextual color. There is no
 * `--decision-signal` color token — the marker reuses the projection-ivory role.
 *
 * IMPORTANT — this marker is NOT sufficient on its own. It is a supplementary
 * visual cue and is `aria-hidden`. The OWNING component MUST also provide:
 *   1. the semantic state (e.g. `aria-pressed` / `aria-selected` / `checked` /
 *      `role="status"` text), and
 *   2. at least two non-color cues (changed label, check/bookmark icon, neutral
 *      fill or border, status text, stable position).
 * Pass `srLabel` to add screen-reader-only state text as one of those cues.
 *
 * @param {object} props
 * @param {boolean} [props.active=false]
 * @param {string} [props.srLabel] optional screen-reader-only state text (e.g. "Selected")
 * @param {string} [props.className]
 */
export default function DecisionMarker({ active = false, srLabel, className = '', ...props }) {
  return (
    <>
      <span
        className={`ts-decision-marker${className ? ` ${className}` : ''}`}
        data-active={active ? 'true' : undefined}
        aria-hidden="true"
        {...props}
      />
      {srLabel && active ? <span className="ts-sr-only">{srLabel}</span> : null}
    </>
  )
}
