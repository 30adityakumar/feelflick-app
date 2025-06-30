import { supabase } from './supabaseClient'

export default function Account({ session, userName }) {
  // Display name fallback (from userName prop or email if not set)
  const displayName = userName || session?.user?.user_metadata?.name || session?.user?.email;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      maxWidth: 900,
      margin: '0 auto 1rem auto',
      padding: '0.5rem 0.5rem 0.5rem 0',
      width: '100%'
    }}>
      <div style={{ fontWeight: 500, fontSize: 18 }}>
        {displayName ? <>Hello, <span style={{ color: '#24b47e' }}>{displayName}</span></> : null}
      </div>
      <button
        onClick={() => supabase.auth.signOut()}
        style={{
          background: '#201f24',
          color: '#fff',
          border: '1px solid #666',
          borderRadius: 8,
          padding: '0.45rem 1.3rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: 15,
          transition: 'background 0.18s'
        }}
        onMouseOver={e => e.currentTarget.style.background='#292832'}
        onMouseOut={e => e.currentTarget.style.background='#201f24'}
      >
        SIGN OUT
      </button>
    </div>
  )
}
