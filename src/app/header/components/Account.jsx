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
    <div
      className="
        max-w-[420px] mx-auto mt-14 p-7
        bg-[#191820] rounded-2xl shadow-2xl
        relative
        flex flex-col
      "
    >
      {/* X button */}
      <button
        onClick={() => navigate("/app")}
        className="
          absolute top-3 right-4 text-white opacity-60 hover:opacity-100
          bg-transparent border-none text-xl cursor-pointer z-20
        "
        aria-label="Close Account"
        title="Go back to Home"
        type="button"
      >
        <X size={26} />
      </button>

      <h2 className="text-white text-[23px] font-extrabold mb-4 tracking-tight">
        My Account
      </h2>
      <form onSubmit={handleSave} className="flex flex-col">
        {/* Name */}
        <div className="mb-3.5">
          <label className="block text-[#fdaf41] font-semibold mb-1">
            Name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="
              w-full px-3.5 py-2
              rounded-lg border border-[#2d2a38]
              bg-[#242134] text-white text-[15px] font-medium
              mt-1 outline-none
              focus:ring-2 focus:ring-orange-400
              placeholder:text-zinc-400
              transition
            "
            placeholder="Your name"
          />
        </div>
        {/* Email */}
        <div className="mb-3.5">
          <label className="block text-[#fdaf41] font-semibold mb-1">
            Email
          </label>
          <input
            value={user?.email || ""}
            disabled
            className="
              w-full px-3.5 py-2
              rounded-lg border border-[#2d2a38]
              bg-[#242134] text-white text-[15px] font-medium
              mt-1 outline-none opacity-70
              placeholder:text-zinc-400
              cursor-not-allowed
              transition
            "
            placeholder="Email address"
          />
        </div>
        {/* Avatar */}
        <div className="mb-6">
          <label className="block text-[#fdaf41] font-semibold mb-1">
            Avatar URL
          </label>
          <input
            value={avatar}
            onChange={e => setAvatar(e.target.value)}
            className="
              w-full px-3.5 py-2
              rounded-lg border border-[#2d2a38]
              bg-[#242134] text-white text-[15px] font-medium
              mt-1 outline-none
              focus:ring-2 focus:ring-orange-400
              placeholder:text-zinc-400
              transition
            "
            placeholder="Paste an image URL"
          />
          {avatar && (
            <img
              src={avatar}
              alt="avatar"
              className="
                mt-2 w-12 h-12 rounded-full object-cover
                border-2 border-[#33323c]
                shadow
              "
            />
          )}
        </div>
        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="
            bg-gradient-to-r from-orange-400 to-red-500
            text-white font-bold py-2.5 px-8
            rounded-lg text-[16px] cursor-pointer
            shadow-md transition
            disabled:opacity-70
          "
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
