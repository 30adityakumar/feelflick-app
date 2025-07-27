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
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchDebounce = useRef();

  // TMDb-powered search logic...
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
              .filter(m => m.title && m.poster_path)
              .slice(0, window.innerWidth < 640 ? 5 : 8)
              .map(m => ({
                id: m.id,
                title: m.title,
                year: m.release_date?.slice(0, 4) || "",
                poster: `https://image.tmdb.org/t/p/w154${m.poster_path}`,
              }))
          );
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }, 220);
    return () => clearTimeout(searchDebounce.current);
  }, [search]);

  // keyboard shortcuts, click-outside, etc (no change from your last version)...

  useEffect(() => {
    const onKey = e => {
      if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        window.innerWidth < 640 ? setShowMobileSearch(true) : inputRef.current?.focus();
      }
      if (searchOpen && results.length) {
        if (["ArrowDown", "ArrowUp"].includes(e.key)) {
          e.preventDefault();
          setHighlighted(p =>
            e.key === "ArrowDown"
              ? (p + 1) % results.length
              : (p - 1 + results.length) % results.length
          );
        }
        if (e.key === "Enter" && highlighted >= 0) handleSelect(results[highlighted]);
        if (e.key === "Escape") { setSearchOpen(false); setHighlighted(-1); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, results, highlighted]);

  useEffect(() => {
    const onClick = e => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !inputRef.current.contains(e.target)
      ) {
        setSearchOpen(false);
        setHighlighted(-1);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const clearSearch = () => {
    setSearch("");
    setResults([]);
    setSearchOpen(false);
    setShowMobileSearch(false);
    setHighlighted(-1);
    inputRef.current?.blur();
  };

  const handleSelect = movie => {
    clearSearch();
    navigate(`/movie/${movie.id}`);
  };

  // Results dropdown, etc, unchanged...

  const SearchResultsDropdown = ({ mobile = false }) => {
    if (!search && !isLoading) return null;
    return (
      <div
        ref={dropdownRef}
        className={`absolute left-0 right-0 ${mobile ? "top-16" : "top-12"}
          bg-[#191820] rounded-2xl shadow-2xl z-40 p-1 mt-1 ring-1 ring-orange-400/10
          transition-opacity duration-200
          ${searchOpen && results.length ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{ maxHeight: 430, overflowY: "auto" }}
      >
        {isLoading && (
          <div className="flex justify-center items-center text-orange-400 py-4">
            <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" d="M4 12a8 8 0 018-8v8z" fill="currentColor" />
            </svg>
            Loading…
          </div>
        )}
        {!isLoading && results.map((m, i) => (
          <div
            key={m.id}
            onClick={() => handleSelect(m)}
            className={`
              flex items-center gap-3 cursor-pointer px-2.5 py-2 rounded-lg transition
              ${i === highlighted ? "bg-[#23212b] scale-[1.02] text-orange-300" : "hover:bg-[#23212b]"}
            `}
          >
            <img
              src={m.poster}
              alt={m.title}
              className="search-poster border border-zinc-700 bg-[#16151c] object-cover shadow"
            />
            <div className="flex flex-col min-w-0">
              <span className="truncate text-[15px] font-semibold">{m.title}</span>
              <span className="text-xs text-zinc-400">{m.year}</span>
            </div>
          </div>
        ))}
        {!isLoading && search && !results.length && (
          <div className="text-center text-zinc-400 py-3">No movies found. Try another title!</div>
        )}
      </div>
    );
  };

  const renderInput = (mobile = false) => (
    <div className="flex items-center h-10 bg-[#23212b] rounded-full px-3 sm:px-5 w-full">
      <input
        ref={mobile ? undefined : inputRef}
        value={search}
        onFocus={() => { setSearchOpen(true); setHighlighted(-1); }}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search movies…"
        aria-label="Search movies"
        className="
          flex-1 h-10 bg-transparent text-white text-sm leading-tight
          pl-4 border-none outline-none font-light placeholder-zinc-500
        "
        style={{ fontFamily: "Inter, sans-serif", minWidth: 0 }}
        onKeyDown={e => { if (e.key === "ArrowDown" && results.length) setHighlighted(0); }}
      />
      {search && (
        <button
          onClick={clearSearch}
          aria-label="Clear search"
          className="inline-flex items-center justify-center h-10 w-10 text-zinc-400 hover:text-red-400 bg-transparent border-none shadow-none outline-none p-0 m-0"
          style={{
            border: "none",
            boxShadow: "none",
            background: "transparent",
          }}
        >
          <XIcon size={18} />
        </button>
      )}
      <button
        aria-label="Search"
        className="inline-flex items-center justify-center h-10 w-10 bg-transparent border-none shadow-none outline-none"
        style={{
          border: "none",
          boxShadow: "none",
          background: "transparent",
        }}
      >
        <SearchIcon size={18} color="#aaa" />
      </button>
    </div>
  );

  const MobileSearchModal = () => (
    <div className="fixed inset-0 bg-[#101016f2] z-50 flex items-start pt-10 px-3 animate-fadeIn">
      <div className="relative w-full max-w-xl mx-auto">
        {renderInput(true)}
        {searchOpen && <SearchResultsDropdown mobile />}
      </div>
    </div>
  );

  return (
    <>
      <div className="relative w-full h-10 px-3 sm:px-5">
        {renderInput()}
        {searchOpen && <SearchResultsDropdown />}
      </div>
      {showMobileSearch && <MobileSearchModal />}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); }
                            to   { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.22s both; }
        @media (max-width:600px){
          .search-poster{width:33px;height:49px;border-radius:6px}
        }
        @media (min-width:601px){
          .search-poster{width:44px;height:66px;border-radius:9px}
        }
      `}</style>
    </>
  );
}
