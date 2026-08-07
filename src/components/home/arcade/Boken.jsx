import { useCallback, useEffect, useRef, useState } from 'react'

/* ══════════════════════════════════════════════════
   冒険 — the island run.

   A jungle platformer in the 8-bit mould, written from
   scratch rather than emulated: original code, original
   art, no ROM.

   The engine of it is the vitality meter. It drains the
   whole time you are alive, so standing still is death
   and the only refill is fruit, which sits exactly where
   the obstacles are. Every piece of fruit is a question
   about whether you can afford to go and get it, and a
   run ends because you got greedy or because you got
   timid, never because nothing happened.

   Three things layer on top of that:

   The egg is a gamble. It can hand you an axe, a board,
   a fairy or a bottle of milk — or a cursed eggplant
   that doubles the drain for eight seconds. You cannot
   tell from outside, so every egg is a decision made
   against your current vitality rather than a free
   pickup. That single coin-flip is what stops the run
   settling into a rhythm.

   The axe is one throw. It is the only thing that turns
   a hazard into a reward, since a kill pays vitality
   back, but you carry at most one and it is spent the
   moment it leaves your hand — so the question is never
   whether to throw, it is which of the next three things
   is worth spending it on. It is lost on a hit too,
   which stops you walking into something to save it.

   Crows fly at exactly the height a jump puts your head,
   so they are the one obstacle you clear by *not*
   jumping. Against a game whose only verb is jump, that
   is the counter-pressure that keeps the button honest.
   ══════════════════════════════════════════════════ */

const W = 460
const H = 300
const GROUND = 234
const RUN_X = 120
const PX_M = 30 // pixels to a metre

const GRAV = 2000
const JUMP_V = -620
const CUT = 0.45 // release early and the rest of the rise is cut
const COYOTE = 90
const BUFFER = 120

const SLOW = 150
const FAST = 320
const RAMP = 90000

const GAP_FROM = 320
const GAP_TO = 230
const FRUIT_GAP = 400 // fruit keeps its own spacing, in px

const VIT_MAX = 100
const VIT_DRAIN = 5 // per second
const VIT_FRUIT = 20
const VIT_HIT = 28
const VIT_KILL = 3 // a clean kill pays a little back

const BOARD_FOR = 8000
const BOARD_BOOST = 1.25
const FAIRY_FOR = 6000
const CURSE_FOR = 8000
const CURSE_DRAIN = 2.2 // multiplier while cursed

const AXE_COOL = 300
const AXE_MAX = 1 // one in the air at a time
const AXE_LEAD = 170 // how much faster than the runner it flies
const AXE_VY = -400
const AXE_GRAV = 1150

/* The axe locks on. A ballistic arc thrown from a moving runner at a
   target that is also moving is a guess, and missing costs the throw
   without teaching you anything — so it leaves the hand on an arc and
   then steers. Fast enough to converge, soft enough that it still reads
   as a thrown axe rather than a missile. */
const AXE_SPEED = 430
const AXE_HOME = 8 // how hard it steers, per second
const AXE_LIFE = 1600
const AXE_BITE = 15 // half-width of the strike once it is on target

const LEDGE_Y = GROUND - 70
const DROP_FOR = 320 // ms of falling through a ledge you stepped off

/* Coconuts hang in a tree at the front of the scene and let go as you
   approach. The lead comes out of the fall itself rather than a tuned
   constant, so it is still in the air when you reach it at any speed. */
const COCO_Y = GROUND - 112
const COCO_GRAV = 900
const COCO_FALL = Math.sqrt((2 * (GROUND - 8 - COCO_Y)) / COCO_GRAV)

const PW = 15
const PH = 24
const MERCY = 700

/* The egg table. Weighted so the good outcomes are worth chasing and the
   curse is common enough to make you hesitate over the last egg before a
   tight stretch — which is the whole point of it. */
const LOOT = [
  ['axe', 30],
  ['board', 22],
  ['fairy', 14],
  ['milk', 12],
  ['curse', 22],
]

const KILLABLE = new Set(['turtle', 'crow', 'coconut', 'rock'])

