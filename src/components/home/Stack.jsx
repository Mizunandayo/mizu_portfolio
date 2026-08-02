import { STACK } from '../../data/stack.js'
import TechIcon from '../shared/TechIcon.jsx'
import { Reveal } from '../../hooks/useScrollReveal.jsx'

/* ══════════════════════════════════════════════════
   Stack — a tansu, the craftsman's chest.

   Eleven categories become eleven drawers: an ink label
   plate on the left carrying the kanji in tategaki, the
   drawer face on the right holding the tools. A stack
   of drawers is the one Japanese object that already
   means what this section means.

   Built without SectionShell for the same reason as
   Work, Certs and Hackathons — the shell sets its
   heading type inline, and an inline style cannot be
   re-set by a class.
   ══════════════════════════════════════════════════ */

/* One reading per drawer. 表 / 裏 — face and reverse — for frontend
   and backend is the pairing the whole set is built around. */
const KANJI = {
  'Languages': '言語',
  'AI & Agents': '知能',
  'GPU & Inference': '演算',
  'Speech & Language': '音声',
  'Vision & Physics': '視覚',
  'Web Data': '採取',
  'Frontend': '表',
  'Backend': '裏',
  'Data & Infrastructure': '基盤',
  'Security & Quality': '守護',
  'Tooling': '道具',
}

export default function Stack() {

  return (
    <section id="stack" className="tn-page-mizu">
      <div className="tn-inner-mizu">
        <header className="tn-head-mizu">
          <p className="tn-kicker-mizu">Technology</p>
          <p className="tn-kana-mizu" aria-hidden="true">道具箱</p>
          <h2 className="tn-claim-mizu">What I build with.</h2>
          <p className="tn-copy-mizu">
            Aggregated across all nine projects, ordered by depth of use rather
            than recency.
          </p>
        </header>

        <div className="tn-chest-mizu">
          {STACK.map((g, i) => (
            <Reveal key={g.category} delay={Math.min(i + 1, 6)}>
              <article className="tn-drawer-mizu">
                {/* Label plate. Tategaki kanji over the English name,
                    the way a tansu drawer is written up. */}
                <div className="tn-plate-mizu">
                  <span className="tn-kanji-mizu" aria-hidden="true">
                    {KANJI[g.category] ?? '道具'}
                  </span>
                  <span className="tn-plate-rule-mizu" aria-hidden="true" />
                  <h3 className="tn-cat-mizu">{g.category}</h3>
                  {/* Note lives with the label, which is where the
                      original layout had it — so recruiter mode is a
                      straight revert and not an approximation. */}
                  {g.note && <p className="tn-note-mizu">{g.note}</p>}
                  <span className="tn-count-mizu">{g.items.length}</span>
                </div>

                <div className="tn-face-mizu">
                  <span className="tn-pull-mizu" aria-hidden="true" />

                  <ul className="tn-items-mizu">
                    {g.items.map((it) => (
                      <li key={it.name} className="tn-tool-mizu">
                        <TechIcon name={it.name} category={g.category} />
                        <span className="tn-tool-text-mizu">
                          <span className="tn-tool-name-mizu">
                            {it.name}
                            {it.ver && <span className="tn-tool-ver-mizu">{it.ver}</span>}
                          </span>
                          {it.role && <span className="tn-tool-role-mizu">{it.role}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
