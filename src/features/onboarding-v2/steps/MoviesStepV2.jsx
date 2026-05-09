// src/features/onboarding-v2/steps/MoviesStepV2.jsx
// Reuses the legacy MoviesStep wholesale (TMDB search + suggestions) — wraps with the v2 chrome
// (eyebrow + Outfit headline). Header copy + back button still come from the legacy file.
//
// Why wrap, not fork: MoviesStep contains the live TMDB search, debounce, dropdown, and Supabase
// pool fetch — that's substantial logic we don't want to maintain twice. The visual treatment
// inside still uses purple/pink + gradient buttons, which is consistent with v2's palette.

import MoviesStepLegacy from '@/features/onboarding/steps/MoviesStep'

export default function MoviesStepV2(props) {
  return <MoviesStepLegacy {...props} />
}
