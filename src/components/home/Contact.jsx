import { PROFILE } from "../../data/profile.js";
import {
  Pill,
  MailIcon,
  LinkedInIcon,
  GitHubIcon,
} from "../shared/primitives.jsx";
import { Reveal } from "../../hooks/useScrollReveal.jsx";

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

   The band runs a looping video behind the panel,
   scrimmed and frosted so the closing argument stays
   the loudest thing on it.

   In personal mode the panel is mounted on a kōsatsu —
   the roofed wooden board an official notice was
   posted on. The board is chrome around the existing
   panel, not a replacement for it, so recruiter mode
   only drops the frame.
   ══════════════════════════════════════════════════ */

export default function Contact() {
  const { availability, contact, location } = PROFILE;

  return (
    <section id="contact" className="relative py-32 z-10 contact-bg-mizu">
      {/* Ambient plate. Decorative and silent, so it stays out of the
          accessibility tree and out of the tab order — muted is also
          what makes autoplay permissible at all. */}
      <video
        className="contact-video-mizu"
        src="/profile/contactsection.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
      />
      <span className="contact-scrim-mizu" aria-hidden="true" />

      <div className="contact-inner-mizu max-w-[1100px] mx-auto px-8">
        <Reveal>
          <div className="kb-board-mizu">
            <span className="kb-roof-mizu" aria-hidden="true" />

            <div className="kb-face-mizu">
              <div className="contact-panel-mizu">
                {/* Kicker */}
                <p className="contact-kicker-mizu">
                  <span className="" aria-hidden="true" />
                  {availability.status}
                  <span className="contact-kicker-dot-mizu" aria-hidden="true">
                    ·
                  </span>
                  {location}
                  <span className="contact-kicker-dot-mizu" aria-hidden="true">
                    ·
                  </span>
                  {availability.modes.join(" · ")}
                </p>

                {/* Two-tone headline. Three short lines rather than a
                    sentence — at display size fragments land harder
                    than clauses, and these two are the actual job
                    description of every hackathon on this page. The
                    grey tail is the drop; the evidence for it is the
                    rest of the site. */}
                <h2 className="contact-claim-mizu">
                  <span className="contact-claim-lead-mizu">Hard problem.</span>
                  <span className="contact-claim-lead-mizu">Tight deadline.</span>
                  <span className="contact-claim-tail-mizu">I ship.</span>
                </h2>

                <p className="contact-lede-mizu">
                  Nine hackathons. Five of them built solo in eight days or
                  less. A production CMS shipped during a four-month internship.{" "}
                  {availability.headline}
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
            </div>

            {/* The two posts the board stands on. */}
            <span className="kb-posts-mizu" aria-hidden="true">
              <i />
              <i />
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
