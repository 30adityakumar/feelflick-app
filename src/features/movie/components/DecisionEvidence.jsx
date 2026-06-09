// src/features/movie/components/DecisionEvidence.jsx
// F5.5 — consolidates the SUPPORTING recommendation evidence (Why For You, the
// generated FeelFlick mood profile, and the generated FeelFlick impressions) behind
// ONE collapsed-by-default disclosure, so the decision path (case → synopsis →
// providers → your take) stays short. The PrimaryCase already gives the concise
// case; this is the "go deeper" layer.
//
// It changes PLACEMENT only — the child components keep their exact F5.3 data,
// provenance, generated-origin disclosures, wording, fit-band-free presentation, and
// hover linkage. No fit band, no second case headline, no copy change here.

import FilmFileDisclosure from './FilmFileDisclosure'
import { WhyForYou, MoodRadar } from '../sections-top'
import ViewerNotes from '../ViewerNotes'

const hasItems = (v) => Array.isArray(v) && v.length > 0

/**
 * @param {object} props
 * @param {object} props.whyHeader            { eyebrow, headline, rationale }
 * @param {Array}  props.whyReasons
 * @param {function} props.onHoverReason
 * @param {string|null} props.highlightReasonId
 * @param {Array|null} props.radarAxes
 * @param {string|null} props.highlightMood
 * @param {function} props.onHoverAxis
 * @param {Array|null} props.viewerNotes
 */
export default function DecisionEvidence({
  whyHeader, whyReasons, onHoverReason, highlightReasonId,
  radarAxes, highlightMood, onHoverAxis, viewerNotes,
}) {
  const hasWhy = hasItems(whyReasons)
  // MoodRadar self-hides below 3 axes — mirror that so the disclosure never wraps an
  // empty radar slot.
  const hasRadar = Array.isArray(radarAxes) && radarAxes.length >= 3
  const hasNotes = hasItems(viewerNotes)

  // Render nothing when there is no supporting evidence at all — never an empty
  // disclosure, a blank summary, or a "no evidence" placeholder.
  if (!hasWhy && !hasRadar && !hasNotes) return null

  return (
    <FilmFileDisclosure
      className="ff-movie-decision-evidence"
      heading="Why this film"
      copy="See the signals and tone behind FeelFlick’s recommendation."
      defaultOpen={false}
    >
      {hasWhy && (
        <WhyForYou
          eyebrow={whyHeader.eyebrow}
          headline={whyHeader.headline}
          rationale={whyHeader.rationale}
          reasons={whyReasons}
          onHoverReason={onHoverReason}
          highlightReasonId={highlightReasonId}
        />
      )}
      {hasRadar && (
        <MoodRadar axes={radarAxes} highlightMood={highlightMood} onHoverAxis={onHoverAxis} />
      )}
      {hasNotes && <ViewerNotes notes={viewerNotes} />}
    </FilmFileDisclosure>
  )
}
