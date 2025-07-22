import { useNavigate } from "react-router-dom";

export default function SignInForm({
  isSigningUp, email, setEmail, password, setPassword, name, setName,
  error, loading, handleAuth, COLORS
}) {
  const navigate = useNavigate();

  // Handlers for switching between forms (just navigates)
  const handleSwitchToSignUp = () => navigate("/auth/sign-up");
  const handleSwitchToSignIn = () => navigate("/auth/sign-in");

  return (
    <form
      onSubmit={handleAuth}
      className={`
        relative z-2 max-w-[390px] mx-auto mt-[10vh]
        bg-black/80 backdrop-blur-[9px] rounded-2xl shadow-[0_8px_48px_0_#0008]
        px-8 py-11 flex flex-col items-stretch min-h-[350px]
      `}
    >
      {/* Title */}
      <div className="text-[26px] font-black text-white mb-4 text-center">
        {isSigningUp ? "Sign Up" : "Sign In"}
      </div>
      {/* Name (sign up only) */}
      {isSigningUp && (
        <input
          type="text"
          required
          placeholder="Your Name"
          autoComplete="name"
          className={`
            my-2 px-4 py-[13px] rounded-lg border-none text-[16px]
            bg-[#232330] text-white font-medium tracking-tight outline-none
            shadow-[0_1.5px_8px_0_#0004] placeholder:text-zinc-400
            transition
          `}
          value={name}
          onChange={e => setName(e.target.value)}
        />
      )}
      {/* Email */}
      <input
        type="email"
        required
        placeholder="Email address"
        autoComplete="email"
        className={`
          my-2 px-4 py-[13px] rounded-lg border-none text-[16px]
          bg-[#232330] text-white font-medium tracking-tight outline-none
          shadow-[0_1.5px_8px_0_#0004] placeholder:text-zinc-400
          transition
        `}
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      {/* Password */}
      <input
        type="password"
        required
        placeholder="Password"
        autoComplete="current-password"
        className={`
          my-2 px-4 py-[13px] rounded-lg border-none text-[16px]
          bg-[#232330] text-white font-medium tracking-tight outline-none
          shadow-[0_1.5px_8px_0_#0004] placeholder:text-zinc-400
          transition
        `}
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      {/* Error */}
      {error && (
        <div
          className="my-2 text-center text-[15px]"
          style={{ color: COLORS.accent2 }}
        >
          {error}
        </div>
      )}
      {/* Submit */}
      <button
        type="submit"
        className={`
          mt-4 rounded-lg font-extrabold text-[18px] py-[11px] shadow-[0_2px_11px_0_#fe924522]
          transition duration-100
        `}
        style={{
          background: `linear-gradient(90deg,${COLORS.accent} 10%,${COLORS.accent2} 90%)`,
          color: "#fff",
          border: 'none',
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "not-allowed" : "pointer"
        }}
        disabled={loading}
      >
        {loading ? (isSigningUp ? "Signing up..." : "Signing in...") : (isSigningUp ? "Sign Up" : "Sign In")}
      </button>
      {/* Switch Link */}
      <div className="text-zinc-400 mt-4 mb-1 text-center text-[15px]">
        {isSigningUp ? (
          <>
            Already have an account?{" "}
            <span
              className="font-bold cursor-pointer"
              style={{ color: COLORS.accent }}
              onClick={handleSwitchToSignIn}
            >
              Sign In
            </span>
          </>
        ) : (
          <>
            New to FeelFlick?{" "}
            <span
              className="font-bold cursor-pointer"
              style={{ color: COLORS.accent }}
              onClick={handleSwitchToSignUp}
            >
              Sign up now.
            </span>
          </>
        )}
      </div>
    </form>
  );
}
