// src/app/header/components/Preferences.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/shared/lib/supabase/client";
import { CheckCircle2, Sparkles, Zap, Heart, Check } from "lucide-react";

const GENRES = [
  { id: 28, label: "Action" },
  { id: 12, label: "Adventure" },
  { id: 16, label: "Animation" },
  { id: 35, label: "Comedy" },
  { id: 80, label: "Crime" },
  { id: 99, label: "Documentary" },
  { id: 18, label: "Drama" },
  { id: 10751, label: "Family" },
  { id: 14, label: "Fantasy" },
  { id: 36, label: "History" },
  { id: 27, label: "Horror" },
  { id: 10402, label: "Music" },
  { id: 9648, label: "Mystery" },
  { id: 10749, label: "Romance" },
  { id: 878, label: "Sci-Fi" },
  { id: 53, label: "Thriller" },
];

const PRESETS = [
  {
    name: "Action Pack",
    icon: <Zap className="h-4 w-4" />,
    genres: [28, 12, 53, 878],
  },
  {
    name: "Cozy Night",
    icon: <Heart className="h-4 w-4" />,
    genres: [10751, 35, 10402, 16],
  },
  {
    name: "Mind Bending",
    icon: <Sparkles className="h-4 w-4" />,
    genres: [9648, 53, 878, 14],
  },
];

export default function Preferences() {
  const [userId, setUserId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [initial, setInitial] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted || !user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from("user_preferences")
        .select("genre_id")
        .eq("user_id", user.id);

      if (!error && Array.isArray(data)) {
        const values = data.map((r) => r.genre_id);
        setSelected(values);
        setInitial(values);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

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
      await supabase.from("user_preferences").delete().eq("user_id", userId);
      if (selected.length) {
        const rows = selected.map((genre_id) => ({ user_id: userId, genre_id }));
        await supabase
          .from("user_preferences")
          .upsert(rows, { onConflict: "user_id,genre_id" });
      }
      setInitial(selected);
      setMsg("Saved!");
    } catch (e) {
      console.warn("prefs save error", e);
      setMsg("Error saving");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 2000);
    }
  }

  const applyPreset = (ids) => setSelected(ids);

  return (
    <div
      className="bg-black text-white w-full pb-20 md:pb-8"
      style={{
        paddingTop: "var(--hdr-h, 64px)",
        minHeight: "100vh",
      }}
    >
      <div className="mx-auto max-w-5xl px-4 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight mb-1 sm:mb-2">
            Genre Preferences
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-white/60">
            Choose genres to personalize your recommendations
          </p>
        </div>

        {/* Stats Bar */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-white/70">Selected</span>
              <span className="inline-flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-orange-500/20 text-xs sm:text-sm font-bold text-orange-400">
                {selected.length}
              </span>
            </div>
            <div className="h-3 sm:h-4 w-px bg-white/20" />
            <button
              type="button"
              className="text-xs sm:text-sm font-semibold text-white/70 hover:text-white transition-colors active:scale-95"
              onClick={() => setSelected([])}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-[10px] sm:text-xs font-bold text-white/70 uppercase tracking-wider mb-2 sm:mb-3">
            Quick Presets
          </h2>
          <div className="grid gap-2 sm:gap-3 grid-cols-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset.genres)}
                className="group rounded-lg sm:rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-2.5 sm:p-3 md:p-4 text-left transition-all active:scale-95"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white flex-shrink-0">
                    {preset.icon}
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                    {preset.name}
                  </h3>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Genre Grid */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-[10px] sm:text-xs font-bold text-white/70 uppercase tracking-wider mb-2 sm:mb-3">
            All Genres
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5 md:gap-3">
            {GENRES.map((g) => (
              <GenreChip
                key={g.id}
                active={selected.includes(g.id)}
                onClick={() => toggle(g.id)}
                label={g.label}
              />
            ))}
          </div>
        </div>

        {/* Save Section */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 sm:p-5 md:p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100"
              style={{
                background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
              }}
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span className="hidden sm:inline">Saving...</span>
                  <span className="sm:hidden">Saving...</span>
                </>
              ) : dirty ? (
                <>
                  <span className="hidden sm:inline">Save Changes</span>
                  <span className="sm:hidden">Save</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Saved</span>
                </>
              )}
            </button>
            {msg && (
              <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-white/90 bg-green-500/10 border border-green-500/20 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                {msg}
              </div>
            )}
          </div>
          <p className="text-[10px] sm:text-xs text-white/50 mt-2 sm:mt-3">
            Preferences help us recommend movies you'll love
          </p>
        </div>
      </div>
    </div>
  );
}

/* ===== Genre Chip Component ===== */
function GenreChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative rounded-lg sm:rounded-xl p-3 sm:p-3.5 md:p-4 text-center transition-all duration-300 ${
        active
          ? "bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/50 scale-[1.02] shadow-lg shadow-orange-500/10"
          : "bg-white/5 border-2 border-white/10 hover:border-white/30 hover:bg-white/10 active:scale-95"
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        <div className="text-xs sm:text-sm font-bold text-white">{label}</div>
        {active && (
          <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
            <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
          </div>
        )}
      </div>
    </button>
  );
}
