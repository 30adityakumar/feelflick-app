// src/app/header/Header.jsx
import { Link, useNavigate } from "react-router-dom"
import { Home, Compass, Search, User } from "lucide-react"

export default function Header({ user, onOpenSearch }) {
  const navigate = useNavigate()

  return (
    <>
      {/* ---------- Desktop Header ---------- */}
      <header className="hidden md:flex fixed top-0 inset-x-0 z-50 h-14 items-center justify-between px-6 border-b border-white/10 bg-neutral-950/75 backdrop-blur-md">
        {/* Logo */}
        <Link
          to="/home"
          className="text-white text-xl font-semibold tracking-wide hover:opacity-90 transition-all duration-200"
        >
          <span className="text-white/90 hover:text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]">
            FeelFlick
          </span>
        </Link>

        {/* Menu */}
        <nav className="flex items-center gap-8 text-[0.93rem] text-white/80 font-light">
          <NavItem label="Home" to="/home" />
          <NavItem label="Browse" to="/browse" />
          <button
            onClick={onOpenSearch}
            className="hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            Search
          </button>
          <NavItem label={user ? "Account" : "Sign In"} to="/account" />
        </nav>
      </header>

      {/* ---------- Mobile Bottom Bar ---------- */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-neutral-950/75 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex justify-around items-center h-14">
          <TabButton icon={<Home className="h-5 w-5" />} label="Home" onClick={() => navigate("/home")} />
          <TabButton icon={<Compass className="h-5 w-5" />} label="Browse" onClick={() => navigate("/browse")} />
          <button
            onClick={onOpenSearch}
            aria-label="Search"
            className="group -mt-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/95 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand/60 transition-all duration-150"
          >
            <Search className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>
          <TabButton icon={<User className="h-5 w-5" />} label="Account" onClick={() => navigate("/account")} />
        </div>
      </nav>
    </>
  )
}

function NavItem({ label, to }) {
  return (
    <Link
      to={to}
      className="hover:text-white transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-white/30"
    >
      {label}
    </Link>
  )
}

function TabButton({ label, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center text-white/80 text-xs hover:text-white focus:text-white transition-all duration-200"
    >
      {icon}
      <span className="mt-1 text-[0.7rem]">{label}</span>
    </button>
  )
}
