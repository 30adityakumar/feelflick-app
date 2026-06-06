import { ChevronLeft } from 'lucide-react'

// Onboarding step "Back" affordance. Markup is identical across GenresStep,
// MoviesStep, and RatingStep; this is the single source. Step 1 (MoodStep) has
// no back button, so it simply doesn't render one.
export default function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-3 sm:mb-4 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    >
      <ChevronLeft className="h-4 w-4" />
      Back
    </button>
  )
}
