// components/Account.jsx
import { supabase } from '../supabaseClient'

export default function Account({ session, userName }) {
  // Use provided name, then fallback to Supabase metadata, then email
  const displayName = userName || session?.user?.user_metadata?.name || session?.user?.email

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      margin: '32px auto 14px auto',
      maxWidth: 900,
      width: '100%',
      padding: '0 4px'
    }}>
      <div style={{ fontWeight: 700, fontSize: 23, letterSpacing: '-0.3px' }}>
        <span role="img" aria-label="wave">👋</span> Hello, <span style={{ color: '#22d190' }}>{displayName}</span>
      </div>
      <button
        onClick={() => supabase.auth.signOut()}
        style={{
          background: '#18181b',
          color: '#fff',
          border: '1.5px solid #333',
          borderRadius: 20,
          padding: '0.45rem 1.5rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: 16,
          transition: 'background 0.18s, color 0.18s'
        }}
        onMouseOver={e => { e.currentTarget.style.background='#2d2d34'; e.currentTarget.style.color='#24b47e'; }}
        onMouseOut={e => { e.currentTarget.style.background='#18181b'; e.currentTarget.style.color='#fff'; }}
      >
        SIGN OUT
      </button>
    </div>
  )
}
