import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";

export default function ResetPassword() {
  const { hash } = useLocation();
  const navigate = useNavigate();

  // Parse tokens from the URL hash
  const [tokens] = useState(() =>
    Object.fromEntries(new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash))
  );
  const { access_token: accessToken, refresh_token: refreshToken } = tokens;

  useEffect(() => {
    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .catch(err => console.error("setSession failed:", err));
    }
  }, [accessToken, refreshToken]);

  // Local state
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else {
      setSuccess(true);
      setTimeout(() => navigate("/auth/sign-in"), 2000);
    }
  }

  // If the link is invalid or expired
  if (!accessToken || !refreshToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#101015] font-sans">
        <div className="text-white text-lg text-center">
          Invalid or expired reset link.
        </div>
      </div>
    );
  }

  // Main form UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#101015] font-sans">
      <form
        onSubmit={handleSubmit}
        className={`
          bg-[#18141c] px-8 py-10 rounded-2xl min-w-[320px] w-full max-w-[370px]
          shadow-[0_8px_38px_#000c] text-white flex flex-col
        `}
      >
        <div className="text-2xl font-black mb-6 text-center">Set a new password</div>
        <input
          type="password"
          placeholder="New password"
          className="my-2 px-4 py-3 rounded-lg bg-[#232330] border-none text-base text-white placeholder:text-zinc-400 outline-none"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm password"
          className="my-2 px-4 py-3 rounded-lg bg-[#232330] border-none text-base text-white placeholder:text-zinc-400 outline-none"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
        />
        {error && (
          <div className="text-center text-[#eb423b] mt-2 text-[15px]">{error}</div>
        )}
        {success && (
          <div className="text-center text-[#fe9245] mt-2 text-[15px]">
            Password updated! Redirecting…
          </div>
        )}
        {!success && (
          <button
            type="submit"
            className={`
              mt-5 bg-gradient-to-r from-[#fe9245] to-[#eb423b]
              border-none rounded-lg text-white font-bold text-[17px]
              py-3 transition hover:opacity-95 active:scale-98
              shadow-[0_2px_12px_#fe924522]
            `}
          >
            Reset password
          </button>
        )}
      </form>
    </div>
  );
}
