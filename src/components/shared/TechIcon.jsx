import { ICONS } from '../../data/icons.js'

/* ══════════════════════════════════════════════════
   Technology icon.

   Brand marks and their colours come from
   src/data/icons.js (generated from simple-icons — run
   `npm run icons`). Colours are the real brand hex,
   lightness-corrected at build time so nothing
   disappears against #050505; see scripts/gen-icons.mjs.

   Anything without a brand mark — vLLM, tree-sitter,
   OpenAI, CSP/HSTS, Server-Sent Events — gets a stroked
   glyph chosen from its stack category, so no row ever
   renders an empty icon slot. Those stay neutral: they
   are categories, not brands, and inventing a colour
   for them would imply one.
   ══════════════════════════════════════════════════ */

/* Stroked fallbacks. Deliberately lighter than the solid brand
   silhouettes — they read as "category", not as a logo. */
const GLYPHS = {
  code: (
    <>
      <path d="M9.4 7.8 5.2 12l4.2 4.2" />
      <path d="M14.6 7.8 18.8 12l-4.2 4.2" />
      <path d="M13.4 5.4 10.6 18.6" />
    </>
  ),
  model: (
    <>
      <circle cx="5.5" cy="6.5" r="2" />
      <circle cx="5.5" cy="17.5" r="2" />
      <circle cx="18.5" cy="12" r="2" />
      <path d="M7.4 7.5 16.6 11.2" />
      <path d="M7.4 16.5 16.6 12.8" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.2 2.8 8 12 12.8 21.2 8 12 3.2Z" />
      <path d="M2.8 12.4 12 17.2l9.2-4.8" />
      <path d="M2.8 16.6 12 21.4l9.2-4.8" />
    </>
  ),
  server: (
    <>
      <rect x="3" y="4.5" width="18" height="6" rx="1.6" />
      <rect x="3" y="13.5" width="18" height="6" rx="1.6" />
      <path d="M6.9 7.5h.01" strokeWidth="2.4" />
      <path d="M6.9 16.5h.01" strokeWidth="2.4" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5.8" rx="7.8" ry="3" />
      <path d="M4.2 5.8v12.4c0 1.66 3.5 3 7.8 3s7.8-1.34 7.8-3V5.8" />
      <path d="M4.2 12c0 1.66 3.5 3 7.8 3s7.8-1.34 7.8-3" />
    </>
  ),
  vision: (
    <>
      <path d="M2.4 12S6 5.6 12 5.6 21.6 12 21.6 12 18 18.4 12 18.4 2.4 12 2.4 12Z" />
      <circle cx="12" cy="12" r="3.1" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.8 4.6 5.9v5.4c0 4.9 3.2 8.7 7.4 10.4 4.2-1.7 7.4-5.5 7.4-10.4V5.9L12 2.8Z" />
      <path d="M9 11.9l2.2 2.2 4.2-4.4" />
    </>
  ),
  terminal: (
    <>
      <rect x="2.6" y="4" width="18.8" height="16" rx="2" />
      <path d="M7 9.6 10 12l-3 2.4" />
      <path d="M12.6 15.2h5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.6 2.7 4 5.9 4 9s-1.4 6.3-4 9c-2.6-2.7-4-5.9-4-9s1.4-6.3 4-9Z" />
    </>
  ),
  key: (
    <>
      <circle cx="8.2" cy="8.2" r="4.4" />
      <path d="M11.4 11.4 20.4 20.4" />
      <path d="M16.6 16.6 19 14.2" />
    </>
  ),
  chart: (
    <>
      <path d="M3 20.6h18" />
      <path d="M6.2 20.6v-6.4" />
      <path d="M11.4 20.6V6.4" />
      <path d="M16.6 20.6v-9.6" />
    </>
  ),
  node: (
    <>
      <path d="M12 2.7 20.1 7.35v9.3L12 21.3 3.9 16.65v-9.3L12 2.7Z" />
    </>
  ),
}

/* Category → glyph. First match wins, so the order matters:
   "Backend & Infrastructure" must resolve before "Data & Infrastructure". */
