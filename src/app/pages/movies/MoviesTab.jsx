import { useState, useEffect } from "react";
import BrowseSearchBar from "@/app/pages/movies/components/BrowseSearchBar"; // use the enhanced one provided above
import FilterBar from "@/app/pages/shared/FilterBar";
import ResultsGrid from "@/app/pages/movies/components/ResultsGrid";
import { Pagination } from "@/app/pages/movies/components/Pagination"; // use the Pagination component above
import { supabase } from "@/shared/lib/supabase/client";

// TMDb sort options
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
  const [watched, setWatched] = useState([]);
  const [modalMovie, setModalMovie] = useState(null);
  const closeModal = () => setModalMovie(null);

  // Fetch genres
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

  // Fetch watched (for disabling "watched" button)
  useEffect(() => {
    if (!session?.user?.id) return;
    supabase
      .from("movies_watched")
      .select("*")
      .eq("user_id", session.user.id)
      .order("id", { ascending: false })
      .then(({ data }) => setWatched(data || []));
  }, [session]);

  // Fetch movies (either discover or search) when page/filter/search changes
  useEffect(() => {
    let url, params = [];
    if (query) {
      url = `https://api.themoviedb.org/3/search/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(query)}&include_adult=false&page=${page}`;
    } else {
      url = `https://api.themoviedb.org/3/discover/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&sort_by=${sortBy}&page=${page}&with_original_language=en`;
      if (yearFilter) params.push(`primary_release_year=${yearFilter}`);
      if (genreFilter) params.push(`with_genres=${genreFilter}`);
      // Only fetch recent movies (past 3 years) if not filtered by year
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
        setTotalPages(Math.min(data.total_pages || 1, 500)); // TMDb caps at 500
      })
      .catch(console.error);
  }, [sortBy, yearFilter, genreFilter, query, page]);

  // Clear filters and reset page
  const clearFilters = () => {
    setSortBy("popularity.desc");
    setYearFilter("");
    setGenreFilter("");
    setPage(1);
  };

  // Mark as watched
  const watchedIds = new Set(watched.map(m => m.movie_id));
  const markWatched = async (movie) => {
    if (!session || watchedIds.has(movie.id)) return;
    const { error } = await supabase.from("movies_watched").insert({
      user_id: session.user.id,
      movie_id: movie.id,
      title: movie.title,
      poster: movie.poster_path,
      release_date: movie.release_date ?? null,
      vote_average: movie.vote_average ?? null,
      genre_ids: movie.genre_ids ?? []
    });
    if (error && error.code !== "23505") return;
    const { data } = await supabase
      .from("movies_watched")
      .select("*")
      .eq("user_id", session.user.id)
      .order("id", { ascending: false });
    setWatched(data);
  };

  // Years & genres for filter bar (from all loaded results)
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

  // Section title
  const sectionTitle = query
    ? (
      <>
        <span role="img" aria-label="search" className="text-2xl">🔍</span>
        Search Results
      </>
    )
    : (
      <>
        <span role="img" aria-label="popcorn" className="text-2xl">🍿</span>
        Recent Releases
      </>
    );

  // Enhanced onResults for SearchBar
  function handleSearchResults(searchResults, searchText) {
    setQuery(searchText || "");
    setResults(searchResults || []);
    setPage(1); // always go to first page on new search
  }

  return (
    <div className="min-h-screen bg-[#101015] w-full pb-16 px-2 sm:px-6 md:px-10 lg:px-20 xl:px-32 box-border">
      {/* Search Bar */}
      <div className="flex items-center justify-center w-full pt-8 pb-3">
        <BrowseSearchBar
          onResults={handleSearchResults}
          onSearch={setQuery}
          value={query}
        />
      </div>

      {/* Filter Bar */}
      <div className="max-w-3xl mx-auto w-full mb-5">
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

      {/* Section Title */}
      <div className="max-w-6xl mx-auto font-bold text-xl md:text-2xl text-white mt-3 mb-6 flex items-center gap-2">
        {sectionTitle}
      </div>

      {/* Movie Results Grid */}
      <div className="max-w-6xl mx-auto min-h-[260px]">
        {results.length ? (
          <>
            <ResultsGrid
              results={results}
              onMovieClick={setModalMovie}
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
