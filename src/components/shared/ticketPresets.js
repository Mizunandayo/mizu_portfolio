import { PROFILE, SITE } from '../../data/profile.js'

/* ══════════════════════════════════════════════════
   Ticket presets — five layouts, one drawing surface.

   Each preset owns its dimensions, its palette and a
   paint function that draws at 0,0 in its own logical
   units. Everything above the presets is a shared
   primitive; nothing below reaches back up.

   Split out of Ticket.jsx because the component is
   about interaction — dragging, selecting, exporting —
   and this is about ink. They changed for different
   reasons and at different rates.
   ══════════════════════════════════════════════════ */

export const SANS = "'Poppins', system-ui, sans-serif"
export const MINCHO = "'Shippori Mincho', 'Yu Mincho', serif"

const DARK = {
  paper: '#0b0b0c',
  ink: '#fafafa',
  body: 'rgba(244,244,245,0.95)',
  dim: 'rgba(161,161,170,0.85)',
  faint: 'rgba(161,161,170,0.62)',
  line: 'rgba(250,250,250,0.16)',
  edge: 'rgba(250,250,250,0.24)',
  perf: 'rgba(250,250,250,0.42)',
  veil: '4,4,5',
}

/* One light card among four dark ones. Monochrome either way — the
   inversion is the variety, not a second colour. */
const LIGHT = {
  paper: '#f2f2ef',
  ink: '#0b0b0c',
  body: 'rgba(24,24,27,0.94)',
  dim: 'rgba(63,63,70,0.85)',
  faint: 'rgba(82,82,91,0.7)',
  line: 'rgba(11,11,12,0.18)',
  edge: 'rgba(11,11,12,0.28)',
  perf: 'rgba(11,11,12,0.4)',
  veil: '235,235,232',
}

/* ── Primitives ─────────────────────────────────── */

