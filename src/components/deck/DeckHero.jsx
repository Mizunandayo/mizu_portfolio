import { StarField, PerspectiveGrid, Spotlight } from '../shared/Backdrop.jsx'
import { StatBar, Pill, GitHubIcon, PlayIcon, ArrowIcon } from '../shared/primitives.jsx'

const LINK_ICON = {
  repo:  <GitHubIcon />,
  video: <PlayIcon width="10" height="10" />,
  demo:  <ArrowIcon />,
}

export default function DeckHero({ project: p }) {
  const strip = [p.event, p.role, p.duration]

  return (
    <section className="relative overflow-hidden" style={{ background: '#050505' }}>
      <StarField count={140} />
      <PerspectiveGrid />
      <Spotlight />

      <div
        style={{
          position: 'relative', zIndex: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '160px 32px 90px',
          textAlign: 'center',
        }}
      >
        <div className="hero-enter hero-strip" style={{ animationDelay: '0.05s' }}>
          <div className="hero-strip-rule" />
          <div className="hero-strip-row">
            {strip.map((s, i) => (
              <span key={s} style={{ display: 'contents' }}>
                {i > 0 && <span className="hero-strip-slash" aria-hidden="true">///</span>}
                <span className="hero-strip-primary">{s}</span>
              </span>
            ))}
          </div>
          <div className="hero-strip-rule" />
        </div>

        <h1
          className="hero-enter"
          style={{
            animationDelay: '0.20s',
            fontWeight: 900,
            fontFamily: 'Outfit, Poppins, system-ui, sans-serif',
            letterSpacing: '-0.035em',
            lineHeight: 0.92,
            marginBottom: 18,
            fontSize: 'clamp(2.6rem,8vw,5.6rem)',
            display: 'flex', alignItems: 'baseline', justifyContent: 'center',
            gap: 'clamp(0.5rem,1.8vw,1.4rem)', flexWrap: 'wrap',
          }}
        >
          <span style={{ color: '#f5f5f5', letterSpacing: '0.02em' }}>{p.name}</span>
          <span style={{ color: 'rgba(113,113,122,0.95)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {p.kanji}
          </span>
        </h1>

        <p
          className="hero-enter"
          style={{
            animationDelay: '0.30s',
            fontSize: 'clamp(1rem,2.2vw,1.35rem)',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.58)',
            letterSpacing: '-0.01em',
            marginBottom: p.award ? 18 : 36,
            lineHeight: 1.4,
          }}
        >
          {p.tagline}
        </p>

        {p.award && (
          <div
            className="hero-enter"
            style={{
              animationDelay: '0.36s',
              marginBottom: 36,
              fontFamily: '"SF Mono","Cascadia Code","JetBrains Mono",ui-monospace,monospace',
              fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em',
              border: '1px solid rgba(212,212,216,0.34)',
              borderRadius: 6, padding: '7px 13px',
              color: 'rgba(250,250,250,0.96)',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            {p.award}
          </div>
        )}

        {p.links.length > 0 && (
          <div
            className="hero-enter"
            style={{
              animationDelay: '0.46s',
              display: 'flex', gap: 12, flexWrap: 'wrap',
              justifyContent: 'center', marginBottom: 52,
            }}
          >
            {p.links.map((l, i) => (
              <Pill key={l.url} href={l.url} external solid={i === 0}>
                {LINK_ICON[l.kind] || <ArrowIcon />}
                {l.label}
              </Pill>
            ))}
          </div>
        )}

        {p.stats?.length > 0 && (
          <StatBar
            stats={p.stats}
            max={p.stats.length > 3 ? 620 : 480}
            className="hero-enter"
            style={{ animationDelay: '0.54s' }}
          />
        )}
      </div>
    </section>
  )
}
