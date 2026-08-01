import { useEffect, useRef, useCallback } from 'react'
import { formatPeriod } from '../../data/projects.js'
import { Layers, Pill, ArrowIcon, GitHubIcon, PlayIcon, ExternalIcon } from '../shared/primitives.jsx'
import { ImagePlaceholder, YouTubePlaceholder } from '../shared/placeholders.jsx'
import TechIcon from '../shared/TechIcon.jsx'

/* ══════════════════════════════════════════════════
   Project dialog.

   Image → title → summary → links → tech stack →
   gallery. This is the whole case study now: the
   standalone /work/<slug> pages were removed, so there
   is nothing further to link to.

   Local state, not a route — same as the hackathon
   dialog. Native <dialog> + showModal() gives focus
   trapping, ESC, top-layer stacking above the fixed
   nav and focus restore to the card; body scroll lock,
   backdrop-click and scroll containment are explicit.
   ══════════════════════════════════════════════════ */

const LINK_ICON = {
  repo:  <GitHubIcon />,
  video: <PlayIcon width="10" height="10" />,
  demo:  <ExternalIcon />,
}

export default function ProjectDialog({ project: p, onClose }) {
  const ref = useRef(null)
  const scrollRef = useRef(null)

  const close = useCallback(() => onClose(), [onClose])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!el.open) el.showModal()

    const onCancel = (e) => { e.preventDefault(); close() }
    el.addEventListener('cancel', onCancel)

    const prevOverflow = document.body.style.overflow
    const prevPad = document.body.style.paddingRight
    /* Compensate for the scrollbar the lock removes so the page behind
       does not visibly shift sideways. */
    const gap = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (gap > 0) document.body.style.paddingRight = `${gap}px`

    return () => {
      el.removeEventListener('cancel', onCancel)
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPad
      if (el.open) el.close()
    }
  }, [close])

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }) }, [p.slug])

  if (!p) return null

  const cover = p.media?.[0]
  /* The cover already leads the dialog — don't repeat it below. */
  const gallery = (p.media || []).slice(1)

  return (
    <dialog
      ref={ref}
      className="pdlg-mizu"
      aria-labelledby="pdlg-title"
      onClick={(e) => { if (e.target === ref.current) close() }}
    >
      <div className="pdlg-panel-mizu" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="pdlg-close-mizu" onClick={close} aria-label="Close">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="pdlg-scroll-mizu" ref={scrollRef}>
          {/* 1 — Cover */}
          {cover && (
            <div className="pdlg-cover-mizu">
              {cover.yt ? (
                <YouTubePlaceholder id={cover.yt} cap="" />
              ) : (
                <ImagePlaceholder
                  slug={p.slug}
                  src={cover.src}
                  cap=""
                  alt={`${p.name} — ${p.tagline}`}
                  ratio="16/9"
                  showCaption={false}
                />
              )}
            </div>
          )}

          <div className="pdlg-body-mizu">
            {/* 2 — Title */}
            <h2 id="pdlg-title" className="pdlg-title-mizu">
              {p.name}
              <span className="pdlg-title-kanji-mizu">{p.kanji}</span>
              {p.award && <span className="pdlg-award-mizu">{p.award}</span>}
            </h2>

            <p className="pdlg-meta-mizu">
              {[p.event, p.role, p.duration, formatPeriod(p.period)].join('  ·  ')}
            </p>

            {/* 3 — Summary */}
            <p className="pdlg-summary-mizu">{p.summary}</p>

            {/* 4 — Links */}
            {p.links?.length > 0 && (
              <div className="pdlg-links-mizu">
                {p.links.map((l, i) => (
                  <Pill key={l.url} href={l.url} external solid={i === 0}>
                    {LINK_ICON[l.kind] || <ArrowIcon />}
                    {l.label}
                  </Pill>
                ))}
              </div>
            )}
          </div>

          {/* 5 — Tech stack */}
          <section className="pdlg-block-mizu is-alt">
            <p className="micro-label font-bold uppercase text-zinc-300/90 pdlg-eyebrow-mizu">
              Tech stack
            </p>
            <Layers
              groups={p.stack}
              renderItem={(it, group) => (
                <div key={it.name} className="si-mizu">
                  <TechIcon name={it.name} category={group.category} />
                  <div className="si-text-mizu">
                    {it.role && <span className="si-role-mizu">{it.role}</span>}
                    <span className="si-name-mizu">
                      {it.name}
                      {it.ver && <span className="si-ver-mizu">{it.ver}</span>}
                    </span>
                  </div>
                </div>
              )}
            />
          </section>

          {/* 6 — Gallery */}
          {gallery.length > 0 && (
            <section className="pdlg-block-mizu">
              <p className="micro-label font-bold uppercase text-zinc-300/90 pdlg-eyebrow-mizu">
                Gallery
              </p>
              <div className="pdlg-gallery-mizu">
                {gallery.map((m) =>
                  m.yt ? (
                    <YouTubePlaceholder key={m.yt} id={m.yt} cap={m.cap} />
                  ) : (
                    <ImagePlaceholder key={m.src} slug={p.slug} src={m.src} cap={m.cap} ratio="16/9" />
                  )
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </dialog>
  )
}
