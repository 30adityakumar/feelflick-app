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
              .slice(0, window.innerWidth < 640 ? 5 : 8)
              .map(m => ({
                id: m.id,
                title: m.title,
                year: m.release_date ? m.release_date.slice(0, 4) : "",
                poster: `https://image.tmdb.org/t/p/w154${m.poster_path}`,
              }))
          );
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }, 220);
    return () => clearTimeout(searchDebounce.current);
  }, [search]);

  // Keyboard shortcuts and dropdown nav
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        if (window.innerWidth < 640) setShowMobileSearch(true);
        else inputRef.current?.focus();
      }
      if (searchOpen && results.length > 0) {
        if (["ArrowDown", "ArrowUp"].includes(e.key)) {
          e.preventDefault();
          setHighlighted(prev => {
            if (e.key === "ArrowDown") return prev < results.length - 1 ? prev + 1 : 0;
            if (e.key === "ArrowUp") return prev > 0 ? prev - 1 : results.length - 1;
            return prev;
          });
        }
        if (e.key === "Enter" && highlighted >= 0 && results[highlighted]) {
          e.preventDefault();
          handleSelect(results[highlighted]);
        }
        if (e.key === "Escape") {
          setSearchOpen(false);
          setHighlighted(-1);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, results, highlighted]);

  // Click outside dropdown to close
  useEffect(() => {
    function handleClick(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !inputRef.current.contains(e.target)
      ) {
        setSearchOpen(false);
        setHighlighted(-1);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const clearSearch = () => {
    setSearch("");
    setResults([]);
    setSearchOpen(false);
    setShowMobileSearch(false);
    setHighlighted(-1);
    inputRef.current?.blur();
  };

  function handleSelect(movie) {
    clearSearch();
    navigate(`/movie/${movie.id}`);
  }

  function highlightMatch(title, query) {
    if (!query) return title;
    const i = title.toLowerCase().indexOf(query.toLowerCase());
    if (i === -1) return title;
    return (
      <>
        {title.slice(0, i)}
        <b className="font-bold bg-clip-text text-orange-300">{title.slice(i, i + query.length)}</b>
        {title.slice(i + query.length)}
      </>
    );
  }

  // --- Search results dropdown ---
  function SearchResultsDropdown({ mobile }) {
    if (!search && !isLoading) return null;
    return (
      <div
        ref={dropdownRef}
        className={`absolute left-0 right-0 ${mobile ? "top-16" : "top-12"}
            bg-[#191820] rounded-2xl shadow-2xl z-40 p-1 mt-1 ring-1 ring-orange-400/10
            transition-opacity duration-200
            ${searchOpen && results.length > 0 ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        style={{ maxHeight: "430px", overflowY: "auto" }}
      >
        {isLoading && (
          <div className="flex items-center justify-center text-orange-400 py-4">
            <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading…
          </div>
        )}
        {!isLoading && results.length > 0 &&
          results.map((m, idx) => (
            <div
              key={m.id}
              onClick={() => handleSelect(m)}
              className={`
                flex items-center gap-3 cursor-pointer px-2.5 py-2 rounded-lg transition
                ${highlighted === idx ? "bg-[#23212b] scale-[1.02] text-orange-300" : "hover:bg-[#23212b]"}
              `}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${m.title}`}
            >
              <img
                src={m.poster}
                alt={m.title}
                className="searchbar-poster shadow border border-zinc-700 bg-[#16151c] object-cover"
                style={{ display: "block" }}
              />
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-[16px] truncate">
                  {highlightMatch(m.title, search)}
                </span>
                <span className="text-xs text-zinc-400">
                  {m.year}
                </span>
              </div>
            </div>
          ))
        }
        {!isLoading && search && results.length === 0 && (
          <div className="text-zinc-400 text-center px-5 py-3">No movies found. Try another title!</div>
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
            className="absolute right-3 top-3 text-zinc-300 hover:text-orange-400 bg-transparent border-none shadow-none outline-none"
            onClick={clearSearch}
            aria-label="Close search"
          >
            <XIcon size={27} />
          </button>
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#23212b] text-white text-xl rounded-full pl-4 pr-12 h-10 outline-none font-light placeholder-zinc-400"
            placeholder="Search movies…"
            aria-label="Search movies"
            onFocus={() => setSearchOpen(true)}
            style={{ boxShadow: "none", border: "none" }}
          />
          {search && (
            <button
              className="absolute right-12 top-4 text-zinc-400 hover:text-red-400 bg-transparent border-none shadow-none outline-none"
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
      <div className="relative w-full h-10 px-3 sm:px-5">
        <input
          value={search}
          ref={inputRef}
          onFocus={() => { setSearchOpen(true); setHighlighted(-1); }}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search movies…"
          aria-label="Search movies"
          className={`
            w-full h-10 bg-[#23212b] text-white text-base rounded-full pl-4 pr-11
            border-none outline-none font-sans font-light shadow
            transition duration-200 placeholder-zinc-400
          `}
          style={{
            fontFamily: "Inter, sans-serif",
            boxShadow: "none",
            border: "none",
          }}
          onKeyDown={e => {
            if (e.key === "ArrowDown" && results.length > 0) {
              setHighlighted(0);
            }
          }}
        />
        {search && (
          <button
            className="absolute right-8 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-400 bg-transparent border-none shadow-none outline-none p-0 m-0"
            onClick={clearSearch}
            aria-label="Clear search"
            tabIndex={0}
            style={{
              boxShadow: "none",
              border: "none",
              background: "transparent"
            }}
          >
            <XIcon size={18} />
          </button>
        )}
        <button
          tabIndex={0}
          aria-label="Search"
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center bg-transparent p-0 shadow-none border-none outline-none h-10"
          style={{
            boxShadow: "none",
            border: "none",
            background: "transparent",
            height: "40px"
          }}
        >
          <SearchIcon size={20} color="#aaa" />
        </button>
        {searchOpen && <SearchResultsDropdown />}
      </div>
      {/* Mobile Search Modal */}
      {showMobileSearch && <MobileSearchModal />}
      {/* Animations and Responsive Poster Sizing */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(12px);}
            to { opacity: 1; transform: translateY(0);}
          }
          .animate-fadeIn {
            animation: fadeIn 0.21s cubic-bezier(.33,1,.68,1) both;
          }
          @media (max-width: 600px) {
            .searchbar-poster {
              width: 33px !important;
              height: 49px !important;
              min-width: 33px !important;
              min-height: 49px !important;
              max-width: 33px !important;
              max-height: 49px !important;
              border-radius: 6px !important;
            }
          }
          @media (min-width: 601px) {
            .searchbar-poster {
              width: 44px !important;
              height: 66px !important;
              min-width: 44px !important;
              min-height: 66px !important;
              max-width: 44px !important;
              max-height: 66px !important;
              border-radius: 9px !important;
            }
          }
        `}
      </style>
    </>
  );
}
