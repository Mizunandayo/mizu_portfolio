import { useCallback, useEffect, useRef, useState } from 'react'

/* ══════════════════════════════════════════════════ 迎撃 — hold the line. */

const W = 460
const H = 300

const SHIP_X = 54 // the line being held
const SHIP_R = 11
const SHIP_SPEED = 320

/* Health is counted in halves so a scout can cost less than a hull. */
const HEARTS = 5
const HP_MAX = HEARTS * 2
const MERCY = 900 // ms of grace after a hit

const TAP_WINDOW = 400 // ms between the two taps
const DASH_FOR = 110 // ms of travel
const DASH_SPEED = 800
const DASH_COOL = 520

const SHOT_SPEED = 560
const FIRE_SLOW = 145
const FIRE_FAST = 62

const RAMP = 75000 // ms to the heaviest wave
const SPAWN_FROM = 950
const SPAWN_TO = 300

const FOE_SHOT = 250
const POD_EVERY = [9000, 15000] // ms between pods

/* `dmg` is in half-hearts, for a collision or for getting past the line. */
const KINDS = {
  scout: { hp: 1, lo: 120, hi: 210, r: 11, fire: 0.0030, pts: 10, dmg: 1, col: '#c8323c', dark: '#7d1620' },
  gunner: { hp: 2, lo: 70, hi: 105, r: 12, fire: 0.0150, pts: 25, dmg: 2, col: '#e0822c', dark: '#8a4712' },
  hull: { hp: 4, lo: 48, hi: 74, r: 17, fire: 0.0045, pts: 60, dmg: 3, col: '#8b6cf6', dark: '#432d8f' },
}

/* `for` is how long the power lasts. */
const PODS = {
  big: { col: '#ffd76b', for: 7000, w: 44 },
  rapid: { col: '#7fe0c0', for: 7000, w: 44 },
  repair: { col: '#ff5f7e', for: 0, w: 12 },
}

const POD_PICK = Object.entries(PODS).flatMap(([k, v]) => Array(v.w).fill(k))