export default function Boken({ onScore, onState }) {
  const ref = useRef(null)
  const sim = useRef(null)
  const raf = useRef(0)
  const [hud, setHud] = useState({ m: 0 })
  const phaseRef = useRef('ready')
  const held = useRef(false)

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

    const boarding = now < s.boardUntil
    const fairy = now < s.fairyUntil
    const cursed = now < s.curseUntil
    const speed = (SLOW + (FAST - SLOW) * ramp) * (boarding ? BOARD_BOOST : 1) * s.nudge
    s.speed = speed

    /* ── World ahead ──
       Two streams. Fruit on the obstacle cadence starves you early, when
       the run is deliberately slow and the gaps are wide, so it gets its
       own spacing in distance: the refill rate rises with speed while
       the obstacles close in. */
    const gap = GAP_FROM + (GAP_TO - GAP_FROM) * ramp
    while (s.nextX < s.x + W + 220) {
      spawn(s, s.nextX, ramp)
      s.nextX += gap * (0.8 + Math.random() * 0.5)
    }
    while (s.nextF < s.x + W + 220) {
      dropFruit(s, s.nextF)
      s.nextF += FRUIT_GAP * (0.75 + Math.random() * 0.5)
    }

    /* ── Player ── */
    s.x += speed * dt

    if (!s.doomed && s.buffer > now - BUFFER && (s.onGround || s.left > now - COYOTE) && s.vy >= 0) {
      s.vy = JUMP_V
      s.buffer = 0
      s.left = 0
      s.onGround = false
    }
    if (!held.current && s.vy < 0) s.vy *= 1 - CUT * dt * 12

    const prevY = s.y
    s.vy += GRAV * dt
    s.y += s.vy * dt

    /* Ledges are one-way: only ever caught on the way down, so a jump
       from underneath passes straight through instead of clipping you
       onto a shelf you were trying to get past. Holding down drops you
       off one on purpose. */
    const dropping = now < s.dropUntil
    const surf = !s.doomed && s.vy >= 0 ? surfaceAt(s, s.x, prevY, s.y, dropping) : null
    if (surf != null) {
      s.y = surf
      s.vy = 0
      s.onGround = true
      s.left = now
    } else {
      if (s.onGround) s.left = now
      s.onGround = false
    }

    /* Below the lip with nothing under you is the end of the run, health
       or no health. Without this the auto-run carries you across the gap
       while you fall and surfaceAt sets you down on the far side — at
       320px/s you clear a 95px pit in 297ms against the 355ms it takes to
       fall out of the world, so a hole you plainly missed cost nothing.
       Once doomed no surface is tested again and no jump is offered, or
       coyote time would let you climb back out of your own grave. */
    if (!s.doomed && surf == null && s.y > GROUND + 4) {
      s.doomed = true
      s.pop.push({ x: s.x, y: GROUND - 30, t: 0, txt: 'FELL' })
    }

    s.vit -= VIT_DRAIN * (cursed ? CURSE_DRAIN : 1) * dt
    if (s.doomed && s.y > H + 60) s.vit = 0

    /* ── Things ── */
    for (const o of s.things) {
      if (o.dead) continue

      if (o.kind === 'turtle') o.x -= 42 * dt
      else if (o.kind === 'crow') o.x -= 74 * dt
      else if (o.kind === 'coconut') {
        /* Cut loose on distance rather than on a timer, or a board boost
           would run you straight underneath one still in the tree. */
        if (!o.armed && s.x > o.x - speed * COCO_FALL * 0.9) o.armed = true
        if (o.armed) {
          o.vy += COCO_GRAV * dt
          o.y += o.vy * dt
          if (o.y > GROUND - 8) o.dead = true // splits on the ground, harmless after
        }
      }

      if (!overlap(s, o)) continue

      if (o.kind === 'fruit') {
        o.dead = true
        s.vit = Math.min(VIT_MAX, s.vit + VIT_FRUIT)
        s.pop.push({ x: o.x, y: o.y, t: 0, txt: `+${VIT_FRUIT}` })
      } else if (o.kind === 'egg') {
        o.dead = true
        crack(s, o, now)
      } else if (o.kind === 'coconut' && !o.armed) {
        continue // still in the tree, not a hazard yet
      } else if (fairy) {
        /* The fairy does not just absorb the hit, it clears the thing —
           six seconds of walking through the level is the reward. */
        o.dead = true
        s.pop.push({ x: o.x, y: o.y - 16, t: 0, txt: '✦' })
      } else if (now > s.hurt) {
        s.hurt = now + MERCY
        if (boarding) {
          /* The board is a shield that costs you the board, which is the
             only reason taking it into a tight stretch is a real gamble. */
          s.boardUntil = 0
          s.pop.push({ x: s.x, y: s.y - 40, t: 0, txt: 'BOARD LOST' })
        } else if (s.axe > 0) {
          /* And the axe goes the same way. Losing it on contact is what
             stops you walking into things to save a throw. */
          s.axe = 0
          s.pop.push({ x: s.x, y: s.y - 40, t: 0, txt: 'AXE LOST' })
        } else {
          s.vit -= VIT_HIT
          s.vy = -260
          s.pop.push({ x: s.x, y: s.y - 40, t: 0, txt: `-${VIT_HIT}` })
        }
      }
    }

    /* ── Axes in flight ── */
    for (const a of s.axes) {
      /* A target that died or ran off the back is no longer a target;
         the axe finishes the throw on its own arc. */
      if (a.lock && (a.lock.dead || a.lock.x < s.x - RUN_X)) a.lock = null
      if (!a.lock) a.lock = lockOn(s, a.x)

      if (a.lock) {
        const dx = a.lock.x - a.x
        const dy = a.lock.y - a.y
        const d = Math.hypot(dx, dy) || 1
        const k = Math.min(1, AXE_HOME * dt)
        a.vx += ((dx / d) * AXE_SPEED - a.vx) * k
        a.vy += ((dy / d) * AXE_SPEED - a.vy) * k
      } else {
        a.vy += AXE_GRAV * dt
      }

      a.x += a.vx * dt
      a.y += a.vy * dt
      a.spin += dt * 16

      for (const o of s.things) {
        if (o.dead || !KILLABLE.has(o.kind)) continue
        if (o.kind === 'coconut' && !o.armed) continue
        if (Math.abs(a.x - o.x) > (AXE_BITE + o.w) / 2) continue
        if (Math.abs(a.y - o.y) > (AXE_BITE + o.h) / 2) continue
        o.dead = true
        a.dead = true
        s.vit = Math.min(VIT_MAX, s.vit + VIT_KILL)
        s.pop.push({ x: o.x, y: o.y - 14, t: 0, txt: `+${VIT_KILL}` })
        break
      }
    }

    s.axes = s.axes.filter(
      (a) => !a.dead && now - a.born < AXE_LIFE && a.y < H + 40 && a.x < s.x + W
    )
    s.things = s.things.filter((o) => !o.dead && o.x > s.x - RUN_X - 70)
    s.pits = s.pits.filter((p) => p.x1 > s.x - RUN_X - 70)
    s.ledges = s.ledges.filter((p) => p.x1 > s.x - RUN_X - 70)
    s.props = s.props.filter((p) => p.x > s.x - RUN_X - 90)
    s.pop = s.pop.filter((p) => (p.t += dt) < 0.8)

    draw(c.getContext('2d'), s, now, { boarding, fairy, cursed, axe: s.axe > 0 })

    const m = Math.floor((s.x - s.x0) / PX_M)
    setHud({ m })

    if (s.vit <= 0) {
      stop()
      setPhaseBoth('done')
      onScore?.(m)
      return
    }
    raf.current = requestAnimationFrame(loop)
  }, [onScore, stop])

  const fresh = useCallback(() => {
    const x0 = 0
    return {
      x: x0,
      x0,
      y: GROUND,
      vy: 0,
      speed: SLOW,
      onGround: true,
      left: 0,
      buffer: 0,
      nudge: 1,
      vit: VIT_MAX,
      age: 0,
      last: performance.now(),
      hurt: 0,
      boardUntil: 0,
      fairyUntil: 0,
      curseUntil: 0,
      axe: 0, // throws in hand, never more than one
      axes: [],
      lastThrow: 0,
      things: [],
      props: [],
      pits: [],
      ledges: [],
      dropUntil: 0,
      doomed: false,
      pop: [],
      nextX: x0 + 420, // a beat of clear ground to read the screen
      nextF: x0 + 300,
      trees: Array.from({ length: 9 }, (_, i) => ({ x: x0 + i * 190, h: 40 + Math.random() * 34 })),
    }
  }, [])

  const begin = useCallback(() => {
    sim.current = fresh()
    setHud({ m: 0 })
    setPhaseBoth('run')
    stop()
    raf.current = requestAnimationFrame(loop)
  }, [fresh, loop, stop])

  /* One static frame on mount. An unstarted cabinet showing black reads
     as broken rather than as waiting. */
  useEffect(() => {
    const s = fresh()
    sim.current = s
    for (let x = s.x + 320; x < s.x + W + 200; x += 300) spawn(s, x, 0)
    for (let x = s.x + 260; x < s.x + W + 200; x += 400) dropFruit(s, x)
    if (ref.current) {
      draw(ref.current.getContext('2d'), s, performance.now(), {})
    }
  }, [fresh])

  useEffect(() => () => stop(), [stop])

  const jump = () => {
    held.current = true
    if (phaseRef.current !== 'run') return begin()
    sim.current.buffer = performance.now()
  }

  const throwAxe = () => {
    const s = sim.current
    if (!s || phaseRef.current !== 'run' || s.axe <= 0) return
    const now = performance.now()
    if (now - s.lastThrow < AXE_COOL || s.axes.length >= AXE_MAX) return
    s.lastThrow = now
    s.axe -= 1 // one egg, one throw
    /* Given the runner's own speed, not a fixed value, or at top speed
       the axe would trail behind the man who threw it. */
    s.axes.push({
      x: s.x + 10, y: s.y - 20,
      vx: s.speed + AXE_LEAD, vy: AXE_VY,
      spin: 0, born: now, lock: lockOn(s, s.x),
    })
  }

  /* Only off a ledge. On the ground there is nothing below to drop to,
     and letting it fire there would read as an input that does nothing. */
  const dropOff = () => {
    const s = sim.current
    if (!s || phaseRef.current !== 'run') return
    if (!s.onGround || s.y >= GROUND) return
    s.dropUntil = performance.now() + DROP_FOR
    s.y += 2
    s.vy = 70
    s.onGround = false
  }

  const press = (e) => {
    const k = e.code
    if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW' || k === 'Enter') jump()
    else if (k === 'ShiftLeft' || k === 'ShiftRight' || k === 'KeyZ' || k === 'KeyX') throwAxe()
    else if (k === 'ArrowDown' || k === 'KeyS') dropOff()
    else if (k === 'ArrowLeft' || k === 'KeyA') sim.current && (sim.current.nudge = 0.72)
    else if (k === 'ArrowRight' || k === 'KeyD') sim.current && (sim.current.nudge = 1.22)
    else return
    e.preventDefault()
    e.stopPropagation()
  }

  const release = (e) => {
    const k = e.code
    if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW' || k === 'Enter') held.current = false
    else if (k.startsWith('Arrow') || k === 'KeyA' || k === 'KeyD') {
      if (sim.current) sim.current.nudge = 1
    }
  }

  return (
    <div
      className="ar-boken-mizu"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => !e.repeat && press(e)}
      onKeyUp={release}
      onTouchStart={(e) => {
        e.preventDefault()
        /* Two fingers throws. A drawn button would cover the ground you
           need to be reading. */
        if (e.touches.length >= 2) throwAxe()
        else jump()
      }}
      onTouchEnd={() => { held.current = false }}
      onMouseDown={jump}
      onMouseUp={() => { held.current = false }}
      aria-label="Boken. Space to jump, shift to throw."
    >
      <canvas ref={ref} width={W} height={H} className="ar-canvas-mizu" />

      <span className="ar-touge-dist-mizu">{hud.m.toLocaleString()} m</span>
    </div>
  )
}

