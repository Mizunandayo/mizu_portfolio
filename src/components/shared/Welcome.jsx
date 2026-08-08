import { useCallback, useEffect, useRef, useState } from 'react'
import useNameTaken from '../../hooks/useNameTaken.jsx'
import { nameTaken } from '../../data/tickets.js'
import { useMode } from '../../hooks/useMode.jsx'
import { TRACKS } from '../../data/music.js'
import { HERO_SOUND } from '../../events.js'
import { WELCOME_STORE as STORE } from '../../greeting.js'
import SLIDES from 'virtual:ticket-art'
import Ticket, { ticketStamp } from './Ticket.jsx'
import { OPEN_TICKET } from '../../events.js'

/* ══════════════════════════════════════════════════
   Welcome — 入場券, the guide's greeting as a ticket.

   Personal mode only, once per session, after the boot
   sequence has cleared. The 9:16 cover is the ticket's
   illustrated stub; the greeting is printed beside it
   across the perforation.

   On sound: a browser refuses to play audio until the
   page has been interacted with, and a hover is not an
   interaction — no amount of moving the cursor over a
   track will satisfy the policy. So the first real
   gesture anywhere on the page silently primes the
   preview element (play at zero volume, pause), which
   marks it as user-activated and lets every later hover
   through. Until that happens the panel says so rather
   than looking broken.
   ══════════════════════════════════════════════════ */

const VOICE = '/profile/waguriaudio.mp3'
/* Matches the exit animation. The panel has to finish leaving before
   React takes it out, or the dip never renders. */
const EXIT = 460
/* Short enough to feel immediate, long enough that sweeping the cursor
   down the list does not fire all three in sequence. */
const PREVIEW_DWELL = 180
const NUMERAL = ['一', '二', '三', '四', '五']

/* Read off disk at build time — drop a gc<n> into the folder and it is
   in the rotation, whatever its extension. See the plugin in
   vite.config.js.

   All are 9:16 and the stub is sized to match, so nothing is cropped.
   Every frame stays mounted — cross-fading needs the outgoing one
   still in the tree — but only the first is fetched at full priority;
   the rest trickle in behind it, and at 4.5s a frame each they are
   there long before their turn. */
const SLIDE_MS = 4500

