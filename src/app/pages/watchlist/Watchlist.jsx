// src/app/pages/watchlist/Watchlist.jsx
import { useEffect, useMemo, useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { supabase } from "@/shared/lib/supabase/client";
import MovieCard from "@/app/pages/components/MovieCard";
import RemoveButton from "@/app/pages/components/RemoveButton";
import MovieGrid from "@/app/pages/components/MovieGrid";

export default function Watchlist() {
  const [user, setUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [tab, setTab] = useState("saved"); // "saved" | "onboarding" | "all"

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (active) setUser(user || null);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);

    (async () => {
      try {
        let query = supabase
          .from("user_watchlist")
          .select("movie_id,status,added_at")
          .eq("user_id", user.id)
          .order("added_at", { ascending: false });

        if (tab === "saved") query = query.neq("status", "onboarding");
        else if (tab === "onboarding") query = query.eq("status", "onboarding");

        const { data: watchlist, error } = await query;
        if (error) throw error;

        const ids = (watchlist || []).map(r => r.movie_id);
        if (ids.length === 0) {
          if (active) {
            setMovies([]);
            setLoading(false);
          }
          return;
        }

        const { data: rows, error: mErr } = await supabase
          .from("movies")
          .select("id,title,poster_path,release_date,vote_average")
          .in("id", ids);

        if (mErr) throw mErr;

        const map = new Map(rows.map(r => [r.id, r]));
        const merged = (watchlist || [])
          .map(w => ({ ...map.get(w.movie_id), added_at: w.added_at, status: w.status }))
          .filter(Boolean);

        if (active) setMovies(merged);
      } catch {
        if (active) setMovies([]);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [user, tab, removingId]);

  async function remove(movieId) {
    if (!user) return;
    setRemovingId(movieId);
    try {
      await supabase.from("user_watchlist")
        .delete()
        .eq("user_id", user.id)
        .eq("movie_id", movieId);
      setMovies(prev => prev.filter(m => m.id !== movieId));
    } finally {
      setRemovingId(null);
    }
  }

  const counts = useMemo(() => {
    const all = movies.length;
    const onboarding = movies.filter(m => m.status === "onboarding").length;
    const saved = all - onboarding;
    return { all, saved, onboarding };
  }, [movies]);

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Page title + pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-orange-500/20 text-orange-400">
            <Bookmark size={18} />
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Your Watchlist
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Pill
            active={tab === "saved"}
            onClick={() => setTab("saved")}
            label={`Saved${counts.saved ? ` · ${counts.saved}` : ""}`}
          />
          <Pill
            active={tab === "onboarding"}
            onClick={() => setTab("onboarding")}
            label={`Onboarding${counts.onboarding ? ` · ${counts.onboarding}` : ""}`}
          />
          <Pill
            active={tab === "all"}
            onClick={() => setTab("all")}
            label={`All${counts.all ? ` · ${counts.all}` : ""}`}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-[40vh] text-white/80">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading your Watchlist…
        </div>
      ) : movies.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <MovieGrid>
          {movies.map(m => (
            <MovieCard
              key={m.id}
              movie={m}
              onRemove={remove}
              removing={removingId === m.id}
            />
          ))}
        </MovieGrid>
      )}
    </main>
  );
}

/* UI components for Pills and EmptyState remain unchanged */
function Pill({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "h-9 rounded-full px-3.5 text-sm font-semibold transition",
        active
          ? "text-white shadow-sm"
          : "text-white/80 hover:text-white hover:bg-white/10 border border-white/15",
      ].join(" ")}
      style={
        active
          ? {
              background:
                "linear-gradient(90deg, rgba(254,146,69,.9) 10%, rgba(235,66,59,.9) 90%)",
              border: "1px solid rgba(255,255,255,0.12)",
            }
          : undefined
      }
    >
      {label}
    </button>
  );
}

function EmptyState({ tab }) {
  const title =
    tab === "onboarding"
      ? "No onboarding picks yet."
      : tab === "saved"
      ? "Your watchlist is empty."
      : "Nothing here yet.";
  const help =
    tab === "onboarding"
      ? "Add a few titles during onboarding or from any movie page."
      : "Browse and add movies you want to see.";

  return (
    <div className="mt-14 flex flex-col items-center justify-center text-center">
      <img
        src="/movie-popcorn.svg"
        alt=""
        className="mb-4 h-20 w-20 opacity-40"
        style={{ filter: "grayscale(1)" }}
      />
      <div className="text-xl font-semibold text-white/90">{title}</div>
      <div className="mt-1 text-white/60">{help}</div>
    </div>
  );
}