export default function Shooter({ onScore, onState }) {
  const ref = useRef(null)
  const sim = useRef(null)
  const raf = useRef(0)
  const keys = useRef({ up: false, down: false, fire: false })
  const [hud, setHud] = useState({ score: 0, wave: 1 })
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
    s.age += dt * 1000
    const ramp = Math.min(1, s.age / RAMP)

    const big = now < s.power.big
    const rapid = now < s.power.rapid

    if (keys.current.up) s.y -= SHIP_SPEED * dt
    if (keys.current.down) s.y += SHIP_SPEED * dt
    if (now < s.dashUntil) {
      s.y += s.dashDir * DASH_SPEED * dt
      s.trail.push({ y: s.y, t: now })
    }
    s.trail = s.trail.filter((g) => now - g.t < 180)
    s.y = Math.max(SHIP_R + 4, Math.min(H - SHIP_R - 4, s.y))

    if (keys.current.fire && now - s.lastShot > (rapid ? FIRE_FAST : FIRE_SLOW)) {
      s.lastShot = now
      s.shots.push({ x: SHIP_X + 16, y: s.y, mine: true, big })
      s.flash = now
    }

    const gap = SPAWN_FROM + (SPAWN_TO - SPAWN_FROM) * ramp
    if (now - s.lastSpawn > gap) {
      s.lastSpawn = now
      /* Hulls and gunners get commoner as the run goes on. */
      const roll = Math.random()
      const kind = roll < 0.18 + ramp * 0.2 ? 'gunner'
        : roll < 0.26 + ramp * 0.3 ? 'hull'
        : 'scout'
      const k = KINDS[kind]
      s.foes.push({
        kind,
        hp: k.hp,
        x: W + 22,
        y: 28 + Math.random() * (H - 56),
        v: k.lo + (k.hi - k.lo) * (0.7 + Math.random() * 0.6) * (0.7 + ramp * 0.3),
        weave: Math.random() < 0.4 ? 20 + Math.random() * 26 : 0,
        seed: Math.random() * 6.28,
      })
    }

    if (now > s.nextPod) {
      s.nextPod = now + POD_EVERY[0] + Math.random() * (POD_EVERY[1] - POD_EVERY[0])
      /* Weighted, and a repair is only offered when it would do something. */
      let type = POD_PICK[Math.floor(Math.random() * POD_PICK.length)]
      if (type === 'repair' && s.hp >= HP_MAX) type = Math.random() < 0.5 ? 'big' : 'rapid'
      s.pods.push({ type, x: W + 20, y: 40 + Math.random() * (H - 80), seed: Math.random() * 6.28 })
    }

    for (const f of s.foes) {
      f.x -= f.v * dt
      f.seed += dt * 3
      const k = KINDS[f.kind]
      if (Math.random() < k.fire && f.x < W - 20 && f.x > SHIP_X + 40) {
        s.shots.push({ x: f.x - 14, y: f.y + (f.weave ? Math.sin(f.seed) * f.weave : 0), mine: false })
      }
    }
    for (const p of s.pods) {
      p.x -= 70 * dt
      p.seed += dt * 2.4
    }
    for (const b of s.shots) b.x += (b.mine ? SHOT_SPEED : -FOE_SHOT) * dt
    for (const p of s.puffs) {
      p.t += dt
      p.x += p.vx * dt
      p.y += p.vy * dt
    }

    const hurt = (n) => {
      if (now < s.mercy) return
      s.hp -= n
      s.mercy = now + MERCY
      burst(s, SHIP_X, s.y, '255,180,80')
    }

    for (const b of s.shots) {
      if (!b.mine) {
        if (Math.hypot(b.x - SHIP_X, b.y - s.y) < SHIP_R) { b.gone = true; hurt(1) }
        continue
      }

      for (const p of s.pods) {
        if (p.gone) continue
        const py = p.y + Math.sin(p.seed) * 8
        if (Math.hypot(b.x - p.x, b.y - py) < 14) {
          p.gone = true
          b.gone = true
          if (p.type === 'repair') {
            s.hp = HP_MAX // the whole bar, not a heart
            burst(s, p.x, py, '255,95,126')
          } else {
            s.power[p.type] = now + PODS[p.type].for
            burst(s, p.x, py, p.type === 'big' ? '255,215,107' : '127,224,192')
          }
          break
        }
      }
      if (b.gone) continue

      for (const f of s.foes) {
        if (f.gone) continue
        const k = KINDS[f.kind]
        const fy = f.y + (f.weave ? Math.sin(f.seed) * f.weave : 0)
        if (Math.hypot(b.x - f.x, b.y - fy) < k.r + (b.big ? 6 : 3)) {
          f.hp -= b.big ? 3 : 1
          b.gone = true
          if (f.hp <= 0) {
            f.gone = true
            s.score += k.pts
            burst(s, f.x, fy)
          } else {
            burst(s, b.x, b.y, '255,220,150', 3)
          }
          break
        }
      }
    }

    for (const f of s.foes) {
      const k = KINDS[f.kind]
      const fy = f.y + (f.weave ? Math.sin(f.seed) * f.weave : 0)
      if (!f.gone && Math.hypot(f.x - SHIP_X, fy - s.y) < k.r + SHIP_R) {
        f.gone = true
        burst(s, f.x, fy)
        hurt(k.dmg)
      }
      /* Past the line. This is the cost that makes it a line. */
      if (!f.gone && f.x < -24) {
        f.gone = true
        hurt(k.dmg)
      }
    }

    s.foes = s.foes.filter((f) => !f.gone)
    s.pods = s.pods.filter((p) => !p.gone && p.x > -30)
    s.shots = s.shots.filter((b) => !b.gone && b.x > -20 && b.x < W + 20)
    s.puffs = s.puffs.filter((p) => p.t < 0.4)

    const g = c.getContext('2d')
    g.fillStyle = '#05050a'
    g.fillRect(0, 0, W, H)

    /* Stars run left: the ship is the thing flying right. */
    for (const st of s.stars) {
      st.x -= st.z * 26 * dt
      if (st.x < 0) { st.x = W; st.y = Math.random() * H }
      g.fillStyle = `rgba(255,255,255,${0.16 + st.z * 0.5})`
      g.fillRect(st.x, st.y, st.z * 2, st.z * 2)
    }

    for (const p of s.pods) drawPod(g, p.x, p.y + Math.sin(p.seed) * 8, p.type, now)

    for (const b of s.shots) {
      if (b.mine) {
        g.fillStyle = b.big ? '#ffd76b' : '#ffe9a8'
        g.fillRect(b.x - (b.big ? 12 : 8), b.y - (b.big ? 4 : 1.5), b.big ? 24 : 16, b.big ? 8 : 3)
      } else {
        g.fillStyle = '#8ad2ff'
        g.beginPath()
        g.arc(b.x, b.y, 3, 0, Math.PI * 2)
        g.fill()
      }
    }

    for (const f of s.foes) {
      const k = KINDS[f.kind]
      drawFoe(g, f.x, f.y + (f.weave ? Math.sin(f.seed) * f.weave : 0), k, f.hp)
    }

    for (const p of s.puffs) {
      const k = 1 - p.t / 0.4
      g.fillStyle = `rgba(${p.c},${k * 0.9})`
      g.beginPath()
      g.arc(p.x, p.y, p.r * (0.5 + (1 - k) * 1.6), 0, Math.PI * 2)
      g.fill()
    }

    for (const gh of s.trail) {
      const k = 1 - (now - gh.t) / 180
      g.fillStyle = `rgba(140,200,255,${k * 0.32})`
      g.beginPath()
      g.ellipse(SHIP_X - 4, gh.y, 12, 6, 0, 0, Math.PI * 2)
      g.fill()
    }

    const dead = s.hp <= 0
    /* Blinks through the mercy window. */
    if (!dead && (now > s.mercy || Math.floor(now / 90) % 2 === 0)) {
      drawShip(g, SHIP_X, s.y, now - s.flash < 60, big, rapid)
    }

    drawHud(g, s.hp, s.power, now)

    setHud({ score: s.score, wave: 1 + Math.floor(s.age / 15000) })

    if (dead) {
      stop()
      setPhaseBoth('done')
      onScore?.(s.score)
      return
    }
    raf.current = requestAnimationFrame(loop)
  }, [onScore, stop])

  const fresh = useCallback(() => ({
      y: H / 2,
      hp: HP_MAX,
      mercy: 0,
      dashUntil: 0,
      dashDir: 0,
      dashReady: 0,
      tapUp: 0,
      tapDown: 0,
      trail: [],
      score: 0,
      age: 0,
      last: performance.now(),
      lastShot: 0,
      lastSpawn: performance.now(),
      nextPod: performance.now() + POD_EVERY[0],
      flash: 0,
      power: { big: 0, rapid: 0 },
      foes: [],
      pods: [],
      shots: [],
      puffs: [],
      stars: Array.from({ length: 70 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        z: 0.3 + Math.random() * 0.9,
      })),
  }), [])

  const begin = useCallback(() => {
    sim.current = fresh()
    setHud({ score: 0, wave: 1 })
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

  /* Held keys fire keydown over and over, and every repeat would read as a second tap. */
  const tapped = (dir) => {
    const s = sim.current
    if (!s) return
    const now = performance.now()
    const last = dir < 0 ? s.tapUp : s.tapDown
    if (now - last < TAP_WINDOW && now > s.dashReady) {
      s.dashUntil = now + DASH_FOR
      s.dashDir = dir
      s.dashReady = now + DASH_COOL
    }
    if (dir < 0) s.tapUp = now
    else s.tapDown = now
  }

  const press = (e, down) => {
    const k = e.code
    if (k === 'ArrowUp' || k === 'KeyW') {
      if (down && !e.repeat) tapped(-1)
      keys.current.up = down
    } else if (k === 'ArrowDown' || k === 'KeyS') {
      if (down && !e.repeat) tapped(1)
      keys.current.down = down
    }
    else if (k === 'Space' || k === 'Enter') {
      if (down && phaseRef.current !== 'run') begin()
      else keys.current.fire = down
      if (!down) keys.current.fire = false
    } else return
    e.preventDefault()
    e.stopPropagation()
  }

  const touch = (e, down) => {
    if (!down) {
      keys.current.fire = false
      return
    }
    if (phaseRef.current !== 'run') return begin()
    const r = e.currentTarget.getBoundingClientRect()
    const y = ((e.touches[0].clientY - r.top) / r.height) * H
    if (sim.current) sim.current.y = Math.max(SHIP_R + 4, Math.min(H - SHIP_R - 4, y))
    keys.current.fire = true
  }

  return (
    <div
      className="ar-shooter-mizu"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => press(e, true)}
      onKeyUp={(e) => press(e, false)}
      onTouchStart={(e) => touch(e, true)}
      onTouchMove={(e) => touch(e, true)}
      onTouchEnd={(e) => touch(e, false)}
      onClick={() => phaseRef.current !== 'run' && begin()}
      aria-label="Intercept. Up and down to move, space to fire."
    >
      <canvas ref={ref} width={W} height={H} className="ar-canvas-mizu" />

      <span className="ar-touge-dist-mizu">
        {hud.score.toLocaleString()}
        <i>wave {hud.wave}</i>
      </span>

    </div>
  )
}

