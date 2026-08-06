import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  PRESETS,
  paintTicket,
  serialOf,
  SANS,
  MINCHO,
} from './ticketPresets.js'
import { submit, tidyName, EMAIL_RE, NAME_MAX } from '../../data/tickets.js'
import { configured } from '../../data/supabase.js'
import { TICKETS_CHANGED } from '../../events.js'
import Fubuki from './Fubuki.jsx'

export { ticketStamp } from './ticketPresets.js'

/* ══════════════════════════════════════════════════
   Ticket — the visitor's 入場券, theirs to shape.

   Drawn rather than screenshotted. The DOM-capture
   libraries re-implement CSS and would get this panel
   wrong in exactly the places it is interesting — the
   notches are a mask, the lift is a filter — besides
   costing ~200 KB to do it badly.

   Two surfaces, one coordinate space. The stage is DOM
   so dragging is cheap and hit-testing is free; the
   export is canvas. Both address the same logical grid,
   so what is arranged is what is downloaded.

   The layouts live in ticketPresets.js. This file is
   about interaction — choosing, dragging, exporting —
   and that one is about ink; they change for different
   reasons.
   ══════════════════════════════════════════════════ */

const DPR = 2

/* Overhang room, so a sticker can hang off the edge and still be inside
   the exported picture. Proportional rather than fixed: a flat 130 units
   is 12% of an 1100-wide stub but 33% of a 460-wide ofuda, which left
   the narrow designs floating in a frame far bigger than themselves and
   rendered far too small to read. Tied to the sticker size — half a
   sticker is 0.18 of the short edge — so the room always matches what
   has to fit in it. */
const marginFor = (p) => Math.round(Math.min(p.w, p.h) * 0.22)

/* How far a sticker must overlap the ticket. "Touching" is enforced by
   clamping rather than rejecting: a drag that wanders off stops at the
   edge instead of snapping back, which is far less annoying. */
const GRIP = 16
const MIN_S = 70

/* Generated from a count rather than listed, so adding artwork is a
   one-number change. Any that fail to load are dropped at runtime — the
   set has had gaps in it, and a numbered range cannot know about them. */
const STICKER_COUNT = 50
const STICKERS = Array.from(
  { length: STICKER_COUNT },
  (_, i) => `/profile/stickers/s${i + 1}.png`
)

const MSG_MAX = 500

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

/* Sticker geometry follows the preset: a default sized off the ticket's
   short edge lands sensibly on a 1280×400 pass and a 460×1080 ofuda
   alike, where one fixed number cannot. */
const sizeFor = (p) => Math.round(Math.min(p.w, p.h) * 0.36)
const maxFor = (p) => Math.round(Math.min(p.w, p.h) * 1.1)

/* Contain-fit, so a sticker that is not square keeps its shape inside
   the square box the stage draws it in. */
function containRect(iw, ih, box) {
  const k = Math.min(box / iw, box / ih)
  const w = iw * k
  const h = ih * k
  return { w, h, dx: (box - w) / 2, dy: (box - h) / 2 }
}

/* Capped on the LONGER edge, not on width. Width alone makes a 3.2:1
   boarding pass 344px tall and soft, while a 0.43:1 ofuda comes out
   2600px tall for no benefit. */
/* Alpha is preserved. The margin around the plate stays transparent so
   the ticket sits on whatever is behind it, rather than carrying a patch
   of one particular background around with it. */
function scaleTo(src, max) {
  const k = Math.min(1, max / Math.max(src.width, src.height))
  const c = document.createElement('canvas')
  c.width = Math.round(src.width * k)
  c.height = Math.round(src.height * k)
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height)
  return c
}

/* WebP keeps the alpha. Only the fallback needs flattening, since JPEG
   has none and renders unset pixels black. toBlob hands back a PNG for a
   type it cannot encode, so the result is checked rather than assumed. */
