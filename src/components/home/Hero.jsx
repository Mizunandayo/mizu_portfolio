import { useCallback, useEffect, useRef, useState } from "react";
import { useViews } from '../../data/views.js';
import { PROFILE } from "../../data/profile.js";
import { StarField, PerspectiveGrid, Spotlight } from "../shared/Backdrop.jsx";
import {
  Pill,
  GitHubIcon,
  LinkedInIcon,
  ArrowIcon,
} from "../shared/primitives.jsx";
import { HERO_SOUND } from "../../events.js";
import { greetingPending } from "../../greeting.js";
import { useMode } from "../../hooks/useMode.jsx";
import Presence from "../shared/Presence.jsx";

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

/* The rotation, in order. Each hands over to the next when it ends,
   which is accurate where a timer would only be a guess at the file's
   length. Every layer carries sound, so the volume control is
   unconditional. */
const LAYERS = [
  { id: "one", label: "Video 1", src: "/profile/herobg2.mp4" },
  { id: "two", label: "Video 2", src: "/profile/herobg3.mp4" },
];

/* With nothing to rotate to, the backdrop loops and the switch that
   would have cycled it is not rendered — a control whose only outcome
   is the state you are already in. Derived rather than declared, so
   adding a second entry above brings both back on its own. */
const SINGLE = LAYERS.length < 2;

/* How long a hidden tab may keep playing before the backdrop is stopped.
   Long enough that flicking to another tab and back never interrupts it,
   short enough that a tab nobody returns to stops costing bandwidth. */
const IDLE_STOP = 5 * 60_000;

/* Where the backdrop's sound sits whenever it is turned on, whether on
   load or from the greeting's no-music path. One constant so the two
   cannot drift apart. */
const VOLUME = 0.35;

/* Seconds an arrow key moves the backdrop. Five is what a video player
   conventionally steps by, and it is small enough that holding the key
   scrubs smoothly rather than jumping. */
const SEEK = 5;

/* Role and location come from the strip that was already declared;
   availability is appended rather than hardcoded, so the hero and the
   contact card cannot end up disagreeing about it. */
/* Blank entries dropped: availability.status is empty, and an index
   with a rule and nothing after it reads as a missing row rather than a
   deliberate one. The live count takes that slot instead. */
const SPEC = [...PROFILE.strip, PROFILE.availability.status].filter(Boolean);


