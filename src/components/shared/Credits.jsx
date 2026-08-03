import { useEffect, useRef } from 'react'
import { PROFILE } from '../../data/profile.js'
import { CREDITS, DISCLAIMER, TAKEDOWN } from '../../data/credits.js'

/* ══════════════════════════════════════════════════
   Credits — 出典.

   Reachable from either navbar, so it is mounted once
   in App rather than inside one of them: two copies
   would mean two dialogs and two pieces of state for
   one panel.

   Native <dialog> + showModal(), like everything else
   here — focus trapping, Esc and top-layer stacking for
   free, and no z-index to lose track of.
   ══════════════════════════════════════════════════ */

export default function Credits({ open, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  if (!open) return null

  return (
    <dialog
      ref={ref}
      className="cr-mizu"
      aria-labelledby="cr-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      /* Anywhere outside the panel closes; the panel stops the event so
         a click on the text does not dismiss it. */
      onClick={onClose}
    >
      <div className="cr-panel-mizu" onClick={(e) => e.stopPropagation()}>
        <header className="cr-head-mizu">
          <h2 id="cr-title" className="cr-title-mizu">
            <span className="cr-jp-mizu" aria-hidden="true">
              出典
            </span>
            Credits
          </h2>

          <button
            type="button"
            className="cr-close-mizu"
            onClick={onClose}
            aria-label="Close credits"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="cr-scroll-mizu">
          {/* Disclaimer leads. What is claimed and what is not comes
              before the list of what could be traced. */}
          <section className="cr-block-mizu">
            <p className="cr-eyebrow-mizu">
              <span aria-hidden="true">免責</span> Disclaimer
            </p>

            {DISCLAIMER.map((p) => (
              <p key={p.slice(0, 24)} className="cr-copy-mizu">
                {p}
              </p>
            ))}

            <p className="cr-takedown-mizu">
              {TAKEDOWN}{' '}
              <a href={`mailto:${PROFILE.contact.email}`}>
                {PROFILE.contact.email}
              </a>
            </p>
          </section>

          {CREDITS.map((g) => (
            <section key={g.group} className="cr-block-mizu">
              <p className="cr-eyebrow-mizu">
                <span aria-hidden="true">{g.jp}</span> {g.group}
              </p>

              {g.items.length > 0 && (
                <ul className="cr-list-mizu">
                  {g.items.map((it) => (
                    <li key={it.name}>
                      <span className="cr-name-mizu">{it.name}</span>

                      {/* Linked when the source can be pointed at —
                          attribution that leads back to the creator is
                          worth more than a name in plain text. */}
                      {it.href ? (
                        <a
                          className="cr-by-mizu"
                          href={it.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {it.by}
                        </a>
                      ) : (
                        <span className="cr-by-mizu">{it.by}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* Sits under whatever could be named, so the gap reads as
                  disclosed rather than as an oversight. */}
              {g.note && <p className="cr-note-mizu">{g.note}</p>}
            </section>
          ))}
        </div>
      </div>
    </dialog>
  )
}
