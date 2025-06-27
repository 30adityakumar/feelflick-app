import { useState, useEffect } from 'react'
import './App.css'
import { supabase } from './supabaseClient'

import Auth from './Auth'
import Account from './Account'
import Search from './components/Search.jsx'   // ← NEW

function App() {
  /* ──────────────────────────────
     Auth session handling
  ────────────────────────────── */
  const [session, setSession] = useState(null)

  useEffect(() => {
    // grab existing session on first load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // listen for login / logout
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  /* ──────────────────────────────
     Movie-search state
  ────────────────────────────── */
  const [results, setResults] = useState([])

  /* save “Watched” row in Supabase */
  const markWatched = async (m) => {
    if (!session) return
    const { error } = await supabase.from('movies_watched').insert({
      user_id: session.user.id,
      movie_id: m.id,
      title: m.title,
      poster: m.poster_path
    })
    if (error) console.error('Insert failed:', error.message)
  }

  /* ──────────────────────────────
     Render
  ────────────────────────────── */
  if (!session) {
    return (
      <div className="container" style={{ padding: '50px 0 100px 0' }}>
        <Auth />
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: '50px 0 100px 0' }}>
      {/* user profile / sign-out component (from the starter) */}
      <Account key={session.user.id} session={session} />

      {/* movie search bar */}
      <div className="mt-6">
        <Search onResults={setResults} />
      </div>

      {/* results grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
        {results.map((m) => (
          <div key={m.id} className="text-center">
            <img
              src={
                m.poster_path
                  ? `https://image.tmdb.org/t/p/w185${m.poster_path}`
                  : 'https://via.placeholder.com/185x278?text=No+Image'
              }
              alt={m.title}
              className="rounded"
            />
            <p className="mt-2 text-sm">{m.title}</p>

            {/* mark as watched */}
            <button
              onClick={() => markWatched(m)}
              className="block bg-green-600 text-white w-full mt-1 rounded"
            >
              Watched ✓
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
