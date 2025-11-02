// src/app/homepage/HomePage.jsx
import { Fragment } from "react";
import HeroSliderSection from "./components/HeroSliderSection";
import CarouselRow from "./components/CarouselRow";

export default function HomePage() {
  return (
    <Fragment>
      {/* Hero: full-bleed + overlap header by 1px to remove the seam */}
      <section className="full-bleed stick-to-header">
        <HeroSliderSection />
      </section>

      {/* Rows: also full-bleed for a clean, streaming-app feel */}
      <section className="full-bleed">
        <CarouselRow title="Picked for you" queryKey="picked_for_you" />
      </section>

      <section className="full-bleed">
        <CarouselRow title="Top Rated" queryKey="top_rated" />
      </section>

      <section className="full-bleed">
        <CarouselRow title="Trending Now" queryKey="trending" />
      </section>
    </Fragment>
  );
}