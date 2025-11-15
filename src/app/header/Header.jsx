// src/app/header/Header.jsx
import { useEffect, useRef, useState, useCallback } from "react";
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
  Bell,
  X,
  ChevronRight,
  Film,
  TrendingUp,
} from "lucide-react";

export default function Header({ onOpenSearch }) {
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState("up");
  const [lastScrollY, setLastScrollY] = useState(0);
  const hdrRef = useRef(null);

  // User session management
  useEffect(() => {
    let unsub;
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();

    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user || null);
    });
    unsub = data?.subscription?.unsubscribe;
    return () => typeof unsub === "function" && unsub();
  }, []);

  // Smart scroll detection - hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Set scrolled state
      setScrolled(currentScrollY > 10);

      // Determine scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setScrollDirection("down");
      } else {
        setScrollDirection("up");
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Set CSS variable for header height
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

  return (
    <>
      {/* Desktop & Mobile Header */}
      <header
        ref={hdrRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollDirection === "down" && scrolled
            ? "-translate-y-full"
            : "translate-y-0"
        } ${
          scrolled
            ? "bg-black/98 backdrop-blur-2xl shadow-2xl border-b border-white/5"
            : "bg-gradient-to-b from-black/90 via-black/70 to-transparent backdrop-blur-md"
        }`}
      >
        <div className="mx-auto max-w-[2000px] px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="flex h-14 sm:h-16 md:h-[72px] items-center justify-between gap-2 sm:gap-4">
            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 min-w-0 flex-1">
              {/* Logo */}
              <Link
                to="/home"
                aria-label="FeelFlick Home"
                className="flex-shrink-0 group relative"
              >
                <span className="block text-lg sm:text-xl md:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 group-hover:from-orange-400 group-hover:via-red-400 group-hover:to-pink-400 transition-all duration-300">
                  FEELFLICK
                </span>
                {/* Subtle underline animation */}
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-orange-500 to-red-500 group-hover:w-full transition-all duration-300" />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                <NavItem to="/home" icon={<Home className="h-4 w-4" />}>
                  Home
                </NavItem>
                <NavItem to="/browse" icon={<Compass className="h-4 w-4" />}>
                  Browse
                </NavItem>
                <NavItem to="/watchlist" icon={<Bookmark className="h-4 w-4" />}>
                  Watchlist
                </NavItem>
              </nav>
            </div>

            {/* Right: Search + Account */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop Search */}
              <button
                onClick={onOpenSearch}
                className="hidden sm:inline-flex items-center gap-2 h-9 md:h-10 px-3 md:px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 transition-all duration-300 group"
                aria-label="Search movies"
              >
                <SearchIcon className="h-4 w-4 text-white/70 group-hover:text-white transition-colors" />
                <span className="hidden lg:inline text-sm text-white/70 group-hover:text-white transition-colors">
                  Search
                </span>
                <kbd className="hidden xl:inline-block ml-2 px-2 py-0.5 text-xs rounded bg-white/10 text-white/50 border border-white/10">
                  /
                </kbd>
              </button>

              {/* Mobile Search Icon */}
              <button
                onClick={onOpenSearch}
                className="sm:hidden flex items-center justify-center h-10 w-10 rounded-full hover:bg-white/10 active:scale-95 transition-all"
                aria-label="Search movies"
              >
                <SearchIcon className="h-5 w-5 text-white/90" />
              </button>

              {/* Desktop Account Menu */}
              <div className="hidden md:block">
                <AccountMenu user={user} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav pathname={pathname} user={user} onOpenSearch={onOpenSearch} />
    </>
  );
}

/* ===== Desktop Nav Item ===== */
function NavItem({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 relative group ${
          isActive
            ? "bg-white/15 text-white shadow-lg shadow-white/5"
            : "text-white/70 hover:text-white hover:bg-white/10"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {icon}
          <span>{children}</span>
          {isActive && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full" />
          )}
        </>
      )}
    </NavLink>
  );
}

/* ===== Desktop Account Menu ===== */
function AccountMenu({ user }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        open &&
        popRef.current &&
        !popRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(e) {
      if (open && e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const name = user?.user_metadata?.name || user?.email?.split("@")[0] || "Account";
  const email = user?.email || "";
  const initials = name
    .split(" ")
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "U";

  async function handleSignOut() {
    await supabase.auth.signOut();
    setOpen(false);
    nav("/", { replace: true });
  }

  const menuSections = [
    {
      items: [
        { to: "/account", icon: <UserIcon className="h-4 w-4" />, label: "Profile" },
        { to: "/preferences", icon: <Settings className="h-4 w-4" />, label: "Settings" },
      ],
    },
    {
      items: [
        { to: "/watchlist", icon: <Bookmark className="h-4 w-4" />, label: "Watchlist" },
        { to: "/history", icon: <Clock className="h-4 w-4" />, label: "History" },
      ],
    },
  ];

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((s) => !s)}
        className={`inline-flex items-center gap-2 h-10 pl-1.5 pr-3 rounded-full transition-all duration-300 ${
          open
            ? "bg-white/20 shadow-lg shadow-white/10"
            : "bg-white/10 hover:bg-white/15 hover:shadow-lg hover:shadow-white/5"
        }`}
        aria-label="Account menu"
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white ring-2 ring-white/20">
          {initials}
        </div>
        <span className="hidden lg:block text-sm font-semibold text-white max-w-[100px] truncate">
          {name}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-white/70 transition-all duration-300 ${
            open ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <>
          {/* Backdrop for desktop too */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          
          <div
            ref={popRef}
            className="absolute right-0 mt-3 w-72 rounded-2xl bg-black/98 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden z-50"
            style={{
              animation: "slideDown 0.2s ease-out",
            }}
          >
            {/* User Info Header */}
            <div className="px-4 py-4 border-b border-white/10 bg-gradient-to-br from-white/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center text-lg font-bold text-white flex-shrink-0 ring-2 ring-white/20">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{name}</p>
                  <p className="text-xs text-white/60 truncate">{email}</p>
                </div>
              </div>
            </div>

            {/* Menu Sections */}
            {menuSections.map((section, idx) => (
              <div key={idx}>
                <div className="py-2">
                  {section.items.map((item) => (
                    <MenuItem
                      key={item.to}
                      to={item.to}
                      icon={item.icon}
                      onClick={() => setOpen(false)}
                      onHover={() => setHoveredItem(item.to)}
                      isHovered={hoveredItem === item.to}
                    >
                      {item.label}
                    </MenuItem>
                  ))}
                </div>
                {idx < menuSections.length - 1 && (
                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                )}
              </div>
            ))}

            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              onMouseEnter={() => setHoveredItem("signout")}
              onMouseLeave={() => setHoveredItem(null)}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
            >
              <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span>Sign Out</span>
              <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({ to, icon, children, onClick, onHover, isHovered }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      onMouseEnter={onHover}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-200 group relative ${
          isActive
            ? "bg-white/10 text-white"
            : "text-white/80 hover:bg-white/5 hover:text-white"
        }`
      }
    >
      <div className="text-white/80 group-hover:text-white group-hover:scale-110 transition-all">
        {icon}
      </div>
      <span>{children}</span>
      <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </NavLink>
  );
}

