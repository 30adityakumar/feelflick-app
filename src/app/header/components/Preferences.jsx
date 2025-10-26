// src/app/header/components/Preferences.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/shared/lib/supabase/client";

const GENRES = [
  { id: 28, label: "Action" }, { id: 12, label: "Adventure" },
  { id: 16, label: "Animation" }, { id: 35, label: "Comedy" },
  { id: 80, label: "Crime" }, { id: 99, label: "Documentary" },
  { id: 18, label: "Drama" }, { id: 10751, label: "Family" },
  { id: 14, label: "Fantasy" }, { id: 36, label: "History" },
  { id: 27, label: "Horror" }, { id: 10402, label: "Music" },
  { id: 9648, label: "Mystery" }, { id: 10749, label: "Romance" },
  { id: 878, label: "Sci-Fi" }, { id: 53, label: "Thriller" },
];

export default function Preferences() {
  const [userId, setUserId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Load user + current preferences
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) return;

      setUserId(user.id);

      const { data, error } = await supabase
        .from("user_preferences")
        .select("genre_id")
        .eq("user_id", user.id);

      if (!error && Array.isArray(data)) {
        setSelected(data.map((r) => r.genre_id));
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  async function save() {
    if (!userId) return;
    setSaving(true);
    setMsg("");

    try {
      await supabase.from("user_preferences").delete().eq("user_id", userId);
      if (selected.length) {
        await supabase
          .from("user_preferences")
          .upsert(
            selected.map((genre_id) => ({ user_id: userId, genre_id })),
            { onConflict: "user_id,genre_id" }
          );
      }
      setMsg("Preferences saved!");
    } catch (e) {
      console.warn("prefs save error", e);
      setMsg("Could not save. Please try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 1800);
    }
  }

  const chips = useMemo(
    () =>
      GENRES.map((g) => {
        const active = selected.includes(g.id);
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => toggle(g.id)}
            className={[
              "min-w-[108px] rounded-xl border px-3 py-2 text-sm font-semibold transition",
              active
                ? "border-transparent bg-[linear-gradient(135deg,#fe9245,#eb423b)] text-white"
                : "border-white/15 bg-white/[.05] text-white/85 hover:bg-white/[.09]",
            ].join(" ")}
          >
            {g.label}
          </button>
        );
      }),
    [selected]
  );

  return (
    <div className="mx-auto mt-10 max-w-[820px] rounded-2xl border border-white/10 bg-neutral-950/70 p-6 text-white backdrop-blur-md shadow-2xl md:mt-14">
      <h1 className="text-xl font-extrabold tracking-tight">Preferences</h1>
      <p className="mt-1 text-sm text-white/70">
        Pick a few genres you enjoy; we’ll tune recommendations to your vibe.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
        {chips}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={save}
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
    </div>
  );
}