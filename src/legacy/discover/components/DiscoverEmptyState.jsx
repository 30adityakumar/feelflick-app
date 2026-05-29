/**
 * @param {{ onTryAnotherMood: () => void, onBrowseAll: () => void }} props
 */
export default function DiscoverEmptyState({ onTryAnotherMood, onBrowseAll }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-lg w-full">
        <h2
          className="font-black text-white tracking-tight leading-tight"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
        >
          We didn&apos;t find anything that fits.
        </h2>

        <p className="mt-4 text-white/60 max-w-prose mx-auto leading-relaxed">
          This combination is rare in the catalog right now. A different mood usually lands.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onTryAnotherMood}
            className="rounded-full px-6 py-3 font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20 hover:brightness-110 hover:scale-[1.02] active:scale-[0.97] transition-all duration-200"
          >
            Try another mood
          </button>
          <button
            type="button"
            onClick={onBrowseAll}
            className="rounded-full px-6 py-3 font-medium text-white/80 border border-white/15 hover:border-white/30 hover:bg-white/5 transition-all duration-200"
          >
            Browse all films
          </button>
        </div>

        <a
          href="mailto:hello@feelflick.com?subject=Feelflick%20feedback%20%E2%80%94%20discover%20empty%20state"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          Tell us what&apos;s missing →
        </a>
      </div>
    </div>
  )
}