/* ===== Mobile Bottom Navigation ===== */
function MobileBottomNav({ pathname, user, onOpenSearch }) {
  const nav = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);
  const location = useLocation();

  // Close account panel when route changes
  useEffect(() => {
    setAccountOpen(false);
  }, [location.pathname]);

  const name = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const initials = name
    .split(" ")
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "U";

  const navItems = [
    { icon: <Home className="h-6 w-6" />, label: "Home", path: "/home" },
    { icon: <SearchIcon className="h-6 w-6" />, label: "Search", action: "search" },
    { icon: <Bookmark className="h-6 w-6" />, label: "Saved", path: "/watchlist" },
  ];

  return (
    <>
      {/* Bottom Nav Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/98 backdrop-blur-2xl border-t border-white/10">
        <div className="grid grid-cols-4 h-16 px-2">
          {navItems.map((item) => (
            <MobileNavButton
              key={item.label}
              icon={item.icon}
              label={item.label}
              isActive={item.path ? pathname === item.path : false}
              onClick={() => {
                setAccountOpen(false);
                if (item.action === "search") {
                  onOpenSearch();
                } else if (item.path) {
                  nav(item.path);
                }
              }}
            />
          ))}
          <MobileNavButton
            icon={
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center text-xs font-bold ring-2 ring-white/20">
                {initials}
              </div>
            }
            label="You"
            isActive={accountOpen}
            onClick={() => setAccountOpen((s) => !s)}
          />
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>

      {/* Mobile Account Panel */}
      <MobileAccountPanel
        open={accountOpen}
        user={user}
        onClose={() => setAccountOpen(false)}
      />
    </>
  );
}