export default function Welcome({ show, onPickTrack }) {
  const { isRecruiter } = useMode()
  const [open, setOpen] = useState(false)
  const [needsTap, setNeedsTap] = useState(false)
  const [hasVoice, setHasVoice] = useState(true)
  const [closing, setClosing] = useState(false)
  const [pick, setPick] = useState(null)
  const [locked, setLocked] = useState(false)
  const [slide, setSlide] = useState(0)
  const [name, setName] = useState('')
  const dupe = useNameTaken(name, nameTaken)
  const clash = dupe === name.trim()
  const [ticket, setTicket] = useState(false)

  /* Openable from the gallery long after the greeting has been dismissed. */
  useEffect(() => {
    const on = () => setTicket(true)
    window.addEventListener(OPEN_TICKET, on)
    return () => window.removeEventListener(OPEN_TICKET, on)
  }, [])

  const ref = useRef(null)
  const audioRef = useRef(null)
  const previewRef = useRef(null)
  /* Previews are off from the moment a close begins. The panel animates
     out over 460ms with a translate and a scale, so rows slide under a
     stationary pointer and fire mouseenter again after close() has
     already stopped the audio, starting a preview that outlives the
     dialog and plays on with no player to show for it. */
  const goneRef = useRef(false)
  const dwellRef = useRef(null)

  useEffect(() => {
    if (!show || isRecruiter) return
    let seen = null
    try {
      seen = sessionStorage.getItem(STORE)
    } catch {
      /* private mode */
    }
    if (seen) return
    setOpen(true)
  }, [show, isRecruiter])

  /* ── Slideshow ──────────────────────────────────
     `slide` is a dependency on purpose: changing it tears the timer
     down and starts a fresh one, so pressing next gives that frame a
     full turn instead of whatever was left of the previous one. */
  const go = useCallback((d) => {
    setSlide((s) => (s + d + SLIDES.length) % SLIDES.length)
  }, [])

  /* The greeting's stub only, and only while the ticket editor is not
     up. The editor picks its own artwork and steps through it by hand;
     a timer still running underneath would either fight that or move
     the greeting on to a frame nobody asked for. */
  useEffect(() => {
    if (!open || ticket) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setTimeout(() => go(1), SLIDE_MS)
    return () => clearTimeout(t)
  }, [open, ticket, slide, go])

  /* ── Track preview ──────────────────────────────
     Hovering auditions a track, softer than the real thing so an
     audition never sounds like the player has already started. */
  const preview = useCallback((t) => {
    if (goneRef.current) return
    clearTimeout(dwellRef.current)
    const a = previewRef.current
    if (!a) return

    /* Point the element at the track here rather than inside the timer,
       so the fetch overlaps the dwell instead of landing after it. */
    const href = new URL(t.src, location.origin).href
    if (a.src !== href) {
      a.src = href
      a.load()
    }

    dwellRef.current = window.setTimeout(() => {
      a.currentTime = 0
      a.volume = 0.42
      a.play()
        .then(() => setLocked(false))
        .catch(() => setLocked(true))
    }, PREVIEW_DWELL)
  }, [])

  const stopPreview = useCallback(() => {
    clearTimeout(dwellRef.current)
    const a = previewRef.current
    if (a) {
      a.pause()
      a.currentTime = 0
    }
  }, [])

  /* The unlock. Any pointerdown or keypress on the page is the gesture
     the autoplay policy is waiting for — a click on the backdrop, on a
     track row, on Enter, anything. Priming on it costs nothing audible
     and makes every later hover work. */
  useEffect(() => {
    if (!open) return

    const arm = () => {
      const a = previewRef.current
      /* Already audible — priming would pause a preview the visitor is
         deliberately listening to. */
      if (!a || !a.paused) return
      const vol = a.volume
      a.volume = 0
      a.play()
        .then(() => {
          a.pause()
          a.currentTime = 0
          a.volume = vol
          setLocked(false)
        })
        .catch(() => {
          a.volume = vol
        })
    }

    const opts = { once: true, capture: true }
    document.addEventListener('pointerdown', arm, opts)
    document.addEventListener('keydown', arm, opts)
    return () => {
      document.removeEventListener('pointerdown', arm, true)
      document.removeEventListener('keydown', arm, true)
    }
  }, [open])

  /* Set synchronously by close() before the exit animation starts, so
     finish() still knows which button was pressed 460ms later. */
  const discardRef = useRef(false)

  const finish = useCallback(() => {
    /* Again on the way out: the guard above stops a new preview starting,
       this stops one that was already audible when close() ran. */
    stopPreview()
    if (pick && !discardRef.current) onPickTrack?.(pick)
    setOpen(false)
    setClosing(false)
    try {
      sessionStorage.setItem(STORE, '1')
    } catch {
      /* ignore */
    }
  }, [pick, onPickTrack, stopPreview])

  /* Dip, then leave. The panel plays its exit before it is unmounted,
     so the close is deferred by exactly the animation's length.

     `discard === true` rather than a plain truthy check: passing this
     straight to onClick would hand it a click event, and every event
     object is truthy — which would silently throw away a chosen track
     on the Enter button too. */
  const close = useCallback((discard = false) => {
    if (closing) return
    discardRef.current = discard === true
    goneRef.current = true
    audioRef.current?.pause()
    stopPreview()

    /* Turning down the playlist turns up the hero instead. Dispatched
       here rather than in finish(): unmuting media needs user
       activation, and this call stack has it — 460ms later, after the
       exit animation, is a different stack with no gesture behind it.

       An event rather than a prop because Hero sits inside the Home
       route; wiring a callback down to it would thread through App,
       Routes and Home for one boolean that fires once. */
    if (discard === true) {
      window.dispatchEvent(new CustomEvent(HERO_SOUND))
    }

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (still) {
      finish()
      return
    }

    setClosing(true)
    window.setTimeout(finish, EXIT)
  }, [closing, finish, stopPreview])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) { goneRef.current = false; el.showModal() }
    if (!open && el.open) el.close()
  }, [open])

  useEffect(() => () => stopPreview(), [stopPreview])

  /* Scroll lock. showModal() makes the page behind inert to clicks but
     does not stop the wheel from scrolling it, so the page slides
     around under the blurred backdrop. Same <html> class Boot uses.

     Unlike Boot's, this cleanup does run: the effect keys on `open`,
     so flipping it to false fires the teardown even though the
     component itself is never unmounted. */
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    /* Hiding overflow takes the scrollbar with it and the page behind
       jumps sideways by its width. Hand that width back as padding. */
    const gutter = window.innerWidth - root.clientWidth
    root.style.setProperty('--wc-gutter', `${gutter}px`)
    root.classList.add('wc-open-mizu')
    return () => {
      root.classList.remove('wc-open-mizu')
      root.style.removeProperty('--wc-gutter')
    }
  }, [open])

  /* Try the voice the moment the panel opens. A rejected promise here
     is the autoplay policy, not a broken file — the error handler on
     the element covers the missing-file case separately. */
  useEffect(() => {
    if (!open) return
    const a = audioRef.current
    if (!a) return
    a.currentTime = 0
    a.play()
      .then(() => setNeedsTap(false))
      .catch(() => setNeedsTap(true))
  }, [open])

  const enableSound = () => {
    audioRef.current
      ?.play()
      .then(() => setNeedsTap(false))
      .catch(() => {})
  }

  /* The greeting goes, the ticket editor stays. Returning null here used
     to take the <Ticket> sibling with it, so the gallery's button set
     state on a component that rendered nothing. */
  if (!open) {
    return (
      <Ticket
        open={ticket}
        name={name}
        art={SLIDES[slide]}
        onClose={() => setTicket(false)}
      />
    )
  }

  return (
    <>
    <dialog
      ref={ref}
      className={`wc-mizu${closing ? ' is-closing' : ''}`}
      aria-labelledby="wc-title"
      /* Esc keeps a chosen track, and with nothing chosen behaves as
         the discard button does — Enter is disabled in that state, so
         Esc is the keyboard's only way out and should land somewhere
         identical rather than somewhere subtly different. */
      onCancel={(e) => {
        e.preventDefault()
        close(!pick)
      }}
    >
      <div className="wc-body-mizu">
        <div className="wc-face-mizu">
          {/* ── Stub ── */}
          <div className="wc-stub-mizu">
            {SLIDES.map((src, i) => (
              <img
                key={src}
                className={`wc-cover-mizu${i === slide ? ' is-on' : ''}`}
                src={src}
                alt=""
                aria-hidden="true"
                decoding="async"
                fetchpriority={i === 0 ? 'high' : 'low'}
              />
            ))}
            <span className="wc-stub-veil-mizu" aria-hidden="true" />

            <button
              type="button"
              className="wc-nav-mizu prev"
              onClick={() => go(-1)}
              aria-label="Previous image"
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              className="wc-nav-mizu next"
              onClick={() => go(1)}
              aria-label="Next image"
            >
              <Chevron dir="right" />
            </button>

            <span
              className="wc-rail-mizu"
              style={{ '--slide-ms': `${SLIDE_MS}ms` }}
              aria-hidden="true"
            >
              {SLIDES.map((src, i) => (
                <span
                  key={src}
                  className={`wc-rail-seg-mizu${i < slide ? ' is-done' : ''}`}
                >
                  {/* Keyed on the index so React replaces the node on
                      every advance — that remount is what restarts the
                      fill animation. */}
                  {i === slide && <i key={slide} className="wc-rail-fill-mizu" />}
                </span>
              ))}
            </span>

            <span className="wc-stub-kana-mizu" aria-hidden="true">
              ようこそ
            </span>
            {/* Safe to read the clock during render: this panel returns
                null until an effect opens it, so it never renders on the
                server and the prerendered HTML cannot bake in a stale
                build date for hydration to disagree with. */}
            <span className="wc-stub-serial-mizu" aria-hidden="true">
              {ticketStamp()}
            </span>

            {needsTap && hasVoice && (
              <button
                type="button"
                className="wc-sound-mizu"
                onClick={enableSound}
              >
                <SpeakerIcon />
                Sound
              </button>
            )}
          </div>

          <span className="wc-perf-mizu" aria-hidden="true" />

          {/* ── Printed body ── */}
          <div className="wc-text-mizu">
            <div className="wc-head-mizu">
              <span className="wc-head-jp-mizu" aria-hidden="true">
                入場券
              </span>
              <span className="wc-head-en-mizu">Admit one</span>
              <span className="wc-head-no-mizu" aria-hidden="true">
                NO. 0001
              </span>
            </div>

<h2 id="wc-title" className="wc-title-mizu">
  to Mizuki's Horizon
</h2>

<p className="wc-copy-mizu">
  Come take a look around. Here you&rsquo;ll find the projects I&rsquo;ve
  built, the hackathons I&rsquo;ve joined, the experiences that shaped me,
  and a few things I&rsquo;ve made just for fun. Explore the work, create
  your own customized ticket, and feel free to play some retro games along the way.
</p>

            <p className="wc-sign-mizu">Greetings from Francis Daniel</p>

            {/* Above the music, not below it: Enter and "continue without
                chosen music" both act on the track list, so a name field
                between them split one decision in half. */}
            <div className="wc-name-mizu">
              <label className="wc-name-label-mizu" htmlFor="wc-name">
                氏名 / Name
              </label>

              <input
                id="wc-name"
                className="wc-name-input-mizu"
                type="text"
                value={name}
                maxLength={28}
                autoComplete="name"
                placeholder="Enter your name"
                onChange={(e) => setName(e.target.value)}
                /* Enter issues rather than dismissing the dialog —
                   a bare <input> inside <dialog> would otherwise let
                   the default close it. */
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  if (name.trim() && !clash) setTicket(true)
                }}
              />

              <button
                type="button"
                className="wc-issue-mizu"
                onClick={() => setTicket(true)}
                disabled={!name.trim() || clash || dupe === 'checking'}
              >
                <span className="wc-issue-kanji-mizu" aria-hidden="true">
                  発券
                </span>
                Get your ticket
              </button>

              {/* The clash warning replaces the standing note rather than
                  stacking under it, so the row never grows. */}
              <p className="wc-name-note-mizu" aria-live="polite">
                {dupe === 'checking' ? (
                  'Checking…'
                ) : clash ? (
                  <b>“{name.trim()}” already has a ticket. Try another.</b>
                ) : (
                  'No rush. The ticket desk is further down the page if you would rather make one later.'
                )}
              </p>
            </div>

            <div className="wc-music-mizu">
              <p className="wc-music-label-mizu" id="wc-music">
                Select any music
                <span className="wc-music-opt-mizu">(hover to preview)</span>
              </p>

              <div
                className="wc-tracks-mizu"
                role="group"
                aria-labelledby="wc-music"
              >
                {TRACKS.map((t, i) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`wc-track-mizu${pick === t.id ? ' is-on' : ''}`}
                    /* Selecting the active one clears it — the whole
                       row is optional, so it has to be un-choosable. */
                    onClick={() => setPick((p) => (p === t.id ? null : t.id))}
                    onMouseEnter={() => preview(t)}
                    onMouseLeave={stopPreview}
                    onFocus={() => preview(t)}
                    onBlur={stopPreview}
                    aria-pressed={pick === t.id}
                  >
                    <span className="wc-track-no-mizu" aria-hidden="true">
                      {NUMERAL[i]}
                    </span>

                    <img className="wc-track-cover-mizu" src={t.cover} alt="" />

                    <span className="wc-track-text-mizu">
                      <span className="wc-track-name-mizu">{t.title}</span>
                      <span className="wc-track-sub-mizu">{t.artist}</span>
                    </span>

                    <span className="wc-track-kanji-mizu" aria-hidden="true">
                      {t.kanji}
                    </span>
                    <span className="wc-track-cue-mizu" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  </button>
                ))}
              </div>

              {locked && (
                <p className="wc-hint-mizu">
                  Click anywhere once to enable previews — your browser blocks
                  sound until the page has been touched.
                </p>
              )}
            </div>

            <div className="wc-cta-mizu">
              <button
                type="button"
                className="wc-enter-mizu"
                onClick={() => close(false)}
                /* Enter carries a track in; leaving without one is what
                   the button beside it is for. The two paths stay
                   distinct rather than Enter quietly meaning both. */
                disabled={!pick}
              >
                <span className="wc-enter-kanji-mizu" aria-hidden="true">
                  入
                </span>
                Enter
              </button>

              <button
                type="button"
                className="wc-skip-mizu"
                onClick={() => close(true)}
              >
                Continue without chosen music
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Carries the first track from the start so the priming gesture has
          something to play — play() on a source-less element rejects, and
          the unlock would never take. */}
      <audio ref={previewRef} src={TRACKS[0]?.src} preload="none" />

      {/* Separate from the greeting so it can be re-voiced without
          re-encoding, and so a missing file degrades to no button rather
          than a silent modal that looks broken. */}
      <audio
        ref={audioRef}
        src={VOICE}
        preload="auto"
        onError={() => {
          setHasVoice(false)
          setNeedsTap(false)
        }}
      />
    </dialog>

    {/* Sibling, not a child — a dialog nested inside another dialog's
        markup still works, but keeping it outside means the greeting's
        exit animation never drags the ticket with it. The art is
        whichever frame is showing, so the ticket keeps the one they
        were looking at. */}
    <Ticket
      open={ticket}
      name={name}
      art={SLIDES[slide]}
      onClose={() => setTicket(false)}
    />
    </>
  )
}

function Chevron({ dir }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={dir === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  )
}

function SpeakerIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  )
}
