# Mizu 水 — Portfolio Blueprint

**Owner:** Francis Daniel Genese
**Status:** Built — phases 0–6 complete. Build passes, 10 routes prerendered.
**Date:** 2026-08-01

---

## 1. What this is

A personal engineering portfolio for Francis Daniel Genese, built in the visual language of
[mitsu-site](../mitsu/mitsu-site/) — the Swiss-industrial dark deck used for the OpenAI Build Week
submission — but scaled from one project to nine.

**Name:** `Mizu` (水, water). It is the house mark for a family of projects that all flow from it —
**Mi**tsu, **Mi**nari, **Mi**saki, **Mi**rai, **Mi**wa — and matches the existing GitHub handle
`Mizunandayo`.

---

## 2. Decisions locked

| # | Decision | Choice | Why |
|---|---|---|---|
| 1 | Structure | Home scroll + per-project deck routes | Nine projects at Mitsu depth won't fit one page; each needs a shareable URL |
| 2 | Stack | Vite 5 + React 18 + Tailwind 3 + react-router-dom, prerendered | Mitsu's CSS transfers 1:1; prerender buys real SEO and link previews without a framework change |
| 3 | Media | Placeholder-first | Ships today, sharpens as assets land; identical to Mitsu's approach |

**Explicitly not doing:** Next.js (Tailwind v4 token migration cost for no gain here), Astro (new
framework), a CMS, dark/light toggle (the design is committed to dark), blog, analytics dashboard.

**No résumé PDF.** The portfolio *is* the résumé — there is no "Download CV" button anywhere. This
raises the bar on §6.3 Certifications and §6.4 Contact: they have to carry everything a recruiter
would otherwise open a PDF to find (credential IDs, dates, education, availability).

---

## 3. Design system — inherited from Mitsu

Everything in this section is lifted verbatim from `mitsu-site/src/index.css` and
`tailwind.config.js`. It is a working, coherent system; the portfolio does not redesign it.

### 3.1 Canvas & texture

```
body            #050505
section-alt     #070707        alternating bands
grain           fixed SVG fractalNoise, baseFrequency 0.9, numOctaves 4
                opacity 0.022, z-index 9999, pointer-events none, never scrolls
scrollbar       4px, rgba(255,255,255,0.14), transparent track
```

### 3.2 Type

| Role | Family | Weights |
|---|---|---|
| Body / UI | Poppins | 400 500 600 700 800 |
| Display wordmark | Outfit | 700 800 900 |
| Labels, specs, data strips | SF Mono → Cascadia Code → JetBrains Mono → ui-monospace | 600 |

Scale is fluid throughout — `clamp()` on every display size, never fixed px for headlines.

```
hero wordmark    clamp(4rem, 11vw, 8.4rem)   weight 900, tracking -0.035em, line-height 0.9
section claim    clamp(1.35rem, 3.2vw, 2.25rem)  weight 900, tracking -0.035em
feature name     clamp(1.55rem, 2.6vw, 2.1rem)   weight 800, tracking -0.04em
body             0.9rem / 1.7
small-copy       0.84rem / 1.55
micro-label      0.76rem, letter-spacing 0.1em, uppercase, weight 600
big number       clamp(2rem, 4.2vw, 3rem)    weight 900, tracking -0.05em, tabular-nums
```

### 3.3 Color

Near-monochrome. White and zinc at varying alpha carry the entire interface.

```
text primary     rgba(250,250,250,0.96)
text body        rgba(212,212,216,0.84)
text muted       rgba(161,161,170,0.85)
surface          rgba(255,255,255,0.03)
surface raised   rgba(39,39,42,0.28)
border hairline  rgba(163,163,163,0.22)
border hover     rgba(212,212,216,0.38)
```

**Accent discipline — the rule that makes the design work.** Color is never decorative. It appears
only to encode meaning in architecture diagrams and pipeline states:

