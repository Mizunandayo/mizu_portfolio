import { useCallback, useEffect, useRef, useState } from 'react'
import { useMode } from '../../hooks/useMode.jsx'
import { TRACKS } from '../../data/music.js'
import Ticket from './Ticket.jsx'

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

const STORE = 'mizu-welcome'
const VOICE = '/profile/waguriaudio.mp3'
/* Matches the exit animation. The panel has to finish leaving before
   React takes it out, or the dip never renders. */
const EXIT = 460
/* Short enough to feel immediate, long enough that sweeping the cursor
   down the list does not fire all three in sequence. */
const PREVIEW_DWELL = 180
const NUMERAL = ['一', '二', '三', '四', '五']

/* All eleven are 9:16, and the stub is sized to match, so nothing is
   cropped. Every frame stays mounted — cross-fading needs the outgoing
   one still in the tree — but only the first is fetched at full
   priority; the rest trickle in behind it, and at 4.5s a frame each
   they are there long before their turn. */
const SLIDES = Array.from(
  { length: 11 },
  (_, i) => `/profile/tickets/gc${i + 1}.jpg`
)
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
  const [ticket, setTicket] = useState(false)

  const ref = useRef(null)
  const audioRef = useRef(null)
  const previewRef = useRef(null)
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

  useEffect(() => {
    if (!open) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setTimeout(() => go(1), SLIDE_MS)
    return () => clearTimeout(t)
  }, [open, slide, go])

  /* ── Track preview ──────────────────────────────
     Hovering auditions a track, softer than the real thing so an
     audition never sounds like the player has already started. */
  const preview = useCallback((t) => {
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

  const finish = useCallback(() => {
    if (pick) onPickTrack?.(pick)
    setOpen(false)
    setClosing(false)
    try {
      sessionStorage.setItem(STORE, '1')
    } catch {
      /* ignore */
    }
  }, [pick, onPickTrack])

  /* Dip, then leave. The panel plays its exit before it is unmounted,
     so the close is deferred by exactly the animation's length. */
  const close = useCallback(() => {
    if (closing) return
    audioRef.current?.pause()
    stopPreview()

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
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
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

  if (!open) return null

  return (
    <>
    <dialog
      ref={ref}
      className={`wc-mizu${closing ? ' is-closing' : ''}`}
      aria-labelledby="wc-title"
      onCancel={(e) => {
        e.preventDefault()
        close()
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
            <span className="wc-stub-serial-mizu" aria-hidden="true">
              MZ-2026-09
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
              Welcome to My Portfolio!
            </h2>

            <p className="wc-copy-mizu">
              This is a collection of the projects I&rsquo;ve built, the
              hackathons I&rsquo;ve competed in, and the ideas I&rsquo;ve
              brought to life. Click any card to learn more about the work
              behind it.
            </p>

            <p className="wc-sign-mizu">Greetings from Francis Daniel</p>

            <div className="wc-music-mizu">
              <p className="wc-music-label-mizu" id="wc-music">
                Click any music while you browse then enter
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

            {/* A field to fill in, not a form to submit — an underline
                and a label, the way a ticket is written on. */}
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
                placeholder="print your name"
                onChange={(e) => setName(e.target.value)}
                /* Enter issues rather than dismissing the dialog —
                   a bare <input> inside <dialog> would otherwise let
                   the default close it. */
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  if (name.trim()) setTicket(true)
                }}
              />

              <button
                type="button"
                className="wc-issue-mizu"
                onClick={() => setTicket(true)}
                disabled={!name.trim()}
              >
                <span className="wc-issue-kanji-mizu" aria-hidden="true">
                  発券
                </span>
                Issue ticket
              </button>
            </div>

            <div className="wc-cta-mizu">
              <button type="button" className="wc-enter-mizu" onClick={close}>
                <span className="wc-enter-kanji-mizu" aria-hidden="true">
                  入
                </span>
                Enter
              </button>

              <button type="button" className="wc-skip-mizu" onClick={close}>
                Skip
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
