import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function AccountModal({ user, onClose, onProfileUpdate }) {
  const [name, setName] = useState(user?.user_metadata?.name || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  // Save new name (Supabase user metadata)
  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    // Update metadata only if changed
    if (name && name !== user?.user_metadata?.name) {
      const { error } = await supabase.auth.updateUser({ data: { name } });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Profile updated!");
        if (onProfileUpdate) onProfileUpdate(name);
      }
    }
    setSaving(false);
  }

  // Change password logic
  async function handleChangePassword(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!password) return setError("Password cannot be empty.");
    if (password !== confirmPassword)
      return setError("Passwords do not match.");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else setMessage("Password updated!");
    setSaving(false);
    setPassword("");
    setConfirmPassword("");
    setChangingPwd(false);
  }

  // Simple close modal on escape key
  // (Optional: add useEffect for keydown listener)

  return (
    <>
      {/* Modal Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(24,22,36,0.66)",
          zIndex: 1001,
        }}
        onClick={onClose}
      />
      {/* Modal Card */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          margin: "0 auto",
          maxWidth: 390,
          minWidth: 320,
          background: "rgba(36,44,63,0.97)",
          borderRadius: 16,
          boxShadow: "0 8px 32px #0008",
          zIndex: 1002,
          color: "#fff",
          padding: "36px 28px 26px 28px",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: 18,
            top: 18,
            background: "none",
            border: "none",
            fontSize: 25,
            color: "#fdaf41",
            cursor: "pointer",
            opacity: 0.82,
          }}
          title="Close"
        >
          ×
        </button>
        <h2 style={{ fontSize: 23, fontWeight: 900, marginBottom: 24 }}>
          My Account
        </h2>
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 13 }}>
            <label
              htmlFor="email"
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 2,
                display: "block",
                color: "#bbb",
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={user.email}
              readOnly
              disabled
              style={{
                background: "#17223c",
                color: "#999",
                border: "none",
                borderRadius: 7,
                padding: "10px 11px",
                marginBottom: 4,
                fontSize: 15.5,
                width: "100%",
                opacity: 0.7,
              }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="name"
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 2,
                display: "block",
                color: "#bbb",
              }}
            >
              Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                background: "#232f4b",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                padding: "10px 11px",
                fontSize: 16,
                width: "100%",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{
              background:
                "linear-gradient(90deg,#fe9245 15%,#eb423b 95%)",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              fontWeight: 800,
              fontSize: 17,
              padding: "10px 0",
              width: "100%",
              marginBottom: 15,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
        <hr style={{ opacity: 0.16, margin: "9px 0 15px 0" }} />
        {!changingPwd ? (
          <button
            onClick={() => setChangingPwd(true)}
            style={{
              background: "#232f4b",
              color: "#fdaf41",
              border: "none",
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 16,
              width: "100%",
              padding: "9px 0",
              marginBottom: 2,
              cursor: "pointer",
            }}
          >
            Change Password
          </button>
        ) : (
          <form onSubmit={handleChangePassword}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 2,
                display: "block",
                color: "#bbb",
              }}
            >
              New Password
            </label>
            <input
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
              style={{
                background: "#232f4b",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                padding: "10px 11px",
                fontSize: 16,
                width: "100%",
                marginBottom: 8,
              }}
            />
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 2,
                display: "block",
                color: "#bbb",
              }}
            >
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              autoComplete="new-password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                background: "#232f4b",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                padding: "10px 11px",
                fontSize: 16,
                width: "100%",
                marginBottom: 12,
              }}
            />
            <div style={{ display: "flex", gap: 9 }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background:
                    "linear-gradient(90deg,#fe9245 15%,#eb423b 95%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 7,
                  fontWeight: 800,
                  fontSize: 16,
                  padding: "10px 0",
                  flex: 1,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Saving..." : "Change"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setChangingPwd(false);
                  setPassword("");
                  setConfirmPassword("");
                  setError("");
                }}
                style={{
                  background: "#222",
                  color: "#fff",
                  border: "none",
                  borderRadius: 7,
                  fontWeight: 600,
                  fontSize: 16,
                  padding: "10px 0",
                  flex: 1,
                  opacity: 0.8,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        {(error || message) && (
          <div
            style={{
              marginTop: 12,
              fontSize: 14,
              textAlign: "center",
              color: error ? "#eb423b" : "#fdaf41",
              fontWeight: 700,
              minHeight: 18,
            }}
          >
            {error || message}
          </div>
        )}
      </div>
    </>
  );
}
