import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FcGoogle } from "react-icons/fc";

export default function AuthForm({ mode = "sign-in", onSwitchMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // Optional, if you want user's name
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // For "Confirm password" in Sign Up
  const [confirmPassword, setConfirmPassword] = useState("");
  const isSignUp = mode === "sign-up";
  const navigate = useNavigate();

  // Handle Sign In or Sign Up
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });
      if (error) setError(error.message);
      else {
        navigate("/app");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else {
        navigate("/app");
      }
    }
    setLoading(false);
  }

  // Google Sign-in
  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) setError(error.message);
    setLoading(false);
  };

  const COLORS = {
    accent: "#fe9245",
    accent2: "#eb423b"
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        width: 430,
        maxWidth: "98vw",
        margin: "9vh auto 0 auto",
        background: "rgba(24, 22, 32, 0.94)",
        borderRadius: 18,
        boxShadow: "0 8px 48px 0 #0008",
        padding: "33px 30px 26px 30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        minHeight: 320,
        position: "relative",
      }}
    >
      <div style={{ fontSize: 23, fontWeight: 900, color: "#fff", marginBottom: 18, textAlign: "center", letterSpacing: "-0.03em" }}>
        {isSignUp ? "Sign Up" : "Sign In"}
      </div>

      {isSignUp && (
        <input
          type="text"
          required
          placeholder="Your Name"
          autoComplete="name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={inputStyle}
        />
      )}
      <input
        type="email"
        required
        placeholder="Email address"
        autoComplete="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={inputStyle}
      />
      <input
        type="password"
        required
        placeholder="Password"
        autoComplete={isSignUp ? "new-password" : "current-password"}
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={inputStyle}
      />
      {isSignUp && (
        <input
          type="password"
          required
          placeholder="Confirm password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          style={inputStyle}
        />
      )}

      {/* Forgot password */}
      {!isSignUp && (
        <div style={{ textAlign: "right", marginBottom: 2 }}>
          <span
            onClick={e => {
              e.preventDefault();
              // TODO: You can build a real forgot password flow here
              alert("Password reset coming soon!");
            }}
            style={{
              color: "#fe9245",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Forgot your password?
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{ color: "#eb423b", margin: "7px 0 1px 0", fontSize: 14, textAlign: "center", fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: 13,
          background: `linear-gradient(90deg,${COLORS.accent} 10%,${COLORS.accent2} 90%)`,
          color: "#fff",
          border: "none",
          borderRadius: 7,
          fontWeight: 900,
          fontSize: 16.2,
          padding: "9px 0",
          boxShadow: "0 2px 11px 0 #fe924522",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          letterSpacing: "-0.03em"
        }}
      >
        {loading
          ? (isSignUp ? "Signing up..." : "Signing in...")
          : (isSignUp ? "Sign Up" : "Sign In")}
      </button>

      {/* Or divider */}
      <div style={{
        display: "flex", alignItems: "center",
        margin: "13px 0 7px 0"
      }}>
        <div style={{ flex: 1, height: 1, background: "#333" }} />
        <span style={{
          color: "#bbb", fontSize: 11.6, padding: "0 12px", fontWeight: 600, letterSpacing: "0.01em"
        }}>or</span>
        <div style={{ flex: 1, height: 1, background: "#333" }} />
      </div>

      {/* Google Sign-in */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        style={{
          background: "#fff",
          color: "#222",
          fontWeight: 700,
          fontSize: 14.6,
          padding: "8px 0",
          border: "none",
          borderRadius: 7,
          boxShadow: "0 1.5px 8px #0003",
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <FcGoogle size={20} style={{ marginRight: 3 }} />
        Continue with Google
      </button>

      

      {/* Switch link */}
      <div style={{ color: "#bbb", marginTop: 7, textAlign: "center", fontSize: 13.5 }}>
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <span
              style={{ color: "#fe9245", cursor: "pointer", fontWeight: 700 }}
              onClick={() => onSwitchMode("sign-in")}
            >
              Sign in
            </span>
          </>
        ) : (
          <>
            New to FeelFlick?{" "}
            <span
              style={{ color: "#fe9245", cursor: "pointer", fontWeight: 700 }}
              onClick={() => onSwitchMode("sign-up")}
            >
              Sign up now.
            </span>
          </>
        )}
      </div>
    </form>
  );
}

// Input styles (outside component for re-use)
const inputStyle = {
  margin: "8px 0",
  padding: "12px 11px",
  borderRadius: 8,
  border: "none",
  fontSize: 14.8,
  background: "#232330",
  color: "#fff",
  fontWeight: 500,
  letterSpacing: "-0.02em",
  outline: "none",
  boxShadow: "0 1.5px 8px 0 #0004"
};
