export default function RecommendationsTab() {
  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        background: "#101015",
        padding: "0 3vw 40px 3vw", // Responsive side padding
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start"
      }}
    >
      <h2
        style={{
          fontSize: "clamp(1.5rem, 2vw, 2.2rem)",
          fontWeight: 900,
          margin: "48px 0 18px 0",
          color: "#fff",
          letterSpacing: "-1px",
          textAlign: "center"
        }}
      >
        🎯 Personalized Recommendations
      </h2>
      <p
        style={{
          color: "#ccc",
          fontSize: "clamp(1.02rem, 1.5vw, 1.15rem)",
          textAlign: "center",
          lineHeight: 1.55,
          maxWidth: 740
        }}
      >
        This will show you movies based on your watch history and mood (coming soon!)<br />
        For now, check your watched history or search for movies you love.
      </p>
    </div>
  )
}