/* ── Eggs ─────────────────────────────────────────
   Rolled on contact, not at spawn, so nothing about the egg on screen
   can betray what is inside it. */
function crack(s, o, now) {
  let roll = Math.random() * LOOT.reduce((t, [, w]) => t + w, 0)
  let pick = 'axe'
  for (const [k, w] of LOOT) {
    roll -= w
    if (roll <= 0) { pick = k; break }
  }

  const say = (txt) => s.pop.push({ x: o.x, y: o.y - 10, t: 0, txt })

  if (pick === 'axe') { s.axe = 1; say('AXE!') }
  else if (pick === 'board') { s.boardUntil = now + BOARD_FOR; say('BOARD!') }
  else if (pick === 'fairy') { s.fairyUntil = now + FAIRY_FOR; say('FAIRY!') }
  else if (pick === 'milk') { s.vit = VIT_MAX; say('MILK!') }
  else { s.curseUntil = now + CURSE_FOR; say('CURSED!') }
}

/* One obstacle per call. Fruit is not in here. */
function spawn(s, x, ramp) {
  const r = Math.random()

  if (r < 0.16) {
    const w = 55 + Math.random() * (40 + ramp * 30)
    s.pits.push({ x0: x, x1: x + w })
    /* Fruit over a pit: the reward for jumping the long way across
       rather than the safe way. */
    if (Math.random() < 0.5) s.things.push(thing('fruit', x + w / 2, GROUND - 76))
    return
  }

  /* A shelf, with something worth the climb on top of it. */
  if (r < 0.28) {
    const w = 96 + Math.random() * 60
    s.ledges.push({ x0: x, x1: x + w, y: LEDGE_Y })
    s.things.push(thing(Math.random() < 0.4 ? 'egg' : 'fruit', x + w / 2, LEDGE_Y - 14))
    return
  }

  if (r < 0.4) return s.things.push(thing('egg', x, GROUND - 14))
  if (r < 0.55) return s.things.push(thing('rock', x, GROUND - 12))
  if (r < 0.7) return s.things.push(thing('turtle', x, GROUND - 9))
  /* Head height for a jumping man and clear over a standing one, so the
     answer is to keep your feet down and run under it. */
  if (r < 0.85) return s.things.push(thing('crow', x, GROUND - 52))
  if (r < 0.93) {
    /* A palm at the front of the scene, not in the parallax layer, so
       the coconut has something to hang from and to fall out of. */
    s.props.push({ kind: 'palm', x, h: 124 })
    return s.things.push(thing('coconut', x, COCO_Y))
  }
  return s.things.push(thing('fire', x, GROUND - 14))
}

