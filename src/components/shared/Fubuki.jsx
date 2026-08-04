import { useEffect, useMemo, useState } from 'react'

const COUNT = 56

/* Two nested elements per slip: the outer carries X, the inner carries Y
   and spin. One transform cannot arc, because X wants to decelerate
   (air resistance) while Y rises and falls on its own curve. */
function make() {
  return Array.from({ length: COUNT }, () => {
    const slip = Math.random() > 0.28
    return {
      /* Biased right, so it reads as wind rather than an explosion. */
      x: (Math.random() - 0.42) * 128,
      rise: 46 + Math.random() * 40,
      rot: (Math.random() - 0.5) * 1200,
      d: 2300 + Math.random() * 1400,
      delay: Math.random() * 240,
      w: slip ? 3 + Math.random() * 3 : 7 + Math.random() * 5,
      h: slip ? 13 + Math.random() * 14 : 7 + Math.random() * 5,
      o: 0.45 + Math.random() * 0.55,
    }
  })
}

export default function Fubuki({ fire, onDone }) {
  const [live, setLive] = useState(false)
  const bits = useMemo(() => (live ? make() : []), [live])

  useEffect(() => {
    if (!fire) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      onDone?.()
      return
    }
    setLive(true)
    const t = window.setTimeout(() => {
      setLive(false)
      onDone?.()
    }, 4000)
    return () => clearTimeout(t)
  }, [fire, onDone])

  if (!live) return null

  return (
    <div className="fbk-mizu" aria-hidden="true">
      {bits.map((b, i) => (
        <span
          key={i}
          className="fbk-bit-mizu"
          style={{
            '--x': `${b.x}vw`,
            '--rise': `${b.rise}vh`,
            '--rot': `${b.rot}deg`,
            '--d': `${b.d}ms`,
            '--delay': `${b.delay}ms`,
            '--w': `${b.w}px`,
            '--h': `${b.h}px`,
            '--o': b.o,
          }}
        >
          <i />
        </span>
      ))}
    </div>
  )
}