const CATEGORY_RULES = [
  [/language/i,                    'code'],
  [/vision|physics/i,              'vision'],
  [/web data|web3|blockchain/i,    'globe'],
  [/auth|api/i,                    'key'],
  [/visuali[sz]ation/i,            'chart'],
  [/security|quality|testing/i,    'shield'],
  [/tool|version control/i,        'terminal'],
  [/backend/i,                     'server'],
  [/ai |ai&|ai$|sdk|agent|model/i, 'model'],
  [/data|infrastructure|storage/i, 'database'],
  [/frontend|ecosystem|desktop/i,  'layers'],
]

function glyphFor(category = '') {
  for (const [re, key] of CATEGORY_RULES) if (re.test(category)) return key
  return 'node'
}

/* Marks simple-icons does not carry, so they cannot come from icons.js:
   that file is generated and the next `npm run icons` would drop them.
   OpenAI was removed from simple-icons upstream; AI/ML API was never in
   it and has no published mark, so its glyph is drawn for the job it
   does here (one prompt fanned out to several models) rather than
   pretending to be a logo. */
const EXTRA = {
  openai: { c: '#E4E4E7', p: 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.0379-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z' },
  aimlapi: { c: '#A78BFA', p: 'M5 9.4a2.6 2.6 0 1 1 0 5.2a2.6 2.6 0 1 1 0-5.2zM7.9 11.2h3.8v1.6H7.9zM11.7 4.7h1.6v14.6h-1.6zM13.3 4.7h3.2v1.6h-3.2zM13.3 11.2h3.2v1.6h-3.2zM13.3 17.7h3.2v1.6h-3.2zM18.7 3.3a2.2 2.2 0 1 1 0 4.4a2.2 2.2 0 1 1 0-4.4zM18.7 9.8a2.2 2.2 0 1 1 0 4.4a2.2 2.2 0 1 1 0-4.4zM18.7 16.3a2.2 2.2 0 1 1 0 4.4a2.2 2.2 0 1 1 0-4.4z' },

  /* Stroked, not filled. Nothing published exists for these, so they
     are drawn for the job each one does and share the weight of the
     category glyphs rather than imitating a logo. */
  oneeurofilter: { c: '#7DD3FC', s: 'M2.5 15.5c2.4 0 2.4-7 4.8-7s2.4 7 4.8 7 2.4-7 4.8-7 2.4 7 4.6 7' },
  sounddevice: { c: '#F0ABFC', s: 'M12 3.5a2.6 2.6 0 0 1 2.6 2.6v5.4a2.6 2.6 0 0 1-5.2 0V6.1A2.6 2.6 0 0 1 12 3.5zM6.6 11a5.4 5.4 0 0 0 10.8 0M12 16.6v3.9M9 20.5h6' },
  pywin32: { c: '#7DD3FC', s: 'M3.5 5h17v14h-17zM3.5 9.2h17M6.3 7.1h.02M8.7 7.1h.02M11.1 7.1h.02' },
  ctypesuser32: { c: '#FCA5A5', s: 'M8.4 8.4h7.2v7.2H8.4zM10.4 3.5v2.9M13.6 3.5v2.9M10.4 17.6v2.9M13.6 17.6v2.9M3.5 10.4h2.9M3.5 13.6h2.9M17.6 10.4h2.9M17.6 13.6h2.9' },
  screeninfo: { c: '#93C5FD', s: 'M2.8 5.2h10.4v7.6H2.8zM6.4 16.4h3.2M8 12.8v3.6M15.2 8.4h6v10.4h-6z' },
  statemachine: { c: '#C4B5FD', s: 'M5.4 5.2a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8zM18.6 5.2a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8zM12 14.4a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8zM7.8 7.6h8.4M7 9.9l3.4 4.3M17 9.9l-3.4 4.3' },
  windows11: { c: '#7DD3FC', s: 'M3.6 4.4h7.5v7.5H3.6zM12.9 4.4h7.5v7.5h-7.5zM3.6 13.7h7.5v7.5H3.6zM12.9 13.7h7.5v7.5h-7.5z' },
  pillow: { c: '#86EFAC', s: 'M3.4 4.6h17.2v14.8H3.4zM3.4 15.2l4.8-4.8 3.6 3.6 3.2-3.2 5.6 5.6M8.2 9.2h.02' },
  tomllib: { c: '#FCD34D', s: 'M8.6 4H6.2A2.2 2.2 0 0 0 4 6.2v3.6A2.2 2.2 0 0 1 1.8 12 2.2 2.2 0 0 1 4 14.2v3.6A2.2 2.2 0 0 0 6.2 20h2.4M15.4 4h2.4A2.2 2.2 0 0 1 20 6.2v3.6A2.2 2.2 0 0 0 22.2 12 2.2 2.2 0 0 0 20 14.2v3.6a2.2 2.2 0 0 1-2.2 2.2h-2.4' },
  sha256pin: { c: '#6EE7B7', s: 'M12 2.8l7.4 3.1v5.6c0 4.6-3 8.7-7.4 10-4.4-1.3-7.4-5.4-7.4-10V5.9zM8.9 12.1l2.3 2.3 4.5-4.6' },
  vscode: { c: '#93C5FD', s: 'M8.6 7.8 4.4 12l4.2 4.2M15.4 7.8 19.6 12l-4.2 4.2M13.6 4.8l-3.2 14.4' },
  hatchling: { c: '#FDBA74', s: 'M12 2.9l8.2 4.6v9L12 21.1 3.8 16.5v-9zM3.8 7.5 12 12.1l8.2-4.6M12 12.1v9' },
  recharts: { c: '#A5B4FC', s: 'M3.6 20.4V3.6M3.6 20.4h16.8M7.6 20.4v-6.2M12 20.4V8.6M16.4 20.4v-9.4M20.4 20.4V5.4' },
  reactsimplemaps: { c: '#67E8F9', s: 'M12 2.9a7.4 7.4 0 0 1 7.4 7.4c0 5.2-7.4 10.8-7.4 10.8S4.6 15.5 4.6 10.3A7.4 7.4 0 0 1 12 2.9zM12 7.6a2.7 2.7 0 1 1 0 5.4 2.7 2.7 0 0 1 0-5.4z' },
  treesitter: { c: '#FDE68A', s: 'M12 3.2a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8zM6.2 15.6a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8zM17.8 15.6a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8zM12 8v3.6M6.2 15.6V13h11.6v2.6' },
}

/* One mark, several product names. */
const ALIAS = [
  [/^gpt[-\s.]?\d/i, 'openai'],
  [/^(chat)?gpt$/i, 'openai'],
  [/^openai/i, 'openai'],
  [/^ai\s*\/?\s*ml\s*api$/i, 'aimlapi'],
  /* Product names that carry a suffix the mark does not. */
  [/^lucide/i, 'Lucide'],
  [/^supabase/i, 'Supabase'],
  [/^codex$/i, 'openai'],
]

const flat = (v) => String(v ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')

/* Names are written for reading, keys are written for lookup: the data
   says "Tailwind CSS" and "Framer Motion" while the table is keyed
   TailwindCSS and FramerMotion. Matching on letters and digits alone
   bridges the two without a second name on every entry. */
const LOOSE = new Map(
  Object.entries(ICONS).map(([k, v]) => [flat(k), v])
)

export default function TechIcon({ name, category, size = 18 }) {
  const alias = ALIAS.find(([re]) => re.test(String(name ?? '').trim()))?.[1]
  /* An alias may point at a hand-drawn mark or at a generated one, so
     both tables are consulted before falling back to the raw name. */
  const brand =
    (alias && (EXTRA[alias] ?? ICONS[alias] ?? LOOSE.get(flat(alias)))) ??
    ICONS[name] ??
    LOOSE.get(flat(name)) ??
    EXTRA[flat(name)]

  if (brand?.s) {
    return (
      <span className="si-icon-mizu is-brand" style={{ color: brand.c }} aria-hidden="true">
        <svg
          viewBox="0 0 24 24" width={size} height={size}
          fill="none" stroke="currentColor" strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round" role="presentation"
        >
          <path d={brand.s} />
        </svg>
      </span>
    )
  }

  if (brand) {
    return (
      <span className="si-icon-mizu is-brand" style={{ color: brand.c }} aria-hidden="true">
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" role="presentation">
          <path d={brand.p} />
        </svg>
      </span>
    )
  }

  return (
    <span className="si-icon-mizu is-glyph" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        role="presentation"
      >
        {GLYPHS[glyphFor(category)]}
      </svg>
    </span>
  )
}
