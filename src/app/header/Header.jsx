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
  ChevronRight,
} from "lucide-react";

const SHELL = "w-full px-4 sm:px-6 lg:px-12";
const ITEM_TXT = "text-[14px] md:text-[15px]";
const ITEM_H = "h-10 md:h-12";

export default function Header({ onOpenSearch }) {
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);
  const hdrRef = useRef(null);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);

  useEffect(() => {
    let unsub;
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) =>
      setUser(s?.user || null)
    );
    unsub = data?.subscription?.unsubscribe;
    return () => typeof unsub === "function" && unsub();
  }, []);

  // Sticky header height for layout
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
      {/* Sticky header */}
      <header ref={hdrRef} className="sticky top-0 z-50 backdrop-blur-lg shadow-[0_4px_20px_rgba(0,0,0,.25)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b1320] via-[#0f1b2b] to-[#111824]" />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xl ring-1 ring-white/10" />
        </div>
        <div className={`${SHELL} flex h-16 items-center justify-between gap-3`}>
          {/* Brand + desktop nav */}
          <div className="flex min-w-0 items-center gap-5">
            <Link to="/home" aria-label="FeelFlick Home" className="select-none">
              <span className="block text-2xl font-extrabold tracking-wide text-white uppercase">
                FEELFLICK
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-2">
              <TopLink to="/home" icon={<Home className="h-5 w-5" />}>Home</TopLink>
              <TopLink to="/browse" icon={<Compass className="h-5 w-5" />}>Browse</TopLink>
            </nav>
          </div>
          {/* Search (desktop pill, mobile icon) + account */}
          <div className="flex items-center gap-3">
            {/* Desktop search pill */}
            <div className="hidden md:flex items-center">
              <SearchBar onOpenSearch={onOpenSearch} />
            </div>
            {/* Mobile search button */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="md:hidden inline-flex items-center justify-center rounded-full bg-white/15 p-2 ml-1"
              aria-label="Search"
              title="Search"
            >
              <SearchIcon className="h-6 w-6 text-white/85" />
            </button>
            <div className="hidden md:block">
              <AccountMenu user={user} />
            </div>
          </div>
        </div>
      </header>

      <MobileBar
        pathname={pathname}
        user={user}
        mobileAccountOpen={mobileAccountOpen}
        onToggleAccount={() => setMobileAccountOpen(s => !s)}
        onCloseAccountPanel={() => setMobileAccountOpen(false)}
      />

      {/* Mobile Account Panel overlays content, tabs stay at bottom */}
      <MobileAccountPanel
        open={mobileAccountOpen}
        user={user}
        onClose={() => setMobileAccountOpen(false)}
      />
    </>
  );
}

// Desktop pill search bar
function SearchBar({ onOpenSearch }) {
  return (
    <button
      type="button"
      onClick={onOpenSearch}
      className="inline-flex items-center h-10 rounded-full bg-white/10 px-5 gap-2 text-white/90 hover:bg-white/20 focus:outline-none shadow-md transition"
      aria-label="Search"
      title="Search"
    >
      <SearchIcon className="h-5 w-5 text-white/80" />
      <span className="font-medium text-white/85">Search</span>
      <kbd className="ml-2 rounded bg-white/10 px-2 py-1 text-xs text-white/60">/</kbd>
    </button>
  );
}

// Navigation links
function TopLink({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition",
          isActive ? "bg-white/20 text-white ring-2 ring-white/25" : "text-white/75 hover:bg-white/15",
        ].join(" ")
      }
    >
      {icon}<span>{children}</span>
    </NavLink>
  );
}

// Mobile tab bar with Account toggler and active panel closing logic
function MobileBar({ pathname, user, mobileAccountOpen, onToggleAccount, onCloseAccountPanel }) {
  const nav = useNavigate();

  const Item = ({ to, icon, label, onClick, isActive }) => (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex flex-col items-center justify-center rounded-lg px-2.5 py-1 font-semibold transition text-[12px]",
        isActive ? "text-white" : "text-white/70",
      ].join(" ")}
      aria-label={label}
    >
      {icon}
      <span className="mt-0.5">{label}</span>
    </button>
  );

  const initials = (() => {
    const name = user?.user_metadata?.name || user?.email?.split("@")[0] || "U";
    return name.split(" ").map(s => s[0]?.toUpperCase()).slice(0,2).join("") || "U";
  })();

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[rgba(12,18,28,.92)] backdrop-blur-lg md:hidden">
      <div className="mx-auto max-w-[720px] grid grid-cols-3 items-center px-4 h-[64px]">
        {/* If Account panel is open and user taps Home/Browse, close panel then navigate */}
        <Item
          to="/home"
          label="Home"
          icon={<Home className="h-6 w-6" />}
          onClick={() => {
            if (mobileAccountOpen) onCloseAccountPanel();
            nav("/home");
          }}
          isActive={pathname === "/home" && !mobileAccountOpen}
        />
        <Item
          to="/browse"
          label="Browse"
          icon={<Compass className="h-6 w-6" />}
          onClick={() => {
            if (mobileAccountOpen) onCloseAccountPanel();
            nav("/browse");
          }}
          isActive={pathname === "/browse" && !mobileAccountOpen}
        />
        <Item
          label="Account"
          icon={
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 text-xs font-bold">
              {initials}
            </span>
          }
          onClick={onToggleAccount}
          isActive={mobileAccountOpen}
        />
      </div>
      <div className="pb-[max(env(safe-area-inset-bottom),10px)]" />
    </div>
  );
}

