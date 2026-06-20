// src/features/home/components/HomeHeroControls.jsx
// Hero carousel navigation: edge prev/next arrows + compact position dots.
// Presentational — all state lives in HomeHero. Rendered only when there is
// more than one standout to move between. Every control is a real, labelled,
// keyboard-operable button.

import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function HomeHeroControls({ count, index, onPrev, onNext, onGoTo }) {
  if (count <= 1) return null
  return (
    <>
      <button type="button" className="ff-hero__arrow ff-hero__arrow--prev" aria-label="Previous featured film" onClick={onPrev}>
        <ChevronLeft className="h-[22px] w-[22px]" aria-hidden="true" />
      </button>
      <button type="button" className="ff-hero__arrow ff-hero__arrow--next" aria-label="Next featured film" onClick={onNext}>
        <ChevronRight className="h-[22px] w-[22px]" aria-hidden="true" />
      </button>
      <div className="ff-hero__dots" role="group" aria-label="Featured films">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            type="button"
            aria-current={i === index ? 'true' : undefined}
            aria-label={`Show featured film ${i + 1} of ${count}`}
            className={`ff-hero__dot${i === index ? ' is-active' : ''}`}
            onClick={() => onGoTo(i)}
          />
        ))}
      </div>
    </>
  )
}
