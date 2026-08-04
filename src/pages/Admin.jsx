import { useCallback, useEffect, useRef, useState } from 'react'
import { configured, readSession, signIn, signOut } from '../data/supabase.js'
import { listForTab, approve, setHidden, destroy } from '../data/tickets.js'

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

function EyeIcon({ off }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.4"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <path d="M1 8s2.6-4.2 7-4.2S15 8 15 8s-2.6 4.2-7 4.2S1 8 1 8Z" />
      <circle cx="8" cy="8" r="1.9" />
      {off && <path d="M2.4 13.6 13.6 2.4" />}
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 4h11M6.5 4V2.5h3V4M4 4l.6 9.5h6.8L12 4M6.5 6.5v5M9.5 6.5v5" />
    </svg>
  )
}

/* Protection is the RLS policy, not the URL: without an admin session
   a pending ticket is unreadable. */

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

  return (
    <form className="ad-signin-mizu" onSubmit={submit}>
      <p className="ad-kicker-mizu">管理 / Admin</p>
      <h1 className="ad-title-mizu">Ticket review</h1>

      <label className="ad-field-mizu">
        <span>Email</span>
        <input
          type="email"
          value={email}
          autoComplete="username"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label className="ad-field-mizu">
        <span>Password</span>
        <input
          type="password"
          value={pw}
          autoComplete="current-password"
          onChange={(e) => setPw(e.target.value)}
          required
        />
      </label>

      {err && (
        <p className="ad-err-mizu" role="alert">
          {err}
        </p>
      )}

      <button type="submit" className="ad-primary-mizu" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

function Card({ t, tab, onDone, onAskDelete }) {
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
      <img className="ad-shot-mizu" src={t.thumb} alt="" loading="lazy" />

      <div className="ad-meta-mizu">
        <p className="ad-name-mizu">{t.name}</p>
        <p className="ad-design-mizu">{t.design}</p>
        {t.message && <p className="ad-msg-mizu">{t.message}</p>}
        <p className="ad-when-mizu">
          {new Date(t.created_at).toLocaleString()}
        </p>
      </div>

      {err && (
        <p className="ad-err-mizu" role="alert">
          {err}
        </p>
      )}

      <div className="ad-act-mizu">
        {tab === 'pending' ? (
          <button
            type="button"
            className="ad-primary-mizu"
            onClick={() => act('approve')}
            disabled={Boolean(busy)}
          >
            {busy === 'approve' ? 'Approving…' : 'Approve'}
          </button>
        ) : (
          <button
            type="button"
            className={`ad-eye-mizu${t.hidden ? ' is-off' : ''}`}
            onClick={() => act('hide')}
            disabled={Boolean(busy)}
            aria-pressed={t.hidden}
            title={t.hidden ? 'Show in the gallery' : 'Hide from the gallery'}
          >
            <EyeIcon off={t.hidden} />
            {busy === 'hide' ? 'Saving…' : t.hidden ? 'Show' : 'Hide'}
          </button>
        )}

        <button
          type="button"
          className="ad-trash-mizu"
          onClick={() => onAskDelete(t)}
          disabled={Boolean(busy)}
          aria-label={`Delete ${t.name}'s ticket`}
          title="Delete permanently"
        >
          <TrashIcon />
        </button>
      </div>
    </article>
  )
}

export default function Admin() {
  const [session, setSession] = useState(() => readSession())
  const [tab, setTab] = useState('pending')
  const [items, setItems] = useState(null)
  const [err, setErr] = useState('')
  const [doomed, setDoomed] = useState(null)
  const [killing, setKilling] = useState(false)
  const askRef = useRef(null)

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

  useEffect(() => {
    if (session) load()
  }, [session, load])

  useEffect(() => {
    const el = askRef.current
    if (!el) return
    if (doomed && !el.open) el.showModal()
    if (!doomed && el.open) el.close()
  }, [doomed])

  const settle = (id) => setItems((list) => list.filter((t) => t.id !== id))

  if (!configured) {
    return (
      <main className="ad-mizu" id="main">
        <div className="ad-note-mizu">
          <p className="ad-kicker-mizu">管理 / Admin</p>
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
      <main className="ad-mizu" id="main">
        <SignIn onDone={() => setSession(readSession())} />
      </main>
    )
  }

  return (
    <main className="ad-mizu" id="main">
      <header className="ad-head-mizu">
        <div>
          <p className="ad-kicker-mizu">管理 / Admin</p>
          <h1 className="ad-title-mizu">
            {TAB_LABEL[tab]}
            {items && <span className="ad-count-mizu">{items.length}</span>}
          </h1>

          <div className="ad-tabs-mizu" role="tablist">
            {['pending', 'approved', 'hidden'].map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
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
          <button
            type="button"
            className="ad-ghost-mizu"
            onClick={() => {
              signOut()
              setSession(null)
              setItems(null)
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {err && (
        <p className="ad-err-mizu" role="alert">
          {err}
        </p>
      )}

      {items === null && <p className="ad-empty-mizu">Loading…</p>}

      {items?.length === 0 && !err && (
        <p className="ad-empty-mizu">
          {TAB_EMPTY[tab]}
        </p>
      )}

      {items && items.length > 0 && (
        <div className="ad-grid-mizu">
          {items.map((t) => (
            <Card
              key={t.id}
              t={t}
              tab={tab}
              onDone={settle}
              onAskDelete={setDoomed}
            />
          ))}
        </div>
      )}

      <dialog
        ref={askRef}
        className="ad-confirm-mizu"
        aria-label="Confirm delete"
        onCancel={(e) => {
          e.preventDefault()
          if (!killing) setDoomed(null)
        }}
      >
        <div className="ad-confirm-body-mizu">
          <h2>Delete this ticket?</h2>
          <p>
            {doomed?.name}&apos;s {doomed?.design} ticket and both of its
            images will be removed from the database and from storage. This
            cannot be undone.
          </p>

          {err && (
            <p className="ad-err-mizu" role="alert">
              {err}
            </p>
          )}

          <div className="ad-confirm-act-mizu">
            <button
              type="button"
              className="ad-ghost-mizu"
              onClick={() => setDoomed(null)}
              disabled={killing}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ad-danger-mizu"
              disabled={killing}
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
    </main>
  )
}
