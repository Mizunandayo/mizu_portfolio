import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PROFILE } from '../../data/profile.js'

/* ══════════════════════════════════════════════════
   Ticket — the visitor's 入場券, theirs to decorate.

   Drawn rather than screenshotted. The DOM-capture
   libraries re-implement CSS and would get this panel
   wrong in exactly the places it is interesting — the
   punched notches are a mask, the lift is a filter —
   besides costing ~200 KB to do it badly.

   Two surfaces, one coordinate space. The stage is DOM
   so dragging is cheap and hit-testing is free; the
   download is canvas. Both address the same logical
   grid, so what is arranged is what is exported.

   The ticket is painted into its own offscreen canvas
   before being composited. Its notches are cut with
   destination-out, which erases whatever is already on
   the surface — done in place, it would punch holes
   through any sticker overhanging that edge.
   ══════════════════════════════════════════════════ */

/* Logical units. The ticket is W×H; the export adds a margin so a
   sticker can hang off the edge and still be in the picture. */
const W = 1100
const H = 520
const M = 130
const OUT_W = W + M * 2
const OUT_H = H + M * 2
const DPR = 2

const STUB = 330
const PAD = 56
const NOTCH = 15

/* How far a sticker must overlap the ticket. "Touching" is enforced by
   clamping rather than rejecting: a drag that wanders off stops at the
   edge instead of snapping back, which is far less annoying. */
const GRIP = 16

const SIZE = 190
const MIN_S = 70
const MAX_S = 460

/* Generated from a count rather than listed, so adding artwork is a
   one-number change. Any that fail to load are dropped at runtime — the
   set has had gaps in it, and a numbered range cannot know about them.
   That also means the count is an upper bound, not a promise. */
const STICKER_COUNT = 50
const STICKERS = Array.from(
  { length: STICKER_COUNT },
  (_, i) => `/profile/stickers/s${i + 1}.png`
)

const SANS = "'Poppins', system-ui, sans-serif"
const MINCHO = "'Shippori Mincho', 'Yu Mincho', serif"
const MSG_MAX = 500
/* The band the message gets: first baseline to last, clear of the
   footer line. The type shrinks to fit inside it rather than the text
   being cut, so a full 500 characters still lands whole. */
const MSG_TOP = 306
const MSG_BOTTOM = H - 70

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

/* Stable per visitor, so re-issuing the same name gives the same ticket
   rather than a new random one each time. */
function serialOf(name) {
  let h = 0
  for (const ch of name.trim().toUpperCase()) h = (h * 31 + ch.codePointAt(0)) >>> 0
  return String((h % 9000) + 1000)
}

