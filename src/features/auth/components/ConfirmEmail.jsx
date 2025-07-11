import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";

export default function ConfirmEmail() {
  const { hash } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Parse tokens in the URL fragment: #access_token=...&refresh_token=...
    const params = Object.fromEntries(new URLSearchParams(hash.slice(1)));
    const { access_token, refresh_token } = params;
    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token })
        .then(() => navigate("/app", { replace: true }));
    } else {
      // If no tokens, show fallback (optional)
      navigate("/auth/sign-in", { replace: true });
    }
  }, [hash, navigate]);

  // Show nothing (or a spinner/message) since it's instant
  return (
    <div style={{ minHeight:"60vh", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>
      Setting up your account…
    </div>
  );
}
