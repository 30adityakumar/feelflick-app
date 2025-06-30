import { useState } from 'react'

export default function Header({
  userName, onTabChange, activeTab, onSignOut, onSearch, onMyAccount
}) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const tabs = [
    { key: "movies", label: "Movies" },
    { key: "recommendations", label: "Recommendations" },
    { key: "watched", label: "Watched" }
  ]

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'linear-gradient(90deg, #18406d 20%, #fe9245 100%)',
      padding: '0 32px',
      height: 60,
      color: '#fff',
      position: 'sticky', top: 0, zIndex: 99, boxShadow: '0 1px 8px #0001'
    }}>
      {/* Left: Logo + Site Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <img src="/logo.png" alt="FeelFlick" style={{ height: 38, width: 38, borderRadius: 9, marginRight: 5 }} />
        <span style={{
          fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px',
          marginRight: 20, marginTop: 1
        }}>FeelFlick</span>
        {/* Menu */}
        <nav style={{ display: 'flex', gap: 6 }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              style={{
                color: '#fff',
                fontSize: '1.06rem',
                background: activeTab === tab.key ? 'rgba(24,64,109,0.18)' : 'none',
                border: 'none', outline: 'none',
                fontWeight: 700,
                padding: '7px 17px',
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
      </div>

      {/* Right: Search + Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <form
          onSubmit={e => { e.preventDefault(); if (onSearch) onSearch(searchValue); }}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <input
            type="text"
            value={searchValue}
            placeholder="Search movies..."
            onChange={e => setSearchValue(e.target.value)}
            style={{
              background: 'rgba(24,22,36,0.18)',
              border: 'none',
              borderRadius: 5,
              padding: '6px 13px',
              color: '#fff',
              fontSize: '1rem',
              width: 140,
              outline: 'none'
            }}
          />
        </form>
        {/* Account Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            style={{
              background: 'rgba(24,22,36,0.10)',
              borderRadius: 16,
              border: 'none',
              fontWeight: 700,
              padding: '6px 18px',
              color: '#fff',
              fontSize: '1rem',
              marginRight: 2,
              cursor: 'pointer',
              boxShadow: '0 1px 8px #0002'
            }}
            onClick={() => setShowDropdown(v => !v)}
          >
            {userName}
            <span style={{
              marginLeft: 5, fontSize: '0.86em', opacity: 0.7
            }}>▼</span>
          </button>
          {showDropdown && (
            <div style={{
              position: 'absolute', right: 0, top: 38,
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
  fontSize: '1rem',
  color: '#fff',
  cursor: 'pointer',
  transition: 'background 0.13s'
}
