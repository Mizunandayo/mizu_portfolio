import { PROFILE } from '../../data/profile.js'
import { Pill, MailIcon, GitHubIcon, LinkedInIcon } from '../shared/primitives.jsx'
import { Reveal } from '../../hooks/useScrollReveal.jsx'

export default function Contact() {
  const { contact, contactDisplay, availability } = PROFILE

  return (
    <section id="contact" className="relative py-32 z-10" style={{ background: '#070707' }}>
      <div className="max-w-[1100px] mx-auto px-8">
        <Reveal>
          <div className="card-shell" style={{ maxWidth: 760, margin: '0 auto' }}>
            <div className="card-core" style={{ padding: 'clamp(32px, 5vw, 56px) clamp(24px, 4vw, 48px)', textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 9,
                  fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'rgba(212,212,216,0.75)',
                  marginBottom: 20,
                }}
              >
                <span
                  className="badge-dot-anim"
                  aria-hidden="true"
                  style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(74,222,128,0.95)' }}
                />
                {availability.status}
              </div>

              <h2
                style={{
                  fontFamily: 'Outfit, Poppins, system-ui, sans-serif',
                  fontSize: 'clamp(1.35rem,3.2vw,2.25rem)',
                  fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.12,
                  color: 'rgba(250,250,250,0.97)', marginBottom: 16,
                }}
              >
                Let’s build something together.
              </h2>

              <p
                className="small-copy"
                style={{
                  color: 'rgba(212,212,216,0.86)',
                  maxWidth: '34rem', margin: '0 auto 34px',
                  fontSize: '1rem', lineHeight: 1.7,
                }}
              >
                {availability.headline}
                <br />
                <span style={{ color: 'rgba(161,161,170,0.92)' }}>
                  {availability.locations} · {availability.modes.join(' · ')}
                </span>
              </p>

              <div className="flex flex-wrap gap-3 justify-center">
                <Pill href={`mailto:${contact.email}`} solid>
                  <MailIcon />
                  {contact.email}
                </Pill>
              </div>

              <div className="flex flex-wrap gap-3 justify-center mt-3">
                <Pill href={contact.linkedin} external>
                  <LinkedInIcon />
                  LinkedIn
                </Pill>
                <Pill href={contact.github} external>
                  <GitHubIcon />
                  GitHub
                </Pill>
              </div>

              <div
                style={{
                  marginTop: 34, paddingTop: 22,
                  borderTop: '1px solid rgba(161,161,170,0.2)',
                  display: 'flex', flexWrap: 'wrap', gap: '8px 26px', justifyContent: 'center',
                  fontFamily: '"SF Mono","Cascadia Code","JetBrains Mono",ui-monospace,monospace',
                  fontSize: '0.74rem', color: 'rgba(161,161,170,0.9)',
                  letterSpacing: '0.03em',
                }}
              >
                <span>{contactDisplay.linkedin}</span>
                <span aria-hidden="true" style={{ opacity: 0.4 }}>///</span>
                <span>{contactDisplay.github}</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
