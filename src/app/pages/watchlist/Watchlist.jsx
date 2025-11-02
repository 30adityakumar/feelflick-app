// src/app/pages/watchlist/Watchlist.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";
import Header from "@/app/header/Header";
import Sidebar from "@/app/header/sidebar/Sidebar";
import { Bookmark, Trash2, Check, Inbox } from "lucide-react";

const TMDB_IMG = "https://image.tmdb.org/t/p/w342";

export default function Watchlist() {
  const [user, setUser] = useState(null);
  const [rows, setRows] = useState([]);          // raw joined rows (includes added_at, status)
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);    // id that's currently being mutated
  const [filter, setFilter] = useState("saved"); // 'saved' | 'onboarding' | 'all'
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError("");
    (async () => {
      let query = supabase
        .from("user_watchlist")
        .select(`
          movie_id, added_at, status,
          movies:movie_id ( id, title, poster_path, release_date )
        `)
        .eq("user_id", user.id)
        .order("added_at", { ascending: false });

      if (filter === "saved") query = query.neq("status", "onboarding");
      if (filter === "onboarding") query = query.eq("status", "onboarding");

      const { data, error } = await query;

      if (error) {
        setRows([]);
        setError("Could not load your watchlist.");
      } else {
        // Guard against missing movie relation
        const cleaned = (data || []).filter(r => r.movies?.id).map(r => ({
          id: r.movies.id,
          title: r.movies.title,
          poster_path: r.movies.poster_path,
          release_date: r.movies.release_date,
          added_at: r.added_at,
          status: r.status || "saved",
        }));
        setRows(cleaned);
      }
      setLoading(false);
    })();
  }, [user, filter]);

  async function handleRemove(id) {
    if (!user) return;
    setBusyId(id);
    try {
      await supabase.from("user_watchlist").delete().eq("user_id", user.id).eq("movie_id", id);
      setRows(prev => prev.filter(m => m.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkWatched(m) {
    if (!user) return;
    setBusyId(m.id);
    try {
      // 1) upsert into movies_watched
      await supabase.from("movies_watched").upsert({
        user_id: user.id,
        movie_id: m.id,
        title: m.title ?? null,
        poster: m.poster_path ?? null,
        release_date: m.release_date ?? null,
      }, { onConflict: "user_id,movie_id" });

      // 2) remove from watchlist
      await supabase.from("user_watchlist")
        .delete()
        .eq("user_id", user.id)
        .eq("movie_id", m.id);

      // 3) optimistic UI
      setRows(prev => prev.filter(x => x.id !== m.id));
    } finally {
      setBusyId(null);
    }
  }

  const content = useMemo(() => {
    if (loading) return <SkeletonGrid />;
    if (rows.length === 0) {
      return (
        <EmptyState
          filter={filter}
          onBrowse={() => (window.location.href = "/browse")}
          message={error || undefined}
        />
      );
    }
    return (
      <div
        className={`
          grid gap-4
          grid-cols-2 sm:grid-cols-3 md:grid-cols-5
          ${rows.length < 5 ? "justify-center" : ""}
        `}
      >
        {rows.map((m) => (
          <Card
            key={m.id}
            movie={m}
            busy={busyId === m.id}
            onRemove={() => handleRemove(m.id)}
            onWatched={() => handleMarkWatched(m)}
          />
        ))}
      </div>
    );
  }, [rows, loading, busyId, filter, error]);

  return (
    <div className="flex bg-black min-h-screen">
      <Sidebar />
      <div className="flex-1 min-h-screen pl-0 md:pl-16 pt-[56px]">
        <Header />
        <main className="max-w-6xl mx-auto px-2 sm:px-4 pt-7 pb-20">
          {/* Section Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="bg-orange-500/20 text-orange-400 rounded-full p-2">
                <Bookmark size={22} />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Your Watchlist
              </h1>
            </div>

            {/* Filter chips */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.03] p-1">
              <Chip label="Saved" active={filter === "saved"} onClick={() => setFilter("saved")} />
              <Chip label="Onboarding" active={filter === "onboarding"} onClick={() => setFilter("onboarding")} />
              <Chip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
            </div>
          </div>

          {content}
        </main>
      </div>
    </div>
  );
}

/* ----------------------------- UI pieces ----------------------------- */

function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-full text-sm font-semibold transition",
        active
          ? "bg-[linear-gradient(135deg,#fe9245,#eb423b)] text-white"
          : "text-white/85 hover:text-white hover:bg-white/10"
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function Card({ movie, busy, onRemove, onWatched }) {
  const year = movie.release_date ? String(movie.release_date).slice(0, 4) : "";
  const added = movie.added_at ? relativeDays(movie.added_at) : null;

  return (
    <div className="relative group">
      {/* Actions */}
      <div className="absolute top-2 right-2 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition">
        <button
          className="bg-black/70 hover:bg-emerald-600/90 text-zinc-200 hover:text-white p-2 rounded-full shadow transition disabled:opacity-60"
          title="Mark as watched"
          onClick={onWatched}
          disabled={busy}
        >
          <Check size={18} />
        </button>
        <button
          className="bg-black/70 hover:bg-red-600/90 text-zinc-200 hover:text-white p-2 rounded-full shadow transition disabled:opacity-60"
          title="Remove from watchlist"
          onClick={onRemove}
          disabled={busy}
        >
          <Trash2 size={18} />
        </button>
      </div>

      <Link
        to={`/movie/${movie.id}`}
        className={`
          block overflow-hidden relative rounded-xl border border-zinc-900
          bg-[#16161a] shadow-md transition-all hover:shadow-lg hover:ring-2 hover:ring-orange-500/30 hover:scale-[1.03]
          focus:ring-2 focus:ring-orange-500/70
        `}
      >
        {/* Poster */}
        <img
          src={movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : "/placeholder-movie.png"}
          alt={movie.title}
          className="w-full h-[178px] sm:h-[220px] md:h-[188px] object-cover rounded-xl"
          loading="lazy"
        />

        {/* Footer overlay */}
        <div className="absolute bottom-0 left-0 w-full z-10 px-3 pb-2 pt-6 bg-gradient-to-t from-black/85 via-black/0 to-transparent">
          <div className="text-white font-bold text-sm line-clamp-2 drop-shadow">
            {movie.title}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-300 mt-1">
            {year && <span>{year}</span>}
            {movie.status === "onboarding" && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">onboarding</span>
            )}
            {added && <span className="text-zinc-400">• Added {added}</span>}
          </div>
        </div>

        {/* Busy veil */}
        {busy && <div className="absolute inset-0 bg-black/40 animate-pulse" />}
      </Link>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-zinc-900 bg-[#16161a]">
          <div className="h-[178px] sm:h-[220px] md:h-[188px] w-full animate-pulse bg-zinc-800/60 rounded-xl" />
          <div className="p-3">
            <div className="h-3 w-4/5 bg-zinc-800/60 rounded mb-2 animate-pulse" />
            <div className="h-3 w-2/5 bg-zinc-800/60 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onBrowse, filter, message }) {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] mt-10 text-center">
      <div className="p-3 rounded-full bg-white/5 border border-white/10 mb-4">
        <Inbox className="w-8 h-8 text-white/60" />
      </div>
      <div className="text-zinc-200 text-xl mb-1">
        {message || (filter === "onboarding" ? "No onboarding picks here." : "Your watchlist is empty.")}
      </div>
      <div className="text-zinc-500 mb-4">
        {filter === "onboarding" ? "Try switching to Saved or All." : "Add movies you want to see!"}
      </div>
      <button
        onClick={onBrowse}
        className="rounded-full bg-white/10 hover:bg-white/15 text-white/90 px-4 py-2 text-sm font-semibold border border-white/10"
      >
        Browse popular
      </button>
    </div>
  );
}

/* ----------------------------- Utils ----------------------------- */

function relativeDays(iso) {
  try {
    const d = new Date(iso);
    const ms = Date.now() - d.getTime();
    const days = Math.round(ms / 86400000);
    if (Math.abs(days) < 1) return "today";
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
    return rtf.format(-days, "day");
  } catch {
    return null;
  }
}