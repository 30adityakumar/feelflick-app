import { useState, useEffect } from 'react'
import './App.css'
import { supabase } from './supabaseClient'

import AuthEmailPassword from './AuthEmailPassword'

import Account from './Account'
import Search from './components/Search.jsx'

function App() {
  // ─── Session logic ──────────────────────────────
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  // ─── Movie search logic ─────────────────────────
  const [results, setResults] = useState([])

  // ─── Watched history logic ──────────────────────
  const [watched, setWatched] = useState([])

  // Fetch watched movies on login
  useEffect(() => {
    if (session?.user?.id) {
      supabase
        .from('movies_watched')
        .select('*')
        .eq('user_id', session.user.id)
        .order('id', { ascending: false })
        .then(({ data, error }) => {
          if (error) console.error('Fetch error:', error.message)
          else setWatched(data)
        })
    }
  }, [session])

  // Save movie to watched list
  const markWatched = async (m) => {
    console.log("Watched button clicked:", m.title);
    if (!session) return;

    const { error } = await supabase.from('movies_watched').insert({
      user_id: session.user.id,
      movie_id: m.id,
      title: m.title,
      poster: m.poster_path
    });

    if (error) {
      console.error('Insert failed:', error.message);
    } else {
      // Re-fetch after insert
      const { data } = await supabase
        .from('movies_watched')
        .select('*')
        .eq('user_id', session.user.id)
        .order('id', { ascending: false })
      setWatched(data)
      console.log('Watched saved and history updated');
    }
  }

  // ─── Render unauthenticated screen ─────────────
  if (!session) {
    return (
      <div className="container" style={{ padding: '50px 0 100px 0' }}>
        <AuthEmailPassword />
      </div>
    )
  }

  // ─── Render authenticated screen ───────────────
  return (
    <div className="container" style={{ padding: '50px 0 100px 0' }}>
      <Account key={session.user.id} session={session} />

      {/* Movie search bar */}
      <div className="mt-6">
        <Search onResults={setResults} />
      </div>

      {/* Results grid */}
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
            <button
              onClick={() => markWatched(m)}
              className="block bg-green-600 text-white w-full mt-1 rounded"
            >
              Watched ✓
            </button>
          </div>
        ))}
      </div>

      {/* Watched History */}
      <h2 className="text-lg font-bold mt-10 mb-2">🎥 Watched History</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {watched.map((m) => (
          <div key={m.movie_id} className="text-center">
            <img
              src={
                m.poster
                  ? `https://image.tmdb.org/t/p/w185${m.poster}`
                  : 'https://via.placeholder.com/185x278?text=No+Image'
              }
              alt={m.title}
              className="rounded"
            />
            <p className="mt-2 text-sm">{m.title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
