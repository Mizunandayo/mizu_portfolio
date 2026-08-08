import { useCallback, useEffect, useRef, useState } from 'react'

/* 蛇 — snake, played straight. */

const CELL = 20
const COLS = 22
const ROWS = 14
const PAD = 10 // the blue surround, in px

const W = COLS * CELL + PAD * 2
const H = ROWS * CELL + PAD * 2

const TICK_FROM = 145 // ms per step at the start
const TICK_TO = 70
const TICK_EVERY = 4 // it quickens every N apples

const START_LEN = 4

export default function Hebi({ onScore, onState }) {
  const ref = useRef(null)
  const sim = useRef(null)
  const raf = useRef(0)
  const [hud, setHud] = useState({ score: 0, len: START_LEN })
  const phaseRef = useRef('ready')

  const setPhaseBoth = (p) => {
    phaseRef.current = p
    onState?.(p)
  }

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current)
    raf.current = 0
  }, [])

  const fresh = useCallback(() => {
    const y = Math.floor(ROWS / 2)
    const body = []
    for (let i = 0; i < START_LEN; i++) body.push({ x: 6 - i, y })
    const s = {
      body,
      dir: { x: 1, y: 0 },
      queue: [],
      apple: { x: 15, y },
      score: 0,
      eaten: 0,
      acc: 0,
      last: performance.now(),
      grow: 0,
      dead: false,
    }
    place(s)
    return s
  }, [])

  const paint = useCallback(() => {
    const c = ref.current
    if (c && sim.current) draw(c.getContext('2d'), sim.current)
  }, [])

  /* Attract frame: an unstarted cabinet showing black reads as broken. */
  useEffect(() => {
    sim.current = fresh()
    paint()
  }, [fresh, paint])

  const loop = useCallback(() => {
    const s = sim.current
    if (!s) return
    const now = performance.now()
    s.acc += Math.min(now - s.last, 100)
    s.last = now

    const rate = Math.max(TICK_TO, TICK_FROM - Math.floor(s.eaten / TICK_EVERY) * 9)

    while (s.acc >= rate) {
      s.acc -= rate
      step(s)
      if (s.dead) {
        paint()
        stop()
        setPhaseBoth('done')
        onScore?.(s.score)
        return
      }
    }

    paint()
    setHud({ score: s.score, len: s.body.length })
    raf.current = requestAnimationFrame(loop)
  }, [onScore, paint, stop])

  const begin = useCallback(() => {
    sim.current = fresh()
    setHud({ score: 0, len: START_LEN })
    setPhaseBoth('run')
    stop()
    raf.current = requestAnimationFrame(loop)
  }, [fresh, loop, stop])

  useEffect(() => () => stop(), [stop])

  const turn = (x, y) => {
    const s = sim.current
    if (!s || phaseRef.current !== 'run') return
    /* Against the last queued turn, or two inside one tick double back. */
    const prev = s.queue.length ? s.queue[s.queue.length - 1] : s.dir
    if (prev.x === -x && prev.y === -y) return
    if (prev.x === x && prev.y === y) return
    if (s.queue.length < 2) s.queue.push({ x, y })
  }

  const press = (e) => {
    const k = e.code
    if (k === 'ArrowUp' || k === 'KeyW') turn(0, -1)
    else if (k === 'ArrowDown' || k === 'KeyS') turn(0, 1)
    else if (k === 'ArrowLeft' || k === 'KeyA') turn(-1, 0)
    else if (k === 'ArrowRight' || k === 'KeyD') turn(1, 0)
    else if (k === 'Space' || k === 'Enter') {
      if (phaseRef.current !== 'run') begin()
    } else return
    e.preventDefault()
    e.stopPropagation()
  }

  /* Swipe: a drawn d-pad would cover the board. */
  const touch = useRef(null)
  const onDown = (e) => {
    if (phaseRef.current !== 'run') return begin()
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY }
  }
  const onMove = (e) => {
    const a = touch.current
    if (!a) return
    const t = e.touches[0]
    const dx = t.clientX - a.x
    const dy = t.clientY - a.y
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0)
    else turn(0, dy > 0 ? 1 : -1)
    touch.current = { x: t.clientX, y: t.clientY }
  }

  return (
    <div
      className="ar-hebi-mizu"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => !e.repeat && press(e)}
      onTouchStart={onDown}
      onTouchMove={onMove}
      onTouchEnd={() => { touch.current = null }}
      onClick={() => phaseRef.current !== 'run' && begin()}
      aria-label="Snake. Arrow keys to turn."
    >
      <canvas ref={ref} width={W} height={H} className="ar-canvas-mizu" />

      <span className="ar-touge-dist-mizu">
        {hud.score.toLocaleString()}
        <i>length {hud.len}</i>
      </span>

    </div>
  )
}

function step(s) {
  if (s.queue.length) s.dir = s.queue.shift()

  const head = s.body[0]
  const next = { x: head.x + s.dir.x, y: head.y + s.dir.y }

  if (next.x < 0 || next.y < 0 || next.x >= COLS || next.y >= ROWS) {
    s.dead = true
    return
  }
  /* The tail vacates this tick, so entering it is legal. */
  const last = s.body.length - 1
  for (let i = 0; i < s.body.length; i++) {
    if (i === last && !s.grow) continue
    if (s.body[i].x === next.x && s.body[i].y === next.y) {
      s.dead = true
      return
    }
  }

  s.body.unshift(next)
  if (s.grow > 0) s.grow -= 1
  else s.body.pop()

  if (next.x === s.apple.x && next.y === s.apple.y) {
    s.eaten += 1
    s.grow += 2
    s.score += 10 + Math.floor(s.eaten / TICK_EVERY) * 2
    place(s)
  }
}

function place(s) {
  const free = []
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!s.body.some((b) => b.x === x && b.y === y)) free.push({ x, y })
    }
  }
  if (free.length) s.apple = free[Math.floor(Math.random() * free.length)]
}

function draw(g, s) {
  g.fillStyle = '#1d3a5c'
  g.fillRect(0, 0, W, H)
  g.fillStyle = '#000'
  g.fillRect(PAD, PAD, COLS * CELL, ROWS * CELL)

  const cell = (x, y, fill, edge) => {
    const px = PAD + x * CELL
    const py = PAD + y * CELL
    g.fillStyle = edge
    g.fillRect(px, py, CELL, CELL)
    g.fillStyle = fill
    g.fillRect(px + 2, py + 2, CELL - 4, CELL - 4)
  }

  cell(s.apple.x, s.apple.y, '#ff2b2b', '#000')
  for (let i = 0; i < s.body.length; i++) {
    const b = s.body[i]
    cell(b.x, b.y, i === 0 ? '#7dff5a' : '#22c516', '#000')
  }
}