function encodeBlob(canvas, q = 0.85) {
  return new Promise((resolve) => {
    canvas.toBlob(
      (b) => {
        if (b && b.type === 'image/webp') return resolve(b)

        const flat = document.createElement('canvas')
        flat.width = canvas.width
        flat.height = canvas.height
        const c = flat.getContext('2d')
        c.fillStyle = '#0a0a0b'
        c.fillRect(0, 0, flat.width, flat.height)
        c.drawImage(canvas, 0, 0)
        flat.toBlob((j) => resolve(j), 'image/jpeg', q)
      },
      'image/webp',
      q
    )
  })
}

function anchorIn(p, st) {
  const m = marginFor(p)
  return {
    ...st,
    x: clamp(st.x, m + GRIP - st.s / 2, m + p.w - GRIP + st.s / 2),
    y: clamp(st.y, m + GRIP - st.s / 2, m + p.h - GRIP + st.s / 2),
  }
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
  const [pi, setPi] = useState(0)
  /* An object URL for a picture the visitor supplied. Same-origin, so
     the canvas stays untainted and toBlob still works — a remote URL
     would poison the export instead. */
  const [shot, setShot] = useState(null)
  const [shotErr, setShotErr] = useState('')

  /* 'edit' | 'review'. `step` is taken by the preset carousel. */
  const [stage, setStage] = useState('edit')
  const [proof, setProof] = useState(null)
  const proofRef = useRef(null)
  /* The composed canvas, frozen when review opens. `art` comes from the
     greeting's slideshow and keeps rotating, so re-composing later would
     download and upload a different picture than the one reviewed. */
  const frozeRef = useRef(null)
  const [sent, setSent] = useState(false)
  const [sendErr, setSendErr] = useState('')
  const [ask, setAsk] = useState(false)
  const [askClosing, setAskClosing] = useState(false)
  const [burst, setBurst] = useState(0)
  const [email, setEmail] = useState('')
  /* null while typing settles, then true/false. Keeps the field from
     shouting "invalid" at someone three characters in. */
  const [emailOk, setEmailOk] = useState(null)
  const [agree, setAgree] = useState(false)
  const askRef = useRef(null)
  const pickRef = useRef(null)
  const fromRef = useRef(0)

  const thumbRefs = useRef([])

  const preset = PRESETS[pi]
  const M = marginFor(preset)
  const OUT_W = preset.w + M * 2
  const OUT_H = preset.h + M * 2

  const around = useMemo(
    () => ({
      prev: PRESETS[(pi - 1 + PRESETS.length) % PRESETS.length],
      next: PRESETS[(pi + 1) % PRESETS.length],
    }),
    [pi]
  )

  const step = useCallback(
    (d) => setPi((i) => (i + d + PRESETS.length) % PRESETS.length),
    []
  )

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

  const [who, setWho] = useState('')
  /* Seeded from the greeting each time it opens, then owned here. */
  useEffect(() => {
    if (open) setWho(tidyName(name))
  }, [open, name])

  const [pan, setPan] = useState(null)
  const [repos, setRepos] = useState(false)
  const [dropping, setDropping] = useState(false)
  const panRef = useRef(null)

  /* Same rule as the database, from the same place, so the button and
     the constraint can never disagree about what counts as a name. */
  const typed = tidyName(who)
  const named = typed.length > 0
  const clean = typed || 'YOUR NAME'
  const serial = useMemo(() => serialOf(clean), [clean])

  /* Their picture if they gave one, the slideshow frame otherwise. */
  const artSrc = shot || art

  /* Revoked when it is replaced and when the panel unmounts — the
     cleanup closes over the URL it was created with, so each one is
     released exactly once. */
  useEffect(() => {
    if (!shot) return
    return () => URL.revokeObjectURL(shot)
  }, [shot])

  const onPickPhoto = (e) => {
    const file = e.target.files?.[0]
    /* Cleared so choosing the same file twice still fires a change. */
    e.target.value = ''
    if (!file) return
    if (!/^image\/(png|jpeg)$/.test(file.type)) {
      setShotErr('PNG or JPEG only.')
      return
    }
    setShotErr('')
    setShot(URL.createObjectURL(file))
    /* A new picture wants the preset's own framing, not the last one's. */
    setPan(null)
    setRepos(false)
  }

  /* Drag anywhere on the stage while repositioning. Movement is divided
     by the stage size, so a drag across the whole plate is a full sweep
     of the crop regardless of how big the preview is on screen. */
  const startPan = (e) => {
    const box = stageRef.current?.getBoundingClientRect()
    if (!box) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    panRef.current = {
      px: e.clientX,
      py: e.clientY,
      x: pan?.x ?? 0.5,
      y: pan?.y ?? 0.26,
      w: box.width,
      h: box.height,
    }
  }

  const movePan = (e) => {
    const s = panRef.current
    if (!s) return
    setPan({
      x: clamp(s.x - (e.clientX - s.px) / s.w, 0, 1),
      y: clamp(s.y - (e.clientY - s.py) / s.h, 0, 1),
    })
  }

  const endPan = () => {
    panRef.current = null
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  /* Its own lock, not the greeting's. showModal() makes the page inert
     to clicks but leaves the wheel alone, and the editor outlives the
     greeting — opened from the gallery it has no greeting at all, and
     closing the greeting over it would otherwise hand the page back. */
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const gutter = window.innerWidth - root.clientWidth
    root.style.setProperty('--tk-gutter', `${gutter}px`)
    root.classList.add('tk-open-mizu')
    return () => {
      root.classList.remove('tk-open-mizu')
      root.style.removeProperty('--tk-gutter')
    }
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
    if (!open) {
      setTray(false)
      setStage('edit')
      setSent(false)
      setSendErr('')
      setAgree(false)
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (proofRef.current) URL.revokeObjectURL(proofRef.current)
    }
  }, [])

  useEffect(() => {
    const el = askRef.current
    if (!el) return
    if (ask && !el.open) el.showModal()
    if (!ask && el.open) el.close()
  }, [ask])

  /* Debounced: the check runs 450ms after the last keystroke, and the
     timer is cleared on every change so it never fires mid-word. */
  useEffect(() => {
    if (!email.trim()) {
      setEmailOk(null)
      return
    }
    setEmailOk(null)
    const t = window.setTimeout(
      () => setEmailOk(EMAIL_RE.test(email.trim())),
      450
    )
    return () => clearTimeout(t)
  }, [email])

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

  /* One instant for every date on the ticket. Reading the clock twice
     would let one issued near midnight print one day on the stub and
     the next in the body. Held for the life of the panel so switching
     preset does not silently re-date it either. */
  const issued = useMemo(() => new Date(), [open])

  /* ── Live plate ── */
  /* `stage` is a dependency because the canvases unmount during review;
     coming back mounts fresh blank ones that nothing else would repaint. */
  useEffect(() => {
    if (!open || stage !== 'edit') return
    let dead = false
    ;(async () => {
      await fonts()
      const image = await loadImg(artSrc)
      if (dead) return
      const into = (canvas, p, dpr) => {
        if (!canvas) return
        canvas.width = p.w * dpr
        canvas.height = p.h * dpr
        const c = canvas.getContext('2d')
        c.scale(dpr, dpr)
        paintTicket(c, p, {
          pan,
          art: image,
          name: clean,
          serial,
          mode,
          message,
          issued,
        })
      }

      into(plateRef.current, preset, DPR)
    })()
    return () => {
      dead = true
    }
  }, [open, stage, artSrc, clean, serial, mode, message, preset, issued, pan, fonts, loadImg])

  /* Swatches. Deliberately not on the same effect as the plate: they
     show the *design*, so they are painted once at open rather than
     five extra repaints on every keystroke in the message field. Drawn
     at logical size and scaled down by CSS, which is one line instead
     of a second set of coordinates to keep in step. */
  useEffect(() => {
    if (!open || stage !== 'edit') return
    let dead = false
    ;(async () => {
      await fonts()
      const image = await loadImg(artSrc)
      if (dead) return
      PRESETS.forEach((p, i) => {
        const cv = thumbRefs.current[i]
        if (!cv) return
        cv.width = p.w
        cv.height = p.h
        paintTicket(cv.getContext('2d'), p, {
          art: image,
          name: clean,
          serial,
          mode: 'details',
          message: '',
          issued,
        })
      })
    })()
    return () => {
      dead = true
    }
  }, [open, stage, artSrc, clean, serial, issued, fonts, loadImg])

  /* Stickers are stored in absolute output units, so a preset with
     different dimensions would leave them all in the wrong place —
     often off the ticket entirely. Remapped proportionally into the new
     rect, then re-clamped so the touching rule still holds. */
  useEffect(() => {
    const from = PRESETS[fromRef.current]
    if (from === preset) return
    fromRef.current = pi
    /* Both the ticket and its margin change size, so the old absolute
       position means nothing in the new space. Converted through the
       fraction of the ticket it sat at, which is the part a visitor
       actually chose. */
    const fm = marginFor(from)
    setStickers((list) =>
      list.map((st) =>
        anchorIn(preset, {
          ...st,
          x: M + ((st.x - fm) / from.w) * preset.w,
          y: M + ((st.y - fm) / from.h) * preset.h,
          s: clamp(st.s, MIN_S, maxFor(preset)),
        })
      )
    )
  }, [pi, preset, M])

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
  /* Drop lands where the pointer is, so the cascade offset that keeps
     clicked stickers from stacking is not wanted here. */
  const dropAt = useCallback(
    (src, cx, cy) => {
      const box = stageRef.current?.getBoundingClientRect()
      if (!box) return
      const key = seqRef.current++
      setStickers((list) => [
        ...list,
        anchorIn(preset, {
          key,
          src,
          x: ((cx - box.left) / box.width) * (preset.w + marginFor(preset) * 2),
          y: ((cy - box.top) / box.height) * (preset.h + marginFor(preset) * 2),
          s: sizeFor(preset),
          r: 0,
        }),
      ])
      setSel(key)
    },
    [preset]
  )

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
        {
          key,
          src,
          x: M + preset.w * 0.62 + off,
          y: M + preset.h * 0.52 + off,
          s: sizeFor(preset),
          r: 0,
        },
      ])
      setSel(key)
    },
    [placed, preset]
  )

  /* Selection follows the list. Anything that removes a sticker — the
     chip, the ✕, the Delete key, Clear — would otherwise leave `sel`
     pointing at a key that no longer exists. */
  useEffect(() => {
    if (sel !== null && !stickers.some((s) => s.key === sel)) setSel(null)
  }, [stickers, sel])

  const anchored = (st) => anchorIn(preset, st)

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
          s: clamp((dist / d.d0) * d.base.s, MIN_S, maxFor(preset)),
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
  /* Returns the canvas. review() freezes it; download and upload reuse
     that frozen one rather than painting again. */
  const compose = async () => {
    await fonts()
    const image = await loadImg(artSrc)
    const loaded = await Promise.all(stickers.map((s) => loadImg(s.src)))

    /* The ticket goes on its own surface first: its notch punch uses
       destination-out, which would otherwise cut through any sticker
       already drawn over that edge. */
    const plate = document.createElement('canvas')
    plate.width = preset.w * DPR
    plate.height = preset.h * DPR
    const pc = plate.getContext('2d')
    pc.scale(DPR, DPR)
    paintTicket(pc, preset, {
      pan,
      art: image,
      name: clean,
      serial,
      mode,
      message,
      issued,
    })

    const out = document.createElement('canvas')
    out.width = OUT_W * DPR
    out.height = OUT_H * DPR
    const c = out.getContext('2d')
    c.scale(DPR, DPR)
    c.drawImage(plate, M, M, preset.w, preset.h)

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

    return out
  }

  const review = async () => {
    if (!named) {
      setSendErr('Add a name to your ticket first.')
      return
    }
    setBusy(true)
    setSendErr('')
    try {
      const out = await compose()
      frozeRef.current = out
      const blob = await new Promise((r) => out.toBlob(r, 'image/png'))
      if (!blob) return
      if (proofRef.current) URL.revokeObjectURL(proofRef.current)
      proofRef.current = URL.createObjectURL(blob)
      setProof(proofRef.current)
      setSent(false)
      setStage('review')
    } finally {
      setBusy(false)
    }
  }

  /* Deferred by exactly the exit animation, the way the greeting does
     it, so the panel plays its leave before being unmounted. */
  const closeAsk = (then) => {
    if (askClosing) return
    const done = () => {
      setAskClosing(false)
      setAsk(false)
      then?.()
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return done()
    }
    setAskClosing(true)
    window.setTimeout(done, 460)
  }

  const send = async (withEmail) => {
    if (sent) return
    if (!named) {
      setSendErr('Add a name to your ticket first.')
      return
    }
    setBusy(true)
    setSendErr('')
    try {
      /* The frozen canvas, not a fresh paint. Re-composing here uploads
         whatever slide the greeting has rotated to since review opened. */
      const out = frozeRef.current ?? (await compose())
      /* The plate is what the lightbox shows full screen, so it is sized
         for that rather than for the grid tile. */
      const [thumb, plate] = await Promise.all([
        encodeBlob(scaleTo(out, 640), 0.82),
        encodeBlob(scaleTo(out, 1600), 0.9),
      ])
      await submit({
        thumb,
        plate,
        name: typed,
        design: preset.name,
        message: mode === 'message' ? message.trim() : '',
        email: withEmail || '',
      })
      setSent(true)
      setBurst((n) => n + 1)
      window.dispatchEvent(new Event(TICKETS_CHANGED))
    } catch (e) {
      setSendErr(e.message || 'Could not send. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const download = async () => {
    setBusy(true)
    try {
      const out = frozeRef.current ?? (await compose())
      const blob = await new Promise((r) => out.toBlob(r, 'image/png'))
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mizu-ticket-${clean.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
      a.click()
      /* Revoking in the same tick can beat the download and yield an
         empty file. */
      window.setTimeout(() => URL.revokeObjectURL(url), 60000)
    } finally {
      setBusy(false)
    }
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
      <div className={`tk-body-mizu${repos ? ' is-repos' : ''}`}>
        {/* ── Caption ──
            In normal flow above the card, not floated over it. The
            designs run from 0.52:1 to 2.53:1, so there is no corner of
            the artwork that is free on all five. */}
        <div className={`tk-head-mizu${stage === 'review' ? ' is-review' : ''}`}>
          {stage === 'review' && (
            <button
              type="button"
              className="tk-back-mizu"
              onClick={() => {
                frozeRef.current = null
                setStage('edit')
              }}
              disabled={busy}
            >
              <Chev dir="left" />
              Back to edit
            </button>
          )}

          <p className="tk-cap-mizu" aria-live="polite">
            <span className="tk-cap-jp-mizu" aria-hidden="true">
              {preset.jp}
            </span>
            <span className="tk-cap-name-mizu">{preset.name}</span>
            <span className="tk-cap-meta-mizu">
              {preset.shape} · {preset.w}×{preset.h}
            </span>
          </p>

          <div className="tk-head-act-mizu">
            {stage === 'edit' && (
              <button
                type="button"
                className="tk-save-mizu"
                onClick={review}
                disabled={busy || !named}
                title={named ? undefined : 'Add a name first'}
              >
                {busy ? 'Rendering…' : 'Next'}
                <Chev dir="right" />
              </button>
            )}

            <button type="button" className="tk-close-mizu" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {stage === 'review' ? (
          <div className="tk-review-mizu">
            <img className="tk-proof-mizu" src={proof} alt="Your finished ticket" />

            <div className="tk-review-act-mizu">
              <button
                type="button"
                className="tk-save-mizu"
                onClick={download}
                disabled={busy}
              >
                <DownIcon />
                {busy ? 'Rendering…' : 'Download PNG'}
              </button>

              {configured && (
                <button
                  type="button"
                  className="tk-send-mizu"
                  onClick={() => setAsk(true)}
                  disabled={busy || sent}
                >
                  {sent ? 'Sent for review' : busy ? 'Sending…' : 'Upload to ticket gallery'}
                </button>
              )}
            </div>

            {sendErr && (
              <p className="tk-review-err-mizu" role="alert">
                {sendErr}
              </p>
            )}

            <p className="tk-review-note-mizu" aria-live="polite">
              {sent
                ? 'Sent. Francis reviews every ticket before it appears in the gallery.'
                : 'Every ticket is reviewed by Francis Daniel before it appears in the gallery.'}
            </p>
          </div>
        ) : (
        <>
        {/* ── edit stage ── */}

        {/* ── Rail ──
            One card, arrows either side. Peeking neighbours were tried
            and abandoned: at a shared preview height the boarding pass
            wants 1062px and the ofuda 217px, so a three-up row either
            overlaps or collapses whichever design is narrow. The strip
            below shows all five at once, which is what the neighbours
            were failing to do anyway. */}
        <div className="tk-rail-mizu">
          <button
            type="button"
            className="tk-preset-nav-mizu prev"
            onClick={() => step(-1)}
            aria-label={`Previous design — ${around.prev.name}`}
          >
            <Chev dir="left" />
          </button>

        {/* ── Stage ── */}
        <div
          ref={stageRef}
          /* The ratio drives width, not height. Capping height while
             width stayed at 100% would let height win over
             aspect-ratio, and every child is positioned in percent —
             so the plate and the stickers would stretch. */
          className={`tk-stage-mizu${repos ? ' is-repos' : ''}${dropping ? ' is-drop' : ''}`}
          style={{ '--ar': OUT_W / OUT_H, aspectRatio: `${OUT_W} / ${OUT_H}` }}
          onPointerDown={repos ? startPan : () => setSel(null)}
          onPointerMove={repos ? movePan : undefined}
          onPointerUp={repos ? endPan : undefined}
          onPointerCancel={repos ? endPan : undefined}
          /* preventDefault on dragover is what makes an element a valid
             drop target; without it the browser refuses the drop. */
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
            if (!dropping) setDropping(true)
          }}
          onDragLeave={() => setDropping(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDropping(false)
            const src = e.dataTransfer.getData('text/plain')
            if (src) dropAt(src, e.clientX, e.clientY)
          }}
        >
          {/* Over the plate rather than in the panel: the control acts on
              what is directly beneath it. */}
          <div className="tk-tools-mizu">
            <label
              className="tk-tool-mizu"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <PhotoIcon />
              {shot ? 'Change photo' : 'Use my photo'}
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={onPickPhoto}
              />
            </label>

            <span className="tk-tools-end-mizu">
              <button
                type="button"
                className={`tk-tool-mizu${repos ? ' is-on' : ''}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setRepos((v) => !v)
                  setSel(null)
                }}
                aria-pressed={repos}
              >
                {repos ? 'Done' : 'Reposition'}
              </button>

              {pan && (
                <button
                  type="button"
                  className="tk-tool-mizu"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setPan(null)}
                >
                  Recentre
                </button>
              )}
            </span>
          </div>

          <canvas
            ref={plateRef}
            className="tk-plate-mizu"
            style={{
              left: pct(M, OUT_W),
              top: pct(M, OUT_H),
              width: pct(preset.w, OUT_W),
              height: pct(preset.h, OUT_H),
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

          <button
            type="button"
            className="tk-preset-nav-mizu next"
            onClick={() => step(1)}
            aria-label={`Next design — ${around.next.name}`}
          >
            <Chev dir="right" />
          </button>
        </div>

        {/* ── The five ──
            Every design visible at once, each at its own shape, so
            choosing is recognition rather than a guess at what is two
            clicks away. Painted once when the panel opens — they are
            design swatches, not live previews, so they do not repaint
            on every keystroke in the message field. */}
        <div className="tk-thumbs-mizu" role="tablist" aria-label="Ticket design">
          {PRESETS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              className={`tk-thumb-mizu${i === pi ? ' is-on' : ''}`}
              onClick={() => setPi(i)}
              aria-selected={i === pi}
              aria-label={`${p.name} — ${p.shape}`}
            >
              <span className="tk-thumb-box-mizu">
                <canvas ref={(el) => (thumbRefs.current[i] = el)} />
              </span>
              <span className="tk-thumb-jp-mizu" aria-hidden="true">
                {p.jp}
              </span>
            </button>
          ))}
        </div>

        {/* ── Detail block ── */}
        <div className="tk-panel-mizu">
          <label className="tk-name-mizu">
            <span>Name on the ticket</span>
            <input
              type="text"
              value={who}
              maxLength={NAME_MAX}
              placeholder="Your name"
              autoComplete="name"
              onChange={(e) => setWho(e.target.value)}
            />
            <span
              className={`tk-count-mizu${named ? '' : ' is-need'}`}
              aria-live="polite"
            >
              {named ? `${typed.length}/${NAME_MAX}` : 'Required'}
            </span>
          </label>

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

          <div className="tk-photo-mizu">
            {shot && (
              <button
                type="button"
                className="tk-clear-mizu"
                onClick={() => {
                  setShot(null)
                  setShotErr('')
                }}
              >
                Reset
              </button>
            )}

            <span className="tk-photo-note-mizu" role={shotErr ? 'alert' : undefined}>
              {shotErr || 'PNG or JPEG · stays on your device'}
            </span>
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
              click or drag one on · drag to move · corner to size and turn
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
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', src)
                  e.dataTransfer.effectAllowed = 'copy'
                }}
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
          <p className="tk-note-mizu">
            Stickers can hang off the edge — they just have to touch the
            ticket.
          </p>

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
        </div>
        </>
        )}
      </div>

      {/* Inside the dialog on purpose. showModal() promotes this to the
          top layer, and anything rendered outside paints beneath it no
          matter its z-index. Fixed positioning still escapes the
          panel's own overflow. */}
      <Fubuki key={burst} fire={burst > 0} />
    </dialog>

    {/* ── Notify-me ── */}
    <dialog
      ref={askRef}
      className={`tk-ask-mizu${askClosing ? ' is-closing' : ''}`}
      aria-label="Get notified when your ticket is approved"
      onCancel={(e) => {
        e.preventDefault()
        closeAsk()
      }}
    >
      <div className="tk-ask-body-mizu">
        <button
          type="button"
          className="tk-ask-x-mizu"
          onClick={() => closeAsk()}
          aria-label="Close"
        >
          <XIcon />
        </button>

        <p className="tk-ask-jp-mizu" aria-hidden="true">お知らせ</p>
        <h3 className="tk-ask-title-mizu">Want to know when it goes up?</h3>
        <p className="tk-ask-copy-mizu">
          Francis reviews every ticket by hand. Leave an email and you will
          get one message when yours appears in the gallery. Nothing else,
          ever.
        </p>

        <label className="tk-ask-field-mizu">
          <span>Email (optional)</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            /* Consent is tied to the address on screen, so editing it
               withdraws the tick rather than carrying it over. */
            onChange={(e) => {
              setEmail(e.target.value)
              setAgree(false)
            }}
            aria-invalid={emailOk === false}
          />
        </label>

        {/* Kept mounted so it can animate out. The 0fr/1fr grid row is
            what makes the height transition without hardcoding it. */}
        <div className={`tk-ask-consent-mizu${emailOk ? ' is-on' : ''}`}>
          <div>
            <label className="tk-ask-check-mizu">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                tabIndex={emailOk ? 0 : -1}
              />
              <span>
                Email me once when my ticket is approved, then automatically delete my email address afterwards.
              </span>
            </label>
          </div>
        </div>

        <p
          className={`tk-ask-hint-mizu${emailOk === false ? ' is-bad' : ''}`}
          aria-live="polite"
        >
          {email.trim() === ''
            ? 'Without email, you will not hear when your ticket is approved and posted on the ticket gallery.'
            : emailOk === null
              ? 'Checking…'
              : emailOk
                ? 'Looks good.'
                : 'That does not look like an email address.'}
        </p>

        <div className="tk-ask-act-mizu">
          <button
            type="button"
            className="tk-send-mizu"
            onClick={() => closeAsk(() => send(''))}
            disabled={busy}
          >
            Send without email
          </button>
          <button
            type="button"
            className="tk-save-mizu"
            onClick={() => closeAsk(() => send(email.trim()))}
            disabled={busy || !emailOk || !agree}
          >
            Notify me
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

function Chev({ dir }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={dir === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5" />
    </svg>
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

function PhotoIcon() {
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
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m21 16-5-5-5 5-2-2-6 6" />
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
