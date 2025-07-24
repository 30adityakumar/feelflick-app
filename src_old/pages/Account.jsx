import { useState } from "react";
import { supabase } from "@/shared/lib/supabase/client";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Account({ user, onProfileUpdate }) {
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    await supabase
      .from("users")
      .update({ name, avatar_url: avatar })
      .eq("id", user.id);
    setSaving(false);
    if (onProfileUpdate) onProfileUpdate({ name, avatar_url: avatar });
    alert("Profile updated!");
  }

  return (
    <div style={{
      maxWidth: 420, margin: "54px auto 0 auto", padding: 28,
      background: "#191820", borderRadius: 18, boxShadow: "0 2px 24px #0004",
      position: "relative"
    }}>
      {/* X button */}
      <button
        onClick={() => navigate("/app")}
        style={{
          position: "absolute", top: 14, right: 18,
          background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", opacity: 0.6, zIndex: 2
        }}
        aria-label="Close Account"
        title="Go back to Home"
      >
        <X size={26} />
      </button>
      <h2 style={{ color: "#fff", fontSize: 23, fontWeight: 800, marginBottom: 16, letterSpacing: "-1px" }}>
        My Account
      </h2>
      <form onSubmit={handleSave}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: "#fdaf41", fontWeight: 600 }}>Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
            placeholder="Your name"
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: "#fdaf41", fontWeight: 600 }}>Email</label>
          <input
            value={user?.email || ""}
            disabled
            style={{ ...inputStyle, opacity: 0.7 }}
            placeholder="Email address"
          />
        </div>
        <div style={{ marginBottom: 22 }}>
          <label style={{ color: "#fdaf41", fontWeight: 600 }}>Avatar URL</label>
          <input
            value={avatar}
            onChange={e => setAvatar(e.target.value)}
            style={inputStyle}
            placeholder="Paste an image URL"
          />
          {avatar && (
            <img
              src={avatar}
              alt="avatar"
              style={{
                marginTop: 8, width: 48, height: 48, borderRadius: "50%",
                objectFit: "cover", border: "2px solid #33323c"
              }}
            />
          )}
        </div>
        <button type="submit" disabled={saving} style={{
          background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
          color: "#fff", border: "none", padding: "10px 30px",
          borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: "pointer", opacity: saving ? 0.7 : 1
        }}>{saving ? "Saving..." : "Save"}</button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 14px",
  borderRadius: 7,
  border: "1px solid #2d2a38",
  background: "#242134",
  color: "#fff",
  fontSize: 15,
  marginTop: 4,
  fontFamily: "Inter, sans-serif",
  fontWeight: 500,
};
