// src/app/homepage/HomePage.jsx
import HeroSliderSection from "./components/HeroSliderSection";
import CarouselRow from "./components/CarouselRow";

export default function HomePage() {
  return (
    /* main is the first sibling after <header>, give it the no-gap */
    <main className="no-header-gap m-0 p-0">
      {/* Hero: full-bleed */}
      <HeroSliderSection />

      {/* Rows: keep page edges tight, but use a subtle inner gutter */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <CarouselRow title="Picked for you" queryKey="picked_for_you" />
        <div className="h-6" />
        <CarouselRow title="Popular Now" queryKey="popular_now" />
        <div className="h-6" />
        <CarouselRow title="Top Rated" queryKey="top_rated" />
      </section>
    </main>
  );
}