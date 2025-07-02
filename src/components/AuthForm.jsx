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
  onSwitchMode,
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
  const passRules = PASSWORD_RULES.map(r => r.rule(password));
  const passwordValid = passRules.every(Boolean);
  const confirmValid = !isSignUp || password === confirmPassword;

  // Auth logic
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });
      if (error) setError(error.message);
      else if (onSuccess) onSuccess();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else if (onSuccess) onSuccess();
    }
    setLoading(false);
  };

  // Google Auth
  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) setError(error.message);
    setLoading(false);
  };

  // Forgot Password
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

  // ---- RENDER ----
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(120deg, #19233b 0%, #181c24 50%, #fe92451c 120%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative"
      }}
    >
      <style>{`
        @media (max-width: 700px) {
          .auth-glass-box {
            padding: 28px 10px !important;
            max-width: 95vw !important;
            min-width: 0 !important;
          }
        }
      `}</style>
      <form
        onSubmit={handleSubmit}
        className="auth-glass-box"
        style={{
          background: "rgba(14,16,25,0.88)",
          borderRadius: 22,
          boxShadow: "0 6px 54px #000c, 0 2.5px 18px #fe92451e",
          maxWidth: 410,
          minWidth: 340,
          width: "100%",
          padding: "36px 30px 28px 30px",
          backdropFilter: "blur(8px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          margin: "24px 0"
        }}
      >
        <div style={{
          fontSize: 32,
          fontWeight: 800,
          textAlign: "center",
          marginBottom: 28,
          letterSpacing: "-1.2px",
          color: "#fff"
        }}>
          {isSignUp ? "Sign Up" : "Sign In"}
        </div>

        {/* Email */}
        <input
          style={inputStyle}
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        {/* Password */}
        <input
          style={inputStyle}
          type="password"
          placeholder={isSignUp ? "Create a password" : "Password"}
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
        />

        {/* Confirm Password */}
        {isSignUp && (
          <input
            style={inputStyle}
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        )}

        {/* Password requirements */}
        {isSignUp && (
          <ul style={{
            color: "#c2c5d3",
            fontSize: 14,
            margin: "7px 0 3px 0",
            padding: "0 0 0 18px",
            listStyle: "none",
            lineHeight: 1.6
          }}>
            {PASSWORD_RULES.map((r, i) =>
              <li key={i} style={{
                opacity: passRules[i] ? 1 : 0.54,
                textDecoration: passRules[i] ? "none" : "line-through"
              }}>
                <span style={{
                  color: "#feb442",
                  fontWeight: 700,
                  marginRight: 3,
                  fontSize: 13.5
                }}>•</span>
                {r.label}
              </li>
            )}
          </ul>
        )}

        {/* Name */}
        {isSignUp && (
          <input
            style={inputStyle}
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoComplete="name"
            required
          />
        )}

        {/* Forgot Password */}
        {!isSignUp && (
          <div style={{ textAlign: "right", margin: "10px 0 2px 0" }}>
            <span
              style={{
                color: "#fe9245",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14
              }}
              onClick={() => setResetting(true)}
            >Forgot your Password?</span>
          </div>
        )}

        {/* Error */}
        {error && <div style={{
          color: "#eb423b", fontWeight: 600, fontSize: 15, textAlign: "center",
          margin: "13px 0 6px 0"
        }}>{error}</div>}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || (isSignUp && (!passwordValid || !confirmValid))}
          style={{
            marginTop: 18,
            background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
            color: "#fff",
            fontWeight: 800,
            border: "none",
            borderRadius: 9,
            fontSize: 22,
            padding: "12px 0",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            marginBottom: 7,
            boxShadow: "0 1.5px 8px #fe92452c"
          }}
        >{loading ? (isSignUp ? "Signing up..." : "Signing in...") : (isSignUp ? "SIGN UP" : "SIGN IN")}</button>

        {/* Google Sign In */}
        {withGoogle && (
          <button
            type="button"
            onClick={handleGoogle}
            style={{
              marginTop: 6,
              background: "#fff",
              color: "#1a1c22",
              fontWeight: 700,
              border: "none",
              borderRadius: 8,
              fontSize: 18,
              padding: "10px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow: "0 1.5px 7px #0a0a0a13"
            }}
            disabled={loading}
          >
            <img src="/google.svg" alt="Google" width={25} height={25} style={{ marginRight: 6 }} />
            Continue with Google
          </button>
        )}

        {/* Switch link */}
        <div style={{
          color: "#c7c5c6",
          marginTop: 18,
          fontSize: 16,
          textAlign: "center"
        }}>
          {isSignUp ? (
            <>Already have an account? <span
              style={{
                color: "#fe9245",
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline"
              }}
              onClick={() => { onSwitchMode && onSwitchMode("sign-in"); }}
            >Sign in now.</span></>
          ) : (
            <>New to FeelFlick? <span
              style={{
                color: "#fe9245",
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline"
              }}
              onClick={() => { onSwitchMode && onSwitchMode("sign-up"); }}
            >Sign up now.</span></>
          )}
        </div>
      </form>

      {/* Forgot Password Modal */}
      {resetting && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.75)", zIndex: 2001, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <form onSubmit={handleReset} style={{
            background: "#191924", borderRadius: 15, padding: 32, maxWidth: 340, width: "93vw",
            boxShadow: "0 8px 38px #0007", display: "flex", flexDirection: "column", alignItems: "stretch"
          }}>
            <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 15, color: "#fff" }}>
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
            {error && <div style={{ color: "#eb423b", fontSize: 15, margin: "7px 0 0 0" }}>{error}</div>}
            <button type="submit" style={{
              background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
              color: "#fff",
              fontWeight: 700,
              border: "none",
              borderRadius: 8,
              fontSize: 17,
              padding: "11px 0",
              marginTop: 13,
              marginBottom: 2,
              cursor: "pointer"
            }}>Send reset link</button>
            {resetSent && <div style={{ color: "#fe9245", marginTop: 10, fontWeight: 600 }}>Reset link sent! Check your email.</div>}
            <button type="button" onClick={() => setResetting(false)} style={{
              background: "none", border: "none", color: "#aaa", fontWeight: 500, fontSize: 15, marginTop: 13, cursor: "pointer"
            }}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
}

// Input style
const inputStyle = {
  fontSize: 17,
  background: "#191b22",
  color: "#fff",
  border: "1.5px solid #252532",
  borderRadius: 8,
  padding: "15px 14px",
  outline: "none",
  marginBottom: 14,
  marginTop: 2,
  fontWeight: 600,
  boxShadow: "0 1.5px 10px 0 #fe924510",
  letterSpacing: "0.01em"
};
