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
  Bell,
  X,
} from "lucide-react";

export default function Header({ onOpenSearch }) {
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const hdrRef = useRef(null);

  useEffect(() => {
    let unsub;
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) =>
      setUser(s?.user || null)
    );
    unsub = data?.subscription?.unsubscribe;
    return () => typeof unsub === "function" && unsub();
  }, []);

  // Scroll detection for header background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
          scrolled
            ? "bg-black/95 backdrop-blur-xl shadow-lg"
            : "bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto max-w-[2000px] px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex h-16 md:h-[72px] items-center justify-between gap-4">
            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-6 lg:gap-8 min-w-0">
              {/* Logo */}
              <Link
                to="/home"
                aria-label="FeelFlick Home"
                className="flex-shrink-0 group"
              >
                <span className="block text-xl md:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 group-hover:from-orange-400 group-hover:to-red-400 transition-all">
                  FEELFLICK
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                <NavItem to="/home" icon={<Home className="h-5 w-5" />}>
                  Home
                </NavItem>
                <NavItem to="/browse" icon={<Compass className="h-5 w-5" />}>
                  Browse
                </NavItem>
              </nav>
            </div>

            {/* Right: Search + Notifications + Account */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop Search */}
              <button
                onClick={onOpenSearch}
                className="hidden md:inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-all group"
                aria-label="Search"
              >
                <SearchIcon className="h-4 w-4 text-white/70 group-hover:text-white transition-colors" />
                <span className="text-sm text-white/70 group-hover:text-white transition-colors">
                  Search
                </span>
                <kbd className="hidden lg:inline-block ml-2 px-2 py-0.5 text-xs rounded bg-white/10 text-white/50 border border-white/10">
                  /
                </kbd>
              </button>

              {/* Mobile Search Icon */}
              <button
                onClick={onOpenSearch}
                className="md:hidden flex items-center justify-center h-10 w-10 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Search"
              >
                <SearchIcon className="h-5 w-5 text-white/80" />
              </button>

              {/* Notifications (Optional) */}
              <button
                className="hidden lg:flex items-center justify-center h-10 w-10 rounded-full hover:bg-white/10 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-white/80" />
                {/* Notification badge */}
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-black" />
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
      <MobileBottomNav pathname={pathname} user={user} />
    </>
  );
}

/* ===== Desktop Nav Item ===== */
function NavItem({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
          isActive
            ? "bg-white/15 text-white"
            : "text-white/70 hover:text-white hover:bg-white/10"
        }`
      }
    >
      {icon}
      <span>{children}</span>
    </NavLink>
  );
}

/* ===== Desktop Account Menu ===== */
function AccountMenu({ user }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
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

  const name =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "Account";
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

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center gap-2 h-10 px-2 pr-3 rounded-full bg-white/10 hover:bg-white/20 transition-all group"
        aria-label="Account menu"
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-sm font-bold text-white">
          {initials}
        </div>
        <span className="hidden lg:block text-sm font-semibold text-white max-w-[100px] truncate">
          {name}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-white/70 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          ref={popRef}
          className="absolute right-0 mt-2 w-64 rounded-2xl bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden animate-slide-down"
        >
          {/* User Info */}
          <div className="px-4 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{name}</p>
                <p className="text-xs text-white/60 truncate">{email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <MenuItem
              to="/account"
              icon={<UserIcon className="h-4 w-4" />}
              onClick={() => setOpen(false)}
            >
              Profile
            </MenuItem>
            <MenuItem
              to="/preferences"
              icon={<Settings className="h-4 w-4" />}
              onClick={() => setOpen(false)}
            >
              Preferences
            </MenuItem>
          </div>

          <div className="h-px bg-white/10" />

          <div className="py-2">
            <MenuItem
              to="/watchlist"
              icon={<Bookmark className="h-4 w-4" />}
              onClick={() => setOpen(false)}
            >
              Watchlist
            </MenuItem>
            <MenuItem
              to="/history"
              icon={<Clock className="h-4 w-4" />}
              onClick={() => setOpen(false)}
            >
              History
            </MenuItem>
          </div>

          <div className="h-px bg-white/10" />

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-white/5 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}

function MenuItem({ to, icon, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors ${
          isActive
            ? "bg-white/10 text-white"
            : "text-white/80 hover:bg-white/5 hover:text-white"
        }`
      }
    >
      {icon}
      <span>{children}</span>
    </NavLink>
  );
}

/* ===== Mobile Bottom Navigation ===== */
function MobileBottomNav({ pathname, user }) {
  const nav = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);

  const name =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const initials = name
    .split(" ")
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "U";

  return (
    <>
      {/* Bottom Nav Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-white/10 safe-area-pb">
        <div className="grid grid-cols-3 h-16">
          <MobileNavButton
            icon={<Home className="h-6 w-6" />}
            label="Home"
            isActive={pathname === "/home" && !accountOpen}
            onClick={() => {
              setAccountOpen(false);
              nav("/home");
            }}
          />
          <MobileNavButton
            icon={<Compass className="h-6 w-6" />}
            label="Browse"
            isActive={pathname === "/browse" && !accountOpen}
            onClick={() => {
              setAccountOpen(false);
              nav("/browse");
            }}
          />
          <MobileNavButton
            icon={
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
            }
            label="Account"
            isActive={accountOpen}
            onClick={() => setAccountOpen((s) => !s)}
          />
        </div>
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
      className={`flex flex-col items-center justify-center gap-1 transition-colors ${
        isActive ? "text-white" : "text-white/60"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

/* ===== Mobile Account Panel ===== */
function MobileAccountPanel({ open, user, onClose }) {
  const nav = useNavigate();

  if (!open) return null;

  const name =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const email = user?.email || "";
  const initials = name
    .split(" ")
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "U";

  const handleNavigate = (path) => {
    onClose();
    nav(path);
  };

  async function handleSignOut() {
    await supabase.auth.signOut();
    onClose();
    nav("/", { replace: true });
  }

  const menuItems = [
    { icon: <UserIcon className="h-5 w-5" />, label: "Profile", path: "/account" },
    { icon: <Settings className="h-5 w-5" />, label: "Preferences", path: "/preferences" },
    { icon: <Bookmark className="h-5 w-5" />, label: "Watchlist", path: "/watchlist" },
    { icon: <Clock className="h-5 w-5" />, label: "History", path: "/history" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-2xl max-h-[70vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Account</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-white truncate">{name}</p>
              <p className="text-sm text-white/60 truncate">{email}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavigate(item.path)}
              className="flex w-full items-center gap-4 px-6 py-4 text-white/90 hover:bg-white/5 transition-colors"
            >
              <div className="text-white/80">{item.icon}</div>
              <span className="text-base font-semibold">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Sign Out */}
        <div className="border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-4 px-6 py-4 text-red-400 hover:bg-white/5 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-base font-semibold">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
