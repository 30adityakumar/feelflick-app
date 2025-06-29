import { useState, useEffect } from 'react'
import './App.css'
import { supabase } from './supabaseClient'

import AuthEmailPassword from './AuthEmailPassword'
import Account from './Account'
import Search from './components/Search.jsx'

function App() {
  // ─── Session logic ──────────────────────────────
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

  // ─── TMDb genre mapping ──────────────────────────
  const [genreMap, setGenreMap] = useState({})
  useEffect(() => {
    fetch(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US`
    )
      .then((res) => res.json())
      .then((data) => {
        const map = {}
        data.genres.forEach((g) => {
          map[g.id] = g.name
        })
        setGenreMap(map)
      })
      .catch(console.error)
  }, [])

  // ─── Watched history logic ──────────────────────
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

  // ─── Save movie to watched list ─────────────────
  const markWatched = async (m) => {
    console.log("Watched button clicked:", m.title)
    if (!session) return

    const genreArray = Array.isArray(m.genre_ids) ? m.genre_ids : []

    const { error } = await supabase.from('movies_watched').insert({
      user_id: session.user.id,
      movie_id: m.id,
      title: m.title,
      poster: m.poster_path,
      release_date: m.release_date ?? null,
      vote_average: m.vote_average ?? null,
      genre_ids: genreArray
    })

    if (error) {
      console.error('Insert failed:', error.message)
    } else {
      console.log('✅ Movie added to watch history')
      // Refresh
      const { data } = await supabase
        .from('movies_watched')
        .select('*')
        .eq('user_id', session.user.id)
        .order('id', { ascending: false })
      setWatched(data)
    }
  }

  // ─── Render unauthenticated screen ─────────────
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white px-4">
        <AuthEmailPassword />
      </div>
    )
  }

  // ─── Render authenticated screen ───────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 pb-10">
      <header
        className="px-4 py-6 shadow-md text-white"
        style={{
          background: 'linear-gradient(to right, #002b57, #ff5e3a)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      >
        <div className="flex items-center gap-4">
          <img
            src="/logo.png"
            alt="FeelFlick Logo"
            style={{
              height: '36px',
              width: '36px',
              objectFit: 'contain',
              borderRadius: '6px'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: '1.1', marginBottom: '0.1rem' }}>
              FeelFlick
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#ffd6cb', margin: 0 }}>
              Movies that match your mood.
            </p>
          </div>
        </div>
      </header>


      <Account key={session.user.id} session={session} />

      {/* Movie search bar */}
      <div className="mt-8 mb-6 flex justify-center">
        <div className="w-full max-w-xl bg-white/10 p-4 rounded-lg shadow-md">
          <Search onResults={setResults} />
        </div>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4 text-white">🔍 Search Results</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {results.map((m) => (
              <div
                key={m.id}
                className="bg-white/10 p-2 rounded-lg shadow hover:scale-[1.02] transition-transform text-center"
              >
                <img
                  src={
                    m.poster_path
                      ? `https://image.tmdb.org/t/p/w185${m.poster_path}`
                      : 'https://via.placeholder.com/185x278?text=No+Image'
                  }
                  alt={m.title}
                  className="rounded mb-2 mx-auto"
                />
                <p className="text-sm font-medium text-white">{m.title}</p>
                <p className="text-xs text-gray-300">
                  {m.release_date?.slice(0, 4) || '—'} • ⭐ {m.vote_average?.toFixed(1) || '–'}
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  {(m.genre_ids || [])
                    .map((id) => genreMap[id])
                    .filter(Boolean)
                    .slice(0, 3)
                    .join(', ')}
                </p>
                <button
                  onClick={() => markWatched(m)}
                  className="mt-2 w-full bg-green-600 text-white py-1 rounded hover:bg-green-700"
                >
                  Watched ✓
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Watched History */}
      <h2 className="text-lg font-bold mt-10 mb-4 text-white">🎬 Watched History</h2>
      {watched.length === 0 ? (
        <p className="text-gray-400">No watched movies yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {watched.map((m) => (
            <div
              key={m.movie_id}
              className="bg-white/10 p-2 rounded-lg shadow text-center"
            >
              <img
                src={
                  m.poster
                    ? `https://image.tmdb.org/t/p/w185${m.poster}`
                    : 'https://via.placeholder.com/185x278?text=No+Image'
                }
                alt={m.title}
                className="rounded mb-2 mx-auto"
              />
              <p className="text-sm font-medium text-white">{m.title}</p>
              <p className="text-xs text-gray-400">
                {m.release_date
                  ? new Date(m.release_date).getFullYear()
                  : '—'} • ⭐ {m.vote_average?.toFixed(1) || '–'}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                {(m.genre_ids || [])
                  .map((id) => genreMap[id])
                  .filter(Boolean)
                  .slice(0, 3)
                  .join(', ')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
