// src/app/pages/components/MovieGrid.jsx
export default function MovieGrid({ children, className = "" }) {
  return (
    <section
      className={`mt-6 grid gap-5 grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] ${className}`}
    >
      {children}
    </section>
  );
}
