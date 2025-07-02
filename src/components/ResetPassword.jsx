// src/components/ResetPassword.jsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const accessToken = searchParams.get("access_token");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    // Call Supabase API to update password
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else {
      setSuccess(true);
      setTimeout(() => navigate("/auth/sign-in"), 1800);
    }
  }

  // If missing token, tell user
  if (!accessToken) {
    return (
      <div style={{ color: "#fff", padding: 50, textAlign: "center" }}>
        Invalid reset link.<br />Please try again.
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#101015",
      fontFamily: "Inter,sans-serif"
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: "rgba(24,22,32,0.95)",
          borderRadius: 15,
          padding: "38px 32px",
          boxShadow: "0 8px 38px #000a",
          minWidth: 340
        }}
      >
        <div style={{ fontSize: 23, fontWeight: 900, color: "#fff", marginBottom: 16, textAlign: "center" }}>
          Set a New Password
        </div>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          style={inputStyle}
        />
        {error && <div style={{ color: "#eb423b", margin: "8px 0 1px 0", textAlign: "center", fontSize: 14 }}>{error}</div>}
        {success
          ? <div style={{ color: "#fe9245", fontWeight: 700, textAlign: "center", marginTop: 15 }}>Password updated! Redirecting…</div>
          : <button
              type="submit"
              style={{
                marginTop: 15,
                background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 16,
                padding: "10px 0",
                cursor: "pointer"
              }}
            >
              Reset Password
            </button>
        }
      </form>
    </div>
  );
}

const inputStyle = {
  margin: "12px 0",
  padding: "13px 11px",
  borderRadius: 8,
  border: "none",
  fontSize: 15.5,
  background: "#232330",
  color: "#fff",
  fontWeight: 500,
  outline: "none",
  boxShadow: "0 1.5px 8px 0 #0004"
};
