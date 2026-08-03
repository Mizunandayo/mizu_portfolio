# Mizu 水 — Portfolio Blueprint

**Owner:** Francis Daniel Genese
**Status:** Built and shipping. Build passes, 2 routes prerendered, dual presentation modes.
Personal mode now opens with a greeting ticket the visitor can put their name on, decorate with
stickers and download as a PNG (§7.3).
**Date:** 2026-08-03

---

## 1. What this is

A personal engineering portfolio for Francis Daniel Genese, built in the visual language of
[mitsu-site](../mitsu/mitsu-site/) — the Swiss-industrial dark deck used for the OpenAI Build Week
submission — but scaled from one project to nine, and then given a second, Japanese-typographic
presentation layered on top of it.

**Name:** `Mizu` (水, water). It is the house mark for a family of projects that all flow from it —
**Mi**tsu, **Mi**nari, **Mi**saki, **Mi**rai, **Mi**wa — and matches the existing GitHub handle
`Mizunandayo`.

**Target:** software engineering roles. Not AI research roles — the AI work is evidence of range,
not the pitch.

---

## 2. Decisions locked

| # | Decision | Choice | Why |
|---|---|---|---|
| 1 | Structure | One page. Projects and hackathons open as **dialogs** | No standalone case-study routes. A card click never leaves the page |
| 2 | Presentation | **Two modes** — Personal and Recruiter — over one DOM | §4. The Japanese layer is expressive; a hiring manager gets the plain version |
| 3 | Stack | Vite 5 + React 18 + Tailwind 3 + react-router-dom, prerendered | Mitsu's CSS transfers 1:1; prerender buys real SEO without a framework change |
| 4 | Media | Placeholder-first | Ships today, sharpens as assets land |

**Explicitly not doing:** Next.js, Astro, a CMS, a light theme, blog, analytics dashboard, a
JS animation library (Framer Motion / GSAP / three.js all declined — see §3.9).

**No résumé PDF.** The portfolio *is* the résumé — no "Download CV" button anywhere. This raises the
bar on Certifications and Contact: they carry everything a recruiter would otherwise open a PDF to
find (credential IDs, dates, education, availability).

**Case-study pages were removed.** `pages/Project.jsx`, `deck/DeckHero.jsx` and `deck/blocks.jsx` are
gone; prerender dropped from 10 routes to 2. Consequence to be aware of: the `highlights` and
`architecture` fields in `projects.js` are **no longer rendered anywhere**, and there are no
shareable per-project URLs.

---

## 3. Design system

### 3.1 Canvas & texture

```
body            #050505
section-alt     #070707        alternating bands
grain           fixed SVG fractalNoise, baseFrequency 0.9, numOctaves 4
                opacity 0.022, z-index 9999, pointer-events none, never scrolls
scrollbar       4px, rgba(255,255,255,0.14), transparent track
scrollbar-gutter: stable on <html>   ← see §4.3
```

### 3.2 Type

| Role | Family | Weights |
|---|---|---|
| Body / UI | Poppins | 400 500 600 700 800 |
| Display wordmark | Outfit | 700 800 900 |
| **Japanese + display serif** | **Shippori Mincho** | **500 800** |
| Labels, specs, data strips | SF Mono → Cascadia Code → JetBrains Mono → ui-monospace | 600 |

Scale is fluid throughout — `clamp()` on every display size, never fixed px for headlines.

**Shippori Mincho** carries the entire Japanese layer: every kanji and kana, plus the oversized Latin
display words (`WORKS`, section claims in personal mode). Google serves CJK families in unicode-range
chunks, so only the blocks containing glyphs actually used are downloaded — the full face is never
fetched.

### 3.3 Colour

Near-monochrome. White and zinc at varying alpha carry the entire interface.

```
text primary     rgba(250,250,250,0.96)
text body        rgba(212,212,216,0.84)
text muted       rgba(161,161,170,0.85)
surface          rgba(255,255,255,0.03)
border hairline  rgba(163,163,163,0.22)
border hover     rgba(212,212,216,0.38)
```

**Accent discipline.** Colour is never decorative. Three carve-outs, all deliberate:

| Where | What | Why |
|---|---|---|
| Architecture diagrams | cyan / emerald / violet / blue stage accents | Encodes pipeline meaning |
| Technology icons | Real brand hex (§3.6) | A grey Python is harder to scan, not cleaner |
| Boot glitch (retired), hover glitch (retired) | magenta / cyan chromatic split | Both removed at request; noted so the rule isn't re-litigated |

**Projects do not get colours.** They get typography and a kanji glyph.

### 3.4 Motion

```
easing          cubic-bezier(0.16, 1, 0.3, 1)     — the house curve
reveal          opacity 0→1, translateY(24px)→0, 700ms
stagger         reveal-d1..d6 = 80ms increments
```

**Two deliberate departures from the house curve**, both for the same reason: the curve covers most
of its distance in the first third, which reads as *settling*. Anything representing work in progress
must be `linear` or it reads as stalling.

- Boot scan beam + its reveal clip — `1.9s linear`
- Boot backdrop fade — `620ms linear`

`<Reveal>` is `IntersectionObserver`, `unobserve` after first fire. No animation library.

### 3.5 Japanese layer techniques

The patterns that recur across the personal-mode sections. Worth knowing before touching any of them.

**Tategaki (vertical writing)** — `writing-mode: vertical-rl` **plus** `text-orientation: upright`.
Without the second, the line is merely rotated on its side and reads as turned Latin text rather than
Japanese typesetting.

