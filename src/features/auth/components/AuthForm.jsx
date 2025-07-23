import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";
import { FcGoogle } from "react-icons/fc";

export default function AuthForm({ mode = "sign-in", onSwitchMode }) {
  const isSignUp = mode === "sign-up";
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [checkInbox, setCheckInbox] = useState(false);

  const C = { accent: "#fe9245", accent2: "#eb423b" };

  // --- Auth Handlers ---
  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError("Passwords do not match."); setLoading(false); return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });
      setLoading(false);
      if (error) return setError(error.message);
      setCheckInbox(true);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else navigate("/onboarding");
  }

  async function handleGoogle() {
    setError(""); setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/onboarding` }
    });
    setLoading(false);
  }

  async function handleResetSubmit(e) {
    e.preventDefault(); setResetError(""); setResetSent(false);
    if (!resetEmail) return setResetError("Please enter your email.");
    const { error } = await supabase.auth.resetPasswordForEmail(
      resetEmail,
      { redirectTo: `${window.location.origin}/auth/reset-password` }
    );
    if (error) setResetError(error.message); else setResetSent(true);
  }

  // --- Check Inbox Splash ---
  if (checkInbox) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#101015] text-white px-4">
        <div className="max-w-[480px] w-full bg-[#18141c] px-7 py-10 rounded-2xl shadow-[0_8px_38px_#000c] text-center">
          <div className="text-[1.7rem] font-black mb-4 tracking-tight">Confirm your e-mail 📧</div>
          <p className="leading-[1.6] text-base opacity-90 mb-3">
            We just sent a verification link to <b>{email}</b>.<br />
            Click the button in that e-mail to activate your account.
          </p>
          <button
            onClick={() => setCheckInbox(false)}
            className="mt-6 bg-[#232330] text-white text-base font-bold px-6 py-2 rounded-lg transition hover:bg-[#232330]/80"
          >
            ‹ Back
          </button>
        </div>
      </div>
    );
  }

  // --- Main Auth Form ---
  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={`
          w-full max-w-[430px] mx-auto mt-[9vh]
          bg-[rgba(24,22,32,0.94)] rounded-2xl shadow-[0_8px_48px_#0008]
          px-7 py-8 flex flex-col
        `}
      >
        <div className="text-[1.4rem] font-black text-white mb-4 text-center tracking-tight">
          {isSignUp ? "Sign Up" : "Sign In"}
        </div>

        {isSignUp && (
          <input
            type="text"
            placeholder="Your name"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className={`
              my-2 px-4 py-[13px] rounded-lg border-none text-base
              bg-[#232330] text-white font-medium tracking-tight outline-none
              shadow-[0_1.5px_8px_#0004] placeholder:text-zinc-400
            `}
          />
        )}

        <input
          type="email"
          placeholder="Email address"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={`
            my-2 px-4 py-[13px] rounded-lg border-none text-base
            bg-[#232330] text-white font-medium tracking-tight outline-none
            shadow-[0_1.5px_8px_#0004] placeholder:text-zinc-400
          `}
        />

        <input
          type="password"
          placeholder="Password"
          required
          autoComplete={isSignUp ? "new-password" : "current-password"}
          value={password}
          onChange={e => setPassword(e.target.value)}
          className={`
            my-2 px-4 py-[13px] rounded-lg border-none text-base
            bg-[#232330] text-white font-medium tracking-tight outline-none
            shadow-[0_1.5px_8px_#0004] placeholder:text-zinc-400
          `}
        />

        {isSignUp && (
          <input
            type="password"
            placeholder="Confirm password"
            required
            value={confirmPassword}
            onChange={e => setConfirm(e.target.value)}
            className={`
              my-2 px-4 py-[13px] rounded-lg border-none text-base
              bg-[#232330] text-white font-medium tracking-tight outline-none
              shadow-[0_1.5px_8px_#0004] placeholder:text-zinc-400
            `}
          />
        )}

        {!isSignUp && (
          <div className="text-right my-0 mb-1">
            <span
              onClick={() => setShowReset(true)}
              className="text-[13.5px] font-semibold cursor-pointer"
              style={{ color: C.accent }}
            >
              Forgot your password?
            </span>
          </div>
        )}

        {error && (
          <div className="text-center text-[15px] font-semibold my-1" style={{ color: C.accent2 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`
            mt-3 rounded-lg font-extrabold text-[16.2px] py-[11px] shadow-[0_2px_11px_#fe924522]
            transition duration-100
          `}
          style={{
            background: `linear-gradient(90deg,${C.accent} 10%,${C.accent2} 90%)`,
            color: "#fff",
            border: "none",
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading
            ? isSignUp
              ? "Signing up…"
              : "Signing in…"
            : isSignUp
              ? "Sign Up"
              : "Sign In"}
        </button>

        {/* OR Divider */}
        <div className="flex items-center my-3">
          <div className="flex-1 h-[1px] bg-zinc-700" />
          <span className="text-zinc-400 text-[11.6px] font-semibold px-3">or</span>
          <div className="flex-1 h-[1px] bg-zinc-700" />
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleGoogle}
          className={`
            bg-white text-zinc-900 font-bold text-[15px] py-2 rounded-lg
            shadow-[0_1.5px_8px_#0003]
            flex items-center justify-center gap-2 mb-1 transition
            active:scale-[0.97] hover:bg-zinc-100
          `}
          style={{
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          <FcGoogle size={20} /> Continue with Google
        </button>

        {/* Switch link */}
        <div className="text-zinc-400 mt-3 text-center text-[13.5px]">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <span
                className="font-bold cursor-pointer"
                style={{ color: C.accent }}
                onClick={() => onSwitchMode("sign-in")}
              >
                Sign in
              </span>
            </>
          ) : (
            <>
              New to FeelFlick?{" "}
              <span
                className="font-bold cursor-pointer"
                style={{ color: C.accent }}
                onClick={() => onSwitchMode("sign-up")}
              >
                Sign up now.
              </span>
            </>
          )}
        </div>
      </form>

      {/* Forgot password modal */}
      {showReset && (
        <div className="fixed inset-0 bg-black/80 z-[4000] flex items-center justify-center">
          <form
            onSubmit={handleResetSubmit}
            className="bg-[#191924] rounded-xl p-7 pt-6 pb-6 shadow-[0_8px_38px_#0007] max-w-[340px] w-[93vw] flex flex-col"
          >
            <div className="font-extrabold text-lg mb-3 text-white text-center">
              Reset your password
            </div>
            <input
              type="email"
              placeholder="Your e-mail"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              required
              className={`
                my-2 px-4 py-[13px] rounded-lg border-none text-base
                bg-[#232330] text-white font-medium tracking-tight outline-none
                shadow-[0_1.5px_8px_#0004] placeholder:text-zinc-400
              `}
            />
            {resetError && (
              <div className="text-center text-[15px] my-1 font-semibold" style={{ color: C.accent2 }}>
                {resetError}
              </div>
            )}
            {resetSent && (
              <div className="text-center mt-2 font-semibold" style={{ color: C.accent }}>
                Reset link sent! Check your inbox.
              </div>
            )}
            <button
              type="submit"
              className="bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold rounded-lg py-2 mt-4"
            >
              Send reset link
            </button>
            <button
              type="button"
              onClick={() => setShowReset(false)}
              className="bg-none border-none text-zinc-400 font-semibold text-sm mt-3 hover:text-zinc-200 transition"
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </>
  );
}
