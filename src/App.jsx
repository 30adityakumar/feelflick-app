import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

import AuthEmailPassword from './AuthEmailPassword'
import Account from './Account'
import Search from './components/Search'

import Header from './components/Header'
import ResultsGrid from './components/ResultsGrid'
import WatchedHistory from './components/WatchedHistory'

export default function App () {
  /* ── Auth session ─────────────────────────────────────────── */
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  /* ── State: search results, watched list, genre map ───────── */
  const [results,  setResults]  = useState([])
  const [watched,  setWatched]  = useState([])
  const [genreMap, setGenreMap] = useState({})

  /* ── Fetch TMDb genre lookup once ─────────────────────────── */
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

  /* ── Pull watched history for the user ────────────────────── */
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

  /* ── Mark movie as watched & refresh list ─────────────────── */
  const markWatched = async (movie) => {
    if (!session) return
    const { error } = await supabase.from('movies_watched').insert({
      user_id:      session.user.id,
      movie_id:     movie.id,
      title:        movie.title,
      poster:       movie.poster_path,
      release_date: movie.release_date ?? null,
      vote_average: movie.vote_average ?? null,
      genre_ids:    movie.genre_ids ?? []
    })
    if (error) return console.error('Insert failed:', error.message)
    // re-query list (keep it simple for now)
    const { data } = await supabase
      .from('movies_watched')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false })
    setWatched(data)
  }

  /* ── Render unauthenticated view ──────────────────────────── */
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white px-4">
        <AuthEmailPassword />
      </div>
    )
  }

  /* ── Render authenticated app ─────────────────────────────── */
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
      />

      <WatchedHistory
        watched={watched}
        genreMap={genreMap}
      />
    </div>
  )
}
