export default function FilterBar({
  sortBy, setSortBy,
  yearFilter, setYearFilter,
  genreFilter, setGenreFilter,
  allYears, allGenres,
  sortOptions,
  clearFilters
}) {
  return (
    <div className="w-full flex flex-wrap gap-2 md:gap-4 justify-center md:justify-start items-center py-2 px-2 rounded-2xl bg-[#18141cdd] shadow-md border border-zinc-800 mb-2" style={{ backdropFilter: "blur(7px)" }}>
      {/* Sort */}
      <select
        value={sortBy}
        onChange={e => setSortBy(e.target.value)}
        className="filter-pill"
        aria-label="Sort by"
      >
        {sortOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Year */}
      <select
        value={yearFilter}
        onChange={e => setYearFilter(e.target.value)}
        className="filter-pill"
        aria-label="Year"
      >
        <option value="">Year</option>
        {allYears.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      {/* Genre */}
      <select
        value={genreFilter}
        onChange={e => setGenreFilter(e.target.value)}
        className="filter-pill"
        aria-label="Genre"
      >
        <option value="">Genre</option>
        {allGenres.map(g => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>

      {/* Clear */}
      <button
        onClick={clearFilters}
        className="ml-2 px-3 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-semibold text-xs shadow transition border border-zinc-800"
        type="button"
        aria-label="Clear filters"
      >
        Clear
      </button>

      <style>{`
        .filter-pill {
          border-radius: 9999px;
          padding: 0.45rem 1.1rem;
          background: #211c27bb;
          border: 1px solid #252233;
          color: #fff;
          font-weight: 600;
          font-size: 0.98rem;
          transition: border .18s, box-shadow .18s;
          outline: none;
        }
        .filter-pill:focus {
          border-color: #fb923c;
          box-shadow: 0 0 0 2px #fb923c33;
        }
        .filter-pill option {
          color: #19181e;
        }
      `}</style>
    </div>
  );
}