/* Height is the price. Low fruit is free as you run past, the rest costs
   a hop or a full jump, which is what puts collecting it in competition
   with clearing whatever is next. */
function dropFruit(s, x) {
  const r = Math.random()
  const y = r < 0.35 ? GROUND - 16 : r < 0.8 ? GROUND - 50 : GROUND - 96
  s.things.push(thing('fruit', x, y))
}

const BOX = {
  rock: [22, 24],
  fire: [18, 28],
  turtle: [24, 18],
  crow: [24, 16],
  coconut: [16, 16],
  fruit: [18, 18],
  egg: [20, 18],
}

function thing(kind, x, y) {
  const [w, h] = BOX[kind]
  return { kind, x, y, w, h, dead: false, vy: 0, armed: false, seed: Math.random() * 6.28 }
}

/* Nearest killable thing ahead of the axe and still on screen. Picked
   fresh each frame so an axe whose target dies mid-flight swings onto
   the next one instead of sailing off. */
function lockOn(s, ax) {
  let best = null
  const edge = s.x + (W - RUN_X)
  for (const o of s.things) {
    if (o.dead || !KILLABLE.has(o.kind)) continue
    if (o.kind === 'coconut' && !o.armed) continue
    if (o.x < ax - 6 || o.x > edge) continue
    if (!best || o.x < best.x) best = o
  }
  return best
}

