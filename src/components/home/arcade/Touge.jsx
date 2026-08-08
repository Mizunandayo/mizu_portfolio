import { useCallback, useEffect, useRef, useState } from 'react'

/* ══════════════════════════════════════════════════ 峠 — the downhill run, from behind the car. */

const W = 460
const H = 300

/* World units. */
const SEG = 200
const TO_M = 40
const DRAW = 110 // segments drawn ahead
const TRACK = 1600 // segments generated before the road repeats

const CAM_H = 1100
const CAM_D = 0.84 // 1 / tan(fov/2)

const ROAD_W = 2100 // half-width at the drop-in
const ROAD_TIGHT = 1250 // and at its narrowest
const NARROW_OVER = 7000 * TO_M

const SPEED = 200 * TO_M
const TOP = 430 * TO_M
const RAMP = 18000 * TO_M
const NITRO_ADD = 190 * TO_M

const STEER = 2400 // world units per second, sideways
const CENTRIF = 0.00028 // how hard a corner throws the car out
const CENTRIF_CAP = STEER * 0.62

/* Double-tap a direction to flick across. */
const TAP_WINDOW = 400
const DASH_FOR = 150
const DASH_SPEED = 6240
const DASH_COOL = 520

const CAR_W = 380 // half-width in world units, for collisions
const CONE_EVERY = 34 // segments

const BURN = 0.55
const REFILL = 0.16
const MIN_TO_START = 0.2

/* One long road, generated once and driven round. */
function makeTrack() {
  const segs = []
  let curve = 0
  for (let i = 0; i < TRACK; i++) {
    /* Curvature wanders, so a corner has an entry and an exit. */
    if (i % 40 === 0) curve = (Math.random() - 0.5) * 5.2
    const c = curve * (0.5 + 0.5 * Math.sin((i % 40) / 40 * Math.PI))
    segs.push({
      curve: c,
      /* Never dead centre and never against the barrier. */
      cone: i > 40 && i % CONE_EVERY === 0
        ? (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.42)
        : null,
    })
  }
  return segs
}

