import { useNavigate } from "react-router-dom";
import heroVideo from "@/assets/videos/hero-bg.mp4";
import heroVideo from "@/assets/videos/hero-bg.mp4";
import backgroundposter from "@/assets/images/background-poster.jpg";

export default function LandingHero() {
  const navigate = useNavigate();

  return (
    <section
      style={{
        width: "100vw",
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        position: "relative",
        overflow: "hidden",
        background: "#101015",
        paddingTop: 92, // adjust if your TopNav is taller/shorter!
      }}
    >
      {/* ---- Background video ---- */}
      <video
        src={HERO_VIDEO}
        autoPlay
        loop
        muted
        playsInline
        poster={backgroundposter}
        style={{
          position: "absolute",
          inset: 0,
          width: "100vw",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
          filter: "brightness(0.65) blur(0.2px)",
        }}
      />
      {/* ---- Overlay gradient left-to-right ---- */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg,rgba(14,14,17,0.97) 0%,rgba(14,14,17,0.81) 48%,rgba(14,14,17,0.19) 80%,rgba(14,14,17,0.01) 100%)",
          zIndex: 1,
        }}
      />

      {/* ---- Hero content ---- */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 640,
          marginLeft: "clamp(8vw, 7%, 120px)",
          marginRight: "clamp(3vw, 5%, 90px)",
          padding: "0 10px",
          color: "#fff"
        }}
      >
        <h1
          style={{
            fontWeight: 900,
            fontSize: "clamp(1.5rem,4vw,2.5rem)", // smaller!
            color: "#fff",
            letterSpacing: "-0.7px",
            marginBottom: 18,
            textShadow: "0 4px 24px #000c, 0 2px 8px #18406d77",
            lineHeight: 1.08,
          }}
        >
          Movies that match your mood.
        </h1>
        <div
          style={{
            fontWeight: 400,
            fontSize: "clamp(1rem,1.1vw,1.25rem)",
            color: "#F6E3D7",
            opacity: 0.96,
            marginBottom: 30,
            lineHeight: 1.6,
            textShadow: "0 2px 8px #0002",
          }}
        >
          Get the perfect recommendation based on your taste and how you feel.<br />
          Fast, private, and always free.
        </div>
        <button
          onClick={() => navigate("/auth/sign-up")}
          style={{
            background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
            color: "#fff",
            border: "none",
            borderRadius: 13,
            fontWeight: 800,
            fontSize: "1rem",        // a little smaller
            padding: "10px 30px",    // smaller, tighter
            minWidth: 108,
            minHeight: 38,
            boxShadow: "0 2px 8px #eb423b1a",
            cursor: "pointer",
            letterSpacing: "0.01em",
            outline: "none",
            transition: "filter .14s, background .13s",
          }}
          onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.08)")}
          onMouseLeave={e => (e.currentTarget.style.filter = "none")}
          tabIndex={0}
        >
          Get Started
        </button>
      </div>
    </section>
  );
}
