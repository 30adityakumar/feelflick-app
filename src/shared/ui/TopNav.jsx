import { useNavigate } from "react-router-dom";
import logo from '@assets/images/logo.png';

export default function TopNav() {
  const navigate = useNavigate();

  return (
    <>
      <style>{
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
      }</style>
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
          <img src={logo} alt="FeelFlick" className="fflick-topnav-logo" style={{
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
              background: linear-gradient(90deg,#fe9245 10%,#eb423b 90%),
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