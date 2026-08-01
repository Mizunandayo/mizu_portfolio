import { TRACK } from '../../data/experience.js'
import { SectionShell, ExternalIcon } from '../shared/primitives.jsx'
import { ImagePlaceholder } from '../shared/placeholders.jsx'
import { Reveal } from '../../hooks/useScrollReveal.jsx'

/* ══════════════════════════════════════════════════
   Experience & education — two logo-led panels.

   Side by side, separated by a hairline. Each panel is
   anchored by the organisation's mark at real size,
   then reads top-down: what it is, where, what role,
   when. No chart, no bars — there are two facts here
   and they should be readable, not plotted.
   ══════════════════════════════════════════════════ */

export default function Experience() {
  return (
    <SectionShell
      id="experience"
      alt
      eyebrow="Experience & education"
      claim="Shipping production software before graduating."
    >
      <div className="org-grid-mizu">
        {TRACK.map((t, i) => (
          <Reveal key={t.id} delay={Math.min(i + 1, 6)}>
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
          </Reveal>
        ))}
      </div>
    </SectionShell>
  )
}
