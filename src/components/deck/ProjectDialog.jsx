import { useEffect, useRef, useState, useCallback } from 'react'
import { formatPeriod } from '../../data/projects.js'
import LikeButton from './LikeButton.jsx'
import { Layers, Pill, ArrowIcon, GitHubIcon, PlayIcon, ExternalIcon } from '../shared/primitives.jsx'
import { ImagePlaceholder, YouTubePlaceholder } from '../shared/placeholders.jsx'
import { shotsFor } from '../../data/projectMedia.js'
import Lightbox from '../shared/Lightbox.jsx'
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
  /* Which still is open full size. -1 is closed. */
  const [shot, setShot] = useState(-1)

  /* Held in a ref so the effect below can key on nothing. onClose comes
     in as an inline arrow, so it is a new function on every parent
     render — with it in the deps, anything that re-rendered the grid
     tore this effect down and ran it again, which closes the dialog and
     immediately reopens it. Liking a project did exactly that. */
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])

  const close = useCallback(() => closeRef.current(), [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!el.open) el.showModal()

    const onCancel = (e) => { e.preventDefault(); closeRef.current() }
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
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
    setShot(-1)
  }, [p.slug])

  if (!p) return null

  const cover = p.media?.[0]

  /* Gallery comes from the folder when there is one: drop p1 … p10 into
     src/assets/work/<slug>/ and exactly those render, the way the
     hackathon galleries already work.

     Videos stay declared — a YouTube id is not a file and cannot be
     discovered — and they lead, which is the order every mi-series
     project already uses: the presentation first, then the stills.
     With no folder yet, the project's own media array is used
     unchanged, so nothing goes blank while the images are still being
     gathered. */
  const shots = shotsFor(p.slug, p.shotCaptions)
  const rest = (p.media || []).slice(1)
  const gallery = shots.length
    ? [...rest.filter((m) => m.yt), ...shots]
    : rest

  /* Only the stills open in the viewer. The video tile already has a
     destination — YouTube — and swallowing that click to show a
     thumbnail nobody asked for would be worse than useless.

     Indexed separately from `gallery` so stepping through the viewer
     never lands on the video and stalls. */
  const viewable = gallery.filter((m) => !m.yt)
  const seatOf = (m) => viewable.indexOf(m)

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
            <div className="pdlg-titlerow-mizu">
              <h2 id="pdlg-title" className="pdlg-title-mizu">
                {p.name}
                <span className="pdlg-title-kanji-mizu">{p.kanji}</span>
                {p.award && <span className="pdlg-award-mizu">{p.award}</span>}
              </h2>

              <LikeButton slug={p.slug} />
            </div>

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
                {/* Captions carried off — the panels are screenshots of
                    the thing the page has just described in full, and a
                    line of grey text under each one was labelling the
                    obvious. `cap` stays on every tile as its alt text
                    and its fallback label. */}
                {gallery.map((m) =>
                  m.yt ? (
                    <YouTubePlaceholder
                      key={m.yt}
                      id={m.yt}
                      cap={m.cap}
                      showCaption={false}
                    />
                  ) : (
                    /* A real button, not a div with onClick — it has to
                       be reachable by keyboard and announce itself, and
                       the tile is genuinely an action now. */
                    <button
                      key={m.key ?? m.src}
                      type="button"
                      className="pdlg-shot-mizu"
                      onClick={() => setShot(seatOf(m))}
                      aria-label={`View ${m.cap || 'image'} full size`}
                    >
                      <ImagePlaceholder
                        /* Discovered media carries a resolved url; a
                           declared one needs the slug so the component
                           can walk the format candidates. */
                        url={m.url}
                        slug={m.url ? undefined : p.slug}
                        src={m.src}
                        cap={m.cap}
                        ratio="16/9"
                        showCaption={false}
                      />
                    </button>
                  )
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      <Lightbox
        items={viewable}
        index={shot}
        slug={p.slug}
        onIndex={setShot}
        onClose={() => setShot(-1)}
      />
    </dialog>
  )
}
