import { useState } from "react";
import { Search as SearchIcon, X as XIcon } from "lucide-react";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export default function Search({ onResults }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(query)}&include_adult=false&page=1`
    );
    const data = await res.json();
    onResults((data.results || []).filter(m => !!m.title && m.poster_path));
    setLoading(false);
  }

  function clearInput() {
    setQuery("");
    onResults([]);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="relative flex items-center bg-[#191820cc] rounded-full shadow-lg border border-zinc-800 transition-all focus-within:ring-2 focus-within:ring-orange-400"
      style={{ backdropFilter: "blur(7px)" }}
      role="search"
      aria-label="Search movies"
    >
      <SearchIcon
        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
        size={22}
        aria-hidden="true"
      />
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search for a movie…"
        className="
          w-full pl-12 pr-12 py-3 rounded-full bg-transparent
          text-white placeholder-zinc-400 text-lg
          outline-none font-semibold transition
        "
        autoFocus={false}
        aria-label="Search movies"
      />
      {query && (
        <button
          type="button"
          onClick={clearInput}
          className="absolute right-12 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-orange-400 transition"
          aria-label="Clear search"
        >
          <XIcon size={20} />
        </button>
      )}
      <button
        type="submit"
        className={`
          absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gradient-to-r from-orange-400 to-red-500
          text-white font-bold text-base rounded-full shadow hover:scale-105 transition
          ${loading ? "opacity-80 pointer-events-none" : ""}
        `}
        disabled={loading}
        aria-label="Search"
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : "Go"}
      </button>
    </form>
  );
}
