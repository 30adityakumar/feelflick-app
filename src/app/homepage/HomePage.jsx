// Enhanced HomePage.jsx
import { Suspense, lazy } from "react";

// Lazy load components for better performance
const HeroSliderSection = lazy(() => import("@/app/homepage/components/HeroSliderSection"));
const CarouselRow = lazy(() => import("@/app/homepage/components/CarouselRow"));

// Loading component inspired by Netflix
const SkeletonLoader = ({ height = "h-64" }) => (
  <div className={`${height} bg-zinc-900 animate-pulse rounded-lg mb-6`}>
    <div className="w-full h-full bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 
                    bg-[length:200%_100%] animate-gradient"></div>
  </div>
);

const CarouselSkeleton = () => (
  <div className="mt-6 sm:mt-8 md:mt-12">
    <div className="px-4 sm:px-6 lg:px-8 mb-4">
      <div className="h-6 sm:h-8 bg-zinc-800 rounded w-32 animate-pulse"></div>
    </div>
    <div className="flex gap-2 sm:gap-3 md:gap-4 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {Array(6).fill(null).map((_, i) => (
        <div key={i} className="w-[30vw] min-w-[120px] max-w-[160px] aspect-[2/3] 
                               bg-zinc-800 rounded-lg animate-pulse flex-shrink-0">
        </div>
      ))}
    </div>
  </div>
);

export default function HomePage() {
  return (
    <div className="w-full min-h-screen bg-zinc-950 overflow-x-hidden">
      {/* Hero Section */}
      <Suspense fallback={<SkeletonLoader height="h-[400px] sm:h-[500px] lg:h-[600px]" />}>
        <HeroSliderSection />
      </Suspense>

      {/* Main Content Container */}
      <main className="relative z-10">
        <div className="max-w-full 2xl:max-w-[1400px] mx-auto">
          
          {/* Content Rows with improved spacing */}
          <div className="space-y-6 sm:space-y-8 md:space-y-12 pb-16 sm:pb-20 md:pb-24">
            
            <Suspense fallback={<CarouselSkeleton />}>
              <CarouselRow 
                title="Trending Now" 
                endpoint="popular" 
              />
            </Suspense>
            
            <Suspense fallback={<CarouselSkeleton />}>
              <CarouselRow 
                title="Top Rated" 
                endpoint="top_rated" 
              />
            </Suspense>
            
            <Suspense fallback={<CarouselSkeleton />}>
              <CarouselRow 
                title="Now Playing" 
                endpoint="now_playing" 
              />
            </Suspense>
            
            <Suspense fallback={<CarouselSkeleton />}>
              <CarouselRow 
                title="Upcoming" 
                endpoint="upcoming" 
              />
            </Suspense>
          </div>
        </div>
      </main>

      {/* Add styles for smooth gradient animation */}
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 2s ease infinite;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