function inPit(s, x) {
  for (const p of s.pits) if (x > p.x0 && x < p.x1) return true
  return false
}

/* What the feet land on this frame, or null for nothing at all. Tested
   across the whole step rather than at the new position, so a fast fall
   cannot tunnel through a shelf. */
function surfaceAt(s, x, prevFeet, feet, dropping) {
  if (!dropping) for (const p of s.ledges) {
    if (x < p.x0 || x > p.x1) continue
    if (prevFeet <= p.y + 2 && feet >= p.y) return p.y
  }
  if (feet >= GROUND && !inPit(s, x)) return GROUND
  return null
}

function overlap(s, o) {
  return (
    Math.abs(s.x - o.x) < (PW + o.w) / 2 &&
    Math.abs(s.y - PH / 2 - o.y) < (PH + o.h) / 2
  )
}

/* ── Painting ───────────────────────────────────── */
function draw(g, s, now, st) {
  const cam = s.x - RUN_X

  /* The whole canvas, not just down to GROUND. A pit paints no ground,
     so anything left unpainted below the horizon keeps last frame's
     pixels and a hole fills up with smeared trail. */
  const sky = g.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#3aa8e0')
  sky.addColorStop(0.72, '#9fd9f0')
  sky.addColorStop(1, '#0a1a24')
  g.fillStyle = sky
  g.fillRect(0, 0, W, H)

  g.fillStyle = '#fce9a8'
  g.beginPath()
  g.arc(W - 62, 46, 22, 0, Math.PI * 2)
  g.fill()

  /* Recycled on where the palm is drawn, not on where it nominally sits.
     Testing against the camera instead of the parallaxed position sends
     trees round again while they are still on screen. */
  for (const t of s.trees) {
    while (t.x - cam * 0.45 < -90) t.x += 190 * 9
    const px = t.x - cam * 0.45
    if (px > W + 60) continue
    palm(g, px, GROUND, t.h)
  }

  /* Ground, drawn as the spans between the pits. */
  const gaps = [...s.pits].sort((a, b) => a.x0 - b.x0)
  let cut = cam - 40
  const strip = (a, b) => {
    const x = a - cam
    const w = b - a
    if (w <= 0 || x > W || x + w < 0) return
    g.fillStyle = '#4fae3c'
    g.fillRect(x, GROUND, w, 10)
    g.fillStyle = '#8a5a2b'
    g.fillRect(x, GROUND + 10, w, H - GROUND - 10)
    /* Shaded walls at the cut ends, so the edge of a hole is legible
       from across the screen rather than at the moment you reach it. */
    g.fillStyle = '#5c3b1c'
    g.fillRect(x, GROUND + 10, 4, H - GROUND - 10)
    g.fillRect(x + w - 4, GROUND + 10, 4, H - GROUND - 10)
  }
  for (const p of gaps) {
    strip(cut, p.x0)
    cut = Math.max(cut, p.x1)
  }
  strip(cut, cam + W + 60)

  for (const p of s.ledges) {
    const x = p.x0 - cam
    const w = p.x1 - p.x0
    if (x > W || x + w < 0) continue
    g.fillStyle = '#8a5a2b'
    g.fillRect(x, p.y, w, 16)
    g.fillStyle = '#4fae3c'
    g.fillRect(x, p.y, w, 6)
    g.fillStyle = '#5c3b1c'
    g.fillRect(x, p.y + 6, w, 3)
  }

  for (const p of s.props) {
    const px = p.x - cam
    if (px < -60 || px > W + 60) continue
    palm(g, px, GROUND, p.h)
  }

  for (const o of s.things) {
    if (o.dead) continue
    const x = o.x - cam
    if (x < -40 || x > W + 40) continue
    if (o.kind === 'rock') rock(g, x, o.y)
    else if (o.kind === 'fire') fire(g, x, o.y, now, o.seed)
    else if (o.kind === 'turtle') turtle(g, x, o.y)
    else if (o.kind === 'crow') crow(g, x, o.y, now, o.seed)
    else if (o.kind === 'coconut') coconut(g, x, o.y, o.armed)
    else if (o.kind === 'fruit') fruit(g, x, o.y, now, o.seed)
    else if (o.kind === 'egg') egg(g, x, o.y)
  }

  for (const a of s.axes) axe(g, a.x - cam, a.y, a.spin)

  const blink = now < s.hurt && Math.floor(now / 70) % 2 === 0
  if (!blink) runner(g, RUN_X, s.y, s.onGround, now, st)

  /* The curse rides along above your shoulder, so the reason the bar is
     emptying is on screen next to the man it is happening to. */
  if (st.cursed) {
    const b = Math.sin(now / 180) * 3
    eggplant(g, RUN_X - 20, s.y - 46 + b)
  }

  for (const p of s.pop) {
    if (!p.txt) continue
    g.save()
    g.globalAlpha = 1 - p.t / 0.8
    g.fillStyle = '#fff'
    g.font = 'bold 11px ui-monospace, monospace'
    g.textAlign = 'center'
    g.fillText(p.txt, p.x - cam, p.y - p.t * 34)
    g.restore()
  }

  hudBar(g, s, st)
}

