// Footer.jsx
export default function Footer() {
  const footerLinkStyle = {
    color: "#fff",
    opacity: 0.75,
    fontSize: 15,
    cursor: "pointer",
    marginBottom: 7
  }
  return (
    <footer style={{
      width: "100%", marginTop: 40,
      background: "#14192b", borderRadius: 0,
      padding: "38px 0 24px 0", color: "#fff"
    }}>
      <div style={{
        display: "flex", flexWrap: "wrap", maxWidth: 1040,
        margin: "0 auto", justifyContent: "space-between", gap: 32, padding: "0 10px"
      }}>
        <div style={{
          flex: "0 0 170px", display: "flex", flexDirection: "column", alignItems: "flex-start"
        }}>
          <img src="/logo.png" alt="FeelFlick" style={{
            width: 40, height: 40, borderRadius: 10, marginBottom: 7
          }} />
          <span style={{
            fontWeight: 800, fontSize: 21, letterSpacing: "-0.9px", color: "#fff"
          }}>FeelFlick</span>
          <div style={{
            color: "#fdaf41", fontSize: 13, marginTop: 2
          }}>Movies that match your mood.</div>
        </div>
        <div style={{ flex: "1 1 120px" }}>
          <div style={{ fontWeight: 700, marginBottom: 7 }}>About us</div>
          <div style={footerLinkStyle}>Contact us</div>
          <div style={footerLinkStyle}>Careers</div>
        </div>
        <div style={{ flex: "1 1 120px" }}>
          <div style={{ fontWeight: 700, marginBottom: 7 }}>Legal</div>
          <div style={footerLinkStyle}>Privacy Policy</div>
          <div style={footerLinkStyle}>Terms of use</div>
        </div>
        <div style={{ flex: "1 1 120px" }}>
          <div style={{ fontWeight: 700, marginBottom: 7 }}>Social</div>
          <div style={footerLinkStyle}>Instagram</div>
          <div style={footerLinkStyle}>TikTok</div>
          <div style={footerLinkStyle}>Facebook</div>
          <div style={footerLinkStyle}>LinkedIn</div>
        </div>
      </div>
      <div style={{
        textAlign: "center", color: "#fff", fontSize: 13,
        opacity: 0.25, marginTop: 20
      }}>
        © {new Date().getFullYear()} FeelFlick — Movies that match your mood.
      </div>
    </footer>
  )
}
