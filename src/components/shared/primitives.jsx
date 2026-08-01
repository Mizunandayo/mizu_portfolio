import { Reveal } from '../../hooks/useScrollReveal.jsx'

/* ── Section shell ─────────────────────────────────
   Nine home sections and eight deck blocks share the
   same skeleton: py-32, 1100px column, eyebrow → claim
   → copy. One component, not seventeen copies. */
export function SectionShell({
  id,
  eyebrow,
  claim,
  copy,
  alt = false,
  center = false,
  wide = false,
  children,
}) {
  return (
    <section
      id={id}
      className="relative py-32 z-10"
      style={{ background: alt ? '#070707' : '#050505' }}
    >
      <div className={`${wide ? 'max-w-[1240px]' : 'max-w-[1100px]'} mx-auto px-8`}>
        {eyebrow && (
          <Reveal>
            <p className={`micro-label font-bold uppercase text-zinc-300/90 mb-6 ${center ? 'text-center' : ''}`}>
              {eyebrow}
            </p>
          </Reveal>
        )}

        {claim && (
          <Reveal delay={1}>
            <h2
              className={`font-black text-zinc-50 ${center ? 'mx-auto text-center' : ''}`}
              style={{
                fontFamily: 'Outfit, Poppins, system-ui, sans-serif',
                fontSize: 'clamp(1.35rem,3.2vw,2.25rem)',
                letterSpacing: '-0.035em',
                lineHeight: 1.12,
                maxWidth: center ? '40rem' : '52rem',
                marginBottom: copy ? '0.7em' : '1.1em',
              }}
            >
              {claim}
            </h2>
          </Reveal>
        )}

        {copy && (
          <Reveal delay={2}>
            <p
              className={`small-copy text-zinc-100/82 ${center ? 'mx-auto text-center' : ''}`}
              style={{
                maxWidth: '38rem',
                fontSize: 'clamp(0.92rem,1.1vw,1.08rem)',
                lineHeight: 1.75,
                marginBottom: '2.75rem',
              }}
            >
              {copy}
            </p>
          </Reveal>
        )}

        {children}
      </div>
    </section>
  )
}

/* ── Micro label ───────────────────────────────── */
export function MicroLabel({ children, className = '' }) {
  return (
    <div className={`micro-label font-semibold uppercase text-zinc-300/85 ${className}`}>
      {children}
    </div>
  )
}

/* ── Hairline rule ─────────────────────────────── */
export function Rule({ className = '' }) {
  return <div className={`h-px w-full bg-zinc-500/30 ${className}`} />
}

/* ── Stat bar ──────────────────────────────────── */
export function StatBar({ stats, max = 600, className = '', style = {} }) {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
        border: '1px solid rgba(163,163,163,0.25)',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'rgba(39,39,42,0.45)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        width: '100%',
        maxWidth: max,
        ...style,
      }}
    >
      {stats.map((s, i) => (
        <div
          key={s.lbl}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '18px 14px',
            borderLeft: i !== 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
          }}
        >
          <span
            className="num-mono"
            style={{
              fontSize: 'clamp(1.05rem,2.4vw,1.55rem)',
              fontWeight: 900,
              color: '#ffffff',
              marginBottom: 6,
              textAlign: 'center',
            }}
          >
            {s.num}
          </span>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 500,
              color: 'rgba(212,212,216,0.86)',
              textAlign: 'center',
              lineHeight: 1.45,
            }}
          >
            {s.lbl}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Pills ─────────────────────────────────────────
   Mitsu's hero CTA pair, verbatim. `solid` is the
   white primary; the default is the ghost variant. */
export function Pill({ href, children, solid = false, external = false, onClick, className = '' }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    fontSize: '0.88rem',
    padding: '14px 28px',
    borderRadius: 999,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
  }

  const solidStyle = { ...base, background: '#ffffff', color: '#050505', fontWeight: 700 }
  const ghostStyle = {
    ...base,
    border: '1px solid rgba(255,255,255,0.18)',
    color: 'rgba(255,255,255,0.72)',
    fontWeight: 500,
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  }

  const ext = external ? { target: '_blank', rel: 'noopener noreferrer' } : {}

  return (
    <a
      href={href}
      onClick={onClick}
      className={className}
      style={solid ? solidStyle : ghostStyle}
      {...ext}
      onMouseEnter={(e) => {
        if (solid) e.currentTarget.style.opacity = '0.86'
        else {
          e.currentTarget.style.color = '#fff'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.32)'
        }
      }}
      onMouseLeave={(e) => {
        if (solid) e.currentTarget.style.opacity = '1'
        else {
          e.currentTarget.style.color = 'rgba(255,255,255,0.72)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
        }
      }}
    >
      {children}
    </a>
  )
}

/* ── Small tech chip ───────────────────────────── */
export function Chip({ children }) {
  return (
    <span
      style={{
        fontSize: '0.74rem',
        fontWeight: 600,
        color: 'rgba(228,228,231,0.9)',
        border: '1px solid rgba(161,161,170,0.3)',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.02)',
        padding: '4px 9px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

/* ── Layered list — Stack + Certifications ─────────
   renderItem receives (item, group). Called explicitly rather than
   passed straight to .map, so the second argument is the group and
   not the array index. */
export function Layers({ groups, renderItem }) {
  return (
    <div className="stack-layers-mizu">
      {groups.map((g, i) => (
        <Reveal key={g.category || g.issuer} delay={Math.min(i + 1, 6)}>
          <div className="stack-layer-mizu">
            <div className="sl-cat-mizu">
              {g.category || g.issuer}
              {g.note && <span className="sl-cat-note-mizu">{g.note}</span>}
            </div>
            <div className="sl-cards-mizu">
              {g.items.map((item) => renderItem(item, g))}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  )
}

/* ── Icons ─────────────────────────────────────── */
export const GitHubIcon = (props) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
)

export const LinkedInIcon = (props) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
  </svg>
)

export const MailIcon = (props) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

export const ArrowIcon = ({ dir = 'right', ...props }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
       style={{ transform: dir === 'left' ? 'rotate(180deg)' : undefined }} {...props}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
)

export const PlayIcon = (props) => (
  <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" {...props}>
    <polygon points="4,2 13,8 4,14" />
  </svg>
)
