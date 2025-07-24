import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, SlidersHorizontal, User2, Search as SearchIcon, X as XIcon } from "lucide-react";
import logo from "@assets/images/logo.png";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const NAV_LINKS = [
  { name: "Home", path: "/app" },
  { name: "Movies", path: "/movies" },
  { name: "Watched", path: "/watched" }
];

export default function Header({ user, onSignOut }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
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
      if (showMenu && menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showMenu, searchOpen]);

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

  // Handle sign out and redirect to homepage
  const handleSignOut = async () => {
    if (onSignOut) await onSignOut();
    navigate("/");
  };

  // Clear search logic
  const clearSearch = () => {
    setSearch("");
    setResults([]);
    setSearchOpen(false);
    setShowMobileSearch(false);
    inputRef.current?.blur();
  };

  // Responsive: Show search modal on mobile
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

  // --- Account menu dropdown ---
  function AccountMenuDropdown() {
    return (
      <div
        className="absolute right-0 top-12 bg-[#1f1d26] rounded-xl shadow-xl min-w-[185px] z-40 p-1 pt-2 animate-slideDown"
        style={{ boxShadow: "0 8px 34px #18142355" }}
      >
        <MenuItem icon={<User2 size={18} />} text="My Account" onClick={() => { navigate("/account"); setShowMenu(false); }} />
        <MenuItem icon={<SlidersHorizontal size={18} />} text="Preferences" onClick={() => { navigate("/preferences"); setShowMenu(false); }} />
        <div className="border-t border-zinc-800 my-2" />
        <MenuItem icon={<LogOut size={18} />} text="Sign Out" onClick={handleSignOut} />
      </div>
    );
  }

  function MenuItem({ icon, text, onClick }) {
    return (
      <div
        onClick={onClick}
        className="flex items-center px-4 py-2 text-white cursor-pointer font-sans text-[15px] rounded-lg transition duration-150 hover:bg-[#2d2a38]"
      >
        <span className="mr-3">{icon}</span>
        <span>{text}</span>
      </div>
    );
  }

  // --- Render ---
  return (
    <header
      className="
        flex items-center justify-between w-full
        bg-[rgba(20,18,26,0.78)] backdrop-blur-md
        px-2 md:px-7 py-2 md:py-2.5 shadow-[0_1px_8px_#000b]
        z-50 fixed top-0 left-0 right-0 transition-all duration-300
      "
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo + Brand */}
      <NavLink
        to="/app"
        className="flex items-center gap-1 md:gap-2 group focus-visible:outline-2"
        aria-label="Go to FeelFlick home page"
        tabIndex={0}
      >
        <img
          src={logo}
          alt="FeelFlick logo"
          className="h-7 w-7 rounded-lg md:h-9 md:w-9 transition-transform group-hover:scale-105"
          draggable={false}
        />
        <span
          className="
            uppercase font-extrabold tracking-normal select-none text-lg pl-1
            md:text-xl md:pl-1 lg:text-3xl
            transition
          "
          style={{
            color: "#F6E3D7",
            letterSpacing: "0.07em",
            textShadow: "0 1px 10px #fff1, 0 1px 20px #18406d24",
            lineHeight: "1",
          }}
        >
          FEELFLICK
        </span>
      </NavLink>

      {/* Main Nav Tabs */}
      <nav className="hidden md:flex gap-2 ml-4">
        {NAV_LINKS.map(link => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg font-bold text-[16px] transition
              ${isActive
                ? "bg-gradient-to-r from-orange-400 to-red-500 text-white shadow"
                : "text-[#ffbe60] hover:bg-[#23212b] hover:text-white"}
              `
            }
            aria-current={location.pathname.startsWith(link.path) ? "page" : undefined}
          >
            {link.name}
          </NavLink>
        ))}
      </nav>

      {/* Search (desktop) */}
      <div className="hidden sm:flex flex-1 justify-center px-2 relative max-w-[410px]">
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
      {/* Mobile Search Button */}
      <button
        className="sm:hidden ml-auto mr-1 p-1.5 bg-[#242134] rounded-full hover:bg-[#2a2a38] text-orange-400"
        aria-label="Search"
        onClick={() => setShowMobileSearch(true)}
      >
        <SearchIcon size={22} />
      </button>
      {/* User avatar/account menu */}
      <div className="relative min-w-[45px]" ref={menuRef}>
        <div
          onClick={() => setShowMenu(!showMenu)}
          className={`
            bg-[#3a3746] w-9 h-9 rounded-full flex items-center justify-center
            text-white font-bold font-sans text-lg cursor-pointer select-none
            shadow transition hover:scale-105 border-2
            ${showMenu ? "border-orange-400" : "border-transparent"}
          `}
          tabIndex={0}
          aria-label="Account menu"
        >
          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
        </div>
        {showMenu && <AccountMenuDropdown />}
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
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-14px);}
            to { opacity: 1; transform: translateY(0);}
          }
          .animate-slideDown {
            animation: slideDown 0.23s cubic-bezier(.33,1,.68,1) both;
          }
        `}
      </style>
    </header>
  );
}
