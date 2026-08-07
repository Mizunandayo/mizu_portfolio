import { useEffect, useState } from 'react'

/* The visuals are pure CSS animation so the prerendered HTML paints the
   loader before any JS runs. React owns two moments only: taking the
   mark off the screen, and taking the overlay out.

   Sequence:
     0.18s  beam enters, scan begins
     1.56s  scan completes, the resolved mark blooms
     1.85s  mark fades
     2.00s  backdrop starts lifting while the mark is still going
     2.07s  mark gone, page ~15% through
     2.45s  backdrop gone
     2.50s  overlay removed, scroll unlocked

   The two fades overlap on purpose. Back to back they left a beat of
   empty black between the mark leaving and the page arriving, which
   read as a second, blank hero. The mark still finishes ahead of the
   backdrop, so it never floats over a visible page.

   Every number here has a twin in index.css — the visuals are CSS
   animations so the prerendered HTML can paint before any JS runs, and
   these two timers only take things off screen. Change one and the
   other has to move with it, or the overlay is pulled while the mark
   is still fading. */
const MARK_OUT = 2070
const FULL = 2500
const REDUCED = 260

export default function Boot({ onDone }) {
  const [scanning, setScanning] = useState(true)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    /* Reduced motion collapses every animation to ~0ms globally, so the
       overlay is already invisible — just take it out immediately
       rather than holding an empty pane over the page for 3.5s. */
    /* Recruiter mode skips the 3.5s intro outright — someone screening
       candidates should land on the work, not wait for a title card. */
    const skip = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || document.documentElement.classList.contains('mode-recruiter')
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
      onDone?.()
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
        </div>
      )}
    </div>
  )
}
