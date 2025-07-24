import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, X as XIcon } from "lucide-react";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export default function SearchBar() {
  const navigate = useNavigate();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const searchDebounce = useRef();

  // TMDb-powered search
  useEffect(() => {
    if (!search) { setResults([]); setIsLoading(false); return; }
    setIsLoading(true);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(search)}&include_adult=false&page=1`
      )
        .then(res => res.json())
        .then(data => {
          setResults(
            (data.results || [])
              .filter(m => !!m.title && m.poster_path)
              .slice(0, 10)
              .map(m => ({
                id: m.id,
                title: m.title,
                year: m.release_date ? m.release_date.slice(0, 4) : "",
                poster: `https://image.tmdb.org/t/p/w92${m.poster_path}`,
              }))
          );
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }, 220);
    return () => clearTimeout(searchDebounce.current);
  }, [search]);

  // Keyboard: / focuses search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        if (window.innerWidth < 640) setShowMobileSearch(true);
        else inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const clearSearch = () => {
    setSearch("");
    setResults([]);
    setSearchOpen(false);
    setShowMobileSearch(false);
    inputRef.current?.blur();
  };

  // --- Search results dropdown ---
  function SearchResultsDropdown({ mobile }) {
    if (!search && !isLoading) return null;
    return (
      <div className={`absolute left-0 right-0 ${mobile ? "top-16" : "top-12"} bg-[#191820] rounded-xl shadow-2xl z-40 p-1 mt-1 ring-1 ring-zinc-800 animate-fadeIn`}>
        {isLoading && (
          <div className="flex items-center justify-center text-orange-400 py-4">
            <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading…
          </div>
        )}
        {!isLoading && results.length > 0 && results.map(m => (
          <div
            key={m.id}
            onClick={() => {
              clearSearch();
              navigate(`/movie/${m.id}`);
            }}
            className="flex items-center gap-3 cursor-pointer px-4 py-2 text-white text-[15px] font-sans rounded-lg transition hover:bg-[#23212b]"
          >
            <img src={m.poster} alt={m.title} className="w-9 h-13 rounded-md shadow border border-zinc-700 bg-[#16151c] object-cover" />
            <span>{m.title}{m.year && <span className="ml-1 text-zinc-400">({m.year})</span>}</span>
          </div>
        ))}
        {!isLoading && search && results.length === 0 && (
          <div className="text-zinc-400 text-center px-5 py-3">No results.</div>
        )}
      </div>
    );
  }

  // --- Mobile search modal ---
  function MobileSearchModal() {
    return (
      <div className="fixed inset-0 bg-[#101016f2] z-50 flex items-start pt-10 px-3 animate-fadeIn">
        <div className="relative w-full max-w-xl mx-auto">
          <button
            className="absolute right-3 top-3 text-zinc-300 hover:text-orange-400"
            onClick={clearSearch}
            aria-label="Close search"
          >
            <XIcon size={27} />
          </button>
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#23212b] text-white text-xl rounded-xl pl-4 pr-12 py-3 outline-none font-semibold focus:ring-2 focus:ring-orange-400"
            placeholder="Search movies…"
          />
          {search && (
            <button
              className="absolute right-12 top-4 text-zinc-400 hover:text-red-400"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <XIcon size={21} />
            </button>
          )}
          <SearchResultsDropdown mobile />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Search Bar */}
      <div className="flex-1 flex justify-center px-2 relative max-w-[430px]">
        <div className="relative w-full" ref={inputRef}>
          <input
            value={search}
            onFocus={() => setSearchOpen(true)}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search movies…"
            className={`
              w-full bg-[#23212b] text-white text-base rounded-full pl-4 pr-11 py-2
              border-none outline-none font-sans shadow
              transition duration-200
              focus:ring-2 focus:ring-orange-400
            `}
            style={{ fontFamily: "Inter, sans-serif" }}
          />
          {search && (
            <button
              className="absolute right-8 top-2.5 text-zinc-400 hover:text-red-400"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <XIcon size={18} />
            </button>
          )}
          <SearchIcon
            size={20}
            color="#aaa"
            className="absolute right-3 top-2.5 pointer-events-none"
          />
          {searchOpen && <SearchResultsDropdown />}
        </div>
      </div>

      {/* Mobile Search Modal */}
      {showMobileSearch && <MobileSearchModal />}

      {/* Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(12px);}
            to { opacity: 1; transform: translateY(0);}
          }
          .animate-fadeIn {
            animation: fadeIn 0.21s cubic-bezier(.33,1,.68,1) both;
          }
        `}
      </style>
    </>
  );
}
