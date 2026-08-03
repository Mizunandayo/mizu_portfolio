/* ══════════════════════════════════════════════════
   Project gallery media — discovered, not declared.

   The same mechanism the hackathon galleries use, for
   the same reason: a browser cannot list a directory,
   so a hand-written array drifts the moment a file is
   added or removed. Vite's import.meta.glob resolves
   the folders at build time instead — whatever sits in
   src/assets/work/<slug>/ is exactly what renders.

   Drop p1 … p10 into the folder. Five files show five
   panels; ten show ten; none falls back to whatever the
   project declared. No 404 probing, no data edit.

   Living under src/assets rather than public/ is what
   makes this possible: public/ is copied verbatim and
   never enters the module graph. The files also get
   content-hashed for caching as a result.
   ══════════════════════════════════════════════════ */

/* Ten is the ceiling. Anything numbered past it is ignored rather than
   silently making a dialog scroll forever. */
export const MAX_SHOTS = 10

/* Narrowed to `p*` so a stray desktop.ini or a spare screenshot in the
   folder is never pulled into the bundle. `eager` imports every match,
   so anything the pattern lets through ships whether it renders or not.

   The ceiling is still enforced below rather than in the pattern —
   spelling ten alternatives into the brace list would multiply against
   the ten extensions for no gain, and p11 is a naming mistake worth
   ignoring quietly. */
const FILES = import.meta.glob(
  '../assets/work/*/p*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,avif,AVIF}',
  { eager: true, query: '?url', import: 'default' }
)

/* p2 must precede p10 — comparing the stems as strings would not. */
const indexOf = (stem) => {
  const m = /^p(\d{1,2})$/i.exec(stem)
  return m ? Number(m[1]) : Number.POSITIVE_INFINITY
}

const BY_SLUG = (() => {
  const out = {}

  for (const [filePath, url] of Object.entries(FILES)) {
    const m = filePath.match(/\/work\/([^/]+)\/([^/]+)\.[^.]+$/)
    if (!m) continue
    const [, slug, stem] = m
    const n = indexOf(stem)
    /* Anything not named pN, or numbered past the ceiling, is skipped —
       a stray desktop.ini or p11 never reaches the gallery. */
    if (!Number.isFinite(n) || n < 1 || n > MAX_SHOTS) continue
    ;(out[slug] ||= []).push({ stem, url, n })
  }

  for (const slug of Object.keys(out)) {
    out[slug].sort((a, b) => a.n - b.n)
    out[slug] = out[slug].slice(0, MAX_SHOTS)
  }

  return out
})()

/** Every gallery image present for a project, in p1 … p10 order.
 *  `captions` maps a stem to its alt text; anything unnamed falls back
 *  to a positional label. */
export function shotsFor(slug, captions = {}) {
  return (BY_SLUG[slug] || []).map((f, i) => ({
    key: f.stem,
    url: f.url,
    cap: captions[f.stem] ?? `Screen ${i + 1}`,
  }))
}

/** Folders that actually hold something, for tooling and checks. */
export const SHOT_FOLDERS = Object.keys(BY_SLUG).sort()

/** Total files discovered — handy for verification. */
export const SHOT_COUNT = Object.values(BY_SLUG).reduce((n, a) => n + a.length, 0)
