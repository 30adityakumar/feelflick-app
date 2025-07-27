export function Pagination({ page, totalPages, setPage }) {
  const pageWindow = 2; // how many pages to show around current page
  const pages = [];

  // Always show 1, ..., current-1, current, current+1, ..., last
  let start = Math.max(1, page - pageWindow);
  let end = Math.min(totalPages, page + pageWindow);

  if (start > 1) pages.push(1);
  if (start > 2) pages.push("...");

  for (let i = start; i <= end; ++i) pages.push(i);

  if (end < totalPages - 1) pages.push("...");
  if (end < totalPages) pages.push(totalPages);

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", margin: "18px 0 35px 0" }}>
      {page > 1 && (
        <button
          onClick={() => setPage(page - 1)}
          className="px-3 py-2 rounded bg-zinc-900 text-orange-400 font-bold hover:bg-orange-900 transition"
        >
          ‹
        </button>
      )}
      {pages.map((p, idx) =>
        typeof p === "number" ? (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`px-3 py-2 rounded font-bold ${p === page ? "bg-orange-400 text-white" : "bg-zinc-900 text-orange-300 hover:bg-orange-800"}`}
            style={p === page ? { boxShadow: "0 2px 10px #ff990055" } : {}}
          >
            {p}
          </button>
        ) : (
          <span key={"dots" + idx} className="text-xl px-3">…</span>
        )
      )}
      {page < totalPages && (
        <button
          onClick={() => setPage(page + 1)}
          className="px-3 py-2 rounded bg-zinc-900 text-orange-400 font-bold hover:bg-orange-900 transition"
        >
          ›
        </button>
      )}
    </div>
  );
}
