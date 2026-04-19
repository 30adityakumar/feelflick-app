// src/app/pages/movies/components/BrowseSearchBar.jsx
import { useState, useEffect, useRef } from 'react'
import { Search, X, ChevronDown, SlidersHorizontal, ChevronUp, Award } from 'lucide-react'
import { getDbGenres } from '@/shared/api/browse'

export const DEFAULT_SORT = 'ff_rating.desc'

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

const DIALOGUE_OPTIONS = [
  { value: '',       label: 'Any' },
  { value: 'heavy',  label: 'Dialogue-heavy' },
  { value: 'light',  label: 'Visual / action' },
]

const ATTENTION_OPTIONS = [
  { value: '',     label: 'Any' },
  { value: 'low',  label: 'Easy to multitask' },
  { value: 'high', label: 'Needs focus' },
]

const PRESETS = [
  { id: 'hidden_gems',   label: '💎 Hidden gems',   filters: { sortBy: 'discovery_potential.desc', vibe: ['hidden'] } },
  { id: 'cozy_night',    label: '☕ Cozy night',     filters: { intensity: 'chill', depth: 'surface', runtime: 'medium', sortBy: 'ff_rating.desc' } },
  { id: 'mind_bending',  label: '🧠 Mind-bending',  filters: { depth: 'deep', attention: 'high', sortBy: 'ff_rating.desc' } },
  { id: 'high_energy',   label: '⚡ High energy',    filters: { pacing: 'fast', intensity: 'intense', sortBy: 'ff_rating.desc' } },
  { id: 'world_cinema',  label: '🌍 World cinema',   filters: { sortBy: 'ff_rating.desc' } },
  { id: 'cult_classics', label: '🔮 Cult classics',  filters: { sortBy: 'cult_status_score.desc', vibe: ['cult'] } },
  { id: 'easy_watch',    label: '😌 Easy watch',     filters: { attention: 'low', intensity: 'chill', sortBy: 'ff_rating.desc' } },
  { id: 'short_films',   label: '⏱ Short & sharp',  filters: { runtime: 'short', sortBy: 'ff_rating.desc' } },
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
            : 'border-white/10 bg-white/[0.05] text-white/60 hover:border-white/20 hover:bg-white/[0.08] hover:text-white/80'
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
                  : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/18 hover:text-white/80'
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
          : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/18 hover:text-white/80'
      }`}
    >
      <span>{option.emoji}</span>
      <span>{option.label}</span>
    </button>
  )
}

const GAP_OPTIONS = [
  { value: '',               label: 'Off' },
  { value: 'critic_picks',   label: "Critics' picks" },
  { value: 'crowd_pleasers', label: 'Crowd-pleasers' },
]

function RatingSlider({ label, labelSuffix, value, onChange, disabled }) {
  const numValue = Number(value) || 0
  return (
    <div className={disabled ? 'opacity-40' : ''}>
      <p className="mb-2 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-widest"
        style={{ color: 'rgba(248,250,252,0.35)' }}>
        {label}
        {numValue > 0 && (
          <span className="normal-case tracking-normal font-semibold text-purple-300">
            {'\u2265'} {numValue}
          </span>
        )}
        {labelSuffix && (
          <span className="normal-case tracking-normal font-normal" style={{ color: 'rgba(248,250,252,0.3)' }}>
            {labelSuffix}
          </span>
        )}
      </p>
      <input
        type="range"
        min={0}
        max={90}
        step={5}
        value={numValue}
        onChange={(e) => onChange(e.target.value === '0' ? '' : e.target.value)}
        disabled={disabled}
        aria-label={`${label} minimum`}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-purple-500 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-300/50 [&::-webkit-slider-thumb]:shadow-md"
      />
      <div className="flex justify-between mt-1 text-[0.58rem]" style={{ color: 'rgba(248,250,252,0.2)' }}>
        <span>Off</span>
        <span>90</span>
      </div>
    </div>
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
  director = '',
  hideWatched = '',
  dialogue = '',
  attention = '',
  minCritic = '',
  minAudience = '',
  criticAudienceGap = '',
  exceptionalGenre = '',
  user = null,
  onSearch,
}) {
  const [draftQuery, setDraftQuery] = useState(query)
  const [draftDirector, setDraftDirector] = useState(director)
  const [genres, setGenres] = useState([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [activePreset, setActivePreset] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => { setDraftQuery(query) }, [query])
  useEffect(() => { setDraftDirector(director) }, [director])

  useEffect(() => {
    getDbGenres()
      .then(setGenres)
      .catch(console.error)
  }, [])

  const isSearchMode = draftQuery.trim().length > 0

  // Count active advanced filters for the badge (TMDB mode only counts compatible filters)
  const advancedCount = isSearchMode
    ? [minRating, runtime].filter(Boolean).length
    : [minRating, runtime, pacing, intensity, depth, director, dialogue, attention, minCritic, minAudience, criticAudienceGap, exceptionalGenre, ...vibe].filter(Boolean).length

  const hasAnyFilter = genre || decade || language || sortBy !== DEFAULT_SORT || advancedCount > 0 || draftQuery || hideWatched

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch({ q: draftQuery, genre, sortBy, decade, minRating, language, runtime, pacing, intensity, depth, vibe, director: draftDirector, hideWatched, dialogue, attention, minCritic, minAudience, criticAudienceGap, exceptionalGenre })
  }

  const handleClearSearch = () => {
    setDraftQuery('')
    onSearch({ q: '', genre, sortBy, decade, minRating, language, runtime, pacing, intensity, depth, vibe, director, hideWatched, dialogue, attention, minCritic, minAudience, criticAudienceGap, exceptionalGenre })
    inputRef.current?.focus()
  }

  const handleClearAll = () => {
    setDraftQuery('')
    setDraftDirector('')
    setActivePreset(null)
    setPanelOpen(false)
    onSearch({ q: '', genre: '', sortBy: DEFAULT_SORT, decade: '', minRating: '', language: '', runtime: '', pacing: '', intensity: '', depth: '', vibe: [], director: '', hideWatched: '', dialogue: '', attention: '', minCritic: '', minAudience: '', criticAudienceGap: '', exceptionalGenre: '' })
  }

  const applyFilter = (patch) => {
    setActivePreset(null)
    onSearch({ q: draftQuery, genre, sortBy, decade, minRating, language, runtime, pacing, intensity, depth, vibe, director, hideWatched, dialogue, attention, minCritic, minAudience, criticAudienceGap, exceptionalGenre, ...patch })
  }

  const handlePreset = (preset) => {
    if (activePreset === preset.id) {
      setActivePreset(null)
      onSearch({ q: draftQuery, genre: '', sortBy: DEFAULT_SORT, decade: '', minRating: '', language: '', runtime: '', pacing: '', intensity: '', depth: '', vibe: [], director: '', hideWatched, dialogue: '', attention: '', minCritic: '', minAudience: '', criticAudienceGap: '', exceptionalGenre: '' })
    } else {
      setActivePreset(preset.id)
      onSearch({
        q: draftQuery,
        genre: '', sortBy: DEFAULT_SORT, decade: '', minRating: '', language: '',
        runtime: '', pacing: '', intensity: '', depth: '', vibe: [],
        director: '', hideWatched, dialogue: '', attention: '',
        minCritic: '', minAudience: '', criticAudienceGap: '', exceptionalGenre: '',
        ...preset.filters,
      })
    }
  }

  const toggleVibe = (val) => {
    const next = vibe.includes(val) ? vibe.filter(v => v !== val) : [...vibe, val]
    applyFilter({ vibe: next })
  }

  const genreOptions = [
    { value: '', label: 'All Genres' },
    ...genres.map((g) => ({ value: g.name, label: g.name })),
  ]

  // Build active filter chips for quick dismissal
  const activeFilters = [
    genre && { key: 'genre', label: genre, clear: () => applyFilter({ genre: '' }) },
    decade && { key: 'decade', label: DECADE_OPTIONS.find(d => d.value === decade)?.label, clear: () => applyFilter({ decade: '' }) },
    language && { key: 'language', label: LANGUAGE_OPTIONS.find(l => l.value === language)?.label, clear: () => applyFilter({ language: '' }) },
    minRating && { key: 'rating', label: `${minRating}+ rating`, clear: () => applyFilter({ minRating: '' }) },
    director && { key: 'director', label: `Dir: ${director}`, clear: () => { setDraftDirector(''); applyFilter({ director: '' }) } },
    pacing && { key: 'pacing', label: pacing === 'slow' ? 'Slow burn' : 'Fast-paced', clear: () => applyFilter({ pacing: '' }) },
    intensity && { key: 'intensity', label: intensity === 'chill' ? 'Chill' : 'Intense', clear: () => applyFilter({ intensity: '' }) },
    dialogue && { key: 'dialogue', label: DIALOGUE_OPTIONS.find(d => d.value === dialogue)?.label, clear: () => applyFilter({ dialogue: '' }) },
    attention && { key: 'attention', label: ATTENTION_OPTIONS.find(a => a.value === attention)?.label, clear: () => applyFilter({ attention: '' }) },
    hideWatched && { key: 'hideWatched', label: 'Hide watched', clear: () => applyFilter({ hideWatched: '' }) },
    minCritic && { key: 'minCritic', label: `Critics \u2265 ${minCritic}`, clear: () => applyFilter({ minCritic: '' }) },
    minAudience && { key: 'minAudience', label: `Audience \u2265 ${minAudience}`, clear: () => applyFilter({ minAudience: '' }) },
    criticAudienceGap && { key: 'gap', label: GAP_OPTIONS.find(g => g.value === criticAudienceGap)?.label ?? criticAudienceGap, clear: () => applyFilter({ criticAudienceGap: '' }) },
    exceptionalGenre && { key: 'genreTop', label: 'Exceptional for genre', clear: () => applyFilter({ exceptionalGenre: '' }) },
    ...vibe.map(v => ({ key: `vibe-${v}`, label: VIBE_OPTIONS.find(o => o.value === v)?.label ?? v, clear: () => toggleVibe(v) })),
  ].filter(Boolean)

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
            className="h-11 w-full rounded-full border border-white/10 bg-white/[0.06] pl-11 pr-10 text-[0.92rem] text-white placeholder:text-white/40 transition-colors focus:border-purple-400/40 focus:bg-white/[0.09] focus:outline-none"
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

      {/* ── Row 2: Quick presets ─────────────────────────────────────────── */}
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PRESETS.map(preset => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handlePreset(preset)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all duration-150 ${
              activePreset === preset.id
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:text-white/80 hover:border-white/20'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* ── Row 3: Quick filter pills ────────────────────────────────────── */}
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
            to showing the default until they pick a TMDB-compatible sort. */}
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
              : 'border-white/10 bg-white/[0.05] text-white/60 hover:border-white/20 hover:text-white/80'
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

        {/* Hide watched toggle — logged-in users only */}
        {user && (
          <button
            type="button"
            onClick={() => applyFilter({ hideWatched: hideWatched ? '' : '1' })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              hideWatched
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                : 'bg-white/[0.04] border-white/10 text-white/60 hover:text-white/80'
            }`}
          >
            {hideWatched ? '✓ ' : ''}Hide watched
          </button>
        )}

        {hasAnyFilter && (
          <button
            type="button"
            onClick={handleClearAll}
            className="ml-1 inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 text-[0.76rem] font-medium text-white/40 transition-colors hover:text-white/70"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* ── Active filter chips ───────────────────────────────────────────── */}
      {activeFilters.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {activeFilters.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={f.clear}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 transition-colors"
            >
              {f.label}
              <X className="w-3 h-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2.5 py-1 rounded-full text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Advanced filter panel ─────────────────────────────────────────── */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: panelOpen ? '900px' : '0px' }}
      >
        <div
          className="mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border p-5"
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

            {/* Dialogue — Supabase browse only */}
            <SegmentGroup
              label="Dialogue"
              labelSuffix={isSearchMode ? 'browse only' : null}
              options={DIALOGUE_OPTIONS}
              value={dialogue}
              onChange={(v) => applyFilter({ dialogue: v })}
              disabled={isSearchMode}
            />

            {/* Attention — Supabase browse only */}
            <SegmentGroup
              label="Attention"
              labelSuffix={isSearchMode ? 'browse only' : null}
              options={ATTENTION_OPTIONS}
              value={attention}
              onChange={(v) => applyFilter({ attention: v })}
              disabled={isSearchMode}
            />

            {/* Critics floor — Supabase browse only */}
            <RatingSlider
              label="Critics love it"
              labelSuffix={isSearchMode ? 'browse only' : null}
              value={minCritic}
              onChange={(v) => applyFilter({ minCritic: v })}
              disabled={isSearchMode}
            />

            {/* Audience floor — Supabase browse only */}
            <RatingSlider
              label="Audiences love it"
              labelSuffix={isSearchMode ? 'browse only' : null}
              value={minAudience}
              onChange={(v) => applyFilter({ minAudience: v })}
              disabled={isSearchMode}
            />

            {/* Critic/audience gap — Supabase browse only */}
            <SegmentGroup
              label="Critic / audience gap"
              labelSuffix={isSearchMode ? 'browse only' : null}
              options={GAP_OPTIONS}
              value={criticAudienceGap}
              onChange={(v) => applyFilter({ criticAudienceGap: v })}
              disabled={isSearchMode}
            />

            {/* Exceptional for genre — Supabase browse only */}
            <div className={isSearchMode ? 'opacity-40' : ''}>
              <p className="mb-2 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(248,250,252,0.35)' }}>
                Genre excellence
                {isSearchMode && (
                  <span className="normal-case tracking-normal font-normal" style={{ color: 'rgba(248,250,252,0.3)' }}>
                    browse only
                  </span>
                )}
              </p>
              <button
                type="button"
                disabled={isSearchMode}
                onClick={() => applyFilter({ exceptionalGenre: exceptionalGenre ? '' : '1' })}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-[0.76rem] font-medium transition-all duration-150 ${
                  isSearchMode ? 'cursor-not-allowed opacity-30' :
                  exceptionalGenre
                    ? 'border-purple-400/60 bg-purple-500/20 text-purple-200'
                    : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/18 hover:text-white/80'
                }`}
              >
                <Award className="h-3.5 w-3.5" />
                Exceptional for genre
              </button>
            </div>

            {/* Director — Supabase browse only */}
            <div className={isSearchMode ? 'opacity-40' : ''}>
              <p className="mb-2 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(248,250,252,0.35)' }}>
                Director
                {isSearchMode && (
                  <span className="normal-case tracking-normal font-normal" style={{ color: 'rgba(248,250,252,0.3)' }}>
                    browse only
                  </span>
                )}
              </p>
              <input
                type="text"
                placeholder="e.g. Christopher Nolan"
                value={draftDirector}
                onChange={e => setDraftDirector(e.target.value)}
                onBlur={() => applyFilter({ director: draftDirector })}
                onKeyDown={e => e.key === 'Enter' && applyFilter({ director: draftDirector })}
                disabled={isSearchMode}
                className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-white placeholder:text-white/20 focus:border-purple-400/40 focus:outline-none disabled:cursor-not-allowed"
              />
            </div>

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
                    setDraftDirector('')
                    applyFilter({ minRating: '', runtime: '', pacing: '', intensity: '', depth: '', vibe: [], director: '', dialogue: '', attention: '', minCritic: '', minAudience: '', criticAudienceGap: '', exceptionalGenre: '' })
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