**Silhouettes that carry a border** — `clip-path` cuts away the very corners a `border` is meant to
draw. Any shaped panel is therefore **two nested boxes sharing one clip**: outer is the ink with 1–2px
padding, inner is the surface. Used by the ofuda talismans (§6.7) and the floating dock (§5.2).

**Outlined type** — `color: transparent` + `-webkit-text-stroke`, always with an `@supports` fallback
to a faint solid fill. Without the fallback an unsupported browser renders *nothing*, not a degraded
version.

**Distance measured against a container** — `container-type: size` on the parent, then `cqh` units.
A percentage translate resolves against the element's own box, which for a glyph means its font size,
not the card. Used by the work-card hover glyph (`translateY(-35cqh)`).

### 3.6 Technology icons

Brand marks are generated from `simple-icons` (a **devDependency**) into
[src/data/icons.js](src/data/icons.js) by [scripts/gen-icons.mjs](scripts/gen-icons.mjs). Nothing from
the package reaches the runtime bundle — only the path strings actually rendered.

```
npm run icons                  # all stack categories
node scripts/find-slug.mjs redis postgres   # look up a slug before mapping it
```

Icons carry their real brand colour, corrected against `#050505`:

| Case | Treatment |
|---|---|
| Contrast ≥ 3.6:1 already | Brand hex untouched |
| Dark but saturated | Hue + saturation held, **lightness raised** until it clears 3.6:1 |
| Achromatic (black / white / grey) | Rendered `#E4E4E7` — no hue to preserve |

Names with no mark in `simple-icons` fall back to a **stroked category glyph** in neutral zinc — it
denotes a kind of thing, not a brand, and inventing a colour would imply one that doesn't exist.

Adding a technology: add to `stack.js`, map in `NAME_TO_SLUG`, run `npm run icons`. An unmapped name
is reported by the generator rather than silently rendering blank.

### 3.7 Code conventions

- **Data-driven sections.** `const ITEMS = [...]`, then map. No hand-repeated JSX.
- **Namespaced CSS.** `-mizu` suffix on every custom class. Per-section prefixes: `wk-` work,
  `hk-`/`hack-` hackathons, `mg-` certifications, `tn-` stack, `kj-` experience, `pnav-` dock,
  `brk-` section breaks, `boot-` loader.
- **Classes, not inline styles, for anything a mode overrides.** See §3.8 — this is load-bearing.
- **JSX, not TSX.**

### 3.8 The inline-style trap

**An inline `style={{}}` cannot be overridden by a class.** Four sections had to be rebuilt off
`SectionShell` because the shell writes its heading type inline, making a mincho headline impossible
through it: **Work, Certifications, Hackathons, Stack, Experience** now compose their own headers.
`SectionShell` survives but is no longer used by any section.

Tailwind utilities for layout are fine. Inline styles are fine for values nothing needs to re-set
(per-element `animationDelay`, one-off aspect ratios).

### 3.9 Dependencies declined

The runtime dependency list is **react, react-dom, react-router-dom**. Three requested components were
rebuilt rather than installed:

| Wanted | Would have cost | Built instead |
|---|---|---|
| Aceternity `CanvasRevealEffect` | three.js + @react-three/fiber + motion ≈ 220 KB gz | 2D canvas dot matrix, **1 KB** |
| Framer Motion (`AnimatePresence`) | ~50 KB gz | CSS transitions |
| Voice narration engine | — | Built, then removed at request |

---

## 4. The two modes

One set of content, two presentations. **This is the central architectural decision of the site.**

### 4.1 How it works

A single class on `<html>`:

```
personal   (no class)        ← the base. Japanese layer, loader, ambient media
recruiter  .mode-recruiter   ← overrides only
```

Recruiter mode is **overrides, never a second DOM**. Both modes render byte-identical markup — same 9
work cards, 9 hackathons, 11 certs, 120 stack items, same headings. Nothing can drift between them,
and there is no second tree to keep in sync. Verified: the override block injects no `content:` text
anywhere.

### 4.2 No flash of the wrong mode

The page prerenders in personal mode, so a recruiter-mode visitor would otherwise watch the full
Japanese layout paint and then collapse on hydration. An inline script in `<head>` — **before the
stylesheet** — reads `localStorage` and applies the class pre-paint. `useMode` then *adopts* what is
already on `<html>` rather than overwriting it. Both storage calls are wrapped for private browsing.

Where two components genuinely differ (the two navs), **both mount and CSS picks one**. A React swap
would flash the wrong one on every load.

### 4.3 What recruiter mode drops

| Section | Personal | Recruiter |
|---|---|---|
| Boot | 3.45s scan sequence | **skipped entirely** |
| Nav | Floating kanji dock | Notch navbar |
| Hero | `heropersonal.gif`, bottom-left block, mincho name, outline 水 | Centred column on the generated backdrop |
| About | Photographic 死/生活 plate | Flat band |
| Work | Torii, 作品 masthead, giant `WORKS`, hover kanji veil | Plain grid |
| Experience | Kakejiku scrolls, 職歴/学歴 | Original two-panel layout |
| Stack | Tansu drawers, kanji plates, drawer notes hidden | Original grouped list, notes shown |
| Hackathons | Katana spine, two year columns | Single column, newest first |
| Certifications | Manga page, ofuda talismans | Plain card grid |
| Contact | Looping video + frosted panel | Flat band |
| Section breaks | 6 full-bleed banners | **hidden** |

