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
  
  const [genreMap, setGenreMap] = useState({})

useEffect(() => {
  // Replace VITE_TMDB_KEY with whatever env var you’re using
  fetch(
    `https://api.themoviedb.org/3/genre/movie/list?api_key=${import.meta.env.56e20962522bccd1990f31f2c791d8d1}&language=en-US`
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
      poster: m.poster_path,
      release_date: m.release_date ?? null,
      vote_average: m.vote_average ?? null,
      genre_ids: m.genre_ids
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
            height: '36px',
            width: '36px',
            objectFit: 'contain',
            display: 'inline-block',
            borderRadius: '6px'
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: '1.1', marginBottom: '0.1rem' }}>
            FeelFlick
          </h1>
          <p style={{ fontSize: '0.6rem', color: '#ffd6cb', margin: 0 }}>
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

        {/* Movie search bar */}
        <div className="mt-8 mb-6 flex justify-center">
          <div className="w-full max-w-xl bg-white/10 p-4 rounded-lg shadow-md">
            <Search onResults={setResults} />
          </div>
        </div>


        {/* Results grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-6">
          {results.map((m) => (
            <div key={m.id} className="bg-white/10 p-2 rounded-lg shadow hover:scale-[1.02] transition-transform text-center">
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
                {m.genre_ids
                .map((id) => genreMap[id])
                .filter(Boolean)
                .slice(0, 3)
                .join(', ')} · {m.release_date?.slice(0, 4) || '—'} · ⭐ {m.vote_average?.toFixed(1) || '–'}
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


        {/* Watched History */}
        <h2 className="text-lg font-bold mt-10 mb-4 text-white">🎬 Watched History</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {watched.map((m) => (
            <div key={m.movie_id} className="text-center p-2 rounded-lg shadow-md bg-zinc-800">
              <img
                src={
                  m.poster
                    ? `https://image.tmdb.org/t/p/w185${m.poster}`
                    : 'https://via.placeholder.com/185x278?text=No+Image'
                }
                alt={m.title}
                className="rounded mb-2 mx-auto"
              />
              <p className="mt-2 text-sm font-medium">{m.title}</p>
              <p className="text-xs text-gray-400">
                {m.genre_ids
                .map((id) => genreMap[id])
                .filter(Boolean)
                .slice(0, 3)
                .join(', ')} • {m.release_date ? new Date(m.release_date).getFullYear() : '—'} • ⭐ {m.vote_average?.toFixed(1) ?? 'N/A'}
              </p>
            </div>
          ))}
        </div>

        )}
      </main>
    </div>
  )
}

export default App
