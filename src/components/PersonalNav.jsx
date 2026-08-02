import { useCallback, useEffect, useRef, useState } from "react";
import { PROFILE } from "../data/profile.js";
import { useMode } from "../hooks/useMode.jsx";

/* ══════════════════════════════════════════════════
   Personal nav — floating, draggable, kanji-led.

   Docks to any edge. Left and right render it as a
   vertical column, top and bottom as a row, so it
   always reads along the edge it is sitting on rather
   than sticking out from it.

   Rendered in both modes and hidden with CSS rather
   than swapped in React: the page prerenders in
   personal mode, and mounting the right nav only after
   hydration would flash the wrong one on every load.
   ══════════════════════════════════════════════════ */

const ITEMS = [
  { href: "#about", kanji: "私", label: "About" },
  { href: "#work", kanji: "作", label: "Work" },
  { href: "#experience", kanji: "歴", label: "Experience" },
  { href: "#stack", kanji: "技", label: "Stack" },
  { href: "#hackathons", kanji: "挑", label: "Hackathons" },
  { href: "#certifications", kanji: "証", label: "Certs" },
  { href: "#contact", kanji: "縁", label: "Contact" },
];

const STORE = "mizu-dock";
const THRESHOLD = 6; // px of travel before a press becomes a drag
const PULL_MAX = 62; // how far the rope will stretch
const PULL_TRIP = 26; // how far it has to be pulled to ring

