// src/app/homepage/HomePage.jsx
import { useEffect, useState } from "react";
import HeroSliderSection from "./components/HeroSliderSection";
import CarouselRow from "./components/CarouselRow";
import { supabase } from "@/shared/lib/supabase/client";

export default function HomePage() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub?.subscription?.unsubscribe();
  }, []);

  return (
    <main className="w-full bg-[#121215]">
      {/* HERO — stick to header (no top spacing), full-bleed */}
      <HeroSliderSection className="full-bleed stick-to-header" />

      {/* CONTENT ROWS (edge-to-edge rails with a safe inner gutter) */}
      <section className="full-bleed py-5 md:py-7">
        <div className="mx-auto w-full max-w-[1680px] px-3 sm:px-4 md:px-8">
          <CarouselRow
            title="Picked for you"
            subtitle="Personalized"
            tmdbCategory="popular"
            rowId="picked"
          />
          <CarouselRow title="Top Rated" tmdbCategory="top_rated" rowId="top" />
          <CarouselRow title="Trending Now" tmdbCategory="now_playing" rowId="trending" />
        </div>
      </section>
    </main>
  );
}