import { PROFILE, CHANNELS } from '../../data/profile.js'
import { ArrowIcon } from '../shared/primitives.jsx'
import { Reveal } from '../../hooks/useScrollReveal.jsx'

/* ══════════════════════════════════════════════════
   Contact — closing statement + channel directory.

   No card, no centred stack of buttons. The statement
   runs at display scale, and every way to reach him is
   one row in a directory: label, the actual address,
   and an arrow. Same shape for all four, so nothing
   competes and the addresses are readable rather than
   hidden behind a word like "LinkedIn".
   ══════════════════════════════════════════════════ */

export default function Contact() {
  const { availability } = PROFILE

  return (
    <section id="contact" className="relative py-32 z-10" style={{ background: '#070707' }}>
      <div className="max-w-[1100px] mx-auto px-8">
        {/* Status strip */}
        <Reveal>
          <div className="contact-strip-mizu">
            <span className="contact-status-mizu">
              <span className="badge-dot-anim contact-dot-mizu" aria-hidden="true" />
              {availability.status}
            </span>
            <span className="contact-strip-rule-mizu" aria-hidden="true" />
            <span className="contact-where-mizu">
              {availability.locations} · {availability.modes.join(' · ')}
            </span>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <h2 className="contact-claim-mizu">
            Let’s build
            <br />
            something together.
          </h2>
        </Reveal>

        <Reveal delay={2}>
          <p className="contact-lede-mizu">{availability.headline}</p>
        </Reveal>

        {/* Channel directory */}
        <div className="contact-dir-mizu">
          {CHANNELS.map((c, i) => (
            <Reveal key={c.key} delay={Math.min(i + 2, 6)}>
              <a
                href={c.href}
                className="contact-row-mizu"
                {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                <span className="contact-row-label-mizu">{c.label}</span>
                <span className="contact-row-value-mizu">{c.value}</span>
                <span className="contact-row-arrow-mizu" aria-hidden="true">
                  <ArrowIcon />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
