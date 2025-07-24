import { useState, useEffect } from "react";
import CarouselRow from "@/app/homepage/components/CarouselRow";
import { supabase } from "@/shared/lib/supabase/client";

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

const FEATURED_MOVIE = {
  title: "Oppenheimer",
  overview: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
  backdrop_path: "/q8U8wF4Y6WzTGSpfOdG2hyO6wCv.jpg",
};

export default function HomePage({ userName, userId }) {
  const [recommended, setRecommended] = useState([]);
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    // Fetch "Popular Now" from TMDb
    fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=en-US&page=1`)
      .then(r => r.json())
      .then(data => {
        setPopular((data.results || []).slice(0, 12));
      });

    // Fetch recommended for this user from Supabase (user's genres)
    async function fetchRecommended() {
      if (!userId) return;
      const { data: genres } = await supabase
        .from("user_preferences")
        .select("genre_id")
        .eq("user_id", userId);
      if (!genres || genres.length === 0) return;

      const genreString = genres.map(g => g.genre_id).join(",");
      fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&language=en-US&with_genres=${genreString}&sort_by=popularity.desc`)
        .then(r => r.json())
        .then(data => {
          setRecommended((data.results || []).slice(0, 12));
        });
    }
    fetchRecommended();
  }, [userId]);

  return (
    <div className="min-h-screen bg-[#191820] text-white pb-10">
      {/* Hero Section */}
      <div
        className="
          w-full h-[420px] relative mb-8 flex items-end
          rounded-b-[36px] shadow-[0_5px_30px_#0007]
          overflow-hidden
        "
        style={{
          background: `linear-gradient(to right, #18151ce9 60%, #18151c44 100%), url(https://image.tmdb.org/t/p/original${FEATURED_MOVIE.backdrop_path}) center/cover no-repeat`
        }}
      >
        <div
          className="
            px-10 py-11 md:px-14 md:py-11 max-w-[540px]
            bg-gradient-to-r from-[#18151cf7] via-[#18151cf7] to-[#18151c99]
            rounded-b-[36px] md:rounded-br-[36px] md:rounded-bl-none
          "
        >
          <div className="text-[30px] font-extrabold mb-2">{FEATURED_MOVIE.title}</div>
          <div className="text-[17px] opacity-94 mb-5">{FEATURED_MOVIE.overview}</div>
          <button
            className="
              py-3 px-9 bg-gradient-to-r from-orange-400 to-red-500
              border-none text-white font-bold text-[18px] rounded-lg
              shadow transition hover:scale-105 active:scale-100
            "
          >
            Watch now
          </button>
        </div>
      </div>
      {/* Movie Rows */}
      <CarouselRow title="Recommended for you" movies={recommended} />
      <CarouselRow title="Popular Now" movies={popular} />
    </div>
  );
}
