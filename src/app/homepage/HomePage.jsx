// src/app/homepage/HomePage.jsx
import HeroSliderSection from "./components/HeroSliderSection";
import CarouselRow from "./components/CarouselRow";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Hero Section */}
      <HeroSliderSection />

      {/* Content Rows - Overlapping hero */}
      <div className="relative -mt-20 sm:-mt-24 md:-mt-32 lg:-mt-40 xl:-mt-48 z-30">
        <div className="space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 pb-12 sm:pb-16 md:pb-20 lg:pb-24">
          <CarouselRow 
            title="Trending Now" 
            tmdbCategory="popular" 
            rowId="trending" 
          />
          
          <CarouselRow 
            title="Top Rated" 
            tmdbCategory="top_rated" 
            rowId="top-rated" 
          />
          
          <CarouselRow 
            title="Now Playing" 
            tmdbCategory="now_playing" 
            rowId="now-playing" 
          />
          
          <CarouselRow 
            title="Upcoming" 
            tmdbCategory="upcoming" 
            rowId="upcoming" 
          />
        </div>
      </div>
    </div>
  );
}
