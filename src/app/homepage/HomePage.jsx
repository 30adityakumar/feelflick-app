// src/app/homepage/HomePage.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/shared/lib/supabase/client";
import HeroSliderSection from "./components/HeroSliderSection";
import CarouselRow from "./components/CarouselRow";

const TMDB = {
  key: import.meta.env.VITE_TMDB_API_KEY,
  img: "https://image.tmdb.org/t/p",
};

export default function HomePage() {
  const [session, setSession] = useState(null);

  // rows
  const [trending, setTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [forYou, setForYou] = useState([]);
  const [loading, setLoading] = useState(true);

  // session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data?.subscription?.unsubscribe?.();
  }, []);

  // fetch rows
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);

      const t = await fetch(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB.key}`
      ).then(r => r.json()).catch(() => ({}));

      const tr = await fetch(
        `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB.key}`
      ).then(r => r.json()).catch(() => ({}));

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
            const lists = await Promise.all(
              chosen.map(g =>
                fetch(
                  `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB.key}&with_genres=${g}&sort_by=popularity.desc`
                ).then(r => r.json()).catch(() => ({}))
              )
            );
            fy = lists.flatMap(x => x.results || []);
          }
        }
      } catch { /* ignore */ }

      if (!alive) return;

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
      <HeroSliderSection items={heroItems} loading={loading} />

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