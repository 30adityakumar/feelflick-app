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
      {/* HERO — full width, no top/side padding */}
      <HeroSliderSection className="full-bleed" />

      {/* CONTENT ROWS (edge-to-edge rails with a safe inner gutter) */}
      <section className="full-bleed py-6 md:py-8">
        <div className="mx-auto w-full max-w-[1680px] px-4 md:px-8">
          <CarouselRow
            title="Picked for you"
            subtitle="Personalized"
            tmdbCategory="popular"
            rowId="picked"
          />
          <CarouselRow
            title="Top Rated"
            tmdbCategory="top_rated"
            rowId="top"
          />
          <CarouselRow
            title="Trending Now"
            tmdbCategory="now_playing"
            rowId="trending"
          />
        </div>
      </section>
    </main>
  );
}