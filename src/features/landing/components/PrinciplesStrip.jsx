// src/features/landing/components/PrinciplesStrip.jsx
// A concise three-principle manifesto bridging the cinematic Hero and the detailed
// "How it works" content. Ordered list (the principles are numbered) — the <ol> carries
// the real position semantics, so the visible 01/02/03 markers are decorative
// (aria-hidden) and not announced twice. One visually-hidden section heading plus a real
// heading per principle keeps the heading order logical after the Hero's h1.
import { PRINCIPLES } from '../data'

export default function PrinciplesStrip() {
  return (
    <section className="ff-l-principles" aria-labelledby="ff-l-principles-h">
      <h2 id="ff-l-principles-h" className="ff-l-vh">What makes FeelFlick different</h2>
      <ol className="ff-l-shell ff-l-principles-grid">
        {PRINCIPLES.map((p, i) => (
          <li key={p.title} className="ff-l-principle">
            <span className="ff-l-principle__n" aria-hidden="true">{`0${i + 1}`}</span>
            <h3 className="ff-l-principle__title">{p.title}</h3>
            <p className="ff-l-principle__body">{p.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
