import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

/* ── Ticket art ────────────────────────────────────
   The greeting's stub slideshow, read off disk at
   build time instead of counted by hand.

   It has to be a plugin because the files live in
   public/, which Vite copies verbatim and never puts
   in the module graph — import.meta.glob cannot see
   them, and globbing them in would emit a second,
   hashed copy of every one.

   Enumerating rather than assuming a range also fixes
   the extension: gc4, gc12 and gc13 are PNGs among
   otherwise JPEG files, so any hardcoded `.jpg` run
   silently 404s on those three. */
const EXT = 'jpe?g|png|webp|avif|gif'

/* Each entry: the virtual module, the folder, and the filename stem it
   accepts. The stem is anchored and numbered, so anything else parked
   in the folder is not picked up, and the sort is numeric — otherwise
   gc10 lands between gc1 and gc2. */
const SETS = [
  { id: 'virtual:ticket-art', dir: 'public/profile/tickets', stem: 'gc', url: '/profile/tickets' },
  { id: 'virtual:game-art', dir: 'public/profile/games', stem: 'game', url: '/profile/games' },
  /* One file rather than a numbered run: the arcade's backdrop. Found
     on disk instead of named in CSS, so there is no path to mistype
     and no extension to guess — drop bg.jpg, bg.png or bg.gif in
     beside the covers and it is picked up. */
  { id: 'virtual:game-bg', dir: 'public/profile/games', stem: 'bg', url: '/profile/games', single: true },
]

function scan({ dir, stem, url, single }) {
  const abs = fileURLToPath(new URL('./' + dir, import.meta.url))
  /* The folder may not exist yet — an empty set is a section with
     nothing in it, not a build failure. */
  if (!fs.existsSync(abs)) return single ? null : []

  if (single) {
    const one = new RegExp(`^${stem}\\.(${EXT})$`, 'i')
    /* Sorted, not first-found: readdir order is the filesystem's own
       and differs between machines, so bg.jpg and bg.png both sitting
       there would pick a different one on someone else's box. */
    const hits = fs.readdirSync(abs).filter((f) => one.test(f)).sort()
    if (hits.length > 1) {
      console.warn(
        `\n  [${stem}] ${hits.length} candidates in ${dir}: ${hits.join(', ')}` +
        `\n  Using ${hits[0]}. Delete the others to be sure of which you get.\n`
      )
    }
    return hits[0] ? `${url}/${hits[0]}` : null
  }

  const re = new RegExp(`^${stem}(\\d+)\\.(${EXT})$`, 'i')
  return fs
    .readdirSync(abs)
    .map((f) => [f, re.exec(f)])
    .filter(([, m]) => m)
    .sort((a, b) => Number(a[1][1]) - Number(b[1][1]))
    .map(([f, m]) => ({ n: Number(m[1]), src: `${url}/${f}` }))
}

function mediaSets() {
  const abs = (s) => fileURLToPath(new URL('./' + s.dir, import.meta.url))
  return {
    name: 'mizu-media-sets',
    resolveId: (id) => (SETS.some((s) => s.id === id) ? '\0' + id : null),
    load(id) {
      const set = SETS.find((s) => '\0' + s.id === id)
      if (!set) return null
      const rows = scan(set)
      /* Three shapes off the one scan: a lone url for the backdrop,
         plain urls for the ticket slides, and numbered rows for the
         covers so each can be paired with a name. */
      if (set.single) return `export default ${JSON.stringify(rows)}`
      return set.stem === 'gc'
        ? `export default ${JSON.stringify(rows.map((r) => r.src))}`
        : `export default ${JSON.stringify(rows)}`
    },
    configureServer(server) {
      for (const s of SETS) server.watcher.add(abs(s))
      const reload = (file) => {
        const hit = SETS.find((s) => file.startsWith(abs(s)))
        if (!hit) return
        const mod = server.moduleGraph.getModuleById('\0' + hit.id)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', reload)
      server.watcher.on('unlink', reload)
    },
  }
}

export default defineConfig({
  plugins: [react(), mediaSets()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
