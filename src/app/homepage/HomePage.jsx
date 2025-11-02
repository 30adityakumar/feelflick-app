// src/app/homepage/HomePage.jsx
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/shared/lib/supabase/client";
import HeroSliderSection from "@/homepage/components/HeroSliderSection";
import CarouselRow from "@/homepage/components/CarouselRow";

const TMDB = {
  key: import.meta.env.VITE_TMDB_API_KEY,
  img: "https://image.tmdb.org/t/p",
};

export default function HomePage() {
  const [session, setSession] = useState(null);

  // rows
  const [trending, setTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [forYou, setForYou]   = useState([]);
  const [loading, setLoading] = useState(true);

  // 0) session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data?.subscription?.unsubscribe?.();
  }, []);

  // 1) fetch rows (full-bleed; TMDb + a tiny personalization)
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);

      // A. trending (TMDb)
      const t = await fetch(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB.key}`
      ).then(r => r.json()).catch(() => ({}));

      // B. top rated (TMDb)
      const tr = await fetch(
        `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB.key}`
      ).then(r => r.json()).catch(() => ({}));

      // C. “For you” — if user chose genres, pick popular by those
      let fy = [];
      try {
        const uid = session?.user?.id;
        if (uid) {
          const { data: prefs } = await supabase
            .from("user_preferences")
            .select("genre_id")
            .eq("user_id", uid);

          const chosen = (prefs || []).map(p => p.genre_id).slice(0, 3);
          if (chosen.length) {
            const prom = chosen.map(g =>
              fetch(
                `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB.key}&with_genres=${g}&sort_by=popularity.desc`
              ).then(r => r.json()).catch(() => ({}))
            );
            const lists = await Promise.all(prom);
            fy = lists.flatMap(x => x.results || []);
          }
        }
      } catch { /* ignore */ }

      if (!alive) return;

      // de-dupe & tidy each list
      const tidy = arr => (arr || [])
        .filter(m => m && (m.poster_path || m.backdrop_path))
        .slice(0, 20);

      setTrending(tidy(t.results));
      setTopRated(tidy(tr.results));
      setForYou(tidy(fy));
      setLoading(false);
    }

    load();
    return () => { alive = false; };
  }, [session]);

  // hero uses trending (fallback to top rated)
  const heroItems = useMemo(
    () => (trending.length ? trending : topRated).slice(0, 8),
    [trending, topRated]
  );

  return (
    <main
      className="
        w-full min-h-screen overflow-x-hidden
        bg-[radial-gradient(90%_120%_at_0%_0%,rgba(14,20,28,.55),transparent_40%),radial-gradient(70%_100%_at_100%_0%,rgba(0,209,255,.22),transparent_55%),#0b0e13]
        pt-0
      "
    >
      {/* Full-bleed hero sits directly under the global Header */}
      <HeroSliderSection items={heroItems} loading={loading} />

      {/* Content rows – edge-to-edge with gentle inner padding */}
      <section className="w-full space-y-10 pb-16">
        {forYou.length > 0 && (
          <CarouselRow
            title="Picked for you"
            items={forYou}
            tmdbBase={TMDB.img}
            loading={loading}
            pill="Personalized"
          />
        )}
        <CarouselRow
          title="Popular Now"
          items={trending}
          tmdbBase={TMDB.img}
          loading={loading}
        />
        <CarouselRow
          title="Top Rated"
          items={topRated}
          tmdbBase={TMDB.img}
          loading={loading}
        />
      </section>
    </main>
  );
}