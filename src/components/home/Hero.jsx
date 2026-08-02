import { PROFILE } from '../../data/profile.js'
import { StarField, PerspectiveGrid, Spotlight } from '../shared/Backdrop.jsx'
import { Pill, GitHubIcon, ArrowIcon } from '../shared/primitives.jsx'

/* ══════════════════════════════════════════════════
   Hero — two presentations of one block.

   Personal is the base: an animated plate behind
   everything, the whole block set into the bottom-left
   corner, name in mincho. Recruiter restores the
   centred column on the generated backdrop.

   Laid out in classes rather than inline styles on
   purpose — an inline style outranks any class, so a
   hero written the old way could not be re-composed by
   the mode switch at all.
   ══════════════════════════════════════════════════ */

export default function Hero() {
  const scrollTo = (sel) => (e) => {
    e.preventDefault()
    document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section id="hero" className="hero-sec-mizu">
      {/* Personal plate. Decorative, and the generated backdrop below
          is switched off with it so the two never stack. */}
      <img
        className="hero-gif-mizu"
        src="/profile/heropersonal.gif"
        alt=""
        aria-hidden="true"
        decoding="async"
      />
      <span className="hero-gif-scrim-mizu" aria-hidden="true" />

      {/* Outline mark. Sits after the scrim so it paints over it, and
          the kanji is already in the nav and title, so it is purely a
          device here. */}
      <span className="hero-mark-mizu" aria-hidden="true">{PROFILE.kanji}</span>

      <span className="hero-fx-mizu" aria-hidden="true">
        <StarField />
        <PerspectiveGrid />
        <Spotlight />
      </span>

      <div className="hero-wrap-mizu">
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

        <h1 className="hero-enter hero-name-mizu" style={{ animationDelay: '0.20s' }}>
          <span className="hero-name-latin-mizu">{PROFILE.name}</span>
          <span className="hero-name-kanji-mizu">{PROFILE.kanji}</span>
        </h1>

        <p className="hero-enter hero-tagline-mizu" style={{ animationDelay: '0.30s' }}>
          {PROFILE.tagline}
        </p>

        <p className="hero-enter hero-intro-mizu" style={{ animationDelay: '0.38s' }}>
          {PROFILE.intro}
        </p>

        <div className="hero-enter hero-cta-mizu" style={{ animationDelay: '0.46s' }}>
          <Pill href="#work" solid onClick={scrollTo('#work')}>
            View the work
            <span className="hero-cta-dot-mizu" aria-hidden="true">
              <ArrowIcon />
            </span>
          </Pill>

          <Pill href={PROFILE.contact.github} external>
            <GitHubIcon />
            GitHub
          </Pill>
        </div>
      </div>

      <div className="hero-scroll-mizu" aria-hidden="true">
        <div className="hero-scroll-rule-mizu" />
        <span>Scroll</span>
      </div>
    </section>
  )
}
