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
} from "lucide-react";

/**
 * Production-grade header:
 * - Wordmark only (FEELFLICK)
 * - Clean responsive nav
 * - Keyboard '/' to open search (desktop)
 * - Accessible account menu
 * - Mobile bottom nav
 */
export default function Header({ onOpenSearch }) {
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);

  // Lightweight user fetch
  useEffect(() => {
    let unsub;
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user || null);
    });
    unsub = data?.subscription?.unsubscribe;
    return () => { if (typeof unsub === "function") unsub(); };
  }, []);

  // Desktop keyboard shortcut for search
  useEffect(() => {
    function onKey(e) {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target?.tagName || "").toLowerCase();
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault();
          onOpenSearch?.();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenSearch]);

  return (
    <>
      {/* Top app bar */}
      <header
        className="
          sticky top-0 z-40
          backdrop-blur-md bg-neutral-950/60 ring-1 ring-white/10
        "
      >
        <div className="mx-auto grid h-14 w-full max-w-[1200px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-4 md:h-16 md:px-6">
          {/* Brand (left) */}
          <div className="min-w-0">
            <Link
              to="/home"
              className="inline-flex items-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
              aria-label="FeelFlick Home"
            >
              <span
                className="
                  text-[clamp(1.05rem,2.2vw,1.35rem)]
                  font-extrabold tracking-tight text-brand-100 uppercase
                  hover:text-white transition-colors
                "
              >
                FEELFLICK
              </span>
            </Link>
          </div>

          {/* Primary nav (center; hides on small) */}
          <nav className="hidden min-w-0 items-center justify-center gap-1 md:flex">
            <TopLink to="/home" icon={<Home className="h-4.5 w-4.5" />}>
              Home
            </TopLink>
            <TopLink to="/browse" icon={<Compass className="h-4.5 w-4.5" />}>
              Browse
            </TopLink>
          </nav>

          {/* Utilities (right) */}
          <div className="flex min-w-0 items-center justify-end gap-1.5">
            {/* Desktop search */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="
                hidden md:inline-flex h-9 items-center gap-2 rounded-full
                border border-white/12 bg-white/5 px-3 text-[0.92rem] text-white/90
                hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60
              "
              aria-label="Search"
              title="Search"
            >
              <SearchIcon className="h-4 w-4 text-white/85" />
              <span className="text-white/80">Search</span>
              <kbd className="ml-1 hidden rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60 md:inline">
                /
              </kbd>
            </button>

            {/* Mobile search (icon only) */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="
                inline-flex h-9 w-9 items-center justify-center rounded-full
                border border-white/12 bg-white/5 text-white/90 hover:bg-white/10
                focus:outline-none md:hidden
              "
              aria-label="Search"
              title="Search"
            >
              <SearchIcon className="h-4.5 w-4.5" />
            </button>

            {/* Account dropdown */}
            <AccountMenu user={user} />
          </div>
        </div>
      </header>

      {/* Bottom mobile nav */}
      <MobileBar pathname={pathname} onOpenSearch={onOpenSearch} />
    </>
  );
}

/* --------------------------- Helpers --------------------------- */

function TopLink({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
          isActive
            ? "bg-white/10 text-white ring-1 ring-white/10"
            : "text-white/75 hover:text-white hover:bg-white/10",
        ].join(" ")
      }
      aria-current={({ isActive }) => (isActive ? "page" : undefined)}
    >
      {icon}
      <span>{children}</span>
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
      aria-current={({ isActive }) => (isActive ? "page" : undefined)}
    >
      {icon}
      <span className="mt-0.5">{label}</span>
    </NavLink>
  );

  return (
    <div
      className="
        fixed inset-x-0 bottom-0 z-40 border-t border-white/10
        bg-neutral-950/75 backdrop-blur-md md:hidden
      "
    >
      <div className="mx-auto grid h-14 max-w-[640px] grid-cols-3 items-center px-4">
        <Item
          to="/home"
          label="Home"
          icon={<Home className="h-5 w-5" />}
          active={pathname === "/"}
        />
        <button
          type="button"
          onClick={onOpenSearch}
          className="
            mx-auto inline-flex h-10 w-28 items-center justify-center gap-2 rounded-full
            border border-white/15 bg-white/5 text-[13px] font-semibold text-white/90
            hover:bg-white/10 focus:outline-none
          "
          aria-label="Search"
        >
          <SearchIcon className="h-4.5 w-4.5" />
          Search
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
      if (
        popRef.current &&
        !popRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    function onKey(e) {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    await supabase.auth.signOut();
    nav("/", { replace: true });
  }

  const name =
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Account";

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="
          inline-flex items-center gap-2 rounded-full border border-white/12
          bg-white/5 px-2.5 py-1.5 text-white/90 hover:bg-white/10
          focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60
        "
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <UserIcon className="h-4.5 w-4.5 text-white/85" />
        <span className="hidden text-[13px] font-semibold md:block">
          {name}
        </span>
        <ChevronDown className="hidden h-4 w-4 opacity-70 md:block" />
      </button>

      {open && (
        <div
          ref={popRef}
          role="menu"
          className="
            absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10
            bg-neutral-950/90 backdrop-blur-md shadow-xl ring-1 ring-black/20
          "
        >
          <MenuLink to="/account" icon={<UserIcon className="h-4 w-4" />} onClick={() => setOpen(false)}>
            Account
          </MenuLink>
          <MenuLink to="/preferences" icon={<Settings className="h-4 w-4" />} onClick={() => setOpen(false)}>
            Preferences
          </MenuLink>

          <div className="my-1 h-px bg-white/10" />
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-semibold text-white/85 hover:bg-white/10 focus:outline-none"
          >
            <LogOut className="h-4 w-4" />
            Sign out
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
      aria-current={({ isActive }) => (isActive ? "page" : undefined)}
    >
      {icon}
      {children}
    </NavLink>
  );
}