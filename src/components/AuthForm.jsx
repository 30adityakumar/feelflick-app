// src/components/AuthForm.jsx
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
        width: 370,
        maxWidth: "94vw",
        margin: "9vh auto 0 auto",
        background: "rgba(24, 22, 32, 0.94)",
        borderRadius: 18,
        boxShadow: "0 8px 48px 0 #0008",
        padding: "38px 32px 30px 32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        minHeight: 340,
        position: "relative",
      }}
    >
      <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 25, textAlign: "center" }}>
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
      {/* Error Message */}
      {error && (
        <div style={{ color: "#eb423b", margin: "8px 0 1px 0", fontSize: 15, textAlign: "center", fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: 18,
          background: `linear-gradient(90deg,${COLORS.accent} 10%,${COLORS.accent2} 90%)`,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontWeight: 900,
          fontSize: 20,
          padding: "13px 0",
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
        margin: "19px 0 7px 0"
      }}>
        <div style={{ flex: 1, height: 1, background: "#333" }} />
        <span style={{
          color: "#bbb", fontSize: 13, padding: "0 14px", fontWeight: 600, letterSpacing: "0.01em"
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
          fontSize: 16,
          padding: "11px 0",
          border: "none",
          borderRadius: 7,
          boxShadow: "0 1.5px 8px #0003",
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <FcGoogle size={24} style={{ marginRight: 3 }} />
        Continue with Google
      </button>

      {/* Forgot password */}
      {!isSignUp && (
        <div style={{ textAlign: "right", marginBottom: 2 }}>
          <a
            href="#"
            onClick={e => {
              e.preventDefault();
              // TODO: You can build a real forgot password flow here
              alert("Password reset coming soon!");
            }}
            style={{
              color: "#fe9245",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            Forgot your password?
          </a>
        </div>
      )}

      {/* Switch link */}
      <div style={{ color: "#bbb", marginTop: 10, textAlign: "center", fontSize: 16 }}>
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <span
              style={{ color: "#fe9245", cursor: "pointer", fontWeight: 700, textDecoration: "underline" }}
              onClick={() => onSwitchMode("sign-in")}
            >
              Sign in
            </span>
          </>
        ) : (
          <>
            New to FeelFlick?{" "}
            <span
              style={{ color: "#fe9245", cursor: "pointer", fontWeight: 700, textDecoration: "underline" }}
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
