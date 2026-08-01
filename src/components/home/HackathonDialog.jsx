import { useEffect, useRef, useState, useCallback } from 'react'
import { bySlug, liveUrl } from '../../data/projects.js'
import { monthOf } from '../../data/hackathons.js'
import { mediaFor } from '../../data/hackathonMedia.js'
import { Pill, GitHubIcon, PlayIcon, ExternalIcon, ArrowIcon } from '../shared/primitives.jsx'
import { ImagePlaceholder } from '../shared/placeholders.jsx'

/* ══════════════════════════════════════════════════
   Hackathon dialog.

   Two columns: gallery left — active image with a
   thumbnail carousel beneath it — and the details
   right: kicker, name, placement, summary, project,
   links.

   Native <dialog> + showModal(), so focus trapping,
   ESC, top-layer stacking above the fixed nav and
   focus restore to the entry that opened it all come
   free. Unlike the project dialog this one is not
   URL-routed — hackathons have no route of their own,
   so it is plain local state.
   ══════════════════════════════════════════════════ */

const LINK_ICON = {
  repo:  <GitHubIcon />,
  video: <PlayIcon width="10" height="10" />,
  demo:  <ExternalIcon />,
}

export default function HackathonDialog({ hackathon: h, onClose }) {
  const ref = useRef(null)
  const [active, setActive] = useState(0)

  const project = h.slug ? bySlug(h.slug) : null
  const media = mediaFor(h.id, h.captions)
  const current = media[active]
  const many = media.length > 1

  const close = useCallback(() => onClose(), [onClose])

  const step = useCallback(
    (d) => setActive((i) => (i + d + media.length) % media.length),
    [media.length]
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!el.open) el.showModal()

    const onCancel = (e) => { e.preventDefault(); close() }
    el.addEventListener('cancel', onCancel)

    /* Arrow keys step the gallery, as in any lightbox. */
    const onKey = (e) => {
      if (media.length < 2) return
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1) }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); step(-1) }
    }
    el.addEventListener('keydown', onKey)

    const prevOverflow = document.body.style.overflow
    const prevPad = document.body.style.paddingRight
    /* Compensate for the scrollbar the lock removes so the page behind
       does not visibly shift sideways. */
    const gap = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (gap > 0) document.body.style.paddingRight = `${gap}px`

    return () => {
      el.removeEventListener('cancel', onCancel)
      el.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPad
      if (el.open) el.close()
    }
  }, [close, step, media.length])

  return (
    <dialog
      ref={ref}
      className="hkd-mizu"
      aria-labelledby="hkd-title"
      onClick={(e) => { if (e.target === ref.current) close() }}
    >
      <div className="hkd-panel-mizu" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="hkd-close-mizu" onClick={close} aria-label="Close">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* ── Left: gallery ──
            The stage bleeds to the panel edges; the caption rides over
            the bottom of the image so nothing steals height from it. */}
        <div className="hkd-gallery-mizu">
          {current && (
            <div className="hkd-stage-mizu">
              {/* `contain`, not `cover` — the whole photo has to be
                  visible. Off-ratio images letterbox against the stage
                  rather than losing their top and bottom to a crop. */}
              <ImagePlaceholder
                url={current.url}
                cap={current.cap}
                alt={`${h.title} — ${current.cap}`}
                fill
                fit="contain"
                showCaption={false}
                label={current.cap}
              />

              {many && (
                <>
                  <button
                    type="button"
                    className="hkd-nav-mizu is-prev"
                    onClick={() => step(-1)}
                    aria-label="Previous image"
                  >
                    <Chevron dir="left" />
                  </button>
                  <button
                    type="button"
                    className="hkd-nav-mizu is-next"
                    onClick={() => step(1)}
                    aria-label="Next image"
                  >
                    <Chevron dir="right" />
                  </button>

                  <span className="hkd-count-mizu" aria-hidden="true">
                    {active + 1} / {media.length}
                  </span>
                </>
              )}

            </div>
          )}

          {many && (
            <div className="hkd-carousel-mizu" role="group" aria-label="Gallery thumbnails">
              {media.map((m, i) => (
                <button
                  key={m.key}
                  type="button"
                  className={`hkd-thumb-mizu${i === active ? ' is-active' : ''}`}
                  onClick={() => setActive(i)}
                  aria-label={m.cap}
                  aria-current={i === active ? 'true' : undefined}
                >
                  <ImagePlaceholder
                    url={m.url}
                    cap=""
                    alt=""
                    ratio="16/9"
                    showCaption={false}
                    label={String(i + 1)}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: details ──
            The inner wrapper is absolutely positioned, so this column
            contributes no height to the grid row. The row is therefore
            sized by the gallery alone — which is what keeps the stage at
            a true 16:9 with no leftover space beside it. Overflowing
            details scroll here rather than stretching the panel. */}
        <div className="hkd-detail-mizu">
         <div className="hkd-detail-inner-mizu">
          <div className="hkd-kicker-mizu">
            <span className="hkd-kicker-date-mizu">{monthOf(h.sort)} {h.sort.slice(0, 4)}</span>
            <span aria-hidden="true" className="hkd-kicker-dot-mizu">·</span>
            <span>{h.issuer}</span>
          </div>

          <h2 id="hkd-title" className="hkd-title-mizu">{h.title}</h2>

          {h.placement && <div className="hkd-place-mizu">{h.placement}</div>}

          {h.note && <p className="hkd-note-mizu">{h.note}</p>}

          {project?.summary && <p className="hkd-summary-mizu">{project.summary}</p>}

          <div className="hkd-project-mizu">
            <span className="hkd-project-label-mizu">Project</span>
            <span className="hkd-project-name-mizu">{h.project}</span>
          </div>

          {project?.links?.length > 0 ? (
            <div className="hkd-links-mizu">
              {project.links.map((l) => (
                <Pill key={l.url} href={l.url} external solid={l.url === liveUrl(project)}>
                  {LINK_ICON[l.kind] || <ArrowIcon />}
                  {l.label}
                </Pill>
              ))}
            </div>
          ) : (
            <p className="hkd-nolinks-mizu">
              Qualification-round concept — nothing was deployed.
            </p>
          )}
         </div>
        </div>
      </div>
    </dialog>
  )
}

const Chevron = ({ dir }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
       style={{ transform: dir === 'left' ? 'rotate(180deg)' : undefined }}>
    <path d="M9 5l7 7-7 7" />
  </svg>
)