// Mobile full-screen account panel, tabs remain visible
function MobileAccountPanel({ open, user, onClose }) {
  const nav = useNavigate();

  if (!open) return null;

  const name = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const email = user?.email || "";
  const initials = (name || "").split(" ").map(s => s[0]?.toUpperCase()).slice(0,2).join("") || "U";

  const handleNavigate = (path) => {
    onClose();
    nav(path);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onClose();
    nav("/auth", { replace: true });
  };

  const menuItems = [
    { icon: <UserIcon className="h-6 w-6" />, label: "Profile", path: "/account" },
    { icon: <Settings className="h-6 w-6" />, label: "Preferences", path: "/preferences" },
    { icon: <Bookmark className="h-6 w-6" />, label: "Watchlist", path: "/watchlist" },
    { icon: <Clock className="h-6 w-6" />, label: "History", path: "/history" },
  ];

  return (
    <div
      className="fixed left-0 right-0 z-[100] bg-[#0a0f1a] md:hidden overflow-y-auto"
      style={{
        top: "var(--hdr-h,64px)",
        bottom: "64px", // bottom bar height
        borderRadius: '0 0 1.5rem 1.5rem',
      }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-[#0b1320] via-[#0f1b2b] to-[#111824] backdrop-blur-lg border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Account</h1>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* User Info Section */}
      <div className="px-4 py-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-bold text-white">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{name}</h2>
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
            className="flex w-full items-center justify-between px-4 py-4 text-white/90 hover:bg-white/5 transition"
          >
            <div className="flex items-center gap-4">
              <div className="text-white/80">{item.icon}</div>
              <span className="text-[15px] font-semibold">{item.label}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-white/40" />
          </button>
        ))}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-between px-4 py-4 text-white/90 hover:bg-white/5 transition border-t border-white/10 mt-2"
        >
          <div className="flex items-center gap-4">
            <div className="text-white/80">
              <LogOut className="h-6 w-6" />
            </div>
            <span className="text-[15px] font-semibold">Sign Out</span>
          </div>
          <ChevronRight className="h-5 w-5 text-white/40" />
        </button>
      </div>
      <div className="h-2" />
    </div>
  );
}

// Desktop account menu dropdown remains the same
function AccountMenu({ user }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!open) return;
      if (
        popRef.current && !popRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    function onKey(e) { if (open && e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    await supabase.auth.signOut();
    nav("/auth", { replace: true });
  }

  const name = user?.user_metadata?.name || user?.email?.split("@")[0] || "Account";
  const initials = (name || "").split(" ").map(s => s[0]?.toUpperCase()).slice(0,2).join("") || "U";

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(s => !s)}
        className="inline-flex items-center gap-3 rounded-full bg-white/10 px-2 py-1 h-11 text-white/90 font-semibold focus:outline-none hover:bg-white/20 transition"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-[14px] font-bold">{initials}</span>
        <span className="hidden md:block max-w-[160px] truncate">{name}</span>
        <ChevronDown className="hidden md:block h-5 w-5 opacity-70" />
      </button>
      {open && (
        <div
          ref={popRef}
          role="menu"
          className="absolute right-0 mt-3 w-64 overflow-hidden rounded-xl border border-white/10 bg-[rgba(12,18,28,.96)] backdrop-blur-xl shadow-2xl ring-1 ring-black/20 transition-transform transition-opacity duration-300 animate-fadeIn"
        >
          <MenuLink to="/account" icon={<UserIcon className="h-5 w-5" />} onClick={() => setOpen(false)}>
            Profile
          </MenuLink>
          <MenuLink to="/preferences" icon={<Settings className="h-5 w-5" />} onClick={() => setOpen(false)}>
            Preferences
          </MenuLink>
          <div className="my-1 h-px bg-white/10" />
          <MenuLink to="/watchlist" icon={<Bookmark className="h-5 w-5" />} onClick={() => setOpen(false)}>
            Watchlist
          </MenuLink>
          <MenuLink to="/history" icon={<Clock className="h-5 w-5" />} onClick={() => setOpen(false)}>
            History
          </MenuLink>
          <div className="my-1 h-px bg-white/10" />
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              setOpen(false);
              nav("/auth", { replace: true });
            }}
            className="flex w-full items-center gap-3 px-3 py-3 text-left text-[14px] font-semibold text-white/85 hover:bg-white/10 focus:outline-none transition"
          >
            <LogOut className="h-5 w-5" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({ to, icon, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 px-3 py-3 text-[14px] font-semibold transition",
          isActive ? "bg-white/15 text-white" : "text-white/85 hover:bg-white/15",
        ].join(" ")
      }
      role="menuitem"
    >
      {icon}{children}
    </NavLink>
  );
}
