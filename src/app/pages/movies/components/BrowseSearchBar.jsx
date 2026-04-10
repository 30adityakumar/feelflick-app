// src/app/pages/movies/components/BrowseSearchBar.jsx
import { useState, useEffect, useRef } from 'react'
import { Search, X, ChevronDown, SlidersHorizontal, ChevronUp } from 'lucide-react'
import { getDbGenres } from '@/shared/api/browse'

export const DEFAULT_SORT = 'popularity.desc'

// Sorts available when browsing Supabase (includes FF-computed columns)
const SUPABASE_SORT_OPTIONS = [
  { value: 'popularity.desc',           label: 'Most Popular' },
  { value: 'ff_rating.desc',            label: 'Top Rated (FF)' },
  { value: 'vote_average.desc',         label: 'Highest Rated' },
  { value: 'vote_count.desc',           label: 'Most Reviewed' },
  { value: 'release_date.desc',         label: 'Newest First' },
  { value: 'release_date.asc',          label: 'Oldest First' },
  { value: 'discovery_potential.desc',  label: 'Hidden Gems' },
  { value: 'cult_status_score.desc',    label: 'Cult Classics' },
  { value: 'accessibility_score.desc',  label: 'Most Accessible' },
]

// Sorts available in TMDB discover (search mode)
const TMDB_SORT_OPTIONS = [
  { value: 'popularity.desc',    label: 'Most Popular' },
  { value: 'vote_average.desc',  label: 'Highest Rated' },
  { value: 'vote_count.desc',    label: 'Most Reviewed' },
  { value: 'release_date.desc',  label: 'Newest First' },
  { value: 'release_date.asc',   label: 'Oldest First' },
  { value: 'revenue.desc',       label: 'Box Office' },
]

const SUPABASE_ONLY_SORT_VALUES = new Set([
  'ff_rating.desc', 'discovery_potential.desc', 'cult_status_score.desc', 'accessibility_score.desc',
])

const DECADE_OPTIONS = [
  { value: '',        label: 'Any Era' },
  { value: '2020',    label: '2020s' },
  { value: '2010',    label: '2010s' },
  { value: '2000',    label: '2000s' },
  { value: '1990',    label: '1990s' },
  { value: '1980',    label: '1980s' },
  { value: '1970',    label: '1970s' },
  { value: 'pre1970', label: 'Before 1970' },
]

const LANGUAGE_OPTIONS = [
  { value: '',   label: 'Any Language' },
  { value: 'en', label: 'English' },
  { value: 'ko', label: 'Korean' },
  { value: 'ja', label: 'Japanese' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'zh', label: 'Chinese' },
  { value: 'pt', label: 'Portuguese' },
]

const RATING_OPTIONS = [
  { value: '',    label: 'Any Rating' },
  { value: '6',   label: '6.0+' },
  { value: '7',   label: '7.0+' },
  { value: '7.5', label: '7.5+' },
  { value: '8',   label: '8.0+' },
  { value: '8.5', label: '8.5+' },
]

const RUNTIME_OPTIONS = [
  { value: '',       label: 'Any Length' },
  { value: 'short',  label: 'Short  < 90m' },
  { value: 'medium', label: 'Standard  90–130m' },
  { value: 'long',   label: 'Long  130–180m' },
  { value: 'epic',   label: 'Epic  180m+' },
]

const PACING_OPTIONS = [
  { value: '',     label: 'Any Pacing' },
  { value: 'slow', label: 'Slow burn' },
  { value: 'fast', label: 'Fast-paced' },
]

const INTENSITY_OPTIONS = [
  { value: '',        label: 'Any Intensity' },
  { value: 'chill',   label: 'Chill / lighthearted' },
  { value: 'intense', label: 'Intense / dark' },
]

const DEPTH_OPTIONS = [
  { value: '',        label: 'Any Depth' },
  { value: 'surface', label: 'Easy watch' },
  { value: 'deep',    label: 'Thought-provoking' },
]

const VIBE_OPTIONS = [
  { value: 'hidden',     label: 'Hidden gem',    emoji: '💎' },
  { value: 'cult',       label: 'Cult classic',  emoji: '🔮' },
  { value: 'spectacle',  label: 'Visually epic', emoji: '✨' },
  { value: 'accessible', label: 'Easy to watch', emoji: '☕' },
]

// ── Sub-components ─────────────────────────────────────────────────────────────

