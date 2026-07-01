// Sticky, accessible profile tabs (role=tablist, roving tabindex, Arrow/Home/End).
// Same a11y contract as LandingTabs; panels are rendered by the parent with role=tabpanel.
import { useRef } from 'react'

export default function DnaTabs({ tabs, active, onChange, idBase = 'dna' }) {
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
    <nav className="dna-tabs" aria-label="Profile sections">
      <div className="dna__shell">
        <div className="dna-tablist" role="tablist" aria-label="Profile sections">
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
                className={`dna-tab${selected ? ' is-active' : ''}`}
                onClick={() => onChange(t.id)}
                onKeyDown={onKeyDown}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
