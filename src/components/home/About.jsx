import { PROFILE } from '../../data/profile.js'
import { ImagePlaceholder } from '../shared/placeholders.jsx'
import { Reveal } from '../../hooks/useScrollReveal.jsx'

/* ══════════════════════════════════════════════════
   About — centred, portrait-led.

   No frame, no rules, no stamp: the portrait is a
   transparent cut-out sitting directly on the section
   band, so any container would fight it. Everything is
   centred on one axis, but the prose stays
   left-aligned — centred body copy is hard to read at
   any measure.

   Built without SectionShell so the portrait can sit
   between the eyebrow and the claim.
   ══════════════════════════════════════════════════ */

export default function About() {
  return (
    <section id="about" className="relative py-32 z-10" style={{ background: '#070707' }}>
      <div className="max-w-[1100px] mx-auto px-8">
        <Reveal>
          <p className="micro-label font-bold uppercase text-zinc-300/90 text-center mb-11">
            About
          </p>
        </Reveal>

        {/* ── Portrait ── */}
        <Reveal delay={1}>
          <figure className="about-file-mizu">
            <ImagePlaceholder
              base="/profile"
              src={PROFILE.portrait.src}
              cap=""
              alt={PROFILE.portrait.alt}
              ratio="4/5"
              fit="contain"
              showCaption={false}
              label="Portrait"
            />
          </figure>
        </Reveal>

        {/* ── Claim ── */}
        <Reveal delay={2}>
          <h2 className="about-claim-mizu">{PROFILE.claim}</h2>
        </Reveal>

        {/* ── Prose ── */}
        <div className="about-body-mizu">
          {PROFILE.about.map((para, i) => (
            <Reveal key={i} delay={Math.min(i + 3, 6)}>
              <p className="about-para-mizu">{para}</p>
            </Reveal>
          ))}
        </div>

        {/* ── Skills ── */}
        <Reveal delay={4}>
          <div className="about-skills-mizu">
            <span className="about-skills-label-mizu">Top skills</span>

            <ul className="about-skills-list-mizu">
              {PROFILE.topSkills.map((s, i) => (
                <li key={s}>
                  <span className="about-skill-num-mizu">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