Hiding the banners is not only visual: a lazy-loaded image inside `display: none` is **never
fetched**, so recruiter mode also spares the ~4.6 MB those two GIFs weigh.

`scrollbar-gutter: stable` on `<html>` exists because the boot overlay locks scroll with
`overflow: hidden`, which removes the scrollbar and slides every centred element sideways when it
releases.

### 4.4 Reaching the toggle

Three places, because each mode hides the other's nav:

- Segmented **Personal / Recruiter** switch in the notch bar (recruiter)
- Same switch inside the burger menu below 900px
- **職** button at the foot of the floating dock (personal)

Without the third, personal mode is a one-way door.

---

## 5. Navigation

### 5.1 Notch navbar — recruiter mode

Ported from the vengenceui NotchNavbar. Two 40px side rails and a 64px centre block joined by 50px
corner slices whose `clip-path` curves between the heights. `display: none` by default, `display: flex`
under `.mode-recruiter` — **flex, not block**, or the rails collapse.

### 5.2 Floating dock — personal mode

A draggable kanji dock. Docks to any of the four edges; left/right render it as a column, top/bottom
as a row, so it always reads *along* the edge it is parked on.

```
私 About    作 Work    歴 Experience    技 Stack
挑 Hackathons    証 Certs    縁 Contact    職 Recruiter mode
```

**Silhouette:** top corners sweep up to points with the edge dipping between them — a kawara roof.
Foot chamfered. Nothing on it is a radius. The clip lives on an inner body/face pair, **not the nav**,
because clip-path would otherwise cut away the rope hanging outside the box.

**Drag:** 6px of travel before a press becomes a drag. Pointer capture is taken **only after** that
threshold — capturing on pointerdown retargets the click to the nav and silently swallows every link.
On release it snaps to the nearest edge, clamped to 18–82% along the run. Position persists.

**Rope (suzunoo):** twisted via a −62° repeating gradient on a 6px strip, with a knot and a masked
tassel. Pull ≥26px to toggle the dock open; it stretches to 62px and springs back. Every rope handler
calls `stopPropagation` or the pull drags the whole dock instead.

**Opened:** items animate 34px → **172px**, a *fixed* target — neither `auto` nor `%` is interpolable,
and either makes the dock jump open instead of sliding. Labels are absolute tooltips when closed and
inline when open; `position` can't animate, so the fade is delayed 170ms on open and runs immediately
on close.

---

## 6. Home page

Section order, with the six full-bleed 3:1 banners between them:

```
Hero → [break] → About → [break] → Work → [break] → Experience → [break]
     → Stack → [break] → Hackathons → [break] → Certifications → Contact
```

### 6.0 Boot sequence — personal mode only

`水` renders twice, stacked: a `-webkit-text-stroke` wireframe and a solid copy clipped to whatever a
beam has passed over. As the beam travels top to bottom the outline resolves into solid type in its
wake — glyph and ミズ both.

```
0.25s   beam enters, scan begins        beam + reveal share 1.9s linear — identical
2.15s   scan completes, mark blooms      duration and delay, so the reveal edge can
2.55s   mark fades                       never separate from the light causing it
2.75s   backdrop fades (620ms linear)
3.45s   overlay removed, scroll unlocked
```

The two fades **overlap by 100ms** on purpose. Back to back they left ~450ms of empty black between
the mark leaving and the page arriving, which read as a second, blank hero.

Everything is CSS animation, so the prerendered HTML shows the loader before a line of JS runs and it
still clears itself if the bundle never arrives. `z-index: 9998` — under the grain, so the loader
wears the same film as the site.

**Scroll unlock runs on the timer, not effect cleanup.** `Boot` returns `null` when finished but is
never unmounted — `App` renders it for the life of the page — so cleanup would never fire and `<html>`
would keep `overflow: hidden` forever. This was a real bug.

There is **no progress bar**. The rail under ミズ was removed: the scan beam already communicates
that something is happening, and a second indicator was claiming to measure a fixed 3.45s timeline it
had no information about.

### 6.1 Hero

The whole block sits **bottom-left**, name in mincho, 水 as an outline mark centred on the right half
(`left: 74%`, `clamp(10rem, 34vw, 31rem)`). The generated backdrop (StarField / PerspectiveGrid /
Spotlight) switches off so the two never stack. CTAs are View the work · GitHub · LinkedIn, all three
reading their URLs from `PROFILE.contact`.

Scrim is weighted, not flat — bottom to 94%, left to 88%, falling away toward the top-right. A wash
heavy enough for the copy would kill the plate everywhere else.

**Backdrop rotation.** Three layers hand over to each other in a loop:

| Layer | Source | Ends after |
|---|---|---|
| Video | `herobg2.mp4` | its own `onEnded` |
| Image | `bgheroes.png` | 6000 ms |
| GIF | `heropersonal.gif` | 8400 ms — `GIF_LOOP × 3` |

The video announces its own end rather than running a timer, which would only be a guess at the
file's length. The GIF cannot: **nothing in the DOM reports a GIF's animation** — no event, no
property, not even a frame count — so `GIF_LOOP = 2800` is measured from the file itself (42 frames,
280 centiseconds summed from its Graphic Control Extensions) and the hold is written as `× 3` so a
re-export keeps landing on a loop boundary.

**All three stay mounted** and cross-fade on opacity. Rendering only the active one would unmount the
video every rotation and re-fetch it when its turn came round, and would leave the outgoing backdrop
on screen until the incoming file decoded — which reads as a stall, not a cut.

