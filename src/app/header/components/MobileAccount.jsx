// src/app/header/components/MobileAccount.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";
import {
  ChevronRight,
  User,
  Settings,
  Bookmark,
  Clock,
  LogOut,
  HelpCircle,
  Shield,
  Bell,
} from "lucide-react";

export default function MobileAccount() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();
  }, []);

  const name = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const email = user?.email || "";
  const initials = name
    .split(" ")
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "U";

  async function handleSignOut() {
    await supabase.auth.signOut();
    nav("/", { replace: true });
  }

  const menuSections = [
    {
      items: [
        { icon: <User className="h-5 w-5" />, label: "Profile", path: "/account" },
        { icon: <Settings className="h-5 w-5" />, label: "Settings", path: "/preferences" },
      ],
    },
    {
      title: "Library",
      items: [
        { icon: <Bookmark className="h-5 w-5" />, label: "Watchlist", path: "/watchlist" },
        { icon: <Clock className="h-5 w-5" />, label: "History", path: "/history" },
      ],
    },
    {
      title: "More",
      items: [
        { icon: <Bell className="h-5 w-5" />, label: "Notifications", path: "/notifications" },
        { icon: <Shield className="h-5 w-5" />, label: "Privacy", path: "/privacy" },
        { icon: <HelpCircle className="h-5 w-5" />, label: "Help & Support", path: "/help" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header with User Info */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-2xl border-b border-white/10">
        <div className="px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0 ring-4 ring-white/10">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-white truncate">{name}</h1>
              <p className="text-sm text-white/60 truncate mt-1">{email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="py-4">
        {menuSections.map((section, idx) => (
          <div key={idx} className="mb-6">
            {section.title && (
              <h2 className="px-6 py-2 text-xs font-bold text-white/50 uppercase tracking-wider">
                {section.title}
              </h2>
            )}
            <div className="divide-y divide-white/5">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => nav(item.path)}
                  className="flex w-full items-center gap-4 px-6 py-4 text-white/90 hover:bg-white/5 active:bg-white/10 transition-all group"
                >
                  <div className="text-white/80 group-hover:text-white group-active:scale-110 transition-all">
                    {item.icon}
                  </div>
                  <span className="text-base font-semibold flex-1 text-left">{item.label}</span>
                  <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white/70 transition-all" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Sign Out Button */}
        <div className="px-6 pt-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 active:bg-red-500/30 transition-all font-semibold group"
          >
            <LogOut className="h-5 w-5 group-active:scale-110 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* App Info */}
        <div className="px-6 py-8 text-center">
          <p className="text-xs text-white/40">FeelFlick v1.0.0</p>
          <p className="text-xs text-white/30 mt-1">© 2025 FeelFlick. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
