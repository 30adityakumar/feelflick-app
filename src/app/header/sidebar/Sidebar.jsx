// src/app/sidebar/Sidebar.jsx

import { NavLink } from "react-router-dom";
import { Home, Flame, Bookmark, Clock, User } from "lucide-react";

const SIDEBAR_LINKS = [
  { to: "/app",      icon: <Home size={24} />,     label: "Home" },
  { to: "/trending", icon: <Flame size={24} />,    label: "Trending" },
  { to: "/watchlist",icon: <Bookmark size={24}/>, label: "Watchlist" },
  { to: "/history",  icon: <Clock size={24} />,    label: "History" },
  { to: "/account",  icon: <User size={24} />,     label: "Account" },
];

export default function Sidebar() {
  return (
    <aside className="h-screen w-20 bg-[#18151c] flex flex-col py-4 border-r border-zinc-900 fixed top-0 left-0 z-40">
      {SIDEBAR_LINKS.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `flex flex-col items-center py-5 gap-1 text-zinc-400 hover:text-orange-400 transition group
             ${isActive ? "text-orange-400 font-bold bg-[#221b23]" : ""}
            `
          }
          tabIndex={0}
          aria-label={link.label}
        >
          {link.icon}
          <span className="text-xs mt-1">{link.label}</span>
        </NavLink>
      ))}
    </aside>
  );
}