/* Vitality, then a row of what you are carrying. Both top-left, in the
   place a cabinet puts its score. */
function hudBar(g, s, st) {
  const k = Math.max(0, s.vit) / VIT_MAX
  g.fillStyle = 'rgba(0,0,0,0.45)'
  g.fillRect(12, 12, 124, 12)
  g.fillStyle = st.cursed ? '#c86bff' : k < 0.25 ? '#ff5252' : k < 0.5 ? '#ffc148' : '#6fe07a'
  g.fillRect(14, 14, 120 * k, 8)
  g.strokeStyle = 'rgba(255,255,255,0.75)'
  g.lineWidth = 1
  g.strokeRect(12.5, 12.5, 123, 11)

  let x = 13
  g.font = 'bold 8px ui-monospace, monospace'
  g.textAlign = 'left'
  const pip = (txt, fill) => {
    const w = g.measureText(txt).width + 8
    g.fillStyle = 'rgba(0,0,0,0.5)'
    g.fillRect(x, 29, w, 11)
    g.fillStyle = fill
    g.fillText(txt, x + 4, 37)
    x += w + 4
  }
  if (s.axe > 0) pip(`AXE ×${s.axe}`, '#dfe4e8')
  if (st.boarding) pip('BOARD', '#ff8f7a')
  if (st.fairy) pip('FAIRY', '#ffb3d9')
  if (st.cursed) pip('CURSED', '#c86bff')
}

