import { FaInstagram, FaTiktok, FaFacebookF, FaLinkedinIn } from "react-icons/fa";

export default function Footer() {
  const footerLinkStyle = {
    color: "#c7c9e6",
    opacity: 0.8,
    fontSize: 15,
    cursor: "pointer",
    marginBottom: 7,
    fontWeight: 400,
    textDecoration: "none",
    transition: "color 0.13s"
  };

  const iconButtonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.08)",
    width: 32,
    height: 32,
    marginRight: 9,
    marginBottom: 5,
    fontSize: 17,
    color: "#f9faff",
    border: "none",
    cursor: "pointer",
    transition: "background 0.14s, color 0.13s, transform 0.13s",
    outline: "none"
  };

  return (
    <footer style={{
      width: "100%", marginTop: 0,
      background: "linear-gradient(115deg, #151522 60%, #232a35 100%)",
      borderRadius: 0,
      padding: "40px 0 20px 0", color: "#fff",
      boxShadow: "0 -2px 24px 0 #0007",
      fontSize: 15
    }}>
      <div style={{
        display: "flex", flexWrap: "wrap", maxWidth: 1240,
        margin: "0 auto", justifyContent: "space-between", gap: 44, padding: "0 5vw"
      }}>
        <div style={{
          flex: "0 0 190px", display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: 10
        }}>
          <img src="/logo.png" alt="FeelFlick" style={{
            width: 42, height: 42, borderRadius: 10, marginBottom: 9, boxShadow: "0 2px 9px #ff5b2e14"
          }} />
          <span style={{
            fontWeight: 900, fontSize: 22, letterSpacing: "-1.2px", color: "#fff", marginBottom: 2
          }}>FeelFlick</span>
          <div style={{
            width: 46, height: 3, background: "linear-gradient(90deg, #fe9245 25%, #eb423b 80%, #367cff 100%)",
            borderRadius: 3, margin: "5px 0 8px 0"
          }} />
        </div>

        <div style={{ flex: "1 1 130px", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 7, fontSize: 14.5, color: "#fff" }}>About</div>
          <div style={footerLinkStyle}>Contact Us</div>
          <div style={footerLinkStyle}>Careers</div>
          <div style={footerLinkStyle}>Feedback</div>
        </div>
        <div style={{ flex: "1 1 130px", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 7, fontSize: 14.5, color: "#fff" }}>Legal</div>
          <div style={footerLinkStyle}>Privacy Policy</div>
          <div style={footerLinkStyle}>Terms of Use</div>
          <div style={footerLinkStyle}>Cookie Policy</div>
        </div>
        <div style={{ flex: "1 1 130px", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 7, fontSize: 14.5, color: "#fff" }}>Help</div>
          <div style={footerLinkStyle}>Help Center</div>
          <div style={footerLinkStyle}>FAQ</div>
          <div style={footerLinkStyle}>How it Works</div>
        </div>
        <div style={{ flex: "1 1 180px", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 7, fontSize: 14.5, color: "#fff" }}>Social</div>
          <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <a href="https://instagram.com/feelflick" style={iconButtonStyle} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="https://tiktok.com/@feelflick" style={iconButtonStyle} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <FaTiktok />
            </a>
            <a href="https://facebook.com" style={iconButtonStyle} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <FaFacebookF />
            </a>
            <a href="https://linkedin.com" style={iconButtonStyle} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <FaLinkedinIn />
            </a>
          </div>
        </div>
      </div>
      <div style={{
        textAlign: "center", color: "#fff", fontSize: 13,
        opacity: 0.17, marginTop: 28, letterSpacing: "0.02em", fontWeight: 400
      }}>
        &copy; {new Date().getFullYear()} FeelFlick &mdash; All rights reserved.
      </div>
    </footer>
  )
}
