import { useState, useEffect } from 'react'
import { listCounts, readMine } from '../../data/likes.js'
import { LIKES_CHANGED } from '../../events.js'
import { ORDERED, UPCOMING, formatPeriod } from '../../data/projects.js'
import { ImagePlaceholder } from '../shared/placeholders.jsx'
import { Reveal } from '../../hooks/useScrollReveal.jsx'
import ProjectDialog from '../deck/ProjectDialog.jsx'

/* ══════════════════════════════════════════════════
   Work — vertical poster spread.

   Built without SectionShell, the same way About and
   Certifications are: the rule/title/rule masthead and
   the display word under the plates are a composition
   of their own and would fight the shell's stack.

   A torii stands over the whole spread — head in clear
   air above the plates, pillars running the full drop
   behind them. The head is an SVG and the pillars are
   CSS rules rather than one stretched graphic, so the
   beams keep their proportions no matter how tall the
   grid gets while the pillars still reach the floor.
   ══════════════════════════════════════════════════ */

/* Pillar x-positions, shared by the SVG and the CSS rules that
   continue them. Changing one without the other breaks the join. */
const PILLAR = { left: '22%', right: '78%' }

export default function Work() {
  const [open, setOpen] = useState(null)
  const [likes, setLikes] = useState({})
  /* Empty on the first render on purpose: localStorage does not exist
     during the prerender, and seeding from it here would hydrate into a
     different set of hearts than the HTML shipped with. */
  const [mine, setMine] = useState(() => new Set())

  /* One query for the whole grid, then patched in place. A like fired
     from the dialog carries its own new count, so the plate underneath
     updates without asking the server again. */
  useEffect(() => {
    let dead = false
    listCounts().then((all) => { if (!dead) setLikes(all) }).catch(() => {})
    setMine(readMine())

    const patch = (e) => {
      const { slug, likes: n, liked } = e.detail ?? {}
      if (!slug) return
      setLikes((prev) => ({ ...prev, [slug]: n }))
      setMine((prev) => {
        const next = new Set(prev)
        liked ? next.add(slug) : next.delete(slug)
        return next
      })
    }
    window.addEventListener(LIKES_CHANGED, patch)

    return () => {
      dead = true
      window.removeEventListener(LIKES_CHANGED, patch)
    }
  }, [])

  return (
    <section id="work" className="wk-page-mizu">
      <div className="wk-inner-mizu">
        <header className="wk-masthead-mizu">
          <div className="wk-mast-side-mizu">
            <span className="wk-mast-label-mizu">5/5 Mi-series</span>
            <span className="wk-mast-rule-mizu" aria-hidden="true" />
          </div>

          <h2 className="wk-mast-title-mizu">
            作品
            <span className="wk-mast-en-mizu">Selected Work</span>
          </h2>

          <div className="wk-mast-side-mizu wk-mast-right-mizu">
            <span className="wk-mast-label-mizu">
              {ORDERED.length} shipped · five solo in ≤8 days
            </span>
            <span className="wk-mast-rule-mizu" aria-hidden="true" />
          </div>
        </header>

        <div className="wk-shrine-mizu">
          <Torii />

          <div className="wk-grid-mizu">
            {ORDERED.map((p, i) => (
              <Reveal key={p.slug} delay={Math.min((i % 3) + 1, 6)} className="h-full">
                <Card
                  project={p}
                  likes={likes[p.slug]}
                  liked={mine.has(p.slug)}
                  onOpen={() => setOpen(p)}
                />
              </Reveal>
            ))}

            {/* The span goes on the Reveal, not the card — the wrapper
                is the grid item, and grid-column on a grandchild does
                nothing. */}
            <Reveal delay={1} className="wk-wide-mizu">
              <Teaser />
            </Reveal>
          </div>
        </div>

        {/* Decorative twin of the masthead heading — the accessible
            title is already up top, and repeating it here would just
            announce the section twice. */}
        <p className="wk-display-mizu" aria-hidden="true">PROJECTS</p>

        <p className="wk-lede-mizu">
          Agentic AI, computer vision and full-stack platforms. Five were built
          solo in eight days or less for international hackathons. Open any plate
          for the summary, gallery, stack and links.
        </p>
      </div>

      {open && <ProjectDialog project={open} onClose={() => setOpen(null)} />}
    </section>
  )
}

