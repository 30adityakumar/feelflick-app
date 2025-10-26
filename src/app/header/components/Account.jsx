// src/app/header/components/Account.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";

export default function Account() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Load auth + users.name
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(user || null);
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("name,email")
        .eq("id", user.id)
        .maybeSingle();

      setName(data?.name || user.user_metadata?.name || "");
    })();
    return () => { mounted = false; };
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMsg("");

    try {
      // Try update, otherwise insert (in case row is missing)
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from("users").update({ name }).eq("id", user.id);
      } else {
        await supabase.from("users").insert({
          id: user.id,
          name,
          email: user.email,
        });
      }
      setMsg("Saved!");
    } catch (e) {
      setMsg("Could not save. Please try again.");
      console.warn("Account save error", e);
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 1800);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    nav("/auth", { replace: true });
  }

  if (!user) {
    return (
      <div className="mx-auto mt-14 max-w-[560px] rounded-2xl border border-white/10 bg-neutral-950/70 p-6 text-white/80 backdrop-blur-md">
        <p>You’re signed out.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 max-w-[560px] rounded-2xl border border-white/10 bg-neutral-950/70 p-6 text-white backdrop-blur-md shadow-2xl md:mt-14">
      <h1 className="text-xl font-extrabold tracking-tight">My Account</h1>
      <p className="mt-1 text-sm text-white/70">{user.email}</p>

      <form onSubmit={handleSave} className="mt-5 space-y-4">
        <div>
          <label className="block text-[12px] font-semibold text-white/70">NAME</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="
              mt-1 w-full rounded-lg border border-white/10 bg-white/[.06] px-3.5 py-2.5
              text-[14px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand/60
            "
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="
              inline-flex items-center justify-center rounded-xl bg-gradient-to-r
              from-[#fe9245] to-[#eb423b] px-5 py-2.5 text-[0.95rem] font-semibold text-white
              disabled:opacity-60 focus:outline-none
            "
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {msg && <span className="text-sm text-white/70">{msg}</span>}
        </div>
      </form>

      <div className="mt-6 h-px w-full bg-white/10" />

      <div className="mt-6">
        <button
          onClick={signOut}
          className="rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-[0.95rem] font-semibold text-white hover:bg-white/10 focus:outline-none"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}