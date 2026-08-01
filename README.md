<div align="center">

# Mizu 水

**Personal engineering portfolio — Francis Daniel Genese**

Software Engineer · AI Engineer
Agentic AI · LLM Applications · Intelligent Systems

</div>

---

Nine shipped projects across agentic AI, computer vision, robotics simulation and full-stack
platforms — five of them built solo in eight days or less for international hackathons.

`Mizu` (水, water) is the house mark for a family of projects that all flow from it: **Mi**tsu,
**Mi**nari, **Mi**saki, **Mi**rai, **Mi**wa.

## Stack

Vite 5 · React 18 · Tailwind CSS 3 · React Router 6 — prerendered to static HTML at build time.

No CMS, no UI framework, no animation library. Motion is hand-rolled CSS keyframes driven by
`IntersectionObserver`; the only runtime dependencies are `react`, `react-dom` and
`react-router-dom`.

## Commands

```bash
npm install

npm run dev        # dev server with HMR        → localhost:5173
npm run build      # client + SSR + prerender   → dist/
npm run preview    # serve the built output     → localhost:4173

npm run icons      # regenerate tech icons from simple-icons
```

`npm run build` runs three steps: the client bundle, an SSR bundle, then
[`scripts/prerender.js`](scripts/prerender.js), which renders every route to static HTML with its
own `<title>`, description, canonical URL, OG/Twitter tags and JSON-LD — plus `sitemap.xml`,
`robots.txt` and a themed `404.html`.

## Structure

```
src/
├── data/          single source of truth — projects, profile, stack,
│                  awards, certifications, experience, icons
├── components/
│   ├── home/      Hero · About · Work · Experience · Stack ·
│   │              Awards · Certifications · Contact
│   ├── deck/      case-study template, rendered for all nine projects
│   └── shared/    SectionShell, StatBar, Pill, placeholders, TechIcon
├── pages/         Home · Project · NotFound
├── seo.js         route metadata, shared by runtime and prerender
└── index.css      design system
```

Everything on the site derives from [`src/data/projects.js`](src/data/projects.js) — the work grid,
the nine case-study routes, prev/next navigation, the sitemap and the prerender route list. Adding
a project means adding one array entry.

## Design

A dark, Swiss-industrial system: `#050505` canvas with a fixed film-grain overlay, Poppins for text
and Outfit for display, monospace for specs and labels, and a single easing curve
(`cubic-bezier(0.16, 1, 0.3, 1)`) across every transition.

Colour is disciplined. It appears in exactly two places: **architecture stage accents** on case-study
pages (cyan = perceive, violet = reason, emerald = deterministic path, blue = transport) and
**technology brand marks** in the stack list. Nothing else on the site is coloured — projects are
distinguished by typography and a kanji glyph, never by a signature colour.

Full design documentation, decision record and build phases: **[Mizu.md](Mizu.md)**.

## Assets

Images use a drop-in convention — a missing file renders a labelled placeholder, and adding the file
swaps it in with no code change.

| Folder | Contents |
|---|---|
| [`public/work/<slug>/`](public/work/) | Project screenshots — see that folder's README |
| [`public/certs/`](public/certs/) | Certification badges, square transparent PNGs |
| `public/og/` | Open Graph cards, 1200×630, one per route |

## Accessibility

Skip-to-content link, one `<h1>` per route, semantic landmarks, visible focus rings, and a full
`prefers-reduced-motion` block that stops every self-running animation.

## Contact

**francisdanielgenese@gmail.com**
[LinkedIn](https://www.linkedin.com/in/francis-daniel-genese-141294170) ·
[GitHub](https://github.com/Mizunandayo)
