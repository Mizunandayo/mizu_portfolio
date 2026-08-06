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
const ART = 'virtual:ticket-art'
const DIR = fileURLToPath(new URL('./public/profile/tickets', import.meta.url))

/* gc<n> only, so anything else parked in the folder is not picked up
   as a slide, and numerically so gc2 sorts before gc10. */
const scan = () =>
  fs
    .readdirSync(DIR)
    .map((f) => [f, /^gc(\d+)\.(jpe?g|png|webp|avif|gif)$/i.exec(f)])
    .filter(([, m]) => m)
    .sort((a, b) => Number(a[1][1]) - Number(b[1][1]))
    .map(([f]) => `/profile/tickets/${f}`)

function ticketArt() {
  const resolved = '\0' + ART
  return {
    name: 'mizu-ticket-art',
    resolveId: (id) => (id === ART ? resolved : null),
    load: (id) => (id === resolved ? `export default ${JSON.stringify(scan())}` : null),
    configureServer(server) {
      server.watcher.add(DIR)
      const reload = (file) => {
        if (!file.startsWith(DIR)) return
        const mod = server.moduleGraph.getModuleById(resolved)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', reload)
      server.watcher.on('unlink', reload)
    },
  }
}

export default defineConfig({
  plugins: [react(), ticketArt()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
