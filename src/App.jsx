import { useState, useEffect } from 'react'
import './App.css'
import { supabase } from './supabaseClient'

import AuthEmailPassword from './AuthEmailPassword'
import Account from './Account'
import Search from './components/Search.jsx'

function App() {
  const [session, setSession] = useState(null)
  const [results, setResults] = useState([])
  const [watched, setWatched] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => data.subscription.unsubscribe()
  }, [])

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

  const markWatched = async (m) => {
    console.log("Watched button clicked:", m.title)
    if (!session) return

    const { error } = await supabase.from('movies_watched').insert({
      user_id: session.user.id,
      movie_id: m.id,
      title: m.title,
      poster: m.poster_path
    })

    if (error) {
      console.error('Insert failed:', error.message)
    } else {
      const { data } = await supabase
        .from('movies_watched')
        .select('*')
        .eq('user_id', session.user.id)
        .order('id', { ascending: false })
      setWatched(data)
      console.log('Watched saved and history updated')
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white px-4">
        <AuthEmailPassword />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 pb-10">
    <header
      className="px-4 py-6 shadow-md text-white"
      style={{
        background: 'linear-gradient(to right, #002b57, #ff5e3a)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div className="flex items-center gap-4">
        <img
          src="/logo.png"
          alt="FeelFlick Logo"
          style={{
            height: '44px',
            width: '44px',
            objectFit: 'contain',
            display: 'inline-block',
            borderRadius: '8px'
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: '1.1', marginBottom: '0.1rem' }}>
            FeelFlick
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#ffd6cb', margin: 0 }}>
            Movies that match your mood.
          </p>
        </div>
      </div>
    </header>

      <main className="max-w-5xl mx-auto">
        {/* User Info + Signout */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <Account key={session.user.id} session={session} />
        </div>

        {/* Search Bar */}
        <div className="mt-8">
          <Search onResults={setResults} />
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mt-10 mb-4">Search Results</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {results.map((m) => (
                <div key={m.id} className="text-center">
                  <img
                    src={
                      m.poster_path
                        ? `https://image.tmdb.org/t/p/w185${m.poster_path}`
                        : 'https://via.placeholder.com/185x278?text=No+Image'
                    }
                    alt={m.title}
                    className="rounded shadow-md"
                  />
                  <p className="mt-2 text-sm">{m.title}</p>
                  <button
                    onClick={() => markWatched(m)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 mt-1 rounded w-full"
                  >
                    Watched ✓
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Watched History */}
        <h2 className="text-xl font-semibold mt-12 mb-4">🎥 Watched History</h2>
        {watched.length === 0 ? (
          <p className="text-gray-400">No watched movies yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {watched.map((m) => (
              <div key={m.movie_id} className="text-center">
                <img
                  src={
                    m.poster
                      ? `https://image.tmdb.org/t/p/w185${m.poster}`
                      : 'https://via.placeholder.com/185x278?text=No+Image'
                  }
                  alt={m.title}
                  className="rounded shadow-md"
                />
                <p className="mt-2 text-sm">{m.title}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
