import { useEffect, useRef, useState } from "react";
import { PROFILE } from "../../data/profile.js";
import { StarField, PerspectiveGrid, Spotlight } from "../shared/Backdrop.jsx";
import { Pill, GitHubIcon, ArrowIcon } from "../shared/primitives.jsx";

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

/* Cycled by the switch at the top-left. Only the first carries sound;
   the other two are silent by nature. */
const LAYERS = [
  {
    id: "video",
    label: "Video",
    kind: "video",
    src: "/profile/herobg.mp4",
    sound: true,
  },
  { id: "gif", label: "GIF", kind: "image", src: "/profile/heropersonal.gif" },
  {
    id: "image",
    label: "Image",
    kind: "image",
    src: "/profile/worksbackground.jpg",
  },
];

export default function Hero() {
  const [bg, setBg] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const videoRef = useRef(null);
  const triedRef = useRef(false);

  const layer = LAYERS[bg];

  /* Volume is set on the element rather than in the markup — React
     would otherwise reset it to the attribute on every render. Muting
     stays an attribute, because it is what lets the video autoplay. */
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.volume = volume;
  }, [volume, bg]);

  /* Sound is on by default, but a browser refuses to autoplay audible
     media until the page has been interacted with. So: try it audible,
     and only if that is refused fall back to muted — the background
     still plays either way, and the speaker button is then sitting
     right there to turn it on. Guarded by a ref so the retry cannot
     re-trigger this effect. */
  useEffect(() => {
    triedRef.current = false;
  }, [bg]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !layer.sound || triedRef.current) return;
    triedRef.current = true;
    v.volume = 1;
    v.muted = false;
    v.play().catch(() => {
      v.muted = true;
      setMuted(true);
      v.play().catch(() => {});
    });
  }, [bg, layer.sound]);

  const scrollTo = (sel) => (e) => {
    e.preventDefault();
    document
      .querySelector(sel)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="hero" className="hero-sec-mizu">
      {/* Personal plate. Decorative, and the generated backdrop below
          is switched off with it so the two never stack. */}
      {layer.kind === "video" ? (
        <video
          /* Keyed on src: without it React reuses the element and only
             swaps the attribute, which leaves the previous frame on
             screen until the new file has buffered. */
          key={layer.src}
          ref={videoRef}
          className="hero-gif-mizu"
          src={layer.src}
          autoPlay
          muted={!layer.sound || muted}
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
        />
      ) : (
        <img
          className="hero-gif-mizu"
          src={layer.src}
          alt=""
          aria-hidden="true"
          decoding="async"
        />
      )}
      <span className="hero-gif-scrim-mizu" aria-hidden="true" />

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

      <div className="hero-wrap-mizu">
        {/* Spec strip — hairline rules + mono tracking, no container */}
        <div
          className="hero-enter hero-strip"
          style={{ animationDelay: "0.05s" }}
        >
          <div className="hero-strip-rule" />
          <div className="hero-strip-row">
            {PROFILE.strip.map((s, i) => (
              <span key={s} style={{ display: "contents" }}>
                {i > 0 && (
                  <span className="hero-strip-slash" aria-hidden="true">
                    ///
                  </span>
                )}
                <span className="hero-strip-primary">{s}</span>
              </span>
            ))}
          </div>
          <div className="hero-strip-rule" />
        </div>

        <h1
          className="hero-enter hero-name-mizu"
          style={{ animationDelay: "0.20s" }}
        >
          <span className="hero-name-latin-mizu">{PROFILE.name}</span>
          <span className="hero-name-kanji-mizu">{PROFILE.kanji}</span>
        </h1>

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
