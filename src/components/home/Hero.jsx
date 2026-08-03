import { useCallback, useEffect, useRef, useState } from "react";
import { PROFILE } from "../../data/profile.js";
import { StarField, PerspectiveGrid, Spotlight } from "../shared/Backdrop.jsx";
import {
  Pill,
  GitHubIcon,
  LinkedInIcon,
  ArrowIcon,
} from "../shared/primitives.jsx";
import { HERO_SOUND } from "../../events.js";

/* ══════════════════════════════════════════════════
   Hero — two presentations of one block.

   Personal is the base: an animated plate behind
   everything, the whole block set into the bottom-left
   corner, name in mincho. Recruiter restores the
   centred column on the generated backdrop.

   Laid out in classes rather than inline styles on
   purpose — an inline style outranks any class, so a
   hero written the old way could not be re-composed by
   the mode switch at all.
   ══════════════════════════════════════════════════ */

/* One pass of heropersonal.gif: 42 frames, 280 centiseconds of delay
   summed from its Graphic Control Extensions.

   Measured from the file because nothing in the DOM reports a GIF's
   animation — no event, no property, not even a frame count. Re-measure
   this if the file is ever re-exported. */
const GIF_LOOP = 2800;

/* The still holds for a flat six seconds. The GIF holds for exactly
   three passes instead, expressed as the multiple rather than the
   8400 it works out to, so the hand-over lands on a loop boundary
   even if the file is re-exported at a different length. */
const HOLD = 6000;
const GIF_HOLD = GIF_LOOP * 3;

/* The rotation, in order. Each backdrop hands over to the next: the
   video when it ends, the other two after `ms`. Only the video carries
   sound; the other two are silent by nature. */
const LAYERS = [
  {
    id: "video",
    label: "Video",
    kind: "video",
    src: "/profile/herobg2.mp4",
    sound: true,
  },
  {
    id: "image",
    label: "Image",
    kind: "image",
    src: "/profile/bgheroes.png",
    ms: HOLD,
  },
  {
    id: "gif",
    label: "GIF",
    kind: "image",
    src: "/profile/heropersonal.gif",
    ms: GIF_HOLD,
  },
];

/* Swapped in to restart the GIF. Every layer stays mounted so the 47 MB
   video is never re-fetched, but a hidden GIF keeps animating — by the
   time its turn came round again it would be part-way through a loop.
   Assigning a different src and then the original forces a fresh decode
   from frame one, served from cache rather than the network. */
const BLANK =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/* Role and location come from the strip that was already declared;
   availability is appended rather than hardcoded, so the hero and the
   contact card cannot end up disagreeing about it. */
const SPEC = [...PROFILE.strip, PROFILE.availability.status];


