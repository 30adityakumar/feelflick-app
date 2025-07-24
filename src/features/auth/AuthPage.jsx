import { useNavigate } from "react-router-dom";
import AuthForm from '@/features/auth/components/AuthForm';

export default function AuthPage({ mode }) {
  const navigate = useNavigate();

  // Only render the sign-in or sign-up form, full screen (no footer, no scroll)
  return (
    <div className="min-h-screen w-screen bg-[#101015] relative overflow-hidden">
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/background-poster.jpg"
        className="fixed top-0 left-0 w-screen h-screen object-cover z-0 brightness-[0.62] blur-[0.24px]"
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      {/* Overlay for readability */}
      <div className="fixed inset-0 bg-[rgba(18,22,30,0.32)] z-[1] pointer-events-none" />
      {/* Form */}
      <div className="relative z-[2]">
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
