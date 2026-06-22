// src/features/account/components/Avatar.jsx
// Avatar: the user's photo if present, else their initials on the brand fill. referrerPolicy
// keeps provider-hosted images from leaking the referrer.

function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '·'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Avatar({ name, url, size = 78, fontSize }) {
  return (
    <div className="ff-acct-summary__avatar" style={{ width: size, height: size }}>
      <div className="ff-acct-summary__face" style={fontSize ? { fontSize } : undefined}>
        {url
          ? <img src={url} alt="" referrerPolicy="no-referrer" />
          : <span aria-hidden="true">{initials(name)}</span>}
      </div>
    </div>
  )
}
