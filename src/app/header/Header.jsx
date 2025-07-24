import { useState, useRef, useEffect } from "react";
import { LogOut, SlidersHorizontal, User2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from '@assets/images/logo.png';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export default function Header({ user, onSignOut }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const menuRef = useRef();
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

  // Hide menu on click-away
  useEffect(() => {
    const onClick = (e) => {
      if (!inputRef.current?.contains(e.target)) setSearchOpen(false);
    };
    if (searchOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [searchOpen]);

  // Hide account dropdown on outside click
  useEffect(() => {
    const handle = (e) => { if (showMenu && menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showMenu]);

  // Keyboard: / focuses search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Handle sign out and redirect to homepage
  const handleSignOut = async () => {
    if (onSignOut) await onSignOut();
    navigate("/");
  };

  return (
    <header
      className="
        flex items-center justify-between w-full
        bg-[#14121a] px-4 py-2 md:px-6 md:py-2
        shadow-[0_1px_4px_rgba(0,0,0,0.13)]
        z-50 relative
      "
    >
      {/* Logo & Brand */}
      <div
        onClick={() => navigate("/app")}
        className="flex items-center gap-2 cursor-pointer min-w-[140px] select-none"
      >
        <img
          src={logo}
          alt="FeelFlick"
          className="h-9 w-9 rounded-xl shadow"
          draggable={false}
        />
        <span className="text-white text-2xl font-black font-sans tracking-tight -ml-1">
          FeelFlick
        </span>
      </div>

      {/* Search */}
      <div className="flex-1 flex justify-center px-2">
        <div className="relative w-full max-w-[410px]" ref={inputRef}>
          <input
            value={search}
            onFocus={() => setSearchOpen(true)}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search movies…"
            className={`
              w-full bg-[#23212b] text-white text-base rounded-full pl-4 pr-11 py-2
              border-none outline-none font-sans
              shadow ${results.length && searchOpen ? "shadow-lg" : ""}
              transition duration-200
              focus:ring-2 focus:ring-orange-400
            `}
            style={{ fontFamily: "Inter, sans-serif" }}
          />
          <Search
            size={20}
            color="#aaa"
            className="absolute right-3 top-2.5 pointer-events-none"
          />
          {/* Results dropdown */}
          {searchOpen && (
            <div
              className="
                absolute left-0 right-0 top-12 bg-[#191820] rounded-xl
                shadow-2xl z-20 p-1 mt-1
                ring-1 ring-zinc-800
                animate-fadeIn
              "
            >
              {isLoading && (
                <div className="flex items-center justify-center text-orange-400 py-4">
                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                  Loading…
                </div>
              )}
              {!isLoading && results.length > 0 && results.map(m => (
                <div
                  key={m.id}
                  onClick={() => {
                    setSearch(""); setResults([]); setSearchOpen(false);
                    navigate(`/movie/${m.id}`);
                  }}
                  className={`
                    flex items-center gap-3 cursor-pointer
                    px-4 py-2 text-white text-[15px]
                    font-sans rounded-lg transition
                    hover:bg-[#23212b]
                  `}
                >
                  <img src={m.poster}
                    alt={m.title}
                    className="w-9 h-13 rounded-md shadow border border-zinc-700 bg-[#16151c] object-cover"
                  />
                  <span>{m.title}{m.year && <span className="ml-1 text-zinc-400">({m.year})</span>}</span>
                </div>
              ))}
              {!isLoading && search && results.length === 0 && (
                <div className="text-zinc-400 text-center px-5 py-3">No results.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Account Dropdown */}
      <div className="relative min-w-[70px]" ref={menuRef}>
        <div
          onClick={() => setShowMenu(!showMenu)}
          className={`
            bg-[#3a3746] w-9 h-9 rounded-full flex items-center justify-center
            text-white font-bold font-sans text-lg cursor-pointer select-none
            shadow
            transition
          `}
        >
          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
        </div>
        {showMenu && (
          <div
            className="
              absolute right-0 top-12 bg-[#1f1d26] rounded-xl shadow-xl min-w-[185px] z-40
              p-1 pt-2
            "
          >
            <MenuItem icon={<User2 size={18} />} text="My Account" onClick={() => { navigate("/account"); setShowMenu(false); }} />
            <MenuItem icon={<SlidersHorizontal size={18} />} text="Preferences" onClick={() => { navigate("/preferences"); setShowMenu(false); }} />
            <div className="border-t border-zinc-800 my-2" />
            <MenuItem icon={<LogOut size={18} />} text="Sign Out" onClick={handleSignOut} />
          </div>
        )}
      </div>

      {/* Dropdown animation (add to global or here) */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(12px);}
            to { opacity: 1; transform: translateY(0);}
          }
          .animate-fadeIn {
            animation: fadeIn 0.22s cubic-bezier(.33,1,.68,1) both;
          }
        `}
      </style>
    </header>
  );
}

function MenuItem({ icon, text, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center px-4 py-2 text-white cursor-pointer font-sans text-[15px] rounded-lg
        transition duration-150 hover:bg-[#2d2a38]
      `}
    >
      <span className="mr-3">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
