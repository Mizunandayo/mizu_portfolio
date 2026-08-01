/* ══════════════════════════════════════════════════
   Hackathon media — discovered, not declared.

   A browser cannot list a directory, so the old model
   was a hand-written `media` array per entry. That
   drifts the moment a photo is added: 41 files were on
   disk while the data named 16, and the rest simply
   never rendered.

   Vite's import.meta.glob resolves the folders at build
   time instead. Whatever is in
   src/assets/hackathons/<id>/ is what shows — add a
   file and it appears, remove one and it disappears,
   with no data edit and no wasted 404 probing.

   Living under src/assets rather than public/ is what
   makes this possible: public/ is copied verbatim and
   never enters the module graph. The trade is worth it
   — files also get content-hashed for caching.
   ══════════════════════════════════════════════════ */

const FILES = import.meta.glob(
  '../assets/hackathons/*/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,avif,AVIF}',
  { eager: true, query: '?url', import: 'default' }
)

/* `cover` always leads; the rest sort numerically, so 02 precedes 10
   rather than sorting as a string. Anything unrecognised sinks. */
const rank = (stem) => {
  if (stem.toLowerCase() === 'cover') return -1
  const n = Number(stem)
  return Number.isFinite(n) ? n : 9999
}

const BY_FOLDER = (() => {
  const out = {}
  for (const [filePath, url] of Object.entries(FILES)) {
    const m = filePath.match(/\/hackathons\/([^/]+)\/([^/]+)\.[^.]+$/)
    if (!m) continue
    const [, id, stem] = m
    ;(out[id] ||= []).push({ stem, url })
  }
  for (const id of Object.keys(out)) {
    out[id].sort((a, b) => rank(a.stem) - rank(b.stem) || a.stem.localeCompare(b.stem))
  }
  return out
})()

/** Every image present for a hackathon, cover first.
 *  `captions` maps a filename stem to its alt text; anything unnamed
 *  falls back to a positional label. */
export function mediaFor(id, captions = {}) {
  return (BY_FOLDER[id] || []).map((f, i) => ({
    key: f.stem,
    url: f.url,
    cap: captions[f.stem] ?? (f.stem === 'cover' ? 'Cover' : `Image ${i + 1}`),
  }))
}

/** Folders that exist, for tooling and checks. */
export const MEDIA_FOLDERS = Object.keys(BY_FOLDER).sort()

/** Total files discovered — handy for verification. */
export const MEDIA_COUNT = Object.values(BY_FOLDER).reduce((n, a) => n + a.length, 0)
