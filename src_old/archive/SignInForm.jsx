import { useNavigate } from "react-router-dom";

export default function SignInForm({
  isSigningUp, email, setEmail, password, setPassword, name, setName,
  error, loading, handleAuth, COLORS
}) {
  const navigate = useNavigate();

  const inputStyle = {
    margin: "10px 0",
    padding: "14px 12px",
    borderRadius: 8,
    border: "none",
    fontSize: 16,
    background: "#232330",
    color: "#fff",
    fontWeight: 500,
    letterSpacing: "-0.02em",
    outline: "none",
    boxShadow: "0 1.5px 8px 0 #0004"
  };

  // Handlers for switching between forms (ONLY navigates)
  const handleSwitchToSignUp = () => navigate("/auth/sign-up");
  const handleSwitchToSignIn = () => navigate("/auth/sign-in");

  return (
    <form
      onSubmit={handleAuth}
      style={{
        position: "relative",
        zIndex: 2,
        maxWidth: 390,
        margin: "0 auto",
        marginTop: "10vh",
        background: "rgba(24, 26, 32, 0.78)",
        backdropFilter: "blur(9px)",
        borderRadius: 20,
        boxShadow: "0 8px 48px 0 #0008",
        padding: '42px 30px 27px 30px',
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        minHeight: 350
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 15, textAlign: 'center' }}>
        {isSigningUp ? "Sign Up" : "Sign In"}
      </div>
      {isSigningUp && (
        <input
          type="text"
          required
          placeholder="Your Name"
          autoComplete="name"
          style={inputStyle}
          value={name}
          onChange={e => setName(e.target.value)}
        />
      )}
      <input
        type="email"
        required
        placeholder="Email address"
        autoComplete="email"
        style={inputStyle}
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        required
        placeholder="Password"
        autoComplete="current-password"
        style={inputStyle}
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      {error && <div style={{ color: COLORS.accent2, margin: '7px 0 1px 0', fontSize: 15, textAlign: 'center' }}>{error}</div>}
      <button
        type="submit"
        style={{
          marginTop: 18,
          background: `linear-gradient(90deg,${COLORS.accent} 10%,${COLORS.accent2} 90%)`,
          color: "#fff",
          border: 'none',
          borderRadius: 8,
          fontWeight: 800,
          fontSize: 18,
          padding: '11px 0',
          boxShadow: '0 2px 11px 0 #fe924522',
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1
        }}
        disabled={loading}
      >
        {loading ? (isSigningUp ? "Signing up..." : "Signing in...") : (isSigningUp ? "Sign Up" : "Sign In")}
      </button>
      <div style={{ color: "#aaa", margin: '15px 0 4px 0', textAlign: 'center', fontSize: 15 }}>
        {isSigningUp
          ? <>Already have an account?{" "}
            <span
              style={{ color: COLORS.accent, cursor: "pointer", fontWeight: 700 }}
              onClick={handleSwitchToSignIn}
            >Sign In</span></>
          : <>New to FeelFlick?{" "}
            <span
              style={{ color: COLORS.accent, cursor: "pointer", fontWeight: 700 }}
              onClick={handleSwitchToSignUp}
            >Sign up now.</span></>}
      </div>
    </form>
  );
}
