import { NavLink } from "react-router-dom";
import { Home, Flame, Search, Clock, Bookmark } from "lucide-react";

const SIDEBAR_LINKS = [
  { to: "/app",        icon: <Home size={24} />,     label: "Home" },
  { to: "/trending",   icon: <Flame size={24} />,    label: "Trending" },
  { to: "/browse",     icon: <Search size={24} />,   label: "Browse" },
  { to: "/history",    icon: <Clock size={24} />,    label: "History" },
  { to: "/watchlist",  icon: <Bookmark size={24} />, label: "Watchlist" },
];

export default function Sidebar() {
  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside
        className="
          fixed left-0 z-40
          top-[56px] md:top-[56px]
          h-[calc(100vh-56px)]
          w-16 bg-black flex-col py-3 border-r border-zinc-900
          hidden md:flex
        "
      >
        {SIDEBAR_LINKS.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center py-4 gap-1 text-zinc-400 hover:text-orange-400 transition group
               ${isActive ? "text-orange-400 font-bold bg-[#221b23]" : ""}
              `
            }
          >
            {link.icon}
            <span className="text-xs mt-1">{link.label}</span>
          </NavLink>
        ))}
      </aside>

      {/* Mobile Bottom Nav */}
      <nav
        className="
          fixed bottom-0 left-0 right-0 z-40
          bg-black border-t border-zinc-900
          flex md:hidden justify-between px-2 py-1
        "
        style={{ height: "54px" }}
      >
        {SIDEBAR_LINKS.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center flex-1 text-zinc-400 hover:text-orange-400 transition group
               ${isActive ? "text-orange-400 font-bold" : ""}
              `
            }
            tabIndex={0}
            aria-label={link.label}
          >
            {/* Active indicator bar */}
            {({ isActive }) =>
              isActive && (
                <span
                  className="
                    absolute top-0 left-1/2 -translate-x-1/2
                    w-6 h-[3px] rounded-b-xl
                    bg-gradient-to-r from-orange-400 to-red-500
                    animate-fadeIn
                  "
                  style={{ zIndex: 5 }}
                />
              )
            }
            {link.icon}
            <span className="text-[11px] leading-none mt-0.5">{link.label}</span>
          </NavLink>
        ))}
      </nav>
      {/* Animation for indicator */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.28s ease-in; }
      `}</style>
    </>
  );
}
