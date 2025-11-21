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
  X,
  ChevronRight,
  HelpCircle,
  Shield,
} from "lucide-react";

// Utility: Get initials from name/email if avatar missing
const getInitials = (user) => {
  if (!user) return "FF";
  const name = user.user_metadata?.name || user.email || "";
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
};

export default function Header({ onOpenSearch }) {
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const hdrRef = useRef(null);
  const navigate = useNavigate();

  // User session: load on mount and update on change
  useEffect(() => {
    let unsub;
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    }
    getUser();
    const { data } = supabase.auth.onAuthStateChange((_e, s) =>
      setUser(s?.user || null)
    );
    unsub = data?.subscription?.unsubscribe;
    return () => typeof unsub === "function" && unsub();
  }, []);

  // Smart scroll: add shadow/blur if scrolled
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 10);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Height CSS var for other components (e.g. offset sticky content)
  useEffect(() => {
    const setVar = () => {
      const h = hdrRef.current?.offsetHeight || 64;
      document.documentElement.style.setProperty("--hdr-h", `${h}px`);
    };
    setVar();
    const ro = new ResizeObserver(setVar);
    if (hdrRef.current) ro.observe(hdrRef.current);
    return () => ro.disconnect();
  }, []);

  // Handle dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (!hdrRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // Theme Gradient Colors (FeelFlick)
  const gradient = "from-[#667eea] via-[#764ba2] to-[#f093fb]";

  // Navigation links
  const navLinks = [
    { to: "/home", label: "Home", icon: <Home className="h-4 w-4 mr-1" /> },
    { to: "/browse", label: "Browse", icon: <Compass className="h-4 w-4 mr-1" /> },
    // Add more as needed ...
  ];

  return (
    <header
      ref={hdrRef}
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-2xl shadow-2xl bg-[#181825]/90 border-b border-white/10" : "bg-gradient-to-b from-[#181825]/90 to-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/home" aria-label="FeelFlick Home" className="flex items-center gap-3 group">
            <span className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${gradient} animate-gradient`}>
              FEELFLICK
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `relative px-4 py-2 rounded-full text-sm font-bold transition duration-200 ${
                    isActive
                      ? `bg-gradient-to-r ${gradient} text-white shadow-lg`
                      : "text-white/80 hover:text-white bg-none"
                  }`
                }
              >
                {n.icon}
                <span>{n.label}</span>
                {/* Underline for active */}
                <span
                  className={`absolute left-3 bottom-1.5 right-3 h-[3px] rounded-full bg-gradient-to-r ${gradient} opacity-0 ${
                    pathname === n.to ? "opacity-100" : ""
                  } transition-all duration-500`}
                />
              </NavLink>
            ))}
          </nav>

          {/* Search (large, gradient accent, shortcut hint) */}
          <button
            onClick={onOpenSearch}
            className="hidden sm:flex items-center gap-2 px-4 h-10 rounded-full bg-[#282b38]/90 border border-[#667eea]/10 text-white shadow-lg hover:bg-[#667eea]/20 hover:border-[#764ba2]/30 transition relative"
            aria-label="Search"
          >
            <SearchIcon className="h-5 w-5 text-[#667eea]" />
            <span className="hidden xl:inline text-white/70 font-medium">Search</span>
            <kbd className="hidden xl:inline ml-2 px-2 py-0.5 text-xs rounded bg-white/5 text-white/70 border border-white/10">⌘K</kbd>
          </button>

          {/* Profile + Avatar + Dropdown */}
          <div className="relative group">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 h-10 px-3 rounded-full bg-gradient-to-br from-[#764ba2] to-[#f093fb] text-white shadow-xl ring-2 ring-[#667eea]/30"
              aria-label="Account"
            >
              <span className={`flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br ${gradient} text-lg font-bold`}>
                {getInitials(user)}
              </span>
              <span className="hidden lg:max-w-[100px] lg:truncate lg:block font-semibold">{user?.user_metadata?.name || user?.email || "Account"}</span>
              <ChevronDown className="h-4 w-4 text-white/70 group-hover:text-white ml-1 transition" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-gradient-to-br from-[#282b38]/95 to-[#181825]/95 border border-white/10 rounded-2xl shadow-2xl p-4 z-50 backdrop-blur-2xl animate-fade-in">
                <div className="flex flex-col gap-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#667eea]/10 transition text-white/90"
                  >
                    <UserIcon className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#764ba2]/10 transition text-white/90"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <Link
                    to="/watchlist"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f093fb]/10 transition text-white/90"
                  >
                    <Bookmark className="h-4 w-4" />
                    Watchlist
                  </Link>
                  <Link
                    to="/history"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#667eea]/10 transition text-white/90"
                  >
                    <Clock className="h-4 w-4" />
                    History
                  </Link>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate("/");
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-600/20 transition text-red-400 mt-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Mobile bottom nav can go here if wanted */}
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 6s ease-in-out infinite alternate;
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </header>
  );
}
