import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Search,
  Menu,
  UserCircle2,
  LogOut,
  Settings,
  User2,
} from "lucide-react";

export default function Header({
  user = {},
  genres = [],
  favMovies = [],
  onboardingComplete = true,
  onboardingPercent = 100,
  activeTab = "home",
  onTabChange = () => {},
  onSignOut = () => {},
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  // Click outside account menu closes it
  const accountRef = useRef();
  useEffect(() => {
    function handleClick(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    }
    if (accountOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [accountOpen]);

  const genreNames = genres.map(g => g.name || g).slice(0, 3).join(" • ");
  const topMovie = favMovies[0]?.title || favMovies[0];
  const tabs = [
    { label: "Home", key: "home" },
    { label: "Browse", key: "browse" },
    { label: "Recommendations", key: "recommendations", badge: !onboardingComplete },
    { label: "Watchlist", key: "watchlist" },
    { label: "History", key: "history" },
  ];

  let capsule = "";
  if (!onboardingComplete) {
    if (genres.length && favMovies.length) capsule = "Tailored just for you 🎉";
    else if (genres.length) capsule = `Your genres: ${genreNames}`;
    else if (favMovies.length) capsule = `Because you liked ${topMovie}`;
    else capsule = "Tell us what you like for smarter picks!";
  }

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "linear-gradient(90deg,#fe9245 0%,#eb423b 80%,#15132a 100%)",
      boxShadow: "0 2px 18px #18141c30",
      backdropFilter: "blur(8px)",
      minHeight: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 18px",
      borderBottom: "1px solid #fe924544",
      flexDirection: "column"
    }}>
      {/* Onboarding progress bar */}
      {!onboardingComplete && (
        <div style={{
          width: "100%",
          height: 5,
          background: "#2c242c",
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          marginBottom: 3,
          overflow: "hidden"
        }}>
          <div style={{
            width: `${Math.min(Math.max(onboardingPercent, 0), 100)}%`,
            height: "100%",
            background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
            transition: "width 0.6s cubic-bezier(.42,2,.7,.8)"
          }} />
        </div>
      )}

      <div style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        {/* Logo and Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none" }}>
            <img src="/logo.png" alt="FeelFlick" style={{
              width: 36, height: 36, borderRadius: 9, boxShadow: "0 1.5px 8px #0002"
            }} />
            <span style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 900,
              fontSize: 21,
              color: "#fff",
              letterSpacing: "-1.3px",
              textShadow: "0 1px 7px #19194044"
            }}>
              FeelFlick
            </span>
          </a>
          {capsule && (
            <span style={{
              marginLeft: 15,
              background: "rgba(255,255,255,0.09)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              padding: "6px 18px",
              borderRadius: 22,
              letterSpacing: "-.01em",
              backdropFilter: "blur(3px)",
              boxShadow: "0 1px 4px #19194022"
            }}>
              {capsule}
            </span>
          )}
        </div>

        {/* Center: Tabs (hide on mobile) */}
        <nav className="main-nav" style={{
          display: window.innerWidth > 700 ? "flex" : "none",
          alignItems: "center",
          gap: 6,
          marginLeft: 32,
          marginRight: 24,
          flex: 1,
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              style={{
                position: "relative",
                fontFamily: "'Inter', system-ui, sans-serif",
                background: "none",
                border: "none",
                color: activeTab === tab.key ? "#fe9245" : "#fff",
                fontWeight: 700,
                fontSize: 16,
                padding: "9px 19px 7px 19px",
                margin: "0 2px",
                borderRadius: 13,
                outline: "none",
                cursor: "pointer",
                transition: "color 0.14s, background 0.17s",
                backgroundColor: activeTab === tab.key ? "rgba(255,255,255,0.07)" : "none"
              }}
              onClick={() => onTabChange(tab.key)}
            >
              {tab.label}
              {tab.badge && (
                <span style={{
                  position: "absolute", top: 5, right: 10,
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#fdaf41", boxShadow: "0 0 8px #fdaf4140"
                }} />
              )}
            </button>
          ))}
        </nav>

        {/* Right: Search, notification, account */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "5px",
                borderRadius: 7
              }}
              onClick={() => setSearchOpen(v => !v)}
              aria-label="Open search"
            >
              <Search size={22} />
            </button>
            {searchOpen && (
              <input
                autoFocus
                type="text"
                placeholder="Search movies…"
                style={{
                  position: "absolute",
                  top: 36, right: 0,
                  width: 220,
                  padding: "9px 13px",
                  borderRadius: 9,
                  border: "1px solid #fdaf41",
                  background: "#18141c",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 500,
                  outline: "none",
                  boxShadow: "0 4px 18px #eb423b33"
                }}
                onBlur={() => setSearchOpen(false)}
              />
            )}
          </div>
          {/* Notification bell */}
          <button
            style={{
              background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: 7, position: "relative"
            }}
            aria-label="Notifications"
          >
            <Bell size={22} color={!onboardingComplete ? "#fe9245" : "#fff"} />
            {!onboardingComplete && (
              <span style={{
                position: "absolute", top: 7, right: 7,
                width: 7, height: 7, borderRadius: "50%",
                background: "#fdaf41", boxShadow: "0 0 7px #fdaf4144"
              }} />
            )}
          </button>
          {/* Account (with dropdown) */}
          <div ref={accountRef} style={{ position: "relative" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                cursor: "pointer",
                borderRadius: 16,
                padding: "4px 10px 4px 4px",
                background: "rgba(255,255,255,0.06)"
              }}
              onClick={() => setAccountOpen(o => !o)}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" style={{
                  width: 29, height: 29, borderRadius: "50%", objectFit: "cover", marginRight: 5
                }} />
              ) : (
                <div style={{
                  width: 29, height: 29, borderRadius: "50%",
                  background: "#33313a", color: "#fe9245",
                  fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                  marginRight: 5
                }}>
                  {user.name ? user.name[0].toUpperCase() : "?"}
                </div>
              )}
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
                {user.name || user.email || "Account"}
              </span>
            </div>
            {/* Dropdown menu */}
            {accountOpen && (
              <div style={{
                position: "absolute", right: 0, top: 40,
                background: "#231d2d",
                borderRadius: 13, boxShadow: "0 8px 34px #19194044",
                padding: "13px 0",
                minWidth: 170,
                zIndex: 1001
              }}>
                <button style={menuBtnStyle}><User2 size={17} style={{ marginRight: 10 }} /> My Account</button>
                <button style={menuBtnStyle}><Settings size={17} style={{ marginRight: 10 }} /> Settings</button>
                <button style={menuBtnStyle} onClick={onSignOut}><LogOut size={17} style={{ marginRight: 10 }} /> Sign Out</button>
              </div>
            )}
          </div>
          {/* Hamburger for mobile */}
          <button
            className="mobile-nav-btn"
            style={{
              display: window.innerWidth > 700 ? "none" : "block",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "5px"
            }}
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileNavOpen && (
        <div style={{
          position: "absolute", top: 58, right: 14, background: "#18141c",
          boxShadow: "0 4px 20px #19194055", borderRadius: 13, padding: "14px 12px", minWidth: 160,
          zIndex: 999
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              style={{
                display: "block", width: "100%",
                background: "none", border: "none",
                color: activeTab === tab.key ? "#fe9245" : "#fff",
                fontWeight: 700, fontSize: 16,
                padding: "10px 0", borderRadius: 10, textAlign: "left", cursor: "pointer"
              }}
              onClick={() => { onTabChange(tab.key); setMobileNavOpen(false); }}
            >
              {tab.label}
              {tab.badge && (
                <span style={{
                  display: "inline-block", marginLeft: 6, width: 7, height: 7,
                  borderRadius: "50%", background: "#fdaf41", boxShadow: "0 0 8px #fdaf4140"
                }} />
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

// Menu button style for dropdown
const menuBtnStyle = {
  display: "flex", alignItems: "center", width: "100%",
  background: "none", border: "none", color: "#fff",
  fontWeight: 700, fontSize: 15, padding: "10px 17px",
  borderRadius: 10, cursor: "pointer", textAlign: "left"
};
