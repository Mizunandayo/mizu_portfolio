import { useEffect, useState } from 'react'

/* The visuals are pure CSS animation so the prerendered HTML paints the
   loader before any JS runs. React owns two moments only: taking the
   mark off the screen, and taking the overlay out.

   Sequence:
     0.25s  beam enters, scan begins
     2.15s  scan completes, the resolved mark blooms
     2.55s  mark fades
     2.75s  backdrop starts lifting while the mark is still going
     2.85s  mark gone, page ~15% through
     3.37s  backdrop gone
     3.45s  overlay removed, scroll unlocked

   The two fades overlap on purpose. Back to back they left a beat of
   empty black between the mark leaving and the page arriving, which
   read as a second, blank hero. The mark still finishes well ahead of
   the backdrop, so it never floats over a visible page. */
const MARK_OUT = 2850
const FULL = 3450
const REDUCED = 260

export default function Boot() {
  const [scanning, setScanning] = useState(true)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    /* Reduced motion collapses every animation to ~0ms globally, so the
       overlay is already invisible — just take it out immediately
       rather than holding an empty pane over the page for 3.5s. */
    const skip = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const root = document.documentElement
    const unlock = () => root.classList.remove('booting-mizu')

    root.classList.add('booting-mizu')

    /* Belt and braces behind the CSS fade. The fade is 400ms so it has
       plenty of frames to land — unlike the 1ms stepped cut this
       replaced, which the browser could sample straight past and leave
       the mark stranded over the hero. Unmounting cannot miss. */
    const cut = setTimeout(() => setScanning(false), skip ? 0 : MARK_OUT)

    /* Unlock here rather than leaning on the cleanup below: this
       component returns null when it is finished but is never unmounted
       — App renders it for the life of the page — so cleanup would
       never fire and <html> would keep overflow:hidden forever. */
    const end = setTimeout(() => {
      unlock()
      setGone(true)
    }, skip ? REDUCED : FULL)

    return () => {
      clearTimeout(cut)
      clearTimeout(end)
      unlock()
    }
  }, [])

  if (gone) return null

  /* The mark is rendered twice and stacked: an unresolved wireframe and
     a solid copy clipped to whatever the beam has already passed over.
     Duplicating it — rather than clipping one element — is what keeps
     the glyph and the kana resolving in lockstep with a single beam,
     since both layers share one box and one set of percentages. */
  const mark = (
    <>
      <span className="boot-glyph-mizu">水</span>
      <span className="boot-kana-mizu">
        <span>ミ</span>
        <span>ズ</span>
      </span>
    </>
  )

  return (
    <div className="boot-mizu" role="status" aria-label="Loading Mizu">
      {scanning && (
        <div className="boot-core-mizu">
          <div className="boot-scan-mizu">
            <div className="boot-stage-mizu boot-stage-dim-mizu" aria-hidden="true">{mark}</div>
            <div className="boot-stage-mizu boot-stage-lit-mizu" aria-hidden="true">{mark}</div>
            <span className="boot-lines-mizu" aria-hidden="true" />
            <span className="boot-beam-mizu" aria-hidden="true" />
          </div>

          <div className="boot-rule-mizu" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}
