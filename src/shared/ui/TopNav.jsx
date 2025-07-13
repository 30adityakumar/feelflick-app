import { useNavigate } from "react-router-dom";

export default function TopNav() {
  const navigate = useNavigate();

  return (
    <>
      {/* ---- Responsive media queries ---- */}
      <style>{`
        @media (max-width: 900px) {
          .fflick-topnav-main { left: 2vw !important; right: 2vw !important; padding: 4px 10px !important; }
          .fflick-topnav-title { font-size: 21px !important; }
          .fflick-topnav-signin { font-size: 15px !important; min-width: 64px !important; padding: 6px 13px !important; }
        }
        @media (max-width: 700px) {
          .fflick-topnav-main { top: 10px !important; min-height: 34px !important; }
          .fflick-topnav-title { font-size: 16px !important; }
          .fflick-topnav-signin { font-size: 14px !important; padding: 6px 10px !important; }
        }
        @media (max-width: 420px) {
          .fflick-topnav-main { padding: 2px 2vw !important; }
          .fflick-topnav-title { font-size: 13px !important; }
          .fflick-topnav-signin { font-size: 12px !important; padding: 5px 8px !important; min-width: 52px !important;}
        }
      `}</style>

      <nav
        className="fflick-topnav-main"
        style={{
          position: "fixed",
          top: 18,
          left: 24,
          right: 24,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(18,18,22,0.87)",
          backdropFilter: "blur(6px)",
          borderRadius: 10,
          minHeight: 40,
          padding: "5px 18px",
          width: "auto",
          boxShadow: "0 4px 24px #0004",
          transition: "all 0.14s",
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
          }}
          onClick={() => navigate("/")}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") navigate("/"); }}
        >
          <span
            className="fflick-topnav-title"
            style={{
              fontSize: 23,
              fontWeight: 900,
              color: "#F6E3D7", // Soft peach, from your palette
              letterSpacing: "-1px",
              lineHeight: "1.1",
              userSelect: "none",
              fontFamily: "inherit",
              textTransform: "none",
            }}
          >
            FeelFlick
          </span>
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
            fontSize: 15,
            padding: "7px 16px",
            minWidth: 64,
            minHeight: 34,
            boxShadow: "0 2px 8px #fe92451a",
            cursor: "pointer",
            transition: "filter .15s, transform .15s",
            outline: "none",
            textTransform: "none",
            fontFamily: "inherit",
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
