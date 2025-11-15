// src/app/homepage/HomePage.jsx
import HeroSliderSection from "./components/HeroSliderSection";
import CarouselRow from "./components/CarouselRow";

export default function HomePage() {
  return (
    <div className="relative w-full bg-black text-white">
      {/* Add top padding to account for fixed header */}
      <div className="pt-[var(--hdr-h,64px)]">
        {/* Hero Section */}
        <HeroSliderSection />

        {/* Content Rows */}
        <div className="relative -mt-8 sm:-mt-12 md:-mt-16 lg:-mt-20 z-30 space-y-8 sm:space-y-10 md:space-y-12 lg:space-y-14 pb-16 sm:pb-20 md:pb-24 mb-16 md:mb-0">
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