function FilterPill({ label, value, defaultValue = '', options, onChange, disabled = false }) {
  const isActive = value !== defaultValue
  const activeLabel = isActive ? (options.find(o => o.value === value)?.label ?? label) : label

  return (
    <div
      className={`relative inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 transition-all duration-150 ${
        disabled
          ? 'cursor-not-allowed opacity-30'
          : isActive
            ? 'border-purple-400/60 bg-purple-500/18 text-purple-200'
            : 'border-white/10 bg-white/[0.05] text-white/60 hover:border-white/20 hover:bg-white/[0.08] hover:text-white/85'
      }`}
    >
      <span className="text-[0.78rem] font-medium leading-none">{activeLabel}</span>
      <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
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

function SegmentGroup({ label, labelSuffix, options, value, onChange, disabled }) {
  return (
    <div className={disabled ? 'opacity-40' : ''}>
      <p className="mb-2 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-widest"
        style={{ color: 'rgba(248,250,252,0.35)' }}>
        {label}
        {labelSuffix && (
          <span className="normal-case tracking-normal font-normal" style={{ color: 'rgba(248,250,252,0.3)' }}>
            {labelSuffix}
          </span>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(active ? '' : opt.value)}
              className={`inline-flex h-8 items-center rounded-full border px-3.5 text-[0.76rem] font-medium transition-all duration-150 ${
                disabled ? 'cursor-not-allowed opacity-30' :
                active
                  ? 'border-purple-400/60 bg-purple-500/20 text-purple-200'
                  : 'border-white/10 bg-white/[0.04] text-white/55 hover:border-white/18 hover:text-white/80'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function VibeChip({ option, active, onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-[0.76rem] font-medium transition-all duration-150 ${
        disabled ? 'cursor-not-allowed opacity-30' :
        active
          ? 'border-purple-400/60 bg-purple-500/20 text-purple-200'
          : 'border-white/10 bg-white/[0.04] text-white/55 hover:border-white/18 hover:text-white/80'
      }`}
    >
      <span>{option.emoji}</span>
      <span>{option.label}</span>
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function BrowseSearchBar({
  query = '',
  genre = '',
  sortBy = DEFAULT_SORT,
  decade = '',
  minRating = '',
  language = '',
  runtime = '',
  pacing = '',
  intensity = '',
  depth = '',
  vibe = [],
  onSearch,
}) {
  const [draftQuery, setDraftQuery] = useState(query)
  const [genres, setGenres] = useState([])
  const [panelOpen, setPanelOpen] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { setDraftQuery(query) }, [query])

  useEffect(() => {
    getDbGenres()
      .then(setGenres)
      .catch(console.error)
  }, [])

  const isSearchMode = draftQuery.trim().length > 0

  // Count active advanced filters for the badge (TMDB mode only counts compatible filters)
  const advancedCount = isSearchMode
    ? [minRating, runtime].filter(Boolean).length
    : [minRating, runtime, pacing, intensity, depth, ...vibe].filter(Boolean).length

  const hasAnyFilter = genre || decade || language || sortBy !== DEFAULT_SORT || advancedCount > 0 || draftQuery

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch({ q: draftQuery, genre, sortBy, decade, minRating, language, runtime, pacing, intensity, depth, vibe })
  }

  const handleClearSearch = () => {
    setDraftQuery('')
    onSearch({ q: '', genre, sortBy, decade, minRating, language, runtime, pacing, intensity, depth, vibe })
    inputRef.current?.focus()
  }

  const handleClearAll = () => {
    setDraftQuery('')
    setPanelOpen(false)
    onSearch({ q: '', genre: '', sortBy: DEFAULT_SORT, decade: '', minRating: '', language: '', runtime: '', pacing: '', intensity: '', depth: '', vibe: [] })
  }

  const applyFilter = (patch) => {
    onSearch({ q: draftQuery, genre, sortBy, decade, minRating, language, runtime, pacing, intensity, depth, vibe, ...patch })
  }

  const toggleVibe = (val) => {
    const next = vibe.includes(val) ? vibe.filter(v => v !== val) : [...vibe, val]
    applyFilter({ vibe: next })
  }

  const genreOptions = [
    { value: '', label: 'All Genres' },
    ...genres.map((g) => ({ value: g.name, label: g.name })),
  ]

  return (
    <div className="pb-3">
      {/* ── Row 1: Search input ──────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-3">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: 'rgba(248,250,252,0.35)' }}
          />
          <input
            ref={inputRef}
            id="browse-search-input"
            type="search"
            autoComplete="off"
            spellCheck={false}
            value={draftQuery}
            onChange={(e) => setDraftQuery(e.target.value)}
            placeholder="Search by title…"
            className="h-11 w-full rounded-full border border-white/10 bg-white/[0.06] pl-11 pr-10 text-[0.92rem] text-white placeholder:text-white/30 transition-colors focus:border-purple-400/40 focus:bg-white/[0.09] focus:outline-none"
          />
          {draftQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors"
              style={{ color: 'rgba(248,250,252,0.4)' }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-11 rounded-full px-6 text-[0.88rem] font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)' }}
        >
          Search
        </button>
      </form>

      {/* ── Row 2: Quick filter pills ────────────────────────────────────── */}
      <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SlidersHorizontal
          className="h-3.5 w-3.5 shrink-0"
          style={{ color: 'rgba(248,250,252,0.3)' }}
        />

        <FilterPill
          label="Genre"
          value={genre}
          options={genreOptions}
          onChange={(v) => applyFilter({ genre: v })}
        />
        <FilterPill
          label="Era"
          value={decade}
          options={DECADE_OPTIONS}
          onChange={(v) => applyFilter({ decade: v })}
        />
        <FilterPill
          label="Language"
          value={language}
          options={LANGUAGE_OPTIONS}
          onChange={(v) => applyFilter({ language: v })}
        />
        {/* Sort: use TMDB options in search mode, Supabase options in browse mode.
            If the active sort is Supabase-only and user enters search mode, fall back
            to showing 'Most Popular' until they pick a TMDB-compatible sort. */}
        <FilterPill
          label="Sort"
          value={isSearchMode && SUPABASE_ONLY_SORT_VALUES.has(sortBy) ? DEFAULT_SORT : sortBy}
          defaultValue={DEFAULT_SORT}
          options={isSearchMode ? TMDB_SORT_OPTIONS : SUPABASE_SORT_OPTIONS}
          onChange={(v) => applyFilter({ sortBy: v })}
        />

        {/* Separator */}
        <div className="h-4 w-px shrink-0" style={{ background: 'rgba(248,250,252,0.1)' }} />

        {/* More filters button */}
        <button
          type="button"
          onClick={() => setPanelOpen(p => !p)}
          className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[0.78rem] font-medium transition-all duration-150 ${
            panelOpen || advancedCount > 0
              ? 'border-purple-400/60 bg-purple-500/18 text-purple-200'
              : 'border-white/10 bg-white/[0.05] text-white/60 hover:border-white/20 hover:text-white/85'
          }`}
        >
          {panelOpen ? <ChevronUp className="h-3 w-3" /> : <SlidersHorizontal className="h-3 w-3" />}
          <span>Filters</span>
          {advancedCount > 0 && (
            <span
              className="flex h-4 w-4 items-center justify-center rounded-full text-[0.6rem] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)' }}
            >
              {advancedCount}
            </span>
          )}
        </button>

        {hasAnyFilter && (
          <button
            type="button"
            onClick={handleClearAll}
            className="ml-1 inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 text-[0.76rem] font-medium text-white/45 transition-colors hover:text-white/75"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* ── Advanced filter panel ─────────────────────────────────────────── */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: panelOpen ? '600px' : '0px' }}
      >
        <div
          className="mt-2 rounded-2xl border p-5"
          style={{
            background: 'rgba(18, 11, 28, 0.96)',
            borderColor: 'rgba(168, 85, 247, 0.15)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {/* Quality — works in both modes */}
            <SegmentGroup
              label="Quality"
              options={RATING_OPTIONS}
              value={minRating}
              onChange={(v) => applyFilter({ minRating: v })}
            />

            {/* Runtime — works in both modes */}
            <SegmentGroup
              label="Runtime"
              options={RUNTIME_OPTIONS}
              value={runtime}
              onChange={(v) => applyFilter({ runtime: v })}
            />

            {/* Pacing — Supabase browse only */}
            <SegmentGroup
              label="Pacing"
              labelSuffix={isSearchMode ? 'browse only' : null}
              options={PACING_OPTIONS}
              value={pacing}
              onChange={(v) => applyFilter({ pacing: v })}
              disabled={isSearchMode}
            />

            {/* Intensity — Supabase browse only */}
            <SegmentGroup
              label="Intensity"
              labelSuffix={isSearchMode ? 'browse only' : null}
              options={INTENSITY_OPTIONS}
              value={intensity}
              onChange={(v) => applyFilter({ intensity: v })}
              disabled={isSearchMode}
            />

            {/* Depth — Supabase browse only */}
            <SegmentGroup
              label="Depth"
              labelSuffix={isSearchMode ? 'browse only' : null}
              options={DEPTH_OPTIONS}
              value={depth}
              onChange={(v) => applyFilter({ depth: v })}
              disabled={isSearchMode}
            />

            {/* Vibes — Supabase browse only */}
            <div className={isSearchMode ? 'opacity-40' : ''}>
              <p className="mb-2 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(248,250,252,0.35)' }}>
                Vibe
                {isSearchMode && (
                  <span className="normal-case tracking-normal font-normal" style={{ color: 'rgba(248,250,252,0.3)' }}>
                    browse only
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {VIBE_OPTIONS.map((opt) => (
                  <VibeChip
                    key={opt.value}
                    option={opt}
                    active={vibe.includes(opt.value)}
                    onClick={() => toggleVibe(opt.value)}
                    disabled={isSearchMode}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Panel footer */}
          {advancedCount > 0 && (
            <div
              className="mt-4 flex items-center justify-between border-t pt-4"
              style={{ borderColor: 'rgba(168,85,247,0.1)' }}
            >
              <p className="text-[0.76rem]" style={{ color: 'rgba(248,250,252,0.4)' }}>
                {advancedCount} advanced filter{advancedCount !== 1 ? 's' : ''} active
              </p>
              <button
                type="button"
                onClick={() => {
                  if (isSearchMode) {
                    applyFilter({ minRating: '', runtime: '' })
                  } else {
                    applyFilter({ minRating: '', runtime: '', pacing: '', intensity: '', depth: '', vibe: [] })
                  }
                }}
                className="text-[0.76rem] font-medium transition-colors"
                style={{ color: 'rgba(192,132,252,0.8)' }}
              >
                Clear advanced
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
