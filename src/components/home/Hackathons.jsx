import { useState } from 'react'
import {
  HACKATHON_YEARS, HACKATHON_RECORD, HACKATHON_COUNT, PODIUM_COUNT, monthOf,
} from '../../data/hackathons.js'
import { bySlug, liveUrl } from '../../data/projects.js'
import { SectionShell, ExternalIcon } from '../shared/primitives.jsx'
import { ImagePlaceholder } from '../shared/placeholders.jsx'
import { Reveal } from '../../hooks/useScrollReveal.jsx'
import HackathonDialog from './HackathonDialog.jsx'

/* ══════════════════════════════════════════════════
   Hackathons — editorial archive.

   Newest first, banded by year. Podium finishes are
   the featured entries: wider lead image, larger
   headline, framed with crosshair register marks.

   Each entry opens a dialog carrying the full gallery
   and links. The whole entry is the hit target via an
   overlaid button; the project link is raised above it
   so it still works as a direct outbound link.
   ══════════════════════════════════════════════════ */

const RECORD = [
  ['Entered',  HACKATHON_RECORD.entered],
  ['Podium',   HACKATHON_RECORD.podium],
  ['Projects', HACKATHON_RECORD.projects],
  ['Months',   HACKATHON_RECORD.months],
]

export default function Hackathons() {
  const [open, setOpen] = useState(null)

  return (
    <SectionShell
      id="hackathons"
      alt
      eyebrow="Hackathons"
      claim={`${HACKATHON_COUNT} hackathons across ${HACKATHON_RECORD.months} months.`}
      copy={`Placed at the first attempt, and ${PODIUM_COUNT} podium finishes since — with ${HACKATHON_RECORD.peakMonth} entered inside a single month at the peak.`}
    >
      <Reveal>
        <dl className="hack-record-mizu">
          {RECORD.map(([label, value], i) => (
            <div className="hack-record-cell-mizu" key={label}>
              {i > 0 && <span className="hack-record-sep-mizu" aria-hidden="true">///</span>}
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </Reveal>

      {HACKATHON_YEARS.map((band) => (
        <section key={band.year} className="hack-band-mizu" aria-label={band.year}>
          <Reveal>
            <div className="hack-year-mizu">
              <span className="hack-year-num-mizu">{band.year}</span>
              <span className="hack-year-rule-mizu" aria-hidden="true" />
              <span className="hack-year-count-mizu">
                {band.items.length} {band.items.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
          </Reveal>

          {band.items.map((h) => (
            <Reveal key={h.id}>
              <Entry hackathon={h} onOpen={() => setOpen(h)} />
            </Reveal>
          ))}
        </section>
      ))}

      {open && <HackathonDialog hackathon={open} onClose={() => setOpen(null)} />}
    </SectionShell>
  )
}

function Entry({ hackathon: h, onOpen }) {
  const featured = Boolean(h.placement)
  const lead = h.media?.[0]

  /* The project line opens the deployed app, not the case study —
     `liveUrl` reads the link flagged `primary: true` in projects.js. */
  const project = h.slug ? bySlug(h.slug) : null
  const url = project ? liveUrl(project) : null

  return (
    <article className={`hack-entry-mizu${featured ? ' is-featured' : ''}`}>
      {featured && (
        <>
          <span className="hack-cross-mizu tl" aria-hidden="true" />
          <span className="hack-cross-mizu tr" aria-hidden="true" />
          <span className="hack-cross-mizu bl" aria-hidden="true" />
          <span className="hack-cross-mizu br" aria-hidden="true" />
        </>
      )}

      {/* Covers the whole entry so anywhere is clickable, while leaving
          the real content out of the button's accessible name. */}
      <button
        type="button"
        className="hack-open-mizu"
        onClick={onOpen}
        aria-label={`${h.title} — open details and gallery`}
      />

      {lead && (
        <div className="hack-lead-mizu">
          <ImagePlaceholder
            base={`/hackathons/${h.id}`}
            src={lead.src}
            cap={lead.cap}
            alt={`${h.title} — ${lead.cap}`}
            ratio="16/9"
            showCaption={false}
            label={lead.cap}
          />
          {h.media.length > 1 && (
            <span className="hack-count-mizu" aria-hidden="true">
              {h.media.length} photos
            </span>
          )}
        </div>
      )}

      <div className="hack-text-mizu">
        <div className="hack-kicker-mizu">
          <span className="hack-kicker-date-mizu">{monthOf(h.sort)} {h.sort.slice(0, 4)}</span>
          <span className="hack-kicker-dot-mizu" aria-hidden="true">·</span>
          <span>{h.issuer}</span>
        </div>

        <h3 className="hack-headline-mizu">{h.title}</h3>

        {h.placement && <div className="hack-place-mizu">{h.placement}</div>}

        {h.note && <p className="hack-note-mizu">{h.note}</p>}

        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="hack-project-mizu"
            aria-label={`${h.project} — opens the live project in a new tab`}
          >
            {h.project}
            <ExternalIcon />
          </a>
        ) : (
          <span className="hack-project-mizu is-static">{h.project}</span>
        )}
      </div>
    </article>
  )
}