Two consequences of that:

- The video is **rewound on arrival** (`currentTime = 0`), because it is still sitting on its last
  frame from the previous pass.
- A hidden GIF **keeps animating**, so by its next turn it would be mid-loop. It is reset by
  assigning a blank data-URI then the original `src` back — a different value forces a fresh decode
  from frame one, served from cache rather than the network.

**Timer rail** along the very bottom edge, above the scrim. It works two ways on purpose: the image
and GIF run a CSS animation over their fixed duration, but the video's bar tracks real playback
position, because a large file stalls to buffer and a timed bar would march on while the picture sat
still. Hidden in recruiter mode. Under `prefers-reduced-motion` the rotation stops entirely and the
video loops in place.

**Manual switch** at the top-left cycles the same three layers, with a speaker toggle and a volume
slider beside it when the video is showing. The slider folds to `width: 0` and opens on `:hover`
**and `:focus-within`** — without the second it collapses the instant a keyboard user tabs into it.

**Sound** starts on and at full volume, but a browser refuses to autoplay audible media before the
page has been interacted with, so the first attempt is made audible and falls back to muted when
refused. See §7.2 for how the greeting hands the sound back.

**Trap:** `.hero-strip` centres itself with `margin: 0 auto`, and auto margins **beat** the flex
container's `align-items: flex-start`. Zeroing them is what actually moves it left.

### 6.2 About

Portrait cut-out on a photographic plate (`aboutbg.jpg`, a hard diagonal 死/生活 split). The plate sits
under **two** scrims: a flat 80% wash plus a radial pool to 88% centred where the copy lands. Net
~20% at the edges, ~7% behind the text. Content needs an explicit `z-index: 1` — the backdrop is a
`::before`, which paints after its parent.

### 6.3 Work — poster spread under a torii

Masthead is `rule + label / 作品 / label + rule`. Nine tall plates in three columns. Giant `WORKS`
below, then the lede.

**The torii** is two pieces, deliberately: an **SVG head** (kasagi, shimaki, nuki, gakuzuka) plus
**two CSS rules** continuing the pillars to the floor. One stretched SVG over a grid this tall would
flatten the beams into flat lines. Pillar x-positions live in a single `PILLAR` constant shared by
both. Strokes use `vector-effect="non-scaling-stroke"` or the gate thickens to a slab on a wide
viewport.

**Cards** are levitating slabs: no border, square corners, `#0d0d0d`, three stacked downward shadows
(4px contact / 16px mid / 36px diffuse), lifting to 6px on hover. Row gap runs **deeper** than the
column gap because the cast falls ~100px and a tight row slices it into a hard line.

**Hover:** content blurs back behind a tinted veil and the project's kanji falls from `-35cqh` to
centre. The tint is doing real work — three covers are near-white, and blur alone doesn't darken.

### 6.4 Experience — kakejiku

Each record hangs as a scroll: cord with a hook, top roller, paper, weighted bottom roller, heading
headed **履歴** (record), each scroll titled down its right edge in tategaki — **職歴** work history, **学歴** education. Rollers
**overhang the paper by 13px each side** — without that it reads as a bordered card, not something
wound on a rod.

The `org-*` panel markup inside is untouched. The scroll is a frame *around* the original, so
recruiter mode only drops the frame with nothing to restyle back.

### 6.5 Stack — tansu

Headed **道具箱** (toolbox). Eleven categories become eleven **drawers**: ink label plate with tategaki kanji, drawer face with the
tools, sunken metal pull, faint grain. A stack of drawers is the one Japanese object that already
means what the section means.

```
言語 Languages   知能 AI & Agents   演算 GPU   音声 Speech   視覚 Vision
採取 Web Data    表 Frontend        裏 Backend  基盤 Data     守護 Security   道具 Tooling
```

**表 / 裏** — face and reverse — for frontend and backend is the pairing the set is built around.
Drawers butt against each other sharing one hairline, with a single border around the carcase; a gap
would read as eleven boxes rather than one chest.

Category notes are **hidden in personal mode** — a wrapped paragraph in a 132px column stretched every
drawer to the height of its own description. Recruiter mode restores them.

### 6.6 Hackathons — katana spine

Headed **挑戦** (challenge). Two year columns flanking a centre spine, oldest on the left. The spine is **sticky**, so it rides
down the middle as the columns scroll.

**The katana** replaces the old ハッカソン tategaki. It turns to face the direction of travel —
`rotate(180deg)` over 560ms when you scroll up — and throws wind only while the page is moving.

**The wind splits at the point.** The container is a zero-size point at the tip; every streak starts
stacked there and is thrown outward by its own `--dx` / `--rot`, widest and sharpest at the outside
(±28px @ ±18°), longest through the middle (55px). `transform-origin: bottom center` so the fan hinges
at the tip rather than swinging about each line's middle.

```
scroll direction    rAF-throttled, passive listener, 5px slack
                    (without the slack, trackpad jitter flips the blade continuously)
```

### 6.7 Certifications — manga page

A framed sheet with 4px screentone, a saw-tooth strip biting the top-left, radial speed lines behind
the title, `CERTIFIED` with a hard 4px offset shadow (no blur — blur reads as glow; manga logos are
*trapped*), 認定証 beneath, folio 全11枚 at the foot.