function MobileNavButton({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 active:scale-95 ${
        isActive ? "text-white" : "text-white/60"
      }`}
    >
      <div className={`transition-transform duration-300 ${isActive ? "scale-110" : ""}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-semibold transition-all ${isActive ? "text-white" : "text-white/60"}`}>
        {label}
      </span>
      {isActive && (
        <span className="absolute bottom-0 h-0.5 w-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full" />
      )}
    </button>
  );
}

/* ===== Mobile Account Panel ===== */
function MobileAccountPanel({ open, user, onClose }) {
  const nav = useNavigate();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const name = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const email = user?.email || "";
  const initials = name
    .split(" ")
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "U";

  const handleNavigate = (path) => {
    onClose();
    setTimeout(() => nav(path), 150);
  };

  async function handleSignOut() {
    await supabase.auth.signOut();
    onClose();
    setTimeout(() => nav("/", { replace: true }), 150);
  }

  const menuItems = [
    { icon: <UserIcon className="h-5 w-5" />, label: "Profile", path: "/account" },
    { icon: <Settings className="h-5 w-5" />, label: "Settings", path: "/preferences" },
    { icon: <Clock className="h-5 w-5" />, label: "History", path: "/history" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        style={{ animation: "fadeIn 0.2s ease-out" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="md:hidden fixed bottom-16 left-0 right-0 z-50 bg-black/98 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl shadow-2xl max-h-[75vh] overflow-y-auto"
        style={{ animation: "slideUp 0.3s ease-out" }}
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3">
          <h2 className="text-lg font-bold text-white">Account</h2>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-6 py-5 border-y border-white/10 bg-gradient-to-br from-white/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 ring-4 ring-white/10">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-white truncate">{name}</p>
              <p className="text-sm text-white/60 truncate">{email}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-2">
          {menuItems.map((item, idx) => (
            <button
              key={item.label}
              onClick={() => handleNavigate(item.path)}
              className="flex w-full items-center gap-4 px-6 py-4 text-white/90 hover:bg-white/5 active:bg-white/10 transition-all group"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="text-white/80 group-hover:text-white group-active:scale-110 transition-all">
                {item.icon}
              </div>
              <span className="text-base font-semibold flex-1 text-left">{item.label}</span>
              <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white/70 transition-all" />
            </button>
          ))}
        </div>

        {/* Sign Out */}
        <div className="border-t border-white/10 mt-2">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-4 px-6 py-4 text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-all group"
          >
            <LogOut className="h-5 w-5 group-active:scale-110 transition-transform" />
            <span className="text-base font-semibold flex-1 text-left">Sign Out</span>
          </button>
        </div>

        <div className="h-4" />
      </div>
    </>
  );
}

// Add these animations to your global CSS or tailwind config
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);
