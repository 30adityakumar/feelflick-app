// Footer.jsx
import { FaInstagram, FaTiktok, FaFacebookF, FaLinkedinIn } from "react-icons/fa";

export default function Footer() {
  const footerLinkStyle = {
    color: "#c7c9e6",
    opacity: 0.88,
    fontSize: 17,
    cursor: "pointer",
    marginBottom: 9,
    fontWeight: 400,
    textDecoration: "none",
    transition: "color 0.15s"
  };

  const iconButtonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.09)",
    width: 38,
    height: 38,
    marginRight: 11,
    marginBottom: 7,
    fontSize: 21,
    color: "#f9faff",
    border: "none",
    cursor: "pointer",
    transition: "background 0.17s, color 0.17s, transform 0.16s",
    outline: "none"
  };

  return (
    <footer style={{
      width: "100%", marginTop: 0,
      background: "linear-gradient(115deg, #151522 60%, #232a35 100%)",
      borderRadius: 0,
      padding: "52px 0 32px 0", color: "#fff",
      boxShadow: "0 -2px 24px 0 #0007",
    }}>
      <div style={{
        display: "flex", flexWrap: "wrap", maxWidth: 1240,
        margin: "0 auto", justifyContent: "space-between", gap: 44, padding: "0 6vw"
      }}>
        <div style={{
          flex: "0 0 230px", display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: 18
        }}>
          <img src="/logo.png" alt="FeelFlick" style={{
            width: 55, height: 55, borderRadius: 13, marginBottom: 11, boxShadow: "0 2px 9px #ff5b2e19"
          }} />
          <span style={{
            fontWeight: 900, fontSize: 28, letterSpacing: "-1.4px", color: "#fff", marginBottom: 4
          }}>FeelFlick</span>
          <div style={{
            width: 56, height: 4, background: "linear-gradient(90deg, #fe9245 25%, #eb423b 80%, #367cff 100%)",
            borderRadius: 4, margin: "7px 0 14px 0"
          }} />
          <div style={{
            color: "#fdaf41", fontSize: 15, marginBottom: 7, fontWeight: 400, letterSpacing: "-0.5px"
          }}>Movies that match your mood.</div>
        </div>

        <div style={{ flex: "1 1 160px", marginBottom: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 17, color: "#fff" }}>About</div>
          <div style={footerLinkStyle}>Contact us</div>
          <div style={footerLinkStyle}>Careers</div>
        </div>
        <div style={{ flex: "1 1 160px", marginBottom: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 17, color: "#fff" }}>Legal</div>
          <div style={footerLinkStyle}>Privacy Policy</div>
          <div style={footerLinkStyle}>Terms of use</div>
        </div>
        <div style={{ flex: "1 1 220px", marginBottom: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 17, color: "#fff" }}>Social</div>
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
        textAlign: "center", color: "#fff", fontSize: 15,
        opacity: 0.20, marginTop: 40, letterSpacing: "0.02em", fontWeight: 400
      }}>
        © {new Date().getFullYear()} FeelFlick — Movies that match your mood.
      </div>
    </footer>
  )
}
