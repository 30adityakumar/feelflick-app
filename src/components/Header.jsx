import { useState } from 'react'

export default function Header({ userName, onTabChange, activeTab, onSignOut, onSearch }) {
  // You can manage "activeTab" in App.jsx and pass as prop, or manage here with useState.
  const [searchValue, setSearchValue] = useState('')

  // For mobile, you could add a hamburger state here

  // Main tab definitions
  const tabs = [
    { key: "movies", label: "Movies" },
    { key: "recommendations", label: "Recommendations" },
    { key: "watched", label: "Watched" },
  ]

  return (
    <header style={headerStyle}>
      {/* --- Left: Logo + Name + Nav --- */}
      <div style={leftStyle}>
        <img src="/logo.png" alt="FeelFlick" style={logoStyle} />
        <span style={siteNameStyle}>FeelFlick</span>
        <nav style={navStyle}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              style={{
                ...navLinkStyle,
                ...(activeTab === tab.key ? navLinkActiveStyle : {})
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      {/* --- Right: Search + Profile/Account --- */}
      <div style={rightStyle}>
        <form
          onSubmit={e => { e.preventDefault(); if (onSearch) onSearch(searchValue); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <input
            type="text"
            value={searchValue}
            placeholder="Search movies..."
            onChange={e => setSearchValue(e.target.value)}
            style={searchStyle}
          />
        </form>
        <div style={profileStyle}>
          <span style={{ marginRight: 8, fontWeight: 600 }}>{userName}</span>
          <button
            onClick={onSignOut}
            style={{
              background: 'rgba(254,146,69,0.9)',
              color: '#18406d',
              border: 'none',
              borderRadius: 6,
              fontWeight: 700,
              padding: '6px 16px',
              marginLeft: 4,
              cursor: 'pointer',
              fontSize: '0.95rem',
              boxShadow: '0 1px 8px #0002',
              transition: 'background 0.14s'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}

// --- STYLES (move to CSS if you prefer) ---

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'linear-gradient(90deg, #18406d 20%, #fe9245 100%)',
  padding: '0 32px',
  height: 72,
  color: '#fff',
  position: 'sticky',
  top: 0,
  zIndex: 99,
  boxShadow: '0 2px 16px #0002'
}

const leftStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 20
}

const logoStyle = {
  height: 42,
  width: 42,
  borderRadius: 11,
  marginRight: 10
}

const siteNameStyle = {
  fontSize: '2.1rem',
  fontWeight: 800,
  letterSpacing: '-1px',
  marginRight: 24,
  textShadow: '0 1px 6px #18406d44'
}

const navStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 5
}

const navLinkStyle = {
  color: '#fff',
  fontSize: '1.1rem',
  background: 'none',
  border: 'none',
  outline: 'none',
  marginRight: 8,
  padding: '7px 20px',
  borderRadius: 5,
  opacity: 0.88,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.15s, color 0.12s, opacity 0.12s'
}
const navLinkActiveStyle = {
  background: 'rgba(255,255,255,0.19)',
  color: '#fff',
  opacity: 1
}

const rightStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 18
}

const searchStyle = {
  background: 'rgba(24,22,36,0.18)',
  border: 'none',
  borderRadius: 6,
  padding: '8px 14px',
  color: '#fff',
  fontSize: '1rem',
  width: 170,
  outline: 'none'
}

const profileStyle = {
  background: 'rgba(24,22,36,0.10)',
  borderRadius: 19,
  padding: '6px 15px',
  fontWeight: 600,
  fontSize: '1rem',
  letterSpacing: '-0.5px',
  display: 'flex',
  alignItems: 'center',
  marginLeft: 8
}
