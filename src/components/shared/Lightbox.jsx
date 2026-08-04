import { useCallback, useEffect, useRef, useState } from 'react'
import { ImagePlaceholder } from './placeholders.jsx'

/* ══════════════════════════════════════════════════
   Lightbox — one image, full size, steppable.

   Opens over whatever is already showing. Native
   <dialog> + showModal(), so it stacks in the top layer
   above the project dialog that spawned it with no
   z-index of its own, and inherits focus trapping and
   Esc for free.

   Delegates the picture itself to ImagePlaceholder
   rather than writing another <img>: that component
   already knows how to resolve a build-discovered url,
   walk the format candidates for a declared src, and
   fall back to a labelled tile when a file is missing.
   Duplicating any of that here would give the grid and
   the viewer two different ideas of where a file lives.
   ══════════════════════════════════════════════════ */

export default function Lightbox({
  items,
  index,
  slug,
  onIndex,
  onClose,
  /* Skips the placeholder's border and hatch. For artwork that is
     already a finished object rather than a screenshot needing a frame. */
  bare = false,
}) {
  const ref = useRef(null)
  const open = index >= 0 && index < items.length
  const item = open ? items[index] : null

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragRef = useRef(null)

  /* Stepping or closing returns to fit. Carrying a zoom across images
     lands the next one off-centre at a scale nobody asked for. */
  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [index])

  const onDown = (e) => {
    if (zoom === 1) return
    dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onMove = (e) => {
    const d = dragRef.current
    if (!d) return
    setPan({ x: e.clientX - d.x, y: e.clientY - d.y })
  }

  const onUp = () => {
    dragRef.current = null
  }

  const step = useCallback(
    (d) => onIndex((index + d + items.length) % items.length),
    [index, items.length, onIndex]
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        step(1)
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        step(-1)
      }
    }
    /* On the dialog, not the window: the project dialog underneath also
       listens for keys, and a bubbling arrow press would drive both. */
    const el = ref.current
    el?.addEventListener('keydown', onKey)
    return () => el?.removeEventListener('keydown', onKey)
  }, [open, step])

  if (!open) return null

  const many = items.length > 1

  return (
    <dialog
      ref={ref}
      className="plb-mizu"
      aria-label={item.cap || 'Gallery image'}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      /* Anywhere outside the picture closes. The frame stops the event
         so a click meant for the image does not dismiss it. */
      onClick={onClose}
    >
      <div className="plb-frame-mizu" onClick={(e) => e.stopPropagation()}>
        <div
          className={`plb-zoom-mizu${zoom > 1 ? ' is-zoomed' : ''}${
            dragRef.current ? ' is-dragging' : ''
          }`}
          style={{ '--z': zoom, '--px': `${pan.x}px`, '--py': `${pan.y}px` }}
          onDoubleClick={() => {
            setZoom((z) => (z > 1 ? 1 : 2.2))
            setPan({ x: 0, y: 0 })
          }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          {bare ? (
            <img
              key={item.key ?? item.url}
              className="plb-bare-mizu"
              src={item.url}
              alt={item.cap || ''}
              draggable="false"
            />
          ) : (
            <ImagePlaceholder
              /* Keyed so stepping swaps the element rather than mutating a
                 src the browser may already have marked failed. */
              key={item.key ?? item.url ?? item.src}
              url={item.url}
              slug={item.url ? undefined : slug}
              src={item.src}
              cap={item.cap}
              /* contain, not cover — the whole point of opening it is to
                 see the parts the grid tile cropped away. */
              fit="contain"
              fill
              showCaption={false}
              className="plb-fig-mizu"
            />
          )}
        </div>
      </div>

      <button
        type="button"
        className="plb-close-mizu"
        onClick={onClose}
        aria-label="Close image"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      {many && (
        <>
          <button
            type="button"
            className="plb-nav-mizu is-prev"
            onClick={(e) => {
              e.stopPropagation()
              step(-1)
            }}
            aria-label="Previous image"
          >
            <Chev dir="left" />
          </button>

          <button
            type="button"
            className="plb-nav-mizu is-next"
            onClick={(e) => {
              e.stopPropagation()
              step(1)
            }}
            aria-label="Next image"
          >
            <Chev dir="right" />
          </button>

          <span className="plb-count-mizu" aria-hidden="true">
            {index + 1} / {items.length}
          </span>
        </>
      )}
    </dialog>
  )
}

const Chev = ({ dir }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={dir === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
  </svg>
)
