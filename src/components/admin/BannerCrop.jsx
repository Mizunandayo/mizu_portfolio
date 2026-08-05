import { useCallback, useEffect, useRef, useState } from 'react'

/* ══════════════════════════════════════════════════
   Banner — drag, zoom, bake.

   A modal, so the page behind is inert while the crop
   is being set. showModal() does that natively: there
   is nothing to click past until Cancel or Done.

   The crop is baked into the file rather than stored
   as a position, because the only thing an inbox gets
   is an <img src>. No object-fit, no
   background-position, no CSS at all in Outlook. So
   the frame here is the real 1280×598 and what is
   sent is what was framed.

   Nothing is uploaded here. It hands back a blob and
   the composer holds it until a send actually happens,
   so a draft that is abandoned leaves nothing behind.
   ══════════════════════════════════════════════════ */

const W = 1280
const H = 598
const RATIO = W / H

/* JPEG, not WebP. Outlook has never supported WebP, and a banner that
   fails in the client with the largest share is worse than a bigger
   file. */
const TYPE = 'image/jpeg'

export default function BannerCrop({ file, onDone, onCancel }) {
  const ref = useRef(null)
  const frameRef = useRef(null)
  const dragRef = useRef(null)
  const urlRef = useRef(null)

  const [img, setImg] = useState(null)
  const [src, setSrc] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!file) return undefined

    setErr('')
    setImg(null)
    setZoom(1)
    setPos({ x: 0, y: 0 })

    const url = URL.createObjectURL(file)
    urlRef.current = url
    setSrc(url)

    const im = new Image()
    im.onload = () => setImg(im)
    im.onerror = () => setErr('That image could not be read.')
    im.src = url

    return () => {
      URL.revokeObjectURL(url)
      urlRef.current = null
    }
  }, [file])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (file && !el.open) el.showModal()
    if (!file && el.open) el.close()
  }, [file])

  /* Frame geometry in display pixels, and the smallest scale that still
     covers it. Everything else is a multiple of that, so the image can
     never be dragged away from an edge. */
  const geom = useCallback(() => {
    const fw = frameRef.current?.clientWidth ?? 0
    const fh = fw / RATIO
    if (!img || !fw) return null
    const cover = Math.max(fw / img.naturalWidth, fh / img.naturalHeight)
    const s = cover * zoom
    return { fw, fh, w: img.naturalWidth * s, h: img.naturalHeight * s }
  }, [img, zoom])

  const clamp = useCallback(
    (p) => {
      const g = geom()
      if (!g) return p
      return {
        x: Math.min(0, Math.max(g.fw - g.w, p.x)),
        y: Math.min(0, Math.max(g.fh - g.h, p.y)),
      }
    },
    [geom]
  )

  useEffect(() => setPos((p) => clamp(p)), [zoom, img, clamp])

  const down = (e) => {
    if (!img) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
  }

  const move = (e) => {
    if (!dragRef.current) return
    setPos(clamp({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y }))
  }

  const up = () => { dragRef.current = null }

  const apply = async () => {
    const g = geom()
    if (!img || !g) return
    setBusy(true)
    setErr('')

    try {
      /* Display pixels scaled up to the real 1280 wide, so what was
         framed is what lands in the file. */
      const k = W / g.fw
      const c = document.createElement('canvas')
      c.width = W
      c.height = H
      const ctx = c.getContext('2d')
      ctx.fillStyle = '#0d0d0f'
      ctx.fillRect(0, 0, W, H)
      ctx.drawImage(img, pos.x * k, pos.y * k, g.w * k, g.h * k)

      const blob = await new Promise((r) => c.toBlob(r, TYPE, 0.88))
      if (!blob) throw new Error('Could not encode the image.')

      onDone(blob)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const g = geom()

  return (
    <dialog
      ref={ref}
      className="bc-mizu"
      aria-label="Position the banner"
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onCancel()
      }}
    >
      <div className="bc-body-mizu">
        <header className="bc-head-mizu">
          <p className="ad-kicker-mizu">瓦版 / Banner</p>
          <h2>Position the banner</h2>
          <p className="bc-lede-mizu">
            Drag the image to move it, and zoom to fill. The frame is the
            real 1280×598, so what you see here is exactly what is sent.
          </p>
        </header>

        <div
          ref={frameRef}
          className="bc-frame-mizu"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          {src && (
            <img
              src={src} alt=""
              draggable="false"
              style={{
                width: g?.w ? `${g.w}px` : 'auto',
                transform: `translate(${pos.x}px, ${pos.y}px)`,
              }}
            />
          )}
          <span className="bc-hint-mizu">Drag to reposition</span>
        </div>

        <label className="bc-zoom-mizu">
          <span>Zoom</span>
          <input
            type="range" min="1" max="3" step="0.01"
            value={zoom} disabled={!img}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>

        {err && <p className="ad-err-mizu" role="alert">{err}</p>}

        <div className="bc-act-mizu">
          <button
            type="button" className="ad-ghost-mizu"
            onClick={onCancel} disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button" className="ad-primary-mizu"
            onClick={apply} disabled={busy || !img}
          >
            {busy ? 'Working…' : 'Done'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
