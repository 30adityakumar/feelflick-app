import { useState, useEffect } from 'react'
import './App.css'
import { supabase } from './supabaseClient'

import Auth from './Auth'
import Account from './Account'
import Search from './components/Search.jsx'   // ← new import

function App() {
  const [session, setSession] = useState(null)
  const [results, setResults] = useState([])   // ← new state for TMDb hits

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  /* ---------- helper to save “Watched” rows ---------- */
  const markWatched = async (m) => {
    const { error } = await supabase.from('movies_watched').insert({
      user_id: session.user.id,
      movie_id: m.id,
      title: m.title,
      poster: m.poster_path
    })
    if (error) console.error(error)
  }

  /* -------------- render ---------------- */
  if (!session) {
    return (
      <div className="container" style={{ padding: '50px 0 100px 0' }}>
        <Auth />
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: '50px 0 100px 0' }}>
      <Account key={session.user.id} session={session} />

      {/* ---- Movie Search bar ---- */}
      <div className="mt-6">
        <Search onResults={setResults} />
      </div>

      {/* ---- Results grid ---- */}
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

            {/* Watched button */}
            <button
              onClick={() => markWatched(m)}
              className="block bg-green-600 text-white w-full mt-1"
            >
              Watched
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
