import { PROFILE } from '../../data/profile.js'
import { Pill, MailIcon, LinkedInIcon, GitHubIcon } from '../shared/primitives.jsx'
import { Reveal } from '../../hooks/useScrollReveal.jsx'

/* ══════════════════════════════════════════════════
   Contact — panel closer.

   Same shape as the Misaki deck's hero: a single
   rounded panel holding a mono kicker, an oversized
   two-tone headline, centred supporting copy, and a
   pair of CTAs. The second half of the headline drops
   to grey so the line reads as one sentence at two
   weights rather than two sentences.

   Credly is deliberately not here — it has its own
   button in the Certifications section, and a fourth
   pill would turn the CTA pair into a link farm.
   ══════════════════════════════════════════════════ */

export default function Contact() {
  const { availability, contact, location } = PROFILE

  return (
    <section id="contact" className="relative py-32 z-10" style={{ background: '#070707' }}>
      <div className="max-w-[1100px] mx-auto px-8">
        <Reveal>
          <div className="contact-panel-mizu">
            {/* Kicker */}
            <p className="contact-kicker-mizu">
              <span className="" aria-hidden="true" />
              {availability.status}
              <span className="contact-kicker-dot-mizu" aria-hidden="true">·</span>
              {location}
              <span className="contact-kicker-dot-mizu" aria-hidden="true">·</span>
              {availability.modes.join(' · ')}
            </p>

            {/* Two-tone headline.
                A closing argument, not a request. The lead makes a
                promise; the grey tail is the evidence for it — and the
                evidence is the rest of the page. */}
            <h2 className="contact-claim-mizu">
              <span className="contact-claim-lead-mizu">Give me a problem</span>
              <span className="contact-claim-lead-mizu">and a deadline.</span>
              <span className="contact-claim-tail-mizu">I ship.</span>
            </h2>

            <p className="contact-lede-mizu">
              Nine hackathons. Five of them built solo in eight days or less. A production CMS
              shipped during a four-month internship. {availability.headline}
            </p>

            <div className="contact-cta-mizu">
              <Pill href={`mailto:${contact.email}`} solid>
                <MailIcon />
                {contact.email}
              </Pill>
              <Pill href={contact.linkedin} external>
                <LinkedInIcon />
                LinkedIn
              </Pill>
              <Pill href={contact.github} external>
                <GitHubIcon />
                GitHub
              </Pill>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
