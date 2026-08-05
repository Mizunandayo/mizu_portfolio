import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  listSubscribers,
  setUnsubscribed,
  removeSubscriber,
  listSent,
  destroySent,
  uploadBanner,
  sendUpdate,
  TARGETS,
} from '../../data/subscribers.js'
import {
  EyeIcon, TrashIcon, MailIcon, SearchIcon, CopyIcon, SendIcon,
} from './icons.jsx'
import EmailSheet from './EmailSheet.jsx'
import BannerCrop from './BannerCrop.jsx'
import PickPeople from './PickPeople.jsx'

/* ══════════════════════════════════════════════════
   購読 — the list, what gets written to it, and what
   already went.

   Selection lives here rather than on each row, so
   "everyone" and "these four" are the same code path
   with a different argument, and the send button can
   always say exactly who it is about to mail.

   The browser never holds the addresses it is sending
   to. It hands ids to the Edge Function, which checks
   the caller is an admin before resolving them.
   ══════════════════════════════════════════════════ */

const DEFAULT_BANNER = '/profile/emailbanner/emailbannerimg.png'

/* A path is fine in the field but the email needs a real URL, since an
   inbox fetches it from somewhere that is not this page. */
const absolute = (v) => {
  const raw = String(v ?? '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  if (typeof window === 'undefined') return raw
  return new URL(raw, window.location.origin).href
}

const SPANS = [
  ['all', 'Any date'],
  ['1', 'Today'],
  ['7', 'Last 7 days'],
  ['30', 'Last 30 days'],
]

const when = (d) => new Date(d).toLocaleString()

function Row({ s, picked, onPick, onOnly, onChanged, onAskDelete }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const off = Boolean(s.unsubscribed_at)
  const pending = !s.confirmed_at

  const toggle = async () => {
    setBusy(true)
    setErr('')
    try {
      await setUnsubscribed(s.id, !off)
      onChanged(s.id, off ? null : new Date().toISOString())
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className={`ad-sub-mizu${off ? ' is-off' : ''}`}>
      {/* Only a mailable row can be picked. An unconfirmed or
          unsubscribed address has no business in a send. */}
      <input
        type="checkbox"
        className="ad-pick-mizu"
        checked={picked}
        disabled={pending || off}
        onChange={(e) => onPick(s.id, e.target.checked)}
        aria-label={`Select ${s.email}`}
      />

      <div className="ad-sub-who-mizu">
        <p className="ad-sub-mail-mizu">
          <MailIcon />
          <a href={`mailto:${s.email}`}>{s.email}</a>
          {pending && <span className="ad-sub-tag-mizu">Unconfirmed</span>}
        </p>
        <p className="ad-sub-meta-mizu">
          {when(s.created_at)}
          {s.source && ` · via ${s.source}`}
          {off && ' · unsubscribed'}
        </p>
        {err && <p className="ad-err-mizu" role="alert">{err}</p>}
      </div>

      <div className="ad-sub-act-mizu">
        {!pending && !off && (
          <button
            type="button" className="ad-only-mizu"
            onClick={() => onOnly(s.id)}
            title="Write to this person only"
          >
            <SendIcon />
            Email
          </button>
        )}

        <button
          type="button"
          className={`ad-eye-mizu${off ? ' is-off' : ''}`}
          onClick={toggle} disabled={busy} aria-pressed={off}
          title={off ? 'Put back on the list' : 'Mark as unsubscribed'}
        >
          <EyeIcon off={off} />
          {busy ? 'Saving…' : off ? 'Restore' : 'Unsubscribe'}
        </button>

        <button
          type="button" className="ad-trash-mizu"
          onClick={() => onAskDelete(s)} disabled={busy}
          aria-label={`Delete ${s.email}`} title="Delete permanently"
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  )
}

export default function Subscribers() {
  /* 'write' | 'list' | 'sent' */
  const [tab, setTab] = useState('write')

  const [items, setItems] = useState(null)
  const [sent, setSent] = useState(null)
  const [open, setOpen] = useState(null)
  const [err, setErr] = useState('')
  const [raw, setRaw] = useState('')
  const [query, setQuery] = useState('')
  const [span, setSpan] = useState('all')
  const [copied, setCopied] = useState(false)

  const [picked, setPicked] = useState(() => new Set())
  const [doomed, setDoomed] = useState(null)
  const [killing, setKilling] = useState(false)
  const askRef = useRef(null)

  /* 'all' | 'picked'. Kept apart from the selection itself so ticking
     boxes does not silently change who a half-written email is for. */
  const [who, setWho] = useState('all')
  const [subject, setSubject] = useState('')
  const [heading, setHeading] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState('#work')
  const [ctaLabel, setCtaLabel] = useState('See the project')
  const [mode, setMode] = useState('personal')
  /* Three states, because a banner is one of three things: the bundled
     default, a crop not yet uploaded, or a file already in the bucket.
     `pending` holds the blob until a send actually happens, so an
     abandoned draft leaves nothing behind. `stored` remembers the URL
     once uploaded so sending twice does not upload twice. */
  const [banner, setBanner] = useState(DEFAULT_BANNER)
  const [pending, setPending] = useState(null)
  const [stored, setStored] = useState(null)
  const previewRef = useRef(null)
  const [sending, setSending] = useState('')
  const [result, setResult] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [choosing, setChoosing] = useState(false)
  /* The file waiting to be framed. Truthy means the crop dialog is up
     and the page behind it is inert. */
  const [cropFile, setCropFile] = useState(null)
  const sendRef = useRef(null)

  const load = useCallback(async () => {
    setErr('')
    setItems(null)
    try {
      setItems(await listSubscribers())
    } catch (e) {
      setErr(e.message)
      setItems([])
    }
  }, [])

  const loadSent = useCallback(async () => {
    try {
      setSent(await listSent())
    } catch (e) {
      setErr(e.message)
      setSent([])
    }
  }, [])

  useEffect(() => { load(); loadSent() }, [load, loadSent])

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
  }, [])

  const takeCrop = (blob) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    const url = URL.createObjectURL(blob)
    previewRef.current = url
    setPending(blob)
    setStored(null)
    setBanner(url)
    setCropFile(null)
  }

  useEffect(() => {
    const t = window.setTimeout(() => setQuery(raw.trim().toLowerCase()), 300)
    return () => clearTimeout(t)
  }, [raw])

  useEffect(() => {
    const el = askRef.current
    if (!el) return
    if (doomed && !el.open) el.showModal()
    if (!doomed && el.open) el.close()
  }, [doomed])

  useEffect(() => {
    const el = sendRef.current
    if (!el) return
    if (confirming && !el.open) el.showModal()
    if (!confirming && el.open) el.close()
  }, [confirming])

  const shown = useMemo(() => {
    if (!items) return null
    const cut = span === 'all' ? 0 : Date.now() - Number(span) * 86400000
    return items.filter(
      (r) =>
        (!query || r.email.includes(query)) &&
        (!cut || new Date(r.created_at).getTime() >= cut)
    )
  }, [items, query, span])

  /* Confirmed and still subscribed. Everything that sends or copies
     works from this, never from the raw list. */
  const mailable = useMemo(
    () => (items ?? []).filter((r) => r.confirmed_at && !r.unsubscribed_at),
    [items]
  )

  const mailableShown = useMemo(
    () => (shown ?? []).filter((r) => r.confirmed_at && !r.unsubscribed_at),
    [shown]
  )

  /* A pick can survive its row being filtered away, or the row being
     unsubscribed in another tab. Counting against the mailable set keeps
     the number honest about what would actually be sent. */
  const pickedIds = useMemo(
    () => mailable.filter((r) => picked.has(r.id)).map((r) => r.id),
    [mailable, picked]
  )

  const recipients = who === 'all' ? mailable.length : pickedIds.length
  const ready = subject.trim() && heading.trim() && body.trim()

  const allShownPicked =
    mailableShown.length > 0 && mailableShown.every((r) => picked.has(r.id))

  const pickAll = (on) =>
    setPicked((prev) => {
      const next = new Set(prev)
      for (const r of mailableShown) on ? next.add(r.id) : next.delete(r.id)
      return next
    })

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(mailable.map((r) => r.email).join(', '))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setErr('Could not reach the clipboard.')
    }
  }

  const only = (id) => {
    setPicked(new Set([id]))
    setWho('picked')
    setTab('write')
  }

  const onTarget = (v) => {
    setTarget(v)
    const found = TARGETS.find(([p]) => p === v)
    if (found) setCtaLabel(found[2])
  }

  const send = async (test) => {
    setSending(test ? 'test' : 'real')
    setResult(null)
    setErr('')
    try {
      /* Now, not at crop time. A test counts: the mail really goes out
         and the inbox really fetches the image, so it needs a real URL. */
      let url = stored
      if (!url && pending) {
        url = await uploadBanner(pending)
        setStored(url)
      }

      const out = await sendUpdate({
        subject: subject.trim(),
        heading: heading.trim(),
        body: body.trim(),
        ctaLabel: ctaLabel.trim(),
        ctaPath: target,
        mode,
        banner: url ?? absolute(banner),
        ids: test || who === 'all' ? null : pickedIds,
        test,
      })
      setResult({ test, ...out })
      setConfirming(false)
      loadSent()

      if (!test) {
        setSubject('')
        setHeading('')
        setBody('')
        setPicked(new Set())
        setWho('all')
      }
    } catch (e) {
      setErr(e.message)
      setConfirming(false)
    } finally {
      setSending('')
    }
  }

  const stats = [
    ['Confirmed', mailable.length, 'is-good'],
    ['Awaiting confirmation', (items ?? []).filter((r) => !r.confirmed_at).length, 'is-warn'],
    ['Unsubscribed', (items ?? []).filter((r) => r.unsubscribed_at).length, ''],
  ]

  return (
    <>
      <header className="ad-head-mizu">
        <div>
          <p className="ad-kicker-mizu">購読 / Subscribers</p>
          <h1 className="ad-title-mizu">
            The list
            {items && <span className="ad-count-mizu">{mailable.length}</span>}
          </h1>

          <div className="ad-tabs-mizu" role="tablist">
            {[
              ['write', 'Write'],
              ['list', `People${items ? ` (${items.length})` : ''}`],
              ['sent', `Sent${sent ? ` (${sent.length})` : ''}`],
            ].map(([k, label]) => (
              <button
                key={k} type="button" role="tab"
                aria-selected={tab === k}
                className={`ad-tab-mizu${tab === k ? ' is-on' : ''}`}
                onClick={() => { setTab(k); setOpen(null) }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="ad-head-act-mizu">
          <button
            type="button" className="ad-ghost-mizu"
            onClick={() => { load(); loadSent() }}
          >
            Refresh
          </button>
        </div>
      </header>

      {err && <p className="ad-err-mizu" role="alert">{err}</p>}

      {/* ── Write ───────────────────────────────── */}
      {tab === 'write' && (
        <div className="ad-write-mizu">
          <div className="ad-sheetcol-mizu">
            <label className="ad-subject-mizu">
              <span>Subject</span>
              <input
                type="text" value={subject} maxLength={120}
                placeholder="New hackathon on the portfolio"
                onChange={(e) => setSubject(e.target.value)}
              />
            </label>

            <EmailSheet
              banner={absolute(banner)}
              heading={heading} onHeading={setHeading}
              body={body} onBody={setBody}
              ctaLabel={ctaLabel} onCta={setCtaLabel}
              onPickFile={setCropFile}
              site="mizu-portfolio.vercel.app"
            />
          </div>

          <aside className="ad-side-mizu">
            <p className="ad-sec-mizu">設定 / Settings</p>

            <label className="ad-field-mizu">
              <span>Button goes to</span>
              <select
                className="ad-select-mizu" value={target}
                onChange={(e) => onTarget(e.target.value)}
              >
                {TARGETS.map(([path, label]) => (
                  <option key={path || 'home'} value={path}>{label}</option>
                ))}
              </select>
            </label>

            <div className="ad-field-mizu">
              <span>Land them in</span>
              <div className="ad-seg-mizu" role="group" aria-label="Site mode">
                {['personal', 'recruiter'].map((m) => (
                  <button
                    key={m} type="button"
                    className={`ad-segb-mizu${mode === m ? ' is-on' : ''}`}
                    onClick={() => setMode(m)} aria-pressed={mode === m}
                  >
                    {m === 'personal' ? 'Personal' : 'Recruiter'}
                  </button>
                ))}
              </div>
              <small>Link: <code>/?mode={mode}{target}</code></small>
            </div>

            <div className="ad-field-mizu">
              <span>Send to</span>
              <div className="ad-seg-mizu" role="group" aria-label="Who to send to">
                <button
                  type="button"
                  className={`ad-segb-mizu${who === 'all' ? ' is-on' : ''}`}
                  onClick={() => setWho('all')} aria-pressed={who === 'all'}
                >
                  Everyone ({mailable.length})
                </button>
                <button
                  type="button"
                  className={`ad-segb-mizu${who === 'picked' ? ' is-on' : ''}`}
                  onClick={() => { setWho('picked'); setChoosing(true) }}
                  aria-pressed={who === 'picked'}
                >
                  Selected ({pickedIds.length})
                </button>
              </div>
              {who === 'picked' && (
                <button
                  type="button" className="ad-chip-mizu is-wide"
                  onClick={() => setChoosing(true)}
                >
                  {pickedIds.length === 0
                    ? 'Choose recipients'
                    : `Change these ${pickedIds.length}`}
                </button>
              )}
            </div>

            <div className="ad-sidesend-mizu">
              <button
                type="button" className="ad-ghost-mizu"
                onClick={() => send(true)}
                disabled={!ready || Boolean(sending)}
                title="Sends only to you, so you can read it before anyone else does"
              >
                {sending === 'test' ? 'Sending…' : 'Test to myself'}
              </button>

              <button
                type="button" className="ad-primary-mizu"
                onClick={() => setConfirming(true)}
                disabled={!ready || recipients === 0 || Boolean(sending)}
              >
                <SendIcon />
                Send to {recipients}
              </button>
            </div>

            {!ready && (
              <p className="ad-note-line-mizu">
                Subject, heading and message are all needed before this can send.
              </p>
            )}

            {result && (
              <p className="ad-ok-mizu" role="status">
                {result.test
                  ? 'Test sent to your own address. Nobody else got it.'
                  : `Sent to ${result.sent} of ${result.total}.`}
                {result.failed?.length > 0 && ` Failed: ${result.failed.join(', ')}.`}
              </p>
            )}
          </aside>
        </div>
      )}

      {/* ── People ──────────────────────────────── */}
      {tab === 'list' && (
        <>
          <div className="ad-stats-mizu">
            {stats.map(([label, n, cls]) => (
              <div key={label} className={`ad-stat-mizu ${cls}`}>
                <p className="ad-statn-mizu">{items ? n : '—'}</p>
                <p className="ad-statl-mizu">{label}</p>
              </div>
            ))}
          </div>

          <div className="ad-tools-mizu">
            <div className="ad-chips-mizu">
              <button
                type="button" className="ad-chip-mizu is-wide"
                onClick={copyAll} disabled={mailable.length === 0}
                title="Copy every confirmed, still-subscribed address for a BCC field"
              >
                <CopyIcon />
                {copied ? 'Copied' : `Copy ${mailable.length} confirmed`}
              </button>

              <button
                type="button" className="ad-chip-mizu is-wide"
                onClick={() => pickAll(!allShownPicked)}
                disabled={mailableShown.length === 0}
              >
                {allShownPicked ? 'Clear selection' : `Select these ${mailableShown.length}`}
              </button>
            </div>

            <div className="ad-tools-end-mizu">
              <label className="ad-search-mizu">
                <SearchIcon />
                <input
                  type="search" value={raw} placeholder="Search by address"
                  onChange={(e) => setRaw(e.target.value)}
                  aria-label="Search subscribers"
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

          {items === null && <p className="ad-empty-mizu">Loading…</p>}

          {shown?.length === 0 && (
            <p className="ad-empty-mizu">
              {items.length === 0
                ? 'Nobody has subscribed yet.'
                : 'Nothing matches those filters.'}
            </p>
          )}

          {shown && shown.length > 0 && (
            <ul className="ad-subs-mizu">
              {shown.map((r) => (
                <Row
                  key={r.id} s={r}
                  picked={picked.has(r.id)}
                  onOnly={only}
                  onPick={(id, on) =>
                    setPicked((prev) => {
                      const next = new Set(prev)
                      on ? next.add(id) : next.delete(id)
                      return next
                    })
                  }
                  onAskDelete={setDoomed}
                  onChanged={(id, at) =>
                    setItems((list) =>
                      list.map((x) => (x.id === id ? { ...x, unsubscribed_at: at } : x))
                    )
                  }
                />
              ))}
            </ul>
          )}
        </>
      )}

      {/* ── Sent ────────────────────────────────── */}
      {tab === 'sent' && !open && (
        <>
          {sent === null && <p className="ad-empty-mizu">Loading…</p>}
          {sent?.length === 0 && (
            <p className="ad-empty-mizu">Nothing has gone out yet.</p>
          )}

          {sent && sent.length > 0 && (
            <ul className="ad-sentlist-mizu">
              {sent.map((m) => (
                <li key={m.id}>
                  <button
                    type="button" className="ad-sentrow-mizu"
                    onClick={() => setOpen(m)}
                  >
                    <span className="ad-sentwho-mizu">
                      <span className="ad-sentsub-mizu">
                        {m.subject}
                        {m.is_test && <span className="ad-sub-tag-mizu">Test</span>}
                      </span>
                      <span className="ad-sentmeta-mizu">
                        {when(m.created_at)} · {m.sent_count}{' '}
                        {m.sent_count === 1 ? 'recipient' : 'recipients'}
                        {m.failed?.length > 0 && ` · ${m.failed.length} failed`}
                        {' · '}{m.mode} mode
                      </span>
                    </span>
                    <span className="ad-sentgo-mizu" aria-hidden="true">→</span>
                  </button>

                  <button
                    type="button" className="ad-trash-mizu"
                    onClick={() => setDoomed(m)}
                    aria-label={`Delete the record of ${m.subject}`}
                    title="Delete this record"
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === 'sent' && open && (
        <div className="ad-write-mizu">
          <div className="ad-sheetcol-mizu">
            <div className="ad-subject-mizu is-read">
              <span>Subject</span>
              <p>{open.subject}</p>
            </div>

            <EmailSheet
              banner={open.banner}
              heading={open.heading}
              body={open.body}
              ctaLabel={open.cta_label ?? ''}
              site="mizu-portfolio.vercel.app"
            />
          </div>

          <aside className="ad-side-mizu">
            <button
              type="button" className="ad-ghost-mizu"
              onClick={() => setOpen(null)}
            >
              ← Back to sent
            </button>

            <p className="ad-sec-mizu">宛先 / Went to</p>

            <div className="ad-field-mizu">
              <span>{open.sent_count} delivered</span>
              <ul className="ad-rcpt-mizu">
                {(open.recipients ?? []).map((e) => (
                  <li key={e}><MailIcon />{e}</li>
                ))}
                {(open.recipients ?? []).length === 0 && <li>None recorded.</li>}
              </ul>
            </div>

            {open.failed?.length > 0 && (
              <div className="ad-field-mizu">
                <span>{open.failed.length} failed</span>
                <ul className="ad-rcpt-mizu is-bad">
                  {open.failed.map((e) => (
                    <li key={e}><MailIcon />{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="ad-field-mizu">
              <span>Details</span>
              <small>
                Sent {when(open.created_at)}.
                {' '}Button {open.cta_label ? `“${open.cta_label}”` : 'omitted'},
                {' '}landing in {open.mode} mode
                {open.cta_path ? ` at ${open.cta_path}` : ' on the home page'}.
              </small>
            </div>

            <button
              type="button" className="ad-ghost-mizu"
              onClick={() => {
                setSubject(open.subject)
                setHeading(open.heading)
                setBody(open.body)
                setCtaLabel(open.cta_label ?? '')
                setTarget(open.cta_path ?? '')
                setMode(open.mode)
                if (open.banner) setBanner(open.banner)
                setOpen(null)
                setTab('write')
              }}
            >
              Use as a starting point
            </button>
          </aside>
        </div>
      )}

      <BannerCrop
        file={cropFile}
        onCancel={() => setCropFile(null)}
        onDone={takeCrop}
      />

      <PickPeople
        open={choosing}
        people={mailable}
        picked={picked}
        onClose={() => setChoosing(false)}
        onDone={(next) => { setPicked(next); setChoosing(false) }}
      />

      <dialog
        ref={sendRef} className="ad-confirm-mizu" aria-label="Confirm send"
        onCancel={(e) => { e.preventDefault(); if (!sending) setConfirming(false) }}
      >
        <div className="ad-confirm-body-mizu">
          <h2>Send to {recipients} {recipients === 1 ? 'person' : 'people'}?</h2>
          <p>
            Subject: <strong>{subject}</strong>. Each one gets their own copy
            with their own unsubscribe link, landing in {mode} mode. This
            cannot be recalled once it starts.
          </p>

          <div className="ad-confirm-act-mizu">
            <button
              type="button" className="ad-ghost-mizu"
              onClick={() => setConfirming(false)} disabled={Boolean(sending)}
            >
              Cancel
            </button>
            <button
              type="button" className="ad-primary-mizu"
              onClick={() => send(false)} disabled={Boolean(sending)}
            >
              {sending === 'real' ? 'Sending…' : 'Send it'}
            </button>
          </div>
        </div>
      </dialog>

      <dialog
        ref={askRef} className="ad-confirm-mizu" aria-label="Confirm delete"
        onCancel={(e) => { e.preventDefault(); if (!killing) setDoomed(null) }}
      >
        <div className="ad-confirm-body-mizu">
          <h2>
            {doomed?.subject ? 'Delete this record?' : 'Delete this subscriber?'}
          </h2>
          {doomed?.subject ? (
            <p>
              The record of “{doomed.subject}” goes, along with its banner
              image if no other send is still using it. The email itself has
              already been delivered and cannot be recalled.
            </p>
          ) : (
            <p>
              {doomed?.email} will be removed from the list entirely. Nothing
              stops them signing up again, and if they never confirmed, that is
              all deleting achieves. To keep the record and simply stop mailing
              someone who did confirm, use Unsubscribe instead.
            </p>
          )}

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
                  if (doomed.subject) {
                    await destroySent(doomed, sent)
                    setSent((list) => list.filter((x) => x.id !== doomed.id))
                    if (open?.id === doomed.id) setOpen(null)
                  } else {
                    await removeSubscriber(doomed.id)
                    setItems((list) => list.filter((x) => x.id !== doomed.id))
                  }
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