Each credential is an **ofuda** — the pointed paper talisman: notched head via clip-path, ink border
from the nested-box technique, 認定 down the left edge in tategaki, 証 seal stamped bottom-right at
−7° because a hand-pressed seal never lands straight. All eleven identical in size.

### 6.8 Contact

A looping `contactsection.mp4` behind the closing panel. The panel's own fill is a white gradient at
4%/1%/2%, so the video reads straight through it — rather than making it opaque, it carries
`backdrop-filter: blur(14px)`, leaving the video sharp *around* the panel and soft *under* the copy.
Reduced motion hides the video outright.

### 6.9 Section breaks

Six full-bleed 3:1 bands, mapped by filename to the gap they sit in. `object-fit: cover` rather than
stretch, height capped at `clamp(190px, 30vh, 430px)` — unbounded 3:1 is 850px tall on a 2560px
display. All lazy, `aria-hidden`, empty alt.

**Three of the six are not 3:1** and crop accordingly: `betweenheroandabout` (2.67:1, ~11%),
`betweenworksandexperience` (2.02:1, ~33%), `betweenhackathonsandcert` (1.78:1, ~41%).

---

## 7. Dialogs

Every one uses native `<dialog>` + `showModal()` — real focus trapping, ESC, top-layer stacking,
inert background, **no z-index anywhere**. The greeting can open the ticket editor, which can open the
sticker sheet: three modal dialogs deep, stacked by the browser in open order. Hand-managed
z-indexes would be a guess that eventually loses.

### 7.1 Project and hackathon dialogs

**Project** — cover → title → meta → summary → links → tech stack with icons → gallery, all 16:9.

**Hackathon** — lightbox: `fit="contain"` so nothing is cropped, prev/next chevrons, arrow-key nav,
`n / m` counter, thumbnail carousel with hidden scrollbar.

### 7.2 The greeting — 入場券

Personal mode only, once per session (`sessionStorage`), after Boot clears. Built as an **admission
ticket** rather than a panel: the 9:16 art is the ticket's illustrated stub, flush to the edge with no
inset, a perforation down the seam, and a notch punched out of each end.

**The notches are cut, not drawn.** A drawn circle would have to match the blurred page showing
through behind it, which it cannot — two radial-gradient mask layers are intersected to remove those
pixels outright, guarded by `@supports` because a browser without `mask-composite` would apply only
the first layer and erase most of the panel. Two consequences: masking clips `box-shadow` away, so the
lift comes from a `drop-shadow` **filter** which follows the punched silhouette; and the mask creates
a stacking context that would starve `backdrop-filter`, so the ticket is opaque paper and the page
behind stays blurred via `::backdrop`.

**The stub is genuinely 9:16.** The panel height is the one authored number and the stub's width is
derived from it — *not* the reverse. A stub with `aspect-ratio` in a stretch row is circular (width
depends on row height depends on text height depends on leftover width) and browsers resolve that by
handing it a **zero base size**. Deriving width from height has one direction and cannot loop. On
short viewports the greeting scrolls rather than the portrait shrinking; below 700px the layout stacks
and the ratio has to give, because a true 9:16 portrait at phone width is the whole screen.

**Slideshow** — 11 frames from `public/profile/tickets/`, 4.5s each, cross-faded on opacity with a
segmented rail (one segment per frame, so it shows position as well as countdown). Prev/next restart
the full interval rather than inheriting the remainder.

**Track previews.** Hovering a track auditions it at 0.42 volume. This did not work at first and the
cause is worth recording: **a hover is not a user gesture**, so the autoplay policy refuses it, and no
amount of cursor movement will ever satisfy the policy. The first real `pointerdown` or `keydown`
anywhere on the page now silently primes the audio element — play at zero volume, pause — which marks
it user-activated and lets every later hover through. Guarded so it never pauses a preview already
playing. If a preview is still refused, the panel says so rather than looking broken.

**Exits.** `Enter` is disabled until a track is picked; **Continue without music** discards any
selection *and* dispatches `HERO_SOUND`, which unmutes the hero video at full volume. That dispatch
happens inside the click handler, not after the 460ms exit animation — unmuting needs user activation
and the exit is a different call stack with no gesture behind it. Esc mirrors whichever path applies.

**Scroll lock.** `showModal()` makes the page inert to clicks but does **not** stop the wheel, so the
page slid around under the backdrop. `<html>` gets its own class while open — separate from Boot's, so
whichever clears first cannot unlock the page for the other — and the scrollbar's width is measured
and handed back as padding, or the page behind jumps sideways as the modal opens.

### 7.3 The ticket editor

Reached from the greeting's 氏名 / Name field. The visitor's name is printed on a ticket they can
decorate and download.

**Drawn to canvas, not screenshotted.** The DOM-capture libraries re-implement CSS and would get this
panel wrong in exactly the places it is interesting — the notches are a mask, the lift is a filter —
besides costing ~200 KB to do it badly. A canvas renders it exactly, at 2×, in a couple of KB.

**Two surfaces, one coordinate space.** The stage is DOM so dragging is cheap and hit-testing is free;
the export is canvas. Both address the same logical grid (a 1100×520 ticket inside a 130-unit margin,
exporting at 2720×1560), so what is arranged is what is downloaded — there is no second layout to
keep in sync.

**The export uses two canvases.** The notch punch is `destination-out`, which erases whatever is
already on the surface. Drawing stickers first and punching after would cut holes straight through any
sticker overhanging that seam, so the ticket is painted on its own offscreen canvas, punched there,
composited in, and *then* the stickers go on top.

