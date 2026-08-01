/* Generates src/data/icons.js from simple-icons.
   simple-icons is a devDependency — only the ~60 paths actually used get
   emitted, so nothing from the package reaches the runtime bundle.

   Run: npm run icons   (after editing NAME_TO_SLUG or src/data/stack.js) */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as si from 'simple-icons'
import { STACK } from '../src/data/stack.js'
import { PROJECTS } from '../src/data/projects.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(__dirname, '../src/data/icons.js')

/* Brand-mark lookup. null = deliberately no brand mark; the component
   falls back to a category glyph. */
const NAME_TO_SLUG = {
  /* Languages */
  'TypeScript': 'typescript', 'JavaScript': 'javascript', 'Python': 'python',
  'Rust': 'rust', 'HTML': 'html5', 'CSS': 'css', 'SCSS': 'sass',

  /* Added from the published project stack pages.
     null = confirmed absent from simple-icons, falls back to a glyph. */
  'CrewAI': 'crewai', 'Qwen2.5 72B': 'qwen', 'Vercel AI SDK': 'vercel',
  'Gemini 2.0 Flash': 'googlegemini',
  'AMD MI300X': 'amd', 'ROCm': null, 'TensorFlow Lite': 'tensorflow',
  'gpt-4o-mini-transcribe': null, 'edge-tts': null, 'Google Translate': 'googletranslate',
  'sounddevice': null, 'One Euro Filter': null, 'FABRIK': null,
  'Three.js': 'threedotjs', 'NumPy': 'numpy',
  'Material UI': 'mui', 'Zustand': null, 'Immer': 'immer',
  'D3.js': 'd3', 'React Simple Maps': null,
  'Lucide': 'lucide', 'Prism': null,
  'Pydantic': 'pydantic', 'SQLAlchemy': 'sqlalchemy', 'Alembic': null,
  'asyncpg': null, 'Celery': 'celery', 'sse-starlette': null,
  'HMAC': null, 'slowapi': null, 'defusedxml': null, 'SHA-256': null,
  'structlog': null, 'Sentry': 'sentry',
  'uv': 'uv', 'Hatchling': null, 'python-dotenv': 'dotenv',

  /* AI & agents.
     simple-icons carries no OpenAI, Langfuse, Valibot, tree-sitter or
     React Flow mark — those fall through to a category glyph. */
  'LangGraph': 'langgraph', 'LangChain': 'langchain',
  'MCP Adapters': 'modelcontextprotocol', 'OpenAI': null,
  'Gemini 2.5': 'googlegemini', 'Llama 3.3 70B': 'meta',
  'vLLM': 'vllm', 'Langfuse': null, 'pgvector': 'postgresql', 'Qdrant': 'qdrant',

  /* Frontend */
  'React': 'react', 'Next.js': 'nextdotjs', 'Vite': 'vite', 'Tailwind CSS': 'tailwindcss',
  'shadcn/ui': 'shadcnui', 'Radix UI': 'radixui', 'Framer Motion': 'framer',
  'GSAP': 'greensock', 'React Three Fiber': 'threedotjs', 'Jotai': null, 'Tauri': 'tauri',

  /* Backend */
  'FastAPI': 'fastapi', 'Node.js': 'nodedotjs', 'Express': 'express', 'Prisma': 'prisma',
  'NextAuth': null, 'Socket.IO': 'socketdotio',
  'Server-Sent Events': null, 'WebSocket': null,

  /* Data & infrastructure */
  'PostgreSQL': 'postgresql', 'MongoDB': 'mongodb', 'Redis': 'redis',
  'Supabase': 'supabase', 'Firebase': 'firebase', 'Docker': 'docker',
  'Google Cloud Run': 'googlecloud', 'Vercel': 'vercel', 'Railway': 'railway',
  'Cloudinary': 'cloudinary',

  /* CV & physics */
  'MediaPipe': 'mediapipe', 'OpenCV': 'opencv', 'Rapier WASM': 'webassembly', 'MuJoCo': null,

  /* Security & quality */
  'JWT': 'jsonwebtokens', 'Google OAuth': 'google', 'Valibot': null,
  'CSP / HSTS': null, 'Rate limiting': null,
  'pytest': 'pytest', 'Vitest': 'vitest', 'Ruff': 'ruff', 'Black': 'black', 'ESLint': 'eslint',

  /* Tooling */
  'Git': 'git', 'GitHub': 'github', 'GitLab': 'gitlab', 'Postman': 'postman',
  'Puppeteer': 'puppeteer', 'tree-sitter': null,

  /* Extra names that appear only in per-project stacks */
  'Node.js ': 'nodedotjs',
  'Gemini 2.5 Pro': 'googlegemini', 'Gemini 2.5 Flash': 'googlegemini',
  'Gemini': 'googlegemini', 'gemini-embedding-001': 'googlegemini',
  'OpenAI Whisper': null, 'OpenAI transcription': null,
  'GPT-5.6 Responses API': null, 'Codex': null, 'AI/ML API': null,
  '@google/generative-ai': 'googlegemini', 'google-generativeai': 'googlegemini',
  'Express.js': 'express', 'Tailwind CLI': 'tailwindcss', 'npm': 'npm',
  'Firebase Hosting': 'firebase', 'Cloud Firestore': 'firebase',
  'Firebase Auth': 'firebase', 'Firebase Storage': 'firebase',
  'Firebase Analytics': 'firebase', 'Firebase Cloud Functions': 'firebase',
  'Firebase CLI': 'firebase', 'Firebase Emulator Suite': 'firebase',
  'Google Maps JS API': 'googlemaps', 'Google Places API': 'googlemaps',
  'Material UI': 'mui', 'Radix UI ': 'radixui', 'Axios': 'axios',
  'MongoDB Atlas': 'mongodb', 'Upstash Redis': 'upstash', 'Docker ': 'docker',
  'Google Cloud Run ': 'googlecloud', 'Secret Manager': 'googlecloud',
  'GitLab MCP': 'gitlab', 'Nodemon': 'nodemon', 'Vitest ': 'vitest',
  'React Flow': null, 'Jinja2': 'jinja', 'Qdrant ': 'qdrant',
  'discord.js': 'discorddotjs', 'Tauri ': 'tauri', 'SQLite': 'sqlite',
  'Nodemailer': null, 'Puppeteer ': 'puppeteer', 'MediaPipe Hand Landmarker': 'mediapipe',
  'PySide6': 'qt', 'pywin32': null, 'Ruff ': 'ruff',
  'ApexCharts': null, 'Recharts': null, 'jsPDF': null, 'html2canvas': null,
  'Multer': null, 'WeasyPrint': null, 'Bright Data MCP Server': null,
  'Web Unlocker': null, 'SERP API': null, 'Web Scraper API': null,
  'Scraping Browser': null, 'Langfuse ': null, 'LangChain ': 'langchain',
  'Farcaster SDK': 'farcaster', 'MiniKit': 'coinbase', 'Smart Contracts': null,
  'Rapier WASM ': 'webassembly', 'MuJoCo ': null, 'vLLM ': 'vllm',
  'Llama 3.3 70B ': 'meta', 'Edge-TTS': null, 'pykakasi': null,
  'CrewAI-style pipeline': 'crewai', 'AMD Developer Cloud': 'amd',
  'One Euro filtering': null, 'Mixed-DPI desktop geometry': null,
  'Prisma ORM': 'prisma', 'Valibot ': null, 'ESLint ': 'eslint',
  'Postman ': 'postman', 'shadcn/ui ': 'shadcnui', 'GSAP ': 'greensock',
  'Framer Motion ': 'framer', 'tree-sitter ': null,
  'Server-Sent Events ': null, 'PostgreSQL ': 'postgresql', 'pgvector ': 'postgresql',
  'Redis ': 'redis', 'Supabase ': 'supabase', 'Vercel ': 'vercel',
  'Railway ': 'railway', 'Cloudinary ': 'cloudinary', 'JWT ': 'jsonwebtokens',
  'Google OAuth ': 'google', 'Gmail API': 'gmail', 'PhilSMS API': null,
  'Mapbox': 'mapbox', 'Socket.IO ': 'socketdotio', 'LocalStorage': null,
  'APIs': null, 'CORS': null, 'node-fetch': 'nodedotjs',
  'Rev21Labs Sentiment API': null, 'Vanilla JavaScript': 'javascript',
  'Git ': 'git', 'GitHub ': 'github', 'React ': 'react', 'Vite ': 'vite',
  'Next.js ': 'nextdotjs', 'FastAPI ': 'fastapi', 'Jotai ': null,
  'Tailwind CSS ': 'tailwindcss', 'pytest ': 'pytest', 'OpenCV ': 'opencv',
  'WebSocket ': null, 'Docker  ': 'docker', 'Python ': 'python',
  'TypeScript ': 'typescript', 'JavaScript ': 'javascript',
  'HTML ': 'html5', 'CSS ': 'css', 'SCSS ': 'sass', 'Jinja': 'jinja',
}

