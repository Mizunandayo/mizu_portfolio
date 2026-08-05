import { useCallback, useEffect, useMemo, useState } from 'react'
import { configured } from '../../data/supabase.js'
import { listApproved } from '../../data/tickets.js'
import { PRESETS, paintTicket, serialOf } from '../shared/ticketPresets.js'
import { TICKETS_CHANGED, OPEN_TICKET } from '../../events.js'
import Lightbox from '../shared/Lightbox.jsx'

const PER_PAGE = 16

/* Dev only. `?mock=50` clones whatever real tickets exist up to that
   many, so the grid can be judged at scale before there are that many.
   The names live inside the guarded branch rather than at module scope,
   or the bundler cannot prove they are unreachable and ships them. */
function mockCount() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return 0
  const n = Number(new URLSearchParams(window.location.search).get('mock'))
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), 400) : 0
}

/* Painted rather than cloned, so all five designs appear at their real
   proportions and the filter tabs have something to filter. */
async function build(n) {
  if (!import.meta.env.DEV) return []

  const names = [
    'Mizu', 'Kaito', 'Yuna', 'Ren', 'Sora', 'Haruki', 'Aoi', 'Riku',
    'Nao', 'Hina', 'Takumi', 'Emi', 'Shou', 'Mei', 'Kenji', 'Rina',
    'Daiki', 'Yui', 'Souta', 'Akari', 'Itsuki', 'Miku', 'Kazu',
    'Nozomi', 'Tsubasa',
  ]
  const notes = [
    '', '', 'Nice work on the hackathons.', '',
    'The ofuda one is my favourite.', '', '', 'Shipped nine of these?',
  ]

  const load = (src) =>
    new Promise((res) => {
      const im = new Image()
      im.onload = () => res(im)
      im.onerror = () => res(null)
      im.src = src
    })

  /* Canvas font loading is separate from CSS, so without this the first
     few plates draw in the fallback face. */
  await document.fonts?.ready
  const arts = await Promise.all(
    Array.from({ length: 11 }, (_, i) => load(`/profile/tickets/gc${i + 1}.jpg`))
  )

  const issued = new Date()

  return Array.from({ length: n }, (_, i) => {
    const p = PRESETS[i % PRESETS.length]
    const name = names[i % names.length]
    const message = notes[i % notes.length]

    const plate = document.createElement('canvas')
    plate.width = p.w
    plate.height = p.h
    paintTicket(plate.getContext('2d'), p, {
      art: arts[i % arts.length],
      name,
      serial: serialOf(`${name}${i}`),
      mode: message ? 'message' : 'details',
      message,
      issued,
    })

    /* Longer edge, matching what submit() uploads, so the mock is worth
       judging. Two sizes for the same reason the real one has two: the
       grid never needs the big one. */
    /* WebP, so the mock carries alpha the way a real upload does. */
    const at = (max, q) => {
      const k = Math.min(1, max / Math.max(p.w, p.h))
      const c2 = document.createElement('canvas')
      c2.width = Math.round(p.w * k)
      c2.height = Math.round(p.h * k)
      c2.getContext('2d').drawImage(plate, 0, 0, c2.width, c2.height)
      return c2.toDataURL('image/webp', q)
    }

    return {
      id: `mock-${i}`,
      name,
      design: p.name,
      message,
      thumb: at(440, 0.8),
      plate: at(1400, 0.9),
      created_at: issued.toISOString(),
    }
  })
}

/* First, last, and a window around the current page. Anything skipped
   collapses to a gap, so the control stays one line at any length. */
function pageList(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const out = [1]
  if (cur > 3) out.push('gap-l')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) {
    out.push(i)
  }
  if (cur < total - 2) out.push('gap-r')
  out.push(total)
  return out
}

