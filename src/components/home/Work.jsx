import { Link } from 'react-router-dom'
import { ORDERED } from '../../data/projects.js'
import { SectionShell, Chip, ArrowIcon } from '../shared/primitives.jsx'
import { ImagePlaceholder } from '../shared/placeholders.jsx'
import { Reveal } from '../../hooks/useScrollReveal.jsx'

export default function Work() {
  return (
    <SectionShell
      id="work"
      wide
      eyebrow="Selected work"
      claim="Nine shipped projects — agentic AI, computer vision, and full-stack platforms."
      copy="Five of them built solo in eight days or less for international hackathons. Each has its own case study."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ORDERED.map((p, i) => (
          <Reveal key={p.slug} delay={Math.min((i % 3) + 1, 6)} className="h-full">
            <Card project={p} />
          </Reveal>
        ))}
      </div>
    </SectionShell>
  )
}

function Card({ project: p }) {
  return (
    <Link to={`/work/${p.slug}`} className="work-card-mizu card-shell" style={{ position: 'relative' }}>
      {p.award && <span className="work-card-ribbon-mizu">{p.award}</span>}

      <div className="work-card-core-mizu card-core">
        <div style={{ padding: 12, paddingBottom: 0 }}>
          <ImagePlaceholder slug={p.slug} src={p.media[0].src} cap="" ratio="16/9" />
        </div>

        <div className="work-card-body-mizu">
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <span
              style={{
                fontFamily: 'Outfit, Poppins, system-ui, sans-serif',
                fontSize: '1.16rem', fontWeight: 800, letterSpacing: '-0.025em',
                color: 'rgba(250,250,250,0.97)',
              }}
            >
              {p.name}
            </span>
            <span style={{ fontSize: '0.98rem', color: 'rgba(113,113,122,0.95)', fontWeight: 700 }}>
              {p.kanji}
            </span>
          </div>

          <div
            className="micro-label"
            style={{
              fontFamily: '"SF Mono","Cascadia Code","JetBrains Mono",ui-monospace,monospace',
              textTransform: 'uppercase', fontWeight: 600,
              color: 'rgba(161,161,170,0.92)',
              marginBottom: 10, lineHeight: 1.5,
            }}
          >
            {p.event}
          </div>

          <p
            style={{
              fontSize: '0.9rem', lineHeight: 1.6,
              color: 'rgba(212,212,216,0.86)',
              marginBottom: 14,
            }}
          >
            {p.tagline}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {p.chips.map((c) => (
              <Chip key={c}>{c}</Chip>
            ))}
          </div>

          <div
            className="mt-auto pt-3.5 flex items-center justify-between"
            style={{ borderTop: '1px solid rgba(161,161,170,0.2)' }}
          >
            <span style={{ fontSize: '0.78rem', color: 'rgba(161,161,170,0.9)' }}>
              {p.duration} · {p.role.split('·')[0].trim()}
            </span>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: '0.78rem', fontWeight: 600, color: 'rgba(228,228,231,0.9)',
              }}
            >
              Case study
              <ArrowIcon />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