export default function Hero() {
  const [bg, setBg] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const gifRef = useRef(null);

  /* Read once. An auto-rotating backdrop is exactly the kind of motion
     this setting is asking to be spared, so the rotation stops and the
     video loops in place instead. */
  const [still] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );


  const layer = LAYERS[bg];
  const isVideo = layer.kind === "video";

  const next = useCallback(() => setBg((i) => (i + 1) % LAYERS.length), []);

  /* Hand-over for the two timed backdrops. The video does not appear
     here — it announces its own end through onEnded, which is accurate
     where a timer would only be a guess at the file's length. */
  useEffect(() => {
    if (isVideo || still) return;
    const t = window.setTimeout(next, layer.ms);
    return () => clearTimeout(t);
  }, [bg, isVideo, layer.ms, next, still]);

  /* Volume is set on the element rather than in the markup — React
     would otherwise reset it to the attribute on every render. Muting
     stays an attribute, because it is what lets the video autoplay. */
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.volume = volume;
  }, [volume, bg]);

  /* Sound is on by default, but a browser refuses to autoplay audible
     media until the page has been interacted with — so try it audible
     and fall back to muted when refused. The backdrop still plays
     either way, and the speaker button is right there to turn it on. */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (!isVideo) {
      v.pause();
      return;
    }

    /* Rewound on arrival: the element is never unmounted, so it is
       still sitting on its last frame from the previous rotation. */
    v.currentTime = 0;
    v.play().catch(() => {
      v.muted = true;
      setMuted(true);
      v.play().catch(() => {});
    });
  }, [bg, isVideo]);



  /* Back to frame one, for the reason given at BLANK. */
  useEffect(() => {
    const g = gifRef.current;
    if (!g || layer.id !== "gif" || still) return;
    const real = g.src;
    g.src = BLANK;
    g.src = real;
  }, [bg, layer.id, still]);

  /* The greeting fires this when the visitor declines the playlist.
     It arrives inside that click's call stack, so the user activation
     the first autoplay attempt lacked is present now and this play()
     is allowed to be audible.

     State is set as well as the element: if the backdrop is currently
     the GIF or the still, there is no <video> to unmute yet — this
     makes sure sound is on when they switch back to it. */
  useEffect(() => {
    const on = () => {
      setVolume(1);
      setMuted(false);
      const v = videoRef.current;
      if (!v) return;
      v.volume = 1;
      v.muted = false;
      v.play().catch(() => {});
    };
    window.addEventListener(HERO_SOUND, on);
    return () => window.removeEventListener(HERO_SOUND, on);
  }, []);

  const scrollTo = (sel) => (e) => {
    e.preventDefault();
    document
      .querySelector(sel)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="hero" className="hero-sec-mizu">
      {/* Personal plate. Decorative, and the generated backdrop below
          is switched off with it so the two never stack.

          All three stay mounted and cross-fade on opacity. Rendering
          only the active one would unmount the video on every rotation
          and re-fetch 47 MB when its turn came round, and would leave
          the outgoing backdrop on screen until the incoming file had
          decoded — which reads as a stall, not a cut. */}
      {LAYERS.map((l, i) =>
        l.kind === "video" ? (
          <video
            key={l.id}
            ref={videoRef}
            className={`hero-gif-mizu${i === bg ? " is-on" : ""}`}
            src={l.src}
            muted={muted}
            loop={still}
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
            onEnded={still ? undefined : next}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration) setProgress(v.currentTime / v.duration);
            }}
          />
        ) : (
          <img
            key={l.id}
            ref={l.id === "gif" ? gifRef : undefined}
            className={`hero-gif-mizu${i === bg ? " is-on" : ""}`}
            src={l.src}
            alt=""
            aria-hidden="true"
            decoding="async"
          />
        )
      )}
      <span className="hero-gif-scrim-mizu" aria-hidden="true" />

      {/* Timer along the very bottom edge. */}
      {!still && (
        <div className="hero-rail-mizu" aria-hidden="true">
          <i
            /* Remounted on every hand-over, which is what restarts the
               fill animation — a CSS animation otherwise needs a
               reflow hack to replay. */
            key={bg}
            className={`hero-rail-fill-mizu${isVideo ? " is-live" : ""}`}
            style={
              isVideo
                ? { transform: `scaleX(${progress})` }
                : { "--dur": `${layer.ms}ms` }
            }
          />
        </div>
      )}

      {/* ── Backdrop switch ── */}
      <div className="hero-bg-ctl-mizu">
        <button
          type="button"
          className="hero-bg-btn-mizu"
          onClick={() => setBg((i) => (i + 1) % LAYERS.length)}
          aria-label={`Background: ${layer.label}. Switch to ${LAYERS[(bg + 1) % LAYERS.length].label}.`}
        >
          <LayerIcon kind={layer.id} />
          <span>{layer.label}</span>
        </button>

        {/* Only the video has sound to control. */}
        {layer.sound && (
          <div className="hero-vol-mizu">
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Unmute background" : "Mute background"}
            >
              {muted || volume === 0 ? <IconMute /> : <IconVol />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={muted ? 0 : volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                if (v > 0) setMuted(false);
              }}
              aria-label="Background volume"
            />
          </div>
        )}
      </div>

      {/* Outline mark. Sits after the scrim so it paints over it, and
          the kanji is already in the nav and title, so it is purely a
          device here. */}
      <span className="hero-mark-mizu" aria-hidden="true">
        {PROFILE.kanji}
      </span>

      <span className="hero-fx-mizu" aria-hidden="true">
        <StarField />
        <PerspectiveGrid />
        <Spotlight />
      </span>

      {/* Vertical spine, running up the left margin beside the block.
          A second axis is what stops the hero reading as the usual
          label-name-paragraph stack: the Latin runs across, the
          Japanese runs down, which is how a poster sets both.

          Outside hero-wrap so it is not part of that column's flow —
          the wrap is bottom-aligned, and a flex child here would push
          the copy sideways instead of standing beside it. */}
      <span className="hero-spine-mizu" aria-hidden="true">
        <span className="hero-spine-rule-mizu" />
        <span className="hero-spine-text-mizu">ソフトウェア技術者</span>
      </span>

      <div className="hero-wrap-mizu">
        {/* A numbered readout rather than a tracked line between two
            rules. Same information, but it reads as a spec block: the
            indices give it structure the old strip had to get from
            slashes. Availability is here because it is the one fact a
            hiring manager is looking for, and it was only in the
            contact section. */}
        <div
          className="hero-enter hero-spec-mizu"
          style={{ animationDelay: "0.05s" }}
        >
          {SPEC.map((s, i) => (
            <span key={s} className="hero-spec-row-mizu">
              <span className="hero-spec-no-mizu" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="hero-spec-dash-mizu" aria-hidden="true" />
              <span className="hero-spec-val-mizu">{s}</span>
            </span>
          ))}
        </div>

        <h1
          className="hero-enter hero-name-mizu"
          style={{ animationDelay: "0.20s" }}
        >
          <span className="hero-name-latin-mizu">{PROFILE.name}</span>
          <span className="hero-name-kanji-mizu">{PROFILE.kanji}</span>
        </h1>

        {/* Sits between the name and the tagline so the two read as a
            masthead and its subtitle rather than two stacked lines. */}
        <span
          className="hero-enter hero-name-rule-mizu"
          style={{ animationDelay: "0.26s" }}
          aria-hidden="true"
        />

        <p
          className="hero-enter hero-tagline-mizu"
          style={{ animationDelay: "0.30s" }}
        >
          {PROFILE.tagline}
        </p>

        <p
          className="hero-enter hero-intro-mizu"
          style={{ animationDelay: "0.38s" }}
        >
          {PROFILE.intro}
        </p>

        <div
          className="hero-enter hero-cta-mizu"
          style={{ animationDelay: "0.46s" }}
        >
          <Pill href="#work" solid onClick={scrollTo("#work")}>
            View the work
            <span className="hero-cta-dot-mizu" aria-hidden="true">
              <ArrowIcon />
            </span>
          </Pill>

          <Pill href={PROFILE.contact.github} external>
            <GitHubIcon />
            GitHub
          </Pill>

          {/* Same source as the contact section and the footer — the URL
              is declared once in PROFILE, so all three cannot drift. */}
          <Pill href={PROFILE.contact.linkedin} external>
            <LinkedInIcon />
            LinkedIn
          </Pill>
        </div>
      </div>

      <div className="hero-scroll-mizu" aria-hidden="true">
        <div className="hero-scroll-rule-mizu" />
        <span>Scroll</span>
      </div>
    </section>
  );
}

/* Inline SVG rather than an icon package — three glyphs. */
const I = {
  width: 14,
  height: 14,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};

function LayerIcon({ kind }) {
  if (kind === "video")
    return (
      <svg {...I}>
        <rect x="2" y="5" width="14" height="14" rx="2" />
        <path d="m22 8-6 4 6 4V8z" />
      </svg>
    );
  if (kind === "gif")
    return (
      <svg {...I}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M12 9.5A2.5 2.5 0 1 0 12 15h1.5v-2" />
      </svg>
    );
  return (
    <svg {...I}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m21 16-5-5-5 5-2-2-6 6" />
    </svg>
  );
}

const IconVol = () => (
  <svg {...I}>
    <path d="M11 5 6 9H2v6h4l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
  </svg>
);
const IconMute = () => (
  <svg {...I}>
    <path d="M11 5 6 9H2v6h4l5 4V5z" />
    <path d="m23 9-6 6M17 9l6 6" />
  </svg>
);
