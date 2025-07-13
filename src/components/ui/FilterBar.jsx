// components/FilterBar.jsx

/**
 * FilterBar renders sorting and filtering controls for movie grids.
 * - Accepts sorting, year, and genre filters.
 * - Calls relevant onChange handlers when user interacts.
 * - Used for both search results and watched history.
 */
export default function FilterBar({
  sortBy, setSortBy,
  yearFilter, setYearFilter,
  genreFilter, setGenreFilter,
  allYears, allGenres,
  sortOptions,
  clearFilters
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '1.2rem',
        marginBottom: '1.5rem',
        justifyContent: 'center',
        background: 'rgba(36,36,36,0.88)',
        borderRadius: '8px',
        padding: '0.7rem 1rem'
      }}
    >
      {/* Sorting */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span className="text-gray-400 text-xs mr-1">Sort:</span>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            background: '#18181b',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: 4,
            padding: '0.22rem 0.8rem',
            fontSize: 13
          }}
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>

      {/* Year */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span className="text-gray-400 text-xs mr-1">Year:</span>
        <select
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value)}
          style={{
            background: '#18181b',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: 4,
            padding: '0.22rem 0.8rem',
            fontSize: 13
          }}
        >
          <option value="">All</option>
          {allYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </label>

      {/* Genre */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span className="text-gray-400 text-xs mr-1">Genre:</span>
        <select
          value={genreFilter}
          onChange={e => setGenreFilter(e.target.value)}
          style={{
            background: '#18181b',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: 4,
            padding: '0.22rem 0.8rem',
            fontSize: 13
          }}
        >
          <option value="">All</option>
          {allGenres.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </label>

      {/* Clear All */}
      <button
        onClick={clearFilters}
        style={{
          background: '#3b3b3b',
          color: '#fff',
          border: 'none',
          borderRadius: 5,
          padding: '0.25rem 0.95rem',
          fontSize: 13,
          marginLeft: 8,
          cursor: 'pointer',
          fontWeight: 500,
          opacity: 0.95,
          transition: 'background 0.18s'
        }}
        onMouseOver={e => e.currentTarget.style.background='#444'}
        onMouseOut={e => e.currentTarget.style.background='#3b3b3b'}
      >
        Clear All
      </button>
    </div>
  );
}
