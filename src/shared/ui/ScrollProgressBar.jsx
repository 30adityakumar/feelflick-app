// components/ScrollProgressBar.jsx
import { useEffect, useState } from "react"
export default function ScrollProgressBar() {
  const [scroll, setScroll] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      const percent = h.scrollTop / (h.scrollHeight - h.clientHeight)
      setScroll(percent)
    }
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, height: 5, width: "100vw",
      background: "transparent",
      zIndex: 99,
      pointerEvents: "none"
    }}>
      <div style={{
        width: `${Math.min(scroll * 100, 100)}%`,
        height: "100%",
        background: "linear-gradient(90deg,#fe9245 5%,#eb423b 95%)",
        borderRadius: 9,
        transition: "width 0.18s cubic-bezier(.4,.89,.51,.99)"
      }} />
    </div>
  )
}
