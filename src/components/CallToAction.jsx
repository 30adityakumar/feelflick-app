import { useNavigate } from "react-router-dom";

export default function CallToAction() {
  const navigate = useNavigate();

  return (
    <section style={{
      width: "100vw",
      minHeight: 54,
      margin: "0",
      padding: "0",
      background: "rgba(10,10,10,0.73)",
      borderRadius: 0,
      boxShadow: "0 -1.5px 24px 0 #000a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      position: "relative",
      zIndex: 12,
      borderTop: "1px solid rgba(255,91,46,0.09)",
    }}>
      <style>{`
        @media (max-width: 600px) {
          .fflick-cta-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
            padding: 9px 3vw 7px 3vw !important;
          }
          .fflick-cta-btn {
            width: 100% !important;
            font-size: 0.95rem !important;
            padding: 8px 0 !important;
          }
        }
      `}</style>
      <div className="fflick-cta-row" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: "9px 0 7px 0",
        width: "100%",
        maxWidth: 820,
      }}>
        <div style={{
          fontWeight: 400,
          color: "#e7e9ef",
          fontSize: "1rem",
          letterSpacing: "-0.2px",
          textAlign: "center",
          textShadow: "0 2.5px 10px #191a2040",
          whiteSpace: "nowrap",
          margin: 0,
          padding: 0,
        }}>
          Ready to get started?
        </div>
        <button
          className="fflick-cta-btn"
          onClick={() => navigate("/auth/sign-up")}
          style={{
            background: "linear-gradient(91deg, #FF5B2E 54%, #FF7B48 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: "0.98rem",
            padding: "7px 16px",
            boxShadow: "0 1.5px 7px #0a0a0a19",
            cursor: "pointer",
            transition: "background 0.15s, box-shadow 0.13s, transform 0.11s",
            margin: 0,
            minWidth: 140
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "linear-gradient(91deg, #FF7B48 64%, #FF5B2E 100%)";
            e.currentTarget.style.transform = "translateY(-1px) scale(1.03)";
            e.currentTarget.style.boxShadow = "0 7px 22px #FF5B2E2e";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "linear-gradient(91deg, #FF5B2E 54%, #FF7B48 100%)";
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 1.5px 7px #0a0a0a19";
          }}
        >
          Create your free account
        </button>
      </div>
    </section>
  );
}
