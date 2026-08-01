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

/* Path from simple-icons (`siCredly`). Rendered via currentColor rather
   than Credly orange — §3.3 keeps brand colour to the stack chips. */
export const CredlyIcon = (props) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M23.8 13.154a.299.299 0 0 0-.101-.024.407.407 0 0 0-.202.048c-.06.028-.092.08-.127.136-.087.128-.15.268-.226.4-.107.187-.246.351-.38.515-.135.156-.286.291-.424.44-.028.027-.072.043-.107.027-.028-.016-.036-.056-.032-.088.04-.38.075-.763.123-1.138.02-.172.043-.336.063-.512.028-.247.056-.487.087-.735l.234-1.824c.02-.128.032-.372-.135-.52a.446.446 0 0 0-.233-.116.46.46 0 0 0-.254.06c-.226.16-.297.504-.365.76-.142.603-.178 1.241-.471 1.804a1.772 1.772 0 0 1-.202.316.668.668 0 0 1-.186.18.332.332 0 0 1-.246.051.365.365 0 0 1-.238-.207.871.87 0 0 1-.063-.324 4.499 4.499 0 0 1 .24-1.585c.045-.132.089-.252.104-.383.028-.156.028-.38-.114-.516-.131-.128-.337-.18-.504-.128-.194.056-.31.244-.372.392-.198.463-.25.95-.317 1.446-.044.327-.127.64-.293.926a2.717 2.717 0 0 1-.603.72c-.118.087-.222.123-.328.107a.376.376 0 0 1-.278-.208.875.875 0 0 1-.095-.315 3.361 3.36 0 0 1-.036-.616c.004-.223 0-.44.044-.658.075-.39.678-1.937.808-2.345.135-.407.262-.823.353-1.246.08-.38.123-.767.11-1.15-.007-.277-.07-.576-.288-.736a.611.61 0 0 0-.603-.048.968.968 0 0 0-.455.428 2.53 2.53 0 0 0-.226.59 12.01 12.01 0 0 0-.266 1.29c-.071.429-.138.848-.206 1.268-.06.355-.206 1.614-.261 1.88-.06.272-.175.54-.301.787-.131.268-.258.536-.408.791a.694.694 0 0 1-.175.224c-.08.06-.182.088-.27.048-.102-.048-.146-.176-.166-.292-.075-.435-.012-.875.072-1.302.083-.431.44-2.4.519-2.851.099-.532.24-1.05.285-1.59.028-.388.09-.88-.202-1.187-.115-.136-.31-.16-.44-.136-.174.036-.31.176-.388.296-.1.128-.186.28-.258.467-.115.284-.186.615-.261.91l-.032.129c-.083.383-.143.77-.186 1.162a16.95 16.948 0 0 0-.06.632c-.008.1-.016.203-.027.307 0 .08.007.168-.028.244a.304.304 0 0 1-.052.068c-.08.072-.202.06-.31.056-.557-.016-1.045.3-1.35.755-.18.252-.281.542-.39.834-.01.048-.034.1-.054.152-.051.143-.13.327-.222.511a3.037 3.037 0 0 1-.317.46 3.285 3.285 0 0 1-.384.41 1.123 1.123 0 0 1-.515.26c-.174.04-.384-.043-.543-.203a.916.916 0 0 1-.206-.54c-.004-.055-.004-.115.028-.163.05-.068.146-.072.23-.076a1.623 1.623 0 0 0 1.375-1.015c.138-.34.178-.698.122-1.046a1.193 1.193 0 0 0-.19-.48.9.9 0 0 0-.396-.323c-.293-.14-.658-.127-1.01.004-.575.232-.951.74-1.134 1.562l-.02.088c-.114.487-.23 1-.582 1.354-.127.12-.261.163-.368.143-.044-.004-.08-.04-.103-.075-.096-.16.003-.532.15-1a4.1 4.1 0 0 0 .1-.366.925.925 0 0 0-.108-.495.783.783 0 0 0-.372-.324c-.143-.064-.31-.06-.468-.06h-.047c-.044 0-.103 0-.151-.012a.215.215 0 0 1-.147-.127.485.485 0 0 1 .016-.232c.004-.02.012-.048.016-.072a.368.368 0 0 0-.162-.412.509.509 0 0 0-.468-.036.768.768 0 0 0-.364.348.769.769 0 0 0-.103.48c.04.13.07.32.043.475-.055.28-.222.51-.384.74-.04.05-.072.106-.107.16a4.96 4.96 0 0 1-.706.825c-.372.335-.804.575-1.232.67-.745.165-1.506-.06-1.91-.734-.222-.38-.32-.827-.348-1.266a5.425 5.425 0 0 1 .424-2.516c.328-.76.816-1.52 1.715-1.614.353-.04.753.083.912.4.115.23.075.506 0 .75-.072.244-.175.49-.18.75-.003.26.124.54.37.616.238.072.495-.08.634-.29.138-.21.186-.46.245-.704a6.282 6.281 0 0 1 .662-1.634c.139-.236.297-.488.254-.76a.543.543 0 0 0-.373-.415.543.543 0 0 0-.535.144c-.134.148-.206.371-.387.43-.17.06-.35-.055-.507-.134-.6-.32-1.336-.312-1.963-.048-.634.25-1.146.735-1.526 1.294C.462 8.53.098 9.508.022 10.48c-.027.34-.031.695 0 1.038.036.46.1.854.214 1.206.139.423.317.79.547 1.094.266.34.587.6.94.747.372.148.784.22 1.192.208a3.172 3.172 0 0 0 1.177-.283 4.29 4.29 0 0 0 1.026-.68c.309-.26.594-.559.84-.89.162-.224.309-.46.44-.708a4.83 4.83 0 0 0 .178-.383c.044-.104.087-.215.202-.26.056-.043.15-.02.202.013.064.04.115.075.135.135.048.116.02.232-.004.332v.012c-.028.1-.055.203-.091.303-.14.424-.238.811-.16 1.195.045.207.128.387.25.527a.84.84 0 0 0 .504.264c.246.04.51-.028.725-.132.143-.068.278-.156.397-.26.06-.06.122-.12.174-.184.044-.06.087-.147.178-.143a.15.15 0 0 1 .107.064c.028.031.04.071.06.115.23.52.776.84 1.335.84h.07c.27 0 .556-.093.79-.22.27-.14.48-.348.7-.552.02-.016.045-.04.073-.044.035-.008.07.012.099.044a.26.26 0 0 1 .047.1c.135.34.46.6.824.66a1.1 1.1 0 0 0 .99-.356c.056-.06.104-.128.167-.176.064-.044.15-.076.222-.044.107.04.135.164.182.268.107.235.357.371.615.375.289 0 .554-.148.764-.34.195-.183.353-.399.516-.61a.328.328 0 0 1 .106-.096c.04-.024.096-.028.13 0 .033.024.045.06.06.091.163.4.587.652 1.01.648.417-.004.809-.224 1.103-.516.095-.092.194-.2.32-.21.14-.017.207.114.254.22.072.142.115.238.25.338.158.116.36.152.547.1.17-.04.34-.156.47-.316.072-.088.112-.204.19-.284.092-.087.132.028.136.1.016.116.016.236.008.352-.016.236-.052.471-.08.703-.011.068-.02.136-.063.188-.06.068-.166.08-.253.064a2.898 2.898 0 0 0-.321-.028l-.14-.016c-.201-.012-.4-.036-.61-.044h-.185c-.404 0-.733.048-1.03.16-.48.187-.852.57-1.003 1.018a1.305 1.305 0 0 0-.052.64c.04.203.13.403.282.587.265.315.68.515 1.149.543.408.02.852-.064 1.292-.26.848-.367 1.482-1.094 1.696-1.95 0-.02.01-.039.023-.043.298-.104.57-.248.813-.428.245-.187.467-.399.65-.643.09-.12.174-.243.253-.37.07-.125.13-.257.202-.38a.906.906 0 0 0 .13-.316.411.411 0 0 0-.05-.328.257.257 0 0 0-.135-.124m-13.68-1.63c.017-.071.045-.14.06-.206a1.9 1.9 0 0 1 .262-.504c.04-.048.08-.1.135-.136a.246.246 0 0 1 .186-.048c.107.02.183.128.202.236.032.18-.04.396-.114.555a1.097 1.097 0 0 1-.31.415c-.06.044-.114.088-.178.116-.028.008-.063.028-.115.028h-.016c-.055 0-.114-.028-.126-.088a.827.827 0 0 1 .015-.367m4.308-.184c-.004.072-.024.148-.028.223a4.91 4.91 0 0 0 0 .779c.012.152.047.3-.016.444a1.069 1.069 0 0 1-.567.643.555.555 0 0 1-.245.056c-.02 0-.04-.004-.06-.004-.12 0-.214-.092-.265-.18a.871.87 0 0 1-.1-.272 2.129 2.129 0 0 1 .072-1.122c.08-.22.202-.435.38-.594a.874.874 0 0 1 .563-.24.31.31 0 0 1 .206.064c.04.044.06.104.056.164a.05.05 0 0 1 .004.04m6.43 4.653c-.015.044-.06.104-.08.14-.042.08-.102.163-.161.235a2.562 2.562 0 0 1-.317.304c-.238.18-.503.311-.777.387a2.025 2.025 0 0 1-.487.072h-.04a.795.795 0 0 1-.515-.18.433.433 0 0 1-.158-.25.537.537 0 0 1 .047-.305.776.776 0 0 1 .38-.383c.326-.16.682-.176 1.019-.16.139.004.265.012.4.02.107.004.218.012.325.024.056 0 .115.004.17.012.044.004.092-.004.135.008.06.004.068.036.06.076" />
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

export const ExternalIcon = (props) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M14 4h6v6" />
    <path d="M20 4 11 13" />
    <path d="M18 14v5a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19V8.2A1.6 1.6 0 0 1 5.6 6.6H10" />
  </svg>
)

export const PlayIcon = (props) => (
  <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" {...props}>
    <polygon points="4,2 13,8 4,14" />
  </svg>
)
