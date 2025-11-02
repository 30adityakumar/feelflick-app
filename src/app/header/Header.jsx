// src/app/header/Header.jsx
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";
import { Home, Compass, Search as SearchIcon, ChevronDown, LogOut, User as UserIcon, Settings } from "lucide-react";

const SHELL = "w-full px-4 sm:px-6 lg:px-8";

export default function Header({ onOpenSearch }) {
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    let unsub;
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user || null);
    });
    unsub = data?.subscription?.unsubscribe;
    return () => { if (typeof unsub === "function") unsub(); };
  }, []);

  return (
    <>
      {/* NOTE: add the `sticky` class so our global CSS can apply the no-gap sibling rule */}
      <header className="sticky top-0 z-40 ring-1 ring-white/10 bg-[rgba(0,0,0,.5)] backdrop-blur-md">
        <div className={`${SHELL} flex h-14 md:h-16 items-center justify-between gap-3`}>
          <div className="flex min-w-0 items-center gap-4">
            <Link to="/home" aria-label="FeelFlick Home" className="select-none">
              <span className="block text-[clamp(1.2rem,2.6vw,1.7rem)] font-extrabold tracking-[0.06em] text-white/95 uppercase">
                FEELFLICK
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-2">
              <TopLink to="/home" icon={<Home className="h-4.5 w-4.5" />}>Home</TopLink>
              <TopLink to="/browse" icon={<Compass className="h-4.5 w-4.5" />}>Browse</TopLink>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSearch}
              className="hidden md:inline-flex h-9 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 text-[0.9rem] text-white/90 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              aria-label="Search"
              title="Search"
            >
              <SearchIcon className="h-4 w-4 text-white/85" />
              <span className="text-white/80">Search</span>
              <kbd className="ml-1 hidden rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60 md:inline">/</kbd>
            </button>
            <AccountMenu user={user} />
          </div>
        </div>
      </header>

      <MobileBar pathname={pathname} onOpenSearch={onOpenSearch} />
    </>
  );
}

function TopLink({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
          isActive ? "bg-white/10 text-white ring-1 ring-white/10"
                   : "text-white/75 hover:text-white hover:bg-white/10",
        ].join(" ")
      }
    >
      {icon}<span>{children}</span>
    </NavLink>
  );
}


function MobileBar({ pathname, onOpenSearch }) {
  const Item = ({ to, icon, label, active }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex flex-col items-center justify-center rounded-xl px-3 py-1.5 text-[11px] font-semibold transition",
          (isActive || active) ? "text-white" : "text-white/70",
        ].join(" ")
      }
    >
      {icon}<span className="mt-0.5">{label}</span>
    </NavLink>
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-neutral-950/80 backdrop-blur-md md:hidden pb-[max(env(safe-area-inset-bottom),8px)]">
      <div className="mx-auto max-w-[720px] grid h-[60px] grid-cols-3 items-center px-4">
        <Item to="/home" label="Home" icon={<Home className="h-5 w-5" />} active={pathname === "/"} />
        <button
          type="button"
          onClick={onOpenSearch}
          className="mx-auto inline-flex h-10 w-[44vw] max-w-[260px] items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 text-[13px] font-semibold text-white/90 shadow-[0_6px_24px_rgba(0,0,0,.35)] hover:bg-white/10 focus:outline-none"
          aria-label="Search"
        >
          <SearchIcon className="h-4.5 w-4.5" /> Search
        </button>
        <Item to="/browse" label="Browse" icon={<Compass className="h-5 w-5" />} />
      </div>
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
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  async function signOut() { await supabase.auth.signOut(); nav("/auth", { replace: true }); }

  const name = user?.user_metadata?.name || user?.email?.split("@")[0] || "Account";
  const initials = (name || "").split(" ").map(s => s[0]?.toUpperCase()).slice(0,2).join("") || "U";

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(s => !s)}
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 pl-1 pr-2 py-1 text-white/90 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-[12px] font-bold">{initials}</span>
        <span className="hidden text-[13px] font-semibold md:block max-w-[160px] truncate">{name}</span>
        <ChevronDown className="hidden h-4 w-4 opacity-70 md:block" />
      </button>

      {open && (
        <div
          ref={popRef}
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-neutral-950/90 backdrop-blur-md shadow-xl ring-1 ring-black/20"
        >
          {/* Profile section */}
          <MenuLink to="/account" icon={<UserIcon className="h-4 w-4" />} onClick={() => setOpen(false)}>Account</MenuLink>
          <MenuLink to="/preferences" icon={<Settings className="h-4 w-4" />} onClick={() => setOpen(false)}>Preferences</MenuLink>

          <div className="my-1 h-px bg-white/10" />

          {/* Library quick links — ⬅️ NEW */}
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
          "flex items-center gap-2 px-3 py-2.5 text-[13px] font-semibold",
          isActive ? "bg-white/10 text-white" : "text-white/85 hover:bg-white/10",
        ].join(" ")
      }
      role="menuitem"
    >
      {icon}{children}
    </NavLink>
  );
}