function burst(s, x, y, colour = '255,150,60', n = 9) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2
    const sp = 40 + Math.random() * 130
    s.puffs.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 2 + Math.random() * 4, t: 0, c: colour })
  }
}

/* Pips rather than a bar: five is few enough to count at a glance. */
function drawHud(g, hp, power, now) {
  /* Each heart is two units. */
  for (let i = 0; i < HEARTS; i++) {
    const left = Math.max(0, Math.min(2, hp - i * 2))
    const x = 12 + i * 13

    g.fillStyle = 'rgba(255,255,255,0.16)'
    diamond(g, x, 16)
    g.fill()

    if (left > 0) {
      g.save()
      if (left === 1) {
        g.beginPath()
        g.rect(x - 6, 6, 6, 20)
        g.clip()
      }
      g.fillStyle = '#ff5d6c'
      diamond(g, x, 16)
      g.fill()
      g.restore()
    }
  }

  let x = 12
  for (const [key, pod] of Object.entries(PODS)) {
    const left = power[key] - now
    if (left <= 0) continue
    g.fillStyle = pod.col
    g.fillRect(x, 28, 34 * Math.min(1, left / pod.for), 3)
    g.fillStyle = 'rgba(255,255,255,0.25)'
    g.fillRect(x, 28, 34, 3)
    x += 40
  }
}

