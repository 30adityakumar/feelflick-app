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

const SHELL = "w-full px-4 sm:px-6 lg:px-12";
const ITEM_TXT = "text-[14px] md:text-[15px]";
const ITEM_H = "h-10 md:h-12";

export default function Header({ onOpenSearch }) {
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);
  const hdrRef = useRef(null);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);

  useEffect(() => {
    let unsub;
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) =>
      setUser(s?.user || null)
    );
    unsub = data?.subscription?.unsubscribe;
    return () => typeof unsub === "function" && unsub();
  }, []);

  // Sticky header height for mobile profile panel
  useEffect(() => {
    const setVar = () => {
      const h = hdrRef.current?.offsetHeight || 64; // ~h-16
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

      {/* Mobile bottom bar (Home | Browse | Account) */}
      <MobileBar
        pathname={pathname}
        user={user}
        onOpenProfile={() => setMobileProfileOpen((s) => !s)}
      />

      {/* Mobile profile panel anchored below header */}
      <MobileProfilePanel
        open={mobileProfileOpen}
        onClose={() => setMobileProfileOpen(false)}
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

// Mobile tab bar
function MobileBar({ pathname, user, onOpenProfile }) {
  const Item = ({ to, icon, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex flex-col items-center justify-center rounded-lg px-2.5 py-1 font-semibold transition",
          "text-[12px]",
          isActive ? "text-white" : "text-white/70",
        ].join(" ")
      }
    >
      {icon}
      <span className="mt-0.5">{label}</span>
    </NavLink>
  );
  const initials = (() => {
    const name = user?.user_metadata?.name || user?.email?.split("@")[0] || "U";
    return name.split(" ").map(s => s[0]?.toUpperCase()).slice(0,2).join("") || "U";
  })();
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[rgba(12,18,28,.92)] backdrop-blur-lg md:hidden">
      <div className="mx-auto max-w-[720px] grid grid-cols-3 items-center px-4 h-[64px]">
        <Item to="/home" label="Home" icon={<Home className="h-6 w-6" />} />
        <Item to="/browse" label="Browse" icon={<Compass className="h-6 w-6" />} />
        {/* Account (right). Opens header panel, bottom bar stays put */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex flex-col items-center justify-center rounded-lg px-2.5 py-1 text-[12px] font-semibold text-white/80 focus:bg-white/10"
          aria-haspopup="menu"
          aria-expanded={undefined}
          aria-label="Account menu"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 text-xs font-bold">
            {initials}
          </span>
          <span className="mt-0.5">Account</span>
        </button>
      </div>
      <div className="pb-[max(env(safe-area-inset-bottom),10px)]" />
    </div>
  );
}

// Animated mobile profile panel
function MobileProfilePanel({ open, onClose }) {
  const nav = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (open) setIsAnimating(true);
    else if (!open && isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open, isAnimating]);

  if (!open && !isAnimating) return null;

  const go = (to) => {
    onClose();
    nav(to);
  };

  return (
    <>
      {/* Scrim, with fade animation */}
      <div
        className={`fixed inset-x-0 z-[60] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{
          top: "var(--hdr-h,64px)",
          bottom: "64px",
          background: "rgba(0,0,0,.45)",
        }}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel with slide and fade animation */}
      <div
        role="menu"
        className={`fixed inset-x-0 z-[61] mx-auto max-w-[720px] overflow-hidden rounded-b-2xl border border-t-0 border-white/10 bg-[rgba(12,18,28,.98)] backdrop-blur-xl shadow-2xl ring-1 ring-black/20 transition-transform transition-opacity duration-300 ${open ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
        style={{
          top: "var(--hdr-h,64px)",
          maxHeight: "calc(100svh - var(--hdr-h,64px) - 64px - max(env(safe-area-inset-bottom),10px))",
        }}
      >
        <div className="px-4 py-3">
          <span className="text-base font-semibold text-white/70">Account</span>
        </div>
        <div className="py-1">
          <PanelRow onClick={() => go("/account")} icon={<UserIcon className="h-5 w-5" />} label="Profile" />
          <PanelRow onClick={() => go("/preferences")} icon={<Settings className="h-5 w-5" />} label="Preferences" />
          <PanelRow onClick={() => go("/watchlist")} icon={<Bookmark className="h-5 w-5" />} label="Watchlist" />
          <PanelRow onClick={() => go("/history")} icon={<Clock className="h-5 w-5" />} label="History" />
          <SignOutRow onDone={onClose} />
        </div>
      </div>
    </>
  );
}

function PanelRow({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 px-4 py-3 text-left text-[15px] font-semibold text-white/90 hover:bg-white/10 transition"
      role="menuitem"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SignOutRow({ onDone }) {
  const nav = useNavigate();
  const doSignOut = async () => {
    await supabase.auth.signOut();
    onDone?.();
    nav("/auth", { replace: true });
  };
  return (
    <button
      type="button"
      onClick={doSignOut}
      className="flex w-full items-center gap-4 px-4 py-3 text-left text-[15px] font-semibold text-white/90 hover:bg-white/10 transition"
    >
      <LogOut className="h-5 w-5" /> Sign out
    </button>
  );
}

// Desktop account menu dropdown
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
            Account
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
            <LogOut className="h-5 w-5" /> Sign out
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
