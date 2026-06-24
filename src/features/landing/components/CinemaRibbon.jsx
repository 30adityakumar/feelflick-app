// src/features/landing/components/CinemaRibbon.jsx
// Decorative hero poster ribbon. Entirely aria-hidden; every poster alt=""; static
// ordering; centre poster (index 2) is the LCP candidate (eager), the rest lazy.
import { LANDING_POSTERS } from '../data'
import { Poster } from '../primitives'

export default function CinemaRibbon() {
  return (
    <div className="ff-l-ribbon" aria-hidden="true">
      {LANDING_POSTERS.map((p, i) => (
        <div key={p.path} className={`ff-l-ribbon__poster ff-l-ribbon__poster--${i + 1}`}>
          <Poster path={p.path} title={p.title} decorative eager={i === 2} />
        </div>
      ))}
    </div>
  )
}
