import BackButton from './BackButton'

/**
 * Shared onboarding step header: optional back button → kicker → display
 * headline → subcopy. The kicker + headline typography is identical across the
 * adopting steps (MoodStep / GenresStep / MoviesStep) and is baked here; the
 * bits that legitimately vary per step are props, so adoption is render-faithful:
 *
 * @param {object}   props
 * @param {string}   props.className         — header wrapper class (each step's exact padding)
 * @param {function} [props.onBack]          — when present, renders <BackButton>; omit for Step 1
 * @param {React.ReactNode} props.kicker      — kicker text (e.g. "Genres · 2 of 4")
 * @param {React.ReactNode} props.children    — headline content (keeps each step's exact <em> accent)
 * @param {React.ReactNode} [props.subcopy]   — description paragraph content
 * @param {string}   [props.subcopyClassName] — subcopy <p> class (varies: text-white/55+max-w-xl vs /60)
 */
export default function StepHeader({ className, onBack, kicker, children, subcopy, subcopyClassName }) {
  return (
    <div className={className}>
      {onBack && <BackButton onClick={onBack} />}
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-purple-400/85 mb-2.5 sm:mb-3">
        {kicker}
      </p>
      <h2
        className="ob-display text-[32px] sm:text-4xl md:text-5xl font-normal text-white leading-[1.05]"
        style={{ textWrap: 'balance' }}
      >
        {children}
      </h2>
      {subcopy != null && <p className={subcopyClassName}>{subcopy}</p>}
    </div>
  )
}
