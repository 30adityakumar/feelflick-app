// src/app/pages/browse/BrowseSearchBar.jsx
import { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY

export default function BrowseSearchBar({ onSearch }) {
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('')
  const [sortBy, setSortBy] = useState('popularity.desc')
  const [genres, setGenres] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  // Fetch Genres
  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_KEY}`)
      .then(r => r.json())
      .then(data => setGenres(data.genres || []))
      .catch(console.error)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(query, genre, sortBy)
  }

  const handleFilterChange = (newGenre, newSort) => {
    setGenre(newGenre)
    setSortBy(newSort)
    onSearch(query, newGenre, newSort)
  }

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for movies..."
            className="w-full h-12 pl-12 pr-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
        </div>
        <button
          type="submit"
          className="h-12 px-6 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold transition-all hover:scale-105 active:scale-95"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="h-12 w-12 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all"
        >
          <Filter className="h-5 w-5 text-white" />
        </button>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
          {/* Genre */}
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">Genre</label>
            <select
              value={genre}
              onChange={(e) => handleFilterChange(e.target.value, sortBy)}
              className="w-full h-10 px-4 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Genres</option>
              {genres.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => handleFilterChange(genre, e.target.value)}
              className="w-full h-10 px-4 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="popularity.desc">Popularity (High to Low)</option>
              <option value="popularity.asc">Popularity (Low to High)</option>
              <option value="vote_average.desc">Rating (High to Low)</option>
              <option value="vote_average.asc">Rating (Low to High)</option>
              <option value="release_date.desc">Release Date (Newest)</option>
              <option value="release_date.asc">Release Date (Oldest)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
