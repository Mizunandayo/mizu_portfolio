import { PROFILE } from '../../data/profile.js'
import { SectionShell, Chip } from '../shared/primitives.jsx'
import { Reveal } from '../../hooks/useScrollReveal.jsx'

export default function About() {
  return (
    <SectionShell
      id="about"
      alt
      eyebrow="About"
      claim="I believe the best way to learn is by building."
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-14 pt-2">
        <div>
          {PROFILE.about.map((para, i) => (
            <Reveal key={i} delay={Math.min(i + 2, 6)}>
              <p
                className="prose-col"
                style={{
                  fontSize: '0.95rem',
                  lineHeight: 1.85,
                  color: 'rgba(212,212,216,0.86)',
                  marginBottom: i === PROFILE.about.length - 1 ? 0 : '1.4rem',
                }}
              >
                {para}
              </p>
            </Reveal>
          ))}
        </div>

        <div>
          <Reveal delay={3}>
            <div
              style={{
                fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'rgba(212,212,216,0.7)',
                marginBottom: 16,
              }}
            >
              Top skills
            </div>
            <div className="flex flex-wrap gap-2 mb-9">
              {PROFILE.topSkills.map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>
          </Reveal>

          <Reveal delay={4}>
            <div
              style={{
                borderTop: '1px solid rgba(161,161,170,0.24)',
                paddingTop: 20,
              }}
            >
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'rgba(212,212,216,0.7)',
                  marginBottom: 10,
                }}
              >
                <span
                  className="badge-dot-anim"
                  aria-hidden="true"
                  style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: 'rgba(74,222,128,0.95)', flexShrink: 0,
                  }}
                />
                {PROFILE.availability.status}
              </div>
              <p className="small-copy" style={{ color: 'rgba(212,212,216,0.86)' }}>
                {PROFILE.availability.headline}
                <br />
                <span style={{ color: 'rgba(161,161,170,0.9)' }}>
                  {PROFILE.availability.locations} · {PROFILE.availability.modes.join(' · ')}
                </span>
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </SectionShell>
  )
}
