import { Link } from 'react-router-dom'
import { AWARDS } from '../../data/awards.js'
import { SectionShell, ArrowIcon } from '../shared/primitives.jsx'
import { Reveal } from '../../hooks/useScrollReveal.jsx'

export default function Awards() {
  return (
    <SectionShell
      id="awards"
      alt
      eyebrow="Honors & awards"
      claim="Seven hackathon results across two years."
      copy="Two podium finishes, one Final Pitch, and four international AI hackathons."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {AWARDS.map((a, i) => (
          <Reveal key={a.title + a.date} delay={Math.min((i % 2) + 1, 6)}>
            <div
              className="h-full"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(163,163,163,0.22)',
                borderRadius: 12,
                padding: '22px 24px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <span
                  style={{
                    fontSize: '1.02rem', fontWeight: 700, letterSpacing: '-0.02em',
                    color: 'rgba(250,250,250,0.96)', lineHeight: 1.35,
                  }}
                >
                  {a.title}
                </span>
                {a.placement && (
                  <span
                    style={{
                      flexShrink: 0,
                      fontFamily: '"SF Mono","Cascadia Code","JetBrains Mono",ui-monospace,monospace',
                      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
                      border: '1px solid rgba(212,212,216,0.34)',
                      borderRadius: 5, padding: '4px 8px',
                      color: 'rgba(250,250,250,0.96)', whiteSpace: 'nowrap',
                    }}
                  >
                    {a.placement}
                  </span>
                )}
              </div>

              <div
                style={{
                  fontFamily: '"SF Mono","Cascadia Code","JetBrains Mono",ui-monospace,monospace',
                  fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: 'rgba(161,161,170,0.92)', marginBottom: 12,
                }}
              >
                {a.issuer} · {a.date}
              </div>

              <p className="small-copy" style={{ color: 'rgba(212,212,216,0.86)', marginBottom: 14 }}>
                {a.project}
              </p>

              {a.slug && (
                <Link
                  to={`/work/${a.slug}`}
                  className="mt-auto"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: '0.79rem', fontWeight: 600,
                    color: 'rgba(228,228,231,0.9)', textDecoration: 'none',
                  }}
                >
                  Case study
                  <ArrowIcon />
                </Link>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  )
}