export default function Touge({ onScore, onState }) {
  const ref = useRef(null)
  const sim = useRef(null)
  const raf = useRef(0)
  const keys = useRef({ left: false, right: false, boost: false })
  const [hud, setHud] = useState({ dist: 0, fuel: 1, boosting: false, kph: 90 })
  const phaseRef = useRef('ready')

  /* The shell owns the phase now; this component only needs to know it for its own guards. */
  const setPhaseBoth = (p) => {
    phaseRef.current = p
    onState?.(p)
  }

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current)
    raf.current = 0
  }, [])

  const loop = useCallback(() => {
    const s = sim.current
    const c = ref.current
    if (!s || !c) return

    const now = performance.now()
    const dt = Math.min((now - s.last) / 1000, 0.05)
    s.last = now

    const wants = keys.current.boost && s.fuel > 0
    if (wants && (s.boosting || s.fuel > MIN_TO_START)) {
      s.boosting = true
      s.fuel = Math.max(0, s.fuel - BURN * dt)
      if (s.fuel === 0) s.boosting = false
    } else {
      s.boosting = false
      s.fuel = Math.min(1, s.fuel + REFILL * dt)
    }

    const ramp = Math.min(1, s.pos / RAMP)
    const base = SPEED + (TOP - SPEED) * ramp
    const speed = base + (s.boosting ? NITRO_ADD : 0)
    s.pos += speed * dt

    const roadW = Math.max(
      ROAD_TIGHT,
      ROAD_W - (s.pos / NARROW_OVER) * (ROAD_W - ROAD_TIGHT)
    )

    const baseIdx = Math.floor(s.pos / SEG) % TRACK
    const here = s.track[baseIdx]

    if (keys.current.left) s.x -= STEER * dt
    if (keys.current.right) s.x += STEER * dt
    if (now < s.dashUntil) s.x += s.dashDir * DASH_SPEED * dt

    /* Thrown outward through a corner, harder the faster you are going. */
    const push = Math.min(
      Math.abs(here.curve) * speed * CENTRIF,
      CENTRIF_CAP
    ) * Math.sign(here.curve)
    s.x -= push * dt

    s.x = Math.max(-roadW * 2.2, Math.min(roadW * 2.2, s.x))

    const offRoad = Math.abs(s.x) > roadW
    let hitCone = false
    for (let n = 0; n < 3; n++) {
      const seg = s.track[(baseIdx + n) % TRACK]
      if (seg.cone == null) continue
      const segZ = (Math.floor(s.pos / SEG) + n) * SEG
      if (Math.abs(segZ - s.pos) > SEG) continue
      if (Math.abs(seg.cone * roadW - s.x) < CAR_W + 160) hitCone = true
    }
    const crashed = offRoad || hitCone

    const g = c.getContext('2d')

    /* Sky, then the hills, then the road. */
    const horizon = H * 0.42
    const sky = g.createLinearGradient(0, 0, 0, horizon)
    sky.addColorStop(0, '#0b0c12')
    sky.addColorStop(1, '#1b1f2e')
    g.fillStyle = sky
    g.fillRect(0, 0, W, horizon)

    /* The ridge drifts with the road, the only cue the world is turning. */
    g.fillStyle = '#0a0b10'
    g.beginPath()
    g.moveTo(0, horizon)
    for (let i = 0; i <= 10; i++) {
      const rx = (i / 10) * W
      const ry = horizon - 24 - Math.sin(i * 1.7 + s.pos / 9000) * 14
      g.lineTo(rx, ry)
    }
    g.lineTo(W, horizon)
    g.closePath()
    g.fill()

    g.fillStyle = '#07070a'
    g.fillRect(0, horizon, W, H - horizon)

    /* Project every segment first, then draw the ribbon in one path. */
    const camZ = s.pos
    const pts = []
    let x = 0
    let dx = 0

    for (let n = 0; n < DRAW; n++) {
      const idx = (baseIdx + n) % TRACK
      const seg = s.track[idx]
      const segZ = (Math.floor(s.pos / SEG) + n) * SEG

      const dz = Math.max(segZ - camZ, 1)
      const scale = CAM_D / dz
      pts.push({
        x: W / 2 + scale * (x - s.x) * (W / 2),
        y: horizon + scale * CAM_H * (H / 2),
        w: scale * roadW * (W / 2),
        light: Math.floor(segZ / SEG) % 2 === 0,
        curveX: x,
        scale,
        seg,
        segZ,
      })

      x += dx
      dx += seg.curve
    }

    /* Grass: one fill to the horizon rather than a band per segment. */
    g.fillStyle = '#0c1210'
    g.fillRect(0, horizon, W, H - horizon)

    const ribbon = (spread, fill) => {
      g.fillStyle = fill
      g.beginPath()
      g.moveTo(pts[0].x - pts[0].w * spread, pts[0].y)
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x - pts[i].w * spread, pts[i].y)
      for (let i = pts.length - 1; i >= 0; i--) g.lineTo(pts[i].x + pts[i].w * spread, pts[i].y)
      g.closePath()
      g.fill()
    }

    /* Verge, then tarmac. */
    ribbon(1.2, '#101418')
    ribbon(1, '#15151b')

    /* Rumble strips: these do alternate, and they are the motion cue now that the tarmac is flat. */
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]
      const b = pts[i + 1]
      if (b.y >= a.y) continue
      const col = a.light ? '#d8d8e0' : '#93202a'
      for (const side of [-1, 1]) {
        g.fillStyle = col
        g.beginPath()
        g.moveTo(a.x + side * a.w, a.y + 1)
        g.lineTo(b.x + side * b.w, b.y)
        g.lineTo(b.x + side * b.w * 1.2, b.y)
        g.lineTo(a.x + side * a.w * 1.2, a.y + 1)
        g.closePath()
        g.fill()
      }

      /* Centre dashes, every fourth pair so they read as dashes rather than a solid stripe. */
      if (i % 4 === 0) {
        g.fillStyle = 'rgba(250,250,250,0.34)'
        g.beginPath()
        g.moveTo(a.x - a.w * 0.022, a.y + 1)
        g.lineTo(b.x - b.w * 0.022, b.y)
        g.lineTo(b.x + b.w * 0.022, b.y)
        g.lineTo(a.x + a.w * 0.022, a.y + 1)
        g.closePath()
        g.fill()
      }
    }

    /* Cones, back to front so a near one covers a far one. */
    for (let i = pts.length - 1; i >= 0; i--) {
      const pt = pts[i]
      if (pt.seg.cone == null || pt.scale <= 0) continue

      const px = W / 2 + pt.scale * (pt.curveX + pt.seg.cone * roadW - s.x) * (W / 2)
      const py = pt.y
      const size = Math.max(2, pt.scale * 900 * (W / 2))
      if (py < horizon || py > H) continue

      g.fillStyle = 'rgba(0,0,0,0.45)'
      g.beginPath()
      g.ellipse(px, py, size * 0.62, size * 0.2, 0, 0, Math.PI * 2)
      g.fill()

      g.fillStyle = '#ff8f4d'
      g.beginPath()
      g.moveTo(px, py - size)
      g.lineTo(px - size * 0.55, py)
      g.lineTo(px + size * 0.55, py)
      g.closePath()
      g.fill()
      if (size > 5) {
        g.fillStyle = 'rgba(255,255,255,0.9)'
        g.fillRect(px - size * 0.3, py - size * 0.5, size * 0.6, size * 0.15)
      }
    }

    /* Speed streaks down both edges while boosting. */
    if (s.boosting) {
      g.strokeStyle = 'rgba(150,200,255,0.45)'
      g.lineWidth = 2
      for (let i = 0; i < 8; i++) {
        const ly = horizon + ((now / 1.6 + i * 40) % (H - horizon))
        g.beginPath()
        g.moveTo(10, ly)
        g.lineTo(10, ly + 22)
        g.moveTo(W - 10, ly)
        g.lineTo(W - 10, ly + 22)
        g.stroke()
      }
    }

    /* The car. */
    const lean = (keys.current.left ? -1 : 0) + (keys.current.right ? 1 : 0)
    drawCar(g, W / 2, H - 30, crashed, s.boosting, lean)

    drawNitro(g, s.fuel, s.boosting, now < s.dashUntil, now >= s.dashReady)

    setHud({
      dist: Math.round(s.pos / TO_M),
      fuel: s.fuel,
      boosting: s.boosting,
      kph: Math.round((speed / TO_M) * 0.45),
    })

    if (crashed) {
      stop()
      setPhaseBoth('done')
      onScore?.(Math.round(s.pos / TO_M))
      return
    }
    raf.current = requestAnimationFrame(loop)
  }, [onScore, stop])

  const fresh = useCallback(() => ({
      track: makeTrack(),
      pos: 0,
      x: 0,
      last: performance.now(),
      fuel: 1,
      boosting: false,
      dashUntil: 0,
      dashDir: 0,
      dashReady: 0,
      tapL: 0,
      tapR: 0,
  }), [])

  const begin = useCallback(() => {
    sim.current = fresh()
    setHud({ dist: 0, fuel: 1, boosting: false, kph: Math.round((SPEED / TO_M) * 0.45) })
    setPhaseBoth('run')
    stop()
    raf.current = requestAnimationFrame(loop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fresh, loop, stop])

  /* One frame with the clock stopped: dt is zero, nothing moves. */
  useEffect(() => {
    sim.current = fresh()
    loop()
    stop()
  }, [fresh, loop, stop])

  useEffect(() => () => stop(), [stop])

  /* Held keys repeat keydown, so only a genuine press counts as a tap. */
  const tapped = (dir) => {
    const s = sim.current
    if (!s) return
    const now = performance.now()
    const last = dir < 0 ? s.tapL : s.tapR
    if (now - last < TAP_WINDOW && now > s.dashReady) {
      s.dashUntil = now + DASH_FOR
      s.dashDir = dir
      s.dashReady = now + DASH_COOL
    }
    if (dir < 0) s.tapL = now
    else s.tapR = now
  }

  const press = (e, down) => {
    const k = e.code
    if (k === 'ArrowLeft' || k === 'KeyA') {
      if (down && !e.repeat) tapped(-1)
      keys.current.left = down
    } else if (k === 'ArrowRight' || k === 'KeyD') {
      if (down && !e.repeat) tapped(1)
      keys.current.right = down
    }
    else if (k === 'ShiftLeft' || k === 'ShiftRight') keys.current.boost = down
    else if (down && (k === 'Space' || k === 'Enter')) {
      if (phaseRef.current !== 'run') begin()
    } else return
    e.preventDefault()
    e.stopPropagation()
  }

  const touch = (e, down) => {
    if (!down) {
      keys.current.left = keys.current.right = keys.current.boost = false
      return
    }
    if (phaseRef.current !== 'run') return begin()
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.touches[0].clientX - r.left) / r.width
    keys.current.left = x < 0.35
    keys.current.right = x > 0.65
    keys.current.boost = x >= 0.35 && x <= 0.65
  }

  return (
    <div
      className="ar-touge-mizu"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => press(e, true)}
      onKeyUp={(e) => press(e, false)}
      onTouchStart={(e) => touch(e, true)}
      onTouchEnd={(e) => touch(e, false)}
      onClick={() => phaseRef.current !== 'run' && begin()}
      aria-label="Touge. Arrows to steer, shift for nitro."
    >
      <canvas ref={ref} width={W} height={H} className="ar-canvas-mizu" />

      <span className="ar-touge-dist-mizu">
        {hud.dist.toLocaleString()} m
        <i className={hud.boosting ? 'is-on' : ''}>{hud.kph} km/h</i>
      </span>

    </div>
  )
}