**Stickers** — 50 transparent PNGs in `public/profile/stickers/`, generated from a count rather than
listed, with any that fail to load dropped at runtime (the set has had gaps). Drag to move; one corner
grip does both scale and rotation, because two handles would cover the sticker being edited. The
"must touch the ticket" rule is enforced by **clamping, not rejecting** — a drag that wanders off
stops at the furthest still-overlapping position instead of snapping back.

Tray chips are **toggles** and light up when their artwork is on the ticket: the hover treatment
carried further, plus a dot, since a border-brightness difference is a fine distinction to hold across
fifty chips. Clicking a lit chip removes **every** copy of that sticker — removing only the newest
would leave the chip lit, and "click again to remove" would stop meaning what it says. An **All 50**
button opens the full sheet, which stays open while adding and reports a live count, since the stage
is hidden behind it.

**Message mode** swaps the ISSUED / GUIDE / SEAT rows for up to 500 characters under a 一言 / MESSAGE
label. Canvas has no text layout at all — `measureText` is the only tool — so wrapping is a hand-built
greedy line-builder that **falls back to breaking by character** when a token is wider than the
column. Without that, anything pasted without spaces (a URL, a keysmash) rendered as one line running
straight off the ticket. It walks code points, so a surrogate pair or CJK glyph is never split. The
type then shrinks to fit its band the same way the name line does.

**Fonts must be awaited.** Canvas does not participate in CSS font loading — an unloaded family
silently falls back, so the download would come out in Arial while the screen looked right.

The stub code and the ISSUED row both come from a **single** `new Date()`; reading the clock twice
would let a ticket issued near midnight print one day on the stub and the next in the body.

### 7.4 Music player

Rebuilt from the vengenceui reference without lucide-react, `cn` or shadcn. Floating, draggable,
horizontally resizable, collapsible to a 72px cover. Loop modes are off / all / one, defaulting to
all. The left resize grip also moves the origin so the opposite edge stays put. Appears only when a
track was chosen in the greeting.

---

## 8. Data model

Single source of truth: [src/data/projects.js](src/data/projects.js) — exports `PROJECTS`, `ORDERED`
(reverse-chron), `bySlug`, `liveUrl`, `formatPeriod`.

```js
{
  slug: 'minari', name: 'Minari', kanji: '実成',
  tagline: 'Autonomous flaky-test resolution for GitLab',
  event:   'Google Cloud Rapid Agent Hackathon — GitLab',
  period:  { start: '2026-05', end: '2026-06' },
  award:   null,                    // '🥈 1st Runner-Up' | '🥉 2nd Runner-Up' | null
  summary: '…',
  highlights: [ … ],                // ⚠ no longer rendered — see §2
  architecture: [ … ],              // ⚠ no longer rendered — see §2
  stack: [ { category, items: [{ name, ver, role }] } ],
  media: [ { src, cap, ratio } | { yt, cap } ],
  links: [ { kind: 'demo'|'repo'|'video'|'devpost'|'submission', label, url, primary } ],
}
```

**Hackathon media is discovered, not declared.** [src/data/hackathonMedia.js](src/data/hackathonMedia.js)
globs `src/assets/hackathons/*/*.{png,jpg,…}` at build time with `import.meta.glob`. `cover` sorts
first, then numerically. Declared arrays had drifted to 16 entries against 41 files on disk; a glob
cannot.

Siblings: `profile.js`, `hackathons.js`, `certifications.js`, `stack.js`, `experience.js`.

---

## 9. Content inventory

**Projects — 9.** Mitsu 見つ · Minari 実成 · Misaki 見先 · Mirai ミライ · Miwa 美話 · Bacsal Consultancy 事務 ·
Galactic Conquest 宇宙 🥉 · HirNa! 求人 🥈 · Eye2Wear 眼鏡

**Hackathons — 9**, across 2025 (4) and 2026 (5). Two podium finishes; placed on the first attempt.

**Certifications — 11.** Certiport ×5 · Microsoft ×4 · Cisco ×1 · PMI ×1. All credential IDs verbatim.

**Stack — 120 tools across 11 categories.**

**Experience & education.** Junior Software Engineer, Bacsal Business Consultancy (Internship,
Jan–Apr 2026, Mariveles, Bataan, Hybrid) · Bataan Peninsula State University, Network and Web
Application, Dec 2022 – Jul 2026.

---

## 10. Project structure

```
src/
├── App.jsx                    ModeProvider · Boot · both navs · routes
│                              · Welcome · MusicPlayer
├── main.jsx                   hydrate if firstElementChild, else render
├── entry-server.jsx           SSR entry for prerender
├── index.css                  the entire design system, ~6.8k lines
├── events.js                  cross-tree signals (HERO_SOUND)
├── hooks/
│   ├── useMode.jsx            personal / recruiter
│   └── useScrollReveal.jsx    IntersectionObserver + <Reveal>
├── components/
│   ├── Nav.jsx                notch navbar (recruiter)
│   ├── PersonalNav.jsx        floating kanji dock (personal)
│   ├── Footer.jsx · Seo.jsx
│   ├── shared/
│   │   ├── Boot.jsx           水 scan loader
│   │   ├── Welcome.jsx        入場券 greeting · slideshow · tracks
│   │   ├── Ticket.jsx         canvas ticket + sticker editor
│   │   ├── MusicPlayer.jsx    draggable · resizable · collapsible
│   │   ├── ModeToggle.jsx · SectionBreak.jsx
│   │   ├── Backdrop.jsx       StarField · PerspectiveGrid · Spotlight
│   │   ├── TechIcon.jsx · placeholders.jsx · primitives.jsx
│   ├── home/                  Hero About Work Experience Stack
│   │                          Hackathons Certifications Contact
│   │                          + HackathonDialog
│   └── deck/ProjectDialog.jsx
├── data/                      projects hackathons hackathonMedia
│                              certifications experience stack profile
│                              icons music
└── assets/hackathons/<id>/    cover.png, 01.png … (globbed)

scripts/  prerender.js · gen-icons.mjs · find-slug.mjs
public/   profile/ · work/ · certs/ · orgs/ · og/
          profile/stickers/   s1–s50.png   ticket stickers
          profile/tickets/    gc1–gc11.jpg greeting slideshow, all 9:16
```

