// src/app/header/components/Preferences.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/shared/lib/supabase/client";

/** Static genre catalog (aligns with onboarding) */
const GENRES = [
  { id: 28, label: "Action" }, { id: 12, label: "Adventure" },
  { id: 16, label: "Animation" }, { id: 35, label: "Comedy" },
  { id: 80, label: "Crime" }, { id: 99, label: "Documentary" },
  { id: 18, label: "Drama" }, { id: 10751, label: "Family" },
  { id: 14, label: "Fantasy" }, { id: 36, label: "History" },
  { id: 27, label: "Horror" }, { id: 10402, label: "Music" },
  { id: 9648, label: "Mystery" }, { id: 10749, label: "Romance" },
  { id: 878, label: "Sci-fi" }, { id: 53, label: "Thriller" },
];

function Chip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "min-w-[108px] rounded-xl px-3 py-2 text-sm font-semibold transition outline-none",
        active
          ? "text-white ring-1 ring-white/15"
          : "text-white/85 hover:bg-white/[.09] border border-white/15 bg-white/[.05] focus:ring-2 focus:ring-white/20",
      ].join(" ")}
      style={
        active
          ? {
              border: "1px solid transparent",
              background:
                "linear-gradient(135deg, rgba(60,120,255,0.55), rgba(100,70,255,0.45))",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.2), 0 0 10px rgba(80,140,255,0.25)",
              backdropFilter: "blur(6px)",
            }
          : undefined
      }
    >
      {label}
    </button>
  );
}

export default function Preferences() {
  const [userId, setUserId] = useState(null);
  const [selected, setSelected] = useState([]); // current UI selection
  const [initial, setInitial] = useState([]);   // last-saved snapshot
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // --- Load auth user and current preferences ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted || !user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from("user_preferences")
        .select("genre_id")
        .eq("user_id", user.id);

      if (!error && Array.isArray(data)) {
        const values = data.map(r => r.genre_id);
        setSelected(values);
        setInitial(values);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  // Track if there are unsaved changes
  const dirty = useMemo(() => {
    if (initial.length !== selected.length) return true;
    const setInit = new Set(initial);
    for (const g of selected) if (!setInit.has(g)) return true;
    return false;
  }, [initial, selected]);

  async function save() {
    if (!userId || !dirty) return;
    setSaving(true);
    setMsg("");

    try {
      // replace user's genre set atomically (two simple queries)
      await supabase.from("user_preferences").delete().eq("user_id", userId);

      if (selected.length) {
        const rows = selected.map((genre_id) => ({ user_id: userId, genre_id }));
        await supabase
          .from("user_preferences")
          .upsert(rows, { onConflict: "user_id,genre_id" });
      }

      setInitial(selected);
      setMsg("Preferences saved!");
    } catch (e) {
      console.warn("prefs save error", e);
      setMsg("Could not save. Check your connection and try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 2000);
    }
  }

  // Optional: quick presets
  const applyPreset = (ids) => setSelected(ids);

  return (
    <div
      className="w-full md:mx-auto md:mt-10 md:max-w-[820px] md:rounded-2xl md:border md:border-white/10 md:bg-neutral-950/70 md:p-6 md:backdrop-blur-md md:shadow-2xl"
      style={{
        minHeight: "calc(100vh - var(--hdr-h,48px) - 58px)",
      }}
    >
      <div className="px-4 pt-3 md:px-0 md:pt-0">
        <h1 className="text-xl font-extrabold tracking-tight">Preferences</h1>
        <p className="mt-1 text-sm text-white/70">
          Pick a few genres you enjoy; we’ll tune recommendations to your vibe.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/70">
          <span>
            Selected{" "}
            <span className="font-semibold text-white">{selected.length}</span>
          </span>
          <span className="opacity-40">•</span>
          <button
            type="button"
            className="rounded-md border border-white/12 px-2.5 py-1 hover:bg-white/10"
            onClick={() => setSelected([])}
          >
            Clear
          </button>
          <button
            type="button"
            className="rounded-md border border-white/12 px-2.5 py-1 hover:bg-white/10"
            onClick={() => applyPreset([28, 12, 16, 35])}
          >
            Action Pack
          </button>
          <button
            type="button"
            className="rounded-md border border-white/12 px-2.5 py-1 hover:bg-white/10"
            onClick={() => applyPreset([10751, 35, 10402])}
          >
            Cozy Night
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
          {GENRES.map((g) => (
            <Chip
              key={g.id}
              active={selected.includes(g.id)}
              onClick={() => toggle(g.id)}
              label={g.label}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-[0.95rem] font-semibold text-white disabled:opacity-60 focus:outline-none"
            style={{ background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)" }}
          >
            {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </button>
          {msg && (
            <div className="rounded-lg border border-white/12 bg-white/[.06] px-3 py-2 text-sm text-white/85">
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
