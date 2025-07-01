import { HiOutlineHome } from "react-icons/hi2";
import { useState } from "react";

export default function TopNav({ onSignIn }) {
  const [isHover, setIsHover] = useState(false);

  function handleHomeClick(e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div style={{
      position: 'fixed',
      top: 36, left: 38, right: 38, zIndex: 3,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "calc(100vw - 76px)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <img src="/logo.png" alt="FeelFlick" style={{
          height: 44, width: 44, borderRadius: 12, boxShadow: "0 2px 8px #0003"
        }} />
        <span style={{
          fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-1.2px", textShadow: "0 1px 7px #19194044"
        }}>FeelFlick</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <button
          onClick={handleHomeClick}
          style={{
            background: "transparent",
            color: isHover ? "#ff7b48" : "#fff",
            border: "none",
            fontWeight: 800,
            fontSize: 20,
            padding: "7px 10px 7px 10px",
            borderRadius: 8,
            cursor: "pointer",
            opacity: isHover ? 1 : 0.72,
            display: "flex",
            alignItems: "center",
            transition: "color 0.17s, opacity 0.17s"
          }}
          aria-label="Home"
          tabIndex={0}
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
        >
          <HiOutlineHome size={20} style={{
            marginRight: 0,
            opacity: isHover ? 1 : 0.76,
            transition: "color 0.15s, opacity 0.17s"
          }} />
        </button>
        <button
          onClick={onSignIn}
          style={{
            background: `linear-gradient(90deg,#fe9245 10%,#eb423b 90%)`,
            color: "#fff", border: "none", borderRadius: 8,
            fontWeight: 700, fontSize: 18, padding: "9px 30px",
            boxShadow: "0 2px 8px #fe92451a", cursor: "pointer"
          }}
        >SIGN IN</button>
      </div>
    </div>
  )
}
