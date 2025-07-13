import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* --- CSS-in-JS for hide-on-scroll --- */
const navTransition = "top 0.4s cubic-bezier(.4,.4,0,1), background 0.18s";
const navBoxShadow = "0 4px 24px #0004";
const navBg = "rgba(18,18,22,0.88)";
const navPeach = "#F6E3D7";

export default function TopNav() {
  const navigate = useNavigate();
  const navRef = useRef(null);
  const [hidden, setHidden] = useState(false);

  // Hide nav on scroll down, show on scroll up
  useEffect(() => {
    let lastScroll = window.scrollY;
    function onScroll() {
      const curr = window.scrollY;
      if (curr > 64 && curr > lastScroll) setHidden(true); // scroll down, hide
      else setHidden(false); // scroll up or near top, show
      lastScroll = curr;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* --- Responsive styles --- */}
      <style>{`
        @media (max-width: 1200px) {
          .fflick-topnav-title { font-size: 2.1rem !important; }
          .fflick-topnav-signin { font-size: 1.07rem !important; min-width: 78px !important; padding: 8px 22px !important;}
        }
        @media (max-width: 900px) {
          .fflick-topnav-main { left: 2vw !important; right: 2vw !important; padding: 5px 10px !important;}
          .fflick-topnav-title { font-size: 1.48rem !important; }
          .fflick-topnav-signin { font-size: 1rem !important; min-width: 66px !important; padding: 7px 14px !important;}
        }
        @media (max-width: 700px) {
          .fflick-topnav-main { top: 10px !important; min-height: 34px !important;}
          .fflick-topnav-title { font-size: 1.06rem !important;}
          .fflick-topnav-signin { font-size: .93rem !important; padding: 6px 9px !important;}
        }
        @media (max-width: 500px) {
          .fflick-topnav-main { padding: 2px 2vw !important; }
          .fflick-topnav-title { font-size: .98rem !important;}
          .fflick-topnav-signin { font-size: .81rem !important; min-width: 50px !important; padding: 6px 6px !important;}
        }
      `}</style>

      <nav
        ref={navRef}
        className="fflick-topnav-main"
        style={{
          position: "fixed",
          top: hidden ? -100 : 18,
          left: 24,
          right: 24,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: navBg,
          backdropFilter: "blur(6px)",
          borderRadius: 12,
          minHeight: 44,
          padding: "7px 32px",
          width: "auto",
          boxShadow: navBoxShadow,
          transition: navTransition,
        }}
        aria-label="Main navigation"
        role="navigation"
      >
        {/* ---- Brand Title ---- */}
        <button
          tabIndex={0}
          aria-label="Go to FeelFlick home page"
          style={{
            background: "none",
            border: "none",
            font: "inherit",
            padding: 0,
            margin: 0,
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            outline: "none",
            borderRadius: 6,
            color: navPeach,
            fontWeight: 900,
            fontSize: 32,
            letterSpacing: "0.4px",
            userSelect: "none",
            fontFamily: "inherit",
            lineHeight: 1.1,
          }}
          className="fflick-topnav-title"
          onClick={() => navigate("/")}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") navigate("/"); }}
        >
          FeelFlick
        </button>

        {/* ---- Sign In Button ---- */}
        <button
          className="fflick-topnav-signin"
          aria-label="Sign in"
          onClick={() => navigate("/auth/sign-in")}
          style={{
            background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 16,
            padding: "9px 26px",
            minWidth: 88,
            minHeight: 36,
            boxShadow: "0 2px 8px #fe92451a",
            cursor: "pointer",
            transition: "filter .15s, transform .15s",
            outline: "none",
            textTransform: "none",
            fontFamily: "inherit",
            letterSpacing: "0.01em",
          }}
          onMouseDown={e => (e.currentTarget.style.transform = "scale(.97)")}
          onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
          tabIndex={0}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") navigate("/auth/sign-in"); }}
        >
          Sign in
        </button>
      </nav>
    </>
  );
}
