// src/app/pages/watchlist/Watchlist.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";
import { Bookmark, Trash2, Loader2 } from "lucide-react";

const TMDB_IMG = "https://image.tmdb.org/t/p/w342";

export default function Watchlist() {
  const [user, setUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  // simple status filter pills
  const [tab, setTab] = useState("saved"); // "saved" | "onboarding" | "all"

  // fetch user
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      setUser(user || null);
    })();
    return () => { active = false; };
  }, []);

  // fetch list according to tab
  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);

    (async () => {
      try {
        let q = supabase
          .from("user_watchlist")
          .select("movie_id,status,added_at")
          .eq("user_id", user.id)
          .order("added_at", { ascending: false });

        if (tab === "saved") q = q.neq("status", "onboarding");
        if (tab === "onboarding") q = q.eq("status", "onboarding");

        const { data: watchlist, error } = await q;
        if (error) throw error;

        const ids = (watchlist || []).map(r => r.movie_id);
        if (ids.length === 0) {
          if (active) { setMovies([]); setLoading(false); }
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
        <section className="mt-6 grid gap-4 sm:gap-5
                            grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
          {movies.map((m) => (
            <article key={m.id} className="group relative">
              {/* remove */}
              <button
                onClick={() => remove(m.id)}
                disabled={removingId === m.id}
                className={`absolute top-2 right-2 z-10 rounded-full bg-black/70 p-2 text-white/90 shadow
                           hover:bg-red-600/90 hover:text-white transition
                           opacity-0 group-hover:opacity-100 focus:opacity-100
                           ${removingId === m.id ? "opacity-100 animate-pulse" : ""}`}
                aria-label={`Remove ${m.title} from watchlist`}
              >
                <Trash2 size={18} />
              </button>

              <Link
                to={`/movie/${m.id}`}
                className="block overflow-hidden rounded-xl border border-white/10 bg-white/[.03]
                           ring-0 hover:ring-2 hover:ring-white/15 transition-all"
              >
                <div className="relative">
                  <img
                    src={m.poster_path ? `${TMDB_IMG}${m.poster_path}` : "/placeholder-movie.png"}
                    alt={m.title}
                    className="h-[232px] w-full object-cover sm:h-[260px]"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 via-black/0" />
                </div>

                <div className="px-3 pb-3 -mt-12 relative">
                  <div className="line-clamp-2 text-[0.95rem] font-semibold text-white drop-shadow">
                    {m.title}
                  </div>
                  <div className="mt-0.5 text-xs text-white/65">
                    {(m.release_date || "").slice(0, 4)}
                    {typeof m.vote_average === "number" && (
                      <span className="ml-2">★ {m.vote_average.toFixed(1)}</span>
                    )}
                    {m.status === "onboarding" && (
                      <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
                        Onboarding
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

/* ----------------------- UI bits ----------------------- */

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