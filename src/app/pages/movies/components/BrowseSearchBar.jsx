import { useState } from "react";
import { Search as SearchIcon, X as XIcon } from "lucide-react";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export default function BrowseSearchBar({ onResults, onSearch, value }) {
  const [search, setSearch] = useState(value || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(search)}&include_adult=false&page=1`
    );
    const data = await res.json();
    setLoading(false);
    onResults((data.results || []).filter(m => !!m.title && m.poster_path), search);
    if (onSearch) onSearch(search);
  }

  function clearInput() {
    setSearch("");
    onResults([], "");
    if (onSearch) onSearch("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex items-center justify-center"
      style={{ marginBottom: 18 }}
    >
      <div className="
        relative flex items-center w-full
        bg-[#16161cdd] rounded-2xl shadow-2xl border border-orange-400/40
        focus-within:ring-2 focus-within:ring-orange-400
        browse-searchbar
      " style={{ maxWidth: 1200, minHeight: 45, backdropFilter: "blur(10px)" }}>
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={22} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search any movie…"
          className="w-full pl-12 pr-12 py-2 rounded-2xl bg-transparent text-white placeholder-zinc-400 text-lg font-bold outline-none transition"
          style={{ letterSpacing: "0.01em", height: 42 }}
        />
        {search && (
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
            absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-orange-400 to-red-500
            text-white font-bold text-base rounded-full shadow hover:scale-105 transition
            ${loading ? "opacity-70 pointer-events-none" : ""}
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
      </div>
      <style>{`
        @media (max-width: 600px) {
          .browse-searchbar input { font-size: 1rem !important; padding-top: 8px; padding-bottom: 8px; }
          .browse-searchbar { min-height: 40px !important; }
        }
      `}</style>
    </form>
  );
}
