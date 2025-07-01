export default function TopNav({ onSignIn }) {
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
      <div style={{ display: "flex", alignItems: "center" }}>
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
