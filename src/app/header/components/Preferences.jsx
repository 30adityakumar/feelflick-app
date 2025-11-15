// src/app/header/components/Preferences.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/shared/lib/supabase/client";
import { CheckCircle2, Sparkles, Zap, Heart } from "lucide-react";

const GENRES = [
  { id: 28, label: "Action", emoji: "💥" },
  { id: 12, label: "Adventure", emoji: "🗺️" },
  { id: 16, label: "Animation", emoji: "🎨" },
  { id: 35, label: "Comedy", emoji: "😂" },
  { id: 80, label: "Crime", emoji: "🔫" },
  { id: 99, label: "Documentary", emoji: "🎥" },
  { id: 18, label: "Drama", emoji: "🎭" },
  { id: 10751, label: "Family", emoji: "👨‍👩‍👧‍👦" },
  { id: 14, label: "Fantasy", emoji: "🧙" },
  { id: 36, label: "History", emoji: "📜" },
  { id: 27, label: "Horror", emoji: "👻" },
  { id: 10402, label: "Music", emoji: "🎵" },
  { id: 9648, label: "Mystery", emoji: "🔍" },
  { id: 10749, label: "Romance", emoji: "💕" },
  { id: 878, label: "Sci-Fi", emoji: "🚀" },
  { id: 53, label: "Thriller", emoji: "😱" },
];

const PRESETS = [
  {
    name: "Action Pack",
    icon: <Zap className="h-4 w-4" />,
    genres: [28, 12, 53, 878],
    description: "High-octane entertainment",
  },
  {
    name: "Cozy Night",
    icon: <Heart className="h-4 w-4" />,
    genres: [10751, 35, 10402, 16],
    description: "Feel-good favorites",
  },
  {
    name: "Mind Bending",
    icon: <Sparkles className="h-4 w-4" />,
    genres: [9648, 53, 878, 14],
    description: "Thought-provoking stories",
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
      setMsg("Preferences saved successfully!");
    } catch (e) {
      console.warn("prefs save error", e);
      setMsg("Could not save. Please try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 2500);
    }
  }

  const applyPreset = (ids) => setSelected(ids);

  return (
    <div
      className="bg-black text-white w-full pb-20 md:pb-6"
      style={{
        paddingTop: "var(--hdr-h, 64px)",
        minHeight: "100vh",
      }}
    >
      <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
            Genre Preferences
          </h1>
          <p className="text-sm md:text-base text-white/60">
            Choose your favorite genres to personalize your recommendations
          </p>
        </div>

        {/* Stats & Actions Bar */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">Selected</span>
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-orange-500/20 text-sm font-bold text-orange-400">
                {selected.length}
              </span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <button
              type="button"
              className="text-sm font-semibold text-white/70 hover:text-white transition-colors"
              onClick={() => setSelected([])}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-3">
            Quick Presets
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset.genres)}
                className="group rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-4 text-left transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white">
                    {preset.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {preset.name}
                    </h3>
                    <p className="text-xs text-white/60">
                      {preset.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Genre Grid */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-3">
            All Genres
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {GENRES.map((g) => (
              <GenreChip
                key={g.id}
                active={selected.includes(g.id)}
                onClick={() => toggle(g.id)}
                label={g.label}
                emoji={g.emoji}
              />
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100"
              style={{
                background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
              }}
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : dirty ? (
                "Save Changes"
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </>
              )}
            </button>
            {msg && (
              <div className="inline-flex items-center gap-2 text-sm text-white/90 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                {msg}
              </div>
            )}
          </div>
          <p className="text-xs text-white/50 mt-3">
            Your preferences help us recommend movies you'll love
          </p>
        </div>
      </div>
    </div>
  );
}

/* ===== Genre Chip Component ===== */
function GenreChip({ active, onClick, label, emoji }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative rounded-xl p-4 text-left transition-all duration-300 ${
        active
          ? "bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/50 scale-105 shadow-lg shadow-orange-500/20"
          : "bg-white/5 border-2 border-white/10 hover:border-white/30 hover:bg-white/10"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{emoji}</span>
        {active && (
          <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
      <div className="text-sm font-bold text-white">{label}</div>
      {active && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 pointer-events-none" />
      )}
    </button>
  );
}
