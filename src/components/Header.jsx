import { useState, useRef, useEffect } from "react";
import { LogOut, SlidersHorizontal, User2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header({ user, onSignOut }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef(null);

  // Search movies from Supabase (replace with TMDb if needed)
  useEffect(() => {
    if (!search) { setResults([]); return; }
    const fetchMovies = async () => {
      // Example: replace with real query if desired
      setResults([
        { id: 1, title: "Inception", poster_path: "/poster1.jpg" },
        { id: 2, title: "The Dark Knight", poster_path: "/poster2.jpg" },
      ]);
    };
    fetchMovies();
  }, [search]);

  // Hide menu on click-away
  useEffect(() => {
    const onClick = (e) => {
      if (!inputRef.current?.contains(e.target)) setSearchOpen(false);
    };
    if (searchOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [searchOpen]);

  // Hide account dropdown on outside click
  const menuRef = useRef();
  useEffect(() => {
    const handle = (e) => { if (showMenu && menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showMenu]);

  // Keyboard: / focuses search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Handle sign out and redirect to homepage
  const handleSignOut = async () => {
    if (onSignOut) await onSignOut();
    navigate("/");
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#14121a",
        padding: "9px 18px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.13)",
        zIndex: 100,
      }}
    >
      {/* Logo & Brand */}
      <div
        onClick={() => navigate("/app")}
        style={{
          display: "flex", alignItems: "center", gap: 8, cursor: "pointer", minWidth: 160
        }}
      >
        <img src="/logo.png" alt="FeelFlick" style={{
          height: 38, width: 38, borderRadius: 10, boxShadow: "0 1.5px 7px #0003"
        }} />
        <span style={{
          color: "#fff", fontSize: 24, fontWeight: 900,
          fontFamily: "Inter, sans-serif", letterSpacing: "-1px"
        }}>
          FeelFlick
        </span>
      </div>

      {/* Search */}
      <div style={{
        flex: 1, display: "flex", justifyContent: "center"
      }}>
        <div style={{
          position: "relative", width: "100%", maxWidth: 410, minWidth: 0,
        }} ref={inputRef}>
          <input
            value={search}
            onFocus={() => setSearchOpen(true)}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search movies, shows, or people…"
            style={{
              width: "100%",
              padding: "10px 40px 10px 16px",
              fontSize: 16,
              borderRadius: 24,
              border: "none",
              background: "#23212b",
              color: "#fff",
              fontFamily: "Inter, sans-serif",
              outline: "none",
              boxShadow: results.length && searchOpen ? "0 4px 24px #0003" : undefined,
              transition: "box-shadow .2s"
            }}
          />
          <Search
            size={20}
            color="#aaa"
            style={{ position: "absolute", right: 12, top: 12, pointerEvents: "none" }}
          />
          {/* Results dropdown */}
          {searchOpen && results.length > 0 && (
            <div style={{
              position: "absolute",
              left: 0, right: 0,
              top: 43,
              background: "#191820",
              borderRadius: 13,
              boxShadow: "0 4px 20px #0008",
              zIndex: 20,
              padding: "5px 0",
              marginTop: 4,
            }}>
              {results.map(m => (
                <div
                  key={m.id}
                  onClick={() => {
                    setSearch(""); setResults([]); setSearchOpen(false);
                    navigate(`/movie/${m.id}`);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                    padding: "7px 17px",
                    color: "#fff", fontSize: 15,
                    fontFamily: "Inter, sans-serif",
                    transition: "background .15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#23212b")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <img src={m.poster_path || "/placeholder.png"}
                    alt={m.title}
                    style={{ width: 36, height: 54, objectFit: "cover", borderRadius: 5, background: "#16151c" }}
                  />
                  <span>{m.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Account Dropdown */}
      <div style={{ position: "relative", minWidth: 70 }} ref={menuRef}>
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
            fontFamily: "Inter, sans-serif",
            fontSize: 18,
          }}
        >
          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
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
              minWidth: 185,
              zIndex: 30,
            }}
          >
            <MenuItem icon={<User2 size={18} />} text="My Account" onClick={() => { navigate("/account"); setShowMenu(false); }} />
            <MenuItem icon={<SlidersHorizontal size={18} />} text="Preferences" onClick={() => { navigate("/preferences"); setShowMenu(false); }} />
            <div style={{ borderTop: "1px solid #33323c", margin: "7px 0" }} />
            <MenuItem icon={<LogOut size={18} />} text="Sign Out" onClick={handleSignOut} />
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
        fontFamily: "Inter, sans-serif",
        fontSize: 15,
        transition: "background 0.18s",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "#2d2a38")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ marginRight: 10 }}>{icon}</div>
      <span>{text}</span>
    </div>
  );
}
