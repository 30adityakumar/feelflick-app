// TrendingToday.jsx
const trending = [
  { title: "Thunderbolts*", date: "02 May 2025", img: "/posters/thunderbolts.jpg", score: 74 },
  { title: "Squid Game", date: "17 Sep 2021", img: "/posters/squid-game.jpg", score: 79 },
  { title: "Revenged Love", date: "16 Jun 2025", img: "/posters/revenged-love.jpg", score: 69 },
  { title: "F1 The Movie", date: "27 Jun 2025", img: "/posters/f1-movie.jpg", score: 76 },
  { title: "Jurassic World Rebirth", date: "02 Jul 2025", img: "/posters/jurassic.jpg", score: 75 },
  { title: "Sinners", date: "18 Apr 2025", img: "/posters/sinners.jpg", score: 76 },
  { title: "Flourished Peony", date: "07 Jan 2025", img: "/posters/peony.jpg", score: 74 },
]
export default function TrendingToday() {
  return (
    <section style={{
      maxWidth: 1160, margin: "35px auto 0 auto", padding: "0 18px"
    }}>
      <div style={{
        fontWeight: 800, fontSize: "1.4rem", color: "#fff",
        marginBottom: 14, letterSpacing: "-0.4px"
      }}>Trending Today</div>
      <div style={{
        display: "flex", gap: 18, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "thin"
      }}>
        {trending.map((m, i) => (
          <div key={i} style={{
            flex: "0 0 135px", display: "flex", flexDirection: "column",
            alignItems: "center", borderRadius: 16,
            background: "#232745", boxShadow: "0 2px 12px #0005",
            padding: "0 0 14px 0", marginBottom: 5
          }}>
            <img src={m.img} alt={m.title} style={{
              width: 135, height: 196, objectFit: "cover",
              borderRadius: 15, marginBottom: 6, boxShadow: "0 2px 12px #0009"
            }} />
            <div style={{
              fontWeight: 800, color: "#fff", fontSize: "1.01rem", textAlign: "center", marginBottom: 2
            }}>{m.title}</div>
            <div style={{
              color: "#d5d6e5", fontSize: 13, textAlign: "center"
            }}>{m.date}</div>
            <div style={{
              background: "#eb423b", color: "#fff", borderRadius: "50%",
              fontWeight: 800, width: 33, height: 33,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, marginTop: 7, boxShadow: "0 1.5px 8px #eb423b3d"
            }}>{m.score}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
