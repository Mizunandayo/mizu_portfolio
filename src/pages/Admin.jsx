import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { configured, readSession, signIn, signOut } from '../data/supabase.js'
import { listForTab, approve, setHidden, destroy } from '../data/tickets.js'
import { PRESETS } from '../components/shared/ticketPresets.js'
import Lightbox from '../components/shared/Lightbox.jsx'
import Subscribers from '../components/admin/Subscribers.jsx'
import {
  EyeIcon, TrashIcon, MailIcon, SearchIcon,
  TicketIcon, PeopleIcon, ExitIcon,
} from '../components/admin/icons.jsx'

/* ══════════════════════════════════════════════════
   遊び場 — Mizu's Playground.

   Not a ticket queue. The portfolio's back room: the
   tickets people made, and the people who asked to
   hear when something changes.

   The dock rather than a row of tabs because the two
   halves are different work, not different filters on
   the same thing. Tabs inside tickets still are.
   ══════════════════════════════════════════════════ */

const VIEWS = [
  ['tickets', '券', 'Tickets', TicketIcon],
  ['subscribers', '購読', 'Subscribers', PeopleIcon],
]

const TAB_LABEL = {
  pending: 'Pending tickets',
  approved: 'Live in the gallery',
  hidden: 'Hidden from the gallery',
}
const TAB_SHORT = { pending: 'Pending', approved: 'Live', hidden: 'Hidden' }
const TAB_EMPTY = {
  pending: 'Nothing waiting. The queue is clear.',
  approved: 'Nothing in the gallery yet.',
  hidden: 'Nothing hidden.',
}

const SPANS = [
  ['all', 'Any date'],
  ['1', 'Today'],
  ['7', 'Last 7 days'],
  ['30', 'Last 30 days'],
]

function SignIn({ onDone }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await signIn(email.trim(), pw)
      onDone()
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setBusy(false)
    }
  }

  /* Laid out like the kawaraban band rather than centred in a card: the
     plate is the page and the type sits on the left of it. */
  return (
    <form className="ad-gate-mizu" onSubmit={submit}>
      <p className="ad-kicker-mizu">遊び場 / Playground</p>
      <h1 className="ad-gate-title-mizu">MIZU&apos;S PLAYGROUND</h1>
      <p className="ad-gate-lede-mizu">
        The back room of the portfolio. Tickets people made, the list of
        everyone who asked to hear when something changes, and whatever
        this grows into next.
      </p>

      <div className="ad-gate-fields-mizu">
        <label className="ad-gate-field-mizu">
          <span>メール / Email</span>
          <input
            type="email" value={email} autoComplete="username"
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)} required
          />
        </label>

        <label className="ad-gate-field-mizu">
          <span>合言葉 / Password</span>
          <input
            type="password" value={pw} autoComplete="current-password"
            placeholder="••••••••"
            onChange={(e) => setPw(e.target.value)} required
          />
        </label>
      </div>

      <div className="ad-gate-act-mizu">
        <button type="submit" className="ad-gate-go-mizu" disabled={busy}>
          {busy ? 'Signing in…' : '入場 Sign in'}
        </button>
        {err
          ? <p className="ad-gate-err-mizu" role="alert">{err}</p>
          : <p className="ad-gate-hint-mizu">Invite only. There is no sign-up.</p>}
      </div>
    </form>
  )
}

function Card({ t, tab, onDone, onAskDelete, onView }) {
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')

  const act = async (kind) => {
    setBusy(kind)
    setErr('')
    try {
      await (kind === 'approve' ? approve(t.id) : setHidden(t.id, !t.hidden))
      onDone(t.id)
    } catch (e) {
      setErr(e.message)
      setBusy('')
    }
  }

  return (
    <article className="ad-card-mizu">
      <button
        type="button"
        className="ad-shot-mizu"
        onClick={onView}
        aria-label={`View ${t.name}'s ticket`}
      >
        <img src={t.thumb} alt="" loading="lazy" draggable="false" />
      </button>

      <p className="ad-name-mizu">{t.name}</p>
      <p className="ad-meta-mizu">
        {t.design} · {new Date(t.created_at).toLocaleString()}
      </p>

      {t.notify_email && (
        <p className="ad-mail-mizu" title={t.notify_email}>
          <MailIcon />
          With email notification
        </p>
      )}

      {err && <p className="ad-err-mizu" role="alert">{err}</p>}

      <div className="ad-act-mizu">
        {tab === 'pending' ? (
          <button
            type="button" className="ad-primary-mizu"
            onClick={() => act('approve')} disabled={Boolean(busy)}
          >
            {busy === 'approve' ? 'Approving…' : 'Approve'}
          </button>
        ) : (
          <button
            type="button"
            className={`ad-eye-mizu${t.hidden ? ' is-off' : ''}`}
            onClick={() => act('hide')} disabled={Boolean(busy)}
            aria-pressed={t.hidden}
            title={t.hidden ? 'Show in the gallery' : 'Hide from the gallery'}
          >
            <EyeIcon off={t.hidden} />
            {busy === 'hide' ? 'Saving…' : t.hidden ? 'Show' : 'Hide'}
          </button>
        )}

        <button
          type="button" className="ad-trash-mizu"
          onClick={() => onAskDelete(t)} disabled={Boolean(busy)}
          aria-label={`Delete ${t.name}'s ticket`} title="Delete permanently"
        >
          <TrashIcon />
        </button>
      </div>
    </article>
  )
}

