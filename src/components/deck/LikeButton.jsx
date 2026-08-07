import { useEffect, useRef, useState } from 'react'
import { configured } from '../../data/supabase.js'
import { listCounts, readMine, toggle } from '../../data/likes.js'

/* ══════════════════════════════════════════════════
   The heart beside a project's name.

   Optimistic: the count moves on click and is corrected
   by whatever the server returns. A like is not worth a
   spinner, and the correction is invisible when it
   agrees, which is almost always.
   ══════════════════════════════════════════════════ */

function Heart({ full }) {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24"
      fill={full ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20.4 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 0 1 19.4 13Z" />
    </svg>
  )
}

export default function LikeButton({ slug, what = 'project' }) {
  const [n, setN] = useState(null)
  const [mine, setMine] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [bump, setBump] = useState(0)
  const live = useRef(true)

  useEffect(() => {
    live.current = true
    return () => { live.current = false }
  }, [])

  useEffect(() => {
    if (!configured) return
    setMine(readMine().has(slug))
    listCounts()
      .then((all) => { if (live.current) setN(all[slug] ?? 0) })
      .catch(() => { if (live.current) setN(0) })
  }, [slug])

  if (!configured) return null

  const click = async () => {
    if (busy) return
    setBusy(true)
    setErr('')

    /* Moved before the request and reconciled after. */
    const was = { n, mine }
    setMine(!mine)
    setN((v) => Math.max(0, (v ?? 0) + (mine ? -1 : 1)))
    if (!mine) setBump((b) => b + 1)

    try {
      const out = await toggle(slug)
      if (!live.current) return
      setN(out.likes)
      setMine(out.liked)
    } catch (e) {
      if (!live.current) return
      setN(was.n)
      setMine(was.mine)
      setErr(e.message || 'That did not register.')
    } finally {
      if (live.current) setBusy(false)
    }
  }

  return (
    <span className="lk-wrap-mizu">
      <button
        type="button"
        className={`lk-mizu${mine ? ' is-on' : ''}`}
        onClick={click}
        disabled={busy}
        aria-pressed={mine}
        aria-label={mine ? 'Remove your like' : `Like this ${what}`}
      >
        <span key={bump} className="lk-heart-mizu">
          <Heart full={mine} />
        </span>
        <span className="lk-n-mizu">{n ?? '·'}</span>
      </button>

      {err && <span className="lk-err-mizu" role="alert">{err}</span>}
    </span>
  )
}
