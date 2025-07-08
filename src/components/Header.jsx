// Header.jsx
import { useState } from "react";
import { LogOut, Settings, SlidersHorizontal, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; // Replace with your logo path

export default function Header({ user, onSignOut }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#14121a",
        padding: "10px 20px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        zIndex: 100,
      }}
    >
      {/* Left: Logo & Brand */}
      <div
        onClick={() => navigate("/app")}
        style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
      >
        <img src={logo} alt="FeelFlick Logo" style={{ height: 34, marginRight: 10 }} />
        <span style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>FeelFlick</span>
      </div>

      {/* Center: Search */}
      <div style={{ flex: 1, margin: "0 30px", position: "relative" }}>
        <input
          type="text"
          placeholder="Search movies, shows, or people…"
          style={{
            width: "100%",
            padding: "10px 42px 10px 16px",
            fontSize: 16,
            borderRadius: 30,
            border: "none",
            background: "#23212b",
            color: "#fff",
          }}
        />
        <Search
          size={20}
          color="#aaa"
          style={{ position: "absolute", right: 16, top: 10 }}
        />
      </div>

      {/* Right: Avatar */}
      <div style={{ position: "relative" }}>
        <div
          onClick={() => setShowMenu(!showMenu)}
          style={{
            background: "#3a3746",
            width: 38,
            height: 38,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          {user?.email?.[0]?.toUpperCase() || "A"}
        </div>

        {showMenu && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 48,
              background: "#1f1d26",
              borderRadius: 8,
              boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
              padding: "10px 0",
              minWidth: 180,
              zIndex: 10,
            }}
          >
            <MenuItem icon={<Settings size={18} />} text="Account Settings" onClick={() => navigate("/account")} />
            <MenuItem icon={<SlidersHorizontal size={18} />} text="Preferences" onClick={() => navigate("/preferences")} />
            <MenuItem icon={<LogOut size={18} />} text="Sign Out" onClick={onSignOut} />
          </div>
        )}
      </div>
    </header>
  );
}

function MenuItem({ icon, text, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 16px",
        color: "#fff",
        cursor: "pointer",
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#2d2a38")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ marginRight: 10 }}>{icon}</div>
      <span>{text}</span>
    </div>
  );
}
