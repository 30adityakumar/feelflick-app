import React from "react";

// Chexy-style color palette
const COLORS = {
  bg: "#10131a",
  heroBg: "#14192b",
  accent: "#fe9245",
  accent2: "#eb423b",
  cardBg: "#fff",
  cardText: "#131521",
  footerBg: "#fff",
  footerText: "#14192b"
};

export default function ChexyStyleHomePage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      fontFamily: "Inter, system-ui, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, left: 0, zIndex: 10,
        width: "100%", background: "rgba(255,255,255,0.86)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "22px 44px 20px 42px", boxShadow: "0 2px 20px #0002"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <img src="/logo.png" alt="FeelFlick" style={{
            width: 40, height: 40, borderRadius: 11, marginRight: 7
          }} />
          <span style={{
            fontWeight: 800, fontSize: 23, color: COLORS.footerText, letterSpacing: "-1px"
          }}>FeelFlick</span>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <NavLink>Home</NavLink>
          <NavLink>Features</NavLink>
          <NavLink>Pricing</NavLink>
          <NavLink>FAQ</NavLink>
          <button style={{
            background: `linear-gradient(90deg,${COLORS.accent} 18%,${COLORS.accent2} 82%)`,
            color: "#fff", border: "none", borderRadius: 8,
            fontWeight: 700, fontSize: 17, padding: "10px 30px",
            boxShadow: "0 2px 12px #fe924533", cursor: "pointer"
          }}>Get Started</button>
        </nav>
      </header>

      {/* HERO */}
      <section style={{
        minHeight: "86vh", width: "100%",
        background: COLORS.heroBg,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        padding: "0 18px"
      }}>
        <h1 style={{
          fontWeight: 900,
          fontSize: "clamp(2.2rem,6vw,4.2rem)",
          color: "#fff",
          marginBottom: 22,
          letterSpacing: "-1.7px"
        }}>
          Movies that match your mood.
        </h1>
        <p style={{
          fontSize: "1.26rem", color: "#d9e6f2",
          marginBottom: 38, opacity: 0.93, maxWidth: 520, lineHeight: 1.5
        }}>
          Get the perfect movie recommendation based on your taste and how you’re feeling today.<br />
          Fast, private, and always free.
        </p>
        <button style={{
          background: `linear-gradient(90deg,${COLORS.accent} 18%,${COLORS.accent2} 82%)`,
          color: "#fff", border: "none", borderRadius: 9,
          fontWeight: 900, fontSize: 19, padding: "16px 48px",
          boxShadow: "0 4px 18px #fe924522", cursor: "pointer"
        }}>Get Started</button>
      </section>

      {/* FEATURE GRID */}
      <section style={{
        width: "100%", background: "#fff", padding: "64px 0 54px 0"
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "0 18px"
        }}>
          <h2 style={{
            fontWeight: 900, fontSize: "2.1rem", color: COLORS.footerText,
            textAlign: "center", marginBottom: 42
          }}>Why FeelFlick?</h2>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "center"
          }}>
            {features.map((f, i) => (
              <div key={i} style={{
                flex: "1 1 180px", minWidth: 200, maxWidth: 250,
                background: "#fff", borderRadius: 19,
                boxShadow: "0 3px 22px #14192b0a, 0 1.5px 4px #eb423b0a",
                padding: "32px 19px 26px 19px", color: COLORS.cardText,
                textAlign: "center", margin: 0,
                display: "flex", flexDirection: "column", alignItems: "center",
                transition: "box-shadow 0.18s", cursor: "pointer"
              }}>
                <div style={{ fontSize: 36, marginBottom: 11 }}>{f.icon}</div>
                <div style={{
                  fontWeight: 700, fontSize: "1.11rem", marginBottom: 9,
                  color: COLORS.cardText, letterSpacing: "-0.01em"
                }}>{f.label}</div>
                <div style={{
                  fontSize: 14, color: "#334", opacity: 0.91, lineHeight: 1.45
                }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION / JOIN */}
      <section style={{
        width: "100%", background: "#fff", padding: "0 0 72px 0"
      }}>
        <div style={{
          maxWidth: 600, margin: "0 auto", background: "#fff",
          borderRadius: 17, boxShadow: "0 2px 14px #0002",
          padding: "36px 28px", textAlign: "center"
        }}>
          <div style={{
            fontWeight: 900, color: COLORS.footerText, fontSize: 22, marginBottom: 14
          }}>
            Ready to get started?
          </div>
          <button style={{
            background: `linear-gradient(90deg,${COLORS.accent} 18%,${COLORS.accent2} 82%)`,
            color: "#fff", border: "none", borderRadius: 8,
            fontWeight: 900, fontSize: 16, padding: "13px 34px",
            boxShadow: "0 2px 8px #eb423b18", cursor: "pointer"
          }}>Create your free account</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        width: "100%", background: COLORS.footerBg,
        color: COLORS.footerText, padding: "52px 0 30px 0",
        borderRadius: 0, borderTop: "1px solid #e4e6ea", marginTop: 18
      }}>
        <div style={{
          display: "flex", flexWrap: "wrap", maxWidth: 1040,
          margin: "0 auto", justifyContent: "space-between", gap: 34, padding: "0 12px"
        }}>
          <div style={{
            flex: "0 0 180px", display: "flex", flexDirection: "column", alignItems: "flex-start"
          }}>
            <img src="/logo.png" alt="FeelFlick" style={{
              width: 40, height: 40, borderRadius: 10, marginBottom: 7
            }} />
            <span style={{
              fontWeight: 800, fontSize: 21, letterSpacing: "-0.9px", color: COLORS.footerText
            }}>FeelFlick</span>
            <div style={{
              color: COLORS.accent, fontSize: 13, marginTop: 2
            }}>Movies that match your mood.</div>
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <div style={{ fontWeight: 700, marginBottom: 7 }}>About us</div>
            <FooterLink>Contact us</FooterLink>
            <FooterLink>Careers</FooterLink>
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <div style={{ fontWeight: 700, marginBottom: 7 }}>Legal</div>
            <FooterLink>Privacy Policy</FooterLink>
            <FooterLink>Terms of use</FooterLink>
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <div style={{ fontWeight: 700, marginBottom: 7 }}>Social</div>
            <FooterLink>Instagram</FooterLink>
            <FooterLink>TikTok</FooterLink>
            <FooterLink>Facebook</FooterLink>
            <FooterLink>LinkedIn</FooterLink>
          </div>
        </div>
        <div style={{
          textAlign: "center", color: COLORS.footerText, fontSize: 13,
          opacity: 0.28, marginTop: 28
        }}>
          © {new Date().getFullYear()} FeelFlick — Movies that match your mood.
        </div>
      </footer>
    </div>
  );
}

// --- Extra components for code clarity ---
function NavLink({ children }) {
  return (
    <a href="#" style={{
      color: "#14192b", fontWeight: 600, fontSize: 15,
      letterSpacing: "0", textDecoration: "none",
      padding: "0 8px", opacity: 0.82, transition: "opacity 0.15s",
      borderBottom: "2.5px solid transparent"
    }}>
      {children}
    </a>
  );
}

function FooterLink({ children }) {
  return (
    <a href="#" style={{
      color: "#14192b", opacity: 0.8, fontSize: 15, cursor: "pointer",
      marginBottom: 8, textDecoration: "none", display: "block"
    }}>
      {children}
    </a>
  );
}

// --- Feature grid data for the demo ---
const features = [
  { icon: "🔒", label: "Private & Secure", desc: "Your data is safe. We never sell or share." },
  { icon: "🤖", label: "Smart Recs", desc: "AI-powered picks based on your taste and mood." },
  { icon: "🧘", label: "Mood Matching", desc: "Discover films that match your current mood." },
  { icon: "🎬", label: "Personal Tracker", desc: "Log everything you watch. Forever free." },
  { icon: "🪄", label: "Clean UI", desc: "Minimal, beautiful, distraction-free design." }
];
