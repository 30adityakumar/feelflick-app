import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

import AuthEmailPassword from './AuthEmailPassword'
import Account from './Account'
import Search from './components/Search'

import Header from './components/Header'
import ResultsGrid from './components/ResultsGrid'
import WatchedHistory from './components/WatchedHistory'

export default function App () {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const [results, setResults] = useState([])
  const [watched, setWatched] = useState([])
  const [genreMap, setGenreMap] = useState({})

  const watchedIds = new Set(watched.map(m => m.movie_id)) // ← used to disable button

  useEffect(() => {
    fetch(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US`
    )
      .then(res => res.json())
      .then(({ genres }) => setGenreMap(
        Object.fromEntries(genres.map(g => [g.id, g.name]))
      ))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return
    supabase
      .from('movies_watched')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error.message)
        else setWatched(data)
      })
  }, [session])

  const markWatched = async (movie) => {
    if (!session || watchedIds.has(movie.id)) return

    const { error } = await supabase.from('movies_watched').insert({
      user_id:      session.user.id,
      movie_id:     movie.id,
      title:        movie.title,
      poster:       movie.poster_path,
      release_date: movie.release_date ?? null,
      vote_average: movie.vote_average ?? null,
      genre_ids:    movie.genre_ids ?? []
    })

    if (error && error.code !== '23505') {
      return console.error('Insert failed:', error.message)
    }

    // re-fetch watched list (if insert succeeded or already existed)
    const { data } = await supabase
      .from('movies_watched')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false })
    setWatched(data)
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
      <Header />

      <Account session={session} />

      <div className="mt-8 mb-6 flex justify-center">
        <div className="w-full max-w-xl bg-white/10 p-4 rounded-lg shadow-md">
          <Search onResults={setResults} />
        </div>
      </div>

      <ResultsGrid
        results={results}
        genreMap={genreMap}
        onMarkWatched={markWatched}
        watchedIds={watchedIds}  // ← pass to ResultsGrid
      />

      <WatchedHistory
        watched={watched}
        genreMap={genreMap}
      />
    </div>
  )
}
