import { Link } from 'react-router-dom'
import { EXPERIENCE, EDUCATION } from '../../data/experience.js'
import { SectionShell, ArrowIcon } from '../shared/primitives.jsx'
import { Reveal } from '../../hooks/useScrollReveal.jsx'

export default function Experience() {
  return (
    <SectionShell
      id="experience"
      alt
      eyebrow="Experience & education"
      claim="Building in industry while finishing the degree."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 pt-2">
        <div>
          <Reveal delay={2}>
            <Heading>Experience</Heading>
          </Reveal>
          <div className="tl-mizu">
            {EXPERIENCE.map((e, i) => (
              <Reveal key={e.org} delay={Math.min(i + 3, 6)}>
                <div className="tl-item-mizu">
                  <span className="tl-dot-mizu now" aria-hidden="true" />
                  <div style={{ fontSize: '1.04rem', fontWeight: 700, color: 'rgba(250,250,250,0.96)', letterSpacing: '-0.015em' }}>
                    {e.title}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(212,212,216,0.88)', marginTop: 4 }}>
                    {e.org} · {e.kind}
                  </div>
                  <Meta>{e.period} · {e.length}</Meta>
                  <Meta>{e.place}</Meta>
                  <p className="small-copy" style={{ color: 'rgba(212,212,216,0.84)', marginTop: 12, maxWidth: '46ch' }}>
                    {e.body}
                  </p>
                  {e.slug && (
                    <Link
                      to={`/work/${e.slug}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontSize: '0.8rem', fontWeight: 600, marginTop: 12,
                        color: 'rgba(228,228,231,0.9)', textDecoration: 'none',
                      }}
                    >
                      Read the case study
                      <ArrowIcon />
                    </Link>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div>
          <Reveal delay={2}>
            <Heading>Education</Heading>
          </Reveal>
          <div className="tl-mizu">
            {EDUCATION.map((e, i) => (
              <Reveal key={e.org} delay={Math.min(i + 3, 6)}>
                <div className="tl-item-mizu">
                  <span className="tl-dot-mizu" aria-hidden="true" />
                  <div style={{ fontSize: '1.04rem', fontWeight: 700, color: 'rgba(250,250,250,0.96)', letterSpacing: '-0.015em' }}>
                    {e.org}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(212,212,216,0.88)', marginTop: 4 }}>
                    {e.field}
                  </div>
                  <Meta>{e.period}</Meta>
                  {e.body && (
                    <p className="small-copy" style={{ color: 'rgba(212,212,216,0.84)', marginTop: 12 }}>{e.body}</p>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

const Heading = ({ children }) => (
  <div
    style={{
      fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: 'rgba(212,212,216,0.7)',
      marginBottom: 22,
    }}
  >
    {children}
  </div>
)

const Meta = ({ children }) => (
  <div
    style={{
      fontFamily: '"SF Mono","Cascadia Code","JetBrains Mono",ui-monospace,monospace',
      fontSize: '0.76rem', color: 'rgba(161,161,170,0.92)', marginTop: 6, letterSpacing: '0.02em',
    }}
  >
    {children}
  </div>
)
