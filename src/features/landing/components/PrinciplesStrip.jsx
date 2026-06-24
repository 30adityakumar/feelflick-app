// src/features/landing/components/PrinciplesStrip.jsx
import { PRINCIPLES } from '../data'

export default function PrinciplesStrip() {
  return (
    <section className="ff-l-principles" aria-label="What FeelFlick does">
      <div className="ff-l-shell ff-l-principles-grid">
        {PRINCIPLES.map((p) => (
          <article key={p.title} className="ff-l-principle">
            <strong>{p.title}</strong>
            <p>{p.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