| Token | Value | Means |
|---|---|---|
| cyan | `56,189,248` | perceive / input stage |
| emerald | `74,222,128` | fast / local / deterministic path |
| violet | `192,132,252` | LLM / reasoning stage |
| blue | `96,165,250` | connector, data transport |

Nine projects is exactly the situation where a portfolio starts assigning each project a brand colour
and turns into a fruit salad. **Projects do not get colours.** They get typography and a kanji glyph.

**One carve-out: technology icons** (§3.6) render in their real brand colours. Brand marks are
recognised by their colour — a grey Python or a grey React is harder to scan, not cleaner. The rule
survives because the two never share a surface: stage accents appear only inside architecture
diagrams on deck pages, brand colours only inside `.si-mizu` chips in a stack list. Nothing else on
the site is coloured.

### 3.4 Motion

```
easing          cubic-bezier(0.16, 1, 0.3, 1)     — the only easing curve in the system
reveal          opacity 0→1, translateY(24px)→0, 700ms
stagger         reveal-d1..d6 = 80ms increments
hero entrance   translateY(28px), 1000ms, per-element animationDelay 0.05s → 0.62s
```

Driven by `useScrollReveal()` + the `<Reveal>` wrapper — `IntersectionObserver`, `unobserve` after
first fire, `rootMargin: '0px 0px -40px 0px'`. No animation library.

### 3.5 Components

| Class | Spec |
|---|---|
| `.nav-glass` | `rgba(5,5,5,0.72)` + `blur(20px) saturate(150%)` |
| `.glass-panel` | `rgba(38,38,38,0.35)`, 1px `rgba(163,163,163,0.22)`, `blur(16px) saturate(130%)` |
| `.card-shell` / `.card-core` | Double bezel — outer r20 + 2px pad, inner r18 + `inset 0 1px 1px rgba(255,255,255,0.06)` |
| Flat panel | `rgba(255,255,255,0.03)` + 1px `rgba(163,163,163,0.22)` + r12 + 26–28px pad |
| `.prose-col` | `max-width: 58ch` |

### 3.6 Technology icons

Brand marks are generated from `simple-icons` (a **devDependency**) into
[src/data/icons.js](src/data/icons.js) by [scripts/gen-icons.mjs](scripts/gen-icons.mjs). Nothing
from the package reaches the runtime bundle — only the path strings actually rendered.

```
npm run icons          # marks used by the aggregate Stack section
npm run icons -- --all # + the nine per-project deck stacks
node scripts/find-slug.mjs redis postgres   # look up a slug before mapping it
```

**Icons carry their real brand colour** — see the carve-out in §3.3. Used raw, though, many would be
invisible here, so the generator corrects each one against the `#050505` canvas:

| Case | Treatment | Count |
|---|---|---|
| Contrast ≥ 3.6:1 already | Brand hex untouched | 37 |
| Dark but saturated | Hue + saturation held, **lightness raised** until it clears 3.6:1 | 5 |
| Achromatic (black / white / grey) | Rendered `#E4E4E7` — no hue to preserve | 11 |

The lightened five are `css #663399 → #8A4FC4`, `Cloudinary #3448C5 → #5162D1`,
`ESLint #4B32C3 → #6B55D3`, `OpenCV #5C3EE8 → #6B50EA`, `Prisma #2D3748 → #586C8D`. The achromatic
eleven — Next.js, Vercel, Express, shadcn/ui, Socket.IO, MCP, JWT, GitHub, Radix UI, Railway, React
Three Fiber — are all black or near-black and would have vanished entirely; light zinc is the same
convention GitHub uses for its own mark on dark backgrounds.

Brand marks sit at `opacity: 0.88` at rest so 53 logos don't shout over the type, going to full with
a slight saturate/brightness lift on row hover. The generator prints every adjustment it makes, so
the corrections are auditable rather than silent.

