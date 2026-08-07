import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PROFILE } from '../data/profile.js'
import { useMode } from '../hooks/useMode.jsx'
import ModeToggle from './shared/ModeToggle.jsx'

/* ══════════════════════════════════════════════════
   Notch navbar.

   Ported from the vengenceui NotchNavbar. The geometry
   is kept verbatim — two 40px-tall flexible side rails
   and a 64px centre block joined by two 50px corner
   slices whose clip-path curves between the heights,
   with paired hairlines tracing the silhouette.

   Adapted to this project: React Router instead of
   next/link, inline SVG instead of lucide-react, CSS
   transitions instead of framer-motion, and no theme
   toggle — the design is committed to dark, so there
   is no light mode to switch to.
   ══════════════════════════════════════════════════ */

/* One list. The source component split these left/right around a centred
   logo; with the brand moved to the left rail the links read as a single
   run instead. */
const ALL = [
  { label: 'About',      href: '#about',          Icon: IconUser },
  { label: 'Work',       href: '#work',           Icon: IconWork },
  { label: 'Experience', href: '#experience',     Icon: IconCalendar },
  { label: 'Stack',      href: '#stack',          Icon: IconStack },
  { label: 'Hackathons', href: '#hackathons',     Icon: IconAward },
  { label: 'Certs',      href: '#certifications', Icon: IconBadge },
]

/* Menu only. On a phone this bar carries personal mode as well, where
   the floating dock is hidden — so everything the dock could reach has
   to be here or it can be reached from nowhere. Kept out of ALL because
   the notch itself has room for six links, not nine. */
const MORE = [
  { label: 'Contact',   href: '#contact',   Icon: IconMail },
  /* Recruiter mode hides the ticket wall outright
     (.mode-recruiter .tg-mizu { display: none }), so this link would
     scroll to a section that is not on the page. */
  { label: 'Tickets',   href: '#gallery',   Icon: IconTicket, personal: true },
  { label: 'Subscribe', href: '#subscribe', Icon: IconBell },
]

export default function Nav({ onCredits }) {
  const { isRecruiter } = useMode()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [active, setActive] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  /* Tolerant of the shapes a host can hand back — a trailing slash, or
     an empty pathname — so the nav does not change what it offers based
     on a formatting difference in the URL. */
  const isHome = pathname === '/' || pathname === '' || pathname === '/index.html'

  useEffect(() => {
    if (!isHome) return
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id) }),
      { threshold: 0.3 }
    )
    document.querySelectorAll('section[id]').forEach((s) => obs.observe(s))
    return () => obs.disconnect()
  }, [isHome, pathname])

  /* Close the mobile menu on route change, and lock the page behind it. */
  useEffect(() => { setMenuOpen(false) }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const go = (e, href) => {
    e.preventDefault()
    setMenuOpen(false)
    if (isHome) document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else navigate(`/${href}`)
  }

  return (
    <>
      <header className="notch-mizu">
        {/* Left rail */}
        <div className="notch-rail-mizu">
          <Rails />
        </div>

        {/* Notch — three slices */}
        <div className="notch-block-mizu">
          <div className="notch-corner-mizu notch-corner-l-mizu">
            <div className="notch-fill-mizu" />
            <svg className="notch-edge-mizu" viewBox="0 0 50 64" aria-hidden="true">
              <path d="M0 39.5 C25 39.5 25 63.5 50 63.5" />
              <path d="M0 36.5 C25 36.5 25 60.5 50 60.5" />
            </svg>
          </div>

          <div className="notch-center-mizu">
            <div className="notch-fill-mizu">
              <svg className="notch-edge-mizu" preserveAspectRatio="none" aria-hidden="true">
                <line x1="0" y1="63.5" x2="100%" y2="63.5" />
                <line x1="0" y1="60.5" x2="100%" y2="60.5" />
              </svg>
            </div>

            {/* Every child sits on one centred axis — no per-item
                vertical nudges, or the CTA pill's own padding pulls its
                label off the line the text links sit on. */}
            <div className="notch-content-mizu">
              {/* Brand — left */}
              <Link to="/" className="notch-brand-mizu" aria-label={`${PROFILE.brand} — home`}>
                <span className="notch-brand-kanji-mizu">{PROFILE.kanji}</span>
                <span className="notch-brand-word-mizu">{PROFILE.brand}</span>
              </Link>

              {/* Links — centre.

                  The sections show on every route, not only the home
                  page. Off it they navigate to /#section, which `go`
                  already handles, and "All work" joins them rather than
                  replacing them: the old branch left a project page
                  with exactly one destination in its nav, and any route
                  where `isHome` came out false lost the lot. */}
              <nav className="notch-nav-mizu" aria-label="Primary">
                {!isHome && <BackLink />}
                {ALL.map((i) => (
                  <NavLink key={i.label} {...i} active={active === i.href.slice(1)} onClick={go} />
                ))}
              </nav>

              {/* Right cluster */}
              <div className="notch-right-mizu">
                <ModeToggle className="notch-mode-mizu" />

                <a href="#contact" onClick={(e) => go(e, '#contact')} className="notch-cta-mizu">
                  Get in touch
                </a>

                <button
                  type="button"
                  className="notch-burger-mizu"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-controls="notch-menu"
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                >
                  {menuOpen ? <IconClose /> : <IconMenu />}
                </button>
              </div>
            </div>
          </div>

          <div className="notch-corner-mizu notch-corner-r-mizu">
            <div className="notch-fill-mizu" />
            <svg className="notch-edge-mizu" viewBox="0 0 50 64" aria-hidden="true">
              <path d="M0 63.5 C25 63.5 25 39.5 50 39.5" />
              <path d="M0 60.5 C25 60.5 25 36.5 50 36.5" />
            </svg>
          </div>
        </div>

        {/* Right rail */}
        <div className="notch-rail-mizu notch-rail-r-mizu">
          <Rails />
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <>
          <div className="notch-scrim-mizu" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div id="notch-menu" className="notch-menu-mizu">
            <nav aria-label="Mobile">
              {isHome ? (
                [...ALL, ...MORE.filter((i) => !i.personal || !isRecruiter)].map(({ label, href, Icon }) => (
                  <a key={label} href={href} onClick={(e) => go(e, href)} className="notch-menu-item-mizu">
                    <Icon />
                    <span>{label}</span>
                  </a>
                ))
              ) : (
                <Link to="/#work" className="notch-menu-item-mizu" onClick={() => setMenuOpen(false)}>
                  <IconWork />
                  <span>All work</span>
                </Link>
              )}

              <div className="notch-menu-rule-mizu" />

              {/* Artwork and music attributions for the personal
                  presentation. Recruiter mode strips every one of those
                  flourishes, so there is nothing left to credit. */}
              {!isRecruiter && (
                <button
                  type="button"
                  className="notch-menu-item-mizu"
                  onClick={() => {
                    setMenuOpen(false)
                    onCredits?.()
                  }}
                >
                  <IconCredits />
                  <span>Credits</span>
                </button>
              )}

              <div className="notch-menu-mode-mizu">
                <span>Mode</span>
                <ModeToggle />
              </div>

              <a href={`mailto:${PROFILE.contact.email}`} className="notch-menu-cta-mizu">
                Get in touch
              </a>
            </nav>
          </div>
        </>
      )}
    </>
  )
}