/* ── Sprites ──────────────────────────────────────
   Drawn as pixel grids rather than stacked rectangles and arcs. A person
   assembled from three boxes reads as three boxes at any size; the same
   silhouette drawn on a grid with an outline, a face and a run cycle
   reads as a person immediately. Two screen pixels per sprite pixel,
   snapped to integers so no seams open up between cells. */
const PIX = 2

const PAL = {
  K: '#20140c', // outline
  S: '#f2c088', // skin
  H: '#3b2415', // hair
  W: '#ffffff',
  R: '#e0453a', // shirt
  B: '#2f6fd0', // shorts
  G: '#46a83c', // shell
  D: '#2c6b26', // shell markings
  Y: '#8fc653', // turtle skin
  N: '#2b2f42', // crow
  O: '#e8a33d', // beak
  P: '#7b3fa0', // eggplant
}

function stamp(g, rows, cx, baseY) {
  const w = rows[0].length
  const h = rows.length
  g.save()
  g.translate(Math.round(cx), Math.round(baseY))
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x]
      if (ch === '.') continue
      g.fillStyle = PAL[ch]
      g.fillRect((x - w / 2) * PIX, (y - h) * PIX, PIX, PIX)
    }
  }
  g.restore()
}

const BODY = [
  '...KKKK...',
  '..KHHHHK..',
  '.KHHHHHHK.',
  '.KHSSSSHK.',
  '.KSWSSWSK.',
  '.KSSSSSSK.',
  '..KSSSSK..',
  '.KRRRRRRK.',
  'KSRRRRRRSK',
  'KSRRRRRRSK',
  '.KRRRRRRK.',
  '..KBBBBK..',
]

const RUN_A = [...BODY, '..KB..BK..', '.KK....KK.']
const RUN_B = [...BODY, '.KB....BK.', 'KK......KK']
const AIR = [...BODY, '.KBB..BBK.', '.KK....KK.']

const TURTLE = [
  '......KKKKK...',
  '....KKGGGGGKK.',
  '...KGGGGGGGGGK',
  '..KKGDGGDGGDGK',
  '.KYYKGGGGGGGGK',
  'KYWYKGGGGGGGGK',
  'KYYYKGGGGGGGGK',
  '.KKKKKGGGGGGK.',
  '....KYK..KYK..',
  '....KKK..KKK..',
]

/* Two wing frames, because a bird holding one pose reads as a kite. */
const CROW_A = [
  '..KK....KK..',
  '.KNNK..KNNK.',
  '.KNNNKKNNNK.',
  'KOWNNNNNNNK.',
  'KOKNNNNNNK..',
  '..KKNNNNK...',
  '....KKKK....',
]

const CROW_B = [
  '............',
  '...KK..KK...',
  '..KNNKKNNK..',
  'KOWNNNNNNNK.',
  'KOKNNNNNNNK.',
  '.KKNNNNNNK..',
  '..KKNKKNKK..',
]

function turtle(g, x, y) {
  stamp(g, TURTLE, x, y + BOX.turtle[1] / 2)
}

function crow(g, x, y, now, seed) {
  const flap = Math.floor((now + seed * 200) / 130) % 2
  stamp(g, flap ? CROW_A : CROW_B, x, y + BOX.crow[1] / 2)
}

