import { useState } from 'react';

export default function Search({ onResults }) {
  const [query, setQuery] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query) return;

    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&query=${encodeURIComponent(
        query
      )}`
    );
    const data = await res.json();
    onResults(data.results || []);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search movies…"
        className="border p-2 flex-1"
      />
      <button className="bg-blue-600 text-white px-4">Go</button>
    </form>
  );
}
