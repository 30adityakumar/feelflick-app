// src/app/header/sidebar/Sidebar.jsx

import { NavLink } from "react-router-dom";
import { Home, Flame, Search, Clock, Bookmark } from "lucide-react";

const SIDEBAR_LINKS = [
  { to: "/app",        icon: <Home size={24} />,     label: "Home" },
  { to: "/trending",   icon: <Flame size={24} />,    label: "Trending" },
  { to: "/browse",     icon: <Search size={24} />,   label: "Browse" },     // <-- Your main movie search/filter/discover page!
  { to: "/history",    icon: <Clock size={24} />,    label: "History" },    // <-- Watched movies
  { to: "/watchlist",  icon: <Bookmark size={24} />, label: "Watchlist" },  // <-- Want-to-watch
];

export default function Sidebar() {
  return (
    <aside
      className="
        fixed left-0 z-40
        top-[56px] md:top-[56px]       // adjust to your header height!
        h-[calc(100vh-56px)]          // match header height!
        w-20 bg-[#18151c] flex flex-col py-4 border-r border-zinc-900
      "
    >
      {SIDEBAR_LINKS.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `flex flex-col items-center py-5 gap-1 text-zinc-400 hover:text-orange-400 transition group
             ${isActive ? "text-orange-400 font-bold bg-[#221b23]" : ""}
            `
          }
        >
          {link.icon}
          <span className="text-xs mt-1">{link.label}</span>
        </NavLink>
      ))}
    </aside>
  );
}
