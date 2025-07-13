import { useNavigate } from "react-router-dom";

export default function TopNav() {
  const navigate = useNavigate();

  return (
    <>
      {/* --- Mobile-specific improvements --- */}
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
            font-size: 1.36rem !important; /* bigger! */
            font-weight: 900 !important;
            letter-spacing: 0.4px !important;
          }
          .fflick-topnav-signin {
            font-size: 1.02rem !important;
            padding: 8px 28px !important;   /* wider! */
            min-width: 110px !important;
            min-height: 36px !important;    /* slightly shorter */
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
            font-size: 1.12rem !important;
            letter-spacing: 0.3px !important;
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
          top: 18,
          left: 24,
          right: 24,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(18,18,22,0.87)",
          backdropFilter: "blur(6px)",
          borderRadius: 14,
          minHeight: 44,
          padding: "8px 36px",
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
            borderRadius: 6,
            color: "#F6E3D7",
            fontWeight: 900,
            fontSize: 25,
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

        {/* ---- Sign In Button ---- */}
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
            transition: "filter .15s, transform .15s",
            outline: "none",
            textTransform: "none",
            fontFamily: "inherit",
            letterSpacing: "0.3px",
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
