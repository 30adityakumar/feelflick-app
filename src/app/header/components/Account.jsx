// src/app/header/components/Account.jsx
import { useState } from "react";
import { supabase } from "@/shared/lib/supabase/client";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Account({ user, onProfileUpdate }) {
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("users").update({ name }).eq("id", user.id);
    setSaving(false);
    if (onProfileUpdate) onProfileUpdate({ name });
    alert("Profile updated!");
  }

  return (
    <div className="relative mx-auto mt-14 flex max-w-[420px] flex-col rounded-2xl bg-[#191820] p-7 shadow-2xl">
      <button
        onClick={() => navigate("/home")}
        className="absolute right-4 top-3 z-20 cursor-pointer border-none bg-transparent text-xl text-white opacity-60 hover:opacity-100"
        aria-label="Close Account"
        title="Go back to Home"
        type="button"
      >
        <X size={26} />
      </button>

      <h2 className="mb-4 text-[23px] font-extrabold tracking-tight text-white">
        My Account
      </h2>
      <form onSubmit={handleSave} className="flex flex-col">
        <div className="mb-4">
          <label className="mb-1 block font-semibold text-[#fdaf41]">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#2d2a38] bg-[#242134] px-3.5 py-2 text-[15px] font-medium text-white outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-orange-400 transition"
            placeholder="Your name"
          />
        </div>

        <div className="mb-6">
          <label className="mb-1 block font-semibold text-[#fdaf41]">Email</label>
          <input
            value={user?.email || ""}
            disabled
            className="mt-1 w-full cursor-not-allowed rounded-lg border border-[#2d2a38] bg-[#242134] px-3.5 py-2 text-[15px] font-medium text-white opacity-70 outline-none placeholder:text-zinc-400 transition"
            placeholder="Email address"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-gradient-to-r from-orange-400 to-red-500 px-8 py-2.5 text-[16px] font-bold text-white shadow-md transition disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}