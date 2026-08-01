import Seo from '../components/Seo.jsx'
import { StarField, PerspectiveGrid, Spotlight } from '../components/shared/Backdrop.jsx'
import { Pill, ArrowIcon } from '../components/shared/primitives.jsx'
import { PROFILE } from '../data/profile.js'

export default function NotFound() {
  return (
    <>
      <Seo
        title={`Not found — ${PROFILE.name}`}
        description="That page does not exist."
        path="/404"
      />
      <main id="main">
        <section className="relative overflow-hidden" style={{ minHeight: '100dvh', background: '#050505' }}>
          <StarField count={140} />
          <PerspectiveGrid />
          <Spotlight />

          <div
            style={{
              position: 'relative', zIndex: 2,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              minHeight: '100dvh', padding: '120px 32px', textAlign: 'center',
            }}
          >
            <div className="hero-strip hero-enter">
              <div className="hero-strip-rule" />
              <div className="hero-strip-row">
                <span className="hero-strip-primary">Error 404</span>
                <span className="hero-strip-slash" aria-hidden="true">///</span>
                <span className="hero-strip-primary">Page not found</span>
              </div>
              <div className="hero-strip-rule" />
            </div>

            <h1
              className="hero-enter"
              style={{
                animationDelay: '0.2s',
                fontFamily: 'Outfit, Poppins, system-ui, sans-serif',
                fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.9,
                fontSize: 'clamp(4rem,13vw,9rem)', color: '#f5f5f5', marginBottom: 20,
              }}
            >
              404
            </h1>

            <p
              className="hero-enter"
              style={{
                animationDelay: '0.3s',
                fontSize: 'clamp(0.98rem,1.55vw,1.14rem)',
                color: 'rgba(212,212,216,0.84)', maxWidth: 420,
                lineHeight: 1.75, marginBottom: 40,
              }}
            >
              This page doesn’t exist — but nine case studies do.
            </p>

            <div className="hero-enter" style={{ animationDelay: '0.4s' }}>
              <Pill href="/" solid>
                Back to the portfolio
                <ArrowIcon />
              </Pill>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
