// src/app/header/Header.jsx
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";
import {
  Home,
  Compass,
  Search as SearchIcon,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Settings,
  Bookmark,
  Clock,
} from "lucide-react";

export default function Header({ onOpenSearch }) {
  const pathname = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState("up");
  const [lastScrollY, setLastScrollY] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const hdrRef = useRef(null);
  const dropdownRef = useRef(null);

  // User session logic...
  useEffect(() => {
    let unsub;
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user || null));
    unsub = data?.subscription?.unsubscribe;
    return () => typeof unsub === "function" && unsub();
  }, []);

  // Smart scroll hide header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 10);
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setScrollDirection("down");
        setDropdownOpen(false);
      } else {
        setScrollDirection("up");
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Click outside for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Header height variable
  useEffect(() => {
    const setVar = () => {
      const h = hdrRef.current?.offsetHeight || 64;
      document.documentElement.style.setProperty("--hdr-h", `${h}px`);
    };
    const ro = new ResizeObserver(setVar);
    if (hdrRef.current) ro.observe(hdrRef.current);
    return () => ro.disconnect();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    navigate("/");
  };

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0];
  const userEmail = user?.email;
  const userAvatar = user?.user_metadata?.avatar_url || null;

  return (
    <>
      {/* Desktop / Tablet Header */}
      <header
        ref={hdrRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 
          ${
            scrolled
              ? "bg-[#0a0a0a]/95 backdrop-blur border-b border-white/10 shadow-xl"
              : "bg-gradient-to-b from-black/80 to-transparent"
          }
          ${scrollDirection === "down" ? "-translate-y-full" : "md:translate-y-0 translate-y-0"}
        `}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Apple/Netflix inspired gradient + shimmer */}
            <Link to="/home" className="flex items-center gap-2 group">
              <span className="text-3xl font-black bg-gradient-to-r from-[#FE9245] via-[#EB423B] to-[#764BA2] bg-clip-text text-transparent group-hover:scale-105 transition-transform animate-[shimmer_2.5s_linear_infinite]">
                FEELFLICK
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <NavLink
                to="/home"
                className={({ isActive }) =>
                  [
                    "text-sm font-bold rounded-lg px-2 py-1 transition-all",
                    isActive
                      ? "text-white bg-gradient-to-r from-[#FE9245] to-[#EB423B] shadow-md"
                      : "text-white/70 hover:text-white hover:bg-white/10",
                  ].join(" ")
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/browse"
                className={({ isActive }) =>
                  [
                    "text-sm font-bold rounded-lg px-2 py-1 transition-all",
                    isActive
                      ? "text-white bg-gradient-to-r from-[#FE9245] to-[#EB423B] shadow-md"
                      : "text-white/70 hover:text-white hover:bg-white/10",
                  ].join(" ")
                }
              >
                Discover
              </NavLink>
              <NavLink
                to="/watchlist"
                className={({ isActive }) =>
                  [
                    "text-sm font-bold rounded-lg px-2 py-1 transition-all",
                    isActive
                      ? "text-white bg-gradient-to-r from-[#FE9245] to-[#EB423B] shadow-md"
                      : "text-white/70 hover:text-white hover:bg-white/10",
                  ].join(" ")
                }
              >
                Watchlist
              </NavLink>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3 sm:gap-5">
              {/* Search Button */}
              <button
                onClick={onOpenSearch}
                className="p-2 bg-white/10 rounded-full shadow-lg text-white/80 hover:text-white hover:bg-gradient-to-r from-[#FE9245] to-[#EB423B] transition-all focus:ring-[2px] focus:ring-[#FE9245] activescale-95"
                aria-label="Search"
              >
                <SearchIcon className="h-6 w-6" />
              </button>
              {/* Desktop User Avatar */}
              {user && (
                <div className="hidden md:block relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/10 transition"
                  >
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-[#FE9245]/40"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FE9245] to-[#EB423B] flex items-center justify-center text-white text-base font-bold ring-2 ring-white/30">
                        {userName[0]?.toUpperCase()}
                      </div>
                    )}
                    <ChevronDown
                      className={`h-4 w-4 text-white/80 transition-transform ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#18181d] border border-white/10 shadow-2xl overflow-hidden animate-[fade-in_0.2s_ease]">
                      <div className="px-4 py-3 border-b border-white/10">
                        <div className="font-semibold text-white truncate text-base">{userName}</div>
                        <div className="text-xs text-white/60 truncate">{userEmail}</div>
                      </div>
                      <NavLink
                        to="/account"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <UserIcon className="h-4 w-4" /> Profile
                      </NavLink>
                      <NavLink
                        to="/watchlist"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <Bookmark className="h-4 w-4" /> Watchlist
                      </NavLink>
                      <NavLink
                        to="/history"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <Clock className="h-4 w-4" /> History
                      </NavLink>
                      <NavLink
                        to="/preferences"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <Settings className="h-4 w-4" /> Settings
                      </NavLink>
                      <div className="border-t border-white/10 py-2">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                        >
                          <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation (always visible, glassmorphism) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur border-t border-white/10 shadow-2xl"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0.5rem))" }}
      >
        <div className="flex items-center justify-around px-2 pt-2">
          <NavLink to="/home" className={({ isActive }) => ["flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all", isActive ? "text-white bg-white/10" : "text-white/60 hover:text-white hover:bg-white/5"].join(" ")}>
            <Home className="h-6 w-6" />
            <span className="text-xs font-medium">Home</span>
          </NavLink>
          <NavLink to="/browse" className={({ isActive }) => ["flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all", isActive ? "text-white bg-white/10" : "text-white/60 hover:text-white hover:bg-white/5"].join(" ")}>
            <Compass className="h-6 w-6" />
            <span className="text-xs font-medium">Discover</span>
          </NavLink>
          <button onClick={onOpenSearch} className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all activescale-95">
            <SearchIcon className="h-6 w-6" />
            <span className="text-xs font-medium">Search</span>
          </button>
          <NavLink to="/watchlist" className={({ isActive }) => ["flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all", isActive ? "text-white bg-white/10" : "text-white/60 hover:text-white hover:bg-white/5"].join(" ")}>
            <Bookmark className="h-6 w-6" />
            <span className="text-xs font-medium">Watchlist</span>
          </NavLink>
          <NavLink to="/mobile-account" className={({ isActive }) => ["flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all", isActive ? "text-white bg-white/10" : "text-white/60 hover:text-white hover:bg-white/5"].join(" ")}>
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className={`h-6 w-6 rounded-full object-cover ${isActive ? "ring-2 ring-white/40" : "ring-2 ring-white/10"}`}
              />
            ) : (
              <div className={`h-6 w-6 rounded-full bg-gradient-to-br from-[#FE9245] to-[#EB423B] flex items-center justify-center text-white text-xs font-bold ${isActive ? "ring-2 ring-white/40" : ""}`}>
                {userName[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-xs font-medium">Account</span>
          </NavLink>
        </div>
      </nav>
    </>
  );
}
