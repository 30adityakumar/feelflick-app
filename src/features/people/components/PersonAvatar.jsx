// src/features/people/components/PersonAvatar.jsx
// Decorative identity avatar (the adjacent name carries identity, so alt=""). Renders the projected
// avatar image when present, falling back to a deterministic initial+colour circle on missing OR
// broken image. Never interactive, never a link (no public profile exists).

import { useState } from 'react'

export default function PersonAvatar({ url, initial, bg, size = 48 }) {
  const [broken, setBroken] = useState(false)
  const dim = { width: size, height: size, fontSize: Math.round(size * 0.42) }
  if (url && !broken) {
    return (
      <img
        className="ff-people-avatar"
        src={url}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        style={dim}
      />
    )
  }
  return (
    <span className="ff-people-avatar ff-people-avatar--initial" aria-hidden="true" style={{ ...dim, background: bg }}>
      {initial}
    </span>
  )
}