/* ══════════════════════════════════════════════════
   Brand colour, made visible on #050505.

   simple-icons ships each brand's real hex. Used raw,
   a lot of them disappear on this canvas: Next.js,
   Vercel, Express, shadcn/ui, Socket.IO, MCP, JWT and
   GitHub are all black or near-black, and css, ESLint
   and Cloudinary are dark saturated blues/purples.

   So: keep the hue, raise the lightness until the mark
   clears a contrast floor against the page. Brands with
   no hue to keep (black, white, grey) become light zinc
   — the same convention GitHub uses for its own mark on
   dark backgrounds.
   ══════════════════════════════════════════════════ */

const BG_LUM = 0.001517          // #050505
const MIN_CONTRAST = 3.6         // icons are small; be generous
const NEUTRAL = 'E4E4E7'         // zinc-200, for achromatic brands
const MAX_L = 0.74               // don't wash saturated brands out to pastel

const srgbToLinear = (v) => {
  v /= 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

const luminance = ([r, g, b]) =>
  0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)

const contrast = (rgb) => (luminance(rgb) + 0.05) / (BG_LUM + 0.05)

const hexToRgb = (hex) => [
  parseInt(hex.slice(0, 2), 16),
  parseInt(hex.slice(2, 4), 16),
  parseInt(hex.slice(4, 6), 16),
]

