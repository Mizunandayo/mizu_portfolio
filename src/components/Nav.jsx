import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PROFILE } from '../data/profile.js'
import { ArrowIcon } from './shared/primitives.jsx'

const LINKS = [
  { href: '#work',           label: 'Work' },
  { href: '#about',          label: 'About' },
  { href: '#experience',     label: 'Experience' },
  { href: '#stack',          label: 'Stack' },
  { href: '#awards',         label: 'Awards' },
  { href: '#certifications', label: 'Certs' },
]

export default function Nav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [active, setActive] = useState('')
  const isHome = pathname === '/'

  useEffect(() => {
    if (!isHome) return
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id) }),
      { threshold: 0.3 }
    )
    document.querySelectorAll('section[id]').forEach((s) => obs.observe(s))
    return () => obs.disconnect()
  }, [isHome, pathname])

  const go = (e, href) => {
    e.preventDefault()
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const toContact = (e) => {
    e.preventDefault()
    if (isHome) document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else navigate('/#contact')
  }

  return (
    <nav
      aria-label="Primary"
      className="nav-glass fixed top-5 left-1/2 z-50"
      style={{
        transform: 'translateX(-50%)',
        borderRadius: 999,
        padding: '0 6px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        border: '1px solid rgba(163,163,163,0.26)',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.4)',
        minWidth: 'max-content',
        maxWidth: 'calc(100vw - 24px)',
      }}
    >
      {/* Brand */}
      <Link
        to="/"
        className="flex items-center gap-2 no-underline text-white px-4"
        style={{
          fontWeight: 700, fontSize: '0.84rem', letterSpacing: '0.14em',
          textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '0.96rem', letterSpacing: '-0.01em' }}>{PROFILE.kanji}</span>
        {PROFILE.brand}
      </Link>

      <Divider />

      {isHome ? (
        <div className="hidden lg:flex" style={{ gap: 2 }}>
          {LINKS.map(({ href, label }) => {
            const on = active === href.slice(1)
            return (
              <a
                key={href}
                href={href}
                onClick={(e) => go(e, href)}
                className="no-underline"
                style={{
                  fontSize: '0.84rem',
                  fontWeight: on ? 600 : 500,
                  color: on ? '#fff' : 'rgba(255,255,255,0.55)',
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: on ? 'rgba(161,161,170,0.22)' : 'transparent',
                  whiteSpace: 'nowrap',
                  transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                {label}
              </a>
            )
          })}
        </div>
      ) : (
        <Link
          to="/#work"
          className="no-underline hidden sm:flex items-center gap-2"
          style={{
            fontSize: '0.84rem', fontWeight: 500,
            color: 'rgba(255,255,255,0.6)',
            padding: '6px 12px', borderRadius: 999, whiteSpace: 'nowrap',
          }}
        >
          <ArrowIcon dir="left" />
          All work
        </Link>
      )}

      <Divider />

      <a
        href="#contact"
        onClick={toContact}
        className="no-underline flex items-center gap-2"
        style={{
          background: '#ffffff', color: '#050505',
          fontSize: '0.78rem', fontWeight: 700,
          padding: '8px 18px', borderRadius: 999,
          transition: 'opacity 150ms', whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.86')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        Get in touch
      </a>
    </nav>
  )
}

const Divider = () => (
  <div
    aria-hidden="true"
    style={{
      width: 1, height: 20, background: 'rgba(255,255,255,0.10)',
      flexShrink: 0, margin: '0 4px',
    }}
  />
)
