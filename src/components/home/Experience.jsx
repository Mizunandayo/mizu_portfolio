import { TRACK } from '../../data/experience.js'
import { ExternalIcon } from '../shared/primitives.jsx'
import { ImagePlaceholder } from '../shared/placeholders.jsx'
import { Reveal } from '../../hooks/useScrollReveal.jsx'

/* ══════════════════════════════════════════════════
   Experience & education — two kakejiku.

   Each record hangs as a scroll: cord, top roller,
   paper, bottom roller, with its heading written down
   the right edge in tategaki the way a scroll is
   titled. A hanging scroll is a record kept to be
   read, which is what these two are.

   The panel inside keeps its original org-* markup
   untouched — the scroll is a frame around it, so
   recruiter mode only has to drop the frame rather
   than restyle the contents.
   ══════════════════════════════════════════════════ */

const KANJI = { Experience: '職歴', Education: '学歴' }

export default function Experience() {
  return (
    <section id="experience" className="kj-page-mizu">
      <div className="kj-inner-mizu">
        <header className="kj-head-mizu">
          <p className="kj-kicker-mizu">Experience &amp; education</p>
          <p className="kj-kana-mizu" aria-hidden="true">履歴</p>
          <h2 className="kj-claim-mizu">
            Shipping production software.
          </h2>
        </header>

        <div className="org-grid-mizu kj-grid-mizu">
          {TRACK.map((t, i) => (
            <Reveal key={t.id} delay={Math.min(i + 1, 6)}>
              <div className="kj-scroll-mizu">
                <span className="kj-cord-mizu" aria-hidden="true" />
                <span className="kj-roller-mizu is-top" aria-hidden="true" />

                <div className="kj-paper-mizu">
                  <span className="kj-title-mizu" aria-hidden="true">
                    {KANJI[t.kind] ?? '履歴'}
                  </span>

                  <article className="org-panel-mizu">
                    <div className="org-logo-mizu">
                      <ImagePlaceholder
                        base="/orgs"
                        src={t.logo}
                        cap=""
                        alt={t.org}
                        ratio="1/1"
                        fit="contain"
                        showCaption={false}
                        label={t.kind}
                      />
                    </div>

                    <div className="org-kind-mizu">
                      {t.kind}
                      {t.note && <span className="org-note-mizu"> · {t.note}</span>}
                    </div>

                    <h3 className="org-name-mizu">{t.org}</h3>

                    <p className="org-title-mizu">{t.title}</p>

                    <div className="org-meta-mizu">
                      <span className="org-period-mizu">{t.period}</span>
                      {t.place && <span className="org-place-mizu">{t.place}</span>}
                    </div>

                    {t.body && <p className="org-body-mizu">{t.body}</p>}

                    {t.url && (
                      <div className="org-links-mizu">
                        <a
                          href={t.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="org-link-mizu"
                        >
                          Visit site
                          <ExternalIcon />
                        </a>
                      </div>
                    )}
                  </article>
                </div>

                <span className="kj-roller-mizu is-bot" aria-hidden="true" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
