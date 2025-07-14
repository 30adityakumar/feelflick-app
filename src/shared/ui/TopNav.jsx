import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@assets/images/logo.png"; // <-- Transparent PNG recommended!

export default function TopNav() {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);

  // Hide nav on scroll down, show on scroll up
  useEffect(() => {
    let lastScroll = window.scrollY;
    function onScroll() {
      const curr = window.scrollY;
      if (curr > 64 && curr > lastScroll) setHidden(true);
      else setHidden(false);
      lastScroll = curr;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`
        @media (max-width: 700px) {
          .fflick-topnav-main {
            left: 2vw !important;
            right: 2vw !important;
            top: 10px !important;
            min-height: 38px !important;
            padding: 5px 8px !important;
            border-radius: 12px !important;
          }
          .fflick-topnav-title {
            font-size: 1.65rem !important;   /* larger on mobile! */
            font-weight: 900 !important;
            letter-spacing: 0.4px !important;
          }
          .fflick-topnav-logo {
            height: 34px !important;
            width: 34px !important;
            border-radius: 8px !important;
          }
          .fflick-topnav-signin {
            font-size: 1.02rem !important;
            padding: 8px 28px !important;
            min-width: 110px !important;
            min-height: 36px !important;
            border-radius: 9px !important;
            box-shadow: 0 2px 12px #eb423b1a !important;
          }
        }
        @media (max-width: 420px) {
          .fflick-topnav-main {
            padding: 4px 2vw !important;
            min-height: 32px !important;
            border-radius: 10px !important;
          }
          .fflick-topnav-title {
            font-size: 1.24rem !important;   /* bigger! */
            letter-spacing: 0.3px !important;
          }
          .fflick-topnav-logo {
            height: 28px !important;
            width: 28px !important;
            border-radius: 6px !important;
          }
          .fflick-topnav-signin {
            font-size: 0.97rem !important;
            padding: 8px 20px !important;
            min-width: 90px !important;
            min-height: 34px !important;
            border-radius: 8px !important;
          }
        }
      `}</style>

      <nav
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
          background: "rgba(18,18,22,0.4)",
          backdropFilter: "blur(6px)",
          borderRadius: 14,
          minHeight: 44,
          padding: "8px 36px",
          width: "auto",
          boxShadow: "0 4px 32px #0006",
          transition: "top 0.4s cubic-bezier(.4,.4,0,1), background 0.18s",
        }}
        aria-label="Main navigation"
        role="navigation"
      >
        {/* ---- Logo (left) ---- */}
        <button
          tabIndex={0}
          aria-label="Go to FeelFlick home page"
          style={{
            background: "none",
            border: "none",
            marginRight: 10,
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            padding: 0,
            outline: "none",
          }}
          onClick={() => navigate("/")}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") navigate("/"); }}
        >
          <img
            src={logo}
            alt="FeelFlick logo"
            className="fflick-topnav-logo"
            style={{
              height: 38,
              width: 38,
              borderRadius: 9,
              boxShadow: "0 1px 8px #0002",
              // background: "#fff", // <-- REMOVE THIS LINE!
              transition: "box-shadow 0.12s, transform 0.12s",
            }}
            draggable="false"
          />
        </button>

        {/* ---- Brand Title (center/left) ---- */}
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
            color: "#F6E3D7",
            fontWeight: 900,
            fontSize: 29,         // <-- Increase desktop size
            letterSpacing: "0.4px",
            userSelect: "none",
            fontFamily: "inherit",
            lineHeight: 1.1,
            transition: "color 0.12s",
          }}
          className="fflick-topnav-title"
          onClick={() => navigate("/")}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") navigate("/"); }}
        >
          FeelFlick
        </button>

        <div style={{ flex: 1 }} />

        {/* ---- Sign In Button (right) ---- */}
        <button
          className="fflick-topnav-signin"
          aria-label="Sign in"
          onClick={() => navigate("/auth/sign-in")}
          style={{
            background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 16,
            padding: "8px 24px",
            minWidth: 95,
            minHeight: 36,
            boxShadow: "0 2px 10px #fe92451a",
            cursor: "pointer",
            transition: "filter .16s, transform .16s, background .18s",
            outline: "none",
            textTransform: "none",
            fontFamily: "inherit",
            letterSpacing: "0.3px",
          }}
          onMouseDown={e => (e.currentTarget.style.transform = "scale(.97)")}
          onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
          onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.13)")}
          onMouseLeave={e => (e.currentTarget.style.filter = "none")}
          onFocus={e => (e.currentTarget.style.filter = "brightness(1.11)")}
          onBlur={e => (e.currentTarget.style.filter = "none")}
          tabIndex={0}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") navigate("/auth/sign-in"); }}
        >
          Sign in
        </button>
      </nav>
    </>
  );
}
