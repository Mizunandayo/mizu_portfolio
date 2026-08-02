import { useState } from 'react'
import {
  HACKATHON_YEARS, HACKATHON_RECORD, HACKATHON_COUNT, PODIUM_COUNT, monthOf,
} from '../../data/hackathons.js'
import { mediaFor } from '../../data/hackathonMedia.js'
import { bySlug, liveUrl } from '../../data/projects.js'
import { SectionShell, ExternalIcon } from '../shared/primitives.jsx'
import { ImagePlaceholder } from '../shared/placeholders.jsx'
import { Reveal } from '../../hooks/useScrollReveal.jsx'
import HackathonDialog from './HackathonDialog.jsx'

/* ══════════════════════════════════════════════════
   Hackathons - vertical poster archive.

   Laid out as a Japanese poster: a tategaki spine
   running down the centre with a year column either
   side, oldest on the left. Podium finishes are the
   featured entries: framed, with crosshair register
   marks.

   Each entry opens a dialog carrying the full gallery
   and links. The whole entry is the hit target via an
   overlaid button; the project link is raised above it
   so it still works as a direct outbound link.
   ══════════════════════════════════════════════════ */

/* Oldest first, then alternating sides — so today that reads 2025 on
   the left and 2026 on the right, and a future year lands on the
   opposite side rather than breaking the composition. */
function columns() {
  const chrono = [...HACKATHON_YEARS].sort((a, b) => Number(a.year) - Number(b.year))
  return [
    chrono.filter((_, i) => i % 2 === 0),
    chrono.filter((_, i) => i % 2 === 1),
  ]
}

export default function Hackathons() {
  const [open, setOpen] = useState(null)
  const [left, right] = columns()

  const column = (bands, side) => (
    <div className={`hack-col-mizu hack-col-${side}-mizu`}>
      {bands.map((band) => (
        <section key={band.year} aria-label={String(band.year)}>
          <Reveal>
            <div className="hack-colhead-mizu">
              <span className="hack-colyear-mizu">{band.year}</span>
              <span className="hack-colcount-mizu">
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
    </div>
  )

  return (
    <SectionShell
      id="hackathons"
      alt
      wide
      eyebrow="Hackathons"
      /* Deliberately not a number: the copy line below already carries
         the counts, so a numeric headline would say the same thing
         twice. This carries the attitude. */
      claim="We keep on building!"
      copy={`Placed at the first attempt, and ${PODIUM_COUNT} podium finishes since - with ${HACKATHON_RECORD.peakMonth} entered inside a single month at the peak.`}
    >
      <div className="hack-poster-mizu">
        {column(left, 'a')}

        {/* Decorative: the section is already announced by its heading,
            and a screen reader reading "ハッカソン" mid-run would only
            repeat it in a language it is not set to. */}
        <div className="hack-spine-mizu" aria-hidden="true">
          <div className="hack-spine-stick-mizu">
            <span className="hack-spine-word-mizu">ハッカソン</span>
            <span className="hack-spine-rule-mizu" />
            <span className="hack-spine-num-mizu">{HACKATHON_COUNT}</span>
          </div>
        </div>

        {column(right, 'b')}
      </div>

      {open && <HackathonDialog hackathon={open} onClose={() => setOpen(null)} />}
    </SectionShell>
  )
}

function Entry({ hackathon: h, onOpen }) {
  const featured = Boolean(h.placement)
  const media = mediaFor(h.id, h.captions)
  const lead = media[0]

  /* The project line opens the deployed app, not the case study -
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
        aria-label={`${h.title} - open details and gallery`}
      />

      {lead && (
        <div className="hack-lead-mizu">
          <ImagePlaceholder
            url={lead.url}
            cap={lead.cap}
            alt={`${h.title} — ${lead.cap}`}
            ratio="16/9"
            showCaption={false}
            label={lead.cap}
          />
          {media.length > 1 && (
            <span className="hack-count-mizu" aria-hidden="true">
              {media.length} photos
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
            aria-label={`${h.project} - opens the live project in a new tab`}
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