**No empty slots.** `simple-icons` has no mark for OpenAI, Valibot, Langfuse, tree-sitter or React
Flow, nor for non-products like CSP/HSTS and Server-Sent Events. Those fall back to a **stroked
category glyph** picked from the item's stack category — code, model, layers, server, database,
vision, shield, terminal, globe, key, chart, node. Glyphs stay **neutral zinc**: they denote a kind
of thing, not a brand, and inventing a colour would imply one that doesn't exist. They sit at `0.8`
alpha rather than `0.62` because an outline reads lighter than a solid silhouette at equal alpha.

Adding a technology: add it to `stack.js`, map it in `NAME_TO_SLUG`, run `npm run icons`. An
unmapped name is reported by the generator rather than silently rendering blank.

**Cost:** ~26 KB gzipped for 53 marks. Budget after icons is 103 KB against the 120 KB ceiling.

### 3.7 Section rhythm

Every section is the same shape. This repetition is the design.

```
<section id="…" className="relative py-32" style={{ background:'#050505' | '#070707' }}>
  <div className="max-w-[1100px] mx-auto px-8">
     micro-label eyebrow          ← uppercase mono, 0.1em tracking
     big claim                    ← clamp display, weight 900
     supporting copy              ← small-copy, max 58ch
     ─── hairline rule ───
     content grid                 ← .map() over a const array
  </div>
</section>
```

### 3.8 Code conventions to preserve

- **Data-driven sections.** Each component opens with `const ITEMS = [...]`, then maps. No JSX
  hand-repeated per item.
- **Namespaced CSS.** Mitsu suffixes custom classes `-mitsu`. This portfolio uses `-mizu` for
  shared/global pieces and `-<slug>` for anything specific to one case study.
- **Tailwind for layout, inline `style={{}}` for precision.** Mitsu mixes both deliberately —
  utilities for grid/flex/spacing, inline objects for anything animated, clamped, or alpha-tuned.
  Keep the split; don't "clean it up" into one or the other.
- **JSX, not TSX.** Matches Mitsu. No TypeScript.

---

## 4. What changes for a portfolio

Mitsu is a pitch deck for a product. A portfolio is a different argument, so five things adapt:

1. **Subject.** The hero is a person, not a product. Wordmark is the name; 水 is the house glyph.
2. **Repetition at scale.** Mitsu's sections are each bespoke. Nine case studies cannot be — they
   need a shared deck template driven by one data file, or the site becomes unmaintainable.
3. **Routing.** New. Mitsu is a single scroll with anchor nav.
4. **Density gradient.** Home must skim in 90 seconds; decks go deep. Mitsu had no such split.
5. **No commercial sections.** Market / Revenue / Roadmap are pitch furniture and get dropped.

---

## 5. Information architecture

```
/                        Home — the person
/work/mitsu              ┐
/work/minari             │
/work/misaki             │
/work/mirai              │
/work/miwa               ├─ 9 case-study decks, one template
/work/bacsal             │
/work/galactic-conquest  │
/work/eye2wear           │
/work/hirna              ┘
/404                     Not found, in-theme
```

All ten content routes prerender to static HTML with their own `<title>`, `<meta name=description>`,
and OG image.

### 5.1 Nav

Floating pill, identical to Mitsu's: detached `top-5`, centered, `border-radius: 999`, height 52,
glass, active section = filled pill, white CTA on the right.

- **Brand:** `水 MIZU` → `/`
- **Home links:** Work · About · Experience · Awards · Certs · Contact
- **Deck links:** `← All work` · project name · prev/next
- **CTA:** `Get in touch`
- Below `lg`, links collapse; brand + CTA remain.

---

## 6. Home page

| # | Section | id | bg | Content |
|---|---|---|---|---|
| 1 | Hero | `hero` | `#050505` | Name, kanji, role strip, stat bar, CTAs |
| 2 | About | `about` | `#070707` | Three-paragraph summary + top skills |
| 3 | Work | `work` | `#050505` | 9 project cards → decks |
| 4 | Experience | `experience` | `#070707` | Bacsal internship + BPSU education |
| 5 | Stack | `stack` | `#050505` | Aggregate technologies, layered |
| 6 | Awards | `awards` | `#070707` | 7 hackathon honors |
| 7 | Certifications | `certifications` | `#050505` | 11 certs, grouped by issuer |
| 8 | Contact | `contact` | `#070707` | Availability + links |