/* ── Pieces ────────────────────────────────────── */

function NavLink({ href, label, Icon, active, onClick }) {
  return (
    <a
      href={href}
      onClick={(e) => onClick(e, href)}
      className={`notch-link-mizu${active ? ' is-active' : ''}`}
      aria-current={active ? 'true' : undefined}
    >
      <Icon />
      <span>{label}</span>
    </a>
  )
}

function BackLink() {
  return (
    <Link to="/#work" className="notch-link-mizu">
      <IconArrowLeft />
      <span>All work</span>
    </Link>
  )
}

/* The paired hairlines that run along the top rails. */
function Rails() {
  return (
    <svg className="notch-edge-mizu" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" y1="39.5" x2="100%" y2="39.5" />
      <line x1="0" y1="36.5" x2="100%" y2="36.5" />
    </svg>
  )
}

/* ── Icons — lucide-shaped, inlined to avoid the dependency ── */

const s = {
  width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.9,
  strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': 'true',
}

function IconWork() {
  return (
    <svg {...s}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg {...s}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg {...s}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

function IconStack() {
  return (
    <svg {...s}>
      <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" />
      <path d="M3 12.5 12 17l9-4.5" />
      <path d="M3 17.5 12 22l9-4.5" />
    </svg>
  )
}

function IconAward() {
  return (
    <svg {...s}>
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 14 7 22l5-3 5 3-1.5-8" />
    </svg>
  )
}


function IconBadge() {
  return (
    <svg {...s}>
      <path d="M12 2.8 4.6 5.9v5.4c0 4.9 3.2 8.7 7.4 10.4 4.2-1.7 7.4-5.5 7.4-10.4V5.9L12 2.8Z" />
      <path d="M9 11.9l2.2 2.2 4.2-4.4" />
    </svg>
  )
}

function IconMail() {
  return (
    <svg {...s}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function IconTicket() {
  return (
    <svg {...s}>
      <path d="M3 8.5A2 2 0 0 0 5 6.5h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 3v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-3Z" />
      <path d="M14 6.5v11" />
    </svg>
  )
}

function IconBell() {
  return (
    <svg {...s}>
      <path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5" />
      <path d="M13.7 20a2 2 0 0 1-3.4 0" />
    </svg>
  )
}

function IconCredits() {
  return (
    <svg {...s}>
      <path d="M4 4.5h11a2.5 2.5 0 0 1 2.5 2.5v12.5H6.5A2.5 2.5 0 0 1 4 17Z" />
      <path d="M8 9h6M8 12.5h4" />
    </svg>
  )
}

function IconMenu() {
  return <svg {...s} width="19" height="19"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
}

function IconClose() {
  return <svg {...s} width="19" height="19"><path d="M6 6l12 12M18 6L6 18" /></svg>
}

function IconArrowLeft() {
  return <svg {...s}><path d="M19 12H5M11 5l-7 7 7 7" /></svg>
}
