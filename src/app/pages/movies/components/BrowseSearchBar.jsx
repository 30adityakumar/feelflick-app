// src/app/pages/browse/BrowseSearchBar.jsx
import { useState, useEffect, useRef } from 'react'
import { Search, X, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { getGenres } from '@/shared/api/tmdb'

export const DEFAULT_SORT = 'popularity.desc'

const SORT_OPTIONS = [
  { value: 'popularity.desc',     label: 'Most Popular' },
  { value: 'vote_average.desc',   label: 'Top Rated' },
  { value: 'release_date.desc',   label: 'Newest First' },
  { value: 'release_date.asc',    label: 'Oldest First' },
  { value: 'revenue.desc',        label: 'Box Office' },
]

const DECADE_OPTIONS = [
  { value: '',     label: 'Any Year' },
  { value: '2020', label: '2020s' },
  { value: '2010', label: '2010s' },
  { value: '2000', label: '2000s' },
  { value: '1990', label: '1990s' },
  { value: '1980', label: '1980s' },
  { value: '1970', label: '1970s' },
  { value: 'pre1970', label: 'Before 1970' },
]

const RATING_OPTIONS = [
  { value: '',    label: 'Any Rating' },
  { value: '6',   label: '6+ / 10' },
  { value: '7',   label: '7+ / 10' },
  { value: '7.5', label: '7.5+ / 10' },
  { value: '8',   label: '8+ / 10' },
]

const LANGUAGE_OPTIONS = [
  { value: '',   label: 'Any Language' },
  { value: 'en', label: 'English' },
  { value: 'ko', label: 'Korean' },
  { value: 'ja', label: 'Japanese' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'hi', label: 'Hindi' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
]

function FilterPill({ label, value, defaultValue = '', options, onChange, disabled = false }) {
  const isActive = value !== defaultValue
  const activeLabel = isActive ? (options.find(o => o.value === value)?.label ?? label) : label

  return (
    <div
      className={`relative inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 transition-all duration-150 ${
        disabled
          ? 'cursor-not-allowed opacity-40'
          : isActive
            ? 'border-purple-400/70 bg-purple-500/20 text-purple-200'
            : 'border-white/12 bg-white/6 text-white/65 hover:border-white/22 hover:bg-white/10 hover:text-white/85'
      }`}
    >
      <span className="text-[0.78rem] font-medium leading-none">{activeLabel}</span>
      <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
      {!disabled && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={label}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

export default function BrowseSearchBar({
  query = '',
  genre = '',
  sortBy = DEFAULT_SORT,
  decade = '',
  minRating = '',
  language = '',
  onSearch,
}) {
  const [draftQuery, setDraftQuery] = useState(query)
  const [genres, setGenres] = useState([])
  const inputRef = useRef(null)

  useEffect(() => { setDraftQuery(query) }, [query])

  useEffect(() => {
    getGenres()
      .then((data) => setGenres(data.genres || []))
      .catch(console.error)
  }, [])

  const isSearchMode = draftQuery.trim().length > 0

  const hasActiveFilters = genre || decade || minRating || language || sortBy !== DEFAULT_SORT

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch({ q: draftQuery, genre, sortBy, decade, minRating, language })
  }

  const handleClearSearch = () => {
    setDraftQuery('')
    onSearch({ q: '', genre, sortBy, decade, minRating, language })
    inputRef.current?.focus()
  }

  const handleClearAll = () => {
    setDraftQuery('')
    onSearch({ q: '', genre: '', sortBy: DEFAULT_SORT, decade: '', minRating: '', language: '' })
  }

  const applyFilter = (patch) => {
    onSearch({ q: draftQuery, genre, sortBy, decade, minRating, language, ...patch })
  }

  const genreOptions = [
    { value: '', label: 'All Genres' },
    ...genres.map((g) => ({ value: String(g.id), label: g.name })),
  ]

  return (
    <div className="space-y-3">
      {/* Search row */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            ref={inputRef}
            id="browse-search-input"
            type="search"
            autoComplete="off"
            spellCheck={false}
            value={draftQuery}
            onChange={(e) => setDraftQuery(e.target.value)}
            placeholder="Search movies by title…"
            className="h-11 w-full rounded-full border border-white/12 bg-white/7 pl-11 pr-10 text-[0.92rem] text-white placeholder:text-white/35 transition-colors focus:border-purple-400/50 focus:bg-white/10 focus:outline-none"
          />
          {draftQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/40 hover:text-white/80 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-11 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 text-[0.88rem] font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
        >
          Search
        </button>
      </form>

      {/* Filter pills row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-white/35" />

        <FilterPill
          label="Genre"
          value={genre}
          options={genreOptions}
          onChange={(v) => applyFilter({ genre: v })}
          disabled={isSearchMode}
        />
        <FilterPill
          label="Decade"
          value={decade}
          options={DECADE_OPTIONS}
          onChange={(v) => applyFilter({ decade: v })}
          disabled={isSearchMode}
        />
        <FilterPill
          label="Rating"
          value={minRating}
          options={RATING_OPTIONS}
          onChange={(v) => applyFilter({ minRating: v })}
          disabled={isSearchMode}
        />
        <FilterPill
          label="Language"
          value={language}
          options={LANGUAGE_OPTIONS}
          onChange={(v) => applyFilter({ language: v })}
          disabled={isSearchMode}
        />

        {/* Divider */}
        <div className="h-4 w-px shrink-0 bg-white/12" />

        <FilterPill
          label={SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? 'Sort'}
          value={sortBy}
          defaultValue={DEFAULT_SORT}
          options={SORT_OPTIONS}
          onChange={(v) => applyFilter({ sortBy: v })}
          disabled={isSearchMode}
        />

        {(hasActiveFilters || draftQuery) && (
          <button
            type="button"
            onClick={handleClearAll}
            className="ml-1 inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-white/12 bg-white/6 px-3 text-[0.78rem] font-medium text-white/50 transition-colors hover:border-white/22 hover:text-white/80"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