export function stamped(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

/* MZ plus the day it was issued. Exported because the greeting prints
   the same stub, and two hardcoded strings eventually disagree. */
export function ticketStamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `MZ-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function serialOf(name) {
  let h = 0
  for (const ch of name.trim().toUpperCase()) h = (h * 31 + ch.codePointAt(0)) >>> 0
  return String((h % 9000) + 1000)
}

/* Greedy wrap. Canvas has no text layout of its own — measureText is
   the only tool, so the lines are built by hand.

   Word breaking alone is not enough: a token longer than the column has
   no space to break at, and a greedy pass emits it as one line running
   straight off the ticket. Anything pasted without spaces — a URL, a
   keysmash — does exactly that, so an over-long token falls back to
   breaking by character, which is what CSS calls break-word. */
export function wrapLines(c, text, maxW) {
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

/* Shrink until it fits rather than clip — a long name is the one thing
   guaranteed to overflow whichever line it lands on. */
function fit(c, text, maxW, start, weight = 800, floor = 14) {
  let s = start
  c.font = `${weight} ${s}px ${SANS}`
  while (c.measureText(text).width > maxW && s > floor) {
    s -= 2
    c.font = `${weight} ${s}px ${SANS}`
  }
  return s
}

function label(c, P, text, x, y, size = 12, align = 'left') {
  c.font = `700 ${size}px ${SANS}`
  c.letterSpacing = '0.22em'
  c.fillStyle = P.dim
  c.textAlign = align
  c.fillText(text, x, y)
  c.letterSpacing = '0px'
  c.textAlign = 'left'
}

function rule(c, P, x1, x2, y) {
  c.strokeStyle = P.line
  c.lineWidth = 1
  c.beginPath()
  c.moveTo(x1, y + 0.5)
  c.lineTo(x2, y + 0.5)
  c.stroke()
}

function perf(c, P, x1, y1, x2, y2) {
  c.strokeStyle = P.perf
  c.lineWidth = 1
  c.setLineDash([5, 8])
  c.beginPath()
  c.moveTo(x1, y1)
  c.lineTo(x2, y2)
  c.stroke()
  c.setLineDash([])
}

/* `pan` overrides where the crop sits, 0..1 on each axis. Absent, each
   preset keeps the focus it was composed around. */
function cover(c, img, dx, dy, dw, dh, focus = 0.26, pan) {
  if (!img?.naturalWidth) return
  const k = Math.max(dw / img.naturalWidth, dh / img.naturalHeight)
  const sw = dw / k
  const sh = dh / k
  const fx = pan?.x ?? 0.5
  const fy = pan?.y ?? focus
  c.drawImage(
    img,
    (img.naturalWidth - sw) * fx,
    (img.naturalHeight - sh) * fy,
    sw,
    sh,
    dx,
    dy,
    dw,
    dh
  )
}

function fade(c, P, x, y, w, h) {
  const g = c.createLinearGradient(0, y, 0, y + h)
  g.addColorStop(0, `rgba(${P.veil},0)`)
  g.addColorStop(1, `rgba(${P.veil},0.94)`)
  c.fillStyle = g
  c.fillRect(x, y, w, h)
}

/* Canvas has no writing-mode, so the column is placed by hand. */
function tategaki(c, text, x, y, size, step, color, weight = 800) {
  c.font = `${weight} ${size}px ${MINCHO}`
  c.fillStyle = color
  c.textAlign = 'left'
  ;[...text].forEach((ch, i) => c.fillText(ch, x, y + i * step))
}

/* destination-out cuts real transparency, so a notch reads as punched
   on any background the PNG lands on. A filled circle would only work
   against the one colour it was matched to. Always last: it erases
   whatever is already on the surface. */
function punch(c, points, r) {
  c.globalCompositeOperation = 'destination-out'
  c.beginPath()
  for (const [x, y] of points) {
    c.moveTo(x + r, y)
    c.arc(x, y, r, 0, Math.PI * 2)
  }
  c.fill()
  c.globalCompositeOperation = 'source-over'
}

function frame(c, P, w, h) {
  c.strokeStyle = P.edge
  c.lineWidth = 1
  c.strokeRect(0.5, 0.5, w - 1, h - 1)
}

const rows = (issued) => [
  ['発行日 / ISSUED', stamped(issued)],
  ['案内 / GUIDE', `${PROFILE.kanji}  ${PROFILE.name.toUpperCase()}`],
  ['席 / SEAT', 'GENERAL ADMISSION'],
]

/* The site, not the GitHub profile. A ticket is a souvenir of this page,
   so the line at its foot should be the way back to it. Read from
   SITE.url rather than written out, so a domain change lands on all five
   presets at once. */
const handle = () =>
  SITE.url.replace(/^https?:\/\//, '').replace(/\/$/, '')

/* Shrinks to fit its band the same way the name does. Wrapping depends
   on the size and the size depends on the wrap, so it is settled by
   trying each step down — a handful of measurements, once. */
function message(c, P, { text, x, y, w, room, base = 17 }) {
  let size = base
  let lines = []
  let lh = Math.round(base * 1.5)

  for (; size >= 11; size -= 1) {
    c.font = `500 ${size}px ${SANS}`
    lines = wrapLines(c, text, w)
    lh = Math.round(size * 1.5)
    if ((lines.length - 1) * lh <= room) break
  }

  c.font = `500 ${size}px ${SANS}`
  c.fillStyle = P.body
  /* Even at the floor size an unbroken run can overrun, so the band is
     enforced once more rather than trusted. */
  lines
    .slice(0, Math.floor(room / lh) + 1)
    .forEach((line, i) => c.fillText(line, x, y + i * lh))
}

/* Body block shared by the layouts wide enough for a label column. */
function detail(c, P, o, { x, y, w, gap = 40, labelW = 190, room }) {
  if (o.mode === 'message' && o.message.trim()) {
    label(c, P, '一言 / MESSAGE', x, y)
    message(c, P, { text: o.message.trim(), x, y: y + 34, w, room: room - 34 })
    return
  }
  rows(o.issued).forEach(([k, v], i) => {
    label(c, P, k, x, y + i * gap)
    c.font = `600 15px ${SANS}`
    c.fillStyle = P.body
    c.fillText(v, x + labelW, y + i * gap)
  })
}

/* Stacked variant, for columns too narrow to sit a value beside its
   label without one of them wrapping. */
function detailStacked(c, P, o, { x, y, w, gap = 46, room, valueSize = 15 }) {
  if (o.mode === 'message' && o.message.trim()) {
    label(c, P, '一言 / MESSAGE', x, y, 11)
    message(c, P, { text: o.message.trim(), x, y: y + 30, w, room: room - 30, base: 15 })
    return
  }
  rows(o.issued).forEach(([k, v], i) => {
    label(c, P, k, x, y + i * gap, 10)
    const s = fit(c, v, w, valueSize, 600, 11)
    c.font = `600 ${s}px ${SANS}`
    c.fillStyle = P.body
    c.fillText(v, x, y + i * gap + 20)
  })
}

/* ── 1. 入場券 — the stub ─────────────────────────
   Art flush to the left edge, perforated seam, details
   printed across the body. The original. */
function paintStub(c, o) {
  const P = DARK
  const W = 1100
  const H = 520
  const STUB = 330
  const PAD = 56
  const x = STUB + PAD
  const right = W - PAD

  c.fillStyle = P.paper
  c.fillRect(0, 0, W, H)
  cover(c, o.art, 0, 0, STUB, H, 0.26, o.pan)
  fade(c, P, 0, H * 0.42, STUB, H * 0.58)

  tategaki(c, 'ようこそ', 30, H - 132, 26, 34, P.ink)

  c.font = `700 12px ${SANS}`
  c.letterSpacing = '0.2em'
  c.fillStyle = 'rgba(250,250,250,0.66)'
  c.textAlign = 'right'
  c.fillText(ticketStamp(o.issued), STUB - 22, H - 26)
  c.letterSpacing = '0px'
  c.textAlign = 'left'

  perf(c, P, STUB + 0.5, 15, STUB + 0.5, H - 15)

  c.fillStyle = P.ink
  c.font = `800 26px ${MINCHO}`
  c.fillText('入場券', x, 76)
  label(c, P, 'ADMIT ONE', x + 104, 74, 13)
  label(c, P, `NO. ${o.serial}`, right, 74, 13, 'right')
  rule(c, P, x, right, 100)

  label(c, P, '氏名 / NAME', x, 148)
  const s = fit(c, o.who, right - x, 54)
  c.font = `800 ${s}px ${SANS}`
  c.fillStyle = P.ink
  c.fillText(o.who, x, 202)
  rule(c, P, x, right, 232)

  detail(c, P, o, { x, y: 278, w: right - x, room: 172 })

  label(c, P, handle(), x, H - 42, 13.5)
  frame(c, P, W, H)
  punch(c, [[STUB, 0], [STUB, H]], 15)
}

/* ── 2. 短冊 — portrait ───────────────────────────
   A tanzaku: the poem slip hung on bamboo. Art on top,
   the tear across the middle, text below. */
function paintTanzaku(c, o) {
  const P = DARK
  const W = 620
  const H = 1000
  const ART = 545
  const PAD = 46
  const right = W - PAD

  c.fillStyle = P.paper
  c.fillRect(0, 0, W, H)
  cover(c, o.art, 0, 0, W, ART, 0.2, o.pan)
  fade(c, P, 0, ART * 0.5, W, ART * 0.5)

  tategaki(c, 'ようこそ', PAD, ART - 196, 30, 40, P.ink)

  c.font = `700 12px ${SANS}`
  c.letterSpacing = '0.2em'
  c.fillStyle = 'rgba(250,250,250,0.66)'
  c.textAlign = 'right'
  c.fillText(ticketStamp(o.issued), right, ART - 30)
  c.letterSpacing = '0px'
  c.textAlign = 'left'

  perf(c, P, 15, ART + 0.5, W - 15, ART + 0.5)

  c.fillStyle = P.ink
  c.font = `800 24px ${MINCHO}`
  c.fillText('入場券', PAD, ART + 66)
  label(c, P, 'ADMIT ONE', PAD + 96, ART + 64, 12)
  label(c, P, `NO. ${o.serial}`, right, ART + 64, 12, 'right')
  rule(c, P, PAD, right, ART + 88)

  label(c, P, '氏名 / NAME', PAD, ART + 134)
  const s = fit(c, o.who, right - PAD, 46)
  c.font = `800 ${s}px ${SANS}`
  c.fillStyle = P.ink
  c.fillText(o.who, PAD, ART + 186)
  rule(c, P, PAD, right, ART + 214)

  detail(c, P, o, {
    x: PAD,
    y: ART + 258,
    w: right - PAD,
    gap: 42,
    labelW: 168,
    room: 150,
  })

  label(c, P, handle(), PAD, H - 40, 12.4)
  frame(c, P, W, H)
  punch(c, [[0, ART], [W, ART]], 15)
}

/* ── 3. 搭乗券 — boarding pass ────────────────────
   Two tears, not one: the main body and a tear-off
   stub at the far end, the way a real pass is torn. */
function paintPass(c, o) {
  const P = DARK
  const W = 1280
  const H = 400
  const ART = 250
  const TEAR = W - 250
  const PAD = 44
  const x = ART + PAD

  c.fillStyle = P.paper
  c.fillRect(0, 0, W, H)
  cover(c, o.art, 0, 0, ART, H, 0.18, o.pan)
  fade(c, P, 0, H * 0.45, ART, H * 0.55)
  tategaki(c, 'ようこそ', 24, H - 150, 22, 30, P.ink)

  perf(c, P, ART + 0.5, 14, ART + 0.5, H - 14)
  perf(c, P, TEAR + 0.5, 14, TEAR + 0.5, H - 14)

  c.fillStyle = P.ink
  c.font = `800 22px ${MINCHO}`
  c.fillText('搭乗券', x, 62)
  label(c, P, 'BOARDING PASS', x + 88, 60, 12)
  rule(c, P, x, TEAR - PAD, 84)

  label(c, P, '氏名 / PASSENGER', x, 128)
  const s = fit(c, o.who, TEAR - PAD - x, 44)
  c.font = `800 ${s}px ${SANS}`
  c.fillStyle = P.ink
  c.fillText(o.who, x, 176)

  /* Fields across, not down. The body here is ~690 units wide and only
     160 tall once the name has taken its share, so a stacked list runs
     out of height long before it runs out of width — and a pass prints
     its fields in a row anyway. */
  const bodyW = TEAR - PAD - x
  rule(c, P, x, TEAR - PAD, 212)

  if (o.mode === 'message' && o.message.trim()) {
    label(c, P, '一言 / MESSAGE', x, 248, 11)
    message(c, P, { text: o.message.trim(), x, y: 278, w: bodyW, room: 84, base: 16 })
  } else {
    const cols = rows(o.issued)
    const cw = bodyW / cols.length
    cols.forEach(([k, v], i) => {
      const cx = x + i * cw
      label(c, P, k, cx, 250, 10)
      const s = fit(c, v, cw - 18, 16, 600, 10)
      c.font = `600 ${s}px ${SANS}`
      c.fillStyle = P.body
      c.fillText(v, cx, 278)
    })
  }

  label(c, P, handle(), x, H - 38, 11.3)

  /* The stub carries only what a torn-off half needs to stay useful:
     who, which ticket, when. */
  const sx = TEAR + 34
  label(c, P, 'NO.', sx, 62, 11)
  c.font = `800 34px ${SANS}`
  c.fillStyle = P.ink
  c.fillText(o.serial, sx, 100)
  rule(c, P, sx, W - 34, 124)
  label(c, P, stamped(o.issued), sx, 158, 11)

  const nm = fit(c, o.who, W - 34 - sx, 20, 700, 10)
  c.font = `700 ${nm}px ${SANS}`
  c.fillStyle = P.body
  c.fillText(o.who, sx, 194)

  /* A barcode is the one motif that says "pass" without a word of
     explanation. Widths from the serial so it is at least a function
     of the ticket rather than decoration pretending to encode. */
  let bx = sx
  const seed = [...o.serial].map((n) => Number(n) || 3)
  c.fillStyle = P.ink
  for (let i = 0; bx < W - 40; i += 1) {
    const w = 2 + (seed[i % seed.length] % 4)
    if (i % 2 === 0) c.fillRect(bx, H - 132, w, 72)
    bx += w + 3
  }
  label(c, P, ticketStamp(o.issued), sx, H - 38, 10)

  frame(c, P, W, H)
  punch(c, [[ART, 0], [ART, H], [TEAR, 0], [TEAR, H]], 13)
}

/* ── 4. 御札 — the talisman ───────────────────────
   The tall narrow slip, cut to a point at the top,
   matching the certification cards. Vertical by nature:
   the mark runs down the centre. */
function paintOfuda(c, o) {
  const P = DARK
  const W = 460
  const H = 1080
  const TIP = 58
  const PAD = 40

  /* Cut to the point first, then paint inside it — the shape is the
     clip, so nothing has to be masked out afterwards. */
  c.save()
  c.beginPath()
  c.moveTo(W / 2, 0)
  c.lineTo(W, TIP)
  c.lineTo(W, H)
  c.lineTo(0, H)
  c.lineTo(0, TIP)
  c.closePath()
  c.clip()

  c.fillStyle = P.paper
  c.fillRect(0, 0, W, H)

  const AY = 132
  const AH = 380
  cover(c, o.art, PAD, AY, W - PAD * 2, AH, 0.2, o.pan)
  fade(c, P, PAD, AY + AH * 0.55, W - PAD * 2, AH * 0.45)

  c.strokeStyle = P.edge
  c.lineWidth = 1
  c.strokeRect(PAD + 0.5, AY + 0.5, W - PAD * 2 - 1, AH - 1)

  c.textAlign = 'center'
  c.fillStyle = P.ink
  c.font = `800 26px ${MINCHO}`
  c.fillText('入場御札', W / 2, 104)
  c.textAlign = 'left'

  label(c, P, `NO. ${o.serial}`, W / 2, AY + AH + 46, 11, 'center')

  const s = fit(c, o.who, W - PAD * 2, 40)
  c.font = `800 ${s}px ${SANS}`
  c.fillStyle = P.ink
  c.textAlign = 'center'
  c.fillText(o.who, W / 2, AY + AH + 108)
  c.textAlign = 'left'

  rule(c, P, PAD, W - PAD, AY + AH + 140)

  detailStacked(c, P, o, {
    x: PAD,
    y: AY + AH + 186,
    w: W - PAD * 2,
    gap: 62,
    room: 210,
    valueSize: 14,
  })

  /* Down the left margin, where a talisman carries its invocation. */
  tategaki(c, 'ようこそ', 14, AY + 20, 20, 28, P.faint)

  label(c, P, ticketStamp(o.issued), W / 2, H - 76, 10, 'center')
  label(c, P, handle(), W / 2, H - 44, 11.3, 'center')

  /* Paired hairlines just inside the cut, tracing the point. */
  c.strokeStyle = P.edge
  c.lineWidth = 1
  for (const i of [0, 7]) {
    c.beginPath()
    c.moveTo(i + 0.5, H)
    c.lineTo(i + 0.5, TIP + i * 0.5)
    c.lineTo(W / 2, i * 1.05)
    c.lineTo(W - i - 0.5, TIP + i * 0.5)
    c.lineTo(W - i - 0.5, H)
    c.stroke()
  }

  c.restore()
}

/* ── 5. 半券 — the print ──────────────────────────
   The one light card. A photo print with a deep mount
   and the caption set below it, so the inversion is
   the variety rather than a second colour. */
function paintPrint(c, o) {
  const P = LIGHT
  const W = 820
  const H = 920
  const PAD = 52
  const AY = 52
  const AW = W - PAD * 2
  const AH = 560

  c.fillStyle = P.paper
  c.fillRect(0, 0, W, H)

  cover(c, o.art, PAD, AY, AW, AH, 0.22, o.pan)
  c.strokeStyle = 'rgba(11,11,12,0.4)'
  c.lineWidth = 1
  c.strokeRect(PAD + 0.5, AY + 0.5, AW - 1, AH - 1)

  /* The vertical mark sits on the print, where a photographer would
     sign it — white with a shadow, because it is over the image. */
  tategaki(c, 'ようこそ', PAD + 18, AY + AH - 150, 24, 32, '#fafafa')

  const capY = AY + AH + 62

  c.fillStyle = P.ink
  c.font = `800 22px ${MINCHO}`
  c.fillText('半券', PAD, capY)
  label(c, P, 'ADMIT ONE', PAD + 68, capY - 2, 12)
  label(c, P, `NO. ${o.serial}`, W - PAD, capY - 2, 12, 'right')
  rule(c, P, PAD, W - PAD, capY + 22)

  const s = fit(c, o.who, AW, 46)
  c.font = `800 ${s}px ${SANS}`
  c.fillStyle = P.ink
  c.fillText(o.who, PAD, capY + 84)

  if (o.mode === 'message' && o.message.trim()) {
    message(c, P, {
      text: o.message.trim(),
      x: PAD,
      y: capY + 124,
      /* Shortened from 78 to leave the footer its own band. A message
         that filled the old room ended level with the site line. */
      room: 62,
      w: AW,
      base: 15,
    })
    label(c, P, handle(), PAD, H - 32, 12.4)
  } else {
    label(c, P, `${stamped(o.issued)}   ·   ${PROFILE.kanji} ${PROFILE.name.toUpperCase()}`, PAD, capY + 122, 12)
    label(c, P, handle(), PAD, capY + 152, 12.4)
  }

  frame(c, P, W, H)
}

/* ── The set ────────────────────────────────────── */
export const PRESETS = [
  { id: 'stub', jp: '入場券', name: 'Stub', shape: 'landscape', w: 1100, h: 520, paint: paintStub },
  { id: 'tanzaku', jp: '短冊', name: 'Tanzaku', shape: 'portrait', w: 620, h: 1000, paint: paintTanzaku },
  { id: 'pass', jp: '搭乗券', name: 'Boarding pass', shape: 'panorama', w: 1280, h: 400, paint: paintPass },
  { id: 'ofuda', jp: '御札', name: 'Ofuda', shape: 'talisman', w: 460, h: 1080, paint: paintOfuda },
  { id: 'print', jp: '半券', name: 'Print', shape: 'square · light', w: 820, h: 920, paint: paintPrint },
]

/* One entry point, so the caller never has to know which layout it is
   asking for. `issued` is passed in rather than read here: the stub
   code and the ISSUED row must come from the same instant, or a ticket
   made near midnight prints two different days. */
export function paintTicket(c, preset, opts) {
  preset.paint(c, { ...opts, who: opts.name })
}
