// components/BackToTopFAB.jsx
import { useEffect, useState } from "react"
export default function BackToTopFAB() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 320)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  if (!show) return null
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      style={{
        position: "fixed", right: 26, bottom: 40, zIndex: 100,
        background: "linear-gradient(95deg,#fe9245 40%,#eb423b 100%)",
        color: "#fff",
        border: "none",
        borderRadius: 18,
        boxShadow: "0 4px 16px #0005",
        fontSize: 21,
        fontWeight: 900,
        padding: "10px 18px",
        cursor: "pointer",
        opacity: 0.88,
        transition: "opacity 0.15s"
      }}
      aria-label="Scroll to top"
      title="Back to top"
    >↑</button>
  )
}