### 6.1 Hero

Reuses Mitsu's full stack of hero layers:

- `StarField` — 240 canvas dots, `ResizeObserver`-driven redraw · **keep as-is**
- `PerspectiveGrid` — 80px grid, radial ellipse mask · **keep as-is**
- Radial spotlight behind the headline · **keep as-is**
- `LandmarkConstellation` → **replaced by `RippleField`**: concentric 水 ripple rings in muted
  cyan, reusing the `landmark-breath` 6s breathing animation. Same slot, same opacity (0.5), same
  position (`right: 6%`, `top: 16%`).

Data strip (`.hero-strip`, hairline rules + mono uppercase, no container):

```
SOFTWARE ENGINEER  ///  AI ENGINEER  ///  LIMAY, PHILIPPINES
```

Wordmark, mirroring `MITSU 見つ`:

```
FRANCIS DANIEL GENESE   水
   Outfit 900, #f5f5f5      rgba(113,113,122,0.95), weight 800
```

Subtitle → `Agentic AI · LLM Applications · Intelligent Systems`
One-liner → condensed from the LinkedIn About, ≤ 2 sentences, max-width 540.

CTAs → `View the work` (white pill, scrolls to `#work`) · `GitHub` (ghost pill, `Mizunandayo`).

Stat bar — 4 cells, bordered glass grid, max-width 600:

| Value | Label |
|---|---|
| `9` | Projects shipped |
| `7` | Hackathon awards |
| `11` | Certifications |
| `5` | Solo builds in ≤ 8 days |

Metadata row → `Open to` · `Based in` · `Focus`.

### 6.2 Work grid

Three columns at `lg`, two at `md`, one on mobile. Each card is a `.card-shell` / `.card-core`
double bezel, and holds:

```
┌────────────────────────────┐
│ ▓▓▓ 16:9 placeholder ▓▓▓   │
├────────────────────────────┤
│ MITSU              見つ     │  name + kanji, Outfit 800
│ OpenAI Build Week          │  micro-label mono
│ Touchless window control   │  one line, 0.9rem
│ Python · MediaPipe · GPT   │  3 stack chips max
│ ⬦ 8 days · Solo            │  footer meta
└────────────────────────────┘
```

Hover: border `rgba(163,163,163,0.22)` → `rgba(212,212,216,0.38)`, 170ms. No lift, no scale, no
glow — Mitsu's hovers are all border-and-background only.

Order is reverse-chronological by end date, which also front-loads the strongest work:

```
mitsu · minari · misaki · mirai · miwa · bacsal · galactic-conquest · hirna · eye2wear
```

The last three all end Oct 2025, so they tie-break on start date, most recent first —
galactic-conquest (Oct) → hirna (Jun) → eye2wear (Feb). Sorting is derived from `period` in
`projects.js`, not hand-maintained.

Award-winning projects get a mono ribbon in the card corner (`🥉 2nd RU` / `🥈 1st RU`).

### 6.3 Certifications

A **badge card grid** — the credential badges are the visual point, so each certification gets a
card built around its badge image rather than a row in a list.

```
grid  1 / 2 / 3 / 4 cols  (sm / md / lg / xl)
┌──────────────────────┐
│      ┌────────┐      │  badge, 1:1, max 124px
│      │ ▓▓▓▓▓▓ │      │  object-fit: contain — never cropped
│      └────────┘      │
│  CERTIPORT           │  mono, uppercase, 0.1em
│  IT Specialist —     │  0.95rem / 700
│  Software Development│
│  Issued Apr 2026 ·   │  mono 0.73rem
│  Expires Apr 2031    │
│  ──────────────────  │  pinned to bottom
│  CREDENTIAL ID       │
│  e75904b1-498e-4c…   │  mono 0.68rem, break-all
└──────────────────────┘
```

