import { useNavigate } from "react-router-dom";
import AuthForm from './components/AuthForm';

export default function AuthPage({ mode }) {
  const navigate = useNavigate();

  // Only render the sign-in or sign-up form, full screen (no footer, no scroll)
  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: "#101015", position: 'relative' }}>
      <video
        autoPlay loop muted playsInline poster="/background-poster.jpg"
        style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          objectFit: "cover", zIndex: 0, filter: "brightness(0.62) blur(0.24px)"
        }}
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(18,22,30,0.32)', zIndex: 1, pointerEvents: "none"
      }} />
      <div style={{ position: "relative", zIndex: 2 }}>
        <AuthForm
          mode={mode} // "sign-in" or "sign-up"
          onSwitchMode={newMode => {
            if (newMode === "sign-in") navigate('/auth/sign-in');
            else navigate('/auth/sign-up');
          }}
        />
      </div>
    </div>
  );
}
