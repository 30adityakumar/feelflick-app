// src/features/landing/components/ProductEntrances.jsx
// "How it works" — an editorial explanation of the three distinct ways people use
// FeelFlick (Discover / Home / Browse). Asymmetric two-column: a left introduction and
// a right ordered list of entrances. Non-interactive (no route links/buttons — Home is
// not anonymously reachable, so every row stays consistently explanatory). The
// destination is an editorial label, not a control. No authentication CTA here — the
// header, Hero, and final CTA already carry that.
import { ENTRANCES } from '../data'

export default function ProductEntrances() {
  return (
    <section className="ff-l-section ff-l-entrances" id="how-it-works" aria-labelledby="ff-l-entrances-h">
      <div className="ff-l-shell ff-l-entrances-grid">
        <div className="ff-l-entrances-intro">
          <p className="ff-l-eyebrow">How it works</p>
          <h2 id="ff-l-entrances-h" className="ff-l-entrances-h2">Start with the question you <em>actually have.</em></h2>
          <p className="ff-l-entrances-lead">
            Tonight, your taste, or a curiosity—FeelFlick keeps each path distinct instead
            of forcing every movie question into one feed.
          </p>
        </div>

        <ol className="ff-l-entrance-list">
          {ENTRANCES.map((e) => (
            <li key={e.n} className="ff-l-entrance">
              <p className="ff-l-entrance__meta">
                <span className="ff-l-entrance__n" aria-hidden="true">{e.n}</span>
                <span className="ff-l-entrance__dest">{e.destination}</span>
              </p>
              <h3 className="ff-l-entrance__title">{e.title}</h3>
              <p className="ff-l-entrance__example">{e.example}</p>
              <p className="ff-l-entrance__copy">{e.copy}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
