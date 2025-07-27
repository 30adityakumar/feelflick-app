import { useState, useEffect } from "react";
import Search from "@/app/pages/movies/components/Search";
import FilterBar from "@/app/pages/shared/FilterBar";
import ResultsGrid from "@/app/pages/movies/components/ResultsGrid";
import { supabase } from "@/shared/lib/supabase/client";

// You can extend this to include more TMDb options
const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "release_date.desc", label: "Newest First" },
  { value: "release_date.asc", label: "Oldest First" },
  { value: "vote_average.desc", label: "Top Rated" },
  { value: "vote_average.asc", label: "Lowest Rated" }
];

export default function MoviesTab({ session }) {
  // State for movies, genres, filters, etc.
  const [results, setResults] = useState([]);
  const [genreMap, setGenreMap] = useState({});
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [yearFilter, setYearFilter] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [query, setQuery] = useState("");      // track search query
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

  // --- 1. Auto-load recent releases, or filtered releases if filters change ---
  useEffect(() => {
    if (query) return; // Don't overwrite search results

    // Build TMDb discover query
    let url = `https://api.themoviedb.org/3/discover/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&sort_by=${sortBy}&page=1&with_original_language=en`;
    if (yearFilter) url += `&primary_release_year=${yearFilter}`;
    if (genreFilter) url += `&with_genres=${genreFilter}`;
    // Only fetch recent movies (past 3 years) if not filtered by year
    if (!yearFilter) {
      const thisYear = new Date().getFullYear();
      url += `&primary_release_date.gte=${thisYear - 3}-01-01`;
      url += `&primary_release_date.lte=${new Date().toISOString().slice(0, 10)}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(({ results }) => setResults((results || []).filter(m => m.title && m.poster_path)))
      .catch(console.error);
  }, [sortBy, yearFilter, genreFilter, query]);

  // --- 2. Search Handler ---
  function handleSearchResults(searchResults, searchQuery) {
    setQuery(searchQuery || "");
    setResults((searchResults || []).filter(m => m.title && m.poster_path));
  }

  // --- 3. Filter and sorting options ---
  const watchedIds = new Set(watched.map(m => m.movie_id));
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
  const clearFilters = () => {
    setSortBy("popularity.desc");
    setYearFilter("");
    setGenreFilter("");
  };

  // --- 4. Mark as watched ---
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
    // Refresh watched
    const { data } = await supabase
      .from("movies_watched")
      .select("*")
      .eq("user_id", session.user.id)
      .order("id", { ascending: false });
    setWatched(data);
  };

  // --- 5. Section title ---
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

  // --- 6. Render ---
  return (
    <div className="min-h-screen bg-[#101015] w-full pb-12 px-3 sm:px-6 md:px-10 lg:px-20 xl:px-32 box-border">
      {/* Search Bar */}
      <div className="max-w-2xl mx-auto w-full mb-7">
        <Search
          onResults={(searchResults) => handleSearchResults(searchResults, searchResults.length ? query : "")}
          // ^ You may want to pass searchQuery if your Search component exposes it
        />
      </div>

      {/* Filter Bar */}
      <div className="max-w-3xl mx-auto w-full mb-7">
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
      <div className="max-w-6xl mx-auto font-bold text-lg md:text-xl text-white mt-2 mb-5 flex items-center gap-2">
        {sectionTitle}
      </div>

      {/* Movie Results */}
      <div className="max-w-6xl mx-auto min-h-[200px]">
        {results.length ? (
          <ResultsGrid
            results={results}
            genreMap={genreMap}
            onMarkWatched={markWatched}
            watchedIds={watchedIds}
            gridClass="movie-grid"
            onMovieClick={setModalMovie}
          />
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
