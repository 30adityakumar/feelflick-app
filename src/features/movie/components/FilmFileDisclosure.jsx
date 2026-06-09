// src/features/movie/components/FilmFileDisclosure.jsx
// F5.5 — an accessible progressive-disclosure primitive for the Film File's deeper
// evidence + reference content. Built on native <details>/<summary> so keyboard
// (Enter/Space) toggle, focus, and expanded/collapsed semantics come for free.
//
// • the summary is the heading-equivalent label, ≥44px, with a visible focus ring
// • the chevron indicator is decorative (aria-hidden); its small CSS rotation is
//   neutralised under prefers-reduced-motion by the global reset
// • content stays in normal document order; no height animation, no scroll-on-open,
//   no focus movement on toggle, no persistence
// • the open state is owned internally (synced via onToggle) so a parent re-render
//   can never collapse a disclosure the user opened.

import { useState } from 'react'

/**
 * @param {object} props
 * @param {string} [props.eyebrow]    small kicker above the heading
 * @param {string}  props.heading     the disclosure label (heading-equivalent)
 * @param {string} [props.copy]       one-line supporting copy
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.defaultOpen=false]
 * @param {string} [props.className]
 * @param {string} [props.id]
 */
export default function FilmFileDisclosure({ eyebrow, heading, copy, children, defaultOpen = false, className = '', id }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className={`ff-movie-section ff-disclosure ${className}`.trim()} id={id}>
      <details
        className="ff-disclosure__details"
        open={open}
        onToggle={(e) => { if (e.currentTarget.open !== open) setOpen(e.currentTarget.open) }}
      >
        <summary className="ff-disclosure__summary">
          <span className="ff-disclosure__label">
            {eyebrow && <span className="ff-disclosure__eyebrow">{eyebrow}</span>}
            <span className="ff-disclosure__heading">{heading}</span>
            {copy && <span className="ff-disclosure__copy">{copy}</span>}
          </span>
          <span className="ff-disclosure__chevron" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </span>
        </summary>
        <div className="ff-disclosure__content">{children}</div>
      </details>
    </section>
  )
}