Flat panel styling (`rgba(255,255,255,.03)` + hairline + r12, border lifts on hover), matching the
Awards cards immediately above it so the two sections read as siblings.

**Data is flat, not grouped by issuer.** Grouping would leave Cisco and PMI as one-card rows.
Each card carries its own issuer instead, and `CERTS_ORDERED` sorts newest-first off a `sort`
(`YYYY-MM`) key — adding a certification needs no manual reordering.

`object-fit: contain`, not `cover`: a clipped credential mark looks broken. Non-square images
letterbox inside the frame rather than cropping.

Badges live in [public/certs/](public/certs/) and follow the same drop-in convention as project
media — filename comes from the `badge` field, a missing file renders a labelled placeholder, and
adding the image swaps it in with no code change. The folder README lists all eleven expected
filenames and notes that transparent PNGs are required (a white background would show as a bright
block against the dark frame).

### 6.4 Contact

The closing section, and — since there is no résumé PDF — the one that has to actually convert. It
states availability plainly and gives three ways to reach out, nothing more.

Built as a `.card-shell` / `.card-core` double bezel on `#070707`, centered, max-width 760.

```
                        micro-label   ── OPEN TO WORK ──

                  Let's build something together.        ← claim, Outfit 900
                                                            clamp(1.35rem, 3.2vw, 2.25rem)
        Open to software and AI engineering roles.
        Taguig +2 · On-site · Hybrid · Remote            ← small-copy, muted

        ┌──────────────────────────────────────────┐
        │  ✉  francisdanielgenese@gmail.com        │    ← primary, white pill
        └──────────────────────────────────────────┘
           ⬦ LinkedIn          ⬦ GitHub                 ← ghost pills
```

| Channel | Value | Treatment |
|---|---|---|
| Email | `francisdanielgenese@gmail.com` | Primary CTA — white pill, `mailto:` |
| LinkedIn | `linkedin.com/in/francis-daniel-genese-141294170` | Ghost pill, new tab |
| GitHub | `github.com/Mizunandayo` | Ghost pill, new tab |

**No contact form.** A form needs a backend service, can silently fail, and gives a recruiter one
more step than a `mailto:`. The email is published in plain text and as a link — it also makes the
address scrapeable by the ATS parsers that read these pages.

Pill styling is Mitsu's hero CTA pair, verbatim: white `#ffffff` on `#050505` for primary
(hover → `opacity: 0.86`), and `1px rgba(255,255,255,0.18)` + `rgba(255,255,255,0.04)` +
`blur(8px)` for ghost (hover → border `0.32`, text `#fff`).

All three values live in `profile.js` and are reused by the footer, the JSON-LD `Person` block, and
the nav CTA — declared once, never duplicated.

---

## 7. Case-study deck template

One component, `<ProjectDeck project={…} />`, rendered for all nine routes. Sections render
conditionally — a project with no architecture data simply omits that block.

| # | Block | Source field | Renders if |
|---|---|---|---|
| 1 | Deck hero | `name, kanji, event, role, duration, tagline, links, stats` | always |
| 2 | Overview | `summary` | always |
| 3 | Highlights | `highlights[]` | always |
| 4 | Architecture | `architecture[]` | present |
| 5 | Tech stack | `stack[]` | always |
| 6 | Media gallery | `media[]` | always (placeholders) |
| 7 | Links | `links[]` | always |
| 8 | Prev / next | derived from order | always |

**Deck hero** reuses `.hero-strip` for the event line —
`GOOGLE CLOUD RAPID AGENT HACKATHON /// GITLAB /// 8 DAYS` — then the wordmark
(`MINARI 実成`), tagline, link pills, and a 4-cell stat bar.

**Highlights** map to Mitsu's `.arch-jstep` journey rows: a large ghosted step number
(`rgba(228,228,231,0.14)`, 2rem, weight 800) in a 52px column, headline + description beside it.
The LinkedIn bullets already read as ordered steps, so this fits without rewriting.