export default function Hero() {
  const { isRecruiter } = useMode();
  const views = useViews();
  const [bg, setBg] = useState(0);
  /* Hold on the clip that is showing instead of handing over when it
     ends. Off by default, so the backdrop still rotates unless asked
     not to. */
  const [hold, setHold] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(VOLUME);
  const [progress, setProgress] = useState(0);
  /* One ref per layer, not one shared ref. A single ref assigned inside
     the map would be claimed by whichever element rendered last, so
     every play, pause and volume change would land on the wrong video
     the moment there was more than one. */
  const vids = useRef([]);
  const active = () => vids.current[bg] ?? null;

  /* Read once. An auto-rotating backdrop is exactly the kind of motion
     this setting is asking to be spared, so the rotation stops and the
     video loops in place instead. */
  const [still] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );


  const layer = LAYERS[bg];

  /* Three ways to end up looping: nothing to hand over to, reduced
     motion, or the visitor asked for it. They behave identically, so
     the element reads one value rather than three conditions. */
  const looping = SINGLE || still || hold;

  const next = useCallback(() => setBg((i) => (i + 1) % LAYERS.length), []);

  /* Volume is set on the element rather than in the markup — React
     would otherwise reset it to the attribute on every render. Muting
     stays an attribute, because it is what lets the video autoplay. */
  useEffect(() => {
    const v = active();
    if (v) v.volume = volume;
  }, [volume, bg]);

  /* Silent while the greeting is still to come. It covers the hero and
     offers a playlist of its own, so a backdrop talking underneath it
     is two soundtracks at once. Declining the playlist fires HERO_SOUND
     below and hands the sound back.

     Set on the elements as well as in state: the play() below runs in
     this same commit, before React has re-rendered with the new
     attribute, so state alone would let a moment of audio through.
     Deliberately not the initial useState value either — the hero is
     prerendered, and a first render that disagrees with the server's is
     a hydration mismatch. */
  useEffect(() => {
    if (!greetingPending()) return;
    setMuted(true);
    vids.current.forEach((v) => {
      if (v) v.muted = true;
    });
  }, []);

  /* Sound is on by default, but a browser refuses to autoplay audible
     media until the page has been interacted with — so try it audible
     and fall back to muted when refused. The backdrop still plays
     either way, and the speaker button is right there to turn it on. */
  useEffect(() => {
    /* Everything that is not on screen is stopped and rewound. They all
       stay mounted so a file is never re-fetched, but a hidden video
       left running would arrive part-way through when its turn came. */
    vids.current.forEach((v, i) => {
      if (!v || i === bg) return;
      v.pause();
      v.currentTime = 0;
    });

    const v = active();
    if (!v) return;

    v.currentTime = 0;
    v.play().catch(() => {
      v.muted = true;
      setMuted(true);
      v.play().catch(() => {});
    });
  }, [bg]);

  /* Recruiter mode hides the plate — and `display: none` does not stop
     a <video>. It carries on playing and, more to the point, carries on
     making sound, while the volume control that could have silenced it
     is hidden by the same switch. Pausing rather than muting: a hidden
     video is decoding frames nobody is watching either.

     Nothing is done to `muted`, so coming back to personal mode
     resumes at whatever the visitor had chosen before they left. */
  useEffect(() => {
    if (isRecruiter) {
      vids.current.forEach((v) => v?.pause());
      return;
    }
    active()?.play().catch(() => {});
  }, [isRecruiter]);

  /* A hidden tab keeps playing, which is what a backdrop with sound
     should do when you flick away for a moment and come back.

     The cap is for the tab nobody returns to. Browsers keep media running
     in the background, so a forgotten page goes on rotating between the
     clips for hours, and at 36 MB of video that was a month of bandwidth
     in a single day. The clips are cached now, so a rotation costs
     nothing after the first fetch, and this stops them anyway once the
     tab has been out of sight for IDLE_STOP.

     Resumes only if it was actually playing: the visitor may have paused
     it with the spacebar before switching away. */
  useEffect(() => {
    if (isRecruiter) return

    let timer = 0;
    let resume = false;

    const onVisibility = () => {
      const v = active();
      if (!v) return;

      if (document.hidden) {
        timer = window.setTimeout(() => {
          resume = !v.paused;
          v.pause();
        }, IDLE_STOP);
        return;
      }

      window.clearTimeout(timer);
      if (resume) {
        resume = false;
        v.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isRecruiter, bg]);

  /* The greeting fires this when the visitor declines the playlist.
     It arrives inside that click's call stack, so the user activation
     the first autoplay attempt lacked is present now and this play()
     is allowed to be audible.

     State is set as well as the element, so the setting survives a
     switch to the other backdrop.

     `bg` has to be in the deps because `active` closes over it. With an
     empty array the listener kept the first render's copy forever and
     always handed the sound to layer 0. Decline the playlist after the
     clips had swapped and it unmuted the one on screen, then called
     play() on the one before it, which the swap had already rewound to
     zero: two soundtracks, one of them starting over. */
  useEffect(() => {
    const on = () => {
      setVolume(VOLUME);
      setMuted(false);

      vids.current.forEach((v, i) => {
        if (!v || i === bg) return;
        v.pause();
      });

      const v = active();
      if (!v) return;
      v.volume = VOLUME;
      v.muted = false;
      v.play().catch(() => {});
    };
    window.addEventListener(HERO_SOUND, on);
    return () => window.removeEventListener(HERO_SOUND, on);
  }, [bg]);

  /* Space pauses and resumes the backdrop; the arrows scrub it.

     Heavily guarded, because none of these are free keys: space scrolls
     the page and activates whatever button or link has focus, the
     arrows scroll it too, move the caret in a field, and step the
     volume slider when that has focus. So they are only claimed when
     nothing else has a claim on them — no field or control focused, no
     dialog holding the keyboard, the hero actually on screen, and
     personal mode, where the backdrop exists at all. preventDefault
     runs only after all of that passes, so a press this ignores still
     does whatever it normally would. */
  useEffect(() => {
    if (isRecruiter) return;

    const onKey = (e) => {
      const seek =
        e.code === "ArrowLeft" ? -SEEK : e.code === "ArrowRight" ? SEEK : 0;
      const toggle = e.code === "Space";
      if (!toggle && !seek) return;
      /* Holding an arrow to scrub is the point; holding space would
         just flap the video between paused and playing. */
      if (toggle && e.repeat) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      const t = e.target;
      if (
        t instanceof HTMLElement &&
        (t.isContentEditable ||
          t.closest('input, textarea, select, button, a[href], [role="button"]'))
      ) {
        return;
      }

      /* The greeting, the ticket editor and the lightbox are all
         dialogs; whichever is up owns the keyboard. */
      if (document.querySelector("dialog[open]")) return;

      /* Off screen, the only thing this key would do is swallow a
         scroll to stop a video nobody is looking at. */
      const r = document.getElementById("hero")?.getBoundingClientRect();
      if (!r || r.bottom <= 0 || r.top >= window.innerHeight) return;

      const v = active();
      if (!v) return;

      e.preventDefault();

      if (toggle) {
        if (v.paused) v.play().catch(() => {});
        else v.pause();
        return;
      }

      /* duration is NaN until metadata lands, so the ceiling is only
         applied once there is one to apply. */
      const at = v.currentTime + seek;
      v.currentTime = Math.max(
        0,
        Number.isFinite(v.duration) ? Math.min(at, v.duration) : at
      );
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRecruiter, bg]);

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

          Every layer stays mounted and they cross-fade on opacity.
          Rendering only the active one would unmount the video on each
          hand-over and re-fetch it when its turn came round again, and
          would leave the outgoing backdrop on screen until the incoming
          file had decoded — which reads as a stall, not a cut. */}
      {LAYERS.map((l, i) => (
        <video
          key={l.id}
          ref={(el) => { vids.current[i] = el; }}
          className={`hero-gif-mizu${i === bg ? " is-on" : ""}`}
          src={l.src}
          /* Only the layer on screen may ever be audible. `muted` is one
             piece of state across every element, so lifting it unmuted
             all of them at once and left the others one stray play()
             away from being heard. */
          muted={i === bg ? muted : true}
          loop={looping}
          playsInline
          /* Only the one on screen is worth the bandwidth up front; any
             others trickle in behind it, which matters at 40 MB a file. */
          preload={i === bg ? "auto" : "metadata"}
          aria-hidden="true"
          tabIndex={-1}
          /* A looping element never fires this, so the hand-over is
             wired up only when the clip is going to end. */
          onEnded={looping ? undefined : next}
          onTimeUpdate={
            i === bg
              ? (e) => {
                  const v = e.currentTarget;
                  if (v.duration) setProgress(v.currentTime / v.duration);
                }
              : undefined
          }
        />
      ))}
      <span className="hero-gif-scrim-mizu" aria-hidden="true" />

      {/* Timer along the very bottom edge. */}
      {!still && (
        <div className="hero-rail-mizu" aria-hidden="true">
          <i
            /* Remounted on every hand-over, which is what restarts the
               fill animation — a CSS animation otherwise needs a
               reflow hack to replay. */
            key={bg}
            className="hero-rail-fill-mizu is-live"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      )}

      {/* ── Backdrop switch ── */}
      <div className="hero-bg-ctl-mizu">
        {!SINGLE && (
          <button
            type="button"
            className="hero-bg-btn-mizu"
            onClick={() => setBg((i) => (i + 1) % LAYERS.length)}
            aria-label={`Background: ${layer.label}. Switch to ${LAYERS[(bg + 1) % LAYERS.length].label}.`}
          >
            <LayerIcon />
            <span>{layer.label}</span>
          </button>
        )}

        {/* Only worth offering when there is a hand-over to suppress —
            a single clip already loops, and so does reduced motion. */}
        {!SINGLE && !still && (
          <button
            type="button"
            className={`hero-bg-btn-mizu hero-loop-mizu${hold ? " is-on" : ""}`}
            onClick={() => setHold((v) => !v)}
            aria-pressed={hold}
            aria-label={
              hold
                ? "Looping this backdrop. Let it move on instead."
                : "Loop this backdrop instead of moving on."
            }
          >
            <LoopIcon />
          </button>
        )}

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
              /* The filled part of the track is drawn from this, since a
                 range input gives CSS no handle on its own value. */
              style={{ "--vol": muted ? 0 : volume }}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                if (v > 0) setMuted(false);
              }}
            aria-label="Background volume"
          />
        </div>
      </div>














      

      {/* Outline mark. Sits after the scrim so it paints over it, and
          the kanji is already in the nav and title, so it is purely a
          device here. 
      <span className="hero-mark-mizu" aria-hidden="true">
        {PROFILE.kanji}
      </span>*/}












      

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

          {/* Held back until the count comes back. A row that appears
              saying nothing and then fills in is worse than one that
              arrives already true. */}
          {views !== null && (
            <span className="hero-spec-row-mizu">
              <span className="hero-spec-no-mizu" aria-hidden="true">
                {String(SPEC.length + 1).padStart(2, "0")}
              </span>
              <span className="hero-spec-dash-mizu" aria-hidden="true" />
              <span className="hero-spec-val-mizu is-views">
                <EyeIcon />
                {views.toLocaleString()} total {views === 1 ? "view" : "views"}
              </span>
            </span>
          )}
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

        {/* Inside the copy column, not beside it. On a desktop it is
            absolutely positioned and lands in the same corner either
            way; below 1000px it drops into the flow, and being in this
            column is what lines it up with the copy — as a sibling its
            left edge tracked the section padding instead, which differs
            from the copy's by the width of the spine. */}
        <Presence />
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

