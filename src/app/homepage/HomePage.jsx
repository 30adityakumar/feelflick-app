// src/app/homepage/HomePage.jsx
import HeroSliderSection from "./components/HeroSliderSection";
import CarouselRow from "./components/CarouselRow";

export default function HomePage() {
  return (
    <div className="relative w-full bg-black text-white min-h-screen">
      {/* Hero Section */}
      <HeroSliderSection />

      {/* Content Rows - Tighter spacing */}
      <div className="relative z-30 space-y-6 md:space-y-8 pb-20 md:pb-8">
        <CarouselRow title="Trending Now" tmdbCategory="popular" rowId="trending" />
        <CarouselRow title="Top Rated" tmdbCategory="top_rated" rowId="top-rated" />
        <CarouselRow title="Now Playing" tmdbCategory="now_playing" rowId="now-playing" />
        <CarouselRow title="Upcoming" tmdbCategory="upcoming" rowId="upcoming" />
      </div>
    </div>
  );
}