function eggplant(g, x, y) {
  g.fillStyle = PAL.P
  g.beginPath()
  g.ellipse(x, y, 6, 8, 0.3, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#3f8f3a'
  g.fillRect(x + 2, y - 10, 3, 5)
}

function axe(g, x, y, spin) {
  g.save()
  g.translate(Math.round(x), Math.round(y))
  g.rotate(spin)
  g.fillStyle = '#6b4423'
  g.fillRect(-1.5, -8, 3, 16)
  g.fillStyle = '#c8ced4'
  g.fillRect(-7, -8, 7, 7)
  g.fillStyle = '#8b939b'
  g.fillRect(-7, -1, 7, 2)
  g.restore()
}

function coconut(g, x, y, armed) {
  if (armed) {
    /* A shadow that tightens as it drops. Without it the first coconut
       of a run is an ambush rather than an obstacle. */
    const k = Math.min(1, Math.max(0, (y - (GROUND - 150)) / 142))
    g.save()
    g.globalAlpha = 0.15 + k * 0.35
    g.fillStyle = '#000'
    g.beginPath()
    g.ellipse(x, GROUND + 3, 11 - k * 4, 3.5 - k, 0, 0, Math.PI * 2)
    g.fill()
    g.restore()
  }
  g.fillStyle = '#6b4423'
  g.beginPath()
  g.arc(x, y, 8, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#4a2d16'
  g.fillRect(x - 3, y - 3, 2, 2)
  g.fillRect(x + 1, y - 3, 2, 2)
  g.fillRect(x - 1, y + 1, 2, 2)
}

function palm(g, x, y, h) {
  g.fillStyle = '#2f7d3a'
  g.fillRect(x - 3, y - h, 6, h)
  g.beginPath()
  for (let i = 0; i < 5; i++) {
    const a = Math.PI + (i / 4) * Math.PI
    g.moveTo(x, y - h)
    g.quadraticCurveTo(x + Math.cos(a) * 22, y - h - 14, x + Math.cos(a) * 34, y - h + 6)
    g.quadraticCurveTo(x + Math.cos(a) * 20, y - h - 4, x, y - h)
  }
  g.fill()
}

function rock(g, x, y) {
  g.fillStyle = '#6f6f78'
  g.fillRect(x - 11, y - 12, 22, 24)
  g.fillStyle = '#8e8e99'
  g.fillRect(x - 11, y - 12, 22, 5)
  g.fillStyle = '#4a4a52'
  g.fillRect(x - 5, y - 2, 7, 6)
}

function fire(g, x, y, now, seed) {
  const f = Math.sin(now / 70 + seed)
  g.fillStyle = '#ff7a1a'
  g.beginPath()
  g.moveTo(x - 9, y + 14)
  g.lineTo(x + 9, y + 14)
  g.lineTo(x, y - 14 - f * 4)
  g.closePath()
  g.fill()
  g.fillStyle = '#ffd24a'
  g.beginPath()
  g.moveTo(x - 4, y + 14)
  g.lineTo(x + 4, y + 14)
  g.lineTo(x, y - 2 - f * 3)
  g.closePath()
  g.fill()
}

function fruit(g, x, y, now, seed) {
  const b = Math.sin(now / 260 + seed) * 3
  g.fillStyle = '#ffd23f'
  g.beginPath()
  g.ellipse(x, y + b, 8, 6, 0.5, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#3f8f3a'
  g.fillRect(x + 4, y - 6 + b, 3, 5)
}

function egg(g, x, y) {
  g.fillStyle = '#f4f0e2'
  g.beginPath()
  g.ellipse(x, y + 2, 9, 11, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#d8b45a'
  g.fillRect(x - 9, y + 1, 18, 3)
}

function runner(g, x, y, grounded, now, st) {
  let base = y

  if (st.boarding) {
    g.fillStyle = '#e0453a'
    g.fillRect(Math.round(x) - 13, Math.round(y) - 5, 26, 4)
    g.fillStyle = '#20140c'
    g.fillRect(Math.round(x) - 11, Math.round(y) - 1, 5, 3)
    g.fillRect(Math.round(x) + 6, Math.round(y) - 1, 5, 3)
    base = y - 5
  }

  if (st.fairy) {
    g.save()
    g.globalAlpha = 0.35 + Math.sin(now / 90) * 0.2
    g.fillStyle = '#ffb3d9'
    g.beginPath()
    g.ellipse(x, base - 14, 17, 21, 0, 0, Math.PI * 2)
    g.fill()
    g.restore()
  }

  const frame = !grounded || st.boarding ? AIR : Math.floor(now / 110) % 2 ? RUN_B : RUN_A
  stamp(g, frame, x, base)

  /* Carried in the near hand, so you can tell at a glance whether the
     last hit cost you the weapon. */
  if (st.axe) {
    g.fillStyle = '#6b4423'
    g.fillRect(Math.round(x) + 8, Math.round(base) - 22, 2, 11)
    g.fillStyle = '#c8ced4'
    g.fillRect(Math.round(x) + 7, Math.round(base) - 24, 6, 5)
  }
}
