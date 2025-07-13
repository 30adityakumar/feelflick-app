import { useNavigate } from "react-router-dom";

export default function TopNav() {
  const navigate = useNavigate();

  return (
    <>
      {/* ---------- Responsive overrides ---------- */}
      <style>{`
        @media (max-width: 700px) {
          .fflick-topnav-main {
            top: 14px !important;
            left: 4vw !important;
            right: 4vw !important;
            min-height: 40px !important;
            padding: 4px 16px !important;
            border-radius: 10px !important;
          }
          .fflick-topnav-title { font-size: 22px !important; }
          .fflick-topnav-signin {
            font-size: 14px !important;
            padding: 6px 18px !important;
            min-width: 90px !important;
          }
        }
        @media (max-width: 420px) {
          .fflick-topnav-main {
            top: 8px !important;
            left: 2vw !important;
            right: 2vw !important;
            min-height: 34px !important;
            padding: 4px 10px !important;
            border-radius: 8px !important;
          }
          .fflick-topnav-title  { font-size: 18px !important; }
          .fflick-topnav-signin {
            font-size: 12px !important;
            padding: 5px 14px !important;
            min-width: 75px !important;
          }
        }
      `}</style>

      {/* ---------- Nav bar ---------- */}
      <div
        className="fflick-topnav-main"
        style={{
          position: "fixed",
          top: 20,
          left: 28,
          right: 28,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 24px",
          minHeight: 48,
          backdropFilter: "blur(6px)",
          background: "rgba(0,0,0,0.72)",
          borderRadius: 12,
        }}
      >
        {/* Brand title */}
        <span
          className="fflick-topnav-title"
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-1px",
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={() => navigate('/')}
        >
          FeelFlick
        </span>

        {/* Sign-in button */}
        <button
          className="fflick-topnav-signin"
          onClick={() => navigate("/auth/sign-in")}
          style={{
            background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 16,
            padding: "8px 22px",
            minWidth: 100,
            minHeight: 40,
            boxShadow: "0 2px 6px #fe924533",
            cursor: "pointer",
            transition: "filter .15s, transform .15s",
          }}
          onMouseDown={e => (e.currentTarget.style.transform = "scale(.97)")}
          onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          SIGN IN
        </button>
      </div>
    </>
  );
}