function stamped(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

/* The code down the stub: MZ plus the day it was issued. Exported
   because the greeting prints the same stub, and two hardcoded strings
   would eventually say different things. */
export function ticketStamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `MZ-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/* Greedy wrap. Canvas has no text layout of its own — measureText is
   the only tool, so the lines are built by hand.

   Word breaking alone is not enough: a token longer than the column has
   no space to break at, and a greedy pass emits it as a single line
   that runs straight off the ticket. Anything pasted without spaces —
   a URL, a keysmash — does exactly that, so an over-long token falls
   back to breaking by character, which is what CSS calls break-word. */
function wrapLines(c, text, maxW) {
  const out = []

  for (const para of text.split('\n')) {
    let line = ''

    for (const word of para.split(/\s+/)) {
      if (!word) continue

      if (c.measureText(word).width > maxW) {
        if (line) {
          out.push(line)
          line = ''
        }
        let chunk = ''
        /* for..of walks code points, so a surrogate pair or a CJK glyph
           is never split down the middle. */
        for (const ch of word) {
          if (chunk && c.measureText(chunk + ch).width > maxW) {
            out.push(chunk)
            chunk = ch
          } else {
            chunk += ch
          }
        }
        line = chunk
        continue
      }

      const test = line ? `${line} ${word}` : word
      if (line && c.measureText(test).width > maxW) {
        out.push(line)
        line = word
      } else {
        line = test
      }
    }

    out.push(line)
  }

  return out
}

/* Contain-fit, so a sticker that is not square keeps its shape inside
   the square box the stage draws it in. */
function containRect(iw, ih, box) {
  const k = Math.min(box / iw, box / ih)
  const w = iw * k
  const h = ih * k
  return { w, h, dx: (box - w) / 2, dy: (box - h) / 2 }
}

/* ── The ticket itself, at 0,0 in logical units ───── */
function paintTicket(c, { art, name, serial, mode, message }) {
  /* One instant for both places the date appears. Reading the clock
     twice would let a ticket issued at midnight print one day on the
     stub and the next in the body. */
  const issued = new Date()

  c.fillStyle = '#0b0b0c'
  c.fillRect(0, 0, W, H)

  if (art?.naturalWidth) {
    const k = Math.max(STUB / art.naturalWidth, H / art.naturalHeight)
    const sw = STUB / k
    const sh = H / k
    c.drawImage(
      art,
      (art.naturalWidth - sw) / 2,
      (art.naturalHeight - sh) * 0.26,
      sw,
      sh,
      0,
      0,
      STUB,
      H
    )
  }

  const veil = c.createLinearGradient(0, H * 0.42, 0, H)
  veil.addColorStop(0, 'rgba(4,4,5,0)')
  veil.addColorStop(1, 'rgba(4,4,5,0.94)')
  c.fillStyle = veil
  c.fillRect(0, H * 0.42, STUB, H * 0.58)

  /* Tategaki: one glyph per line down a column. Canvas has no
     writing-mode, so the column is placed by hand. */
  c.fillStyle = '#fafafa'
  c.font = `800 26px ${MINCHO}`
  c.textAlign = 'left'
  c.textBaseline = 'alphabetic'
  ;[...'ようこそ'].forEach((ch, i) => c.fillText(ch, 30, H - 132 + i * 34))

  c.font = `700 12px ${SANS}`
  c.letterSpacing = '0.2em'
  c.fillStyle = 'rgba(250,250,250,0.66)'
  c.textAlign = 'right'
  c.fillText(ticketStamp(issued), STUB - 22, H - 26)
  c.letterSpacing = '0px'

  c.strokeStyle = 'rgba(250,250,250,0.42)'
  c.lineWidth = 1
  c.setLineDash([5, 8])
  c.beginPath()
  c.moveTo(STUB + 0.5, NOTCH)
  c.lineTo(STUB + 0.5, H - NOTCH)
  c.stroke()
  c.setLineDash([])

  const x = STUB + PAD
  const right = W - PAD

  c.textAlign = 'left'
  c.fillStyle = '#fafafa'
  c.font = `800 26px ${MINCHO}`
  c.fillText('入場券', x, 76)

  c.font = `700 13px ${SANS}`
  c.letterSpacing = '0.22em'
  c.fillStyle = 'rgba(161,161,170,0.9)'
  c.fillText('ADMIT ONE', x + 104, 74)

  c.textAlign = 'right'
  c.fillText(`NO. ${serial}`, right, 74)
  c.letterSpacing = '0px'

  const rule = (y) => {
    c.strokeStyle = 'rgba(250,250,250,0.16)'
    c.lineWidth = 1
    c.beginPath()
    c.moveTo(x, y + 0.5)
    c.lineTo(right, y + 0.5)
    c.stroke()
  }
  rule(100)

  c.textAlign = 'left'
  c.font = `700 12px ${SANS}`
  c.letterSpacing = '0.22em'
  c.fillStyle = 'rgba(161,161,170,0.85)'
  c.fillText('氏名 / NAME', x, 148)
  c.letterSpacing = '0px'

  /* Shrink to fit rather than clip — a long name is the one thing
     guaranteed to overflow this line. */
  const upper = name.toUpperCase()
  let size = 54
  c.font = `800 ${size}px ${SANS}`
  while (c.measureText(upper).width > right - x && size > 20) {
    size -= 2
    c.font = `800 ${size}px ${SANS}`
  }
  c.fillStyle = '#fafafa'
  c.fillText(upper, x, 202)

  rule(232)

  if (mode === 'message' && message.trim()) {
    c.font = `700 12px ${SANS}`
    c.letterSpacing = '0.22em'
    c.fillStyle = 'rgba(161,161,170,0.85)'
    c.fillText('一言 / MESSAGE', x, 276)
    c.letterSpacing = '0px'

    /* Shrink to fit, the same way the name line does. Wrapping depends
       on the size and the size depends on the wrap, so it is settled by
       trying each step down until the block fits the band — six or so
       measurements, once, on a canvas nobody is watching. */
    const body = message.trim()
    const room = MSG_BOTTOM - MSG_TOP
    let size = 17
    let lines = []
    let lh = 26

    for (; size >= 11; size -= 1) {
      c.font = `500 ${size}px ${SANS}`
      lines = wrapLines(c, body, right - x)
      lh = Math.round(size * 1.5)
      if ((lines.length - 1) * lh <= room) break
    }

    c.font = `500 ${size}px ${SANS}`
    c.fillStyle = 'rgba(244,244,245,0.95)'
    /* Even at the floor size an unbroken 500 characters can overrun, so
       the band is enforced once more rather than trusted. */
    lines
      .slice(0, Math.floor(room / lh) + 1)
      .forEach((line, i) => c.fillText(line, x, MSG_TOP + i * lh))
  } else {
    const rows = [
      ['発行日 / ISSUED', stamped(issued)],
      ['案内 / GUIDE', `${PROFILE.kanji}  ${PROFILE.name.toUpperCase()}`],
      ['席 / SEAT', 'GENERAL ADMISSION — ALL NINE PROJECTS'],
    ]
    rows.forEach(([k, v], i) => {
      const y = 278 + i * 40
      c.font = `700 12px ${SANS}`
      c.letterSpacing = '0.18em'
      c.fillStyle = 'rgba(161,161,170,0.8)'
      c.fillText(k, x, y)
      c.letterSpacing = '0px'
      c.font = `600 15px ${SANS}`
      c.fillStyle = 'rgba(244,244,245,0.94)'
      c.fillText(v, x + 190, y)
    })
  }

  c.font = `700 12px ${SANS}`
  c.letterSpacing = '0.18em'
  c.fillStyle = 'rgba(161,161,170,0.62)'
  c.fillText(PROFILE.contact.github.replace(/^https?:\/\//, ''), x, H - 42)
  c.letterSpacing = '0px'

  c.strokeStyle = 'rgba(250,250,250,0.24)'
  c.lineWidth = 1
  c.strokeRect(0.5, 0.5, W - 1, H - 1)

  /* destination-out cuts real transparency, so the notches read as
     punched on any background the PNG lands on. */
  c.globalCompositeOperation = 'destination-out'
  c.beginPath()
  c.arc(STUB, 0, NOTCH, 0, Math.PI * 2)
  c.arc(STUB, H, NOTCH, 0, Math.PI * 2)
  c.fill()
  c.globalCompositeOperation = 'source-over'
}

export default function Ticket({ open, name, art, onClose }) {
  const ref = useRef(null)
  const plateRef = useRef(null)
  const stageRef = useRef(null)
  const dragRef = useRef(null)
  const cacheRef = useRef(new Map())
  const seqRef = useRef(0)

  const [stickers, setStickers] = useState([])
  const [sel, setSel] = useState(null)
  const [mode, setMode] = useState('details')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [tray, setTray] = useState(false)
  /* A missing file otherwise shows the browser's broken-image glyph in
     the tray and pastes nothing onto the ticket. Recording the failure
     removes it from both places instead. */
  const [broken, setBroken] = useState(() => new Set())
  const pickRef = useRef(null)

  const usable = useMemo(
    () => STICKERS.filter((s) => !broken.has(s)),
    [broken]
  )

  const onBadSticker = useCallback((src) => {
    setBroken((prev) => {
      if (prev.has(src)) return prev
      const nextSet = new Set(prev)
      nextSet.add(src)
      return nextSet
    })
  }, [])

  const clean = (name || '').trim() || 'GUEST'
  const serial = useMemo(() => serialOf(clean), [clean])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  /* The picker sits on top of the editor, which is itself on top of the
     greeting. Modal dialogs stack in the top layer in open order, so
     three deep needs no z-index of its own. */
  useEffect(() => {
    const el = pickRef.current
    if (!el) return
    if (tray && !el.open) el.showModal()
    if (!tray && el.open) el.close()
  }, [tray])

  /* Closing the editor takes the picker with it — a dialog left open
     over a closed parent is unreachable. */
  useEffect(() => {
    if (!open) setTray(false)
  }, [open])

  /* Decoded once and kept. Re-decoding 19 PNGs on every repaint would
     make dragging stutter. */
  const loadImg = useCallback((src) => {
    const cache = cacheRef.current
    if (cache.has(src)) return cache.get(src)
    const p = new Promise((res) => {
      const im = new Image()
      im.onload = () => res(im)
      im.onerror = () => res(null)
      im.src = src
    })
    cache.set(src, p)
    return p
  }, [])

  const fonts = useCallback(async () => {
    /* Canvas does not participate in CSS font loading: an unloaded
       family silently falls back, so the download would come out in
       Arial while the page looked right. */
    try {
      await Promise.all([
        document.fonts.load(`800 52px ${SANS}`),
        document.fonts.load(`700 14px ${SANS}`),
        document.fonts.load(`500 17px ${SANS}`),
        document.fonts.load(`800 26px ${MINCHO}`),
      ])
      await document.fonts.ready
    } catch {
      /* fall back to whatever is resident */
    }
  }, [])

  /* ── Live plate ── */
  useEffect(() => {
    if (!open) return
    let dead = false
    ;(async () => {
      await fonts()
      const image = await loadImg(art)
      if (dead) return
      const canvas = plateRef.current
      if (!canvas) return
      canvas.width = W * DPR
      canvas.height = H * DPR
      const c = canvas.getContext('2d')
      c.scale(DPR, DPR)
      paintTicket(c, { art: image, name: clean, serial, mode, message })
    })()
    return () => {
      dead = true
    }
  }, [open, art, clean, serial, mode, message, fonts, loadImg])

  /* ── Stickers ── */
  /* Which artwork is currently on the ticket, so the tray can show it.
     A Set because this is read once per chip on every render. */
  const placed = useMemo(
    () => new Set(stickers.map((s) => s.src)),
    [stickers]
  )

  /* The chip is a toggle: off adds one, on clears every copy of that
     artwork. Removing only the newest copy would leave the chip lit
     with others still on the ticket, and "click again to remove" would
     then need several clicks to mean what it says.

     Written against `stickers` from render scope rather than inside the
     updater — a setState updater must stay pure, and seqRef would be
     double-incremented by StrictMode's second invocation. */
  const toggle = useCallback(
    (src) => {
      if (placed.has(src)) {
        setStickers((list) => list.filter((s) => s.src !== src))
        return
      }
      const key = seqRef.current++
      /* Cascaded rather than stacked, so adding several in a row does
         not bury them all under the last one. */
      const off = (key % 6) * 24 - 60
      setStickers((list) => [
        ...list,
        { key, src, x: M + W * 0.62 + off, y: M + H * 0.52 + off, s: SIZE, r: 0 },
      ])
      setSel(key)
    },
    [placed]
  )

  /* Selection follows the list. Anything that removes a sticker — the
     chip, the ✕, the Delete key, Clear — would otherwise leave `sel`
     pointing at a key that no longer exists. */
  useEffect(() => {
    if (sel !== null && !stickers.some((s) => s.key === sel)) setSel(null)
  }, [stickers, sel])

  const anchored = (st) => ({
    ...st,
    x: clamp(st.x, M + GRIP - st.s / 2, M + W - GRIP + st.s / 2),
    y: clamp(st.y, M + GRIP - st.s / 2, M + H - GRIP + st.s / 2),
  })

  const toLogical = (clientX, clientY) => {
    const r = stageRef.current.getBoundingClientRect()
    return {
      x: ((clientX - r.left) / r.width) * OUT_W,
      y: ((clientY - r.top) / r.height) * OUT_H,
    }
  }

  const onDown = (e, key, kind) => {
    e.stopPropagation()
    e.preventDefault()
    setSel(key)
    const st = stickers.find((s) => s.key === key)
    if (!st) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = toLogical(e.clientX, e.clientY)
    dragRef.current = {
      key,
      kind,
      p,
      base: { ...st },
      /* For the transform grip: where the pointer started relative to
         the sticker's centre, so rotation is a delta and the sticker
         does not jump to the cursor's angle on first move. */
      a0: Math.atan2(p.y - st.y, p.x - st.x),
      d0: Math.hypot(p.y - st.y, p.x - st.x) || 1,
    }
  }

  const onMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const p = toLogical(e.clientX, e.clientY)
    setStickers((list) =>
      list.map((st) => {
        if (st.key !== d.key) return st
        if (d.kind === 'move') {
          return anchored({
            ...st,
            x: d.base.x + (p.x - d.p.x),
            y: d.base.y + (p.y - d.p.y),
          })
        }
        const a = Math.atan2(p.y - st.y, p.x - st.x)
        const dist = Math.hypot(p.y - st.y, p.x - st.x)
        return anchored({
          ...st,
          s: clamp((dist / d.d0) * d.base.s, MIN_S, MAX_S),
          r: d.base.r + (a - d.a0),
        })
      })
    )
  }

  const onUp = (e) => {
    if (!dragRef.current) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
    dragRef.current = null
  }

  const remove = (key) => {
    setStickers((list) => list.filter((s) => s.key !== key))
    setSel(null)
  }

  /* Delete works from the keyboard too — a sticker selected by tabbing
     is otherwise impossible to get rid of. */
  useEffect(() => {
    if (!open || sel === null) return
    const onKey = (e) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      if (/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName)) return
      e.preventDefault()
      remove(sel)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, sel])

  /* ── Export ── */
  const download = async () => {
    setBusy(true)
    await fonts()
    const image = await loadImg(art)
    const loaded = await Promise.all(stickers.map((s) => loadImg(s.src)))

    /* The ticket goes on its own surface first: its notch punch uses
       destination-out, which would otherwise cut through any sticker
       already drawn over that edge. */
    const plate = document.createElement('canvas')
    plate.width = W * DPR
    plate.height = H * DPR
    const pc = plate.getContext('2d')
    pc.scale(DPR, DPR)
    paintTicket(pc, { art: image, name: clean, serial, mode, message })

    const out = document.createElement('canvas')
    out.width = OUT_W * DPR
    out.height = OUT_H * DPR
    const c = out.getContext('2d')
    c.scale(DPR, DPR)
    c.drawImage(plate, M, M, W, H)

    stickers.forEach((st, i) => {
      const im = loaded[i]
      if (!im) return
      const { w, h, dx, dy } = containRect(im.naturalWidth, im.naturalHeight, st.s)
      c.save()
      c.translate(st.x, st.y)
      c.rotate(st.r)
      c.drawImage(im, -st.s / 2 + dx, -st.s / 2 + dy, w, h)
      c.restore()
    })

    out.toBlob((blob) => {
      setBusy(false)
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mizu-ticket-${clean.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
      a.click()
      /* Deferred: revoking in the same tick can beat the download in
         some browsers and yield an empty file. */
      window.setTimeout(() => URL.revokeObjectURL(url), 60000)
    }, 'image/png')
  }

  const pct = (n, total) => `${(n / total) * 100}%`

  return (
    <>
    <dialog
      ref={ref}
      className="tk-mizu"
      aria-label="Your admission ticket"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <div className="tk-body-mizu">
        {/* ── Stage ── */}
        <div
          ref={stageRef}
          className="tk-stage-mizu"
          style={{ aspectRatio: `${OUT_W} / ${OUT_H}` }}
          onPointerDown={() => setSel(null)}
        >
          <canvas
            ref={plateRef}
            className="tk-plate-mizu"
            style={{
              left: pct(M, OUT_W),
              top: pct(M, OUT_H),
              width: pct(W, OUT_W),
              height: pct(H, OUT_H),
            }}
            role="img"
            aria-label={`Admission ticket number ${serial} issued to ${clean}`}
          />

          {stickers.map((st) => (
            <div
              key={st.key}
              className={`tk-st-mizu${sel === st.key ? ' is-on' : ''}`}
              style={{
                left: pct(st.x - st.s / 2, OUT_W),
                top: pct(st.y - st.s / 2, OUT_H),
                width: pct(st.s, OUT_W),
                height: pct(st.s, OUT_H),
                transform: `rotate(${st.r}rad)`,
              }}
              onPointerDown={(e) => onDown(e, st.key, 'move')}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            >
              <img src={st.src} alt="" draggable="false" />

              {sel === st.key && (
                <>
                  <button
                    type="button"
                    className="tk-st-del-mizu"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => remove(st.key)}
                    aria-label="Remove sticker"
                  >
                    ✕
                  </button>
                  {/* One grip for both: distance from centre scales,
                      angle rotates. Two handles on a sticker this small
                      would cover the thing being edited. */}
                  <span
                    className="tk-st-grip-mizu"
                    onPointerDown={(e) => onDown(e, st.key, 'xform')}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                  />
                </>
              )}
            </div>
          ))}
        </div>

        {/* ── Detail block ── */}
        <div className="tk-panel-mizu">
          <div className="tk-seg-mizu" role="group" aria-label="Ticket body">
            <button
              type="button"
              className={mode === 'details' ? 'is-on' : ''}
              onClick={() => setMode('details')}
              aria-pressed={mode === 'details'}
            >
              Default
            </button>
            <button
              type="button"
              className={mode === 'message' ? 'is-on' : ''}
              onClick={() => setMode('message')}
              aria-pressed={mode === 'message'}
            >
              Your message
            </button>
          </div>

          {mode === 'message' && (
            <div className="tk-msg-mizu">
              <textarea
                value={message}
                maxLength={MSG_MAX}
                rows={4}
                placeholder="Leave a note, some feedback, or anything you want to say…"
                onChange={(e) => setMessage(e.target.value)}
                aria-label="Your message on the ticket"
              />
              <span className="tk-count-mizu">
                {message.length}/{MSG_MAX}
              </span>
            </div>
          )}
        </div>

        {/* ── Sticker tray ── */}
        <div className="tk-tray-mizu">
          <p className="tk-tray-label-mizu">
            Stickers
            <span>
              tap to add · drag to move · corner to size and turn
            </span>

            {/* Pushed to the far end by margin-left:auto rather than a
                spacer element, so the hint keeps its baseline. */}
            <button
              type="button"
              className="tk-expand-mizu"
              onClick={() => setTray(true)}
              aria-label={`See all ${usable.length} stickers`}
            >
              <ExpandIcon />
              All {usable.length}
            </button>
          </p>

          <div className="tk-tray-strip-mizu">
            {usable.map((src, i) => (
              <button
                key={src}
                type="button"
                className={`tk-chip-mizu${placed.has(src) ? ' is-on' : ''}`}
                onClick={() => toggle(src)}
                aria-pressed={placed.has(src)}
                aria-label={`${placed.has(src) ? 'Remove' : 'Add'} sticker ${
                  i + 1
                }`}
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  draggable="false"
                  onError={() => onBadSticker(src)}
                />
              </button>
            ))}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="tk-cta-mizu">
          <button
            type="button"
            className="tk-save-mizu"
            onClick={download}
            disabled={busy}
          >
            <DownIcon />
            {busy ? 'Rendering…' : 'Download PNG'}
          </button>

          {stickers.length > 0 && (
            <button
              type="button"
              className="tk-clear-mizu"
              onClick={() => {
                setStickers([])
                setSel(null)
              }}
            >
              Clear stickers
            </button>
          )}

          <p className="tk-note-mizu">
            Stickers can hang off the edge — they just have to touch the
            ticket.
          </p>

          <button type="button" className="tk-close-mizu" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </dialog>

    {/* ── Full sticker sheet ── */}
    <dialog
      ref={pickRef}
      className="tk-pick-mizu"
      aria-label="All stickers"
      onCancel={(e) => {
        e.preventDefault()
        setTray(false)
      }}
    >
      <div className="tk-pick-body-mizu">
        <div className="tk-pick-head-mizu">
          <span className="tk-pick-jp-mizu" aria-hidden="true">
            御札
          </span>
          <h3>Stickers</h3>
          {/* Live count instead of a per-chip animation: the stage is
              hidden behind this panel, so a number is the only honest
              feedback that a tap landed. */}
          <span className="tk-pick-count-mizu" aria-live="polite">
            {stickers.length} on the ticket
          </span>

          <button
            type="button"
            className="tk-pick-done-mizu"
            onClick={() => setTray(false)}
          >
            Done
          </button>
        </div>

        <div className="tk-pick-grid-mizu">
          {usable.map((src, i) => (
            <button
              key={src}
              type="button"
              className={`tk-chip-mizu${placed.has(src) ? ' is-on' : ''}`}
              /* Stays open on purpose — adding five stickers should not
                 mean opening this five times. */
              onClick={() => toggle(src)}
              aria-pressed={placed.has(src)}
              aria-label={`${placed.has(src) ? 'Remove' : 'Add'} sticker ${
                i + 1
              }`}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                draggable="false"
                onError={() => onBadSticker(src)}
              />
            </button>
          ))}
        </div>
      </div>
    </dialog>
    </>
  )
}

function ExpandIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10V4h6M20 14v6h-6M20 10V4h-6M4 14v6h6" />
    </svg>
  )
}

function DownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12M7 11l5 5 5-5M4 21h16" />
    </svg>
  )
}
