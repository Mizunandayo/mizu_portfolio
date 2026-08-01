import { Link } from 'react-router-dom'
import { SectionShell, Layers, Pill, ArrowIcon } from '../shared/primitives.jsx'
import { ImagePlaceholder, YouTubePlaceholder } from '../shared/placeholders.jsx'
import { Reveal } from '../../hooks/useScrollReveal.jsx'

/* ── Overview ──────────────────────────────────────
   The summary is body copy, not a heading — it runs to
   three sentences and would be a poor <h2>. */
export function Overview({ project: p }) {
  return (
    <section id="overview" className="relative py-32 z-10" style={{ background: '#070707' }}>
      <div className="max-w-[1100px] mx-auto px-8">
        <Reveal>
          <p className="micro-label font-bold uppercase text-zinc-300/90 mb-7 text-center">
            Overview
          </p>
        </Reveal>
        <Reveal delay={1}>
          <p
            className="mx-auto text-center"
            style={{
              maxWidth: '46rem',
              fontSize: 'clamp(1.05rem,2.1vw,1.4rem)',
              lineHeight: 1.72,
              fontWeight: 400,
              color: 'rgba(228,228,231,0.9)',
              letterSpacing: '-0.011em',
            }}
          >
            {p.summary}
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/* ── Highlights ────────────────────────────────────
   Mitsu's arch-journey rows: ghosted step number in a
   52px column, headline + body + tech beside it. */
export function Highlights({ project: p }) {
  return (
    <SectionShell id="highlights" eyebrow="What was built" claim="Highlights">
      <div className="arch-wrap-mizu">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {p.highlights.map((h, i) => (
            <div key={h.headline}>
              <Reveal delay={Math.min(i + 1, 6)}>
                <div className="arch-jstep-mizu">
                  <div className="arch-jstep-num-mizu">{String(i + 1).padStart(2, '0')}</div>
                  <div>
                    <div className="arch-jstep-headline-mizu">{h.headline}</div>
                    <div className="arch-jstep-desc-mizu">{h.body}</div>
                    {h.tech && <div className="arch-jstep-tech-mizu">{h.tech}</div>}
                  </div>
                </div>
              </Reveal>

              {i < p.highlights.length - 1 && (
                <div className="arch-jconn-mizu" aria-hidden="true">
                  <div className="arch-jconn-track-mizu">
                    <div className="arch-jconn-vline-mizu" />
                    <div className="arch-jconn-arr-mizu">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 13l7 7 7-7" />
                      </svg>
                    </div>
                    <div className="arch-jconn-vline-mizu" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

/* ── Architecture ──────────────────────────────────
   The only place colour appears, and only to encode
   pipeline stage. Absent projects skip the block. */
const ACCENT = {
  cyan:    'an-cyan-mizu',
  emerald: 'an-emerald-mizu',
  violet:  'an-violet-mizu',
  blue:    'an-blue-mizu',
}

const DOT = {
  cyan:    'rgba(56,189,248,0.9)',
  emerald: 'rgba(74,222,128,0.9)',
  violet:  'rgba(192,132,252,0.9)',
  blue:    'rgba(96,165,250,0.9)',
}

export function Architecture({ project: p }) {
  if (!p.architecture?.length) return null

  return (
    <SectionShell
      id="architecture"
      alt
      eyebrow="Architecture"
      claim="How it works, stage by stage."
    >
      <div className="arch-wrap-mizu">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {p.architecture.map((a, i) => (
            <div key={a.name}>
              <Reveal delay={Math.min(i + 1, 6)}>
                <div className={`arch-jstep-mizu ${ACCENT[a.accent] || ''}`}>
                  <div
                    className="arch-jstep-num-mizu"
                    style={{ color: DOT[a.accent], opacity: 0.28, fontSize: '1.55rem', paddingTop: 5 }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: '"SF Mono","Cascadia Code","JetBrains Mono",ui-monospace,monospace',
                        fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: DOT[a.accent], marginBottom: 8,
                      }}
                    >
                      {a.stage}
                    </div>
                    <div className="arch-jstep-headline-mizu">{a.name}</div>
                    <div className="arch-jstep-desc-mizu" style={{ marginBottom: 0 }}>{a.detail}</div>
                  </div>
                </div>
              </Reveal>

              {i < p.architecture.length - 1 && (
                <div className="arch-jconn-mizu" aria-hidden="true">
                  <div className="arch-jconn-track-mizu">
                    <div className="arch-jconn-vline-mizu" />
                    <div className="arch-jconn-arr-mizu">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 13l7 7 7-7" />
                      </svg>
                    </div>
                    <div className="arch-jconn-vline-mizu" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex', flexWrap: 'wrap', gap: 16,
            marginTop: 24, paddingTop: 16,
            borderTop: '1px solid rgba(161,161,170,0.2)',
          }}
        >
          {p.architecture.map((a) => (
            <span
              key={a.stage}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: '0.8rem', color: 'rgba(228,228,231,0.9)',
              }}
            >
              <span
                aria-hidden="true"
                style={{ width: 8, height: 8, borderRadius: '50%', background: DOT[a.accent], flexShrink: 0 }}
              />
              {a.stage}
            </span>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

/* ── Tech stack ────────────────────────────────── */
export function TechStack({ project: p }) {
  return (
    <SectionShell id="stack" eyebrow="Tech stack" claim="Everything it runs on.">
      <Layers
        groups={p.stack}
        renderItem={(it) => (
          <div key={it.name} className="si-mizu">
            <div className="si-text-mizu">
              {it.role && <span className="si-role-mizu">{it.role}</span>}
              <span className="si-name-mizu">
                {it.name}
                {it.ver && <span className="si-ver-mizu">{it.ver}</span>}
              </span>
            </div>
          </div>
        )}
      />
    </SectionShell>
  )
}

/* ── Media gallery ─────────────────────────────── */
export function Gallery({ project: p }) {
  if (!p.media?.length) return null

  return (
    <SectionShell id="media" alt eyebrow="Media" claim="Screens and walkthrough." wide>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
        {p.media.map((m, i) => (
          <Reveal key={m.src || m.yt} delay={Math.min((i % 2) + 1, 6)}>
            {m.yt ? (
              <YouTubePlaceholder id={m.yt} cap={m.cap} />
            ) : (
              <ImagePlaceholder slug={p.slug} src={m.src} cap={m.cap} ratio={m.ratio} />
            )}
          </Reveal>
        ))}
      </div>
    </SectionShell>
  )
}

/* ── Links ─────────────────────────────────────── */
export function Links({ project: p }) {
  if (!p.links?.length) return null

  return (
    <SectionShell id="links" eyebrow="Links" claim="See it running." center>
      <div className="flex flex-wrap gap-3 justify-center">
        {p.links.map((l, i) => (
          <Pill key={l.url} href={l.url} external solid={i === 0}>
            {l.label}
            <ArrowIcon />
          </Pill>
        ))}
      </div>
    </SectionShell>
  )
}

/* ── Prev / next ───────────────────────────────── */
export function PrevNext({ prev, next }) {
  return (
    <section className="relative py-20 z-10" style={{ background: '#070707', borderTop: '1px solid rgba(161,161,170,0.18)' }}>
      <div className="max-w-[1100px] mx-auto px-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <NavCard project={prev} dir="prev" />
        <NavCard project={next} dir="next" />
      </div>
    </section>
  )
}

function NavCard({ project: p, dir }) {
  if (!p) return <div />
  const isNext = dir === 'next'

  return (
    <Link
      to={`/work/${p.slug}`}
      className="card-shell"
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        className="card-core"
        style={{
          padding: '22px 24px',
          textAlign: isNext ? 'right' : 'left',
          transition: 'background 170ms ease',
        }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            justifyContent: isNext ? 'flex-end' : 'flex-start',
            fontFamily: '"SF Mono","Cascadia Code","JetBrains Mono",ui-monospace,monospace',
            fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'rgba(161,161,170,0.92)',
            marginBottom: 10,
          }}
        >
          {!isNext && <ArrowIcon dir="left" />}
          {isNext ? 'Next' : 'Previous'}
          {isNext && <ArrowIcon />}
        </div>

        <div
          style={{
            display: 'flex', alignItems: 'baseline', gap: 10,
            justifyContent: isNext ? 'flex-end' : 'flex-start',
          }}
        >
          <span
            style={{
              fontFamily: 'Outfit, Poppins, system-ui, sans-serif',
              fontSize: '1.24rem', fontWeight: 800, letterSpacing: '-0.025em',
              color: 'rgba(250,250,250,0.97)',
            }}
          >
            {p.name}
          </span>
          <span style={{ fontSize: '1rem', color: 'rgba(113,113,122,0.95)', fontWeight: 700 }}>
            {p.kanji}
          </span>
        </div>

        <div className="small-copy" style={{ color: 'rgba(212,212,216,0.82)', marginTop: 6 }}>
          {p.tagline}
        </div>
      </div>
    </Link>
  )
}