**Tech stack** maps to `.stack-layer` — 190px uppercase category column, wrapping `.si` cards.
This is a **1:1 fit**: the LinkedIn entries are already grouped as *Core Languages · AI & SDKs ·
Backend & Infrastructure · Development Ecosystem*, which is exactly the layer model Mitsu uses.

**Media gallery** — `ImagePlaceholder` / `YouTubePlaceholder` from `components/shared/`. Real files
dropped into `public/work/<slug>/` are picked up with no code change.

---

## 8. Data model

Single source of truth: [src/data/projects.js](src/data/projects.js). Every deck, the work grid,
prev/next, the sitemap, and prerender routes all derive from this array.

```js
{
  slug:      'minari',
  name:      'Minari',
  kanji:     '実成',
  tagline:   'Autonomous flaky-test resolution for GitLab',
  event:     'Google Cloud Rapid Agent Hackathon — GitLab',
  role:      'Solo Developer',
  duration:  '8 days',
  period:    { start: '2026-05', end: '2026-06' },
  award:     null,              // '🥈 1st Runner-Up' | '🥉 2nd Runner-Up' | null
  featured:  true,

  summary:   '…2–3 sentences, ≤ 58ch column…',

  highlights: [
    { headline: 'Autonomous detect → repair → verify loop',
      body:     '…', tech: 'LangGraph · Gemini 2.5 Pro' },
  ],

  architecture: [                            // optional
    { stage: 'perceive', accent: 'cyan',    name: 'Flakiness detection', detail: '…' },
    { stage: 'reason',   accent: 'violet',  name: 'Root cause analysis', detail: '…' },
    { stage: 'act',      accent: 'emerald', name: 'Patch + CI verify',   detail: '…' },
  ],

  stack: [
    { category: 'Core Languages', note: '', items: [
        { name: 'Python', ver: '3.12' }, { name: 'TypeScript' } ] },
    { category: 'AI & SDKs', items: [
        { name: 'LangGraph' }, { name: 'Gemini 2.5 Pro' }, { name: 'MCP Adapters' } ] },
  ],

  stats: [
    { num: '2', lbl: 'Model routing tiers' },
    { num: 'SSE', lbl: 'Live agent reasoning' },
  ],

  media: [
    { src: 'app.png', cap: 'Agent run view', ratio: '16:9' },
    { yt:  'ndJ8cZIg4cM', cap: 'Video presentation' },
  ],

  links: [
    { kind: 'demo',    label: 'Web App',    url: 'https://minari-eight.vercel.app/' },
    { kind: 'repo',    label: 'Repository', url: 'https://github.com/Mizunandayo/minari' },
    { kind: 'video',   label: 'Presentation', url: 'https://youtube.com/watch?v=ndJ8cZIg4cM' },
    { kind: 'devpost', label: 'DevPost',    url: '…' },
  ],

  meta: { title: '…', description: '…', ogImage: '/og/minari.png' },
}
```

Sibling data files: [src/data/profile.js](src/data/profile.js) (identity, about, skills, contact),
[src/data/awards.js](src/data/awards.js), [src/data/certifications.js](src/data/certifications.js),
[src/data/experience.js](src/data/experience.js).

---

## 9. Content inventory

### 9.1 Projects — 9

| Slug | Name | Event | Period | Award |
|---|---|---|---|---|
| `mitsu` | Mitsu 見つ | OpenAI Build Week — Apps for Your Life | Jul 2026 · 8d | — |
| `minari` | Minari 実成 | Google Cloud Rapid Agent Hackathon — GitLab | May–Jun 2026 · 8d | — |
| `misaki` | Misaki 見先 | Web Data UNLOCKED — Security & Compliance | May–Jun 2026 · 7d | — |
| `mirai` | Mirai ミライ | Transforming Enterprise Through AI — Robotics | May 2026 · 8d | — |
| `miwa` | Miwa 美話 | AMD Developer Hackathon — Agentic Workflows | May 2026 · 7d | — |
| `bacsal` | Bacsal Consultancy | Internship — Lead Junior SE | Jan–Apr 2026 | — |
| `galactic-conquest` | Galactic Conquest | RAITE 2025 | Oct 2025 | 🥉 2nd Runner-Up |
| `hirna` | HirNa! | Byteforward — Final Pitch | Jun–Oct 2025 | 🥈 1st Runner-Up |
| `eye2wear` | Eye2Wear | Full-stack clinic system | Feb–Oct 2025 | — |

