import { useState } from 'react'
import { ORDERED, formatPeriod } from '../../data/projects.js'
import { SectionShell, ArrowIcon } from '../shared/primitives.jsx'
import { ImagePlaceholder } from '../shared/placeholders.jsx'
import { Reveal } from '../../hooks/useScrollReveal.jsx'
import ProjectDialog from '../deck/ProjectDialog.jsx'

export default function Work() {
  const [open, setOpen] = useState(null)

  return (
    <SectionShell
      id="work"
      wide
      center
      eyebrow="Selected work"
      claim="Nine shipped projects: agentic AI, computer vision, and full-stack platforms."
      copy="Five of them built solo in eight days or less for international hackathons. Open any card for the summary, gallery, stack and links."
    >
      <div className="work-grid-mizu">
        {ORDERED.map((p, i) => (
          <Reveal key={p.slug} delay={Math.min((i % 3) + 1, 6)} className="h-full">
            <Card project={p} onOpen={() => setOpen(p)} />
          </Reveal>
        ))}
      </div>

      {open && <ProjectDialog project={open} onClose={() => setOpen(null)} />}
    </SectionShell>
  )
}

function Card({ project: p, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${p.name} — ${p.tagline}. Opens project details.`}
      className="work-card-mizu"
    >
      {p.award && <span className="work-card-ribbon-mizu">{p.award}</span>}

      {/* Hover takeover. Decorative only — the glyph is already in the
          title below, so it stays out of the accessibility tree. */}
      <span className="work-card-veil-mizu" aria-hidden="true">
        <span className="work-card-glyph-mizu">{p.kanji}</span>
      </span>

      {/* Preview is flush to the card's top and sides; the image is
          scaled past the frame so it reads as a window onto a larger
          screen rather than a contained thumbnail. */}
      <div className="work-card-shot-mizu">
        <ImagePlaceholder
          slug={p.slug}
          src={p.media[0].src}
          cap=""
          alt={`${p.name} — ${p.tagline}`}
          ratio="16/9"
          showCaption={false}
          label={p.name}
        />
      </div>

      <div className="work-card-body-mizu">
        <div className="work-card-meta-mizu">
          {p.event} · {formatPeriod(p.period)}
        </div>

        <h3 className="work-card-name-mizu">
          {p.name}
          <span className="work-card-kanji-mizu">{p.kanji}</span>
        </h3>

        <p className="work-card-desc-mizu">{p.tagline}</p>
      </div>
    </button>
  )
}