`events.js` exists for the handful of moments where one component must tell a distant one something
once and threading a callback through every layer between them would cost more than it explains.
`HERO_SOUND` is the only entry: the greeting fires it, `Hero` listens. Named in one place so a typo is
a build error rather than an event nobody hears.

---

## 11. Build, SEO, deploy

```
npm run dev       vite
npm run build     client → SSR → prerender → sitemap + robots
npm run icons     regenerate src/data/icons.js
```

`scripts/prerender.js` builds the client, builds an SSR bundle, renders each route to static HTML,
then writes `sitemap.xml` and `robots.txt`. **2 routes:** `/` and `/404`.

```
bundle js    137.6 KB gzipped
bundle css    20.4 KB gzipped
```

**Media weight is the real cost, not JS.** ~51 MB of *referenced* media ships — dominated by
`stickers/` (9.9 MB), `herobg2.mp4` (7.3 MB), the section-break GIFs (~7.6 MB) and
`contactsection.mp4` (5.2 MB) — plus ~12 MB more that nothing references but `public/` deploys
anyway. The JS grew 10 KB gzipped across this whole feature set; the media is roughly **200×** the
code. Recruiter mode avoids the GIFs, the video and the greeting entirely. See §13.

---

## 12. Accessibility

- Native `<dialog>` for both dialogs — focus trap, ESC, inert background for free.
- Every decorative layer is `aria-hidden`: torii, katana, wind, kanji marks, section breaks, boot,
  contact video, dock tooltips' twin.
- One real `<h2>` per section survived every redesign; `<h3>` per record where the old markup had one.
- Global `:focus-visible` outline — it, not any border, is what makes the borderless work cards
  keyboard-navigable.
- `prefers-reduced-motion` zeroes every animation globally; Boot additionally unmounts at 260ms
  rather than holding an invisible pane for 3.45s, and the contact video is hidden outright.
- Screen readers get one nav at a time — the hidden one is `display: none` and out of the tree.

---

## 13. Known gaps

Weight is now the dominant problem, and it is entirely in `public/` — which Vite copies **verbatim**
into `dist/`, referenced or not.

| # | Gap | Note |
|---|---|---|
| 1 | **`herobg.mp4` is 46.95 MB and no longer referenced** | The hero moved to `herobg2.mp4` (7.31 MB). Nothing imports it; it still deploys on every build. Deleting it is the single biggest win available and costs nothing |
| 2 | **18 unreferenced files in `public/profile/` — 11.96 MB** | Beyond the above: `sada.gif` 2.97, `0803 (8).gif` 2.21, `asdsa.gif` 1.90, `dump.gif` 1.27, `download.png` 1.20 |
| 3 | **`stickers/` is 9.88 MB across 50 PNGs** | ~200 KB each at up to 598px, but only ever drawn at ~380px. The **All 50** sheet lays them all out at once, so opening it pulls the lot. Re-export at 400×400 + `pngquant` → roughly 2–3 MB with no visible difference |
| 4 | `contactsection.mp4` is 5.21 MB | Was 290 KB when wired |
| 5 | `herobg2.mp4` is 7.31 MB | Check `moov` placement — without `+faststart` the browser downloads the whole file before the first frame |
| 6 | Section-break GIFs total ~7.6 MB, 500px wide | Convert to MP4/WebM — typically 10–20× smaller — and re-export wider to fix the softness |
| 7 | `heropersonal.gif` is 540×303 | Upscaled hard at 1080p, and GIFs cannot be hardware-decoded, so it costs more CPU than the video did |
| 8 | `bgheroes.png` is 1280×720, 1.31 MB | Upscaled on anything wider than 1280. A 1920 JPEG at q82 would be smaller *and* sharper |
| 9 | `highlights` / `architecture` unrendered | §2. Either fold into the project dialog or delete from the data |
| 10 | OG images | `public/og/` still empty |
| 11 | Domain undecided | `SITE.url` = `https://mizu-portfolio.vercel.app` |
| 12 | Nothing pushed since `4e690ef` | The repo is far behind the working tree |
| 13 | `nuts.MP3` uppercase extension | Works on Windows, 404s on Vercel's Linux filesystem if the reference is ever lowercased. `music.js` matches it exactly today |
| 14 | Ticket layout is hand-placed coordinates | Canvas has no layout engine. Verified by construction, never by eye — the rendered output has not been visually reviewed |

**The JS bundle is not the problem.** 415 kB raw / ~135 kB gz with three runtime dependencies, after
adding the greeting, the canvas ticket, the sticker editor and the music player. The media is roughly
**200× the size of the code.**

---

## 14. Traps found the hard way

