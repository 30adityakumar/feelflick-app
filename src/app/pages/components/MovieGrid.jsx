// src/app/pages/components/MovieGrid.jsx
export default function MovieGrid({ children }) {
  return (
    <section
      className="
        mt-6 grid gap-4 sm:gap-5
        grid-cols-[repeat(auto-fill,minmax(160px,1fr))]
        md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]
      "
    >
      {children}
    </section>
  );
}
