import { useEffect, useRef } from 'react'

/* ── Star-field canvas ─────────────────────────── */
export function StarField({ count = 240 }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < count; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const r = Math.random() * 1.1 + 0.15
        const op = Math.random() * 0.55 + 0.08
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${op})`
        ctx.fill()
      }
    }

    function resize() {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      draw()
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [count])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
      }}
    />
  )
}

/* ── Subtle perspective grid ───────────────────── */
export function PerspectiveGrid() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)',
      }}
    />
  )
}

/* ── Radial spotlight behind the headline ──────── */
export function Spotlight() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background:
          'radial-gradient(ellipse 65% 55% at 50% 42%, rgba(255,255,255,0.055) 0%, transparent 70%)',
      }}
    />
  )
}

/* ── Ripple field 水 ───────────────────────────────
   Occupies the slot Mitsu gave its hand-landmark
   constellation. Concentric rings expanding from a
   still centre — the house glyph, rendered as motion. */
export function RippleField() {
  /* Static rings give the form; three animated rings give the motion. */
  const STILL = [10, 17, 25, 34, 44]

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className="ripple-breath"
      style={{
        position: 'absolute', zIndex: 1, pointerEvents: 'none',
        right: '6%', top: '16%',
        width: 'clamp(180px, 22vw, 320px)',
        opacity: 0.5,
      }}
    >
      {STILL.map((r, i) => (
        <circle
          key={r}
          cx="50" cy="50" r={r}
          fill="none"
          stroke="rgba(56,189,248,0.42)"
          strokeWidth={1.1 - i * 0.16}
        />
      ))}

      <circle className="ripple-ring"    cx="50" cy="50" fill="none" stroke="rgba(125,211,252,0.85)" />
      <circle className="ripple-ring r2" cx="50" cy="50" fill="none" stroke="rgba(125,211,252,0.85)" />
      <circle className="ripple-ring r3" cx="50" cy="50" fill="none" stroke="rgba(125,211,252,0.85)" />

      <circle cx="50" cy="50" r="2.6" fill="rgba(226,232,240,0.85)" />
    </svg>
  )
}
