// src/components/HomeCarousel.jsx
export default function HomeCarousel({ title, movies, emptyMessage }) {
  if (!movies || movies.length === 0) {
    return (
      <div style={{
        background: "#231d2d",
        color: "#fff",
        borderRadius: 12,
        margin: "16px 0",
        padding: "22px",
        fontWeight: 500,
        fontSize: 18,
      }}>
        <strong>{title}</strong>
        <div style={{ color: "#ccc", marginTop: 8 }}>{emptyMessage}</div>
      </div>
    );
  }
  return (
    <div style={{ margin: "38px 0" }}>
      <h2 style={{
        color: "#fff",
        fontWeight: 700,
        fontSize: 22,
        marginBottom: 8,
        letterSpacing: "-0.5px"
      }}>
        {title}
      </h2>
      <div style={{
        display: "flex",
        gap: "20px",
        overflowX: "auto",
        paddingBottom: 10,
        scrollbarWidth: "thin"
      }}>
        {movies.map((m) => (
          <div key={m.id || m.movie_id} style={{
            background: "#191622",
            borderRadius: 11,
            minWidth: 116,
            width: 116,
            padding: 7,
            boxShadow: "0 2px 10px #0004",
            textAlign: "center",
          }}>
            <img
              src={m.poster_path || m.poster || "https://dummyimage.com/92x138/232330/fff&text=No+Image"}
              alt={m.title}
              style={{
                width: 92,
                height: 138,
                objectFit: "cover",
                borderRadius: 6,
                background: "#18141c"
              }}
            />
            <div style={{
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              marginTop: 6,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
              {m.title || m.original_title}
            </div>
            {m.release_date &&
              <div style={{ color: "#fdaf41", fontSize: 11, marginTop: 2 }}>
                {typeof m.release_date === "string" ? m.release_date.slice(0, 4) : ""}
              </div>
            }
          </div>
        ))}
      </div>
    </div>
  );
}
