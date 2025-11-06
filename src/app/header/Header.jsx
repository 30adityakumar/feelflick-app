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

const SHELL = "w-full px-3 sm:px-5 lg:px-7";
const ITEM_TXT = "text-[13px] md:text-[14px]";
const ITEM_H = "h-8 md:h-9";

export default function Header({ onOpenSearch }) {
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    let unsub;
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) =>
      setUser(s?.user || null)
    );
    unsub = data?.subscription?.unsubscribe;
    return () => typeof unsub === "function" && unsub();
  }, []);

  return (
    <>
      {/* Always pinned to the top on all devices */}
      <header className="sticky top-0 z-50 shadow-[0_4px_20px_rgba(0,0,0,.25)]">
        {/* Subtle gradient (not pure black) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(115deg,#0b1320_0%,#0f1b2b_52%,#111824_100%)]" />
          <div className="absolute -top-20 left-[8%] h-[32vmin] w-[32vmin] rounded-full blur-3xl opacity-35 bg-[radial-gradient(closest-side,rgba(254,146,69,.35),rgba(254,146,69,0)_70%)]" />
          <div className="absolute -top-24 right-[10%] h-[34vmin] w-[34vmin] rounded-full blur-3xl opacity-30 bg-[radial-gradient(closest-side,rgba(45,119,255,.30),rgba(45,119,255,0)_70%)]" />
          <div className="absolute inset-0 bg-black/35 backdrop-blur-md ring-1 ring-white/10" />
        </div>

        {/* Bar */}
        <div className={`${SHELL} flex h-12 md:h-14 items-center justify-between gap-3`}>
          {/* Brand + desktop nav */}
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/home" aria-label="FeelFlick Home" className="select-none">
              <span className="block text-[clamp(1.05rem,2vw,1.35rem)] font-extrabold tracking-[.06em] text-white/95 uppercase">
                FEELFLICK
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1.5">
              <TopLink to="/home" icon={<Home className="h-4 w-4" />}>Home</TopLink>
              <TopLink to="/browse" icon={<Compass className="h-4 w-4" />}>Browse</TopLink>
            </nav>
          </div>

          {/* Search (now visible on mobile at the top) + account (desktop only) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSearch}
              className={`inline-flex ${ITEM_H} items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 ${ITEM_TXT} text-white/90 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30`}
              aria-label="Search"
              title="Search"
            >
              <SearchIcon className="h-4 w-4 text-white/85" />
              <span className="hidden sm:inline text-white/80">Search</span>
              <kbd className="ml-1 hidden rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60 md:inline">/</kbd>
            </button>

            {/* Profile moved to bottom on mobile; keep dropdown only on ≥ md */}
            <div className="hidden md:block">
              <AccountMenu user={user} />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom bar now includes Profile (Home • Profile • Browse) */}
      <MobileBar pathname={pathname} />
    </>
  );
}

function TopLink({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "inline-flex items-center gap-1.5 rounded-full px-3 md:px-3.5 py-0",
          ITEM_H,
          ITEM_TXT,
          "font-semibold transition-colors",
          isActive ? "bg-white/10 text-white ring-1 ring-white/10"
                   : "text-white/75 hover:text-white hover:bg-white/10",
        ].join(" ")
      }
    >
      {icon}<span>{children}</span>
    </NavLink>
  );
}

function MobileBar({ pathname }) {
  const Item = ({ to, icon, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex flex-col items-center justify-center rounded-xl px-2.5 py-1 font-semibold transition",
          "text-[11px]",
          isActive ? "text-white" : "text-white/70",
        ].join(" ")
      }
    >
      {icon}
      <span className="mt-0.5">{label}</span>
    </NavLink>
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[rgba(12,18,28,.85)] backdrop-blur-md md:hidden">
      <div className="mx-auto max-w-[720px] grid grid-cols-3 items-center px-4 h-[60px]">
        <Item to="/home"   label="Home"    icon={<Home className="h-5 w-5" />} />
        <Item to="/account" label="Profile" icon={<UserIcon className="h-5 w-5" />} />
        <Item to="/browse" label="Browse"  icon={<Compass className="h-5 w-5" />} />
      </div>
      <div className="pb-[max(env(safe-area-inset-bottom),8px)]" />
    </div>
  );
}

function AccountMenu({ user }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!open) return;
      if (popRef.current && !popRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)) {
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
        className={[
          "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5",
          "pl-1.5 pr-2 py-0",
          ITEM_H,
          ITEM_TXT,
          "text-white/90 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
        ].join(" ")}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-[12px] font-bold">{initials}</span>
        <span className="hidden font-semibold md:block max-w-[160px] truncate">{name}</span>
        <ChevronDown className="hidden h-4 w-4 opacity-70 md:block" />
      </button>

      {open && (
        <div
          ref={popRef}
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[rgba(12,18,28,.92)] backdrop-blur-md shadow-xl ring-1 ring-black/20"
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
            onClick={signOut}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-semibold text-white/85 hover:bg-white/10 focus:outline-none"
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
          "flex items-center gap-2 px-3 py-2.5",
          "text-[13px] font-semibold",
          isActive ? "bg-white/10 text-white" : "text-white/85 hover:bg-white/10",
        ].join(" ")
      }
      role="menuitem"
    >
      {icon}{children}
    </NavLink>
  );
}