function Tickets() {
  const [tab, setTab] = useState('pending')
  const [items, setItems] = useState(null)
  const [err, setErr] = useState('')
  const [doomed, setDoomed] = useState(null)
  const [killing, setKilling] = useState(false)
  const [shot, setShot] = useState(-1)
  const askRef = useRef(null)

  const [raw, setRaw] = useState('')
  const [query, setQuery] = useState('')
  const [design, setDesign] = useState('all')
  const [span, setSpan] = useState('all')

  const load = useCallback(async () => {
    setErr('')
    setItems(null)
    try {
      setItems(await listForTab(tab))
    } catch (e) {
      setErr(e.message)
      setItems([])
    }
  }, [tab])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const el = askRef.current
    if (!el) return
    if (doomed && !el.open) el.showModal()
    if (!doomed && el.open) el.close()
  }, [doomed])

  /* Debounced, so filtering does not re-run on every keystroke. */
  useEffect(() => {
    const t = window.setTimeout(() => setQuery(raw.trim().toLowerCase()), 300)
    return () => clearTimeout(t)
  }, [raw])

  const shown = useMemo(() => {
    if (!items) return null
    const cut = span === 'all' ? 0 : Date.now() - Number(span) * 86400000
    return items.filter(
      (t) =>
        (design === 'all' || t.design === design) &&
        (!query || t.name.toLowerCase().includes(query)) &&
        (!cut || new Date(t.created_at).getTime() >= cut)
    )
  }, [items, design, query, span])

  const settle = (id) => setItems((list) => list.filter((t) => t.id !== id))

  const viewable = useMemo(
    () =>
      (shown ?? []).map((t) => ({
        key: t.id,
        url: t.plate || t.thumb,
        cap: t.message ? `${t.name} — ${t.message}` : t.name,
      })),
    [shown]
  )

  return (
    <>
      <header className="ad-head-mizu">
        <div>
          <p className="ad-kicker-mizu">改札 / Tickets</p>
          <h1 className="ad-title-mizu">
            {TAB_LABEL[tab]}
            {shown && <span className="ad-count-mizu">{shown.length}</span>}
          </h1>

          <div className="ad-tabs-mizu" role="tablist">
            {['pending', 'approved', 'hidden'].map((k) => (
              <button
                key={k} type="button" role="tab"
                aria-selected={tab === k}
                className={`ad-tab-mizu${tab === k ? ' is-on' : ''}`}
                onClick={() => setTab(k)}
              >
                {TAB_SHORT[k]}
              </button>
            ))}
          </div>
        </div>

        <div className="ad-head-act-mizu">
          <button type="button" className="ad-ghost-mizu" onClick={load}>
            Refresh
          </button>
        </div>
      </header>

      <div className="ad-tools-mizu">
        <div className="ad-chips-mizu" role="group" aria-label="Ticket design">
          <button
            type="button"
            className={`ad-chip-mizu${design === 'all' ? ' is-on' : ''}`}
            onClick={() => setDesign('all')}
          >
            All
          </button>
          {PRESETS.map((p) => (
            <button
              key={p.id} type="button"
              className={`ad-chip-mizu${design === p.name ? ' is-on' : ''}`}
              onClick={() => setDesign(p.name)}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="ad-tools-end-mizu">
          <label className="ad-search-mizu">
            <SearchIcon />
            <input
              type="search" value={raw} placeholder="Search by name"
              onChange={(e) => setRaw(e.target.value)}
              aria-label="Search tickets by name"
            />
          </label>

          <select
            className="ad-select-mizu" value={span}
            onChange={(e) => setSpan(e.target.value)}
            aria-label="Filter by date"
          >
            {SPANS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {err && <p className="ad-err-mizu" role="alert">{err}</p>}

      {items === null && <p className="ad-empty-mizu">Loading…</p>}

      {shown?.length === 0 && !err && (
        <p className="ad-empty-mizu">
          {items.length === 0 ? TAB_EMPTY[tab] : 'Nothing matches those filters.'}
        </p>
      )}

      {shown && shown.length > 0 && (
        <div className="ad-grid-mizu">
          {shown.map((t, i) => (
            <Card
              key={t.id} t={t} tab={tab}
              onDone={settle} onAskDelete={setDoomed}
              onView={() => setShot(i)}
            />
          ))}
        </div>
      )}

      <Lightbox
        bare items={viewable} index={shot}
        onIndex={setShot} onClose={() => setShot(-1)}
      />

      <dialog
        ref={askRef} className="ad-confirm-mizu" aria-label="Confirm delete"
        onCancel={(e) => { e.preventDefault(); if (!killing) setDoomed(null) }}
      >
        <div className="ad-confirm-body-mizu">
          <h2>Delete this ticket?</h2>
          <p>
            {doomed?.name}&apos;s {doomed?.design} ticket and both of its
            images will be removed from the database and from storage. This
            cannot be undone.
          </p>

          {err && <p className="ad-err-mizu" role="alert">{err}</p>}

          <div className="ad-confirm-act-mizu">
            <button
              type="button" className="ad-ghost-mizu"
              onClick={() => setDoomed(null)} disabled={killing}
            >
              Cancel
            </button>
            <button
              type="button" className="ad-danger-mizu" disabled={killing}
              onClick={async () => {
                setKilling(true)
                setErr('')
                try {
                  await destroy(doomed)
                  settle(doomed.id)
                  setDoomed(null)
                } catch (e) {
                  setErr(e.message)
                } finally {
                  setKilling(false)
                }
              }}
            >
              {killing ? 'Deleting…' : 'Delete permanently'}
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}

export default function Admin() {
  const [session, setSession] = useState(() => readSession())
  const [view, setView] = useState('tickets')
  const [leaving, setLeaving] = useState(false)
  const outRef = useRef(null)

  useEffect(() => {
    const el = outRef.current
    if (!el) return
    if (leaving && !el.open) el.showModal()
    if (!leaving && el.open) el.close()
  }, [leaving])

  if (!configured) {
    return (
      <main className="ad-mizu" id="main">
        <div className="ad-note-mizu">
          <p className="ad-kicker-mizu">遊び場 / Playground</p>
          <h1 className="ad-title-mizu">Not configured</h1>
          <p>
            Add <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> to a <code>.env</code> file,
            then restart the dev server. See <code>.env.example</code>.
          </p>
        </div>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="ad-mizu is-gate" id="main">
        <div className="ad-bg-mizu" aria-hidden="true" />
        <SignIn onDone={() => setSession(readSession())} />
      </main>
    )
  }

  return (
    <main className="ad-mizu has-dock" id="main">
      <div className="ad-bg-mizu" aria-hidden="true" />

      <nav className="ad-dock-mizu" aria-label="Playground sections">
        <p className="ad-dock-mark-mizu" aria-hidden="true">水</p>

        {VIEWS.map(([id, jp, label, Icon]) => (
          <button
            key={id} type="button"
            className={`ad-dockb-mizu${view === id ? ' is-on' : ''}`}
            onClick={() => setView(id)}
            aria-current={view === id ? 'page' : undefined}
          >
            <Icon />
            <span className="ad-dockjp-mizu">{jp}</span>
            <span className="ad-docktip-mizu">{label}</span>
          </button>
        ))}

        <button
          type="button" className="ad-dockb-mizu is-exit"
          onClick={() => setLeaving(true)}
        >
          <ExitIcon />
          <span className="ad-dockjp-mizu">出</span>
          <span className="ad-docktip-mizu">Sign out</span>
        </button>
      </nav>

      <div className="ad-inner-mizu">
        {view === 'tickets' ? <Tickets /> : <Subscribers />}
      </div>

      <dialog
        ref={outRef} className="ad-confirm-mizu" aria-label="Confirm sign out"
        onCancel={(e) => { e.preventDefault(); setLeaving(false) }}
      >
        <div className="ad-confirm-body-mizu">
          <h2>Sign out of the playground?</h2>
          <p>
            Nothing is lost, but anything half written in the composer goes
            with the session. You will need your email and password to get
            back in.
          </p>

          <div className="ad-confirm-act-mizu">
            <button
              type="button" className="ad-ghost-mizu"
              onClick={() => setLeaving(false)}
            >
              Stay
            </button>
            <button
              type="button" className="ad-danger-mizu"
              onClick={() => { signOut(); setLeaving(false); setSession(null) }}
            >
              Sign out
            </button>
          </div>
        </div>
      </dialog>
    </main>
  )
}
