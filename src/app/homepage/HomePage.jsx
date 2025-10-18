// src/app/homepage/HomePage.jsx (Minimalist MVP)
// FeelFlick — minimalist, warm, cinematic. No sliders, no clutter.
// Replace your existing HomePage.jsx with this version to simplify the homepage.

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'

// Small utility to resolve poster URLs (adjust if your project already provides a helper)
const TMDB_POSTER_342 = (path) => path ? `https://image.tmdb.org/t/p/w342${path}` : null

export default function HomePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    let isMounted = true
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!isMounted) return
      setUser(user || null)

      // Fetch last 12 watched items for current user
      // Adjust table/columns to match your schema:
      // expected columns: user_id, movie_id, title, poster_path, watched_at
      if (user) {
        const { data, error } = await supabase
          .from('watched')
          .select('movie_id, title, poster_path, watched_at')
          .eq('user_id', user.id)
          .order('watched_at', { ascending: false })
          .limit(12)

        if (!isMounted) return
        if (error) {
          console.error('[HomePage] watched fetch error:', error)
          setRecent([])
        } else {
          setRecent(data || [])
        }
      } else {
        setRecent([])
      }

      setLoading(false)
    }
    init()
    return () => { isMounted = false }
  }, [])

  function onSearchSubmit(e) {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    // Keep it simple: navigate to a search route that reads ?q=
    navigate(`/search?q=${encodeURIComponent(term)}`)
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-black to-[#0b0b10] text-white">
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10">
        {/* Hero */}
        <section className="text-center space-y-5 mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Movies that feel like <span className="italic">you</span>
          </h1>
          <p className="text-white/70 text-base sm:text-lg">
            Track what you watch. Keep it simple. Find your next mood-match.
          </p>

          {/* Search */}
          <form onSubmit={onSearchSubmit} className="relative mx-auto w-full max-w-xl">
            <label htmlFor="q" className="sr-only">Search movies</label>
            <input
              id="q"
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title (e.g., Past Lives)"
              autoComplete="off"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-3 pr-12 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-sm bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              Search
            </button>
          </form>
        </section>

        {/* Recently watched */}
        <section aria-labelledby="recently-watched-heading">
          <div className="flex items-baseline justify-between mb-4">
            <h2 id="recently-watched-heading" className="text-lg font-medium">
              Recently watched
            </h2>
            {user && recent?.length > 0 && (
              <Link
                to="/watched"
                className="text-sm text-white/70 hover:text-white transition"
              >
                View all
              </Link>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : user && recent?.length > 0 ? (
            <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {recent.map((m) => {
                const poster = TMDB_POSTER_342(m.poster_path)
                return (
                  <li key={m.movie_id} className="group">
                    <Link
                      to={`/movie/${m.movie_id}`}
                      className="block relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                    >
                      {poster ? (
                        <img
                          src={poster}
                          alt={m.title || 'Movie poster'}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-white/50 text-sm">
                          No poster
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                        <div className="truncate text-sm">{m.title}</div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState isAuthed={!!user} />
          )}
        </section>
      </main>
    </div>
  )
}

function EmptyState({ isAuthed }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center bg-white/[0.03]">
      <h3 className="text-base font-medium mb-2">Nothing here yet</h3>
      <p className="text-sm text-white/70 mb-5">
        {isAuthed
          ? 'Add your first movie to start your collection.'
          : 'Sign in and add your first movie to start your collection.'}
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          to="/search"
          className="rounded-xl px-4 py-2 text-sm bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          Search movies
        </Link>
        {!isAuthed && (
          <Link
            to="/login"
            className="rounded-xl px-4 py-2 text-sm bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            Sign in
          </Link>
        )}
      </div>
    </div>
  )
}
