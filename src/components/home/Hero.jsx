import { PROFILE, HERO_STATS } from '../../data/profile.js'
import { StarField, PerspectiveGrid, Spotlight, RippleField } from '../shared/Backdrop.jsx'
import { StatBar, Pill, GitHubIcon, ArrowIcon } from '../shared/primitives.jsx'

export default function Hero() {
  const scrollTo = (sel) => (e) => {
    e.preventDefault()
    document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section id="hero" className="relative overflow-hidden" style={{ minHeight: '100dvh', background: '#050505' }}>
      <StarField />
      <PerspectiveGrid />
      <RippleField />
      <Spotlight />

      <div
        style={{
          position: 'relative', zIndex: 2,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          minHeight: '100dvh',
          padding: '100px 32px 60px',
          textAlign: 'center',
        }}
      >
        {/* Spec strip — hairline rules + mono tracking, no container */}
        <div className="hero-enter hero-strip" style={{ animationDelay: '0.05s' }}>
          <div className="hero-strip-rule" />
          <div className="hero-strip-row">
            {PROFILE.strip.map((s, i) => (
              <span key={s} style={{ display: 'contents' }}>
                {i > 0 && <span className="hero-strip-slash" aria-hidden="true">///</span>}
                <span className="hero-strip-primary">{s}</span>
              </span>
            ))}
          </div>
          <div className="hero-strip-rule" />
        </div>

        {/* Wordmark */}
        <h1
          className="hero-enter"
          style={{
            animationDelay: '0.20s',
            fontWeight: 900,
            fontFamily: 'Outfit, Poppins, system-ui, sans-serif',
            letterSpacing: '-0.035em',
            lineHeight: 0.92,
            marginBottom: 18,
            fontSize: 'clamp(2.5rem,7.4vw,5.6rem)',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: 'clamp(0.5rem,1.8vw,1.4rem)',
            flexWrap: 'wrap',
            maxWidth: '15ch',
          }}
        >
          <span style={{ color: '#f5f5f5', letterSpacing: '0.01em' }}>{PROFILE.name}</span>
          <span style={{ color: 'rgba(113,113,122,0.95)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {PROFILE.kanji}
          </span>
        </h1>

        <p
          className="hero-enter"
          style={{
            animationDelay: '0.30s',
            fontSize: 'clamp(1rem,2.2vw,1.4rem)',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.55)',
            letterSpacing: '-0.01em',
            marginBottom: 14,
            lineHeight: 1.4,
          }}
        >
          {PROFILE.tagline}
        </p>

        <p
          className="hero-enter"
          style={{
            animationDelay: '0.38s',
            fontSize: 'clamp(0.98rem,1.55vw,1.14rem)',
            fontWeight: 400,
            color: 'rgba(212,212,216,0.84)',
            maxWidth: 560,
            lineHeight: 1.75,
            marginBottom: 44,
          }}
        >
          {PROFILE.intro}
        </p>

        <div
          className="hero-enter"
          style={{
            animationDelay: '0.46s',
            display: 'flex', gap: 12, flexWrap: 'wrap',
            justifyContent: 'center', marginBottom: 52,
          }}
        >
          <Pill href="#work" solid onClick={scrollTo('#work')}>
            View the work
            <span
              aria-hidden="true"
              style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'rgba(0,0,0,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ArrowIcon />
            </span>
          </Pill>
          <Pill href={PROFILE.contact.github} external>
            <GitHubIcon />
            GitHub
          </Pill>
        </div>

        <StatBar stats={HERO_STATS} className="hero-enter" style={{ animationDelay: '0.54s' }} />

        <div
          className="hero-enter"
          style={{
            animationDelay: '0.62s',
            marginTop: 32,
            display: 'flex', flexWrap: 'wrap', gap: 20,
            justifyContent: 'center', alignItems: 'center',
          }}
        >
          {[
            { label: 'Open to', value: PROFILE.availability.modes.join(' · ') },
            { label: 'Based in', value: PROFILE.location },
            { label: 'Focus', value: 'Agentic AI · Full-stack' },
          ].map((m) => (
            <div key={m.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span
                style={{
                  fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.10em',
                  textTransform: 'uppercase', color: 'rgba(212,212,216,0.68)',
                }}
              >
                {m.label}
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(228,228,231,0.9)' }}>
                {m.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        style={{
          position: 'relative', zIndex: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 6, paddingBottom: 24, opacity: 0.28,
        }}
      >
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.5)' }} />
        <span
          style={{
            fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: 'rgba(228,228,231,0.78)',
          }}
        >
          Scroll
        </span>
      </div>
    </section>
  )
}
