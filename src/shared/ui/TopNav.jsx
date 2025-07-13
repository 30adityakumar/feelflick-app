import { useNavigate } from "react-router-dom";
import logo from "@assets/images/logo.png"; // Your logo image (via Vite alias)

<<<<<<< HEAD
export default function TopNav() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @media (max-width: 700px) {
          .fflick-topnav-main {
            left: 6vw !important;
            right: 6vw !important;
            top: 16px !important;
            width: unset !important;
            padding: 0 !important;
            border-radius: 10px !important;
            min-height: 44px !important;
          }
          .fflick-topnav-row {
            gap: 8px !important;
          }
          .fflick-topnav-title {
            font-size: 20px !important;
          }
          .fflick-topnav-logo {
            width: 32px !important;
            height: 32px !important;
            border-radius: 8px !important;
          }
          .fflick-topnav-signin {
            font-size: 15px !important;
            padding: 8px 13px !important;
            min-width: 100px !important;
          }
        }
        @media (max-width: 420px) {
          .fflick-topnav-main {
            left: 1vw !important;
            right: 1vw !important;
            top: 7px !important;
            min-height: 36px !important;
            border-radius: 7px !important;
          }
          .fflick-topnav-title {
            font-size: 16px !important;
          }
          .fflick-topnav-signin {
            font-size: 13px !important;
            padding: 7px 8px !important;
            min-width: 80px !important;
          }
        }
      `}</style>
      <div className="fflick-topnav-main" style={{
        position: 'fixed',
        top: 36, left: 38, right: 38, zIndex: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "calc(100vw - 76px)",
        padding: "0",
        minHeight: 58,
        boxShadow: "none"
      }}>
        <div className="fflick-topnav-row" style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <img src="/logo.png" alt="FeelFlick" className="fflick-topnav-logo" style={{
            height: 44, width: 44, borderRadius: 12, boxShadow: "0 2px 8px #0003", transition: "all 0.18s"
          }} />
          <span className="fflick-topnav-title" style={{
            fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-1.2px", textShadow: "0 1px 7px #19194044", transition: "all 0.17s"
          }}>FeelFlick</span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            className="fflick-topnav-signin"
            onClick={() => navigate("/auth/sign-in")}
            style={{
              background: `linear-gradient(90deg,#fe9245 10%,#eb423b 90%)`,
              color: "#fff", border: "none", borderRadius: 8,
              fontWeight: 700, fontSize: 18, padding: "9px 30px", minWidth: 120,
              boxShadow: "0 2px 8px #fe92451a", cursor: "pointer", transition: "all 0.15s"
            }}
          >SIGN IN</button>
        </div>
      </div>
    </>
  )
}

=======
/**
 * TopNav component for FeelFlick
 * Responsive, accessible, and future-proof with Tailwind CSS
 * To tweak: just change color class names, gap, size, etc. in JSX below
 */
export default function TopNav() {
  const navigate = useNavigate();

  return (
    // HEADER: Semantic tag, sticky at top
    <header
      role="banner"
      className="
        fixed top-3 left-3 right-3 z-50
        flex items-center justify-between
        rounded-xl bg-peach-100/90 shadow-lg backdrop-blur-md
        px-3 py-2
        sm:top-5 sm:left-5 sm:right-5 sm:px-6
        md:top-8 md:left-8 md:right-8
        transition-all
      "
    >
      {/* LOGO + BRAND */}
      <button
        onClick={() => navigate("/")}
        className="
          flex items-center gap-3 group
          focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
        "
        aria-label="Go to FeelFlick home page"
      >
        {/* LOGO: Tweak sizes for tap target */}
        <img
          src={logo}
          alt="FeelFlick"
          className="
            h-8 w-8 rounded-lg shadow-sm
            sm:h-10 sm:w-10
            lg:h-12 lg:w-12
            group-hover:scale-105 transition-transform
          "
        />
        {/* TEXT: Brand wordmark, color and size from config */}
        <span
          className="
            font-extrabold tracking-tight text-brand-500
            text-[clamp(1rem,4vw,2rem)] leading-none select-none
            group-hover:brightness-110 transition
          "
        >
          FeelFlick
        </span>
      </button>

      {/* SIGN IN BUTTON: Large tap target, accessible */}
      <button
        onClick={() => navigate("/auth/sign-in")}
        className="
          rounded-lg font-bold text-white shadow
          bg-gradient-to-r from-accent-from to-accent-to
          px-4 py-2 text-sm sm:px-6 sm:py-2.5 sm:text-base
          hover:brightness-110 active:scale-95 transition
          focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-from
        "
        aria-label="Sign in"
      >
        SIGN IN
      </button>
    </header>
  );
}

>>>>>>> bf549458ffcb039177041483b74f2cea850625cf