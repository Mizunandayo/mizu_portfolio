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

   The band carries a photographic backdrop, scrimmed
   hard in the middle where the copy sits — see
   .about-bg-mizu for why it has to be that heavy.
   ══════════════════════════════════════════════════ */

export default function About() {
  return (
    <section id="about" className="relative py-32 z-10 about-bg-mizu">
      <div className="about-inner-mizu max-w-[1100px] mx-auto px-8">
        <Reveal>
          <header className="ab-head-mizu">
            <p className="ab-kicker-mizu">About</p>
            <p className="ab-kana-mizu" aria-hidden="true">自己紹介</p>

            {/* Both names, on one line. The alias is how the work is
                signed everywhere else on the internet, so leaving it out
                of the introduction makes the two people look separate. */}
            <p className="ab-aka-mizu">
              {PROFILE.name}
              <span aria-hidden="true">·</span>
              known online as <strong>{PROFILE.alias}</strong>
              <span className="ab-aka-kanji-mizu" aria-hidden="true">
                {PROFILE.kanji}
              </span>
            </p>
          </header>
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

        {/* ── Skills ──
            Set as a shinamono-gaki — the itemised list on a shop's
            board — with each line numbered in kanji rather than
            digits. */}
        <Reveal delay={4}>
          <div className="about-skills-mizu">
            <span className="about-skills-label-mizu">
              Top skills
              <span className="ab-skills-kana-mizu" aria-hidden="true">品書</span>
            </span>

            <ul className="about-skills-list-mizu">
              {PROFILE.topSkills.map((s, i) => (
                <li key={s}>
                  <span className="about-skill-num-mizu" aria-hidden="true">
                    {'一二三四五六七八九十'[i] ?? i + 1}
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
