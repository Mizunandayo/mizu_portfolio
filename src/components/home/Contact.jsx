import { useState } from "react";
import { PROFILE } from "../../data/profile.js";
import {
  MailIcon,
  LinkedInIcon,
  GitHubIcon,
} from "../shared/primitives.jsx";
import { candidatesFor } from "../shared/placeholders.jsx";
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
      {/* Ambient plate. Decorative, so it stays out of the accessibility
          tree and out of the tab order. */}
      <Plate />
      <span className="contact-scrim-mizu" aria-hidden="true" />

      <div className="contact-inner-mizu ms-wrap-mizu">
        <Reveal>
          <header className="ms-head-mizu">
            <span className="ms-head-jp-mizu" aria-hidden="true">
              名刺
            </span>
            <span className="ms-head-en-mizu">Card</span>
            <span className="ms-head-rule-mizu" aria-hidden="true" />
          </header>

          {/* Two-tone headline. Three short lines rather than a
              sentence: at display size fragments land harder than
              clauses, and these two are the actual job description of
              every hackathon on this page. The grey tail is the drop;
              the evidence for it is the rest of the site. */}
          <h2 className="contact-claim-mizu">
            <span className="contact-claim-lead-mizu">Hard problem.</span>
            <span className="contact-claim-lead-mizu">Tight deadline.</span>
            <span className="contact-claim-tail-mizu">I ship.</span>
          </h2>

          <p className="contact-lede-mizu">
            Nine hackathons. Five of them built solo in eight days or less. A
            production CMS shipped during a four-month internship.{" "}
            {availability.headline}
          </p>
        </Reveal>

        <Reveal delay={2}>
          {/* Two cards on a surface, the way a meishi is actually handed
              over: the Japanese face and the English one. The card is
              held at true 91×55mm proportions — a business card that is
              not card-shaped stops reading as a business card, so the
              type is sized to fit the ratio rather than the reverse. */}
          <div className="ms-stack-mizu">
            <div className="ms-card-mizu is-back" aria-hidden="true">
              <span className="ms-jp-name-mizu">水</span>
              <span className="ms-jp-lines-mizu">
                <span>ソフトウェア技術者</span>
                <span>フィリピン・バターン</span>
              </span>
            </div>

            <div className="ms-card-mizu is-face">
              {/* A hanko impression. Traditionally vermilion, but the
                  page is committed to monochrome, so it reads as a seal
                  through its shape and reversed glyph instead. */}
              <span className="ms-seal-mizu" aria-hidden="true">
                {PROFILE.kanji}
              </span>

              <p className="ms-name-mizu">{PROFILE.name}</p>
              <p className="ms-role-mizu">{PROFILE.role}</p>

              <span className="ms-rule-mizu" aria-hidden="true" />

              <ul className="ms-lines-mizu">
                <li>
                  <a href={`mailto:${contact.email}`}>
                    <MailIcon />
                    <span>{contact.email}</span>
                  </a>
                </li>
                <li>
                  <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
                    <LinkedInIcon />
                    <span>{PROFILE.contactDisplay.linkedin}</span>
                  </a>
                </li>
                <li>
                  <a href={contact.github} target="_blank" rel="noopener noreferrer">
                    <GitHubIcon />
                    <span>{PROFILE.contactDisplay.github}</span>
                  </a>
                </li>
              </ul>

              <p className="ms-loc-mizu">{location}</p>
            </div>
          </div>

          {/* The slip that comes with it. Kept off the card because a
              meishi prints what is permanent; availability is not. */}
          <p className="ms-slip-mizu">
            <span className="ms-dot-mizu" aria-hidden="true" />
            {availability.status}
            <span className="ms-slip-sep-mizu" aria-hidden="true">
              ·
            </span>
            {availability.modes.join(" / ")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* The backdrop behind the panel.

   It was a <video>, and the source is now a still. A <video> element
   will not render a PNG — it fails silently and shows nothing, which is
   exactly what it had been doing since the swap.

   The extension is not hardcoded. candidatesFor walks png, jpg, jpeg,
   webp and avif, so replacing the file with a different format is a
   drop-in with no code change — the same rule the project galleries and
   certification badges already follow. */
function Plate() {
  const [attempt, setAttempt] = useState(0);
  const candidates = candidatesFor("/profile/contactsection.png");
  const src = candidates[attempt] ?? candidates[0];

  return (
    <img
      /* Keyed on the candidate so a fallback swaps the element rather
         than mutating a src the browser has already marked failed. */
      key={src}
      className="contact-plate-mizu"
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      onError={() =>
        setAttempt((a) => (a < candidates.length - 1 ? a + 1 : a))
      }
    />
  );
}
