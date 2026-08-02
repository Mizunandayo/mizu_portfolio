import { useCallback, useEffect, useRef, useState } from 'react'
import { PROFILE } from '../../data/profile.js'

/* ══════════════════════════════════════════════════
   Ticket — the visitor's 入場券, drawn to a canvas.

   Drawn rather than screenshotted. The DOM-capture
   libraries re-implement CSS and would get this panel
   wrong in exactly the places it is interesting — the
   punched notches are a mask, the lift is a filter —
   besides costing ~200 KB to do it badly. A canvas
   renders the same design exactly, at 2x, in a couple
   of KB.

   The canvas on screen IS the download, so screenshot
   and Save produce the same artefact.
   ══════════════════════════════════════════════════ */

/* Logical drawing units. The backing store is this times DPR, so the
   whole layout below can be written at a readable scale. */
const W = 1100
const H = 520
const DPR = 2
const STUB = 330
const PAD = 56
const NOTCH = 15

const SANS = "'Poppins', system-ui, sans-serif"
const MINCHO = "'Shippori Mincho', 'Yu Mincho', serif"

/* Stable per visitor, so re-issuing the same name gives the same
   ticket rather than a new random one each time. */
function serialOf(name) {
  let h = 0
  for (const ch of name.trim().toUpperCase()) h = (h * 31 + ch.codePointAt(0)) >>> 0
  return String((h % 9000) + 1000)
}

function stamped(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

export default function Ticket({ open, name, art, onClose }) {
  const ref = useRef(null)
  const canvasRef = useRef(null)
  const [url, setUrl] = useState(null)
  const [drawing, setDrawing] = useState(false)

  const clean = (name || '').trim() || 'GUEST'
  const serial = serialOf(clean)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  const draw = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setDrawing(true)

    /* Canvas does not participate in CSS font loading: an unloaded
       family silently falls back, so the download would come out in
       Arial while the page looked right. Ask for the exact cuts first. */
    try {
      await Promise.all([
        document.fonts.load(`800 52px ${SANS}`),
        document.fonts.load(`700 14px ${SANS}`),
        document.fonts.load(`500 14px ${SANS}`),
        document.fonts.load(`800 26px ${MINCHO}`),
      ])
      await document.fonts.ready
    } catch {
      /* fall back to whatever is resident */
    }

    /* Same-origin, so the canvas stays untainted and toBlob works. */
    const img = new Image()
    img.src = art
    try {
      await img.decode()
    } catch {
      /* draw the plate without art rather than failing outright */
    }

    canvas.width = W * DPR
    canvas.height = H * DPR
    const c = canvas.getContext('2d')
    c.scale(DPR, DPR)
    c.textBaseline = 'alphabetic'

    /* ── Plate ── */
    c.fillStyle = '#0b0b0c'
    c.fillRect(0, 0, W, H)

    /* ── Stub art, cover-fit and biased upward like the modal ── */
    if (img.naturalWidth) {
      const k = Math.max(STUB / img.naturalWidth, H / img.naturalHeight)
      const sw = STUB / k
      const sh = H / k
      c.drawImage(
        img,
        (img.naturalWidth - sw) / 2,
        (img.naturalHeight - sh) * 0.26,
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
    ;[...'ようこそ'].forEach((ch, i) => {
      c.fillText(ch, 30, H - 132 + i * 34)
    })

    c.font = `700 12px ${SANS}`
    c.letterSpacing = '0.2em'
    c.fillStyle = 'rgba(250,250,250,0.66)'
    c.textAlign = 'right'
    c.fillText('MZ-2026-09', STUB - 22, H - 26)
    c.letterSpacing = '0px'

    /* ── Perforation ── */
    c.strokeStyle = 'rgba(250,250,250,0.42)'
    c.lineWidth = 1
    c.setLineDash([5, 8])
    c.beginPath()
    c.moveTo(STUB + 0.5, NOTCH)
    c.lineTo(STUB + 0.5, H - NOTCH)
    c.stroke()
    c.setLineDash([])

    /* ── Printed body ── */
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
    const upper = clean.toUpperCase()
    let size = 54
    c.font = `800 ${size}px ${SANS}`
    while (c.measureText(upper).width > right - x && size > 20) {
      size -= 2
      c.font = `800 ${size}px ${SANS}`
    }
    c.fillStyle = '#fafafa'
    c.fillText(upper, x, 202)

    rule(232)

    const rows = [
      ['発行日 / ISSUED', stamped(new Date())],
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

    c.font = `700 12px ${SANS}`
    c.letterSpacing = '0.18em'
    c.fillStyle = 'rgba(161,161,170,0.62)'
    c.fillText(PROFILE.contact.github.replace(/^https?:\/\//, ''), x, H - 42)
    c.letterSpacing = '0px'

    /* ── Frame, then punch ── */
    c.strokeStyle = 'rgba(250,250,250,0.24)'
    c.lineWidth = 1
    c.strokeRect(0.5, 0.5, W - 1, H - 1)

    /* destination-out cuts real transparency, so the notches read as
       punched on any background the PNG lands on — a filled circle
       would only work against the one colour it was matched to. */
    c.globalCompositeOperation = 'destination-out'
    c.beginPath()
    c.arc(STUB, 0, NOTCH, 0, Math.PI * 2)
    c.arc(STUB, H, NOTCH, 0, Math.PI * 2)
    c.fill()
    c.globalCompositeOperation = 'source-over'

    canvas.toBlob((blob) => {
      if (!blob) return
      /* Revoked when the next one replaces it, and on unmount. */
      setUrl((old) => {
        if (old) URL.revokeObjectURL(old)
        return URL.createObjectURL(blob)
      })
      setDrawing(false)
    }, 'image/png')
  }, [art, clean, serial])

  useEffect(() => {
    if (open) draw()
  }, [open, draw])

  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])

  return (
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
        <canvas
          ref={canvasRef}
          className="tk-canvas-mizu"
          role="img"
          aria-label={`Admission ticket number ${serial} issued to ${clean}`}
        />

        <div className="tk-cta-mizu">
          <a
            className={`tk-save-mizu${url ? '' : ' is-off'}`}
            href={url || undefined}
            download={`mizu-ticket-${clean.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`}
            aria-disabled={!url}
          >
            <DownIcon />
            {drawing ? 'Preparing…' : 'Download PNG'}
          </a>

          <p className="tk-note-mizu">
            Or just screenshot it — what you see is the file.
          </p>

          <button type="button" className="tk-close-mizu" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </dialog>
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