export default function PersonalNav() {
  const { toggle } = useMode();
  const [dock, setDock] = useState({ edge: "right", pos: 50 });
  const [drag, setDrag] = useState(null);
  const [open, setOpen] = useState(false);
  const [pull, setPull] = useState(0);

  const startRef = useRef(null);
  const movedRef = useRef(false);
  const ropeRef = useRef(null);
  const rangRef = useRef(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || "null");
      if (saved?.edge && Number.isFinite(saved.pos)) setDock(saved);
    } catch {
      /* private mode — it just starts on the right */
    }
  }, []);

  const snap = useCallback((x, y) => {
    const { innerWidth: w, innerHeight: h } = window;
    const edges = { left: x, right: w - x, top: y, bottom: h - y };
    const edge = Object.keys(edges).reduce((a, b) =>
      edges[a] <= edges[b] ? a : b,
    );

    /* Clamped well inside the run so the dock can never end up half
       off-screen in a corner, where a vertical column would have no
       room to lay itself out. */
    const along =
      edge === "left" || edge === "right" ? (y / h) * 100 : (x / w) * 100;
    const next = { edge, pos: Math.min(82, Math.max(18, along)) };

    setDock(next);
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    /* Deliberately NOT capturing the pointer here. Capture retargets
       the subsequent click to the capturing element, so a captured nav
       swallows every link click and nothing navigates. Capture is
       taken only once a real drag begins, below. */
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      id: e.pointerId,
      el: e.currentTarget,
    };
    movedRef.current = false;
  };

  const onPointerMove = (e) => {
    const s = startRef.current;
    if (!s) return;

    if (!movedRef.current) {
      if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < THRESHOLD) return;
      movedRef.current = true;
      /* Now it is a drag, so the pointer can be owned — losing the
         click is the intended outcome from here. */
      s.el.setPointerCapture(s.id);
    }

    setDrag({ x: e.clientX, y: e.clientY });
  };

  const onPointerUp = (e) => {
    if (movedRef.current) snap(e.clientX, e.clientY);
    startRef.current = null;
    setDrag(null);
  };

  /* A press that turned into a drag must not also navigate — the click
     fires after pointerup, so the flag is still set when it lands. */
  const onNavigate = (e, href) => {
    if (movedRef.current) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    document
      .querySelector(href)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ── Rope ────────────────────────────────────────
     A suzunoo: pull it and the dock opens. stopPropagation on every
     handler keeps the pull from also dragging the dock, since these
     events would otherwise bubble straight into the drag logic above. */
  const onRopeDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    ropeRef.current = e.clientY;
    rangRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onRopeMove = (e) => {
    if (ropeRef.current == null) return;
    e.stopPropagation();
    setPull(Math.max(0, Math.min(PULL_MAX, e.clientY - ropeRef.current)));
  };

  const onRopeUp = (e) => {
    e.stopPropagation();
    if (ropeRef.current != null && pull >= PULL_TRIP) {
      rangRef.current = true;
      setOpen((o) => !o);
    }
    ropeRef.current = null;
    setPull(0);
  };

  /* Click covers keyboard and any pointer that never travelled. A pull
     that already tripped must not toggle a second time here. */
  const onRopeClick = () => {
    if (rangRef.current) {
      rangRef.current = false;
      return;
    }
    setOpen((o) => !o);
  };

  const style = drag
    ? {
        left: `${drag.x}px`,
        top: `${drag.y}px`,
        right: "auto",
        bottom: "auto",
        transform: "translate(-50%, -50%)",
      }
    : dock.edge === "left" || dock.edge === "right"
      ? { top: `${dock.pos}%`, transform: "translateY(-50%)" }
      : { left: `${dock.pos}%`, transform: "translateX(-50%)" };

  return (
    <nav
      className={`pnav-mizu is-${dock.edge}${drag ? " is-dragging" : ""}${open ? " is-open" : ""}${pull ? " is-pulling" : ""}`}
      style={style}
      aria-label="Primary"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Two nested boxes carrying the same silhouette: the outer is
          the ink, the inner the surface inset by the border width. A
          plain border cannot follow a clip-path — it gets cut away
          with the corners it is meant to draw.

          The clip lives here and not on the <nav>, because clip-path
          also clips absolutely-positioned descendants, and the rope
          hangs outside the box. */}
      <div className="pnav-body-mizu">
        <div className="pnav-face-mizu">
          <span className="pnav-grip-mizu" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>

          <a
            href="#hero"
            className="pnav-brand-mizu"
            onClick={(e) => onNavigate(e, "#hero")}
            aria-label={`${PROFILE.brand} — top`}
          >
            {PROFILE.kanji}
          </a>

          <span className="pnav-rule-mizu" aria-hidden="true" />

          {ITEMS.map((i) => (
            <a
              key={i.href}
              href={i.href}
              className="pnav-item-mizu"
              onClick={(e) => onNavigate(e, i.href)}
            >
              <span className="pnav-kanji-mizu" aria-hidden="true">
                {i.kanji}
              </span>
              <span className="pnav-label-mizu">{i.label}</span>
            </a>
          ))}

          <span className="pnav-rule-mizu" aria-hidden="true" />

          {/* The mode switch lives in the notch bar, which is hidden in
          this mode — without this there is no way back to recruiter. */}
          <button
            type="button"
            className="pnav-item-mizu pnav-mode-mizu"
            onClick={(e) => {
              if (movedRef.current) {
                e.preventDefault();
                return;
              }
              toggle();
            }}
          >
            <span className="pnav-kanji-mizu" aria-hidden="true">
              職
            </span>
            <span className="pnav-label-mizu">Recruiter mode</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        className="pnav-rope-mizu"
        onPointerDown={onRopeDown}
        onPointerMove={onRopeMove}
        onPointerUp={onRopeUp}
        onPointerCancel={onRopeUp}
        onClick={onRopeClick}
        aria-expanded={open}
        aria-label={open ? "Collapse the menu" : "Expand the menu"}
      >
        {/* Stretches with the pull and springs back on release. */}
        <span
          className="pnav-rope-line-mizu"
          style={{ height: `${34 + pull}px` }}
          aria-hidden="true"
        />
        <span className="pnav-rope-bead-mizu" aria-hidden="true" />
      </button>
    </nav>
  );
}
