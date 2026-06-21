// src/features/profile/dna/DnaSectionNav.jsx
// Sticky desktop section nav. Renders entries ONLY for eligible (present) sections. Keyboard
// accessible anchor links with deep-linkable section IDs; active-section state via a scroll
// observer; hidden on mobile via CSS. Does not duplicate AppShell navigation.

import { useEffect, useState } from 'react'

export default function DnaSectionNav({ items }) {
  const [active, setActive] = useState(items[0]?.id)
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean)
    if (els.length === 0) return undefined
    const obs = new IntersectionObserver((entries) => {
      const top = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (top) setActive(top.target.id)
    }, { rootMargin: '-30% 0px -60% 0px', threshold: [0, 0.2, 0.5] })
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [items])
  if (items.length < 2) return null
  return (
    <nav className="ff-dna-nav" aria-label="Cinematic DNA sections">
      <div className="ff-dna__shell ff-dna-nav__inner">
        {items.map((i) => (
          <a key={i.id} href={`#${i.id}`} className={i.id === active ? 'is-active' : undefined} aria-current={i.id === active ? 'true' : undefined}>{i.label}</a>
        ))}
      </div>
    </nav>
  )
}
