// src/features/landing/primitives.jsx
// Landing shared primitives for the redesign: a safe Poster (deterministic React
// fallback — no innerHTML / data-URI string interpolation) and an accessible
// LandingTabs (role=tablist, roving tabindex, Arrow/Home/End, automatic activation).
import { useRef, useState } from 'react'
import { tmdbPoster } from './data'

/**
 * Poster image with a deterministic, sanitized React fallback (no innerHTML).
 * @param {string} path  TMDB poster path (e.g. "/abc.jpg")
 * @param {string} title used for the fallback label + alt (unless decorative)
 * @param {string} [size] TMDB size segment (default w342)
 * @param {boolean} [eager] load eagerly (LCP candidate) — otherwise lazy
 * @param {boolean} [decorative] aria-hidden + alt="" (e.g. the hero ribbon)
 * @param {string} [className]
 */
export function Poster({ path, title, size = 'w342', eager = false, decorative = false, className }) {
  const [failed, setFailed] = useState(false)
  if (failed || !path) {
    return (
      <div className={`ff-l-poster-fallback${className ? ` ${className}` : ''}`} aria-hidden={decorative ? 'true' : undefined}>
        {!decorative && <span className="ff-l-poster-fallback__t">{title}</span>}
      </div>
    )
  }
  return (
    <img
      src={tmdbPoster(path, size)}
      alt={decorative ? '' : `${title} poster`}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      // eslint-disable-next-line react/no-unknown-property
      fetchpriority={eager ? 'high' : undefined}
      decoding="async"
      width="342"
      height="513"
      onError={() => setFailed(true)}
    />
  )
}

/**
 * Accessible tablist. The parent renders the tabpanels (role="tabpanel",
 * id={`${idBase}-panel-${active}`}, aria-labelledby={`${idBase}-tab-${active}`}).
 * @param {string} label  accessible name for the tablist
 * @param {Array<{id:string,label:string}>} tabs
 * @param {string} active  active tab id
 * @param {(id:string)=>void} onChange
 * @param {string} idBase  unique id prefix
 */
export function LandingTabs({ label, tabs, active, onChange, idBase }) {
  const refs = useRef({})
  const idx = Math.max(0, tabs.findIndex((t) => t.id === active))

  const onKeyDown = (e) => {
    let next = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % tabs.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    if (next == null) return
    e.preventDefault()
    const id = tabs[next].id
    onChange(id)
    refs.current[id]?.focus()
  }

  return (
    <div className="ff-l-tablist" role="tablist" aria-label={label}>
      {tabs.map((t) => {
        const selected = t.id === active
        return (
          <button
            key={t.id}
            ref={(el) => { refs.current[t.id] = el }}
            type="button"
            role="tab"
            id={`${idBase}-tab-${t.id}`}
            aria-selected={selected}
            aria-controls={`${idBase}-panel-${t.id}`}
            tabIndex={selected ? 0 : -1}
            className={`ff-l-tab${selected ? ' is-active' : ''}`}
            onClick={() => onChange(t.id)}
            onKeyDown={onKeyDown}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
