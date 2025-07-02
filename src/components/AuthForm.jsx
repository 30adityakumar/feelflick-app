// src/components/AuthForm.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";

const PASSWORD_RULES = [
  { rule: val => val.length >= 8, label: "at least 8 characters" },
  { rule: val => /[A-Z]/.test(val), label: "one uppercase letter" },
  { rule: val => /\d/.test(val), label: "one number" },
  { rule: val => /[^A-Za-z0-9]/.test(val), label: "one special character" },
];

export default function AuthForm({
  mode, // "sign-in" or "sign-up"
  onSuccess,
  onSwitchMode, // function to switch between modes
  withGoogle = true,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const isSignUp = mode === "sign-up";

  // Password Rules Validation
  const passRules = PASSWORD_RULES.map(r => r.rule(password));
  const passwordValid = passRules.every(Boolean);
  const confirmValid = !isSignUp || password === confirmPassword;

  // Handle Auth
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isSignUp) {
      if (!passwordValid) {
        setError("Password does not meet all requirements.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      // Sign up with Supabase
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });
      if (error) setError(error.message);
      else if (onSuccess) onSuccess();
    } else {
      // Sign in with Supabase
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else if (onSuccess) onSuccess();
    }
    setLoading(false);
  };

  // Handle Google Auth
  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) setError(error.message);
    setLoading(false);
  };

  // Handle Forgot Password
  const handleReset = async (e) => {
    e.preventDefault();
    setError(null);
    setResetSent(false);
    if (!resetEmail) {
      setError("Please enter your email address.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
    if (error) setError(error.message);
    else setResetSent(true);
  };

  // UI
  return (
    <div
      style={{
        minHeight: "100vh", width: "100vw", background: "#101015",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: 430, width: "100%", background: "#fff",
          borderRadius: 14, boxShadow: "0 8px 42px #0004",
          padding: 32, margin: 10, display: "flex", flexDirection: "column",
          alignItems: "stretch"
        }}
      >
        <div style={{
          fontSize: 32, fontWeight: 800, textAlign: "center",
          marginBottom: 22, letterSpacing: "-1.1px", color: "#18141c"
        }}>
          {isSignUp ? "Create your account" : "Sign in to your account"}
        </div>

        {/* FORM FIELDS */}
        <label style={{ fontWeight: 700, fontSize: 17, color: "#161819", marginBottom: 4, marginTop: 5 }}>
          Email address
        </label>
        <input
          style={inputStyle}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <label style={{ fontWeight: 700, fontSize: 17, color: "#161819", marginBottom: 4, marginTop: 16 }}>
          Password
        </label>
        <input
          style={inputStyle}
          type="password"
          placeholder={isSignUp ? "Create a password" : "Enter your password"}
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
        />

        {isSignUp && (
          <>
            <label style={{ fontWeight: 700, fontSize: 17, color: "#161819", marginBottom: 4, marginTop: 16 }}>
              Confirm password
            </label>
            <input
              style={inputStyle}
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            {/* Password requirements */}
            <ul style={{
              color: "#888", fontSize: 14, margin: "12px 0 0 0", padding: "0 0 0 15px",
              listStyle: "none", lineHeight: 1.65
            }}>
              <div style={{ fontWeight: 700, marginBottom: 2, color: "#3a3a4a" }}>Password must contain:</div>
              {PASSWORD_RULES.map((r, i) =>
                <li key={i}
                  style={{
                    opacity: passRules[i] ? 1 : 0.58,
                    textDecoration: passRules[i] ? "none" : "line-through",
                    marginBottom: 1
                  }}
                >{`• Password must be ${r.label}`}</li>
              )}
            </ul>
          </>
        )}

        {/* Forgot Password */}
        {!isSignUp && (
          <div style={{ textAlign: "right", margin: "10px 0 0 0" }}>
            <span
              style={{ color: "#2764c0", cursor: "pointer", fontWeight: 600, fontSize: 15 }}
              onClick={() => setResetting(true)}
            >Forgot your Password?</span>
          </div>
        )}

        {/* Name (Sign up only) */}
        {isSignUp && (
          <>
            <label style={{ fontWeight: 700, fontSize: 17, color: "#161819", marginBottom: 4, marginTop: 16 }}>
              Your Name
            </label>
            <input
              style={inputStyle}
              type="text"
              placeholder="First Name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </>
        )}

        {/* Error */}
        {error && <div style={{
          color: "#eb423b", fontWeight: 600, fontSize: 15, textAlign: "center",
          margin: "13px 0 5px 0"
        }}>{error}</div>}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || (isSignUp && (!passwordValid || !confirmValid))}
          style={{
            marginTop: 24,
            background: "#18141c",
            color: "#fff", fontWeight: 800, border: "none",
            borderRadius: 8, fontSize: 19, padding: "13px 0", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1, marginBottom: 4, boxShadow: "0 1.5px 8px #0002"
          }}
        >{loading ? (isSignUp ? "Signing up..." : "Signing in...") : (isSignUp ? "Sign up" : "Sign in")}</button>

        {/* Google Sign In */}
        {withGoogle && (
          <button
            type="button"
            onClick={handleGoogle}
            style={{
              marginTop: 8, background: "#fff",
              color: "#212", fontWeight: 700, border: "1px solid #c5c7d4",
              borderRadius: 8, fontSize: 18, padding: "12px 0",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1, boxShadow: "0 1.5px 8px #0001"
            }}
            disabled={loading}
          >
            <img src="/google.svg" alt="Google" width={26} height={26} style={{ marginRight: 7 }} />
            Continue with Google
          </button>
        )}

        {/* Switch */}
        <div style={{
          marginTop: 22, textAlign: "center", fontSize: 16, color: "#333",
          fontWeight: 500, letterSpacing: "0.02em"
        }}>
          {isSignUp ? (
            <>Already have an account? <span
              style={{ color: "#2764c0", cursor: "pointer", fontWeight: 700 }}
              onClick={() => { onSwitchMode && onSwitchMode("sign-in"); }}
            >Sign in</span></>
          ) : (
            <>Don't have an account? <span
              style={{ color: "#2764c0", cursor: "pointer", fontWeight: 700 }}
              onClick={() => { onSwitchMode && onSwitchMode("sign-up"); }}
            >Sign up</span></>
          )}
        </div>
      </form>

      {/* Forgot Password Modal */}
      {resetting && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.72)", zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <form onSubmit={handleReset} style={{
            background: "#fff", borderRadius: 13, padding: 30, maxWidth: 400, width: "93vw",
            boxShadow: "0 8px 48px #0007", display: "flex", flexDirection: "column", alignItems: "stretch"
          }}>
            <div style={{ fontWeight: 800, fontSize: 21, marginBottom: 13, color: "#18141c" }}>
              Reset your password
            </div>
            <input
              style={inputStyle}
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              autoComplete="email"
              required
            />
            {error && <div style={{ color: "#eb423b", fontSize: 15, margin: "6px 0 0 0" }}>{error}</div>}
            <button type="submit" style={{
              background: "#18141c", color: "#fff", fontWeight: 700, border: "none", borderRadius: 8,
              fontSize: 17, padding: "11px 0", marginTop: 13, marginBottom: 2, cursor: "pointer"
            }}>Send reset link</button>
            {resetSent && <div style={{ color: "#2764c0", marginTop: 10, fontWeight: 600 }}>Reset link sent! Check your email.</div>}
            <button type="button" onClick={() => setResetting(false)} style={{
              background: "none", border: "none", color: "#888", fontWeight: 500, fontSize: 16, marginTop: 14, cursor: "pointer"
            }}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  fontSize: 17,
  background: "#f7f7f9",
  color: "#222",
  border: "1.5px solid #dadbe8",
  borderRadius: 8,
  padding: "13px 13px",
  outline: "none",
  marginBottom: 2,
  marginTop: 2,
  fontWeight: 500,
  boxShadow: "0 1px 8px 0 #191a1b10",
  letterSpacing: "0.01em",
};
