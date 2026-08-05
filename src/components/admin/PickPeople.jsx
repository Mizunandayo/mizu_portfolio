import { useEffect, useMemo, useRef, useState } from 'react'
import { MailIcon, SearchIcon } from './icons.jsx'

/* Only confirmed, still-subscribed people reach this list. Choosing
   someone who cannot be mailed is not a decision worth offering. */

export default function PickPeople({ open, people, picked, onDone, onClose }) {
  const ref = useRef(null)
  const [draft, setDraft] = useState(() => new Set(picked))
  const [q, setQ] = useState('')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      /* Reset from the live selection each time it opens, so cancelling
         really does leave things as they were. */
      setDraft(new Set(picked))
      setQ('')
      el.showModal()
    }
    if (!open && el.open) el.close()
  }, [open, picked])

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    return term ? people.filter((p) => p.email.includes(term)) : people
  }, [people, q])

  const allShown = shown.length > 0 && shown.every((p) => draft.has(p.id))

  const toggle = (id, on) =>
    setDraft((prev) => {
      const next = new Set(prev)
      on ? next.add(id) : next.delete(id)
      return next
    })

  return (
    <dialog
      ref={ref}
      className="pp-mizu"
      aria-label="Choose who receives this"
      onCancel={(e) => { e.preventDefault(); onClose() }}
    >
      <div className="pp-body-mizu">
        <header className="pp-head-mizu">
          <div>
            <p className="ad-kicker-mizu">宛先 / Recipients</p>
            <h2>Who gets this one?</h2>
          </div>
          <span className="pp-count-mizu">{draft.size} selected</span>
        </header>

        <div className="pp-tools-mizu">
          <label className="ad-search-mizu">
            <SearchIcon />
            <input
              type="search" value={q} placeholder="Search by address"
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search recipients"
            />
          </label>

          <button
            type="button" className="ad-chip-mizu"
            onClick={() =>
              setDraft((prev) => {
                const next = new Set(prev)
                for (const p of shown) allShown ? next.delete(p.id) : next.add(p.id)
                return next
              })
            }
            disabled={shown.length === 0}
          >
            {allShown ? 'Clear these' : `Select these ${shown.length}`}
          </button>
        </div>

        {shown.length === 0 ? (
          <p className="ad-empty-mizu">
            {people.length === 0
              ? 'Nobody has confirmed yet, so there is nobody to pick.'
              : 'Nothing matches that.'}
          </p>
        ) : (
          <ul className="pp-list-mizu">
            {shown.map((p) => (
              <li key={p.id}>
                <label className={draft.has(p.id) ? 'is-on' : ''}>
                  <input
                    type="checkbox"
                    className="ad-pick-mizu"
                    checked={draft.has(p.id)}
                    onChange={(e) => toggle(p.id, e.target.checked)}
                  />
                  <MailIcon />
                  <span>{p.email}</span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="pp-act-mizu">
          <button type="button" className="ad-ghost-mizu" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button" className="ad-primary-mizu"
            onClick={() => onDone(draft)}
          >
            Use these {draft.size}
          </button>
        </div>
      </div>
    </dialog>
  )
}