/* Seen from behind and slightly above, which is where the camera is. */
/* The nitro gauge, on the canvas rather than in DOM. */
function drawNitro(g, fuel, boosting, dashing, dashReady) {
  const x = 14
  const y = H - 26
  const w = 96
  const h = 9

  g.font = 'bold 8px ui-monospace, monospace'
  g.textAlign = 'left'
  g.fillStyle = boosting ? '#d6ebff' : 'rgba(210,210,220,0.85)'
  g.fillText('NITRO', x, y - 5)

  g.fillStyle = 'rgba(0,0,0,0.5)'
  g.fillRect(x - 2, y - 2, w + 4, h + 4)

  /* Segmented: you want roughly how many boosts are left, not a percent. */
  const seg = 8
  const sw = (w - (seg - 1) * 2) / seg
  for (let i = 0; i < seg; i++) {
    const lit = fuel >= (i + 1) / seg - 0.001
    const part = !lit && fuel > i / seg
    g.fillStyle = 'rgba(255,255,255,0.14)'
    g.fillRect(x + i * (sw + 2), y, sw, h)
    if (lit || part) {
      g.fillStyle = boosting ? '#d6ebff' : fuel < 0.25 ? '#ff9d6b' : '#9ecbff'
      const f = lit ? 1 : (fuel - i / seg) * seg
      g.fillRect(x + i * (sw + 2), y, sw * f, h)
    }
  }

  /* Beside the gauge, because both are things you spend. */
  const dx = x + w + 14
  g.fillStyle = dashing ? '#fff' : dashReady ? 'rgba(210,210,220,0.85)' : 'rgba(140,140,150,0.5)'
  g.fillText('DASH', dx, y - 5)
  g.fillRect(dx, y, dashReady ? 30 : 30 * 0.35, h)
}

