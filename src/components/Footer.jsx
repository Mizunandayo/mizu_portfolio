import { Link } from 'react-router-dom'
import { PROFILE } from '../data/profile.js'

export default function Footer() {
  return (
    <footer
      style={{
        background: '#050505',
        borderTop: '1px solid rgba(161,161,170,0.18)',
        padding: '38px 32px',
      }}
    >
      <div className="max-w-[1100px] mx-auto flex flex-wrap items-center justify-between gap-5">
        <Link
          to="/"
          className="flex items-center gap-2 no-underline"
          style={{
            fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'rgba(228,228,231,0.9)',
          }}
        >
          <span style={{ fontSize: '0.95rem', letterSpacing: '-0.01em' }}>{PROFILE.kanji}</span>
          {PROFILE.brand}
        </Link>

        <div
          style={{
            fontFamily: '"SF Mono","Cascadia Code","JetBrains Mono",ui-monospace,monospace',
            fontSize: '0.73rem', letterSpacing: '0.04em',
            color: 'rgba(161,161,170,0.88)',
            display: 'flex', flexWrap: 'wrap', gap: '6px 14px', alignItems: 'center',
          }}
        >
          <span>{PROFILE.name}</span>
          <span aria-hidden="true" style={{ opacity: 0.4 }}>///</span>
          <span>{PROFILE.location}</span>
        </div>

        <div className="flex gap-5" style={{ fontSize: '0.8rem' }}>
          <a href={`mailto:${PROFILE.contact.email}`} style={linkStyle}>Email</a>
          <a href={PROFILE.contact.linkedin} target="_blank" rel="noopener noreferrer" style={linkStyle}>LinkedIn</a>
          <a href={PROFILE.contact.github} target="_blank" rel="noopener noreferrer" style={linkStyle}>GitHub</a>
        </div>
      </div>
    </footer>
  )
}

const linkStyle = {
  color: 'rgba(212,212,216,0.8)',
  textDecoration: 'none',
  fontWeight: 500,
}