Recorded because every one of these cost real time and none is obvious from the code.

| Trap | Symptom | Fix |
|---|---|---|
| `<Reveal>` wraps children | Wrapped element becomes an **only child** — `:first-child`/`:last-child` match everything; grid spans and `h-full` on the inner element do nothing | Put grid/sizing classes on the `Reveal` wrapper, and test `.parent > :last-child .child` |
| `<button>` in a grid | `width: auto` on a button is **shrink-to-fit**, not fill — cards ignored their track and overlapped neighbours by 27px | `width: 100%; max-width: 100%; min-width: 0` |
| Pointer capture on pointerdown | Retargets the following `click` to the capturing element — every dock link silently dead | Capture only *after* the drag threshold |
| `clip-path` / `overflow` on a parent | Both clip **absolutely-positioned descendants**. Killed the dock's rope twice | Keep the clip off the positioning shell; put it on an inner box |
| Inline styles | Cannot be overridden by a mode class | Rebuild the component off `SectionShell` (§3.8) |
| `margin: 0 auto` | **Beats** `align-items: flex-start` on a flex parent | Zero the side margins |
| Truncate-and-rewrite a CSS block | Silently drops unrelated rules appended after it. Cost the notch-nav visibility rules *and* the hero mark rules on separate occasions | Diff the full selector inventory after any block rewrite |
| Minifier rewrites | `translate(0,y)` → `translateY(y)`, breaking transform **function-list matching** and dropping animations to matrix interpolation; `::after` → `:after`; `even` → `2n`; whitespace **preserved** inside custom-property values | Use `var()` to block the collapse; write verification against minified forms |
| React text nodes | `全{n}枚` renders as `全<!-- -->11<!-- -->枚` | Strip `<!-- -->` before matching built HTML |
| `speechSynthesis` (retired) | `cancel()` + `speak()` in the same tick drops the utterance; `getVoices()` empty on first call | — |
| **A hover is not a user gesture** | Track previews silently refused until something had been clicked. No amount of cursor movement satisfies the autoplay policy, and deploying does not change it | Prime the element on the first real `pointerdown`/`keydown` anywhere — play at zero volume, pause |
| **Unmuting after an animation** | Dispatching the hero-sound signal after the 460ms exit is a different call stack with no gesture behind it, so the play is refused exactly like the first autoplay | Dispatch inside the click handler |
| `showModal()` does not stop the wheel | Page behind the modal scrolls under the backdrop. It blocks *clicks*, not scrolling | Class on `<html>`, plus give the scrollbar's width back as padding or the page jumps sideways |
| `aspect-ratio` in a stretch row | Circular sizing — width depends on row height depends on content height depends on leftover width. Browsers resolve it by handing the element a **zero base size** | Derive one dimension from the other in a single direction |
| `destination-out` erases *everything* | Punching the ticket's notches after drawing stickers cut holes through any sticker overhanging that seam | Paint the plate on its own offscreen canvas, punch there, composite, then draw on top |
| A hidden GIF keeps animating | By its next turn in the rotation it was mid-loop, so "play once then advance" was never true | Assign a blank data-URI then the original `src` — a different value forces a decode from frame one |
| Canvas ignores CSS font loading | The exported PNG came out in Arial while the page looked correct | `await document.fonts.load(...)` for each exact cut, then `document.fonts.ready` |
| Word wrap alone is not wrap | A token with no spaces has nothing to break at, so a greedy wrapper emits one line running off the canvas. Any pasted URL does this | Fall back to breaking by character; iterate code points so surrogate pairs survive |
| Passing a handler directly | `onClick={close}` hands the **click event** in as the first argument, and every event object is truthy — a new `discard` parameter silently fired on the wrong button | Pass explicit values and compare with `=== true` |
| Side effects in a `setState` updater | StrictMode invokes updaters twice, double-incrementing a ref used for keys | Read state from render scope; keep updaters pure |
| Reading the clock twice | A ticket issued near midnight printed one date on the stub and another in the body | One `new Date()`, passed to both |
| **Verification false negatives** | Recurring, and always my own checker: the minifier hoists constants (`6e3` → a variable), rewrites alphas to hex (`rgba(255,255,255,.16)` → `#ffffff29`), strips quotes from `[type="range"]`, keeps the space in `max-width: 700px`, and autoprefixer *expands* `@supports` conditions. Substring collisions too — `.tk-pick-grid-mizu .tk-chip-mizu{` matches a search for `.tk-chip-mizu{` | Resolve identifiers before asserting; anchor selector lookups on a separator; write checks to a `.mjs` file rather than embedding them in a shell string, where `${...}` and backticks get mangled |

---

## 15. Open questions

1. Domain — buy one, or ship on `*.vercel.app`?
2. Delete `highlights` / `architecture`, or build them somewhere?
3. Should recruiter mode be the default for first-time visitors arriving from a job application?
4. Does anything ever *read* the downloaded tickets? Right now a visitor can write 500 characters of
   feedback and the only copy is the PNG on their own machine. That is a deliberate no-backend
   choice, but it means the feedback affordance collects nothing.
5. Should `Enter` with no track selected also unmute the hero, the way **Continue without music**
   does? It cannot happen today — `Enter` is disabled until a track is picked — but if that gate is
   ever relaxed, the two exits diverge again.

**Not open any more:** the media weight. §13 items 1–3 are ~28 MB of deletions and re-exports with
no design decision attached to them, and item 1 alone is 47 MB that nothing references.