const rgbToHex = ([r, g, b]) =>
  [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h, s, l]
}

function hslToRgb([h, s, l]) {
  if (s === 0) return [l * 255, l * 255, l * 255]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const f = (t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255]
}

function visibleColor(hex) {
  const rgb = hexToRgb(hex)
  const [h, s, l] = rgbToHsl(rgb)

  /* No meaningful hue — black, white, greys. Render light zinc. */
  if (s < 0.15) return NEUTRAL

  if (contrast(rgb) >= MIN_CONTRAST) return hex.toUpperCase()

  /* Walk lightness up, holding hue and saturation. */
  let lift = l
  while (lift < MAX_L) {
    lift += 0.02
    const candidate = hslToRgb([h, s, lift])
    if (contrast(candidate) >= MIN_CONTRAST) return rgbToHex(candidate).toUpperCase()
  }
  return rgbToHex(hslToRgb([h, s, MAX_L])).toUpperCase()
}

/* ── Build the lookup ──────────────────────────── */
const bySlug = new Map()
for (const v of Object.values(si)) {
  if (v && typeof v === 'object' && v.slug && v.path) bySlug.set(v.slug, v)
}

/* Two surfaces render technology icons: the aggregate Stack section on
   the home page, and the per-project stack inside the project dialog.
   Both are covered by default — narrowing to the aggregate alone leaves
   every project-only name (Firebase Hosting, Axios, npm, …) falling
   through to a category glyph in the dialog.

   --stack-only trims to the home section if the bundle needs it back. */
const stackOnly = process.argv.includes('--stack-only')

const allNames = new Set([
  ...STACK.flatMap((g) => g.items.map((i) => i.name)),
  ...(stackOnly
    ? []
    : PROJECTS.flatMap((p) => p.stack.flatMap((g) => g.items.map((i) => i.name)))),
])

const icons = {}
const missing = []
const unresolved = []
const lifted = []
const neutralised = []

for (const name of [...allNames].sort()) {
  const slug = NAME_TO_SLUG[name]
  if (slug === null) { missing.push(name); continue }
  if (slug === undefined) { unresolved.push(name); continue }

  const icon = bySlug.get(slug)
  if (!icon) { unresolved.push(`${name} (slug "${slug}" not in simple-icons)`); continue }

  const original = icon.hex.toUpperCase()
  const color = visibleColor(icon.hex)

  if (color === NEUTRAL && original !== NEUTRAL) neutralised.push(`${name} (#${original})`)
  else if (color !== original) lifted.push(`${name} #${original} -> #${color}`)

  icons[name] = { p: icon.path, c: color }
}

/* ── Emit ──────────────────────────────────────── */
const body = Object.entries(icons)
  .map(([name, v]) => `  ${JSON.stringify(name)}: { c: '#${v.c}', p: '${v.p}' },`)
  .join('\n')

const out = `/* GENERATED FILE — do not edit by hand.
   Source: simple-icons (devDependency). Regenerate with \`npm run icons\`.

   name -> { c: brand colour, p: 24x24 SVG path data }

   Colours are the real brand hex, adjusted for legibility on the #050505
   canvas: hue and saturation are preserved, lightness is raised until the
   mark clears ${MIN_CONTRAST}:1 against the page. Brands with no hue to preserve
   (black, white, grey) render as ${NEUTRAL} — the same convention GitHub uses
   for its own mark on dark backgrounds. See scripts/gen-icons.mjs.

   ${Object.keys(icons).length} brand marks. Names absent here fall back to a
   category glyph in components/shared/TechIcon.jsx. */

export const ICONS = {
${body}
}
`

fs.writeFileSync(OUT, out)

console.log(`\n  wrote src/data/icons.js — ${Object.keys(icons).length} brand marks`)
console.log(`  ${missing.length} intentionally without a brand mark (category glyph fallback)`)

if (neutralised.length) {
  console.log(`\n  ACHROMATIC -> #${NEUTRAL} (${neutralised.length}) — no hue to preserve:`)
  neutralised.forEach((n) => console.log(`    ${n}`))
}
if (lifted.length) {
  console.log(`\n  LIGHTENED for contrast (${lifted.length}) — hue held, lightness raised:`)
  lifted.forEach((l) => console.log(`    ${l}`))
}
if (unresolved.length) {
  console.log(`\n  UNMAPPED (${unresolved.length}) — add to NAME_TO_SLUG:`)
  unresolved.forEach((u) => console.log(`    ${u}`))
}
console.log('')