/* Stroke-only torii. vector-effect keeps every beam the same weight in
   screen pixels — without it the strokes scale with the viewBox and the
   gate thickens to a slab on a wide viewport. */
function Torii() {
  return (
    <div className="wk-torii-mizu" aria-hidden="true">
      <svg className="wk-torii-head-mizu" viewBox="0 0 100 34" preserveAspectRatio="none">
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        >
          {/* kasagi — the top beam, overhanging and swept up at the ends */}
          <path d="M1 8.4 Q 50 1.6 99 8.4" strokeWidth="4" vectorEffect="non-scaling-stroke" />
          {/* shimaki — the second beam sitting under it */}
          <path d="M6 13.6 Q 50 8.9 94 13.6" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          {/* nuki — the tie beam through the pillars */}
          <path d="M12 25 H 88" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          {/* gakuzuka — the short strut between them */}
          <path d="M50 14 V 25" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
          {/* hashira — pillar heads, continued below in CSS */}
          <path d="M22 12 V 34" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          <path d="M78 12 V 34" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>

      <span className="wk-pillar-mizu" style={{ left: PILLAR.left }} />
      <span className="wk-pillar-mizu" style={{ left: PILLAR.right }} />
    </div>
  )
}

/* The one plate with nothing behind it yet. A div, not a button: there
   is no dialog to open, and a button that does nothing when pressed is
   worse than no affordance at all.

   Runs the full width of the grid rather than sitting alone in a column
   with two holes beside it. Nine projects fill three rows exactly, so a
   tenth plate always starts a row of its own — spanning it turns that
   from a gap into a deliberate closing band. */
function Teaser() {
  const u = UPCOMING

  return (
    <div className="wk-card-mizu is-wip">


      {/* One centred column on one surface. The split into an art slot
          and a body panel is what put a solid block beside the hatch;
          with the hatch running the full plate there is nothing left to
          divide. */}
      <span className="wk-wip-inner-mizu">
        <span className="wk-wip-kanji-mizu" aria-hidden="true">
          {u.kanji}
        </span>

        <span className="wk-meta-mizu">{u.kicker}</span>

        {/* No inline kanji here — the mark above it is the same glyph,
            and printing 春 twice in one card reads as a mistake. */}
        <span className="wk-name-mizu">{u.name}</span>

        <span className="wk-desc-mizu">{u.tagline}</span>
      </span>

      {/* Same takeover the project plates use, saying the one thing
          there is to say about a plate with nothing behind it. */}
      <span className="wk-wip-veil-mizu" aria-hidden="true">
        <span className="wk-wip-jp-mizu">近日公開</span>
        <span className="wk-wip-soon-mizu">Coming soon</span>
      </span>
    </div>
  )
}

function Card({ project: p, likes, liked, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${p.name} — ${p.tagline}. Opens project details.`}
      className="wk-card-mizu"
    >
      {p.award && <span className="wk-ribbon-mizu">{p.award}</span>}

      {/* Hover takeover: the content blurs back and the project's glyph
          falls from the top edge to the centre. */}
      <span className="wk-veil-mizu" aria-hidden="true">
        <span className="wk-glyph-mizu">{p.kanji}</span>
      </span>

      {/* Preview is flush to the card's top and sides; the crop comes
          from object-fit so it stays inside the box. */}
      <span className="wk-shot-mizu">
        <ImagePlaceholder
          slug={p.slug}
          src={p.media[0].src}
          cap=""
          alt={`${p.name} — ${p.tagline}`}
          ratio="16/9"
          showCaption={false}
          label={p.name}
        />
      </span>

      <span className="wk-body-mizu">
        <span className="wk-meta-mizu">
          {p.event} · {formatPeriod(p.period)}
        </span>

        <span className="wk-name-mizu">
          {p.name}
          <span className="wk-kanji-mizu">{p.kanji}</span>

          {/* A read-only tally, not a control: this whole card is
              already a button and liking lives inside the dialog.
              Hidden at zero, which is noise rather than information. */}
          {likes > 0 && (
            <span className={`wk-likes-mizu${liked ? ' is-mine' : ''}`}>
              <svg
                width="18" height="18" viewBox="0 0 24 24"
                fill="currentColor" aria-hidden="true"
              >
                <path d="M12 20.4 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 0 1 19.4 13Z" />
              </svg>
              {likes}
            </span>
          )}
        </span>

        <span className="wk-desc-mizu">{p.tagline}</span>
      </span>
    </button>
  )
}