### 9.2 Awards — 7

lablab.ai ×3 (Transforming Enterprise Through AI, Web Data UNLOCKED, AMD Developer — all Jun 2026) ·
KadaKareer HacKada AI in UX for Fintech (Dec 2025) · Byteforward Final Pitch (Oct 2025) ·
🥉 RAITE 2025 (Oct 2025) · 🥈 Byteforward 1st Runner-Up (Jun 2025).

*Homie* (KadaKareer) was a qualification-round **concept**, not a build. It stays an award line and
gets no deck — the Work grid holds shipped projects only.

### 9.3 Certifications — 11

Certiport ×5 · Microsoft ×4 · Cisco ×1 · PMI ×1. All credential IDs are in the source LinkedIn text
and go into `certifications.js` verbatim.

### 9.4 Experience & education

**Junior Software Engineer** — Bacsal Business Consultancy, Internship, Jan–Apr 2026 (4 mos),
Mariveles, Bataan, Hybrid.
**Bataan Peninsula State University** — Network and Web Application, Dec 2022 – Jul 2026.

### 9.5 Content gaps to fill

- Architecture data exists in prose for `mitsu`, `minari`, `misaki`, `mirai`, `miwa`. The other four
  will render without the architecture block unless written.
- OG images (`/og/<slug>.png`, 1200×630) — generate from a template, dark canvas + wordmark + kanji.
- Project screenshots — [public/work/](public/work/), filenames in that folder's README.
- Certification badges — [public/certs/](public/certs/), 11 square transparent PNGs. Downloadable
  from Credly (Microsoft, Cisco, PMI) and Certiport; filenames in that folder's README.

---

## 10. Project structure

As built:

```
mizuportfolio/
├── Mizu.md
├── index.html                      ← <!--app-head--> / <!--app-html--> slots
├── package.json  vite.config.js  tailwind.config.js  postcss.config.js
├── vercel.json
├── scripts/
│   ├── prerender.js                ← 10 routes + 404 + sitemap + robots
│   ├── gen-icons.mjs               ← simple-icons → src/data/icons.js
│   └── find-slug.mjs               ← dev helper: search simple-icons
├── public/
│   ├── og/                         ← 1200×630, one per route
│   ├── certs/                      ← 11 badge PNGs + README (filenames listed)
│   └── work/<slug>/                ← 9 dirs + README on the drop-in convention
└── src/
    ├── main.jsx                    ← hydrateRoot when prerendered, createRoot in dev
    ├── entry-server.jsx            ← StaticRouter + renderToString
    ├── App.jsx                     ← routes, skip link, ScrollManager
    ├── seo.js                      ← metaFor() / headFor(), shared runtime + build
    ├── index.css                   ← Mitsu base + -mizu additions
    ├── data/
    │   ├── projects.js             ← 9 projects + ORDERED / siblings / ROUTES
    │   ├── icons.js                ← GENERATED — do not hand-edit
    │   ├── profile.js  stack.js  awards.js
    │   └── certifications.js  experience.js
    ├── hooks/useScrollReveal.jsx   ← Mitsu's, + no-IntersectionObserver fallback
    ├── components/
    │   ├── Nav.jsx  Footer.jsx  Seo.jsx
    │   ├── home/    Hero · About · Work · Experience ·
    │   │            Stack · Awards · Certifications · Contact
    │   ├── deck/    DeckHero.jsx · blocks.jsx
    │   └── shared/  primitives.jsx · placeholders.jsx ·
    │                Backdrop.jsx · TechIcon.jsx
    └── pages/       Home.jsx · Project.jsx · NotFound.jsx
```