export default function Gallery() {
  const [items, setItems] = useState([])
  const [shot, setShot] = useState(-1)
  const [mock] = useState(mockCount)

  const [raw, setRaw] = useState('')
  const [query, setQuery] = useState('')
  const [design, setDesign] = useState('all')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    try {
      setItems(await listApproved(200))
    } catch {
      setItems([])
    }
  }, [])

  useEffect(() => {
    if (!configured || mock) return
    load()
    window.addEventListener(TICKETS_CHANGED, load)
    return () => window.removeEventListener(TICKETS_CHANGED, load)
  }, [load, mock])

  useEffect(() => {
    if (!mock) return
    let dead = false
    build(mock).then((list) => {
      if (!dead) setItems(list)
    })
    return () => {
      dead = true
    }
  }, [mock])

  /* Debounced, so a filter does not re-run on every keystroke and the
     page does not jump while a name is half typed. */
  useEffect(() => {
    const t = window.setTimeout(() => {
      setQuery(raw.trim().toLowerCase())
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [raw])

  useEffect(() => setPage(1), [design])

  const filtered = useMemo(
    () =>
      items.filter(
        (t) =>
          (design === 'all' || t.design === design) &&
          (!query || t.name.toLowerCase().includes(query))
      ),
    [items, design, query]
  )

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const shown = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  /* Stepping in the viewer moves the page under it, so closing lands on
     whatever was last looked at rather than where it started. */
  useEffect(() => {
    if (shot >= 0) setPage(Math.floor(shot / PER_PAGE) + 1)
  }, [shot])

  const viewable = useMemo(
    () =>
      filtered.map((t) => ({
        key: t.id,
        url: t.plate || t.thumb,
        cap: t.message ? `${t.name} — ${t.message}` : t.name,
      })),
    [filtered]
  )

  if (!configured) return null

  return (
    <section id="gallery" className="tg-mizu">
      <div className="tg-bg-mizu" aria-hidden="true" />

      <p className="tg-spine-mizu" aria-hidden="true">
        改札口
      </p>

      <div className="tg-inner-mizu">
        <header className="tg-head-mizu">
          <div>
            <p className="tg-kicker-mizu">改札口 / Ticket gallery</p>
            <h2 className="tg-title-mizu">TICKETS</h2>
            <p className="tg-lede-mizu">
              Every ticket here was made by someone who visited this page.
              Make your own and it appears once it has been reviewed.
            </p>
          </div>

          <button
            type="button"
            className="tg-grab-mizu"
            onClick={() => window.dispatchEvent(new Event(OPEN_TICKET))}
          >
            入場券
            <span>Grab your ticket now!</span>
          </button>
        </header>

        <div className="tg-tools-mizu">
          <div className="tg-tabs-mizu" role="tablist" aria-label="Ticket design">
            <button
              type="button"
              role="tab"
              aria-selected={design === 'all'}
              className={`tg-tab-mizu${design === 'all' ? ' is-on' : ''}`}
              onClick={() => setDesign('all')}
            >
              全部 <span>All</span>
            </button>

            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={design === p.name}
                className={`tg-tab-mizu${design === p.name ? ' is-on' : ''}`}
                onClick={() => setDesign(p.name)}
              >
                {p.jp} <span>{p.name}</span>
              </button>
            ))}
          </div>

          <label className="tg-search-mizu">
            <SearchIcon />
            <input
              type="search"
              value={raw}
              placeholder="Search by name"
              onChange={(e) => setRaw(e.target.value)}
              aria-label="Search tickets by name"
            />
          </label>
        </div>

        <p className="tg-count-mizu" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? 'ticket' : 'tickets'}
          {design !== 'all' && ` · ${design}`}
          {query && ` · matching “${query}”`}
        </p>

        {shown.length === 0 ? (
          <p className="tg-empty-mizu">
            {items.length === 0
              ? 'No tickets yet. Yours could be the first one.'
              : 'Nothing matches that. Try another name or design.'}
          </p>
        ) : (
          <ul className="tg-grid-mizu">
            {shown.map((t, i) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="tg-card-mizu"
                  onClick={() => setShot((page - 1) * PER_PAGE + i)}
                  aria-label={`View ${t.name}'s ticket`}
                >
                  <span className="tg-shot-mizu">
                    <img
                      src={t.thumb}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      draggable="false"
                    />
                  </span>
                  <span className="tg-name-mizu">{t.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {pages > 1 && (
          <nav className="tg-pager-mizu" aria-label="Gallery pages">
            <button
              type="button"
              className="tg-page-mizu is-step"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <Chev dir="left" />
            </button>

            {pageList(page, pages).map((p) =>
              typeof p === 'number' ? (
                <button
                  key={p}
                  type="button"
                  className={`tg-page-mizu${p === page ? ' is-on' : ''}`}
                  onClick={() => setPage(p)}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              ) : (
                <span key={p} className="tg-gap-mizu" aria-hidden="true">
                  ···
                </span>
              )
            )}

            <button
              type="button"
              className="tg-page-mizu is-step"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              aria-label="Next page"
            >
              <Chev dir="right" />
            </button>
          </nav>
        )}
      </div>

      <Lightbox
        bare
        items={viewable}
        index={shot}
        onIndex={setShot}
        onClose={() => setShot(-1)}
      />
    </section>
  )
}

const Chev = ({ dir }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={dir === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
  </svg>
)

const SearchIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)
