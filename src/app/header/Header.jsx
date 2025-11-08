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

const SHELL = "w-full px-3 sm:px-5 lg:px-12";
const ITEM_TXT = "text-[13px] md:text-[14px]";
const ITEM_H = "h-10 md:h-11";

export default function Header({ onOpenSearch }) {
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);
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

  // Dynamic header height for safe area anchors
  useEffect(() => {
    const setVar = () => {
      const h = hdrRef.current?.offsetHeight || 44; // ~h-11
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
      <header ref={hdrRef} className="sticky top-0 z-50 h-11 bg-black/70 backdrop-blur-md shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
        <div className={`${SHELL} flex h-11 items-center justify-between`}>
          {/* Brand + desktop nav */}
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/home" aria-label="FeelFlick Home" className="select-none">
              <span className="text-lg font-extrabold tracking-tighter text-white uppercase">
                FEELFLICK
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <TopLink to="/home" icon={<Home className="h-5 w-5" />}>Home</TopLink>
              <TopLink to="/browse" icon={<Compass className="h-5 w-5" />}>Browse</TopLink>
            </nav>
          </div>
          {/* Search + account desktop */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center">
              <SearchBar onOpenSearch={onOpenSearch} />
            </div>
            <button
              type="button"
              onClick={onOpenSearch}
              className="md:hidden flex items-center justify-center rounded-full bg-white/10 p-2"
              aria-label="Search"
              title="Search"
            >
              <SearchIcon className="h-5 w-5 text-white/85" />
            </button>
            <div className="hidden md:block">
              <AccountMenu user={user} />
            </div>
          </div>
        </div>
      </header>
      {/* Mobile tab bar */}
      <MobileTabBar user={user} pathname={pathname} />
    </>
  );
}

// Desktop pill search bar
function SearchBar({ onOpenSearch }) {
  return (
    <button
      type="button"
      onClick={onOpenSearch}
      className="inline-flex items-center h-9 rounded-full bg-white/10 px-4 gap-2 text-white/90 hover:bg-white/20 focus:outline-none shadow-md transition"
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
          "inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold transition text-[13px]",
          isActive ? "underline underline-offset-4 text-white" : "text-white/60 hover:text-white",
        ].join(" ")
      }
    >
      {icon}<span>{children}</span>
    </NavLink>
  );
}

// Mobile tab bar with Account as tab
function MobileTabBar({ pathname, user }) {
  const initials = (() => {
    const name = user?.user_metadata?.name || user?.email?.split("@")[0] || "U";
    return name.split(" ").map(s => s[0]?.toUpperCase()).slice(0,2).join("") || "U";
  })();
  const tabs = [
    { to: "/home", label: "Home", icon: <Home className="h-5 w-5" /> },
    { to: "/browse", label: "Browse", icon: <Compass className="h-5 w-5" /> },
    { to: "/account", label: "Account", icon: (
      <span className="grid h-5 w-5 place-items-center rounded-full bg-white/15 text-xs font-bold">
        {initials}
      </span>
    )},
  ];
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[rgba(12,18,28,.90)] backdrop-blur-md md:hidden">
      <div className="mx-auto max-w-[720px] flex items-center justify-between px-3 h-12">
        {tabs.map(({to, label, icon}) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) =>
              [
                "flex flex-col items-center justify-center rounded-lg px-1.5 py-0 font-semibold text-[12px] transition w-1/3",
                isActive ? "text-white" : "text-white/70 hover:text-white/90",
              ].join(" ")
            }
          >
            {icon}
            <span className="mt-0.5">{label}</span>
          </NavLink>
        ))}
      </div>
      <div className="pb-[max(env(safe-area-inset-bottom),6px)]" />
    </div>
  );
}

// Desktop user account dropdown
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
        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2 py-1 h-9 text-white/90 font-semibold focus:outline-none hover:bg-white/20 transition"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-[13px] font-bold">{initials}</span>
        <span className="hidden md:block max-w-[120px] truncate">{name}</span>
        <ChevronDown className="hidden md:block h-4 w-4 opacity-70" />
      </button>
      {open && (
        <div
          ref={popRef}
          role="menu"
          className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-[rgba(12,18,28,.96)] backdrop-blur-md shadow-xl ring-1 ring-black/20 transition-opacity duration-300"
        >
          <MenuLink to="/account" icon={<UserIcon className="h-4 w-4" />} onClick={() => setOpen(false)}>
            Account
          </MenuLink>
          <MenuLink to="/preferences" icon={<Settings className="h-4 w-4" />} onClick={() => setOpen(false)}>
            Preferences
          </MenuLink>
          <div className="my-1 h-px bg-white/10" />
          <MenuLink to="/watchlist" icon={<Bookmark className="h-4 w-4" />} onClick={() => setOpen(false)}>
            Watchlist
          </MenuLink>
          <MenuLink to="/history" icon={<Clock className="h-4 w-4" />} onClick={() => setOpen(false)}>
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
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-semibold text-white/85 hover:bg-white/10 focus:outline-none transition"
          >
            <LogOut className="h-4 w-4" /> Sign out
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
          "flex items-center gap-2 px-3 py-2 text-[13px] font-semibold transition",
          isActive ? "bg-white/10 text-white" : "text-white/85 hover:bg-white/10",
        ].join(" ")
      }
      role="menuitem"
    >
      {icon}{children}
    </NavLink>
  );
}
