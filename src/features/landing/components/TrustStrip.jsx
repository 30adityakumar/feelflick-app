// src/features/landing/components/TrustStrip.jsx
import { TRUST } from '../data'

export default function TrustStrip() {
  return (
    <section className="ff-l-trust" aria-label="What you can rely on">
      <div className="ff-l-shell ff-l-trust-grid">
        {TRUST.map((t) => (
          <article key={t.title} className="ff-l-trust-item">
            <strong>{t.title}</strong>
            <p>{t.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
