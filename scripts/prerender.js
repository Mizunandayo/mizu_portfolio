/* Build-time prerender.
   Renders every route to static HTML with its own head tags, so
   crawlers and link unfurlers get real content instead of an empty
   #root. Runs after both vite builds — see package.json "build". */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root    = path.resolve(__dirname, '..')
const dist    = path.join(root, 'dist')
const distSsr = path.join(root, 'dist-ssr')

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf-8')

const serverEntry = pathToFileURL(path.join(distSsr, 'entry-server.js')).href
const { render, routes } = await import(serverEntry)

const SITE_URL = 'https://mizu-portfolio.vercel.app'

let written = 0

for (const url of routes) {
  const { html, head } = render(url)

  const page = template
    .replace('<!--app-head-->', head)
    .replace('<!--app-html-->', html)

  const outDir = url === '/' ? dist : path.join(dist, url)
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'index.html'), page)

  written++
  console.log(`  prerendered  ${url}`)
}

/* 404 — rendered through the same pipeline so it is in-theme. */
{
  const { html, head } = render('/404')
  const page = template.replace('<!--app-head-->', head).replace('<!--app-html-->', html)
  fs.writeFileSync(path.join(dist, '404.html'), page)
  console.log('  prerendered  /404')
}

/* sitemap.xml */
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `  <url>
    <loc>${SITE_URL}${r === '/' ? '/' : r}</loc>
    <changefreq>monthly</changefreq>
    <priority>${r === '/' ? '1.0' : '0.8'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap)

/* robots.txt */
fs.writeFileSync(
  path.join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
)

console.log(`\n  ${written} routes prerendered + sitemap.xml + robots.txt\n`)