`SectionShell` earns its place: nine home sections and eight deck blocks share the
`py-32 / max-w-[1100px] / eyebrow → claim → copy` skeleton. One component, not seventeen copies.

**Two deviations from the plan above**, both consolidation rather than change:

- `shared/` is three files, not six — `primitives.jsx` (SectionShell, MicroLabel, Rule, StatBar,
  Pill, Chip, Layers, icons), `placeholders.jsx`, `Backdrop.jsx`. Six files averaging 30 lines was
  more ceremony than the code justified.
- `deck/` is two files, not eight — `DeckHero.jsx` plus `blocks.jsx` holding the seven body blocks.
  They are only ever composed together by `pages/Project.jsx`.

`data/stack.js` was added: the Stack section needs a curated aggregate, because a raw union of every
`projects.js` entry runs to ~120 items and reads as noise.

---

## 11. Build, SEO, deploy

**Prerender.** After `vite build`, walk the route list from `projects.js` and emit static HTML per
route with correct `<title>`, description, canonical, and OG/Twitter tags. `<Seo>` sets tags at
runtime for client navigation; the prerender bakes them for crawlers and unfurlers.

**Also emitted:** `sitemap.xml`, `robots.txt`, `JSON-LD` — `Person` on home, `CreativeWork` per deck.

**Deploy:** Vercel, static output, `dist/`. No server runtime.

**Budgets:** JS ≤ 120 KB gzipped · LCP < 1.5s on 4G · Lighthouse ≥ 95 across all four categories.

---

## 12. Accessibility

The Mitsu system has three known gaps to fix, not inherit:

1. **`prefers-reduced-motion` is unhandled.** Add a global block disabling reveal transforms,
   `chip-f*` floats, `flow-pulse`, `landmark-breath`, and the hero entrance.
2. **Decorative canvas/SVG** — `StarField`, `PerspectiveGrid`, `RippleField` all need
   `aria-hidden="true"` (Mitsu does this correctly; keep it).
3. **Contrast.** `rgba(161,161,170,0.75)` on `#050505` lands near 4.3:1. Raise muted text to
   `0.85` alpha minimum for anything that isn't a label.

Plus: skip-to-content link, visible focus rings on the pill nav, real `<nav>`/`<main>`/`<article>`
landmarks, one `<h1>` per route, `alt` text sourced from `media[].cap`.

---

## 13. Build phases

| Phase | Deliverable |
|---|---|
| 0 | Scaffold: Vite + React + Tailwind, Mitsu's `index.css` + config ported, router mounted |
| 1 | `shared/` primitives — `SectionShell`, `MicroLabel`, `StatBar`, `Pill`, placeholders, `useScrollReveal` |
| 2 | `data/` — all five files populated from LinkedIn content |
| 3 | Home: Hero (+ `RippleField`), About, Work grid |
| 4 | Home: Experience, Stack, Awards, Certifications, Contact, Footer |
| 5 | `ProjectDeck` template + all 8 deck blocks; verify against all 9 projects |
| 6 | SEO — `<Seo>`, prerender, sitemap, JSON-LD, OG images |
| 7 | A11y pass, reduced-motion, Lighthouse, responsive audit at 360/768/1024/1440 |
| 8 | Deploy to Vercel |

---

## 14. Open questions

**Resolved 2026-08-01**

| Question | Answer |
|---|---|
| Contact method | Email `francisdanielgenese@gmail.com` + LinkedIn + GitHub. Mailto, no form. §6.4 |
| Résumé PDF | None. The portfolio is the résumé. §2 |
| Homie | Concept only, qualification round — award line, no deck. §9.2 |
| Eye2Wear period | Feb 2025 – Oct 2025. §9.1 |

**Still open**

1. **Domain.** Custom domain, or ship on `mizu-portfolio.vercel.app`? Not blocking — it's a Vercel
   setting that can change any time after launch. Worth deciding before OG images are generated, so
   the canonical URL baked into them is right.
