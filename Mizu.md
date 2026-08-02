# Mizu 水 — Portfolio Blueprint

**Owner:** Francis Daniel Genese
**Status:** Built and shipping. Build passes, 2 routes prerendered, dual presentation modes.
**Date:** 2026-08-02

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

### 6.1 Hero

Personal is the base: `heropersonal.gif` full-bleed, the whole block set **bottom-left**, name in
mincho, and 水 as an outline mark centred on the right half (`left: 74%`, `clamp(10rem, 34vw, 31rem)`).
The generated backdrop (StarField / PerspectiveGrid / Spotlight) switches off so the two never stack.

Scrim is weighted, not flat — bottom to 94%, left to 88%, falling away toward the top-right. A wash
heavy enough for the copy would kill the plate everywhere else.

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

Both use native `<dialog>` + `showModal()` — real focus trapping, ESC, top-layer stacking, inert
background, no z-index competition.

**Project dialog** — cover → title → meta → summary → links → tech stack with icons → gallery, all
16:9.

**Hackathon dialog** — lightbox: `fit="contain"` so nothing is cropped, prev/next chevrons, arrow-key
nav, `n / m` counter, thumbnail carousel with hidden scrollbar.

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
├── main.jsx                   hydrate if firstElementChild, else render
├── entry-server.jsx           SSR entry for prerender
├── index.css                  the entire design system, ~15 KB gz
├── hooks/
│   ├── useMode.jsx            personal / recruiter
│   └── useScrollReveal.jsx    IntersectionObserver + <Reveal>
├── components/
│   ├── Nav.jsx                notch navbar (recruiter)
│   ├── PersonalNav.jsx        floating kanji dock (personal)
│   ├── Footer.jsx · Seo.jsx
│   ├── shared/
│   │   ├── Boot.jsx           水 scan loader
│   │   ├── ModeToggle.jsx · SectionBreak.jsx
│   │   ├── Backdrop.jsx       StarField · PerspectiveGrid · Spotlight
│   │   ├── TechIcon.jsx · placeholders.jsx · primitives.jsx
│   ├── home/                  Hero About Work Experience Stack
│   │                          Hackathons Certifications Contact
│   │                          + HackathonDialog
│   └── deck/ProjectDialog.jsx
├── data/                      projects hackathons hackathonMedia
│                              certifications experience stack profile icons
└── assets/hackathons/<id>/    cover.png, 01.png … (globbed)

scripts/  prerender.js · gen-icons.mjs · find-slug.mjs
public/   profile/ · work/ · certs/ · orgs/ · og/
```

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
bundle js    127.5 KB gzipped
bundle css    15.1 KB gzipped
```

**Media weight is now the real cost, not JS.** ~10.9 MB of referenced media ships, dominated by
`contactsection.mp4` (5.3 MB) and the two GIF section breaks (3.0 + 1.6 MB). Recruiter mode avoids
the GIFs and the video entirely. See §13.

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

| # | Gap | Note |
|---|---|---|
| 1 | **`contactsection.mp4` is 5.3 MB** | Was 290 KB when wired. Re-encode — this is the single heaviest asset on the site |
| 2 | **27 unreferenced files in `public/profile/` (~6.9 MB)** | `public/` is copied verbatim into `dist/`, so they deploy on every build. Random hashes, `download.png`, spare portraits |
| 3 | Section-break GIFs are 3.0 MB + 1.6 MB, and only 500px wide | Convert to MP4/WebM — typically 10–20× smaller, and re-export wider to fix the softness |
| 4 | `heropersonal.gif` is 480×260 | A 4× upscale at 1080p. Soft behind the scrim, but soft |
| 5 | `highlights` / `architecture` unrendered | §2. Either fold into the project dialog or delete from the data |
| 6 | OG images | `public/og/` still empty |
| 7 | Domain undecided | `SITE.url` = `https://mizu-portfolio.vercel.app` |
| 8 | Nothing pushed since `4e690ef` | The repo is far behind the working tree |

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

---

## 15. Open questions

1. Domain — buy one, or ship on `*.vercel.app`?
2. Re-encode the video and GIFs, or accept the weight?
3. Delete `highlights` / `architecture`, or build them somewhere?
4. Should recruiter mode be the default for first-time visitors arriving from a job application?
