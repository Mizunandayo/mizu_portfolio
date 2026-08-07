import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { TRACKS } from '../../data/music.js'
import { useMode } from '../../hooks/useMode.jsx'

/* ══════════════════════════════════════════════════
   Music player — floating, draggable, collapsible.

   Ported from the vengenceui player, rebuilt without
   its dependencies: lucide-react becomes inline SVG
   and the Tailwind utility soup becomes -mizu classes,
   so this costs nothing on top of the three packages
   the site already ships.

   Added on top of the original: drag with a remembered
   position, a volume control, Spotify's three-state
   repeat, and a collapsed state that is just the cover.
   ══════════════════════════════════════════════════ */

const POS = 'mizu-player-pos'
const VOL = 'mizu-player-vol'
const WIDE = 'mizu-player-w'
const MIN_W = 300
const MAX_W = 720
const THRESHOLD = 6      // px of travel before a press becomes a drag
const EDGE = 14          // keeps the player off the viewport edge

/* Spotify's cycle: through the list, round the list, stuck on one. */
const LOOPS = ['off', 'all', 'one']

const fmt = (s) => {
  if (!Number.isFinite(s) || s < 0) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export default function MusicPlayer({ startId, onClose }) {
  const { isRecruiter } = useMode()
  const first = Math.max(0, TRACKS.findIndex((t) => t.id === startId))

  const [index, setIndex] = useState(first)
  const [playing, setPlaying] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [missing, setMissing] = useState(false)
  const [loop, setLoop] = useState('all')
  /* Quiet by default. This starts playing the moment the greeting is
     dismissed, so it arrives underneath what someone is reading rather
     than over it. A saved value still wins. */
  const [volume, setVolume] = useState(0.25)
  const [muted, setMuted] = useState(false)
  const [pos, setPos] = useState(null)
  const [drag, setDrag] = useState(null)
  const [width, setWidth] = useState(null)
  const sizeRef = useRef(null)
  const audioRef = useRef(null)
  const rootRef = useRef(null)
  const wantPlay = useRef(true)
  const startRef = useRef(null)
  const movedRef = useRef(false)
  const track = TRACKS[index]

  /* The playlist is offered by the greeting, which recruiter mode never
     shows — so switching into it takes the sound with it. Silenced and
     hidden rather than closed: the player keeps its track, its position
     and where it was dragged to, so coming back lands exactly where the
     visitor left off.

     Closing it was throwing all of that away. The greeting is the only
     way to choose a track and it runs once a session, so a player
     unmounted here could not be got back at all. */
  const resume = useRef(false)

  useEffect(() => {
    const a = audioRef.current
    if (!a) return

    if (isRecruiter) {
      resume.current = !a.paused
      a.pause()
      return
    }

    /* The mode toggle is a real click, so this play() carries the user
       activation the autoplay policy asks for. */
    if (resume.current) a.play().catch(() => {})
  }, [isRecruiter])


  
  /* ── Restore position and volume ───────────────── */
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(POS) || 'null')
      if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) setPos(p)
      const w = Number(localStorage.getItem(WIDE))
      if (Number.isFinite(w) && w >= MIN_W && w <= MAX_W) setWidth(w)
      const v = Number(localStorage.getItem(VOL))
      if (Number.isFinite(v) && v >= 0 && v <= 1) setVolume(v)
    } catch { /* private mode — defaults are fine */ }
  }, [])

  /* ── Load and play ─────────────────────────────── */
  useEffect(() => {
    const a = audioRef.current
    if (!a || !track) return
    setMissing(false)
    setTime(0)
    a.src = track.src
    a.load()
    if (wantPlay.current) a.play().catch(() => { /* autoplay policy */ })
  }, [index, track])

  /* Volume lives on the element, not in the markup — React would
     otherwise reset it to the attribute on every re-render. */
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.volume = muted ? 0 : volume
  }, [volume, muted])

  const toggle = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    if (playing) { wantPlay.current = false; a.pause() }
    else { wantPlay.current = true; a.play().catch(() => {}) }
  }, [playing])

  /* Manual skips always keep playing, which is why the intent is a ref
     rather than being read back off the element. */
  const step = useCallback((d) => {
    wantPlay.current = true
    setIndex((i) => (i + d + TRACKS.length) % TRACKS.length)
  }, [])

  /* `loop: one` is handled by the element itself, so this only fires
     for the other two modes. */
  const onEnded = useCallback(() => {
    if (loop === 'off' && index === TRACKS.length - 1) {
      wantPlay.current = false
      setPlaying(false)
      return
    }
    step(1)
  }, [loop, index, step])

  const cycleLoop = () => setLoop((l) => LOOPS[(LOOPS.indexOf(l) + 1) % LOOPS.length])

  const setVol = (v) => {
    setVolume(v)
    if (v > 0) setMuted(false)
    try { localStorage.setItem(VOL, String(v)) } catch { /* ignore */ }
  }

  const seek = (e) => {
    const a = audioRef.current
    if (!a || !duration) return
    const r = e.currentTarget.getBoundingClientRect()
    a.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * duration
  }

  /* ── Drag ──────────────────────────────────────── */
  const onPointerDown = (e) => {
    if (e.button !== 0) return
    /* Collapsed, the cover IS the control — excluding buttons here
       would make the minimised player undraggable. The move threshold
       is what separates a click from a drag instead. */
    if (!collapsed && e.target.closest('button, input, [role="slider"]')) return
    const box = rootRef.current.getBoundingClientRect()
    startRef.current = {
      x: e.clientX, y: e.clientY, id: e.pointerId, el: e.currentTarget,
      dx: e.clientX - box.left, dy: e.clientY - box.top,
      w: box.width, h: box.height,
    }
    movedRef.current = false
  }

  const onPointerMove = (e) => {
    const s = startRef.current
    if (!s) return
    if (!movedRef.current) {
      if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < THRESHOLD) return
      movedRef.current = true
      /* Captured only once it is really a drag — capturing on pointerdown
         retargets the click and the transport buttons stop working. */
      s.el.setPointerCapture(s.id)
    }
    /* Clamped so the player can never be dropped off-screen where it
       could not be dragged back. */
    const { clientWidth: vw, clientHeight: vh } = document.documentElement
    setDrag({
      x: Math.min(Math.max(EDGE, vw - s.w - EDGE), Math.max(EDGE, e.clientX - s.dx)),
      y: Math.min(Math.max(EDGE, vh - s.h - EDGE), Math.max(EDGE, e.clientY - s.dy)),
    })
  }

  /* ── Resize ──────────────────────────────────────
     Dragging either edge changes the width. The left edge also moves
     the origin, so the opposite edge stays put instead of the whole
     player sliding as it grows. */
  const onResizeDown = (side) => (e) => {
    e.stopPropagation()
    const box = rootRef.current.getBoundingClientRect()
    sizeRef.current = { x: e.clientX, w: box.width, left: box.left, top: box.top, side }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onResizeMove = (e) => {
    const r = sizeRef.current
    if (!r) return
    e.stopPropagation()
    const d = e.clientX - r.x
    const next = Math.min(MAX_W, Math.max(MIN_W, r.side === 'r' ? r.w + d : r.w - d))
    setWidth(next)
    if (r.side === 'l') setPos({ x: r.left + (r.w - next), y: r.top })
  }

  const onResizeUp = (e) => {
    e.stopPropagation()
    if (sizeRef.current && width) {
      try {
        localStorage.setItem(WIDE, String(width))
        if (pos) localStorage.setItem(POS, JSON.stringify(pos))
      } catch { /* ignore */ }
    }
    sizeRef.current = null
  }

  const onPointerUp = () => {
    if (movedRef.current && drag) {
      setPos(drag)
      try { localStorage.setItem(POS, JSON.stringify(drag)) } catch { /* ignore */ }
    }
    startRef.current = null
    setDrag(null)
  }

  /* Kept reachable whenever the player's own size changes under it.
     Expanding while parked at the right edge would otherwise put most of
     the panel past the viewport, transport buttons included, with no way
     to drag it back. Measured after layout so the real size is known,
     and guarded so it does not loop on its own update. */
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el || !pos || drag) return

    const settle = () => {
      const { width: w, height: h } = el.getBoundingClientRect()
      const { clientWidth: vw, clientHeight: vh } = document.documentElement
      const x = Math.min(Math.max(EDGE, vw - w - EDGE), Math.max(EDGE, pos.x))
      const y = Math.min(Math.max(EDGE, vh - h - EDGE), Math.max(EDGE, pos.y))
      if (x !== pos.x || y !== pos.y) setPos({ x, y })
    }

    settle()
    window.addEventListener('resize', settle)
    return () => window.removeEventListener('resize', settle)
  }, [collapsed, width, pos, drag])

  if (!track) return null

  const at = drag ?? pos
  const place = at ? { left: `${at.x}px`, top: `${at.y}px`, right: 'auto', bottom: 'auto' } : {}
  const style = {
    ...place,
    ...(width && !collapsed ? { width: `${width}px` } : {}),
  }

  const pct = duration > 0 ? (time / duration) * 100 : 0
  const audio = (
    <audio
      ref={audioRef}
      preload="metadata"
      loop={loop === 'one'}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      onEnded={onEnded}
      onError={() => { setMissing(true); setPlaying(false) }}
    />
  )

  /* ── Collapsed: the cover, and nothing else ────── */
  if (collapsed) {
    return (
      <div
        ref={rootRef}
        className={`mp-mizu is-collapsed${drag ? ' is-dragging' : ''}`}
        style={style}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {audio}
        <button
          type="button"
          className="mp-mini-mizu"
          onClick={() => { if (movedRef.current) return; setCollapsed(false) }}
          aria-label={`Expand player — ${track.title}`}
        >
          <img src={track.cover} alt="" draggable="false" />
          <span className={`mp-mini-eq-mizu${playing ? ' is-on' : ''}`} aria-hidden="true">
            <i /><i /><i />
          </span>
        </button>
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className={`mp-mizu${drag ? ' is-dragging' : ''}`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {audio}

      <button
        type="button"
        className="mp-toggle-mizu"
        onClick={() => setCollapsed(true)}
        aria-label="Collapse player"
      >
        <IconMinus />
      </button>

      <button type="button" className="mp-close-mizu" onClick={onClose} aria-label="Close player">
        <IconClose />
      </button>

      <img
        className="mp-cover-mizu"
        src={track.cover}
        alt=""
        aria-hidden="true"
        draggable="false"
      />

      {/* Edge grips. Their own pointer handlers, and stopPropagation on
          each, or a resize also drags the player. */}
      {['l', 'r'].map((side) => (
        <span
          key={side}
          className={`mp-grip-mizu is-${side}`}
          onPointerDown={onResizeDown(side)}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeUp}
          onPointerCancel={onResizeUp}
          aria-hidden="true"
        />
      ))}

      <div className="mp-bar-mizu">
        <span className={`mp-eq-mizu${playing ? ' is-on' : ''}`} aria-hidden="true">
          <i /><i /><i /><i />
        </span>

        <div className="mp-meta-mizu">
          <span className="mp-title-mizu">{track.title}</span>
          <span className="mp-artist-mizu">
            {missing ? 'Track unavailable' : track.artist}
          </span>
        </div>

        <div className="mp-transport-mizu">
          <button type="button" onClick={() => step(-1)} aria-label="Previous track">
            <IconPrev />
          </button>
          <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <IconPause /> : <IconPlay />}
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Next track">
            <IconNext />
          </button>

          <button
            type="button"
            className={`mp-loop-mizu${loop !== 'off' ? ' is-on' : ''}`}
            onClick={cycleLoop}
            aria-label={`Repeat: ${loop}`}
            title={`Repeat: ${loop}`}
          >
            <IconLoop />
            {loop === 'one' && <span className="mp-loop-one-mizu" aria-hidden="true">1</span>}
          </button>
        </div>

        <div className="mp-vol-mizu">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted || volume === 0 ? <IconMute /> : <IconVol />}
          </button>

          {/* A native range: keyboard, screen readers and touch for free. */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={muted ? 0 : volume}
            onChange={(e) => setVol(Number(e.target.value))}
            aria-label="Volume"
          />
        </div>

        <div
          role="slider"
          className="mp-seek-mizu"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration) || 0}
          aria-valuenow={Math.round(time)}
          aria-valuetext={`${fmt(time)} of ${fmt(duration)}`}
          tabIndex={0}
          onClick={seek}
          onKeyDown={(e) => {
            const a = audioRef.current
            if (!a || !duration) return
            if (e.key === 'ArrowRight') a.currentTime = Math.min(duration, time + 5)
            if (e.key === 'ArrowLeft') a.currentTime = Math.max(0, time - 5)
          }}
        >
          <span className="mp-seek-track-mizu">
            <span className="mp-seek-fill-mizu" style={{ width: `${pct}%` }} />
          </span>
        </div>
      </div>
    </div>
  )
}

/* Inline rather than an icon package — nine glyphs is not worth one. */
const S = { width: 15, height: 15, viewBox: '0 0 24 24', 'aria-hidden': 'true' }
const L = { ...S, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

const IconPlay  = () => <svg {...S} fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
const IconPause = () => <svg {...S} fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
const IconPrev  = () => <svg {...S} fill="currentColor"><path d="M6 6h2v12H6zM20 6v12l-9-6z" /></svg>
const IconNext  = () => <svg {...S} fill="currentColor"><path d="M16 6h2v12h-2zM4 6l9 6-9 6z" /></svg>
const IconMinus = () => <svg {...L}><path d="M5 12h14" /></svg>
const IconClose = () => <svg {...L}><path d="m6 6 12 12M18 6 6 18" /></svg>
const IconLoop  = () => <svg {...L}><path d="M17 2l4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></svg>
const IconVol   = () => <svg {...L}><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></svg>
const IconMute  = () => <svg {...L}><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="m23 9-6 6M17 9l6 6" /></svg>
