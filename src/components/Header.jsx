import { useState } from 'react'

export default function Header({
  userName, onTabChange, activeTab, onSignOut, onMyAccount
}) {
  const [showDropdown, setShowDropdown] = useState(false)

  // Add "home" tab, set as default
  const tabs = [
    { key: "home", label: "Home" },
    { key: "movies", label: "Movies" },
    { key: "recommendations", label: "Recommendations" },
    { key: "watched", label: "Watched" }
  ]

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'linear-gradient(90deg, #18406d 20%, #fe9245 100%)',
      padding: '0 32px', height: 54, color: '#fff', position: 'sticky',
      top: 0, zIndex: 99, boxShadow: '0 1px 8px #0001'
    }}>
      {/* Left: Logo + Site Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <img src="/logo.png" alt="FeelFlick" style={{ height: 32, width: 32, borderRadius: 8, marginRight: 3 }} />
        <span style={{
          fontSize: '1.16rem', fontWeight: 800, letterSpacing: '-0.5px',
          marginRight: 0, marginTop: 1
        }}>FeelFlick</span>
      </div>

      {/* Right: Menu + Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <nav style={{ display: 'flex', gap: 2, marginRight: 12 }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              style={{
                color: '#fff',
                fontSize: '0.98rem',
                background: activeTab === tab.key ? 'rgba(24,64,109,0.18)' : 'none',
                border: 'none', outline: 'none',
                fontWeight: activeTab === tab.key ? 800 : 600,
                padding: '4.5px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                opacity: activeTab === tab.key ? 1 : 0.89,
                transition: 'background 0.12s, opacity 0.12s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        {/* Account Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            style={{
              background: 'rgba(24,22,36,0.11)',
              borderRadius: 16,
              border: 'none',
              fontWeight: 700,
              padding: '5px 15px',
              color: '#fff',
              fontSize: '0.98rem',
              cursor: 'pointer'
            }}
            onClick={() => setShowDropdown(v => !v)}
          >
            {userName} <span style={{ fontSize: '0.85em', opacity: 0.7 }}>▼</span>
          </button>
          {showDropdown && (
            <div style={{
              position: 'absolute', right: 0, top: 34,
              background: '#202a3a', color: '#fff',
              borderRadius: 10, boxShadow: '0 8px 32px #0006',
              minWidth: 150, zIndex: 10, overflow: 'hidden'
            }}>
              <button
                onClick={() => { setShowDropdown(false); if (onMyAccount) onMyAccount(); }}
                style={dropdownItem}
              >My Account</button>
              <button
                onClick={() => { setShowDropdown(false); onSignOut(); }}
                style={{ ...dropdownItem, color: "#ffae41", fontWeight: 800 }}
              >Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
const dropdownItem = {
  display: 'block',
  width: '100%',
  background: 'none',
  border: 'none',
  textAlign: 'left',
  padding: '12px 18px',
  fontSize: '0.99rem',
  color: '#fff',
  cursor: 'pointer',
  transition: 'background 0.13s'
}
