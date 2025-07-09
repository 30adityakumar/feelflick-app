export default function MovieCard({ movie }) {
  return (
    <div style={{
      width: 120, minWidth: 120, cursor: "pointer",
      borderRadius: 13, overflow: "hidden", background: "#23212b",
      boxShadow: "0 2px 10px #0003", position: "relative",
      transition: "transform 0.17s", willChange: "transform"
    }}
      tabIndex={0}
      onMouseOver={e => e.currentTarget.style.transform = "scale(1.06)"}
      onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
    >
      <img
        src={movie.poster_path.startsWith("http") ? movie.poster_path : `https://image.tmdb.org/t/p/w342${movie.poster_path}`}
        alt={movie.title}
        style={{ width: "100%", height: 175, objectFit: "cover", display: "block" }}
      />
      <div style={{
        padding: "8px 10px 9px 10px",
        fontWeight: 600, fontSize: 14, color: "#fff", whiteSpace: "normal", textAlign: "center"
      }}>
        {movie.title}
      </div>
    </div>
  );
}
