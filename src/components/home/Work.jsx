import { Link, useLocation } from 'react-router-dom'
import { ORDERED, formatPeriod } from '../../data/projects.js'
import { SectionShell } from '../shared/primitives.jsx'
import { ImagePlaceholder } from '../shared/placeholders.jsx'
import { Reveal } from '../../hooks/useScrollReveal.jsx'

export default function Work() {
  const location = useLocation()

  return (
    <SectionShell
      id="work"
      wide
      eyebrow="Selected work"
      claim="Nine shipped projects — agentic AI, computer vision, and full-stack platforms."
      copy="Five of them built solo in eight days or less for international hackathons. Open any card for the summary, gallery, stack and links."
    >
      <div className="work-grid-mizu">
        {ORDERED.map((p, i) => (
          <Reveal key={p.slug} delay={Math.min((i % 3) + 1, 6)} className="h-full">
            <Card project={p} background={location} />
          </Reveal>
        ))}
      </div>
    </SectionShell>
  )
}

function Card({ project: p, background }) {
  return (
    <Link
      to={`/work/${p.slug}`}
      state={{ background }}
      aria-label={`${p.name} — ${p.tagline}. Opens project details.`}
      className="work-card-mizu"
    >
      {p.award && <span className="work-card-ribbon-mizu">{p.award}</span>}

      {/* Preview sits inset and is cropped by its frame — the image is
          scaled past the frame edges so it reads as a window onto a
          larger screen rather than a contained thumbnail. */}
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
    </Link>
  )
}
