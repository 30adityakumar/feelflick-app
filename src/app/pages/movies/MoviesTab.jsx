import { useState, useEffect } from "react";
import BrowseSearchBar from "@/app/pages/movies/components/BrowseSearchBar";
import FilterBar from "@/app/pages/shared/FilterBar";
import ResultsGrid from "@/app/pages/movies/components/ResultsGrid";
import { Pagination } from "@/app/pages/movies/components/Pagination";
import { supabase } from "@/shared/lib/supabase/client";

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "release_date.desc", label: "Newest First" },
  { value: "release_date.asc", label: "Oldest First" },
  { value: "vote_average.desc", label: "Top Rated" },
  { value: "vote_average.asc", label: "Lowest Rated" }
];

export default function MoviesTab({ session }) {
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [genreMap, setGenreMap] = useState({});
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [yearFilter, setYearFilter] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // --- Fetch genres on mount ---
  useEffect(() => {
    fetch(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US`
    )
      .then(res => res.json())
      .then(({ genres }) => setGenreMap(
        Object.fromEntries(genres.map(g => [g.id, g.name]))
      ))
      .catch(console.error);
  }, []);

  // --- Fetch movies (search or discover) when page/filter/search changes ---
  useEffect(() => {
    let url, params = [];
    if (query) {
      url = `https://api.themoviedb.org/3/search/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(query)}&include_adult=false&page=${page}`;
    } else {
      url = `https://api.themoviedb.org/3/discover/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&sort_by=${sortBy}&page=${page}&with_original_language=en`;
      if (yearFilter) params.push(`primary_release_year=${yearFilter}`);
      if (genreFilter) params.push(`with_genres=${genreFilter}`);
      if (!yearFilter) {
        const thisYear = new Date().getFullYear();
        params.push(`primary_release_date.gte=${thisYear - 3}-01-01`);
        params.push(`primary_release_date.lte=${new Date().toISOString().slice(0, 10)}`);
      }
      if (params.length) url += "&" + params.join("&");
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setResults((data.results || []).filter(m => m.title && m.poster_path));
        setTotalResults(data.total_results || 0);
        setTotalPages(Math.min(data.total_pages || 1, 500));
      })
      .catch(console.error);
  }, [sortBy, yearFilter, genreFilter, query, page]);

  // --- Clear filters and reset page ---
  const clearFilters = () => {
    setSortBy("popularity.desc");
    setYearFilter("");
    setGenreFilter("");
    setPage(1);
  };

  // --- Years & genres for filter bar ---
  const allYears = Array.from(new Set(results.map(m => m.release_date && new Date(m.release_date).getFullYear()).filter(Boolean))).sort((a, b) => b - a);
  const allGenres = (() => {
    const genreIdSet = new Set();
    results.forEach(m =>
      Array.isArray(m.genre_ids) &&
      m.genre_ids.forEach(id => genreIdSet.add(id))
    );
    return Array.from(genreIdSet)
      .filter(id => genreMap[id])
      .map(id => ({ id, name: genreMap[id] }))
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  // --- Enhanced onResults for SearchBar ---
  function handleSearchResults(searchResults, searchText) {
    setQuery(searchText || "");
    setResults(searchResults || []);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-[#101015] w-full pb-20 pt-4 px-0 sm:px-4 md:px-10 lg:px-20 xl:px-32 box-border">
      {/* Filter Bar */}
      <div className="w-full max-w-[1200px] mx-auto px-2 pt-1 pb-2">
        <FilterBar
          sortBy={sortBy}
          setSortBy={setSortBy}
          yearFilter={yearFilter}
          setYearFilter={setYearFilter}
          genreFilter={genreFilter}
          setGenreFilter={setGenreFilter}
          allYears={allYears}
          allGenres={allGenres}
          sortOptions={SORT_OPTIONS}
          clearFilters={clearFilters}
        />
      </div>
      {/* Search Bar */}
      <div className="w-full flex justify-center px-2 mb-3">
        <div className="w-full max-w-[1200px]">
          <BrowseSearchBar
            onResults={handleSearchResults}
            onSearch={setQuery}
            value={query}
          />
        </div>
      </div>

      {/* Section Title */}
      <div className="max-w-6xl mx-auto font-bold text-lg md:text-xl text-white mt-2 mb-6 flex items-center gap-2 px-3">
        {query
          ? <><span role="img" aria-label="search" className="text-2xl">🔍</span> Search Results</>
          : <><span role="img" aria-label="popcorn" className="text-2xl">🍿</span> Recent Releases</>
        }
      </div>

      {/* Movie Results: 5 in a row, 20 per page, responsive */}
      <div className="max-w-[1240px] mx-auto min-h-[240px] pb-1 px-1 sm:px-4">
        {results.length ? (
          <>
            <ResultsGrid
              results={results.slice(0, 20)}
              onMovieClick={m => {/* open modal, etc. */}}
            />
            <Pagination
              page={page}
              setPage={setPage}
              totalPages={totalPages}
            />
          </>
        ) : (
          <div className="text-zinc-400 text-center text-base md:text-lg font-medium my-16">
            <span role="img" aria-label="No results" className="block text-3xl mb-2">😕</span>
            No movies found. Try a different search!
          </div>
        )}
      </div>
    </div>
  );
}
