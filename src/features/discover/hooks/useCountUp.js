import { useState, useEffect } from 'react'

export function useCountUp(target, duration=1400, delay=200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, start;
    const t0 = setTimeout(() => {
      const tick = (now) => { if (!start) start = now; const elapsed = now - start; const p = Math.min(elapsed / duration, 1); const eased = 1 - Math.pow(1 - p, 3); setV(Math.round(target * eased)); if (p < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(t0); if (raf) cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return v;
}