function drawShip(g, x, y, firing, big, rapid) {
  g.save()
  g.shadowColor = rapid ? '#7fe0c0' : '#69b6ff'
  g.shadowBlur = 10
  g.fillStyle = rapid ? '#7fe0c0' : '#7fc4ff'
  g.fillRect(x - 18, y - 3, 8, 6)
  g.restore()

  g.fillStyle = big ? '#ffe9a8' : '#e8e8f0'
  g.beginPath()
  g.moveTo(x + 18, y)
  g.lineTo(x - 6, y - 9)
  g.lineTo(x - 13, y - 3)
  g.lineTo(x - 13, y + 3)
  g.lineTo(x - 6, y + 9)
  g.closePath()
  g.fill()

  g.fillStyle = '#9aa0b4'
  g.beginPath()
  g.moveTo(x - 2, y - 8)
  g.lineTo(x - 12, y - 15)
  g.lineTo(x - 13, y - 4)
  g.closePath()
  g.moveTo(x - 2, y + 8)
  g.lineTo(x - 12, y + 15)
  g.lineTo(x - 13, y + 4)
  g.closePath()
  g.fill()

  g.fillStyle = '#2b3550'
  g.beginPath()
  g.ellipse(x + 4, y, 6, 3.2, 0, 0, Math.PI * 2)
  g.fill()

  if (firing) {
    g.fillStyle = 'rgba(255,220,120,0.9)'
    g.beginPath()
    g.arc(x + 18, y, 4, 0, Math.PI * 2)
    g.fill()
  }
}

function drawFoe(g, x, y, k, hp) {
  const s = k.r / 11

  g.fillStyle = k.col
  g.beginPath()
  g.moveTo(x - 13 * s, y)
  g.lineTo(x + 6 * s, y - 10 * s)
  g.lineTo(x + 12 * s, y)
  g.lineTo(x + 6 * s, y + 10 * s)
  g.closePath()
  g.fill()

  g.fillStyle = k.dark
  g.beginPath()
  g.moveTo(x + 6 * s, y - 10 * s)
  g.lineTo(x + 13 * s, y - 13 * s)
  g.lineTo(x + 9 * s, y - 3 * s)
  g.closePath()
  g.moveTo(x + 6 * s, y + 10 * s)
  g.lineTo(x + 13 * s, y + 13 * s)
  g.lineTo(x + 9 * s, y + 3 * s)
  g.closePath()
  g.fill()

  g.fillStyle = '#ffd76b'
  g.beginPath()
  g.arc(x - 2 * s, y, 2.6 * s, 0, Math.PI * 2)
  g.fill()

  /* A hull that has been hit shows it, so four rounds does not feel like the shots are missing. */
  if (k.hp > 1) {
    g.fillStyle = 'rgba(0,0,0,0.45)'
    g.fillRect(x - 12 * s, y - 15 * s, 24 * s, 3)
    g.fillStyle = '#7fe0c0'
    g.fillRect(x - 12 * s, y - 15 * s, 24 * s * (hp / k.hp), 3)
  }
}

function drawPod(g, x, y, type, now) {
  const col = PODS[type].col
  const pulse = 0.7 + 0.3 * Math.sin(now / 160)

  g.save()
  g.shadowColor = col
  g.shadowBlur = 14 * pulse
  g.strokeStyle = col
  g.lineWidth = 2
  g.beginPath()
  g.arc(x, y, 11, 0, Math.PI * 2)
  g.stroke()
  g.restore()

  g.fillStyle = 'rgba(8,10,16,0.9)'
  g.beginPath()
  g.arc(x, y, 9, 0, Math.PI * 2)
  g.fill()

  g.fillStyle = col
  if (type === 'big') {
    g.fillRect(x - 6, y - 3, 12, 6)
  } else if (type === 'rapid') {
    g.fillRect(x - 7, y - 1.5, 6, 3)
    g.fillRect(x + 1, y - 1.5, 6, 3)
  } else {
    /* A cross reads as repair at eleven pixels where a heart just reads as a blob. */
    g.fillRect(x - 5.5, y - 1.8, 11, 3.6)
    g.fillRect(x - 1.8, y - 5.5, 3.6, 11)
  }
}

function diamond(g, x, y) {
  g.beginPath()
  g.moveTo(x - 5, y)
  g.lineTo(x, y - 6)
  g.lineTo(x + 5, y)
  g.lineTo(x, y + 6)
  g.closePath()
}