function drawCar(g, x, y, crashed, boosting, lean) {
  const w = 46
  const h = 30
  const tint = crashed ? '#c9414c' : boosting ? '#7fb2e8' : '#d6d6de'
  const dark = crashed ? '#5e1a20' : boosting ? '#1f3d5e' : '#3a3a46'

  /* Contact shadow. */
  g.save()
  g.fillStyle = 'rgba(0,0,0,0.5)'
  g.beginPath()
  g.ellipse(x, y + 3, w * 0.6, 5, 0, 0, Math.PI * 2)
  g.fill()
  g.restore()

  g.save()
  g.translate(x + lean * 3, y)
  g.rotate(lean * 0.035)

  /* Tyres, poking out below the arches. */
  g.fillStyle = '#0b0b0e'
  g.fillRect(-w / 2 - 1, -8, 7, 9)
  g.fillRect(w / 2 - 6, -8, 7, 9)

  /* Lower body: the darker mass under the shoulder line. */
  const low = g.createLinearGradient(0, -12, 0, 0)
  low.addColorStop(0, dark)
  low.addColorStop(1, '#101014')
  g.fillStyle = low
  g.beginPath()
  g.moveTo(-w / 2, 0)
  g.lineTo(-w / 2 + 2, -13)
  g.lineTo(w / 2 - 2, -13)
  g.lineTo(w / 2, 0)
  g.closePath()
  g.fill()

  /* Shoulders: the lit top surface. */
  const body = g.createLinearGradient(0, -h, 0, -10)
  body.addColorStop(0, tint)
  body.addColorStop(0.55, tint)
  body.addColorStop(1, dark)
  g.fillStyle = body
  g.beginPath()
  g.moveTo(-w / 2 + 2, -13)
  g.lineTo(-w / 2 + 7, -h + 4)
  g.lineTo(w / 2 - 7, -h + 4)
  g.lineTo(w / 2 - 2, -13)
  g.closePath()
  g.fill()

  /* Roof and rear glass. */
  const glass = g.createLinearGradient(0, -h + 3, 0, -15)
  glass.addColorStop(0, 'rgba(150,170,200,0.55)')
  glass.addColorStop(0.4, 'rgba(14,16,22,0.95)')
  glass.addColorStop(1, 'rgba(20,22,30,0.95)')
  g.fillStyle = glass
  g.beginPath()
  g.moveTo(-w / 2 + 9, -h + 5)
  g.lineTo(-w / 2 + 12, -16)
  g.lineTo(w / 2 - 12, -16)
  g.lineTo(w / 2 - 9, -h + 5)
  g.closePath()
  g.fill()

  /* Spoiler, floating just clear of the deck. */
  g.fillStyle = dark
  g.fillRect(-w / 2 + 5, -h + 1, w - 10, 3)
  g.fillRect(-w / 2 + 8, -h + 4, 3, 4)
  g.fillRect(w / 2 - 11, -h + 4, 3, 4)

  /* Tail lights, with a bloom so they read as emitting rather than painted on. */
  const lamp = crashed ? '#ff9a9a' : '#ff3b3b'
  g.save()
  g.shadowColor = lamp
  g.shadowBlur = boosting ? 14 : 9
  g.fillStyle = lamp
  g.fillRect(-w / 2 + 4, -11, 11, 4)
  g.fillRect(w / 2 - 15, -11, 11, 4)
  g.restore()

  /* Number plate. */
  g.fillStyle = 'rgba(240,240,245,0.85)'
  g.fillRect(-7, -9, 14, 5)

  /* Exhaust glow under the bumper while boosting. */
  if (boosting) {
    g.save()
    g.shadowColor = '#9ecbff'
    g.shadowBlur = 16
    g.fillStyle = '#cfe6ff'
    g.fillRect(-10, -3, 6, 3)
    g.fillRect(4, -3, 6, 3)
    g.restore()
  }

  g.restore()
}
