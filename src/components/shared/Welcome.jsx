import { useCallback, useEffect, useRef, useState } from "react";
import { useMode } from "../../hooks/useMode.jsx";
import { TRACKS } from "../../data/music.js";

/* ══════════════════════════════════════════════════
   Welcome — the guide's greeting.

   Personal mode only, once per session, after the boot
   sequence has cleared. Portrait video on the left,
   greeting on the right, inside a glass panel with
   chamfered corners and an ink frame.

   On sound: a browser will not autoplay audio with
   volume until the page has been interacted with. The
   attempt is made anyway — if the visitor has already
   clicked something this session it succeeds — and
   when it is refused the modal surfaces a control
   instead of failing silently. The video itself always
   plays, because it is muted, which is the whole
   reason muted autoplay is permitted.
   ══════════════════════════════════════════════════ */

const STORE = "mizu-welcome";
const VOICE = "/profile/waguriaudio.mp3";
/* Matches the exit animation. The panel has to finish leaving before
   React takes it out, or the dip never renders. */
const EXIT = 460;
const PREVIEW_DWELL = 260;

export default function Welcome({ show, onPickTrack }) {
  const { isRecruiter } = useMode();
  const [open, setOpen] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [hasVoice, setHasVoice] = useState(true);
  const [closing, setClosing] = useState(false);
  const [pick, setPick] = useState(null);

  const ref = useRef(null);
  const audioRef = useRef(null);
  const previewRef = useRef(null);
  const dwellRef = useRef(null);

  useEffect(() => {
    if (!show || isRecruiter) return;
    let seen = null;
    try {
      seen = sessionStorage.getItem(STORE);
    } catch {
      /* private mode */
    }
    if (seen) return;
    setOpen(true);
  }, [show, isRecruiter]);

  /* ── Track preview ──────────────────────────────
     Hovering auditions a track. A dwell delay first, or sweeping the
     cursor down the list fires all three in sequence. Playback is
     softer than the real thing so an audition never sounds like the
     player has already started. */
  const preview = useCallback((t) => {
    clearTimeout(dwellRef.current);
    dwellRef.current = window.setTimeout(() => {
      const a = previewRef.current;
      if (!a) return;
      if (a.src !== new URL(t.src, location.origin).href) a.src = t.src;
      a.currentTime = 0;
      a.volume = 0.42;
      a.play().catch(() => {
        /* autoplay policy — silence is fine here */
      });
    }, PREVIEW_DWELL);
  }, []);

  const stopPreview = useCallback(() => {
    clearTimeout(dwellRef.current);
    const a = previewRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
  }, []);

  const finish = useCallback(() => {
    if (pick) onPickTrack?.(pick);
    setOpen(false);
    setClosing(false);
    try {
      sessionStorage.setItem(STORE, "1");
    } catch {
      /* ignore */
    }
  }, [pick, onPickTrack]);

  /* Dip, then leave. The panel plays its exit before it is unmounted,
     so the close is deferred by exactly the animation's length. */
  const close = useCallback(() => {
    if (closing) return;
    audioRef.current?.pause();
    stopPreview();

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) {
      finish();
      return;
    }

    setClosing(true);
    window.setTimeout(finish, EXIT);
  }, [closing, finish, stopPreview]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  /* Try the voice the moment the panel opens. A rejected promise here
     is the autoplay policy, not a broken file — the error handler on
     the element covers the missing-file case separately. */
  useEffect(() => {
    if (!open) return;
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    a.play()
      .then(() => setNeedsTap(false))
      .catch(() => setNeedsTap(true));
  }, [open]);

  const enableSound = () => {
    audioRef.current
      ?.play()
      .then(() => setNeedsTap(false))
      .catch(() => {});
  };

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      className={`wc-mizu${closing ? " is-closing" : ""}`}
      aria-labelledby="wc-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="wc-body-mizu">
        <div className="wc-face-mizu">
          <span className="wc-corner-mizu tl" aria-hidden="true" />
          <span className="wc-corner-mizu br" aria-hidden="true" />

          {/* ── Portrait ── */}
          <div className="wc-stage-mizu">
            <video
              className="wc-video-mizu"
              src="/profile/wagurivideo.webm"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
              tabIndex={-1}
            />
            <span className="wc-stage-edge-mizu" aria-hidden="true" />

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

          {/* ── Greeting ── */}
          <div className="wc-text-mizu">
            <p className="wc-kana-mizu" aria-hidden="true">
              ようこそ
            </p>

            <h2 id="wc-title" className="wc-title-mizu">
              You&rsquo;re about to explore the world of Mizu.
            </h2>

            <p className="wc-copy-mizu">
              Nine shipped projects, nine hackathons, and a stubborn habit of
              finishing things inside eight days. Every card here opens — take
              your time, there is a story behind each one.
            </p>

            <div className="wc-music-mizu">
              <p className="wc-music-label-mizu" id="wc-music">
                Music while you browse
                <span className="wc-music-opt-mizu">optional</span>
              </p>

              <div
                className="wc-tracks-mizu"
                role="group"
                aria-labelledby="wc-music"
              >
                {TRACKS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`wc-track-mizu${pick === t.id ? " is-on" : ""}`}
                    /* Selecting the active one clears it — the whole
                       row is optional, so it has to be un-choosable. */
                    onClick={() => setPick((p) => (p === t.id ? null : t.id))}
                    onMouseEnter={() => preview(t)}
                    onMouseLeave={stopPreview}
                    onFocus={() => preview(t)}
                    onBlur={stopPreview}
                    aria-pressed={pick === t.id}
                  >
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

      {/* Separate from the video so the greeting can be re-voiced without
          re-encoding, and so a missing file degrades to no button rather
          than a silent modal that looks broken. */}
      <audio ref={previewRef} preload="none" />

      <audio
        ref={audioRef}
        src={VOICE}
        preload="auto"
        onError={() => {
          setHasVoice(false);
          setNeedsTap(false);
        }}
      />
    </dialog>
  );
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
  );
}