/* Sized in em so it tracks the row's own font-size rather than needing
   a second number to keep in step with it.

   Filled, not stroked, so `fill` carries the colour and there is no
   stroke to inherit — the source had both set to a hard #ffffff, which
   would have ignored the row and thickened every edge by half a unit.

   The iris reads as a ring because the first path's second subpath
   winds against the first and knocks a hole through it. That only
   works while the two stay in one <path> under the default nonzero
   fill rule; split them and the eye fills in solid.

   The viewBox is cropped to the artwork. As authored the eye occupies
   the middle half of a 490-square box and the rest is empty, so the
   icon was drawing a 7px eye and centring it in dead space — most of
   why it read as cramped. */
const EyeIcon = () => (
  <svg
    width="1.5em" height="0.75em" viewBox="0 123.7 490 242.6"
    fill="currentColor" aria-hidden="true"
  >
    <path d="M245,123.7c-91.8,0-178.5,42.8-245,121.3c66.5,78.6,153.2,121.3,245,121.3S423.5,323.2,490,245 C423.5,166.4,336.8,123.7,245,123.7z M245,347.3c-56.4,0-102.3-45.9-102.3-102.3S188.6,142.7,245,142.7S347.3,188.6,347.3,245 S301.4,347.3,245,347.3z" />
    <path d="M245,162.6c-45.5,0-82.4,36.9-82.4,82.4s36.9,82.4,82.4,82.4s82.4-36.9,82.4-82.4S290.5,162.6,245,162.6z" />
  </svg>
);

const LayerIcon = () => (
  <svg {...I}>
    <rect x="2" y="5" width="14" height="14" rx="2" />
    <path d="m22 8-6 4 6 4V8z" />
  </svg>
);

const LoopIcon = () => (
  <svg {...I}>
    <path d="m17 2 4 4-4 4" />
    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
    <path d="m7 22-4-4 4-4" />
    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
  </svg>
);

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
