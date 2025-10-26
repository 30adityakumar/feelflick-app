// src/app/header/components/SearchBar.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search as SearchIcon } from "lucide-react";

export default function SearchBar({ open, onClose }) {
  const nav = useNavigate();
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState(-1);
  const inputRef = useRef(null);

  // Focus when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      setQ("");
      setResults([]);
      setSel(-1);
      setLoading(false);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Debounced search
  const debouncedQ = useDebounce(q, 250);

  useEffect(() => {
    let abort = false;
    async function run() {
      if (!open) return;
      if (!TMDB_KEY || !debouncedQ || debouncedQ.trim().length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const r = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(
            debouncedQ
          )}`
        );
        const j = await r.json();
        if (!abort) {
          const list = (j?.results || []).slice(0, 12);
          setResults(list);
        }
      } catch {
        if (!abort) setResults([]);
      } finally {
        if (!abort) setLoading(false);
      }
    }
    run();
    return () => { abort = true; };
  }, [debouncedQ, TMDB_KEY, open]);

  function goToMovie(m) {
    onClose?.();
    nav(`/movie/${m.id}`);
  }

  // Keyboard nav for list
  function onListKey(e) {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => (s + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => (s - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const m = results[Math.max(0, sel)];
      if (m) goToMovie(m);
    }
  }

  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-[60] grid place-items-start bg-black/60 px-3 pt-8
        md:place-items-center md:px-6
      "
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-[720px] rounded-2xl border border-white/10 bg-neutral-950/85 backdrop-blur-md shadow-2xl">
        {/* Input row */}
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5 md:px-4">
          <SearchIcon className="h-5 w-5 text-white/70" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onListKey}
            placeholder="Search movies…"
            className="flex-1 bg-transparent text-[15px] text-white placeholder-white/50 focus:outline-none"
            aria-label="Search movies"
          />
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/5 text-white/80 hover:bg-white/10 focus:outline-none"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto px-2 py-2 md:px-3 md:py-3">
          {!q && (
            <p className="px-2 py-6 text-center text-sm text-white/65">
              Type at least 2 characters to search.
            </p>
          )}
          {q && loading && (
            <p className="px-2 py-6 text-center text-sm text-white/65">Searching…</p>
          )}
          {q && !loading && results.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-white/65">No results.</p>
          )}
          {results.map((m, i) => (
            <button
              key={m.id}
              onClick={() => goToMovie(m)}
              onMouseEnter={() => setSel(i)}
              className={[
                "grid w-full grid-cols-[44px_1fr_auto] items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/5 focus:outline-none",
                sel === i ? "bg-white/10" : "",
              ].join(" ")}
            >
              <img
                src={
                  m.poster_path
                    ? `https://image.tmdb.org/t/p/w92${m.poster_path}`
                    : "https://dummyimage.com/44x66/0b0f18/ffffff&text=–"
                }
                alt=""
                className="h-16 w-11 rounded object-cover"
                loading="lazy"
              />
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold text-white">
                  {m.title}
                </div>
                <div className="mt-0.5 text-[12px] text-white/65">
                  {(m.release_date || "").slice(0, 4)} • ★ {m.vote_average?.toFixed?.(1) ?? "–"}
                </div>
              </div>
              <div className="text-[12px] text-white/55">Open</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- hook: debounce --------------------------- */
function useDebounce(value, delay) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}